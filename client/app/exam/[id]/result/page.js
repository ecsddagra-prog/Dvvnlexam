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

  const passed = (result.percentage || 0) >= 50;

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{result.score}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{(result.total_questions || result.totalQuestions) - result.score}</div>
                <div className="text-sm text-gray-600">Wrong</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{Object.keys(result.answers || {}).length}</div>
                <div className="text-sm text-gray-600">Attempted</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-600">{(result.total_questions || result.totalQuestions) - Object.keys(result.answers || {}).length}</div>
                <div className="text-sm text-gray-600">Unattempted</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {result.rank ? `#${result.rank}` : '⏳'}
                </div>
                <div className="text-sm text-gray-600">{result.rank ? 'Rank' : 'Calculating'}</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8 text-center">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                {(result.percentage || 0).toFixed(1)}%
              </div>
              <div className="text-gray-600 font-medium">Overall Score</div>
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

            {passed && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">🎓 Certificate</h3>
                    <p className="text-blue-600 text-sm">
                      {result.certificate_url ? 'Download your completion certificate' : 'Generate your completion certificate'}
                    </p>
                  </div>
                  {result.certificate_url ? (
                    <a
                      href={result.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      📥 Download
                    </a>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`/api/employee/results/${result.id}/generate-certificate`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const data = await res.json();
                          if (data.certificateUrl) {
                            setResult({ ...result, certificate_url: data.certificateUrl });
                            alert('Certificate generated successfully!');
                          }
                        } catch (err) {
                          alert('Failed to generate certificate');
                        }
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      ✨ Generate Certificate
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  window.close();
                  setTimeout(() => router.push('/employee'), 100);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}