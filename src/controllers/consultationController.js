import Consultation from '../models/Consultation.js';

// @desc    Request consultation
// @route   POST /api/v1/consultations/request
// @access  Private (Patient)
export const requestConsultation = async (req, res, next) => {
  try {
    const { doctorId } = req.body;

    // Check if there's already a pending or active consultation with this doctor
    const existing = await Consultation.findOne({
      patient: req.user._id,
      doctor: doctorId,
      status: { $in: ['pending', 'active'] }
    });

    if (existing) {
      res.status(400);
      throw new Error('You already have an ongoing or pending consultation request with this doctor');
    }

    const consultation = await Consultation.create({
      patient: req.user._id,
      doctor: doctorId,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      consultation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start consultation (after payment)
// @route   POST /api/v1/consultations/start
// @access  Private (Patient)
export const startConsultation = async (req, res, next) => {
  try {
    const { doctorId, amount } = req.body;

    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 7); // 7 days access

    const consultation = await Consultation.create({
      patient: req.user._id,
      doctor: doctorId,
      amount,
      paymentStatus: 'paid', // Assuming payment is handled by a separate module
      status: 'active',
      consultationStart: start,
      consultationEnd: end,
    });

    res.status(201).json({
      success: true,
      consultation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start call session (15 mins)
// @route   POST /api/v1/consultations/:id/session
// @access  Private
export const startCallSession = async (req, res, next) => {
  try {
    const { type } = req.body; // audio or video
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    // Check if within 7-day window
    if (new Date() > consultation.consultationEnd) {
      res.status(400);
      throw new Error('Consultation access has expired (7-day window over)');
    }

    const startTime = new Date();
    // Initially set endTime to 15 mins later as a fallback
    const endTime = new Date(startTime.getTime() + 15 * 60000); 

    consultation.sessions.push({
      startTime,
      endTime,
      type,
      durationInMinutes: 15,
    });

    await consultation.save();
    
    // Return the session ID so frontend can update it later
    const session = consultation.sessions[consultation.sessions.length - 1];

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finish call session (Update actual end time)
// @route   PATCH /api/v1/consultations/:id/session/:sessionId/finish
// @access  Private
export const finishCallSession = async (req, res, next) => {
  try {
    const { id, sessionId } = req.params;
    const consultation = await Consultation.findById(id);

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    const session = consultation.sessions.id(sessionId);
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }

    session.endTime = new Date();
    const diffMs = session.endTime - session.startTime;
    session.durationInSeconds = Math.floor(diffMs / 1000);
    session.durationInMinutes = Math.ceil(diffMs / 60000);

    await consultation.save();

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultation history
// @route   GET /api/v1/consultations
// @access  Private
export const getMyConsultations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = req.user.role === 'patient' 
      ? { patient: req.user._id } 
      : { doctor: req.user._id };

    if (status) {
      query.status = status;
    }

    // Auto-complete expired consultations
    const now = new Date();
    await Consultation.updateMany(
      { 
        ...query, 
        status: 'active', 
        consultationEnd: { $lt: now } 
      },
      { $set: { status: 'completed' } }
    );

    const consultations = await Consultation.find(query)
      .populate('patient', 'name profile')
      .populate('doctor', 'name doctorDetails profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete consultation manually
// @route   PATCH /api/v1/consultations/:id/complete
// @access  Private (Doctor)
export const completeConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    if (consultation.doctor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to complete this consultation');
    }

    consultation.status = 'completed';
    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation marked as completed',
      consultation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single consultation by ID
// @route   GET /api/v1/consultations/:id
// @access  Private
export const getConsultationById = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'name profile')
      .populate('doctor', 'name doctorDetails profile');

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    // Check authorization
    if (
      consultation.patient?._id.toString() !== req.user._id.toString() &&
      consultation.doctor?._id.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error('Not authorized to access this consultation');
    }

    res.json({
      success: true,
      consultation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to consultation request (Accept/Reject)
// @route   PATCH /api/v1/consultations/:id/respond
// @access  Private (Doctor)
export const respondToConsultation = async (req, res, next) => {
  try {
    const { status } = req.body; // active or cancelled
    if (!['active', 'cancelled'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status. Use active to accept or cancelled to reject.');
    }

    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      res.status(404);
      throw new Error('Consultation not found');
    }

    if (consultation.doctor.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to respond to this request');
    }

    if (consultation.status !== 'pending') {
      res.status(400);
      throw new Error('Consultation is not in pending state');
    }

    consultation.status = status;
    
    if (status === 'active') {
      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 7); // 7 days access
      consultation.consultationStart = start;
      consultation.consultationEnd = end;
    }

    await consultation.save();

    res.json({
      success: true,
      message: `Consultation ${status === 'active' ? 'accepted' : 'rejected'}`,
      consultation,
    });
  } catch (error) {
    next(error);
  }
};
