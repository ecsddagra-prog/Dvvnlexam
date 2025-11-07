'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { startExam, submitExam } from '@/lib/api';

export default function ExamPage() {
  const router = useRouter();
  const { id: examId } = useParams();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [serverStartTime, setServerStartTime] = useState(null);

  const autosave = useCallback(async () => {
    if (Object.keys(answers).length > 0) {
      try {
        await fetch(`/api/exam/${examId}/autosave`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ answers })
        });
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }
  }, [examId, answers]);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const data = await startExam(examId);
        setExam(data.exam);
        setQuestions(data.questions);
        setStartTime(new Date());
        setServerStartTime(new Date(data.startedAt));
        
        // Calculate time left based on server time
        const serverNow = new Date(data.serverTime);
        const endsAt = new Date(data.endsAt);
        const timeLeftSeconds = Math.floor((endsAt - serverNow) / 1000);
        setTimeLeft(Math.max(0, timeLeftSeconds));
        
        // Initialize question times
        const times = {};
        data.questions.forEach(q => { times[q.id] = 0; });
        setQuestionTimes(times);
        
        setLoading(false);
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to start exam');
        router.push('/employee');
      }
    };
    loadExam();
  }, [examId, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !submitting) {
      handleSubmit();
    }
  }, [timeLeft, submitting]);

  useEffect(() => {
    // Track time per question
    const interval = setInterval(() => {
      if (questions[currentQuestion]) {
        setQuestionTimes(prev => ({
          ...prev,
          [questions[currentQuestion].id]: (prev[questions[currentQuestion].id] || 0) + 1
        }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion, questions]);

  useEffect(() => {
    // Autosave disabled to minimize server hits - only save on submit
    // const interval = setInterval(autosave, 30000);
    // return () => clearInterval(interval);
  }, [autosave]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const calculateClientScore = () => {
    let score = 0;
    const correctAnswers = [];
    const wrongAnswers = [];
    
    questions.forEach(q => {
      // Note: In production, correct answers should NOT be sent to client
      // This is for demo - server validates the actual score
      const userAnswer = answers[q.id];
      if (userAnswer) {
        // Client doesn't know correct answer, just track what was answered
        correctAnswers.push(q.id);
      }
    });
    
    return {
      answeredCount: correctAnswers.length,
      totalQuestions: questions.length
    };
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const confirmSubmit = window.confirm('Are you sure you want to submit your exam?');
    if (!confirmSubmit) return;

    setSubmitting(true);
    try {
      const totalTime = Math.floor((new Date() - startTime) / 1000);
      const clientCalc = calculateClientScore();
      
      // Submit with client calculation for validation
      const result = await submitExam(
        examId, 
        answers, 
        totalTime, 
        new Date().toISOString(),
        clientCalc.answeredCount, // Client doesn't calculate actual score
        0 // Client doesn't calculate percentage
      );
      
      // Store result with question times for display
      const resultWithTimes = {
        ...result.result,
        questionTimes,
        averageTimePerQuestion: totalTime / questions.length
      };
      
      localStorage.setItem('examResult', JSON.stringify(resultWithTimes));
      router.push(`/exam/${examId}/result`);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading exam...</div>;

  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{exam.title}</h1>
        <div className="flex items-center space-x-4">
          <div className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-600' : 'text-green-600'}`}>
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Question Navigation */}
        <div className="w-64 bg-white p-4 shadow-md">
          <h3 className="font-semibold mb-4">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[questions[index]?.id]
                    ? 'bg-green-200 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <div>Answered: {Object.keys(answers).length}/{questions.length}</div>
            <div>Remaining: {questions.length - Object.keys(answers).length}</div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6">
          {question && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
                <h2 className="text-lg font-semibold mt-2">{question.question}</h2>
              </div>

              {question.type === 'mcq' && (
                <div className="space-y-3">
                  {Object.entries(question.options).map(([key, value]) => (
                    value && (
                      <label key={key} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={key}
                          checked={answers[question.id] === key}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-4 h-4"
                        />
                        <span>{key}. {value}</span>
                      </label>
                    )
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === questions.length - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}