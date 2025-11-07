'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ExamResultPage() {
  const { id: examId } = useParams();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const storedResult = localStorage.getItem('examResult');
        if (storedResult) {
          setResult(JSON.parse(storedResult));
          localStorage.removeItem('examResult');
        }
      } catch (error) {
        console.error('Failed to load result:', error);
        router.push('/employee');
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [examId, router]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading results...</div>;
  if (!result) return <div className="flex justify-center items-center h-screen">No results found</div>;

  const passed = result.percentage >= 50;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className={`p-6 ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? '🎉' : '😔'}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {passed ? 'Congratulations!' : 'Better Luck Next Time'}
              </h1>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{result.score}</div>
                <div className="text-sm text-gray-500">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{result.total_questions || result.totalQuestions}</div>
                <div className="text-sm text-gray-500">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.percentage.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Score Percentage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {result.rank ? `#${result.rank}` : '⏳'}
                </div>
                <div className="text-sm text-gray-500">{result.rank ? 'Rank' : 'Calculating...'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Performance Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Correct:</span>
                    <span className="text-green-600 font-medium">{result.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wrong:</span>
                    <span className="text-red-600 font-medium">{(result.total_questions || result.totalQuestions) - result.score}</span>
                  </div>
                  {result.total_time && (
                    <>
                      <div className="flex justify-between">
                        <span>Total Time:</span>
                        <span className="font-medium">{Math.floor(result.total_time / 60)}m {result.total_time % 60}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Time/Question:</span>
                        <span className="font-medium">
                          {result.averageTimePerQuestion 
                            ? `${result.averageTimePerQuestion.toFixed(1)}s`
                            : `${(result.total_time / (result.total_questions || result.totalQuestions)).toFixed(1)}s`
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Ranking</h3>
                <div className="text-center">
                  {result.rank ? (
                    <>
                      <div className="text-4xl font-bold text-purple-600 mb-2">#{result.rank}</div>
                      <div className="text-sm text-gray-600">Among all participants</div>
                      {result.rank <= 3 && (
                        <div className="mt-2">
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            🏆 Top Performer
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <div className="text-2xl mb-2">⏳</div>
                      Rank is being calculated...
                      <div className="text-xs mt-2">Refresh in a few seconds</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {result.certificate_url && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">Certificate Available</h3>
                    <p className="text-blue-600 text-sm">Download your completion certificate</p>
                  </div>
                  <a
                    href={result.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/employee')}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}