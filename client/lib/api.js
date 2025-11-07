import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = async (employeeId, password) => {
  const { data } = await axios.post(`${API_URL}/auth/login`, { employeeId, password });
  return data;
};

export const resetPassword = async (employeeId, oldPassword, newPassword) => {
  const { data } = await axios.post(`${API_URL}/auth/reset-password`, {
    employeeId,
    oldPassword,
    newPassword,
  });
  return data;
};

export const uploadEmployees = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/admin/upload-employees', formData);
  return data;
};

export const uploadQuestions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/admin/upload-questions', formData);
  return data;
};

export const createExam = async (examData) => {
  const { data } = await api.post('/admin/exams', examData);
  return data;
};

export const getExams = async () => {
  const { data } = await api.get('/admin/exams');
  return data;
};

export const assignExam = async (examId, employeeIds) => {
  const { data } = await api.post(`/admin/exams/${examId}/assign`, { employeeIds });
  return data;
};

export const getPendingQuestions = async () => {
  const { data } = await api.get('/admin/questions/pending');
  return data;
};

export const approveQuestion = async (id) => {
  const { data } = await api.patch(`/admin/questions/${id}/approve`);
  return data;
};

export const rejectQuestion = async (id) => {
  const { data } = await api.patch(`/admin/questions/${id}/reject`);
  return data;
};

export const getExamResults = async (examId) => {
  const { data } = await api.get(`/admin/results/${examId}`);
  return data;
};

export const getEmployees = async () => {
  const { data } = await api.get('/admin/employees');
  return data;
};

export const resetEmployeePassword = async (employeeId) => {
  const { data } = await api.post(`/admin/reset-password/${employeeId}`);
  return data;
};

export const addQuestion = async (questionData) => {
  const { data } = await api.post('/contributor/questions', questionData);
  return data;
};

export const getMyQuestions = async () => {
  const { data } = await api.get('/contributor/questions');
  return data;
};

export const getMyExams = async () => {
  const { data } = await api.get('/employee/exams');
  return data;
};

export const getMyResults = async () => {
  const { data } = await api.get('/employee/results');
  return data;
};

export const startExam = async (examId) => {
  const { data } = await api.post(`/exam/${examId}/start`);
  return data;
};

export const submitExam = async (examId, answers, totalTime, submittedAt, clientScore, clientPercentage) => {
  const { data } = await api.post(`/exam/${examId}/submit`, {
    answers,
    totalTime,
    submittedAt,
    clientScore,
    clientPercentage
  });
  return data;
};

// Mesari API functions
export const getMesariEmployees = async () => {
  const { data } = await api.get('/mesari/employees');
  return data;
};

export const syncMesariEmployees = async () => {
  const { data } = await api.post('/mesari/sync-employees');
  return data;
};

export const getMesariTrainingModules = async () => {
  const { data } = await api.get('/mesari/training-modules');
  return data;
};

export const submitResultsToMesari = async (examId, employeeId, score, completedAt) => {
  const { data } = await api.post('/mesari/submit-results', {
    examId,
    employeeId,
    score,
    completedAt
  });
  return data;
};

// Enhanced exam functions
export const getExamSession = async (examId) => {
  const { data } = await api.get(`/exam/${examId}/session`);
  return data;
};

export const autosaveAnswers = async (examId, answers) => {
  const { data } = await api.post(`/exam/${examId}/autosave`, { answers });
  return data;
};

// Admin functions
export const assignQuestionsToExam = async (examId, questionIds) => {
  const { data } = await api.post(`/admin/exams/${examId}/questions`, { questionIds });
  return data;
};

export const getApprovedQuestions = async (subject, difficulty) => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (difficulty) params.append('difficulty', difficulty);
  
  const { data } = await api.get(`/admin/questions/approved?${params}`);
  return data;
};

export const getAdminAnalytics = async () => {
  const { data } = await api.get('/admin/analytics/dashboard');
  return data;
};

// Contributor functions
export const bulkUploadQuestions = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/contributor/questions/bulk', formData);
  return data;
};

export const updateQuestion = async (id, questionData) => {
  const { data } = await api.put(`/contributor/questions/${id}`, questionData);
  return data;
};

export const deleteQuestion = async (id) => {
  const { data } = await api.delete(`/contributor/questions/${id}`);
  return data;
};

export const getContributorStats = async () => {
  const { data } = await api.get('/contributor/stats');
  return data;
};

// Employee functions
export const getEmployeeDashboard = async () => {
  const { data } = await api.get('/employee/dashboard');
  return data;
};

export const getExamResult = async (examId) => {
  const { data } = await api.get(`/employee/results/${examId}`);
  return data;
};
