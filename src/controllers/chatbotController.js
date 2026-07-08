import axios from 'axios';
import ChatbotSession from '../models/ChatbotSession.js';
import User from '../models/User.js';
import Consultation from '../models/Consultation.js';
import fs from 'fs';
import { analyzeMedicalDocument } from '../services/analysis/medicalAnalysisService.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

import { callLLM } from '../services/llmService.js';

// Generate static formatted replies directly from tool output results if Gemini fails to respond
function buildFallbackResponse(name, resultData) {
  if (!resultData.success) {
    return `I tried to process your request but encountered an error: ${resultData.error || 'unknown issue'}.`;
  }

  if (name === 'recommendSpecialist') {
    return `Based on the symptoms described, I suggest consulting a **${resultData.recommendedSpeciality}**.`;
  }

  if (name === 'searchDoctors') {
    const doctors = resultData.doctors || [];
    if (doctors.length === 0) {
      return "I couldn't find any matching doctors currently available on the platform.";
    }
    let reply = `Here are the matching specialists I found on the platform:\n\n`;
    doctors.forEach(doc => {
      reply += `- **Dr. ${doc.name}** (${doc.doctorDetails?.speciality || 'General Medicine'})\n`;
      reply += `  Experience: ${doc.doctorDetails?.experience || 0} years\n`;
      reply += `  Status: ${doc.doctorDetails?.isOnline ? '🟢 Online' : '⚪ Offline'}\n`;
      reply += `  Doctor ID for booking: \`${doc._id}\`\n\n`;
    });
    reply += `To book a digital consultation, you can say: *"Request a consultation with Dr. <Doctor ID>"*.`;
    return reply;
  }

  if (name === 'listHospitals') {
    const hospitals = resultData.hospitals || [];
    if (hospitals.length === 0) {
      return "I couldn't find any clinics or hospitals registered on the platform.";
    }
    let reply = `Here are some of our partnered clinics and hospitals:\n\n`;
    hospitals.forEach(h => {
      reply += `- **${h.name}**\n`;
      reply += `  Address: ${h.profile?.address || 'N/A'}\n`;
      if (h.hospitalDetails?.description) {
        reply += `  Description: ${h.hospitalDetails.description}\n`;
      }
      reply += `\n`;
    });
    return reply;
  }

  if (name === 'requestDigitalConsultation') {
    if (resultData.success) {
      return `Your digital consultation request has been submitted successfully! You can track its status inside the "My Consultations" portal.`;
    }
    return `I was unable to request the consultation: ${resultData.error}`;
  }

  if (name === 'getMyActiveConsultations') {
    const consultations = resultData.consultations || [];
    if (consultations.length === 0) {
      return "You do not have any active or pending digital consultations at this time.";
    }
    let reply = `Here are your current active or pending consultations:\n\n`;
    consultations.forEach(c => {
      reply += `- **Dr. ${c.doctor?.name}** (${c.doctor?.doctorDetails?.speciality || 'Specialist'})\n`;
      reply += `  Status: **${c.status.toUpperCase()}**\n`;
      reply += `  Fee: Rs. ${c.amount || 0}\n\n`;
    });
    return reply;
  }

  return "I have processed your request, but the language generation engine is temporarily unavailable. Please try again soon.";
}

// Define the system instructions for the AI receptionist
const SYSTEM_INSTRUCTION = `
You are the AI Receptionist and Health Education Assistant for the "Hamro Doctor" doctor-patient portal.
Your role is to assist patients with doctor searches, hospital locations, digital consultation requests, and to answer general health education questions.

Scope of Medical Information:
1. ALLOWED (Educational Information):
   - You CAN and SHOULD answer general health education questions directly and informatively.
   - Topics include: standard body temperature ranges, blood pressure categories, BMI meanings and ranges, wellness and nutrition guidance, general explanations of common symptoms, medical terminology definitions, vaccination schedules, public health info, first aid, and medical specialist types.
   - Example answers: Explain what normal body temperature is, what a cardiologist does, or what causes common fevers.
   - Always include a lightweight disclaimer *only* when providing educational medical info: "This information is for educational purposes and is not a substitute for professional medical advice." Do not add this disclaimer to non-medical messages (like listing clinics or booking status).

2. STRICTLY PROHIBITED (High-Risk Actions):
   - You must NOT diagnose diseases (e.g., if a user lists symptoms and asks "what disease do I have?").
   - You must NOT prescribe medications or recommend specific antibiotics or drug dosages (e.g., "should I take amoxicillin?").
   - You must NOT interpret medical reports as a diagnosis or make emergency medical decisions.
   - If a user asks for diagnosis, treatment advice, or prescriptions, clearly explain your limitations as an AI helper, encourage them to consult a healthcare professional, and suggest finding/booking a doctor via the portal.

General Guidelines:
- Be helpful, polite, and empathetic.
- When displaying doctors, display their unique ID (ObjectId) clearly so the user can use it to request a consultation.
- If a patient asks for physical appointments, clarify that they are managed directly by individual hospitals. Offer to help them initiate an online digital consultation instead.

Medical Document Context Rules (CRITICAL):
If the user prompt includes a [MedicalContext] block:
- The MedicalContext is the ABSOLUTE source of truth.
- Never infer medicine names from OCR text directly.
- Never rerun OCR reasoning or regenerate medicine extraction.
- If the answer to the user's question is not explicitly available inside the structured MedicalContext (e.g. missing dose, frequency, or duration), you must clearly state: "The uploaded prescription does not specify that information."
- Do not invent timings, dosage or duration under any circumstances.
`;

// Tool specifications (Gemini Function Calling Schema)
const chatbotTools = [
  {
    functionDeclarations: [
      {
        name: "recommendSpecialist",
        description: "Suggests the correct medical speciality based on the patient's symptoms (e.g., fever -> General Physician, chest tightness -> Cardiologist, rash -> Dermatologist).",
        parameters: {
          type: "OBJECT",
          properties: {
            symptoms: {
              type: "STRING",
              description: "A description of the patient's complaints or symptoms."
            }
          },
          required: ["symptoms"]
        }
      },
      {
        name: "searchDoctors",
        description: "Search for doctors in the system directory, optionally filtering by speciality or online status.",
        parameters: {
          type: "OBJECT",
          properties: {
            speciality: {
              type: "STRING",
              description: "The medical specialization to filter by (e.g. Cardiologist, Dermatologist, Dentist, General Physician, Neurologist)."
            },
            isOnline: {
              type: "BOOLEAN",
              description: "Filter by active doctors who are currently online."
            }
          }
        }
      },
      {
        name: "requestDigitalConsultation",
        description: "Initiates a digital consultation request with a specific doctor by their unique MongoDB ObjectId.",
        parameters: {
          type: "OBJECT",
          properties: {
            doctorId: {
              type: "STRING",
              description: "The unique MongoDB ObjectId string of the doctor."
            }
          },
          required: ["doctorId"]
        }
      },
      {
        name: "getMyActiveConsultations",
        description: "Fetch a list of active and pending digital consultations for the user.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      },
      {
        name: "listHospitals",
        description: "List the approved medical clinics and hospitals partnered with the platform.",
        parameters: {
          type: "OBJECT",
          properties: {}
        }
      }
    ]
  }
];

// Local helper to fetch and filter doctors using the fuzzy-matching logic
async function getLocalDoctors(speciality, isOnline) {
  const filter = { role: 'doctor' };
  const allDoctors = await User.find(filter)
    .select('name doctorDetails.speciality doctorDetails.isOnline doctorDetails.experience')
    .lean();

  const queryText = (speciality || '').toLowerCase();

  return allDoctors.filter(doc => {
    if (isOnline !== undefined && doc.doctorDetails?.isOnline !== isOnline) {
      return false;
    }
    if (speciality) {
      const docSpec = (doc.doctorDetails?.speciality || '').toLowerCase();
      const match = docSpec.includes(queryText) || queryText.includes(docSpec) ||
        (docSpec.length >= 4 && queryText.startsWith(docSpec.substring(0, 4))) ||
        (queryText.length >= 4 && docSpec.startsWith(queryText.substring(0, 4)));
      return match;
    }
    return true;
  }).slice(0, 5);
}

// Helper to detect if a query is a general medical knowledge / educational question
function isEducationalQuestion(message) {
  const cleanMsg = message.trim().toLowerCase();

  const eduPatterns = [
    /^what\s+is\b/,
    /^what\s+are\b/,
    /^what\s+causes\b/,
    /^how\s+does\b/,
    /^how\s+to\b/,
    /^why\s+does\b/,
    /^explain\b/,
    /^definition\s+of\b/,
    /^meaning\s+of\b/,
    /^can\s+you\s+explain\b/
  ];

  return eduPatterns.some(pattern => pattern.test(cleanMsg)) ||
    cleanMsg.includes('what is a') ||
    cleanMsg.includes('what are the') ||
    cleanMsg.includes('causes of') ||
    cleanMsg.includes('how to treat') ||
    cleanMsg.includes('tell me about') ||
    cleanMsg.includes('causes fever');
}

// Local intent classifier and rule-based symptom router to bypass Gemini API
async function handleLocalIntentAndRules(message, patientId) {
  const cleanMsg = message.trim().toLowerCase();

  // If the question is educational, bypass local search/triage rules and route to LLM for direct answer
  if (isEducationalQuestion(message)) {
    return { matched: false };
  }

  // 1. Request Consultation Intent
  if (cleanMsg.startsWith('/request_consultation') || cleanMsg.includes('request consultation') || cleanMsg.includes('consult now')) {
    // Try to find a 24-character ObjectId in the message
    const match = message.match(/[0-9a-fA-F]{24}/);
    if (match) {
      const doctorId = match[0];
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return {
          matched: true,
          reply: 'Invalid doctor ID format. Please search for the doctor first to get their valid ID.'
        };
      }

      const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
      if (!doctor) {
        return {
          matched: true,
          reply: 'Doctor not found.'
        };
      }

      const existing = await Consultation.findOne({
        patient: patientId,
        doctor: doctorId,
        status: { $in: ['pending', 'active'] }
      });

      if (existing) {
        return {
          matched: true,
          reply: `You already have an active/pending consultation with Dr. ${doctor.name}.`
        };
      }

      const consultation = await Consultation.create({
        patient: patientId,
        doctor: doctorId,
        status: 'pending'
      });

      return {
        matched: true,
        reply: `Your digital consultation request has been submitted successfully! You can track its status inside the "My Consultations" portal. (Consultation ID: ${consultation._id})`
      };
    } else {
      // If no doctor ID is provided, guide them
      return {
        matched: true,
        reply: 'To request a digital consultation, please search for available doctors first using the **Find Doctor** option and click the **Consult Now** button on their card.'
      };
    }
  }

  // 2. Search Doctors Intent
  const isSearchDocs = cleanMsg.startsWith('/doctors') ||
    cleanMsg.includes('show doctors') ||
    cleanMsg.includes('available doctors') ||
    cleanMsg.includes('find doctors') ||
    cleanMsg.includes('search doctors') ||
    cleanMsg.includes('list doctors');

  if (isSearchDocs) {
    let speciality = '';

    // Check if it's a chip URL format: /doctors?speciality=Cardiologist
    if (cleanMsg.startsWith('/doctors?speciality=')) {
      const parts = message.split('=');
      speciality = parts[1] || '';
    } else {
      // Look for specialty keywords in the query text
      const specKeywords = {
        'cardiologist': ['cardiologist', 'cardiology', 'cardio', 'heart'],
        'dermatologist': ['dermatologist', 'dermatology', 'skin', 'rash', 'acne', 'itch'],
        'neurologist': ['neurologist', 'neurology', 'neuro', 'brain', 'nerve'],
        'dentist': ['dentist', 'dental', 'tooth', 'teeth', 'gum'],
        'pediatrician': ['pediatrician', 'pediatric', 'child', 'baby', 'kid'],
        'orthopedic': ['orthopedic', 'orthopedics', 'joint', 'bone'],
        'gynecologist': ['gynecologist', 'gynecology', 'pregnant', 'pregnancy', 'women'],
        'general physician': ['general physician', 'general medicine', 'physician', 'gp']
      };

      for (const [specName, keywords] of Object.entries(specKeywords)) {
        if (keywords.some(kw => cleanMsg.includes(kw))) {
          speciality = specName;
          break;
        }
      }
    }

    const isOnline = cleanMsg.includes('online') ? true : undefined;
    const doctors = await getLocalDoctors(speciality, isOnline);

    let replyText = '';
    if (doctors.length === 0) {
      replyText = speciality
        ? `I couldn't find any matching ${speciality}s currently available on the platform.`
        : "I couldn't find any matching doctors currently available on the platform.";
    } else {
      replyText = `Here are the matching specialists I found on the platform:\n\n`;
      doctors.forEach(doc => {
        const docSpec = doc.doctorDetails?.speciality || 'Specialist';
        replyText += `- **Dr. ${doc.name}** (${docSpec})\n`;
        replyText += `  Experience: ${doc.doctorDetails?.experience || 0} years\n`;
        replyText += `  Status: ${doc.doctorDetails?.isOnline ? '🟢 Online' : '⚪ Offline'}\n`;
        replyText += `  Doctor ID for booking: \`${doc._id}\`\n\n`;
      });
      replyText += `To book a digital consultation, you can click the **Consult Now** button on their card or say: *"Request a consultation with Dr. <Doctor ID>"*.`;
    }

    return {
      matched: true,
      reply: replyText
    };
  }

  // 3. List Partner Clinics / Hospitals
  const isHospitals = cleanMsg === '/hospitals' ||
    cleanMsg.includes('hospitals') ||
    cleanMsg.includes('clinics') ||
    cleanMsg.includes('partner clinics') ||
    cleanMsg.includes('show hospitals') ||
    cleanMsg.includes('list hospitals');

  if (isHospitals) {
    const hospitals = await User.find({ role: 'hospital', 'hospitalDetails.listingRequestStatus': 'approved' })
      .select('name profile.address hospitalDetails.description')
      .limit(5)
      .lean();

    let replyText = '';
    if (hospitals.length === 0) {
      replyText = "I couldn't find any clinics or hospitals registered on the platform.";
    } else {
      replyText = `Here are some of our partnered clinics and hospitals:\n\n`;
      hospitals.forEach(h => {
        replyText += `- **${h.name}**\n`;
        replyText += `  Address: ${h.profile?.address || 'N/A'}\n`;
        if (h.hospitalDetails?.description) {
          replyText += `  Description: ${h.hospitalDetails.description}\n`;
        }
        replyText += `\n`;
      });
    }

    return {
      matched: true,
      reply: replyText
    };
  }

  // 4. Get My Consultations
  const isConsultations = cleanMsg === '/my_consultations' ||
    cleanMsg.includes('my consultations') ||
    cleanMsg.includes('consultation status') ||
    cleanMsg.includes('active consultations') ||
    cleanMsg.includes('show my consultations');

  if (isConsultations) {
    const consultations = await Consultation.find({ patient: patientId, status: { $in: ['pending', 'active'] } })
      .populate('doctor', 'name doctorDetails.speciality')
      .sort('-createdAt')
      .lean();

    let replyText = '';
    if (consultations.length === 0) {
      replyText = "You do not have any active or pending digital consultations at this time.";
    } else {
      replyText = `Here are your current active or pending consultations:\n\n`;
      consultations.forEach(c => {
        const docName = c.doctor?.name || 'Unknown Doctor';
        const docSpec = c.doctor?.doctorDetails?.speciality || 'Specialist';
        replyText += `- **Dr. ${docName}** (${docSpec})\n`;
        replyText += `  Status: **${c.status.toUpperCase()}**\n`;
        replyText += `  Fee: Rs. ${c.amount || 0}\n\n`;
      });
    }

    return {
      matched: true,
      reply: replyText
    };
  }

  // 5. Symptom Triage Rules
  const symptomRules = [
    { keywords: ['skin rash', 'rash', 'itching skin', 'itchy skin'], specialist: 'Dermatologist' },
    { keywords: ['chest pain', 'chest pressure', 'heart pain', 'heart pressure'], specialist: 'Cardiologist' },
    { keywords: ['nerve pain', 'neuropathy', 'numbness', 'paralysis'], specialist: 'Neurologist' },
    { keywords: ['child fever', 'baby fever', 'kid fever', 'toddler fever'], specialist: 'Pediatrician' },
    { keywords: ['joint pain', 'bone pain', 'knee pain', 'back pain'], specialist: 'Orthopedic' }
  ];

  for (const rule of symptomRules) {
    if (rule.keywords.some(kw => cleanMsg.includes(kw))) {
      // Find matching doctors of this specialty
      const doctors = await getLocalDoctors(rule.specialist, undefined);

      let replyText = `Based on the symptoms described, I recommend consulting a **${rule.specialist}**.\n\n`;

      if (doctors.length === 0) {
        replyText += `Currently, there are no doctors specializing in **${rule.specialist}** available online. Please check back later.`;
      } else {
        replyText += `Here are some specialists in this field on our platform:\n\n`;
        doctors.forEach(doc => {
          replyText += `- **Dr. ${doc.name}** (${doc.doctorDetails?.speciality || rule.specialist})\n`;
          replyText += `  Experience: ${doc.doctorDetails?.experience || 0} years\n`;
          replyText += `  Status: ${doc.doctorDetails?.isOnline ? '🟢 Online' : '⚪ Offline'}\n`;
          replyText += `  Doctor ID for booking: \`${doc._id}\`\n\n`;
        });
        replyText += `To book a digital consultation, you can click the **Consult Now** button on their card or say: *"Request a consultation with Dr. <Doctor ID>"*.`;
      }

      return {
        matched: true,
        reply: replyText
      };
    }
  }

  // 6. Special command handler for '/symptoms'
  if (cleanMsg === '/symptoms') {
    return {
      matched: true,
      reply: "Please describe your symptoms directly (e.g. 'fever and cough', 'nerve pain', 'skin rash'). I will suggest the correct specialist field immediately."
    };
  }

  return {
    matched: false
  };
}

export const chatWithBot = async (req, res, next) => {
  try {
    let { message, imageBase64 } = req.body;
    const patientId = req.user._id;

    if (!message && !imageBase64) {
      res.status(400);
      throw new Error('Message content or image is required');
    }

    // 1. Fetch or create chatbot session
    let session = await ChatbotSession.findOne({ patient: patientId });
    if (!session) {
      session = await ChatbotSession.create({ patient: patientId, messages: [] });
    }

    let medicalAnalysis = null;
    let isCacheHit = false;

    if (imageBase64) {
      // 1. Generate SHA-256 hash of the uploaded image
      const documentHash = crypto.createHash('sha256').update(imageBase64).digest('hex');
      console.log(`[MedicalContext] SHA-256 generated: ${documentHash.substring(0, 16)}...`);

      // 2. Cache Lookup
      if (session.medicalContext && session.medicalContext.documentHash === documentHash) {
        console.log('[MedicalContext] Cache hit');
        medicalAnalysis = session.medicalContext;
        isCacheHit = true;
      } else {
        console.log('[MedicalContext] Cache miss');
        console.log('[MedicalContext] Running Vision OCR');
        console.log('[MedicalContext] Running OpenMed');

        // Create a mock file object for analyzeMedicalDocument
        let mimeType = 'image/jpeg';
        if (imageBase64.startsWith('data:')) {
          mimeType = imageBase64.split(';')[0].split(':')[1];
        }

        const mockFile = {
          base64: imageBase64,
          mimetype: mimeType,
        };

        const analysisResult = await analyzeMedicalDocument(mockFile);
        
        medicalAnalysis = {
          documentHash,
          ocrText: analysisResult.extractedText,
          diseases: analysisResult.diseases,
          medicines: analysisResult.medicines,
          explanation: analysisResult.explanation
        };

        // Save new context to ChatbotSession
        session.medicalContext = medicalAnalysis;
        console.log('[MedicalContext] Saved to ChatbotSession');
      }
    } else if (message) {
      // Flow for text messages: Load cached MedicalContext if it exists
      if (session.medicalContext) {
        console.log('[MedicalContext] Loaded from cache');
        medicalAnalysis = session.medicalContext;
      }
    }

    let isImageOnlyCacheHit = false;

    if (imageBase64 && !message) {
      if (medicalAnalysis.explanation) {
        // Flow 2 (Cache Miss): We have the pre-generated explanation from MedicalAnalysisService
        session.messages.push({ 
          sender: 'user', 
          text: '[Uploaded Medical Document]',
          attachment: imageBase64 
        });
        session.messages.push({ sender: 'bot', text: medicalAnalysis.explanation });
        await session.save();
        return res.json({
          success: true,
          reply: medicalAnalysis.explanation,
          messages: session.messages
        });
      } else {
        // Flow 2 (Cache Hit): No cached explanation, we must generate one via LLM.
        message = "Please analyze and explain the contents of this medical document in simple terms.";
        isImageOnlyCacheHit = true;
      }
    }

    // Flow 1 & 3: We have a text message (and optionally an image)
    const userTextToSave = isImageOnlyCacheHit 
      ? '[Uploaded Medical Document]' 
      : (imageBase64 ? `${message}\n\n*(Attached Medical Document)*` : message);
    
    // 2. Append user message to logs
    session.messages.push({ 
      sender: 'user', 
      text: userTextToSave,
      attachment: imageBase64 || undefined
    });

    // Check if it matches a local intent or symptom rule to bypass Gemini API entirely
    const localResult = await handleLocalIntentAndRules(message, patientId);
    if (localResult.matched) {
      session.messages.push({ sender: 'bot', text: localResult.reply });
      await session.save();
      return res.json({
        success: true,
        reply: localResult.reply,
        messages: session.messages
      });
    }

    // 3. Build unified messages history for callLLM
    // Each message must be: { role: 'user'|'assistant', content: string, toolCalls?: array }
    const messages = session.messages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    // Flow 3: Inject medical context dynamically into the final user prompt
    if (message && medicalAnalysis) {
      const lastUserMsgIndex = messages.length - 1;
      const enrichedContent = `[MedicalContext]\nDiseases: ${JSON.stringify(medicalAnalysis.diseases)}\nMedicines: ${JSON.stringify(medicalAnalysis.medicines)}\n[End MedicalContext]\n\nMy question is: ${message}`;
      messages[lastUserMsgIndex].content = enrichedContent;
    }

    let botReplyText = '';
    try {
      // First LLM call
      const firstResult = await callLLM({
        systemInstruction: SYSTEM_INSTRUCTION,
        messages,
        tools: chatbotTools
      });

      botReplyText = firstResult.text || '';

      // Check if the LLM wants to call any tools
      if (firstResult.toolCalls && firstResult.toolCalls.length > 0) {
        const toolCalls = firstResult.toolCalls;

        // Execute the first tool call
        const call = toolCalls[0];
        const { name, args } = call;

        console.log(`\n================= [CHATBOT TOOL CALL] =================`);
        console.log(`Tool Name: ${name}`);
        console.log(`Arguments: ${JSON.stringify(args, null, 2)}`);

        let resultData = {};
        try {
          if (name === 'recommendSpecialist') {
            const query = (args.symptoms || '').toLowerCase();
            let spec = 'General Physician';
            if (query.includes('heart') || query.includes('chest') || query.includes('cardio') || query.includes('breathing')) {
              spec = 'Cardiologist';
            } else if (query.includes('skin') || query.includes('rash') || query.includes('acne') || query.includes('itch')) {
              spec = 'Dermatologist';
            } else if (query.includes('child') || query.includes('baby') || query.includes('pediatric') || query.includes('kid')) {
              spec = 'Pediatrician';
            } else if (query.includes('tooth') || query.includes('teeth') || query.includes('dental') || query.includes('gum')) {
              spec = 'Dentist';
            } else if (query.includes('pregnancy') || query.includes('pregnant') || query.includes('gyne') || query.includes('women')) {
              spec = 'Gynecologist';
            } else if (query.includes('eye') || query.includes('vision') || query.includes('glass')) {
              spec = 'Ophthalmologist';
            } else if (query.includes('nerve') || query.includes('brain') || query.includes('neuro') || query.includes('numbness') || query.includes('paralysis')) {
              spec = 'Neurologist';
            }
            console.log(`Triage query: "${query}" -> Recommended Speciality: "${spec}"`);
            resultData = { success: true, recommendedSpeciality: spec };
          } else if (name === 'searchDoctors') {
            const filter = { role: 'doctor' };
            console.log(`MongoDB Filter Base: ${JSON.stringify(filter)}`);

            const allDoctors = await User.find(filter)
              .select('name doctorDetails.speciality doctorDetails.isOnline doctorDetails.experience')
              .lean();

            const queryText = (args.speciality || '').toLowerCase();
            const queryOnline = args.isOnline;

            const doctors = allDoctors.filter(doc => {
              if (queryOnline !== undefined && doc.doctorDetails?.isOnline !== queryOnline) {
                return false;
              }
              if (args.speciality) {
                const docSpec = (doc.doctorDetails?.speciality || '').toLowerCase();
                const match = docSpec.includes(queryText) || queryText.includes(docSpec) ||
                  (docSpec.length >= 4 && queryText.startsWith(docSpec.substring(0, 4))) ||
                  (queryText.length >= 4 && docSpec.startsWith(queryText.substring(0, 4)));
                return match;
              }
              return true;
            }).slice(0, 5);

            console.log(`Fuzzy Speciality Matching: "${queryText}" -> Found: ${doctors.length} doctors`);
            doctors.forEach(d => console.log(`- Dr. ${d.name} (${d.doctorDetails?.speciality})`));

            resultData = { success: true, doctors };
          } else if (name === 'listHospitals') {
            const filter = { role: 'hospital', 'hospitalDetails.listingRequestStatus': 'approved' };
            console.log(`MongoDB Filter: ${JSON.stringify(filter)}`);

            const hospitals = await User.find(filter)
              .select('name profile.address hospitalDetails.description')
              .limit(5)
              .lean();

            console.log(`Query Result Count: ${hospitals.length}`);
            resultData = { success: true, hospitals };
          } else if (name === 'requestDigitalConsultation') {
            const doctorId = args.doctorId;
            console.log(`Validating doctorId: ${doctorId}`);

            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
              resultData = { success: false, error: 'Invalid doctor ID format. Please search for the doctor first to get their valid ID.' };
              console.log(`Validation failed: doctorId is not a valid ObjectId`);
            } else {
              const filter = { _id: doctorId, role: 'doctor' };
              console.log(`MongoDB Filter: ${JSON.stringify(filter)}`);
              const doctor = await User.findOne(filter);

              if (!doctor) {
                resultData = { success: false, error: 'Doctor not found.' };
                console.log(`Doctor lookup result: Not Found`);
              } else {
                const existing = await Consultation.findOne({
                  patient: patientId,
                  doctor: doctorId,
                  status: { $in: ['pending', 'active'] }
                });

                if (existing) {
                  resultData = { success: false, error: `You already have an active/pending consultation with Dr. ${doctor.name}.` };
                  console.log(`Consultation check: Existing pending/active consultation found.`);
                } else {
                  const consultation = await Consultation.create({
                    patient: patientId,
                    doctor: doctorId,
                    status: 'pending'
                  });
                  resultData = {
                    success: true,
                    message: `Consultation request sent successfully to Dr. ${doctor.name}!`,
                    consultationId: consultation._id
                  };
                  console.log(`Consultation successfully created: ${consultation._id}`);
                }
              }
            }
          } else if (name === 'getMyActiveConsultations') {
            const filter = { patient: patientId, status: { $in: ['pending', 'active'] } };
            console.log(`MongoDB Filter: ${JSON.stringify(filter)}`);

            const consultations = await Consultation.find(filter)
              .populate('doctor', 'name doctorDetails.speciality')
              .sort('-createdAt')
              .lean();

            console.log(`Query Result Count: ${consultations.length}`);
            resultData = { success: true, consultations };
          }
        } catch (err) {
          console.error(`\n!!! [CHATBOT TOOL EXECUTOR EXCEPTION] !!!`);
          console.error(`Tool Name: ${name}`);
          console.error(err.stack || err);
          resultData = { success: false, error: err.message };
        }

        console.log(`Final Tool Response Data: ${JSON.stringify(resultData, null, 2)}`);
        console.log(`=======================================================\n`);

        // Append tool call and result to the unified messages list for the second round request
        messages.push({
          role: 'assistant',
          content: botReplyText || '',
          toolCalls: toolCalls
        });
        messages.push({
          role: 'tool',
          name: name,
          content: resultData
        });

        try {
          // Second LLM call to compile tool results back to final answer
          const secondResult = await callLLM({
            systemInstruction: SYSTEM_INSTRUCTION,
            messages,
            tools: chatbotTools
          });
          botReplyText = secondResult.text || 'I processed your request successfully but could not compose a reply text. How else can I help?';
        } catch (err) {
          console.warn(`[Chatbot] Second LLM request failed after tool execution. Using fallback response. Error: ${err.message}`);
          // Compile local fallback from the tool result
          botReplyText = buildFallbackResponse(name, resultData);
        }
      }
    } catch (err) {
      console.error('[Chatbot] Unified LLM request failed entirely:', err.message);
      botReplyText = "The AI Assistant is currently experiencing high demand. Please try again in a few moments!";
    }

    // 5. Save bot response to history and return
    session.messages.push({ sender: 'bot', text: botReplyText });
    await session.save();

    res.json({
      success: true,
      reply: botReplyText,
      messages: session.messages
    });

  } catch (error) {
    console.error('[Chatbot] Unexpected chat API failure:', error);
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    let session = await ChatbotSession.findOne({ patient: patientId });

    res.json({
      success: true,
      messages: session ? session.messages : []
    });
  } catch (error) {
    next(error);
  }
};

export const saveChatMessage = async (req, res, next) => {
  try {
    const { userMessage, botReply } = req.body;
    const patientId = req.user._id;

    let session = await ChatbotSession.findOne({ patient: patientId });
    if (!session) {
      session = await ChatbotSession.create({ patient: patientId, messages: [] });
    }

    if (userMessage) {
      session.messages.push({ sender: 'user', text: userMessage });
    }
    if (botReply) {
      session.messages.push({ sender: 'bot', text: botReply });
    }

    await session.save();

    res.json({
      success: true,
      messages: session.messages
    });
  } catch (error) {
    next(error);
  }
};
