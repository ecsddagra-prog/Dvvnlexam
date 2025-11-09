const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3002/api/auth/login', {
      employeeId: 'ADMIN001',
      password: 'Admin@123'
    });
    console.log('✅ Login Success:', response.data);
  } catch (error) {
    console.log('❌ Login Failed:', error.response?.data || error.message);
  }
}

testLogin();
