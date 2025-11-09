// Date formatting utilities for IST timezone

/**
 * Format date in IST timezone with full date and time
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string in IST
 */
export const formatDateIST = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format date in IST timezone with only date (no time)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string in IST
 */
export const formatDateOnlyIST = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time in IST timezone with only time (no date)
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted time string in IST
 */
export const formatTimeIST = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Get current date/time in IST
 * @returns {Date} Current date in IST
 */
export const getCurrentIST = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

/**
 * Convert IST date to UTC for backend
 * @param {string|Date} dateString - Date in IST
 * @returns {string} ISO string in UTC
 */
export const convertISTtoUTC = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString();
};

/**
 * Convert UTC date to datetime-local format in IST
 * For use with <input type="datetime-local">
 * @param {string|Date} dateString - Date in UTC
 * @returns {string} Format: YYYY-MM-DDTHH:mm (in IST)
 */
export const toDateTimeLocalIST = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Get IST time components
  const istString = date.toLocaleString('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  // Format: YYYY-MM-DD, HH:mm:ss -> YYYY-MM-DDTHH:mm
  const [datePart, timePart] = istString.split(', ');
  const timeWithoutSeconds = timePart.substring(0, 5);
  return `${datePart}T${timeWithoutSeconds}`;
};

/**
 * Convert datetime-local value (IST) to UTC ISO string for backend
 * @param {string} datetimeLocal - Format: YYYY-MM-DDTHH:mm (in IST)
 * @returns {string} ISO string in UTC
 */
export const fromDateTimeLocalIST = (datetimeLocal) => {
  if (!datetimeLocal) return null;
  
  // Parse as IST time
  const [datePart, timePart] = datetimeLocal.split('T');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  
  // Create date string in IST format
  const istDateString = `${year}-${month}-${day}T${hour}:${minute}:00+05:30`;
  
  // Convert to UTC
  const date = new Date(istDateString);
  return date.toISOString();
};
