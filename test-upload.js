import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

const API_URL = 'http://localhost:3003'; // Adjust if different

async function testUpload() {
  try {
    // Get the most recent uploaded file
    const uploadsDir = './server/uploads/';
    const files = fs.readdirSync(uploadsDir);
    const mostRecent = files[files.length - 1];
    const filePath = uploadsDir + mostRecent;
    
    console.log('Testing upload with file:', mostRecent);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Test the upload endpoint
    const response = await axios.post(`${API_URL}/api/admin/upload-employees`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need a valid token
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testUpload();