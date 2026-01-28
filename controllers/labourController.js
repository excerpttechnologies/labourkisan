const Labour = require('../models/Labour');
const LabourAssignment = require('../models/LabourAssignment');

/**
 * Create a new labourer
 */
exports.createLabourer = async (req, res, next) => {
  try {
    const { name, villageName, contactNumber, email, workTypes, experience, availability, address, state, district, taluku } = req.body;

    // Validate required fields
    if (!name || !villageName) {
      return res.status(400).json({
        success: false,
        message: 'Name and village name are required'
      });
    }

    // Check for duplicates (Contact Number or Email)
    const duplicateQuery = [];
    if (contactNumber) duplicateQuery.push({ contactNumber });
    if (email) duplicateQuery.push({ email });

    if (duplicateQuery.length > 0) {
      const existingLabourer = await Labour.findOne({
        $or: duplicateQuery,
        isActive: true
      });

      if (existingLabourer) {
        return res.status(400).json({
          success: false,
          message: 'This labour already exists (Duplicate mobile or email)'
        });
      }
    }

    const newLabourer = new Labour({
      name,
      villageName,
      contactNumber,
      email,
      workTypes: workTypes || [],
      experience,
      availability,
      address,
      state,
      district,
      taluku,
      isActive: true
    });

    const savedLabourer = await newLabourer.save();

    res.status(201).json({
      success: true,
      message: 'Labourer created successfully',
      data: savedLabourer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all labourers (can be filtered by village)
 */
exports.getAllLabourers = async (req, res, next) => {
  try {
    const { villageName, search } = req.query;
    const query = { isActive: true };

    if (villageName) {
      query.villageName = { $regex: villageName, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { villageName: { $regex: search, $options: 'i' } },
        { workTypes: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const labourers = await Labour.find(query).sort({ name: 1 });

    // Aggregate attendance statistics
    const attendanceStats = await LabourAssignment.aggregate([
      {
        $group: {
          _id: '$labourId',
          present: {
            $sum: {
              $cond: [{ $eq: ['$attendance.status', 'present'] }, 1, 0]
            }
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ['$attendance.status', 'absent'] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$attendance.status', 'pending'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Create a map of labourId -> stats
    const statsMap = {};
    attendanceStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        present: stat.present,
        absent: stat.absent,
        pending: stat.pending
      };
    });

    // Fetch today's assignments to get attendance status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const assignmentsToday = await LabourAssignment.find({
      assignmentDate: { $gte: startOfDay, $lte: endOfDay }
    });

    // Create a map of labourId -> today's attendance status
    const todayAttendanceMap = {};
    assignmentsToday.forEach(assignment => {
      // Check specific attendance status first, fallback to overall assignment status
      if (assignment.attendance && assignment.attendance.status && assignment.attendance.status !== 'pending') {
        todayAttendanceMap[assignment.labourId.toString()] = assignment.attendance.status;
      } else {
        todayAttendanceMap[assignment.labourId.toString()] = 'pending';
      }
    });

    // Attach status to labourers
    const labourersWithAttendance = labourers.map(labour => {
      const stats = statsMap[labour._id.toString()] || { present: 0, absent: 0, pending: 0 };
      return {
        ...labour.toObject(),
        attendanceSummary: stats,
        todayAttendance: todayAttendanceMap[labour._id.toString()] || null
      };
    });

    res.status(200).json({
      success: true,
      count: labourersWithAttendance.length,
      data: labourersWithAttendance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get labourer by ID
 */
exports.getLabourerById = async (req, res, next) => {
  try {
    const labourer = await Labour.findById(req.params.id);

    if (!labourer) {
      return res.status(404).json({
        success: false,
        message: 'Labourer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: labourer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all unique villages
 */
exports.getVillages = async (req, res, next) => {
  try {
    const villages = await Labour.distinct('villageName', { isActive: true });
    const sortedVillages = villages.sort();

    res.status(200).json({
      success: true,
      count: sortedVillages.length,
      data: sortedVillages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign labourer to farmer
 */
exports.assignLabour = async (req, res, next) => {
  try {
    const { labourId } = req.params;
    const { farmerId, assignmentDate, notes } = req.body;

    if (!farmerId) {
      return res.status(400).json({
        success: false,
        message: 'Farmer ID is required'
      });
    }

    // Check if labourer exists
    const labourer = await Labour.findById(labourId);
    if (!labourer) {
      return res.status(404).json({
        success: false,
        message: 'Labourer not found'
      });
    }

    // Create assignment
    const assignment = new LabourAssignment({
      labourId,
      farmerId,
      assignmentDate: assignmentDate || new Date(),
      notes: notes || '',
      status: 'assigned'
    });

    const savedAssignment = await assignment.save();

    res.status(201).json({
      success: true,
      message: 'Labourer assigned successfully',
      data: {
        assignmentId: savedAssignment._id,
        labourId: savedAssignment.labourId,
        farmerId: savedAssignment.farmerId,
        assignmentDate: savedAssignment.assignmentDate,
        status: savedAssignment.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm attendance
 */
exports.confirmAttendance = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { status, date, time, notes } = req.body;

    if (!status || !['present', 'absent'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid attendance status (present/absent) is required'
      });
    }

    // Find assignment
    const assignment = await LabourAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if labourer exists (although populated, we need to be sure)
    // We already found assignment, no need to re-check labourer existence unless critical

    // Capture previous status BEFORE updating
    const previousStatus = assignment.attendance && assignment.attendance.status ? assignment.attendance.status : 'pending';
    const newStatus = status.toLowerCase();

    // Update attendance
    assignment.attendance = {
      status: newStatus,
      date: date ? new Date(date) : new Date(),
      time: time || new Date().toTimeString().slice(0, 5),
      notes: notes || '',
      confirmedAt: new Date()
    };

    // Update assignment status
    assignment.status = 'confirmed';

    // Handle totalPresentDays count update
    // Only update if status has changed
    if (previousStatus !== newStatus) {
      let incrementBy = 0;
      
      // If changing TO present
      if (newStatus === 'present') {
        incrementBy = 1;
      }
      // If changing FROM present (to absent or anything else)
      else if (previousStatus === 'present') {
        incrementBy = -1;
      }
      
      if (incrementBy !== 0) {
        await Labour.findByIdAndUpdate(assignment.labourId, {
          $inc: { totalPresentDays: incrementBy }
        });
      }
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Attendance confirmed successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignments by farmer ID
 */
exports.getFarmerAssignments = async (req, res, next) => {
  try {
    const { farmerId } = req.params;

    const assignments = await LabourAssignment.find({ farmerId })
      .populate('labourId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assignment by ID
 */
exports.getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await LabourAssignment.findById(id).populate('labourId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};


