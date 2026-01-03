const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

async function verifyDuplicateLogic() {
  try {
    console.log('Starting duplicate verification...');
    const uniquePhone = '90000' + Math.floor(10000 + Math.random() * 90000);

    // 1. Create first labourer
    console.log(`Creating labourer with phone ${uniquePhone}...`);
    const res1 = await axios.post(`${BASE_URL}/labour`, {
      name: 'Original Labour',
      villageName: 'Test Village',
      contactNumber: uniquePhone
    });
    console.log('First labourer created:', res1.data.success);

    // 2. Try to create duplicate
    console.log('Attempting to create duplicate...');
    try {
        await axios.post(`${BASE_URL}/labour`, {
          name: 'Duplicate Labour',
          villageName: 'Another Village',
          contactNumber: uniquePhone
        });
        console.error('FAIL: Duplicate creation succeeded (should have failed)');
    } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.message.includes('already exists')) {
            console.log('PASS: Duplicate creation failed as expected with message:', error.response.data.message);
        } else {
            console.error('FAIL: Unexpected error:', error.response ? error.response.data : error.message);
        }
    }

    console.log('Verification completed.');

  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verifyDuplicateLogic();
