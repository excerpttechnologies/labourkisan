const Labour = require('../models/Labour');
const LabourAssignment = require('../models/LabourAssignment');

/**
 * Create a new labourer
 */
exports.createLabourer = async (req, res, next) => {
  try {
    const { name, villageName, contactNumber, email, workTypes, experience, availability, address } = req.body;

    // Validate required fields
    if (!name || !villageName) {
      return res.status(400).json({
        success: false,
        message: 'Name and village name are required'
      });
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

    // Fetch today's assignments to get attendance status
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const assignmentsToday = await LabourAssignment.find({
      assignmentDate: { $gte: startOfDay, $lte: endOfDay }
    });

    // Create a map of labourId -> attendance status
    const attendanceMap = {};
    assignmentsToday.forEach(assignment => {
      // Check specific attendance status first, fallback to overall assignment status
      if (assignment.attendance && assignment.attendance.status && assignment.attendance.status !== 'pending') {
        attendanceMap[assignment.labourId.toString()] = assignment.attendance.status;
      } else {
        attendanceMap[assignment.labourId.toString()] = 'pending';
      }
    });

    // Attach status to labourers
    const labourersWithAttendance = labourers.map(labour => ({
      ...labour.toObject(),
      todayAttendance: attendanceMap[labour._id.toString()] || null
    }));

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

    // Update attendance
    assignment.attendance = {
      status: status.toLowerCase(),
      date: date ? new Date(date) : new Date(),
      time: time || new Date().toTimeString().slice(0, 5),
      notes: notes || '',
      confirmedAt: new Date()
    };

    // Update assignment status
    assignment.status = 'confirmed';
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

/**
 * Seed sample labour data (for testing)
 */
exports.seedLabourData = async (req, res, next) => {
  try {
    // Check if data already exists
    const existingCount = await Labour.countDocuments();
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Labour data already exists. Use POST /labour to add individual labourers.'
      });
    }

    const sampleLabourers = [
      {
        name: 'Ramesh Kumar',
        villageName: 'Village A',
        contactNumber: '9876543210',
        email: 'ramesh@example.com',
        workTypes: ['Plowing', 'Harvesting', 'Sowing'],
        experience: '10 years of experience in agriculture',
        availability: 'Available Monday to Saturday',
        address: 'Village A, Block B, District C',
        isActive: true
      },
      {
        name: 'Suresh Singh',
        villageName: 'Village A',
        contactNumber: '9876543211',
        workTypes: ['Weeding', 'Irrigation', 'Fertilizer Application'],
        experience: '7 years',
        availability: 'Available all week',
        address: 'Village A, Block B, District C',
        isActive: true
      },
      {
        name: 'Amit Patel',
        villageName: 'Village B',
        contactNumber: '9876543212',
        email: 'amit@example.com',
        workTypes: ['Harvesting', 'Plowing'],
        experience: '5 years in agricultural work',
        availability: 'Available Monday to Friday',
        address: 'Village B, Block A, District C',
        isActive: true
      },
      {
        name: 'Rajesh Verma',
        villageName: 'Village B',
        contactNumber: '9876543213',
        workTypes: ['Sowing', 'Weeding', 'Plowing'],
        experience: '8 years',
        availability: 'Available all week',
        address: 'Village B, Block A, District C',
        isActive: true
      },
      {
        name: 'Mohan Das',
        villageName: 'Village C',
        contactNumber: '9876543214',
        email: 'mohan@example.com',
        workTypes: ['Harvesting', 'Irrigation'],
        experience: '12 years of farming experience',
        availability: 'Available Monday to Saturday',
        address: 'Village C, Block C, District C',
        isActive: true
      },
      {
        name: 'Vikram Singh',
        villageName: 'Village C',
        contactNumber: '9876543215',
        workTypes: ['Plowing', 'Sowing', 'Fertilizer Application'],
        experience: '6 years',
        availability: 'Available all week',
        address: 'Village C, Block C, District C',
        isActive: true
      }
    ];

    const createdLabourers = await Labour.insertMany(sampleLabourers);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdLabourers.length} sample labourers`,
      count: createdLabourers.length,
      data: createdLabourers
    });
  } catch (error) {
    next(error);
  }
};

