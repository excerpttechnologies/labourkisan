const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  // Personal Details
  personalDetails: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'other'],
      lowercase: true
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    villageName: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    }
  },

  // Employment Details
  employmentDetails: {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required']
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: ['full-time', 'contract'],
      lowercase: true
    },
    reportingManager: {
      type: String,
      required: [true, 'Reporting manager is required'],
      trim: true
    }
  },

  // Identity & Compliance (KYC)
  identityAndCompliance: {
    aadhaarNumber: {
      type: String,
      required: [true, 'Aadhaar number is required'],
      unique: true,
      match: [/^[0-9]{12}$/, 'Please enter a valid 12-digit Aadhaar number']
    },
    panNumber: {
      type: String,
      required: [true, 'PAN number is required'],
      unique: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
    },
    passportNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      lowercase: true
    }
  },

  // Banking Details
  bankingDetails: {
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      match: [/^[0-9]{9,18}$/, 'Please enter a valid account number']
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required'],
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
employeeSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

// Create indexes for better query performance
// employeeSchema.index({ 'personalDetails.email': 1 }); // Already indexed via unique: true
// employeeSchema.index({ 'personalDetails.mobileNumber': 1 }); // Already indexed via unique: true
// employeeSchema.index({ 'employmentDetails.employeeId': 1 }); // Already indexed via unique: true
// employeeSchema.index({ 'identityAndCompliance.aadhaarNumber': 1 }); // Already indexed via unique: true
// employeeSchema.index({ 'identityAndCompliance.panNumber': 1 }); // Already indexed via unique: true
employeeSchema.index({ 'employmentDetails.department': 1 });

module.exports = mongoose.model('Employee', employeeSchema);

