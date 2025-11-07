import xlsx from 'xlsx';
import fs from 'fs';

// Get the latest uploaded file
const uploadsDir = './server/uploads/';
const files = fs.readdirSync(uploadsDir);
const latestFile = files[files.length - 1];

console.log('Latest uploaded file:', latestFile);

if (latestFile) {
  try {
    const workbook = xlsx.readFile(uploadsDir + latestFile);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    console.log('Sheet name:', sheetName);
    console.log('Total rows:', data.length);
    console.log('First row columns:', Object.keys(data[0] || {}));
    console.log('First row data:', data[0]);
    console.log('Second row data:', data[1]);
  } catch (error) {
    console.error('Error reading file:', error.message);
  }
}