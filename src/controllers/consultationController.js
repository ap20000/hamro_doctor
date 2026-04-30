import Consultation from '../models/Consultation.js';

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
    const endTime = new Date(startTime.getTime() + 15 * 60000); // 15 mins

    consultation.sessions.push({
      startTime,
      endTime,
      type,
      durationInMinutes: 15,
    });

    await consultation.save();

    res.json({
      success: true,
      session: {
        startTime,
        endTime,
        type,
      },
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
    const query = req.user.role === 'patient' 
      ? { patient: req.user._id } 
      : { doctor: req.user._id };

    const consultations = await Consultation.find(query)
      .populate('patient', 'name profile')
      .populate('doctor', 'name doctorDetails');

    res.json({
      success: true,
      consultations,
    });
  } catch (error) {
    next(error);
  }
};
