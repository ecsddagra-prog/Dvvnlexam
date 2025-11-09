'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  uploadEmployees,
  uploadQuestions,
  createExam,
  getExams,
  updateExam,
  deleteExam,
  assignExam,
  getPendingQuestions,
  approveQuestion,
  rejectQuestion,
  getExamResults,
  getEmployees,
  resetEmployeePassword,
  updateEmployeeRole,
  getApprovedQuestions,
  assignQuestionsToExam,
  getAdminAnalytics,
  uploadCertificateLogo,
  uploadCertificateSignature,
} from '@/lib/api';
import { formatDateIST } from '@/lib/dateUtils';
import Head from 'next/head';

export default function AdminDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState({ analytics: false });
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || user.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAuthenticated(true);
    loadAnalytics();
  }, [router]);

  // Auto-clear feedback messages after 5 seconds
  useEffect(() => {
    if (feedback.error || feedback.success) {
      const timer = setTimeout(() => {
        setFeedback({ error: '', success: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const loadAnalytics = async () => {
    setLoading((prev) => ({ ...prev, analytics: true }));
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };



  const menuItems = [
    { id: 'create-exam', title: 'Create Exam', icon: '📝', description: 'Create new examination' },
    { id: 'assign-questions', title: 'Assign Questions to Exam', icon: '🔗', description: 'Link questions to exams' },
    { id: 'assign-exam', title: 'Assign Exam to Employees', icon: '📋', description: 'Assign exams to employees' },
    { id: 'exam-results', title: 'View Results', icon: '📊', description: 'View examination results' },
    { id: 'reexam-requests', title: 'Reexam Requests', icon: '🔄', description: 'Manage reexam requests' },
    { id: 'upload-employees', title: 'Upload Employees', icon: '👥', description: 'Bulk upload employees via Excel/CSV' },
    { id: 'employee-management', title: 'Employee Management', icon: '⚙️', description: 'Manage employee accounts' },
    { id: 'certificate-settings', title: 'Certificate Settings', icon: '🏆', description: 'Customize certificate appearance and content' },
    { id: 'admin-profile', title: 'Admin Profile', icon: '👤', description: 'View and manage admin profile' },
    { id: 'pending-questions', title: 'Pending Questions', icon: '⏳', description: 'Review pending questions' },
    { id: 'upload-questions', title: 'Upload Questions', icon: '❓', description: 'Bulk upload questions via Excel/CSV' },
    { id: 'manage-exams', title: 'Manage Exams', icon: '✏️', description: 'Edit exam details before start time' }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Component definitions
  const UploadEmployeesPage = ({ setFeedback }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        const result = await uploadEmployees(file);
        let message = result.message;
        if (result.skipped) message += ` (${result.skipped})`;
        setFeedback({ success: message });
        setFile(null);
      } catch (err) {
        let errorMsg = err.response?.data?.error || 'Upload failed.';
        if (err.response?.data?.skipped) errorMsg += ` (${err.response.data.skipped})`;
        setFeedback({ error: errorMsg });
      } finally {
        setLoading(false);
      }
    };

    const downloadSample = () => {
      const sampleData = [
        ['Employee Id', 'Employee Name', 'Email', 'Mobile', 'Department', 'DefaultPassword'],
        ['EMP001', 'Rajesh Kumar', 'rajesh@company.com', '9876543210', 'IT Department', 'Dvvnl@123'],
        ['EMP002', 'Priya Sharma', 'priya@company.com', '9876543211', 'HR Department', 'Dvvnl@123']
      ];
      const csv = sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload Employees'}
            </button>
            <button
              type="button"
              onClick={downloadSample}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Download Sample
            </button>
          </div>
        </form>
    </div>
  );
};

  const UploadQuestionsPage = ({ setFeedback }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async (e) => {
      e.preventDefault();
      if (!file) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        const result = await uploadQuestions(file);
        setFeedback({ success: result.message });
        setFile(null);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Question upload failed.' });
      } finally {
        setLoading(false);
      }
    };

    const downloadSample = () => {
      const sampleData = [
        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Subject', 'Difficulty'],
        ['What is 2+2?', '3', '4', '5', '6', 'B', 'Mathematics', 'easy'],
        ['Capital of India?', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'B', 'General Knowledge', 'medium']
      ];
      const csv = sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_sample.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-3 border border-gray-300 rounded-lg"
              disabled={loading}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg disabled:bg-purple-400 hover:bg-purple-700"
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload Questions'}
            </button>
            <button
              type="button"
              onClick={downloadSample}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Download Sample
            </button>
          </div>
        </form>
      </div>
    );
  };

  const CreateExamPage = ({ setFeedback }) => {
    const [examForm, setExamForm] = useState({
      title: '', description: '', duration: 60, passingScore: 50,
      totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: ''
    });
    const [loading, setLoading] = useState(false);

    const calculateEndTime = (startTime, duration) => {
      if (!startTime || !duration) return '';
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const minutes = String(end.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        // Convert datetime-local value to UTC before sending to server
        const examData = {
          ...examForm,
          startTime: examForm.startTime ? new Date(examForm.startTime).toISOString() : null,
          endTime: examForm.endTime ? new Date(examForm.endTime).toISOString() : null
        };
        await createExam(examData);
        setFeedback({ success: 'Exam created successfully!' });
        setExamForm({ title: '', description: '', duration: 60, passingScore: 50, totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: '' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Exam creation failed.' });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
            <input
              type="text"
              placeholder="Enter exam title"
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Enter exam description"
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              className="w-full p-3 border rounded-lg h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={examForm.duration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 60;
                  const newEndTime = calculateEndTime(examForm.startTime, newDuration);
                  setExamForm({ ...examForm, duration: newDuration, endTime: newEndTime });
                }}
                className="w-full p-3 border rounded-lg"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                value={examForm.passingScore}
                onChange={(e) => setExamForm({ ...examForm, passingScore: parseInt(e.target.value) || 50 })}
                className="w-full p-3 border rounded-lg"
                min="1" max="100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={examForm.startTime}
                onChange={(e) => {
                  const newStartTime = e.target.value;
                  const newEndTime = calculateEndTime(newStartTime, examForm.duration);
                  setExamForm({ ...examForm, startTime: newStartTime, endTime: newEndTime });
                }}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Auto-calculated)</label>
              <input
                type="datetime-local"
                value={examForm.endTime}
                className="w-full p-3 border rounded-lg bg-gray-100"
                disabled readOnly
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg disabled:bg-green-400 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </form>
      </div>
    );
  };

  const AssignQuestionsPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [selectedMajorSubject, setSelectedMajorSubject] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');
    const [selectedLot, setSelectedLot] = useState('');

    useEffect(() => {
      loadExams();
      loadQuestions();
    }, []);

    useEffect(() => {
      filterQuestions();
    }, [questions, searchTerm, selectedSubject, selectedDifficulty, selectedMajorSubject, selectedLevel, selectedLot]);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadQuestions = async () => {
      try {
        const data = await getApprovedQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load questions:', err);
      }
    };

    const filterQuestions = () => {
      let filtered = questions;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(q =>
          q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by subject
      if (selectedSubject) {
        filtered = filtered.filter(q => q.subject === selectedSubject);
      }

      // Filter by difficulty
      if (selectedDifficulty) {
        filtered = filtered.filter(q => q.difficulty === selectedDifficulty);
      }

      // Filter by major subject
      if (selectedMajorSubject) {
        filtered = filtered.filter(q => q.major_subject === selectedMajorSubject);
      }

      // Filter by level
      if (selectedLevel) {
        filtered = filtered.filter(q => q.level === selectedLevel);
      }

      // Filter by lot
      if (selectedLot) {
        filtered = filtered.filter(q => q.lot === selectedLot);
      }

      setFilteredQuestions(filtered);
    };

    const handleAssign = async () => {
      if (!selectedExam || selectedQuestions.length === 0) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        await assignQuestionsToExam(selectedExam, selectedQuestions);
        setFeedback({ success: 'Questions assigned successfully!' });
        setSelectedQuestions([]);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to assign questions.' });
      } finally {
        setLoading(false);
      }
    };

    const handleSelectAll = () => {
      const allQuestionIds = filteredQuestions.map(q => q.id);
      setSelectedQuestions(allQuestionIds);
    };

    const handleUnselectAll = () => {
      setSelectedQuestions([]);
    };

    const handleQuestionToggle = (questionId) => {
      if (selectedQuestions.includes(questionId)) {
        setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
      } else {
        setSelectedQuestions([...selectedQuestions, questionId]);
      }
    };

    // Get unique subjects and difficulties for filter dropdowns
    const subjects = [...new Set(questions.map(q => q.subject))].sort();
    const difficulties = [...new Set(questions.map(q => q.difficulty))].sort();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Major Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major Subject</label>
                <select
                  value={selectedMajorSubject}
                  onChange={(e) => setSelectedMajorSubject(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Major Subjects</option>
                  {[...new Set(questions.map(q => q.major_subject).filter(Boolean))].sort().map((majorSubject) => (
                    <option key={majorSubject} value={majorSubject}>{majorSubject}</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Levels</option>
                  {[...new Set(questions.map(q => q.level).filter(Boolean))].sort().map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Difficulties</option>
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lot Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lot</label>
                <select
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Lots</option>
                  {[...new Set(questions.map(q => q.lot).filter(Boolean))].sort().map((lot) => (
                    <option key={lot} value={lot}>{lot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredQuestions.length} of {questions.length} questions
              {selectedMajorSubject && ` • Major Subject: ${selectedMajorSubject}`}
              {selectedSubject && ` • Subject: ${selectedSubject}`}
              {selectedLevel && ` • Level: ${selectedLevel}`}
              {selectedDifficulty && ` • Difficulty: ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}`}
              {selectedLot && ` • Lot: ${selectedLot}`}
            </div>
          </div>

          {/* Question Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Questions ({selectedQuestions.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                  disabled={filteredQuestions.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={handleUnselectAll}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                  disabled={selectedQuestions.length === 0}
                >
                  Unselect All
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {filteredQuestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {questions.length === 0 ? 'Loading questions...' : 'No questions match your filters.'}
                </p>
              ) : (
                filteredQuestions.map((q) => (
                  <label key={q.id} className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(q.id)}
                      onChange={() => handleQuestionToggle(q.id)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">{q.question_text}</p>
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {q.subject}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Assign Button */}
          <button
            onClick={handleAssign}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
            disabled={!selectedExam || selectedQuestions.length === 0 || loading}
          >
            {loading ? 'Assigning...' : `Assign ${selectedQuestions.length} Question${selectedQuestions.length !== 1 ? 's' : ''} to Exam`}
          </button>
        </div>
      </div>
    );
  };

  const AssignExamPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedPostingLocation, setSelectedPostingLocation] = useState('');
    const [personnelNumbers, setPersonnelNumbers] = useState('');

    useEffect(() => {
      loadExams();
      loadEmployees();
    }, []);

    useEffect(() => {
      filterEmployees();
    }, [employees, searchTerm, selectedDesignation, selectedClass, selectedPostingLocation, personnelNumbers]);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadEmployees = async () => {
      try {
        const data = await getEmployees();
        setEmployees(data.filter(u => u.role === 'employee'));
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    const filterEmployees = () => {
      let filtered = employees;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(emp =>
          emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by designation (employee_group)
      if (selectedDesignation) {
        filtered = filtered.filter(emp => emp.employee_group === selectedDesignation);
      }

      // Filter by class (personnel_area)
      if (selectedClass) {
        filtered = filtered.filter(emp => emp.personnel_area === selectedClass);
      }

      // Filter by posting location (discom)
      if (selectedPostingLocation) {
        filtered = filtered.filter(emp => emp.discom === selectedPostingLocation);
      }

      // Filter by personnel numbers (comma-separated)
      if (personnelNumbers.trim()) {
        const numbers = personnelNumbers.split(',').map(num => num.trim().toLowerCase());
        filtered = filtered.filter(emp =>
          numbers.some(num => emp.personnel_number?.toLowerCase().includes(num))
        );
      }

      setFilteredEmployees(filtered);
    };

    const handleAssign = async () => {
      if (!selectedExam || selectedEmployees.length === 0) return;
      setLoading(true);
      setFeedback({ error: '', success: '' });
      try {
        await assignExam(selectedExam, selectedEmployees);
        setFeedback({ success: `Exam assigned to ${selectedEmployees.length} employees!` });
        setSelectedEmployees([]);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to assign exam.' });
      } finally {
        setLoading(false);
      }
    };

    const handleSelectAll = () => {
      const allEmployeeIds = filteredEmployees.map(emp => emp.id);
      setSelectedEmployees(allEmployeeIds);
    };

    const handleUnselectAll = () => {
      setSelectedEmployees([]);
    };

    const handleEmployeeToggle = (employeeId) => {
      if (selectedEmployees.includes(employeeId)) {
        setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
      } else {
        setSelectedEmployees([...selectedEmployees, employeeId]);
      }
    };

    // Get unique values for filter dropdowns
    const designations = [...new Set(employees.map(emp => emp.employee_group).filter(Boolean))].sort();
    const classes = [...new Set(employees.map(emp => emp.personnel_area).filter(Boolean))].sort();
    const postingLocations = [...new Set(employees.map(emp => emp.discom).filter(Boolean))].sort();

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-6">
          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full p-3 border rounded-lg"
            >
              <option value="">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>

          {/* Filters */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Employees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {/* Personnel Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personnel Numbers</label>
                <input
                  type="text"
                  placeholder="Comma-separated numbers..."
                  value={personnelNumbers}
                  onChange={(e) => setPersonnelNumbers(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 12345, 67890, 11111</p>
              </div>

              {/* Designation Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                <select
                  value={selectedDesignation}
                  onChange={(e) => setSelectedDesignation(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Designations</option>
                  {designations.map((designation) => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Posting Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Posting Location</label>
                <select
                  value={selectedPostingLocation}
                  onChange={(e) => setSelectedPostingLocation(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">All Locations</option>
                  {postingLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredEmployees.length} of {employees.length} employees
              {selectedDesignation && ` • Designation: ${selectedDesignation}`}
              {selectedClass && ` • Class: ${selectedClass}`}
              {selectedPostingLocation && ` • Location: ${selectedPostingLocation}`}
              {personnelNumbers.trim() && ` • Personnel Numbers: ${personnelNumbers}`}
            </div>
          </div>

          {/* Employee Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Employees ({selectedEmployees.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400"
                  disabled={filteredEmployees.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={handleUnselectAll}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400"
                  disabled={selectedEmployees.length === 0}
                >
                  Unselect All
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {filteredEmployees.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {employees.length === 0 ? 'Loading employees...' : 'No employees match your filters.'}
                </p>
              ) : (
                filteredEmployees.map((emp) => (
                  <label key={emp.id} className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.id)}
                      onChange={() => handleEmployeeToggle(emp.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{emp.name}</p>
                          <p className="text-sm text-gray-500">{emp.email} | {emp.employee_id}</p>
                          <div className="flex gap-2 text-xs mt-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {emp.employee_group || 'N/A'}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              {emp.personnel_area || 'N/A'}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {emp.discom || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {emp.personnel_number && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            PN: {emp.personnel_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Assign Button */}
          <button
            onClick={handleAssign}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg disabled:bg-green-400 hover:bg-green-700"
            disabled={!selectedExam || selectedEmployees.length === 0 || loading}
          >
            {loading ? 'Assigning...' : `Assign Exam to ${selectedEmployees.length} Employee${selectedEmployees.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    );
  };

  const EmployeeManagementPage = ({ setFeedback }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
      loadEmployees();
    }, []);

    const loadEmployees = async () => {
      setLoading(true);
      try {
        const data = await getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleResetPassword = async (employeeId) => {
      if (!confirm('Reset password for this employee?')) return;
      try {
        await resetEmployeePassword(employeeId);
        setFeedback({ success: 'Password reset successfully!' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to reset password.' });
      }
    };

    const handleRoleChange = async (userId, newRole) => {
      if (!confirm(`Change role to ${newRole}?`)) return;
      try {
        await updateEmployeeRole(userId, newRole);
        setFeedback({ success: `Role updated to ${newRole}!` });
        // Refresh the employee list
        loadEmployees();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to update role.' });
      }
    };

    const filteredEmployees = employees.filter(emp =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{emp.employee_id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{emp.name}</td>
                    <td className="px-4 py-3 text-sm">{emp.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={emp.role}
                        onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                        className="px-2 py-1 border rounded text-xs font-medium"
                      >
                        <option value="employee">Employee</option>
                        <option value="contributor">Contributor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleResetPassword(emp.employee_id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const ExamResultsPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadExams();
    }, []);

    const loadExams = async () => {
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
      }
    };

    const loadResults = async (examId) => {
      setLoading(true);
      try {
        const data = await getExamResults(examId);
        setResults(data);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to load results.' });
      } finally {
        setLoading(false);
      }
    };

    const handleExamChange = (examId) => {
      setSelectedExam(examId);
      if (examId) loadResults(examId);
      else setResults([]);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
          <div className="relative">
            <select
              value={selectedExam}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full p-4 pr-12 border-2 border-gray-200 rounded-xl bg-gradient-to-r from-white to-gray-50 text-gray-700 font-medium shadow-sm hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="" className="text-gray-500">Choose an exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id} className="text-gray-700 bg-white hover:bg-blue-50">{exam.title}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading results...</p>
        ) : results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Percentage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{result.users?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{result.score}/{result.total_marks}</td>
                    <td className="px-4 py-3 text-sm">{result.percentage}%</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        #{result.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {result.submitted_at ? formatDateIST(result.submitted_at) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selectedExam ? (
          <p className="text-center text-gray-500">No results found for this exam.</p>
        ) : null}
      </div>
    );
  };

  const PendingQuestionsPage = ({ setFeedback }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadPendingQuestions();
    }, []);

    const loadPendingQuestions = async () => {
      setLoading(true);
      try {
        const data = await getPendingQuestions();
        setQuestions(data);
      } catch (err) {
        console.error('Failed to load pending questions:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleApprove = async (questionId) => {
      try {
        await approveQuestion(questionId);
        setFeedback({ success: 'Question approved!' });
        loadPendingQuestions();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to approve question.' });
      }
    };

    const handleReject = async (questionId) => {
      if (!confirm('Reject this question?')) return;
      try {
        await rejectQuestion(questionId);
        setFeedback({ success: 'Question rejected!' });
        loadPendingQuestions();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to reject question.' });
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="mb-3">
                  <p className="font-medium text-gray-800 mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className={q.correct_answer === 'A' ? 'text-green-600 font-medium' : 'text-gray-600'}>A) {q.option_a}</p>
                    <p className={q.correct_answer === 'B' ? 'text-green-600 font-medium' : 'text-gray-600'}>B) {q.option_b}</p>
                    <p className={q.correct_answer === 'C' ? 'text-green-600 font-medium' : 'text-gray-600'}>C) {q.option_c}</p>
                    <p className={q.correct_answer === 'D' ? 'text-green-600 font-medium' : 'text-gray-600'}>D) {q.option_d}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Subject: {q.subject}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Difficulty: {q.difficulty}</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">By: {q.contributor_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(q.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(q.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No pending questions.</p>
        )}
      </div>
    );
  };

  const ManageExamsPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [editForm, setEditForm] = useState({
      title: '', description: '', duration: 60, passingScore: 50, startTime: ''
    });

    useEffect(() => {
      loadExams();
    }, []);

    const loadExams = async () => {
      setLoading(true);
      try {
        const data = await getExams();
        setExams(data);
      } catch (err) {
        console.error('Failed to load exams:', err);
        setFeedback({ error: 'Failed to load exams.' });
      } finally {
        setLoading(false);
      }
    };

    const isEditable = (exam) => {
      const now = new Date();
      const startTime = new Date(exam.start_time);
      return startTime > now;
    };

    const handleEdit = (exam) => {
      setEditingExam(exam);
      setEditForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        passingScore: exam.passing_score,
        startTime: exam.start_time ? new Date(exam.start_time).toISOString().slice(0, 16) : ''
      });
    };

    const handleUpdate = async (e) => {
      e.preventDefault();
      if (!editingExam) return;

      const endTime = calculateEndTime(editForm.startTime, editForm.duration);

      const updatedData = {
        title: editForm.title,
        description: editForm.description,
        duration: editForm.duration,
        passingScore: editForm.passingScore,
        startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null
      };

      try {
        await updateExam(editingExam.id, updatedData);
        setFeedback({ success: 'Exam updated successfully!' });
        setEditingExam(null);
        loadExams();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to update exam.' });
      }
    };

    const handleDelete = async (examId) => {
      if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;

      try {
        await deleteExam(examId);
        setFeedback({ success: 'Exam deleted successfully!' });
        loadExams();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to delete exam.' });
      }
    };

    const calculateEndTime = (startTime, duration) => {
      if (!startTime || !duration) return '';
      const start = new Date(startTime);
      const end = new Date(start.getTime() + duration * 60000);
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const minutes = String(end.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-center text-gray-500">Loading exams...</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Manage Exams</h2>
          <p className="text-sm text-gray-600">Edit exam details before the start time or delete exams.</p>
        </div>

        {exams.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No exams found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Passing Score</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exams.map((exam) => {
                  const editable = isEditable(exam);
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{exam.title}</td>
                      <td className="px-4 py-3 text-sm">
                        {exam.start_time ? formatDateIST(exam.start_time) : 'Not set'}
                      </td>
                      <td className="px-4 py-3 text-sm">{exam.duration} minutes</td>
                      <td className="px-4 py-3 text-sm">{exam.passing_score}%</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          editable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {editable ? 'Editable' : 'Started'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editable && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(exam)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(exam.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editingExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Exam</h2>
                  <button
                    onClick={() => setEditingExam(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                    <input
                      type="text"
                      placeholder="Enter exam title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      placeholder="Enter exam description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full p-3 border rounded-lg h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        value={editForm.duration}
                        onChange={(e) => {
                          const newDuration = parseInt(e.target.value) || 60;
                          setEditForm({ ...editForm, duration: newDuration });
                        }}
                        className="w-full p-3 border rounded-lg"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                      <input
                        type="number"
                        value={editForm.passingScore}
                        onChange={(e) => setEditForm({ ...editForm, passingScore: parseInt(e.target.value) || 50 })}
                        className="w-full p-3 border rounded-lg"
                        min="1" max="100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Auto-calculated)</label>
                      <input
                        type="datetime-local"
                        value={calculateEndTime(editForm.startTime, editForm.duration)}
                        className="w-full p-3 border rounded-lg bg-gray-100"
                        disabled readOnly
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingExam(null)}
                      className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Update Exam
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AdminProfilePage = ({ setFeedback }) => {
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadAdminProfile();
    }, []);

    const loadAdminProfile = () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setAdminData(userData);
      setLoading(false);
    };

    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-center text-gray-500">Loading admin profile...</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Profile</h2>
          <p className="text-gray-600">View your admin account information</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium">
                  {adminData?.name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                  {adminData?.email || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                  {adminData?.employee_id || 'N/A'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="p-3 bg-green-50 rounded-lg text-green-800 font-medium">
                  {adminData?.role?.charAt(0).toUpperCase() + adminData?.role?.slice(1) || 'Admin'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                  {adminData?.department || 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800">
                  {adminData?.mobile || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {adminData?.id ? 'Active' : 'N/A'}
                </div>
                <div className="text-sm text-blue-700">Account Status</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  Admin
                </div>
                <div className="text-sm text-green-700">Access Level</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  Full
                </div>
                <div className="text-sm text-purple-700">Permissions</div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Last Login:</span>
                  <span className="ml-2 text-gray-600">Current Session</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Session Started:</span>
                  <span className="ml-2 text-gray-600">{new Date().toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReexamRequestsPage = ({ setFeedback }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      loadRequests();
    }, []);

    const loadRequests = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/reexam-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleApprove = async (id) => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/admin/reexam-requests/${id}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFeedback({ success: 'Request approved!' });
        loadRequests();
      } catch (err) {
        setFeedback({ error: 'Failed to approve request' });
      }
    };

    const handleReject = async (id) => {
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/admin/reexam-requests/${id}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFeedback({ success: 'Request rejected!' });
        loadRequests();
      } catch (err) {
        setFeedback({ error: 'Failed to reject request' });
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{req.employee_name}</p>
                    <p className="text-sm text-gray-600">Exam: {req.exam_title}</p>
                    <p className="text-sm text-gray-500">Reason: {req.reason}</p>
                    <p className="text-xs text-gray-400">Requested: {new Date(req.requested_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No reexam requests</p>
        )}
      </div>
    );
  };

  const CertificateSettingsPage = ({ setFeedback }) => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
      loadSettings();
    }, []);

    const loadSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/certificate-settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load certificate settings:', err);
        setFeedback({ error: 'Failed to load certificate settings.' });
      } finally {
        setLoading(false);
      }
    };

    const handleSave = async () => {
      setSaving(true);
      setFeedback({ error: '', success: '' });
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/certificate-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(settings)
        });
        const result = await response.json();
        if (response.ok) {
          setFeedback({ success: 'Certificate settings saved successfully!' });
        } else {
          throw new Error(result.error || 'Failed to save settings');
        }
      } catch (err) {
        setFeedback({ error: err.message || 'Failed to save certificate settings.' });
      } finally {
        setSaving(false);
      }
    };

    const handleLogoUpload = async (file) => {
      try {
        const result = await uploadCertificateLogo(file);
        setSettings({ ...settings, logoUrl: result.logoUrl });
        setFeedback({ success: 'Logo uploaded successfully!' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to upload logo.' });
      }
    };

    const handleSignatureUpload = async (file) => {
      try {
        const result = await uploadCertificateSignature(file);
        setSettings({ ...settings, signatureUrl: result.signatureUrl });
        setFeedback({ success: 'Signature uploaded successfully!' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to upload signature.' });
      }
    };

    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <p className="text-center text-gray-500">Loading certificate settings...</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-6">
          {/* Paper Size & Orientation */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Paper Size & Orientation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
                <select
                  value={settings.pageSize || 'A4'}
                  onChange={(e) => setSettings({ ...settings, pageSize: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="A4">A4 (21 × 29.7 cm)</option>
                  <option value="Letter">Letter (21.6 × 27.9 cm)</option>
                  <option value="Custom">Custom Size</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orientation</label>
                <select
                  value={settings.orientation || 'portrait'}
                  onChange={(e) => setSettings({ ...settings, orientation: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
            {settings.pageSize === 'Custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width (cm)</label>
                  <input
                    type="number"
                    value={settings.customWidth || 21}
                    onChange={(e) => setSettings({ ...settings, customWidth: parseFloat(e.target.value) || 21 })}
                    className="w-full p-3 border rounded-lg"
                    min="10" max="50" step="0.1"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={settings.customHeight || 29.7}
                    onChange={(e) => setSettings({ ...settings, customHeight: parseFloat(e.target.value) || 29.7 })}
                    className="w-full p-3 border rounded-lg"
                    min="10" max="50" step="0.1"
                    placeholder="29.7"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo Settings */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0])}
                  className="w-full p-3 border rounded-lg"
                />
                {settings.logoUrl && (
                  <div className="mt-2">
                    <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Position</label>
                <select
                  value={settings.logoPosition || 'top-center'}
                  onChange={(e) => setSettings({ ...settings, logoPosition: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Width (px)</label>
                <input
                  type="number"
                  value={settings.logoWidth || 150}
                  onChange={(e) => setSettings({ ...settings, logoWidth: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="50" max="300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo Height (px)</label>
                <input
                  type="number"
                  value={settings.logoHeight || 80}
                  onChange={(e) => setSettings({ ...settings, logoHeight: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="30" max="200"
                />
              </div>
            </div>
          </div>

          {/* Signature Settings */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Signature Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleSignatureUpload(e.target.files[0])}
                  className="w-full p-3 border rounded-lg"
                />
                {settings.signatureUrl && (
                  <div className="mt-2">
                    <img src={settings.signatureUrl} alt="Signature" className="h-12 object-contain" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Position</label>
                <select
                  value={settings.signaturePosition || 'bottom-center'}
                  onChange={(e) => setSettings({ ...settings, signaturePosition: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Width (px)</label>
                <input
                  type="number"
                  value={settings.signatureWidth || 120}
                  onChange={(e) => setSettings({ ...settings, signatureWidth: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="50" max="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature Height (px)</label>
                <input
                  type="number"
                  value={settings.signatureHeight || 60}
                  onChange={(e) => setSettings({ ...settings, signatureHeight: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="30" max="150"
                />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificate Text Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.title || 'CERTIFICATE OF COMPLETION'}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.subtitle || 'This is to certify that'}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Text</label>
                  <input
                    type="text"
                    value={settings.recipientText || '{employee_name}'}
                    onChange={(e) => setSettings({ ...settings, recipientText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achievement Text</label>
                  <input
                    type="text"
                    value={settings.achievementText || 'has successfully completed the'}
                    onChange={(e) => setSettings({ ...settings, achievementText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Text</label>
                  <input
                    type="text"
                    value={settings.examText || '{exam_title}'}
                    onChange={(e) => setSettings({ ...settings, examText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Score Text</label>
                  <input
                    type="text"
                    value={settings.scoreText || 'with a score of {percentage}%'}
                    onChange={(e) => setSettings({ ...settings, scoreText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rank Text</label>
                  <input
                    type="text"
                    value={settings.rankText || 'Rank: {rank}'}
                    onChange={(e) => setSettings({ ...settings, rankText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Text</label>
                  <input
                    type="text"
                    value={settings.dateText || 'Date: {date}'}
                    onChange={(e) => setSettings({ ...settings, dateText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signature Text</label>
                  <input
                    type="text"
                    value={settings.signatureText || 'Authorized Signature'}
                    onChange={(e) => setSettings({ ...settings, signatureText: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Typography & Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title Font</label>
                <select
                  value={settings.titleFont || 'Arial'}
                  onChange={(e) => setSettings({ ...settings, titleFont: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title Size</label>
                <input
                  type="number"
                  value={settings.titleSize || 24}
                  onChange={(e) => setSettings({ ...settings, titleSize: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="16" max="48"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Font</label>
                <select
                  value={settings.bodyFont || 'Arial'}
                  onChange={(e) => setSettings({ ...settings, bodyFont: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Size</label>
                <input
                  type="number"
                  value={settings.bodySize || 14}
                  onChange={(e) => setSettings({ ...settings, bodySize: parseInt(e.target.value) })}
                  className="w-full p-3 border rounded-lg"
                  min="10" max="24"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title Color</label>
                <input
                  type="color"
                  value={settings.titleColor || '#000000'}
                  onChange={(e) => setSettings({ ...settings, titleColor: e.target.value })}
                  className="w-full p-3 border rounded-lg h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Body Color</label>
                <input
                  type="color"
                  value={settings.bodyColor || '#333333'}
                  onChange={(e) => setSettings({ ...settings, bodyColor: e.target.value })}
                  className="w-full p-3 border rounded-lg h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <input
                  type="color"
                  value={settings.accentColor || '#0066cc'}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="w-full p-3 border rounded-lg h-12"
                />
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showBorder !== false}
                  onChange={(e) => setSettings({ ...settings, showBorder: e.target.checked })}
                  className="mr-2"
                />
                Show Border
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showSignature !== false}
                  onChange={(e) => setSettings({ ...settings, showSignature: e.target.checked })}
                  className="mr-2"
                />
                Show Signature
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showDate !== false}
                  onChange={(e) => setSettings({ ...settings, showDate: e.target.checked })}
                  className="mr-2"
                />
                Show Date
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showScore !== false}
                  onChange={(e) => setSettings({ ...settings, showScore: e.target.checked })}
                  className="mr-2"
                />
                Show Score
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showRank !== false}
                  onChange={(e) => setSettings({ ...settings, showRank: e.target.checked })}
                  className="mr-2"
                />
                Show Rank
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
            >
              Show Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Certificate Preview</h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Certificate Preview */}
                <div
                  className="border-2 border-gray-300 mx-auto bg-white relative overflow-hidden"
                  style={{
                    width: settings.orientation === 'landscape' ? '800px' : '600px',
                    height: settings.orientation === 'landscape' ? '600px' : '800px',
                    backgroundColor: settings.backgroundColor || '#ffffff'
                  }}
                >
                  {/* Border */}
                  {settings.showBorder && (
                    <>
                      <div className="absolute inset-2 border-2 border-gray-800"></div>
                      <div className="absolute inset-4 border border-gray-600"></div>
                    </>
                  )}

                  <div className="relative h-full p-8 flex flex-col">
                    {/* Logo */}
                    {settings.logoUrl && (
                      <div className="flex justify-center mb-6">
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          style={{
                            width: settings.logoWidth || 150,
                            height: settings.logoHeight || 80,
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                    )}

                    {/* Title */}
                    <div className="text-center mb-6">
                      <h1
                        style={{
                          fontSize: (settings.titleSize || 24) + 16,
                          color: settings.titleColor || '#000000',
                          fontWeight: 'bold'
                        }}
                      >
                        {settings.title || 'CERTIFICATE OF COMPLETION'}
                      </h1>
                    </div>

                    {/* Subtitle */}
                    <div className="text-center mb-4">
                      <p
                        style={{
                          fontSize: settings.bodySize || 14,
                          color: settings.bodyColor || '#666'
                        }}
                      >
                        {settings.subtitle || 'This is to certify that'}
                      </p>
                    </div>

                    {/* Employee Name */}
                    <div className="text-center mb-6">
                      <h2
                        style={{
                          fontSize: (settings.titleSize || 24) + 4,
                          color: settings.accentColor || '#1e40af',
                          fontWeight: 'bold'
                        }}
                      >
                        John Doe
                      </h2>
                    </div>

                    {/* Achievement Text */}
                    <div className="text-center mb-4">
                      <p
                        style={{
                          fontSize: settings.bodySize || 14,
                          color: settings.bodyColor || '#666'
                        }}
                      >
                        {settings.achievementText || 'has successfully completed the'}
                      </p>
                    </div>

                    {/* Exam Title */}
                    <div className="text-center mb-6">
                      <h3
                        style={{
                          fontSize: (settings.titleSize || 24) - 4,
                          color: settings.accentColor || '#1e40af',
                          fontWeight: 'bold'
                        }}
                      >
                        Sample Exam Title
                      </h3>
                    </div>

                    {/* Score */}
                    {settings.showScore && (
                      <div className="text-center mb-4">
                        <p
                          style={{
                            fontSize: (settings.bodySize || 14) + 2,
                            color: settings.bodyColor || '#000'
                          }}
                        >
                          with a score of 95%
                        </p>
                      </div>
                    )}

                    {/* Rank */}
                    {settings.showRank && (
                      <div className="text-center mb-4">
                        <p
                          style={{
                            fontSize: settings.bodySize || 14,
                            color: settings.bodyColor || '#666'
                          }}
                        >
                          Rank: 1
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    {settings.showDate && (
                      <div className="text-center mb-8">
                        <p
                          style={{
                            fontSize: (settings.bodySize || 14) - 2,
                            color: settings.bodyColor || '#666'
                          }}
                        >
                          Date: {new Date().toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    )}

                    {/* Signature */}
                    {settings.showSignature && (
                      <div className="mt-auto">
                        {settings.signatureUrl ? (
                          <div className="flex justify-center">
                            <img
                              src={settings.signatureUrl}
                              alt="Signature"
                              style={{
                                width: settings.signatureWidth || 120,
                                height: settings.signatureHeight || 60,
                                objectFit: 'contain'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="border-b-2 border-gray-600 w-32"></div>
                          </div>
                        )}
                        <div className="text-center mt-2">
                          <p
                            style={{
                              fontSize: (settings.bodySize || 14) - 4,
                              color: settings.bodyColor || '#666'
                            }}
                          >
                            {settings.signatureText || 'Authorized Signature'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Certificate Number & QR Code */}
                    <div className="absolute bottom-4 left-4 text-xs text-gray-500">
                      Certificate No: CERT001
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <div className="w-16 h-16 bg-gray-200 border flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  This is a preview of how the certificate will appear. Actual PDF generation may vary slightly.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 'upload-employees':
        return <UploadEmployeesPage setFeedback={setFeedback} />;
      case 'upload-questions':
        return <UploadQuestionsPage setFeedback={setFeedback} />;
      case 'create-exam':
        return <CreateExamPage setFeedback={setFeedback} />;
      case 'manage-exams':
        return <ManageExamsPage setFeedback={setFeedback} />;
      case 'assign-questions':
        return <AssignQuestionsPage setFeedback={setFeedback} />;
      case 'assign-exam':
        return <AssignExamPage setFeedback={setFeedback} />;
      case 'employee-management':
        return <EmployeeManagementPage setFeedback={setFeedback} />;
      case 'exam-results':
        return <ExamResultsPage setFeedback={setFeedback} />;
      case 'reexam-requests':
        return <ReexamRequestsPage setFeedback={setFeedback} />;
      case 'pending-questions':
        return <PendingQuestionsPage setFeedback={setFeedback} />;
      case 'certificate-settings':
        return <CertificateSettingsPage setFeedback={setFeedback} />;
      case 'admin-profile':
        return <AdminProfilePage setFeedback={setFeedback} />;
      default:
        return null;
    }
  };

  if (currentPage !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className="mr-4 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                  {menuItems.find(item => item.id === currentPage)?.title}
                </h1>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        {feedback.error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
              <p className="text-red-700 font-medium">{feedback.error}</p>
            </div>
          </div>
        )}
        {feedback.success && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
              <p className="text-green-700 font-medium">{feedback.success}</p>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderPageContent()}
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Head>
        <title>Admin Dashboard - HR Exam System</title>
      </Head>

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Manage exams, users, and questions</p>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <p className="text-red-700 font-medium">{feedback.error}</p>
          </div>
        )}
        {feedback.success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <p className="text-green-700 font-medium">{feedback.success}</p>
          </div>
        )}

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Exams</p>
                  <p className="text-4xl font-bold mt-2">{analytics.totalExams}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Employees</p>
                  <p className="text-4xl font-bold mt-2">{analytics.totalUsers.employee}</p>
                  <p className="text-green-100 text-xs mt-1">{analytics.totalUsers.contributor} Contributors</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Questions</p>
                  <p className="text-4xl font-bold mt-2">{analytics.questions.pending}</p>
                  <p className="text-yellow-100 text-xs mt-1">{analytics.questions.approved} Approved</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Score</p>
                  <p className="text-4xl font-bold mt-2">{analytics.averageScore}%</p>
                  <p className="text-purple-100 text-xs mt-1">Overall Performance</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 4 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer group"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
