'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  addQuestion, 
  getMyQuestions, 
  getAllQuestions,
  getAssignedQuestions,
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
  getContributorStats,
  getContributorProfile 
} from '@/lib/api';
import Head from 'next/head';

function EditableQuestionCard({ question, onUpdate, setFeedback }) {
  const [form, setForm] = useState({
    question: question.question,
    options: question.options || { A: '', B: '', C: '', D: '' },
    correctAnswer: question.correct_answer,
    difficulty: question.difficulty,
    subject: question.category || question.subject || '',
    lot: question.lot || '',
    majorSubject: question.major_subject || ''
  });

  const handleUpdate = async (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    try {
      await updateQuestion(question.id, {
        ...updated,
        category: updated.subject,
        majorSubject: updated.majorSubject
      });
      setFeedback({ success: 'Updated!' });
      setTimeout(() => setFeedback({ success: '' }), 2000);
      onUpdate();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to update.' });
    }
  };

  return (
    <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all">
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Question</label>
        <textarea
          value={form.question}
          onChange={(e) => handleUpdate('question', e.target.value)}
          className="w-full p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          rows="2"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {Object.entries(form.options).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Option {key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleUpdate('options', { ...form.options, [key]: e.target.value })}
              className={`w-full p-2 border-2 rounded-lg transition-all ${
                form.correctAnswer === key 
                  ? 'border-green-400 bg-green-50 font-semibold' 
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Correct</label>
          <select
            value={form.correctAnswer}
            onChange={(e) => handleUpdate('correctAnswer', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => handleUpdate('difficulty', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => handleUpdate('subject', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Lot</label>
          <input
            type="text"
            value={form.lot}
            onChange={(e) => handleUpdate('lot', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Major Subject</label>
          <input
            type="text"
            value={form.majorSubject}
            onChange={(e) => handleUpdate('majorSubject', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-blue-500"
            placeholder="e.g., Electrical"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          question.status === 'approved' ? 'bg-green-500 text-white' :
          question.status === 'rejected' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          {question.status.toUpperCase()}
        </span>
        <span className="text-xs text-gray-500 italic">Auto-saves on change</span>
      </div>
    </div>
  );
}

function QuestionCard({ question, onUpdate, setFeedback }) {
  const [form, setForm] = useState({
    question: question.question,
    options: question.options || { A: '', B: '', C: '', D: '' },
    correctAnswer: question.correct_answer,
    difficulty: question.difficulty,
    subject: question.category || question.subject || '',
    majorSubject: question.major_subject || ''
  });

  const handleUpdate = async (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    try {
      await updateQuestion(question.id, {
        ...updated,
        category: updated.subject,
        majorSubject: updated.majorSubject
      });
      setFeedback({ success: 'Updated!' });
      setTimeout(() => setFeedback({ success: '' }), 2000);
      onUpdate();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Failed to update.' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion(question.id);
      setFeedback({ success: 'Deleted!' });
      onUpdate();
    } catch (err) {
      setFeedback({ error: 'Failed to delete.' });
    }
  };

  return (
    <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg transition-all">
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-600 mb-1 block">Question</label>
        <textarea
          value={form.question}
          onChange={(e) => handleUpdate('question', e.target.value)}
          className="w-full p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          rows="2"
          disabled={question.status !== 'pending'}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {Object.entries(form.options).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Option {key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleUpdate('options', { ...form.options, [key]: e.target.value })}
              className={`w-full p-2 border-2 rounded-lg transition-all ${
                form.correctAnswer === key 
                  ? 'border-green-400 bg-green-50 font-semibold' 
                  : 'border-gray-300 focus:border-purple-500'
              }`}
              disabled={question.status !== 'pending'}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Correct</label>
          <select
            value={form.correctAnswer}
            onChange={(e) => handleUpdate('correctAnswer', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
            disabled={question.status !== 'pending'}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Difficulty</label>
          <select
            value={form.difficulty}
            onChange={(e) => handleUpdate('difficulty', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
            disabled={question.status !== 'pending'}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Subject</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => handleUpdate('subject', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
            disabled={question.status !== 'pending'}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Lot</label>
          <input
            type="text"
            value={form.lot || ''}
            onChange={(e) => handleUpdate('lot', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
            disabled={question.status !== 'pending'}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Major Subject</label>
          <input
            type="text"
            value={form.majorSubject}
            onChange={(e) => handleUpdate('majorSubject', e.target.value)}
            className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-purple-500"
            placeholder="e.g., Civil"
            disabled={question.status !== 'pending'}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          question.status === 'approved' ? 'bg-green-500 text-white' :
          question.status === 'rejected' ? 'bg-red-500 text-white' :
          'bg-yellow-500 text-white'
        }`}>
          {question.status.toUpperCase()}
        </span>
        <div className="flex gap-2 items-center">
          {question.status === 'pending' && (
            <>
              <span className="text-xs text-gray-500 italic">Auto-saves</span>
              <button
                onClick={handleDelete}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                🗑️ Delete
              </button>
            </>
          )}
          {question.status !== 'pending' && (
            <span className="text-xs text-gray-500 italic">Read-only ({question.status})</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContributorDashboard() {
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [assignedQuestions, setAssignedQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [form, setForm] = useState({
    question: '',
    type: 'mcq',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: '',
    difficulty: 'medium',
    subject: '',
    lot: '',
    majorSubject: '',
  });
  const [loading, setLoading] = useState({ 
    submit: false, 
    questions: false, 
    upload: false 
  });
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.role !== 'contributor') {
      router.push('/');
      return;
    }
    
    setIsAuthenticated(true);
    loadUserProfile();
    loadQuestions();
    loadAllQuestions();
    loadAssignedQuestions();
    loadStats();
  }, [router]);

  const loadUserProfile = async () => {
    try {
      const data = await getContributorProfile();
      setUserProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadQuestions = async () => {
    setLoading((prev) => ({ ...prev, questions: true }));
    try {
      const data = await getMyQuestions();
      setQuestions(data);
    } catch (err) {
      setFeedback({ error: 'Failed to load your questions.' });
    } finally {
      setLoading((prev) => ({ ...prev, questions: false }));
    }
  };

  const loadAllQuestions = async () => {
    try {
      const data = await getAllQuestions();
      setAllQuestions(data);
    } catch (err) {
      console.error('Failed to load all questions:', err);
    }
  };

  const loadAssignedQuestions = async () => {
    try {
      const data = await getAssignedQuestions();
      setAssignedQuestions(data);
    } catch (err) {
      console.error('Failed to load assigned questions:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getContributorStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, submit: true }));
    setFeedback({ error: '', success: '' });
    try {
      await addQuestion({
        ...form,
        options: form.options,
        correctAnswer: form.correctAnswer,
        category: form.subject,
        lot: form.lot,
        majorSubject: form.majorSubject
      });
      setFeedback({ success: 'Question submitted for approval!' });
      setForm({
        question: '',
        type: 'mcq',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: '',
        difficulty: 'medium',
        subject: '',
        lot: '',
        majorSubject: '',
      });
      loadQuestions();
      loadAllQuestions();
      loadAssignedQuestions();
      loadStats();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Submission failed.' });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading((prev) => ({ ...prev, upload: true }));
    setFeedback({ error: '', success: '' });
    
    try {
      const result = await bulkUploadQuestions(file);
      setFeedback({ success: result.message });
      setFile(null);
      loadQuestions();
      loadAllQuestions();
      loadAssignedQuestions();
      loadStats();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Bulk upload failed.' });
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

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

  return (
    <div className="min-h-screen p-8">
      <Head>
        <title>Contributor Dashboard - HR Exam System</title>
      </Head>
      <h1 className="text-3xl font-bold mb-8">Contributor Dashboard</h1>

      {feedback.error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{feedback.error}</p>}
      {feedback.success && <p className="text-green-500 bg-green-100 p-3 rounded mb-4">{feedback.success}</p>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Total</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800">Pending</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Approved</h3>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800">Rejected</h3>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['profile', 'add', 'bulk', 'manage', 'assigned', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'profile' ? 'My Profile' : tab === 'add' ? 'Add Question' : tab === 'bulk' ? 'Bulk Upload' : tab === 'manage' ? 'My Questions' : tab === 'assigned' ? 'Assigned to Me' : 'All Questions'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-6">My Profile</h2>
          {userProfile && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="p-3 bg-gray-50 border rounded-lg">{userProfile.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <p className="p-3 bg-gray-50 border rounded-lg">{userProfile.employee_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="p-3 bg-gray-50 border rounded-lg">{userProfile.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="p-3 bg-gray-50 border rounded-lg">{userProfile.department || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="p-3 bg-blue-50 border rounded-lg text-blue-700 font-medium">{userProfile.role}</p>
                </div>
              </div>
              
              {stats && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">My Statistics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                      <p className="text-sm text-blue-800">Total Questions</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                      <p className="text-sm text-yellow-800">Pending</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                      <p className="text-sm text-green-800">Approved</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                      <p className="text-sm text-red-800">Rejected</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Quick Actions</h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add New Question
                  </button>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    View Assigned Questions
                  </button>
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/';
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Add Question</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Question"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            required
            disabled={loading.submit}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading.submit}
          >
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
          {form.type === 'mcq' && (
            <>
              {Object.entries(form.options).map(([key, value]) => (
                <input
                  key={key}
                  type="text"
                  placeholder={`Option ${key}`}
                  value={value}
                  onChange={(e) => setForm({ 
                    ...form, 
                    options: { ...form.options, [key]: e.target.value } 
                  })}
                  className="w-full p-2 mb-2 border rounded"
                  disabled={loading.submit}
                />
              ))}
            </>
          )}
          <input
            type="text"
            placeholder="Correct Answer"
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            required
            disabled={loading.submit}
          />
          <select
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading.submit}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading.submit}
          />
          <input
            type="text"
            placeholder="Lot (e.g., Lot-1, Lot-2)"
            value={form.lot}
            onChange={(e) => setForm({ ...form, lot: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading.submit}
          />
          <input
            type="text"
            placeholder="Major Subject (e.g., Electrical Engineering, Civil Engineering)"
            value={form.majorSubject}
            onChange={(e) => setForm({ ...form, majorSubject: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            disabled={loading.submit}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-400"
            disabled={loading.submit}
          >
            {loading.submit ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Bulk Upload Questions</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Upload questions using Excel format. Required columns: Question, Option A, Option B, Option C, Option D, Correct Answer, Difficulty, Subject
            </p>
          </div>
          <form onSubmit={handleBulkUpload}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
              className="mb-4"
              disabled={loading.upload}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:bg-green-400"
              disabled={!file || loading.upload}
            >
              {loading.upload ? 'Uploading...' : 'Upload Questions'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">My Questions ({questions.length})</h2>
          {loading.questions ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard 
                  key={q.id} 
                  question={q} 
                  onUpdate={() => { loadQuestions(); loadAllQuestions(); loadAssignedQuestions(); }}
                  setFeedback={setFeedback}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assigned' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Questions Assigned to Me ({assignedQuestions.length})</h2>
          <div className="space-y-4">
            {assignedQuestions.map((q) => (
              <EditableQuestionCard 
                key={q.id} 
                question={q} 
                onUpdate={() => { loadQuestions(); loadAllQuestions(); loadAssignedQuestions(); }}
                setFeedback={setFeedback}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">All Questions ({allQuestions.length})</h2>
          <div className="space-y-4">
            {allQuestions.map((q) => (
              <div key={q.id} className="border rounded-lg p-4">
                <p className="font-semibold mb-2">{q.question}</p>
                {q.options && (
                  <div className="grid grid-cols-2 gap-2 mb-2 text-sm text-gray-600">
                    {Object.entries(q.options).map(([key, value]) => (
                      <p key={key} className={q.correct_answer === key ? 'text-green-600 font-medium' : ''}>
                        {key}) {value}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      q.status === 'approved' ? 'bg-green-100 text-green-800' :
                      q.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-gray-600">Difficulty: {q.difficulty}</span>
                    <span className="text-gray-600">Subject: {q.category || q.subject || 'N/A'}</span>
                    <span className="text-gray-600">By: {q.users?.name || 'Unknown'}</span>
                  </div>
                  <button
                    onClick={() => {
                      const newQuestion = prompt('Edit question:', q.question);
                      if (newQuestion && newQuestion !== q.question) {
                        updateQuestion(q.id, {
                          question: newQuestion,
                          type: q.type,
                          options: q.options,
                          correctAnswer: q.correct_answer,
                          difficulty: q.difficulty,
                          category: q.category
                        }).then(() => {
                          setFeedback({ success: 'Question updated!' });
                          loadAllQuestions();
                        }).catch(() => {
                          setFeedback({ error: 'Failed to update question.' });
                        });
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Quick Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
