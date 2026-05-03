import User from '../models/User.js';

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.profile) {
        user.profile = { ...user.profile, ...req.body.profile };
        
        // Calculate BMI if height and weight are provided
        if (req.body.profile.bmi?.height && req.body.profile.bmi?.weight) {
          const heightInMeters = req.body.profile.bmi.height / 100;
          const bmiValue = req.body.profile.bmi.weight / (heightInMeters * heightInMeters);
          user.profile.bmi.value = parseFloat(bmiValue.toFixed(2));
          user.profile.bmi.lastUpdated = Date.now();
        }
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: updatedUser,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get BMI metrics
// @route   GET /api/v1/users/bmi
// @access  Private
export const getBMI = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('profile.bmi');
    res.json({
      success: true,
      bmi: user.profile.bmi,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors
// @route   GET /api/v1/users/doctors
// @access  Public
export const getDoctors = async (req, res, next) => {
  try {
    const { speciality, isOnline } = req.query;
    const filter = { role: 'doctor' };

    if (speciality) {
      filter['doctorDetails.speciality'] = speciality;
    }

    if (isOnline) {
      filter['doctorDetails.isOnline'] = isOnline === 'true';
    }

    console.log('Fetching doctors with filter:', filter);
    const doctors = await User.find(filter)
      .select('name username profile.avatar doctorDetails.speciality doctorDetails.nmcNumber doctorDetails.isOnline doctorDetails.experience');

    console.log('Doctors found in DB:', doctors.length);

    res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

