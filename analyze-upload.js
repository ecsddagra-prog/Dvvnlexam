import xlsx from 'xlsx';
import fs from 'fs';

// Get the most recent uploaded file
const uploadsDir = './server/uploads/';
const files = fs.readdirSync(uploadsDir);
const mostRecent = files[files.length - 1];
const filePath = uploadsDir + mostRecent;

console.log('Analyzing file:', mostRecent);

try {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  console.log('Sheet name:', sheetName);
  
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  
  console.log('Total rows:', data.length);
  console.log('First 3 rows:');
  data.slice(0, 3).forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row);
    console.log('Keys:', Object.keys(row));
  });
  
  // Check for common column variations
  const firstRow = data[0] || {};
  const keys = Object.keys(firstRow);
  console.log('\nAll column headers:', keys);
  
  // Look for employee ID variations
  const empIdKeys = keys.filter(key => 
    key.toLowerCase().includes('employee') || 
    key.toLowerCase().includes('personnel') ||
    key.toLowerCase().includes('emp')
  );
  console.log('Employee ID candidates:', empIdKeys);
  
  // Look for name variations
  const nameKeys = keys.filter(key => 
    key.toLowerCase().includes('name')
  );
  console.log('Name candidates:', nameKeys);
  
} catch (error) {
  console.error('Error reading file:', error.message);
}