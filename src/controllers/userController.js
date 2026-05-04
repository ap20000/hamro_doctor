import User from '../models/User.js';
import sharp from 'sharp';

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

      if (user.role === 'doctor' && req.body.doctorDetails) {
        user.doctorDetails = { ...user.doctorDetails, ...req.body.doctorDetails };
      }

      // Use findByIdAndUpdate to bypass validation of unrelated fields (like username) 
      // which might be missing in legacy user records
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { 
          name: user.name,
          email: user.email,
          profile: user.profile,
          doctorDetails: user.doctorDetails
        },
        { new: true, runValidators: true }
      );

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

// @desc    Update avatar with compression
// @route   POST /api/v1/users/avatar
// @access  Private
export const updateAvatar = async (req, res, next) => {
  try {
    const { image } = req.body; // Expecting Base64 string
    if (!image) {
      res.status(400);
      throw new Error('No image provided');
    }

    // Extract the Base64 data (remove the prefix like "data:image/jpeg;base64,")
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Compress and resize using sharp
    const compressedBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' }) // Square avatar
      .jpeg({ quality: 80 }) // Compress to 80% quality JPEG
      .toBuffer();

    const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

    // Use findByIdAndUpdate instead of save() to avoid triggering validation 
    // on required fields that aren't being modified (like username)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.avatar': compressedBase64 },
      { new: true }
    );

    res.json({
      success: true,
      avatar: compressedBase64,
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    next(error);
  }
};
