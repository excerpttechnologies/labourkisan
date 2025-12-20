const express = require('express');
const router = express.Router();
const labourController = require('../controllers/labourController');

// Get all villages (must come before /:id)
router.get('/villages', labourController.getVillages);

// Seed sample data (for testing - must come before /:id)
router.post('/seed', labourController.seedLabourData);

// Get farmer assignments (must come before /:id)
router.get('/farmer/:farmerId/assignments', labourController.getFarmerAssignments);

// Create a new labourer
router.post('/', labourController.createLabourer);

// Get all labourers (with optional village filter)
router.get('/', labourController.getAllLabourers);

// Confirm attendance (must come before /:id)
router.post('/attendance/:assignmentId', labourController.confirmAttendance);

// Get assignment by ID
router.get('/attendance/:id', labourController.getAssignmentById);

// Assign labourer to farmer
router.post('/:labourId/assign', labourController.assignLabour);

// Get labourer by ID (must be last)
router.get('/:id', labourController.getLabourerById);

module.exports = router;

