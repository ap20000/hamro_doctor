import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    username: {
      type: String,
      unique: true,
      required: [true, 'Please add a username'],
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
      enum: ['patient', 'doctor', 'hospital', 'pharmaceutical', 'surgical', 'admin', 'nurse'],
      required: true,
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
      salutation: {
        type: String,
        enum: ['Dr.', 'Prof. Dr.', 'Assoc. Prof. Dr.', 'Asst. Prof. Dr.']
      },
      firstName: String,
      lastName: String,
      speciality: String,
      specialization: [String], // Array for multiple
      qualification: String,
      nmcNumber: String, // NMC / NAMC / NHPC
      experience: Number, // Years Practiced
      website: String,
      bio: String,
      signature: String, // Path to signature image
      councilDocument: String, // URL to uploaded council doc
      isApproved: {
        type: Boolean,
        default: false,
      },
      isOnline: {
        type: Boolean,
        default: false,
      },
      publicProfile: {
        education: [{
          degree: String,
          institute: String,
          year: Number
        }],
        awards: [String],
        research: [String],
        memberships: [String],
        activities: [String],
      },
      hospitals: [{
        name: String,
        address: String,
        opdTime: [{
          day: {
            type: String,
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          },
          startTime: String,
          endTime: String
        }]
      }],
      stats: {
        totalPageViews: { type: Number, default: 0 },
        articleViews: { type: Number, default: 0 },
        recommendations: { type: Number, default: 0 },
      }
    },
    // Hospital specific fields
    hospitalDetails: {
      description: String,
      listingRequestStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      doctors: [{
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        opdRate: Number,
        availability: [{
          day: String,
          slots: [String]
        }]
      }],
      healthPackages: [{
        name: String,
        description: String,
        price: Number,
        features: [String]
      }],
      stats: {
        totalViews: { type: Number, default: 0 },
        recommendations: { type: Number, default: 0 },
      }
    },
    // Pharmaceutical specific fields
    pharmaceuticalDetails: {
      description: String,
      isSubscribed: { type: Boolean, default: false },
      subscriptionExpiry: Date,
      isBoosted: { type: Boolean, default: false },
      boostExpiry: Date,
      stats: {
        totalViews: { type: Number, default: 0 },
        medicineViews: { type: Number, default: 0 },
      }
    },
    // Surgical specific fields
    surgicalDetails: {
      description: String,
      isSubscribed: { type: Boolean, default: false },
      subscriptionExpiry: Date,
      isBoosted: { type: Boolean, default: false },
      boostExpiry: Date,
      stats: {
        totalViews: { type: Number, default: 0 },
        productViews: { type: Number, default: 0 },
      }
    },
    googleId: String,
    facebookId: String,
    associatedHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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
