const Employee = require('../models/Employee');

/**
 * Register a new employee
 */
exports.registerEmployee = async (req, res, next) => {
  try {
    const {
      personalDetails,
      employmentDetails,
      identityAndCompliance,
      bankingDetails
    } = req.body;

    // Validate required fields
    if (!personalDetails || !employmentDetails || !identityAndCompliance || !bankingDetails) {
      return res.status(400).json({
        success: false,
        message: 'All field groups are required: personalDetails, employmentDetails, identityAndCompliance, bankingDetails'
      });
    }

    // Check if employee with same email already exists
    const existingEmployeeByEmail = await Employee.findOne({
      'personalDetails.email': personalDetails.email
    });

    if (existingEmployeeByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Check if employee with same mobile number already exists
    const existingEmployeeByMobile = await Employee.findOne({
      'personalDetails.mobileNumber': personalDetails.mobileNumber
    });

    if (existingEmployeeByMobile) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this mobile number already exists'
      });
    }

    // Check if employee ID already exists
    const existingEmployeeById = await Employee.findOne({
      'employmentDetails.employeeId': employmentDetails.employeeId
    });

    if (existingEmployeeById) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this employee ID already exists'
      });
    }

    // Create new employee
    const newEmployee = new Employee({
      personalDetails,
      employmentDetails,
      identityAndCompliance,
      bankingDetails
    });

    const savedEmployee = await newEmployee.save();

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: savedEmployee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all employees with pagination and filtering
 */
exports.getAllEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query for filtering
    const query = {};
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    if (req.query.department) {
      query['employmentDetails.department'] = req.query.department;
    }

    if (req.query.employmentType) {
      query['employmentDetails.employmentType'] = req.query.employmentType;
    }

    if (req.query.verificationStatus) {
      query['identityAndCompliance.verificationStatus'] = req.query.verificationStatus;
    }

    // Search by name or employee ID
    if (req.query.search) {
      query.$or = [
        { 'personalDetails.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'personalDetails.lastName': { $regex: req.query.search, $options: 'i' } },
        { 'employmentDetails.employeeId': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(query);

    res.status(200).json({
      success: true,
      count: employees.length,
      total: total,
      page: page,
      totalPages: Math.ceil(total / limit),
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get employee by ID
 */
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get employee by employee ID
 */
exports.getEmployeeByEmployeeId = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({
      'employmentDetails.employeeId': req.params.employeeId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update employee
 */
exports.updateEmployee = async (req, res, next) => {
  try {
    const {
      personalDetails,
      employmentDetails,
      identityAndCompliance,
      bankingDetails,
      isActive
    } = req.body;

    const updateData = {};

    if (personalDetails) updateData.personalDetails = personalDetails;
    if (employmentDetails) updateData.employmentDetails = employmentDetails;
    if (identityAndCompliance) updateData.identityAndCompliance = identityAndCompliance;
    if (bankingDetails) updateData.bankingDetails = bankingDetails;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Prevent updating employeeId if it already exists
    if (employmentDetails && employmentDetails.employeeId) {
      const existingEmployee = await Employee.findOne({
        'employmentDetails.employeeId': employmentDetails.employeeId,
        _id: { $ne: req.params.id }
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete employee (soft delete)
 */
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete employee
 */
exports.permanentlyDeleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Employee permanently deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get employee statistics
 */
exports.getEmployeeStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments({ isActive: true });
    
    const employeesByDepartment = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$employmentDetails.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const employeesByEmploymentType = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$employmentDetails.employmentType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const employeesByVerificationStatus = await Employee.aggregate([
      {
        $group: {
          _id: '$identityAndCompliance.verificationStatus',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        employeesByDepartment,
        employeesByEmploymentType,
        employeesByVerificationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

