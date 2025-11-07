import xlsx from 'xlsx';

// Check the uploaded file structure
const filePath = './server/uploads/'; // Check what files are there

console.log('Checking Excel file structure...');

// You need to put the actual file path here
// For now, let's create a test to see what columns are expected

const testData = [
  { 'Employee ID': 'EMP001', 'Name': 'John Doe', 'Department': 'IT' },
  { 'EmployeeID': 'EMP002', 'Name': 'Jane Smith', 'Department': 'HR' }
];

console.log('Test data structure:');
testData.forEach((row, index) => {
  console.log(`Row ${index + 1}:`, Object.keys(row));
  console.log('Values:', row);
});