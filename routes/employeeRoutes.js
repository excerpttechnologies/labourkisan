const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Register a new employee
router.post('/', employeeController.registerEmployee);

// Get all employees with pagination and filtering
router.get('/', employeeController.getAllEmployees);

// Get employee statistics
router.get('/stats', employeeController.getEmployeeStats);

// Get employee by employeeId (must come before /:id to avoid route conflicts)
router.get('/by-employee-id/:employeeId', employeeController.getEmployeeByEmployeeId);

// Get employee by MongoDB _id
router.get('/:id', employeeController.getEmployeeById);

// Update employee
router.put('/:id', employeeController.updateEmployee);

// Soft delete employee (deactivate)
router.delete('/:id', employeeController.deleteEmployee);

// Permanently delete employee
router.delete('/:id/permanent', employeeController.permanentlyDeleteEmployee);

module.exports = router;

