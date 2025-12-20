const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Labour name is required'],
    trim: true
  },
  villageName: {
    type: String,
    required: [true, 'Village name is required'],
    trim: true,
    index: true
  },
  contactNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  workTypes: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    trim: true
  },
  availability: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
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
labourSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

// Create indexes for better query performance
labourSchema.index({ villageName: 1 });
labourSchema.index({ name: 1 });
labourSchema.index({ isActive: 1 });

module.exports = mongoose.model('Labour', labourSchema);

