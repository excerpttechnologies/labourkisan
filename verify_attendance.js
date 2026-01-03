const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function verifyAttendancelogic() {
  try {
    console.log('Starting verification...');

    // 1. Create a dummy labourer
    console.log('Creating labourer...');
    const labourRes = await axios.post(`${BASE_URL}/labour`, {
      name: 'Test Labour ' + Date.now(),
      villageName: 'Test Village',
      contactNumber: '1234567890'
    });
    const labourId = labourRes.data.data._id;
    console.log('Labourer created:', labourId);

    // Verify initial count
    if (labourRes.data.data.totalPresentDays !== 0) {
        console.error('FAIL: Initial totalPresentDays is not 0');
    } else {
        console.log('PASS: Initial totalPresentDays is 0');
    }

    // 2. Assign labourer
    console.log('Assigning labourer...');
    const assignRes = await axios.post(`${BASE_URL}/labour/${labourId}/assign`, {
      farmerId: 'test_farmer_1',
      assignmentDate: new Date()
    });
    const assignmentId = assignRes.data.data.assignmentId;
    console.log('Assignment created:', assignmentId);

    // 3. Confirm as PRESENT
    console.log('Confirming attendance as PRESENT...');
    await axios.post(`${BASE_URL}/labour/attendance/${assignmentId}`, {
      status: 'present'
    });
    
    // Check count
    let checkRes = await axios.get(`${BASE_URL}/labour/${labourId}`);
    if (checkRes.data.data.totalPresentDays === 1) {
        console.log('PASS: totalPresentDays incremented to 1');
    } else {
        console.error('FAIL: totalPresentDays is ' + checkRes.data.data.totalPresentDays + ', expected 1');
    }

    // 4. Change to ABSENT
    console.log('Changing attendance to ABSENT...');
    await axios.post(`${BASE_URL}/labour/attendance/${assignmentId}`, {
      status: 'absent'
    });

    // Check count
    checkRes = await axios.get(`${BASE_URL}/labour/${labourId}`);
    if (checkRes.data.data.totalPresentDays === 0) {
        console.log('PASS: totalPresentDays decremented to 0');
    } else {
        console.error('FAIL: totalPresentDays is ' + checkRes.data.data.totalPresentDays + ', expected 0');
    }

    console.log('Verification completed.');

  } catch (error) {
    console.error('Verification failed:', error.response ? error.response.data : error.message);
  }
}

verifyAttendancelogic();
