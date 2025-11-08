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
  const [questionPage, setQuestionPage] = useState(0);
  const questionsPerPage = 15;

  const autosave = useCallback(async () => {
    if (Object.keys(answers).length > 0) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        await fetch(`${API_URL}/exam/${examId}/autosave`, {
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
        console.log('Exam started:', data);
        setExam(data.exam);
        setQuestions(data.questions);
        setStartTime(new Date());
        setServerStartTime(new Date(data.startTime));
        
        // Calculate time left from exam duration
        const durationInSeconds = data.exam.duration * 60;
        setTimeLeft(durationInSeconds);
        
        // Initialize question times
        const times = {};
        data.questions.forEach(q => { times[q.id] = 0; });
        setQuestionTimes(times);
        
        setLoading(false);
      } catch (error) {
        console.error('Start exam error:', error);
        console.error('Error response:', error.response?.data);
        const errorMsg = error.response?.data?.error || 'Failed to start exam';
        alert(errorMsg);
        setLoading(false);
        setTimeout(() => router.push('/employee'), 2000);
      }
    };
    loadExam();
  }, [examId, router]);

  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loading, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !submitting && !loading && questions.length > 0 && startTime) {
      handleSubmit(true);
    }
  }, [timeLeft, submitting, loading, questions.length, startTime]);

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

  const submitWithRetry = async (answers, totalTime, submittedAt, clientCalc, maxRetries = 5) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Submit attempt ${attempt}/${maxRetries}`);
        
        const result = await submitExam(
          examId, 
          answers, 
          totalTime, 
          submittedAt,
          clientCalc.answeredCount,
          0
        );
        
        console.log('Submit successful:', result);
        return result;
        
      } catch (error) {
        lastError = error;
        console.error(`Submit attempt ${attempt} failed:`, error);
        console.error('Error details:', error.response?.data);
        
        // Don't retry if already submitted
        if (error.response?.data?.message?.includes('already submitted')) {
          console.log('Exam already submitted, treating as success');
          return error.response.data;
        }
        
        // Don't retry on time exceeded errors
        if (error.response?.data?.error?.includes('time exceeded')) {
          console.log('Time exceeded, not retrying');
          throw error;
        }
        
        // Don't retry on other validation errors (except network errors)
        if (error.response?.status === 400 && error.response?.data?.error) {
          console.log('Validation error, not retrying');
          throw error;
        }
        
        // Retry on network errors or 500 errors
        if (!error.response || error.response?.status >= 500) {
          if (attempt < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`Network/server error, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        // For other errors, throw immediately
        if (attempt >= maxRetries) {
          throw lastError;
        }
      }
    }
    
    throw lastError;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) {
      console.log('Already submitting, ignoring duplicate request');
      return;
    }
    
    setSubmitting(true);
    
    if (!autoSubmit) {
      const answeredCount = Object.keys(answers).length;
      const totalQuestions = questions.length;
      const confirmMessage = `You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit your exam?`;
      
      const confirmSubmit = window.confirm(confirmMessage);
      if (!confirmSubmit) {
        setSubmitting(false);
        return;
      }
    }

    try {
      const totalTime = Math.floor((new Date() - startTime) / 1000);
      const clientCalc = calculateClientScore();
      
      // Validate we have the required data
      if (!examId || !startTime) {
        throw new Error('Missing exam data. Please refresh and try again.');
      }
      
      console.log('Submitting exam:', {
        examId,
        answersCount: Object.keys(answers).length,
        totalTime,
        clientCalc,
        timestamp: new Date().toISOString()
      });
      
      // Submit with retry logic
      const result = await submitWithRetry(
        answers,
        totalTime,
        new Date().toISOString(),
        clientCalc
      );
      
      console.log('Submit result:', result);
      
      // Store result with question times for display
      const resultWithTimes = {
        ...result.result,
        questionTimes,
        averageTimePerQuestion: totalTime / questions.length
      };
      
      localStorage.setItem('examResult', JSON.stringify(resultWithTimes));
      router.push(`/exam/${examId}/result`);
    } catch (error) {
      console.error('Submit error:', error);
      console.error('Error response:', error.response?.data);
      
      // More detailed error message
      let errorMessage = 'Failed to submit exam';
      let canRetryManually = true;
      
      if (error.response?.data?.error) {
        const serverError = error.response.data.error;
        errorMessage = serverError;
        
        // Check if already submitted
        if (serverError.includes('already submitted')) {
          errorMessage = 'Exam already submitted successfully!';
          canRetryManually = false;
          // Try to redirect to results
          setTimeout(() => router.push(`/exam/${examId}/result`), 2000);
        }
        
        // Check if time exceeded
        if (serverError.includes('time exceeded')) {
          errorMessage = 'Exam time has expired. Please contact your administrator.';
          canRetryManually = false;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (canRetryManually) {
        errorMessage += '\n\nPlease try again or contact support if the problem persists.';
      }
      
      alert(errorMessage);
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

      <div className="flex flex-col md:flex-row">
        {/* Question Navigation */}
        <div className="w-full md:w-64 bg-white p-4 shadow-md">
          <h3 className="font-semibold mb-2">Questions</h3>
          
          {/* Legend */}
          <div className="mb-3 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span>Not Answered</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.slice(questionPage * questionsPerPage, (questionPage + 1) * questionsPerPage).map((_, idx) => {
              const index = questionPage * questionsPerPage + idx;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded text-sm font-medium transition ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white shadow-lg'
                      : answers[questions[index]?.id]
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {questions.length > questionsPerPage && (
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={() => setQuestionPage(Math.max(0, questionPage - 1))}
                disabled={questionPage === 0}
                className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-xs text-gray-600">
                {questionPage + 1}/{Math.ceil(questions.length / questionsPerPage)}
              </span>
              <button
                onClick={() => setQuestionPage(Math.min(Math.ceil(questions.length / questionsPerPage) - 1, questionPage + 1))}
                disabled={questionPage >= Math.ceil(questions.length / questionsPerPage) - 1}
                className="px-2 py-1 text-xs bg-gray-200 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}

          <div className="mt-4 text-sm text-gray-600 border-t pt-3">
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