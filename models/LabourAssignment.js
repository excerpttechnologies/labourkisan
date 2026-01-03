const mongoose = require('mongoose');

const labourAssignmentSchema = new mongoose.Schema({
  labourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Labour',
    required: [true, 'Labour ID is required'],
    index: true
  },
  farmerId: {
    type: String,
    required: [true, 'Farmer ID is required'],
    index: true
  },
  assignmentDate: {
    type: Date,
    required: [true, 'Assignment date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['assigned', 'confirmed', 'completed', 'cancelled'],
    default: 'assigned',
    lowercase: true
  },
  attendance: {
    status: {
      type: String,
      enum: ['present', 'absent', 'pending'],
      default: 'pending',
      lowercase: true
    },
    date: {
      type: Date
    },
    time: {
      type: String
    },
    notes: {
      type: String,
      trim: true
    },
    confirmedAt: {
      type: Date
    }
  },
  notes: {
    type: String,
    trim: true
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
labourAssignmentSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

// Create indexes
labourAssignmentSchema.index({ labourId: 1, farmerId: 1 });
// labourAssignmentSchema.index({ farmerId: 1 }); // Already indexed via index: true
labourAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('LabourAssignment', labourAssignmentSchema);

