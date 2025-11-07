'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyExams, getMyResults, getEmployeeDashboard } from '@/lib/api';
import Head from 'next/head';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  const loadData = async () => {
    try {
      const [examsData, resultsData, dashboardData] = await Promise.all([
        getMyExams('pending'),
        getMyResults(),
        getEmployeeDashboard()
      ]);
      setExams(examsData);
      setResults(resultsData);
      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    if (exam.exams.start_time && new Date(exam.exams.start_time) > now) {
      return { text: 'Upcoming', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (exam.exams.end_time && new Date(exam.exams.end_time) < now) {
      return { text: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    if (exam.completed_at) {
      return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    return { text: 'Available', color: 'bg-blue-100 text-blue-800' };
  };

  if (loading) {
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
              <p className="text-gray-600 text-sm mt-1">Welcome back! Ready for your next exam?</p>
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
        {/* Stats Cards */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Pending Exams</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.pendingExams}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.completedExams}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Average Score</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.averageScore}%</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Best Score</p>
                  <p className="text-4xl font-bold mt-2">{dashboard.bestScore}%</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 bg-white rounded-t-xl px-6">
            <nav className="-mb-px flex space-x-8">
              {['dashboard', 'exams', 'results', 'profile'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Available Exams</h2>
              {exams.filter(e => !e.completed_at).length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No exams available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exams.filter(e => !e.completed_at).slice(0, 4).map((exam) => {
                    const status = getExamStatus(exam);
                    return (
                      <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800">{exam.exams.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{exam.exams.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            <span>⏱️ {exam.exams.duration} min</span>
                          </div>
                          {status.text === 'Available' && (
                            <button
                              onClick={() => router.push(`/exam/${exam.exams.id}`)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                            >
                              Start Exam
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Results</h2>
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500">No results yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.slice(0, 5).map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{result.exams.title}</h3>
                        <p className="text-sm text-gray-500">
                          Score: {result.score}/{result.total_questions} • {result.percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        {result.rank && (
                          <div className="text-lg font-bold text-purple-600">#{result.rank}</div>
                        )}
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                          result.percentage >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.percentage >= 50 ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">All Assigned Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => {
                const status = getExamStatus(exam);
                return (
                  <div key={exam.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-800">{exam.exams.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{exam.exams.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <div>⏱️ {exam.exams.duration} min</div>
                        <div>🎯 Pass: {exam.exams.passing_score}%</div>
                      </div>
                      {status.text === 'Available' && (
                        <button
                          onClick={() => router.push(`/exam/${exam.exams.id}`)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                        >
                          Start
                        </button>
                      )}
                    </div>
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
                <p className="text-gray-600">{user.employeeId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="font-medium text-gray-800">{user.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium text-gray-800">{user.name}</p>
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
            <h2 className="text-xl font-bold text-gray-800 mb-4">My Results</h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{result.exams.title}</h3>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(result.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {result.rank && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">#{result.rank}</div>
                        <div className="text-xs text-gray-500">Rank</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.score}</div>
                      <div className="text-xs text-gray-600">Correct</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">{result.total_questions}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{result.percentage.toFixed(1)}%</div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {result.total_time ? `${Math.floor(result.total_time / 60)}m` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Time</div>
                    </div>
                  </div>

                  {result.certificate_url && (
                    <a
                      href={result.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Certificate
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}