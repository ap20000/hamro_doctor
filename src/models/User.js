import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    phone: {
      type: String,
      unique: true,
      required: [true, 'Please add a phone number'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: String,
      expireAt: Date,
    },
    profile: {
      avatar: String,
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
      },
      dob: Date,
      address: String,
      bmi: {
        height: Number, // in cm
        weight: Number, // in kg
        value: Number,
        lastUpdated: Date,
      },
    },
    // Doctor specific fields
    doctorDetails: {
      specialization: String,
      qualification: String,
      nmcNumber: String,
      experience: Number,
      bio: String,
      signature: String, // Path to signature image
      isApproved: {
        type: Boolean,
        default: false,
      },
    },
    googleId: String,
    facebookId: String,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
