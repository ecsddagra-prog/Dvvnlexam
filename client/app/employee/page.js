'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMyExams, getMyResults, getEmployeeDashboard, generateCertificate } from '@/lib/api';
import { formatDateIST } from '@/lib/dateUtils';
import Head from 'next/head';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [reexamReason, setReexamReason] = useState('');
  const [resultsPage, setResultsPage] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showReexamModal, setShowReexamModal] = useState(false);
  const [selectedResultForReexam, setSelectedResultForReexam] = useState(null);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
  const [responsesData, setResponsesData] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responseFilter, setResponseFilter] = useState('all'); // 'all', 'correct', 'wrong'
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedQuestionForChallenge, setSelectedQuestionForChallenge] = useState(null);
  const [challengeReason, setChallengeReason] = useState('');
  const [suggestedCorrectAnswer, setSuggestedCorrectAnswer] = useState('');
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);
  const resultsPerPage = 5;



  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || userData.role !== 'employee') {
      router.push('/');
      return;
    }

    setIsAuthenticated(true);
    setUser(userData);
    loadData();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'results' && !resultsLoading && isAuthenticated) {
      loadResults(0);
    }
  }, [activeTab, isAuthenticated]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [examsData, dashboardData] = await Promise.all([
        getMyExams(),
        getEmployeeDashboard()
      ]);
      setExams(examsData || []);
      setDashboard(dashboardData);
      setRetryCount(0);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load dashboard data. Please try again.');
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadData();
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  const loadResults = useCallback(async (page = 0) => {
    setResultsLoading(true);
    try {
      const response = await fetch(`/api/employee/results?limit=${resultsPerPage}&offset=${page * resultsPerPage}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setResultsTotal(data.total || 0);
      setResultsPage(page);
      setError(null);
    } catch (error) {
      console.error('Failed to load results:', error);
      setError('Failed to load results. Please try again.');
      setResults([]);
      setResultsTotal(0);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();

    // Check if exam is already submitted
    const isSubmitted = results.some(r => r.exam_id === exam.exam_id);
    if (isSubmitted) {
      return { text: 'Submitted', color: 'bg-green-100 text-green-800', disabled: true };
    }

    if (exam.exams?.start_time && new Date(exam.exams.start_time) > now) {
      return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800', disabled: true };
    }
    if (exam.exams?.end_time && new Date(exam.exams.end_time) < now) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800', disabled: true };
    }
    if (exam.completed_at) {
      return { text: 'Completed', color: 'bg-green-100 text-green-800', disabled: true };
    }
    return { text: 'Available', color: 'bg-blue-100 text-blue-800', disabled: false };
  };

  const showResponses = async (resultId, filter = 'all') => {
    setResponsesLoading(true);
    setResponseFilter(filter);
    setShowResponsesModal(true);

    try {
      const response = await fetch(`/api/employee/results/${resultId}/responses`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResponsesData(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
      alert('Failed to load responses. Please try again.');
      setShowResponsesModal(false);
    } finally {
      setResponsesLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Head>
        <title>Employee Dashboard - HR Exam System</title>
      </Head>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Employee Dashboard
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Welcome back! Ready for your next exam?
                {lastUpdated && (
                  <span className="block text-xs text-gray-500 mt-1">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setLoading(true);
                  loadData();
                  if (activeTab === 'results') {
                    loadResults(0);
                  }
                }}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
                title="Refresh data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  if (activeTab === 'results') {
                    loadResults(resultsPage);
                  } else {
                    loadData();
                  }
                }}
                className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards with Navigation */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition text-left ${
                activeTab === 'dashboard' ? 'ring-4 ring-blue-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Dashboard</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.pendingExams}</p>
                  <p className="text-blue-100 text-xs mt-1">Pending Exams</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition text-left ${
                activeTab === 'exams' ? 'ring-4 ring-green-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Exams</p>
                  <p className="text-4xl font-bold mt-2">{exams.length}</p>
                  <p className="text-green-100 text-xs mt-1">Total Assigned</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition text-left ${
                activeTab === 'results' ? 'ring-4 ring-purple-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Results</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.averageScore}%</p>
                  <p className="text-purple-100 text-xs mt-1">Average Score</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition text-left ${
                activeTab === 'profile' ? 'ring-4 ring-yellow-300' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Profile</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.bestScore}%</p>
                  <p className="text-yellow-100 text-xs mt-1">Best Score</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Available Exams</h2>
              {exams.filter(e => !e.completed_at && !e.exams?.is_expired).length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No exams available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.filter(e => !e.completed_at && e.exams && !e.exams.is_expired).sort((a, b) => new Date(b.exams.start_time) - new Date(a.exams.start_time)).slice(0, 4).map((exam) => {
                    const status = getExamStatus(exam);
                    return (
                      <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">{exam.exams?.title || 'Untitled Exam'}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{exam.exams?.description || ''}</p>
                        <div className="text-xs text-gray-500 mb-3 space-y-1">
                          <div>⏱️ Duration: {exam.exams?.duration || 0} min</div>
                          <div>🎯 Pass: {exam.exams?.passing_score || 50}%</div>
                          {exam.exams?.start_time && (
                            <div>📅 Start: {formatDateIST(exam.exams.start_time)}</div>
                          )}
                          {exam.exams?.end_time && (
                            <div>🏁 End: {formatDateIST(exam.exams.end_time)}</div>
                          )}
                        </div>
                        {!status.disabled && status.text === 'Available' ? (
                          <button
                            onClick={() => router.push(`/exam/${exam.exams?.id}`)}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                          >
                            Start Exam
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Assigned Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.filter(e => e.exams && !e.exams.is_expired).sort((a, b) => new Date(b.exams.start_time) - new Date(a.exams.start_time)).map((exam) => {
                const status = getExamStatus(exam);
                return (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{exam.exams?.title || 'Untitled'}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{exam.exams?.description || ''}</p>
                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                      <div>⏱️ {exam.exams?.duration || 0} min</div>
                      <div>🎯 Pass: {exam.exams?.passing_score || 50}%</div>
                      {exam.exams?.start_time && (
                        <div>📅 Start: {formatDateIST(exam.exams.start_time)}</div>
                      )}
                      {exam.exams?.end_time && (
                        <div>🏁 End: {formatDateIST(exam.exams.end_time)}</div>
                      )}
                    </div>
                    {!status.disabled && status.text === 'Available' ? (
                      <button
                        onClick={() => router.push(`/exam/${exam.exams?.id}`)}
                        className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                      >
                        Start
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && user && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-4 mr-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-600">{user.personnel_number || user.employeeId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Personnel Number</p>
                    <p className="font-medium text-gray-800">{user.personnel_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee Name</p>
                    <p className="font-medium text-gray-800">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium text-gray-800">{user.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Personal Mobile</p>
                    <p className="font-medium text-gray-800">{user.personal_mobile || user.mobile || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Office Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Personnel Sub-Area</p>
                    <p className="font-medium text-gray-800">{user.personnel_area || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employee Group</p>
                    <p className="font-medium text-gray-800">{user.employee_group || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DDO Office Name</p>
                    <p className="font-medium text-gray-800">{user.discom || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium text-gray-800 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Performance Stats</h3>
                <div className="space-y-3">
                  {dashboard && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Exams Completed</span>
                        <span className="font-bold text-green-600">{dashboard.completedExams}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Average Score</span>
                        <span className="font-bold text-blue-600">{dashboard.averageScore}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Best Score</span>
                        <span className="font-bold text-purple-600">{dashboard.bestScore}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Pending Exams</span>
                        <span className="font-bold text-yellow-600">{dashboard.pendingExams}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Account Security</h3>
              <p className="text-sm text-blue-700 mb-3">Keep your account secure by changing your password regularly</p>
              <button
                onClick={() => router.push('/reset-password')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Change Password
              </button>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">My Results</h2>
              <div className="text-sm text-gray-600">
                Showing {results.length} of {resultsTotal} results
              </div>
            </div>

            {resultsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No results yet</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg">{result.exams?.title || 'Exam'}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Submitted: {formatDateIST(result.submitted_at)}
                          </p>
                        </div>
                        {result.rank && (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">#{result.rank}</div>
                            <div className="text-xs text-gray-500">Rank</div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <button
                          onClick={() => showResponses(result.id, 'correct')}
                          className="text-center p-2 bg-green-50 rounded hover:bg-green-100 transition cursor-pointer"
                        >
                          <div className="text-xl font-bold text-green-600">{result.score}</div>
                          <div className="text-xs text-gray-600">Correct</div>
                        </button>
                        <button
                          onClick={() => showResponses(result.id, 'wrong')}
                          className="text-center p-2 bg-red-50 rounded hover:bg-red-100 transition cursor-pointer"
                        >
                          <div className="text-xl font-bold text-red-600">{result.total_questions - result.score}</div>
                          <div className="text-xs text-gray-600">Wrong</div>
                        </button>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-xl font-bold text-gray-600">{result.total_questions}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-xl font-bold text-blue-600">{result.percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 text-center px-3 py-2 rounded text-sm font-medium ${
                            result.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.percentage >= 50 ? '✓ Passed' : '✗ Failed'}
                          </div>

                        {result.percentage >= 50 && (
                          result.certificate_url ? (
                            <a
                              href={result.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition inline-flex items-center gap-2"
                            >
                              📥 Download Certificate
                            </a>
                          ) : (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await generateCertificate(result.id);
                                  alert(`Certificate generated successfully!`);
                                  loadResults(resultsPage);
                                } catch (err) {
                                  alert(err.response?.data?.error || 'Failed to generate certificate');
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            >
                              Generate Certificate
                            </button>
                          )
                        )}
                        </div>

                        {!result.reexam_requested ? (
                          <button
                            onClick={() => {
                              setSelectedResultForReexam(result);
                              setShowReexamModal(true);
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition"
                          >
                            Request Re-exam
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded">
                            Re-exam Requested
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {resultsTotal > resultsPerPage && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <button
                      onClick={() => loadResults(resultsPage - 1)}
                      disabled={resultsPage === 0}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {resultsPage + 1} of {Math.ceil(resultsTotal / resultsPerPage)}
                    </span>
                    <button
                      onClick={() => loadResults(resultsPage + 1)}
                      disabled={(resultsPage + 1) * resultsPerPage >= resultsTotal}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Re-exam Request Modal */}
        {showReexamModal && selectedResultForReexam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Request Re-exam</h2>
                  <button
                    onClick={() => {
                      setShowReexamModal(false);
                      setSelectedResultForReexam(null);
                      setReexamReason('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <h3 className="font-semibold text-gray-800">{selectedResultForReexam.exams?.title || 'Exam'}</h3>
                    <p className="text-sm text-gray-600">
                      Score: {selectedResultForReexam.percentage.toFixed(1)}% ({selectedResultForReexam.score}/{selectedResultForReexam.total_questions})
                    </p>
                    <p className="text-sm text-gray-600">
                      Submitted: {formatDateIST(selectedResultForReexam.submitted_at)}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Re-exam Request *
                    </label>
                    <textarea
                      value={reexamReason}
                      onChange={(e) => setReexamReason(e.target.value)}
                      placeholder="Please explain why you want to retake this exam (e.g., I want to improve my score, technical issues during exam, etc.)"
                      className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!reexamReason.trim()) {
                          alert('Please enter a reason for the re-exam request');
                          return;
                        }

                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch('/api/employee/reexam-request', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              examId: selectedResultForReexam.exam_id,
                              reason: reexamReason.trim()
                            })
                          });

                          if (!response.ok) {
                            throw new Error('Failed to submit request');
                          }

                          alert('Re-exam request submitted successfully!');
                          setShowReexamModal(false);
                          setSelectedResultForReexam(null);
                          setReexamReason('');
                          loadResults(resultsPage);
                        } catch (err) {
                          alert('Failed to submit re-exam request. Please try again.');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                      Submit Request
                    </button>
                    <button
                      onClick={() => {
                        setShowReexamModal(false);
                        setSelectedResultForReexam(null);
                        setReexamReason('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Responses Modal */}
        {showResponsesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {responsesData?.exam_title || 'Exam'} - {responseFilter === 'correct' ? 'Correct Answers' : responseFilter === 'wrong' ? 'Wrong Answers' : 'All Responses'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowResponsesModal(false);
                      setResponsesData(null);
                      setResponseFilter('all');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {responsesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading responses...</p>
                  </div>
                ) : responsesData ? (
                  <>
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => setResponseFilter('all')}
                        className={`px-3 py-1 text-sm rounded ${responseFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        All ({responsesData.summary.total_questions})
                      </button>
                      <button
                        onClick={() => setResponseFilter('correct')}
                        className={`px-3 py-1 text-sm rounded ${responseFilter === 'correct' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Correct ({responsesData.summary.correct_answers})
                      </button>
                      <button
                        onClick={() => setResponseFilter('wrong')}
                        className={`px-3 py-1 text-sm rounded ${responseFilter === 'wrong' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        Wrong ({responsesData.summary.wrong_answers})
                      </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {responsesData.responses
                        .filter(response => {
                          if (responseFilter === 'correct') return response.is_correct;
                          if (responseFilter === 'wrong') return !response.is_correct;
                          return true;
                        })
                        .map((response, index) => (
                          <div key={response.id} className={`border rounded-lg p-4 ${response.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800">Question {index + 1}</h3>
                                {response.challenge && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    response.challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    response.challenge.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                    response.challenge.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {response.challenge.status === 'pending' ? '⏳ Challenged' :
                                     response.challenge.status === 'reviewed' ? '👁️ Reviewed' :
                                     response.challenge.status === 'resolved' ? '✅ Resolved' :
                                     'Challenged'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${response.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {response.is_correct ? '✓ Correct' : '✗ Wrong'}
                                </span>
                                {!response.challenge && (
                                  <button
                                    onClick={() => {
                                      setSelectedQuestionForChallenge({
                                        id: response.id,
                                        question: response.question,
                                        examResultId: responsesData.exam_result_id || responsesData.responses[0]?.exam_result_id
                                      });
                                      setShowChallengeModal(true);
                                    }}
                                    className="text-xs px-2 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
                                    title="Challenge this question"
                                  >
                                    🚩 Flag
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-gray-700 mb-3">{response.question}</p>

                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Options:</p>
                                <div className="ml-4 space-y-1">
                                  {Object.entries(response.options).map(([key, option]) => (
                                    <div key={key} className={`text-sm p-2 rounded ${
                                      key === response.correct_answer ? 'bg-green-100 border border-green-300' :
                                      key === response.user_answer && !response.is_correct ? 'bg-red-100 border border-red-300' :
                                      'bg-gray-50'
                                    }`}>
                                      <span className="font-medium">{key}.</span> {option}
                                      {key === response.correct_answer && (
                                        <span className="ml-2 text-green-600 font-bold">(Correct Answer)</span>
                                      )}
                                      {key === response.user_answer && key !== response.correct_answer && (
                                        <span className="ml-2 text-red-600 font-bold">(Your Answer)</span>
                                      )}
                                      {key === response.user_answer && key === response.correct_answer && (
                                        <span className="ml-2 text-green-600 font-bold">(Your Answer)</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No responses data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Challenge Modal */}
        {showChallengeModal && selectedQuestionForChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Challenge Question</h2>
                  <button
                    onClick={() => {
                      setShowChallengeModal(false);
                      setSelectedQuestionForChallenge(null);
                      setChallengeReason('');
                      setSuggestedCorrectAnswer('');
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">Question:</p>
                    <p className="font-medium text-gray-800">{selectedQuestionForChallenge.question}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Challenge *
                    </label>
                    <textarea
                      value={challengeReason}
                      onChange={(e) => setChallengeReason(e.target.value)}
                      placeholder="Please explain why you are challenging this question (e.g., incorrect answer, ambiguous wording, technical issue, etc.)"
                      className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suggested Correct Answer (Optional)
                    </label>
                    <select
                      value={suggestedCorrectAnswer}
                      onChange={(e) => setSuggestedCorrectAnswer(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select if you know the correct answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Help admins by suggesting what you think is the correct answer</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!challengeReason.trim()) {
                          alert('Please enter a reason for the challenge');
                          return;
                        }

                        setChallengeSubmitting(true);
                        try {
                          const token = localStorage.getItem('token');
                          const requestData = {
                            questionId: selectedQuestionForChallenge.id,
                            examResultId: selectedQuestionForChallenge.examResultId,
                            challengeReason: challengeReason.trim(),
                            suggestedCorrectAnswer: suggestedCorrectAnswer || null
                          };
                          console.log('Sending challenge request:', requestData);
                          const response = await fetch('/api/employee/question-challenges', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(requestData)
                          });

                          if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Challenge submission error:', errorData);
                            throw new Error(errorData.error || 'Failed to submit challenge');
                          }

                          alert('Question challenge submitted successfully! An admin will review it.');
                          setShowChallengeModal(false);
                          setSelectedQuestionForChallenge(null);
                          setChallengeReason('');
                          // Refresh the responses data to show the challenge status
                          if (responsesData) {
                            showResponses(responsesData.exam_result_id || responsesData.responses[0]?.exam_result_id, responseFilter);
                          }
                        } catch (err) {
                          alert('Failed to submit challenge. Please try again.');
                        } finally {
                          setChallengeSubmitting(false);
                        }
                      }}
                      disabled={challengeSubmitting}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {challengeSubmitting ? 'Submitting...' : 'Submit Challenge'}
                    </button>
                    <button
                      onClick={() => {
                        setShowChallengeModal(false);
                        setSelectedQuestionForChallenge(null);
                        setChallengeReason('');
                        setSuggestedCorrectAnswer('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
