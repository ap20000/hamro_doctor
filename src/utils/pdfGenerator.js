import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePrescriptionPDF = async (prescription, doctor, patient) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const filename = `prescription_${prescription._id}.pdf`;
      const filePath = path.join('src/uploads', filename);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('HAMRO DOCTOR', { align: 'center' });
      doc.fontSize(10).text('Online Healthcare Service Provider, Nepal', { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Doctor & Patient Info
      doc.fontSize(12).text(`Doctor: ${doctor.name}`, { continued: true }).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.text(`Specialization: ${doctor.doctorDetails?.specialization || 'General Physician'}`);
      doc.moveDown();
      doc.text(`Patient: ${patient.name}`);
      doc.text(`Age/Gender: ${patient.profile?.gender || 'N/A'}`);
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).text('Diagnosis:', { underline: true });
      doc.fontSize(12).text(prescription.diagnosis || 'N/A');
      doc.moveDown();

      // Medicines
      doc.fontSize(14).text('Medicines:', { underline: true });
      prescription.medicines.forEach((med, index) => {
        doc.fontSize(12).text(`${index + 1}. ${med.name} - ${med.dosage} (${med.frequency}) for ${med.duration}`);
        doc.fontSize(10).text(`   Instruction: ${med.instruction}`, { indent: 20 });
      });
      doc.moveDown();

      // Advice
      doc.fontSize(14).text('Advice:', { underline: true });
      doc.fontSize(12).text(prescription.advice || 'N/A');
      doc.moveDown(2);

      // Signature
      if (doctor.doctorDetails?.signature) {
        // In production, this would be an image path
        doc.text('Digitally Signed by:', { align: 'right' });
        doc.fontSize(16).text(doctor.name, { align: 'right', oblique: true });
      } else {
        doc.text('Signature: _________________', { align: 'right' });
      }

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
};
