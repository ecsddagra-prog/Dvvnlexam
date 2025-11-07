'use client';
import { useState, useEffect } from 'react';
import { 
  addQuestion, 
  getMyQuestions, 
  bulkUploadQuestions,
  updateQuestion,
  deleteQuestion,
  getContributorStats 
} from '@/lib/api';
import Head from 'next/head';

export default function ContributorDashboard() {
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('add');
  const [form, setForm] = useState({
    question: '',
    type: 'mcq',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: '',
    difficulty: 'medium',
    subject: '',
  });
  const [loading, setLoading] = useState({ 
    submit: false, 
    questions: false, 
    upload: false 
  });
  const [feedback, setFeedback] = useState({ error: '', success: '' });

  useEffect(() => {
    loadQuestions();
    loadStats();
  }, []);

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
        category: form.subject
      });
      setFeedback({ success: 'Question submitted for approval!' });
      setForm({
        question: '',
        type: 'mcq',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: '',
        difficulty: 'medium',
        subject: '',
      });
      loadQuestions();
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
      loadStats();
    } catch (err) {
      setFeedback({ error: err.response?.data?.error || 'Bulk upload failed.' });
    } finally {
      setLoading((prev) => ({ ...prev, upload: false }));
    }
  };

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
            {['add', 'bulk', 'manage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'add' ? 'Add Question' : tab === 'bulk' ? 'Bulk Upload' : 'My Questions'}
              </button>
            ))}
          </nav>
        </div>
      </div>

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
                <div key={q.id} className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">{q.question}</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        q.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : q.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-gray-600">Difficulty: {q.difficulty}</span>
                    <span className="text-gray-600">Subject: {q.subject || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
