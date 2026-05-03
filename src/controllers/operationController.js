import { Coupon, BloodDonor, BloodRequest } from '../models/Operations.js';
import Consultation from '../models/Consultation.js';

// --- Coupon Management ---
export const manageCoupon = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let coupon;
    if (id) {
      coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
    } else {
      coupon = await Coupon.create(data);
    }
    res.json({ success: true, coupon });
  } catch (error) { next(error); }
};

// --- Blood Donor Management ---
export const manageBloodDonor = async (req, res, next) => {
  try {
    const { id, ...data } = req.body;
    let donor;
    if (id) {
      donor = await BloodDonor.findByIdAndUpdate(id, data, { new: true });
    } else {
      donor = await BloodDonor.create(data);
    }
    res.json({ success: true, donor });
  } catch (error) { next(error); }
};

// --- Consultation Operations ---
export const assignConsultation = async (req, res, next) => {
  try {
    const { consultationId, doctorId } = req.body;
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { doctor: doctorId, status: 'active' },
      { new: true }
    );
    res.json({ success: true, consultation });
  } catch (error) { next(error); }
};
