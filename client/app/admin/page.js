'use client';
import { useState, useEffect } from 'react';
import {
  uploadEmployees,
  uploadQuestions,
  createExam,
  getExams,
  getExamDetails,
  updateExam,
  deleteExam,
  assignExam,
  getPendingQuestions,
  approveQuestion,
  rejectQuestion,
  getExamResults,
  getEmployees,
  resetEmployeePassword,
  getApprovedQuestions,
  assignQuestionsToExam,
  assignQuestionToContributor,
  bulkAssignQuestions,
  getAdminAnalytics,
  getRecentResults,
  toggleExamCertificate,
  adminGenerateCertificate,
  updateEmployeeRole,
} from '@/lib/api';
import { formatDateIST, formatDateOnlyIST, toDateTimeLocalIST, fromDateTimeLocalIST } from '@/lib/dateUtils';
import Head from 'next/head';

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState({ analytics: false });
  const [feedback, setFeedback] = useState({ error: '', success: '' });
  const [adminProfile, setAdminProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadAdminProfile();
    loadAnalytics();
    loadRecentResults();
  }, []);

  const loadAdminProfile = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setAdminProfile(user);
    } catch (err) {
      console.error('Failed to load admin profile:', err);
    }
  };

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

  const loadRecentResults = async () => {
    try {
      const data = await getRecentResults();
      setRecentResults(data);
    } catch (err) {
      console.error('Failed to load recent results:', err);
    }
  };

  const menuItems = [
    { id: 'create-exam', title: 'Create Exam', icon: '📝', description: 'Create new examination' },
    { id: 'assign-questions', title: 'Assign Questions to Exam', icon: '🔗', description: 'Link questions to exams' },
    { id: 'assign-exam', title: 'Assign Exam to Employees', icon: '📋', description: 'Assign exams to employees' },
    { id: 'upload-employees', title: 'Upload Employees', icon: '👥', description: 'Bulk upload employees via Excel/CSV' },
    { id: 'upload-questions', title: 'Upload Questions', icon: '❓', description: 'Bulk upload questions via Excel/CSV' },
    { id: 'exam-results', title: 'Exam Results', icon: '📊', description: 'View examination results' },
    { id: 'reexam-requests', title: 'Reexam Requests', icon: '🔄', description: 'Manage reexam requests' },
    { id: 'manage-exams', title: 'Manage Exams', icon: '✏️', description: 'View, edit, delete exams' },
    { id: 'employee-management', title: 'Employee Management', icon: '⚙️', description: 'Manage employee accounts' },
    { id: 'pending-questions', title: 'Pending Questions', icon: '⏳', description: 'Review pending questions' },
    { id: 'assign-questions-contributor', title: 'Assign Questions to Contributors', icon: '👨‍💼', description: 'Assign questions for editing' }
  ];

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
      case 'assign-questions-contributor':
        return <AssignQuestionsToContributorPage setFeedback={setFeedback} />;
      case 'assign-exam':
        return <AssignExamPage setFeedback={setFeedback} />;
      case 'employee-management':
        return <EmployeeManagementPage setFeedback={setFeedback} />;
      case 'exam-results':
        return <ExamResultsPage setFeedback={setFeedback} />;
      case 'pending-questions':
        return <PendingQuestionsPage setFeedback={setFeedback} />;
      case 'reexam-requests':
        return <ReexamRequestsPage setFeedback={setFeedback} />;
      default:
        return null;
    }
  };

  if (currentPage !== 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    setFeedback({ error: '', success: '' });
                  }}
                  className="mr-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {menuItems.find(item => item.id === currentPage)?.title}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {adminProfile && (
                  <div className="text-right cursor-pointer" onClick={() => setShowProfileModal(true)}>
                    <p className="text-sm font-semibold text-gray-800 hover:text-purple-600 transition">{adminProfile.name}</p>
                    <p className="text-xs text-gray-500">{adminProfile.email}</p>
                  </div>
                )}
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => setShowProfileModal(true)}
                >
                  {adminProfile?.name?.charAt(0) || 'A'}
                </div>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Logout
                </button>
              </div>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Head>
        <title>Admin Dashboard - HR Exam System</title>
      </Head>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm mt-2 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Manage exams, users, and questions
              </p>
            </div>
            <div className="flex items-center gap-4">
              {adminProfile && (
                <div className="text-right cursor-pointer" onClick={() => setShowProfileModal(true)}>
                  <p className="text-sm font-semibold text-gray-800 hover:text-purple-600 transition">{adminProfile.name}</p>
                  <p className="text-xs text-gray-500">{adminProfile.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                    {adminProfile.role?.toUpperCase()}
                  </span>
                </div>
              )}
              <div 
                className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer hover:scale-110 transition-transform"
                onClick={() => setShowProfileModal(true)}
              >
                {adminProfile?.name?.charAt(0) || 'A'}
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>
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

        {/* Analytics Dashboard */}
        {analytics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-blue-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-semibold uppercase tracking-wide">Total Exams</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.totalExams}</p>
                  </div>
                  <div className="text-5xl opacity-20">📝</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-green-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs font-semibold uppercase tracking-wide">Total Attempts</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.examResults?.totalAttempts || 0}</p>
                  </div>
                  <div className="text-5xl opacity-20">✍️</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-emerald-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Passed</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.examResults?.passedCount || 0}</p>
                  </div>
                  <div className="text-5xl opacity-20">✅</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-red-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-xs font-semibold uppercase tracking-wide">Failed</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.examResults?.failedCount || 0}</p>
                  </div>
                  <div className="text-5xl opacity-20">❌</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-purple-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-semibold uppercase tracking-wide">Pass Rate</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.examResults?.passRate || 0}%</p>
                  </div>
                  <div className="text-5xl opacity-20">📊</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-indigo-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wide">Avg Score</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.averageScore || 0}%</p>
                  </div>
                  <div className="text-5xl opacity-20">🎯</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl border border-orange-400/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Reexam Requests</p>
                    <p className="text-5xl font-extrabold mt-3">{analytics.reexamRequests || 0}</p>
                  </div>
                  <div className="text-5xl opacity-20">🔄</div>
                </div>
              </div>
            </div>

            {/* Menu Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-transparent hover:border-purple-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center relative z-10">
                    <div className="text-5xl mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 group-hover:from-purple-600 group-hover:to-pink-600 transition-all">{item.title}</h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Results */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <span>📋</span> Recent Exam Results
              </h3>
              {recentResults.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Exam</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentResults.map((result) => (
                        <tr key={result.id} className="hover:bg-purple-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-semibold text-gray-800">{result.user_name}</p>
                              <p className="text-gray-500 text-xs">{result.employee_id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">{result.exam_title}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{result.score}/{result.total_questions} <span className="text-purple-600">({result.percentage}%)</span></td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              result.status === 'passed' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'
                            }`}>
                              {result.status === 'passed' ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {result.rank && (
                              <span className="px-3 py-1 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-full text-xs font-bold shadow-sm">
                                🏆 #{result.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDateIST(result.submitted_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent exam results</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && adminProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Profile Details</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-xl mb-4">
                {adminProfile.name?.charAt(0) || 'A'}
              </div>
              <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full shadow-lg">
                {adminProfile.role?.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                <p className="text-lg font-semibold text-gray-800">{adminProfile.name || 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Employee ID</p>
                <p className="text-lg font-semibold text-gray-800">{adminProfile.employee_id || 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email Address</p>
                <p className="text-lg font-semibold text-gray-800 break-all">{adminProfile.email || 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mobile Number</p>
                <p className="text-lg font-semibold text-gray-800">{adminProfile.mobile || adminProfile.personal_mobile || 'N/A'}</p>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Department</p>
                <p className="text-lg font-semibold text-gray-800">{adminProfile.department || 'N/A'}</p>
              </div>

              {adminProfile.personnel_area && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Designation</p>
                  <p className="text-lg font-semibold text-gray-800">{adminProfile.personnel_area}</p>
                </div>
              )}

              {adminProfile.employee_group && (
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Class</p>
                  <p className="text-lg font-semibold text-gray-800">{adminProfile.employee_group}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Subject', 'Difficulty', 'Lot'],
        ['What is 2+2?', '3', '4', '5', '6', 'B', 'Mathematics', 'easy', 'Lot-1'],
        ['भारत की राजधानी क्या है?', 'मुंबई', 'दिल्ली', 'कोलकाता', 'चेन्नई', 'B', 'General Knowledge', 'medium', 'Lot-1']
      ];
      const csv = '\uFEFF' + sampleData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
      totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: '', certificate_enabled: true
    });
    const [loading, setLoading] = useState(false);

    const calculateEndTime = (startTime, duration) => {
      if (!startTime || !duration) return '';
      const start = new Date(startTime);
      const end = new Date(start.getTime() + parseInt(duration) * 60 * 1000);
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
        // Convert IST datetime-local values to UTC for backend
        const examData = {
          ...examForm,
          startTime: examForm.startTime ? fromDateTimeLocalIST(examForm.startTime) : null,
          endTime: examForm.endTime ? fromDateTimeLocalIST(examForm.endTime) : null
        };
        await createExam(examData);
        setFeedback({ success: 'Exam created successfully!' });
        setExamForm({ title: '', description: '', duration: 60, passingScore: 50, totalQuestions: 10, marksPerQuestion: 1, startTime: '', endTime: '', certificate_enabled: true });
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (IST)</label>
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
              <p className="text-xs text-gray-500 mt-1">Time will be shown in Indian Standard Time</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time (Auto-calculated, IST)</label>
              <input
                type="datetime-local"
                value={examForm.endTime}
                className="w-full p-3 border rounded-lg bg-gray-100"
                disabled readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Based on duration from start time</p>
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
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterLot, setFilterLot] = useState('');

    useEffect(() => {
      loadExams();
      loadQuestions();
    }, []);

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

    const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
    const difficulties = ['easy', 'medium', 'hard'];
    const lots = [...new Set(questions.map(q => q.lot).filter(Boolean))];

    const filteredQuestions = questions.filter(q => {
      if (filterSubject && q.subject !== filterSubject) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      if (filterLot && q.lot !== filterLot) return false;
      return true;
    });

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Difficulty</label>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Levels</option>
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Lot</label>
              <select
                value={filterLot}
                onChange={(e) => setFilterLot(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Lots</option>
                {lots.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Select Questions ({selectedQuestions.length} selected, {filteredQuestions.length} shown)</label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestions.includes(q.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = [...new Set([...selectedQuestions, ...filteredQuestions.map(q => q.id)])];
                      setSelectedQuestions(allIds);
                    } else {
                      const filteredIds = filteredQuestions.map(q => q.id);
                      setSelectedQuestions(selectedQuestions.filter(id => !filteredIds.includes(id)));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-blue-600 font-medium">Select All Filtered</span>
              </label>
            </div>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {filteredQuestions.map((q) => (
                <label key={q.id} className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions([...selectedQuestions, q.id]);
                      } else {
                        setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                      }
                    }}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{q.question_text}</p>
                    <p className="text-sm text-gray-500">Subject: {q.subject} | Difficulty: {q.difficulty} {q.lot && `| Lot: ${q.lot}`}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleAssign}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg disabled:bg-blue-400 hover:bg-blue-700"
            disabled={!selectedExam || selectedQuestions.length === 0 || loading}
          >
            {loading ? 'Assigning...' : 'Assign Questions to Exam'}
          </button>
        </div>
      </div>
    );
};

const AssignExamPage = ({ setFeedback }) => {
    const [exams, setExams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterDesignation, setFilterDesignation] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [bulkIds, setBulkIds] = useState('');

    useEffect(() => {
      loadExams();
      loadEmployees();
    }, []);

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

    const handleBulkSelect = () => {
      const ids = bulkIds.split(',').map(id => id.trim()).filter(Boolean);
      const matched = employees.filter(emp => ids.includes(emp.employee_id));
      const newSelected = [...new Set([...selectedEmployees, ...matched.map(e => e.id)])];
      setSelectedEmployees(newSelected);
      setBulkIds('');
      setFeedback({ success: `${matched.length} employees selected from bulk IDs` });
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];
    const designations = [...new Set(employees.map(e => e.personnel_area).filter(Boolean))];
    const classes = [...new Set(employees.map(e => e.employee_group).filter(Boolean))];

    const filteredEmployees = employees.filter(emp => {
      if (searchTerm && !(
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )) return false;
      if (filterDepartment && emp.department !== filterDepartment) return false;
      if (filterDesignation && emp.personnel_area !== filterDesignation) return false;
      if (filterClass && emp.employee_group !== filterClass) return false;
      return true;
    });

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="block text-xs font-medium text-gray-700 mb-2">Bulk Select by Employee IDs (comma separated)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. EMP001, EMP002, EMP003"
                value={bulkIds}
                onChange={(e) => setBulkIds(e.target.value)}
                className="flex-1 p-2 border rounded text-sm"
              />
              <button
                onClick={handleBulkSelect}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                disabled={!bulkIds.trim()}
              >
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Employees</label>
            <input
              type="text"
              placeholder="Name, Email, or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Department</label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Designation</label>
              <select
                value={filterDesignation}
                onChange={(e) => setFilterDesignation(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Designations</option>
                {designations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employees ({selectedEmployees.length} selected, {filteredEmployees.length} shown)</label>
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {filteredEmployees.map((emp) => (
                <label key={emp.id} className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees([...selectedEmployees, emp.id]);
                      } else {
                        setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                      }
                    }}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.email} | {emp.employee_id}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleAssign}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg disabled:bg-green-400 hover:bg-green-700"
            disabled={!selectedExam || selectedEmployees.length === 0 || loading}
          >
            {loading ? 'Assigning...' : 'Assign Exam to Employees'}
          </button>
        </div>
      </div>
    );
};

const EmployeeManagementPage = ({ setFeedback }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');

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

    const handleResetPassword = async (userId) => {
      if (!confirm('Reset password for this employee?')) return;
      try {
        await resetEmployeePassword(userId);
        setFeedback({ success: 'Password reset successfully!' });
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to reset password.' });
      }
    };

    const handleRoleChange = async (userId, newRole) => {
      if (!confirm(`Change role to ${newRole}?`)) return;
      try {
        await updateEmployeeRole(userId, newRole);
        setFeedback({ success: 'Role updated successfully!' });
        loadEmployees();
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to update role.' });
      }
    };

    const roles = [...new Set(employees.map(e => e.role).filter(Boolean))];
    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const filteredEmployees = employees.filter(emp => {
      if (searchTerm && !(
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )) return false;
      if (filterRole && emp.role !== filterRole) return false;
      if (filterDepartment && emp.department !== filterDepartment) return false;
      return true;
    });

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4 space-y-3">
          <input
            type="text"
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="p-2 border rounded-lg text-sm"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="p-2 border rounded-lg text-sm"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-600">Showing {filteredEmployees.length} of {employees.length} employees</p>
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
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        emp.role === 'admin' ? 'bg-red-100 text-red-700' :
                        emp.role === 'contributor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="employee">Employee</option>
                          <option value="contributor">Contributor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleResetPassword(emp.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                        >
                          Reset Pwd
                        </button>
                      </div>
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
    const [selectedExamData, setSelectedExamData] = useState(null);
    const [results, setResults] = useState([]);
    const [analytics, setAnalytics] = useState(null);
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
        setResults(data.results || data);
        setAnalytics(data.analytics || null);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to load results.' });
      } finally {
        setLoading(false);
      }
    };

    const handleExamChange = (examId) => {
      setSelectedExam(examId);
      const exam = exams.find(e => e.id === examId);
      setSelectedExamData(exam);
      if (examId) {
        loadResults(examId);
      } else {
        setResults([]);
        setAnalytics(null);
      }
    };

    const handleToggleCertificate = async () => {
      if (!selectedExam) return;
      try {
        const newState = !selectedExamData?.certificate_enabled;
        await toggleExamCertificate(selectedExam, newState);
        setFeedback({ success: `Certificate ${newState ? 'enabled' : 'disabled'} successfully!` });
        loadExams();
        handleExamChange(selectedExam);
      } catch (err) {
        setFeedback({ error: err.response?.data?.error || 'Failed to toggle certificate.' });
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Exam</h3>
          {exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {exams.map((exam, index) => (
                <div
                  key={exam.id}
                  onClick={() => handleExamChange(exam.id)}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                    selectedExam === exam.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-transparent hover:border-purple-300 hover:shadow-2xl hover:scale-105'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center relative z-10">
                    <div className="text-4xl mb-4 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                      📝
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 group-hover:from-purple-600 group-hover:to-pink-600 transition-all">{exam.title}</h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-700 line-clamp-2">{exam.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Duration: {exam.duration} min</p>
                      <p>Passing: {exam.passing_score}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No exams available</p>
          )}
          {selectedExam && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Certificate Generation</p>
                <p className="text-xs text-gray-500">Enable certificates for passed students</p>
              </div>
              <button
                onClick={handleToggleCertificate}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedExamData?.certificate_enabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {selectedExamData?.certificate_enabled ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>
          )}
        </div>
        
        {/* Analytics Section */}
        {analytics && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Exam Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{analytics.totalAttempts}</p>
                <p className="text-sm text-blue-800">Total Attempts</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{analytics.passed}</p>
                <p className="text-sm text-green-800">Passed</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{analytics.failed}</p>
                <p className="text-sm text-red-800">Failed</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{analytics.passRate}%</p>
                <p className="text-sm text-purple-800">Pass Rate</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top Performers */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-3">🏆 Top Performers</h4>
                <div className="space-y-2">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-sm text-gray-600">{performer.employee_id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{performer.percentage}%</p>
                        <p className="text-xs text-gray-500">Rank #{performer.rank}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Department Performance */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-3">📊 Department Performance</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.departmentWise).map(([dept, stats]) => (
                    <div key={dept} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <p className="font-medium">{dept}</p>
                      <div className="text-right">
                        <p className="text-sm">{stats.passed}/{stats.total}</p>
                        <p className="text-xs text-gray-500">{((stats.passed/stats.total)*100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-lg font-bold">{analytics.averageScore}%</p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-lg font-bold">{analytics.highestScore}%</p>
                <p className="text-sm text-gray-600">Highest Score</p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-lg font-bold">{analytics.lowestScore}%</p>
                <p className="text-sm text-gray-600">Lowest Score</p>
              </div>
            </div>
          </div>
        )}
        
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-800">{result.employee_name || result.user_name || 'N/A'}</p>
                        <p className="text-gray-500 text-xs">{result.employee_id}</p>
                      </div>
                    </td>
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
                      {new Date(result.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.status === 'passed' && (
                        result.certificate_url ? (
                          <a href={result.certificate_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 text-xs">
                            View
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              try {
                                await adminGenerateCertificate(result.id);
                                setFeedback({ success: 'Certificate generated!' });
                                loadResults(selectedExam);
                              } catch (err) {
                                setFeedback({ error: err.response?.data?.error || 'Failed to generate certificate' });
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            Generate
                          </button>
                        )
                      )}
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

const AssignQuestionsToContributorPage = ({ setFeedback }) => {
  const [questions, setQuestions] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [selectedContributor, setSelectedContributor] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
    loadContributors();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await getApprovedQuestions();
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const loadContributors = async () => {
    try {
      const data = await getEmployees();
      setContributors(data.filter(u => u.role === 'contributor'));
    } catch (err) {
      console.error('Failed to load contributors:', err);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedContributor) return;
    setLoading(true);
    try {
      const filters = {};
      if (filterSubject) filters.subject = filterSubject;
      if (filterLot) filters.lot = filterLot;
      if (filterDifficulty) filters.difficulty = filterDifficulty;
      
      await bulkAssignQuestions(selectedQuestions, selectedContributor, filters);
      setFeedback({ success: 'Questions assigned successfully!' });
      setSelectedQuestions([]);
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to assign questions.' });
    } finally {
      setLoading(false);
    }
  };

  const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
  const lots = [...new Set(questions.map(q => q.lot).filter(Boolean))];
  const difficulties = ['easy', 'medium', 'hard'];

  const filteredQuestions = questions.filter(q => {
    if (filterSubject && q.subject !== filterSubject) return false;
    if (filterLot && q.lot !== filterLot) return false;
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Contributor</label>
          <select
            value={selectedContributor}
            onChange={(e) => setSelectedContributor(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Choose a contributor</option>
            {contributors.map((contributor) => (
              <option key={contributor.id} value={contributor.id}>
                {contributor.name} ({contributor.employee_id})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Lot</label>
            <select
              value={filterLot}
              onChange={(e) => setFilterLot(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Lots</option>
              {lots.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter by Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="">All Levels</option>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <button
            onClick={() => {
              const allFiltered = filteredQuestions.map(q => q.id);
              setSelectedQuestions(prev => [...new Set([...prev, ...allFiltered])]);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm mr-2"
          >
            Select All Filtered ({filteredQuestions.length})
          </button>
          <button
            onClick={handleBulkAssign}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            disabled={!selectedContributor || loading}
          >
            {loading ? 'Assigning...' : `Assign ${selectedQuestions.length} Questions`}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Questions ({selectedQuestions.length} selected, {filteredQuestions.length} shown)
          </label>
          <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
            {filteredQuestions.map((q) => (
              <label key={q.id} className="flex items-start p-3 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(q.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedQuestions([...selectedQuestions, q.id]);
                    } else {
                      setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                    }
                  }}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{q.question_text}</p>
                  <p className="text-sm text-gray-500">
                    Subject: {q.subject} | Difficulty: {q.difficulty}
                    {q.lot && ` | Lot: ${q.lot}`}
                  </p>
                </div>
              </label>
            ))}
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
      setFeedback({ error: 'Failed to approve' });
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
      setFeedback({ error: 'Failed to reject' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="border rounded-lg p-4">
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

const ManageExamsPage = ({ setFeedback }) => {
  const [exams, setExams] = useState([]);
  const [editingExam, setEditingExam] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam) => {
    // Convert UTC to IST for datetime-local input
    const startTime = exam.start_time ? toDateTimeLocalIST(exam.start_time) : '';
    const endTime = exam.end_time ? toDateTimeLocalIST(exam.end_time) : '';
    setEditingExam({ ...exam, startTime, endTime });
  };

  const handleUpdate = async () => {
    try {
      // Convert IST to UTC for backend
      await updateExam(editingExam.id, {
        title: editingExam.title,
        description: editingExam.description,
        duration: editingExam.duration,
        passingScore: editingExam.passing_score,
        startTime: editingExam.startTime ? fromDateTimeLocalIST(editingExam.startTime) : null,
        endTime: editingExam.endTime ? fromDateTimeLocalIST(editingExam.endTime) : null
      });
      setFeedback({ success: 'Exam updated successfully!' });
      setEditingExam(null);
      loadExams();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to update exam.' });
    }
  };

  const handleDelete = async (examId) => {
    if (!confirm('Delete this exam? This action cannot be undone.')) return;
    try {
      await deleteExam(examId);
      setFeedback({ success: 'Exam deleted successfully!' });
      loadExams();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to delete exam.' });
    }
  };

  const canEdit = (exam) => {
    return !exam.start_time || new Date(exam.start_time) > new Date();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {editingExam ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Exam</h3>
            <button
              onClick={() => setEditingExam(null)}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
          <input
            type="text"
            placeholder="Exam Title"
            value={editingExam.title}
            onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={editingExam.description}
            onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
            className="w-full p-3 border rounded-lg h-24"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={editingExam.duration}
              onChange={(e) => setEditingExam({ ...editingExam, duration: parseInt(e.target.value) })}
              className="p-3 border rounded-lg"
            />
            <input
              type="number"
              placeholder="Passing Score (%)"
              value={editingExam.passing_score}
              onChange={(e) => setEditingExam({ ...editingExam, passing_score: parseInt(e.target.value) })}
              className="p-3 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (IST)</label>
              <input
                type="datetime-local"
                value={editingExam.startTime}
                onChange={(e) => setEditingExam({ ...editingExam, startTime: e.target.value })}
                className="p-3 border rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time (IST)</label>
              <input
                type="datetime-local"
                value={editingExam.endTime}
                onChange={(e) => setEditingExam({ ...editingExam, endTime: e.target.value })}
                className="p-3 border rounded-lg w-full"
              />
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Update Exam
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4">All Exams ({exams.length})</h3>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{exam.title}</h4>
                      <p className="text-gray-600 text-sm">{exam.description}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Duration: {exam.duration} min</span>
                        <span>Passing: {exam.passing_score}%</span>
                        {exam.start_time && (
                          <span>Start: {formatDateIST(exam.start_time)}</span>
                        )}
                        {exam.end_time && (
                          <span>End: {formatDateIST(exam.end_time)}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          !exam.start_time ? 'bg-gray-100 text-gray-600' :
                          new Date() < new Date(exam.start_time) ? 'bg-blue-100 text-blue-700' :
                          exam.end_time && new Date() > new Date(exam.end_time) ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {!exam.start_time ? 'Not Scheduled' :
                           new Date() < new Date(exam.start_time) ? 'Scheduled' :
                           exam.end_time && new Date() > new Date(exam.end_time) ? 'Completed' :
                           'Started'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canEdit(exam) ? (
                        <>
                          <button
                            onClick={() => handleEdit(exam)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-sm">
                          Started
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
