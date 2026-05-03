import User from '../models/User.js';
import Medicine from '../models/Medicine.js';

// @desc    Get pharmaceutical dashboard stats
// @route   GET /api/v1/pharmaceutical/dashboard
// @access  Private (Pharmaceutical)
export const getPharmaDashboard = async (req, res, next) => {
  try {
    const pharmaId = req.user._id;

    const [
      medicineCount,
      pharma
    ] = await Promise.all([
      Medicine.countDocuments({ pharmaceutical: pharmaId }),
      User.findById(pharmaId).select('pharmaceuticalDetails')
    ]);

    res.json({
      success: true,
      stats: {
        totalMedicineBrands: medicineCount,
        ...pharma.pharmaceuticalDetails.stats
      },
      subscription: {
        isSubscribed: pharma.pharmaceuticalDetails.isSubscribed,
        expiry: pharma.pharmaceuticalDetails.subscriptionExpiry
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/Update medicine
// @route   POST /api/v1/pharmaceutical/medicines
// @access  Private (Pharmaceutical)
export const manageMedicine = async (req, res, next) => {
  try {
    const { id, ...medicineData } = req.body;
    let medicine;

    if (id) {
      medicine = await Medicine.findOneAndUpdate(
        { _id: id, pharmaceutical: req.user._id },
        medicineData,
        { new: true }
      );
    } else {
      medicine = await Medicine.create({
        ...medicineData,
        pharmaceutical: req.user._id
      });
    }

    res.json({
      success: true,
      medicine
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all medicines of pharmaceutical
// @route   GET /api/v1/pharmaceutical/medicines
// @access  Private (Pharmaceutical)
export const getMyMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ pharmaceutical: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medicines.length,
      medicines
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Boost pharmaceutical profile
// @route   POST /api/v1/pharmaceutical/boost
// @access  Private (Pharmaceutical)
export const boostPharma = async (req, res, next) => {
  try {
    // Placeholder for payment logic
    const pharma = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'pharmaceuticalDetails.isBoosted': true,
        'pharmaceuticalDetails.boostExpiry': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Pharmaceutical profile boosted for 30 days',
      boostExpiry: pharma.pharmaceuticalDetails.boostExpiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Renew Subscription
// @route   POST /api/v1/pharmaceutical/subscribe
// @access  Private (Pharmaceutical)
export const subscribe = async (req, res, next) => {
  try {
    // Placeholder for payment gateway integration (e.g., eSewa/Khalti)
    const pharma = await User.findByIdAndUpdate(
      req.user._id,
      { 
        'pharmaceuticalDetails.isSubscribed': true,
        'pharmaceuticalDetails.subscriptionExpiry': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 Year
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription activated successfully for 1 year',
      subscriptionExpiry: pharma.pharmaceuticalDetails.subscriptionExpiry
    });
  } catch (error) {
    next(error);
  }
};
