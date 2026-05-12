import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Clock, BarChart2 } from 'lucide-react';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const [subRes, quizRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/submissions/quiz/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`http://localhost:5001/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setSubmissions(subRes.data);
        setQuiz(quizRes.data);
      } catch (err) {
        console.error('Failed to load results');
      }
    };
    fetchResults();
  }, [id]);

  const handleScoreUpdate = async (subId, manualScore, isFullyGraded) => {
    try {
      await axios.put(`http://localhost:5001/api/submissions/${subId}/score`, { manualScore, isFullyGraded }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // update local state
      setSubmissions(submissions.map(s => s._id === subId ? { ...s, manualScore, isFullyGraded } : s));
      if (selectedSub && selectedSub._id === subId) {
        setSelectedSub({ ...selectedSub, manualScore, isFullyGraded });
      }
    } catch (err) {
      console.error('Failed to update score');
    }
  };

  if (!quiz) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const totalPossiblePoints = quiz.questions.reduce((acc, q) => acc + q.points, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800 mr-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Results: {quiz.title}</h1>
      </header>

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-700">
            {submissions.length} Submissions
          </div>
          <div className="overflow-y-auto flex-1">
            {submissions.map(sub => (
              <div 
                key={sub._id}
                onClick={() => setSelectedSub(sub)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedSub?._id === sub._id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
              >
                <div className="font-medium text-gray-800">{sub.participantName}</div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    {sub.isFullyGraded ? (
                      <span className="text-green-600 flex items-center gap-1 font-medium"><CheckCircle className="w-3 h-3" /> Graded</span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> Needs Review</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {submissions.length === 0 && <div className="p-6 text-center text-gray-500">No submissions yet.</div>}
          </div>
        </div>

        {/* Submission Details & Grading */}
        <div className="md:col-span-2">
          {selectedSub ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedSub.participantName}'s Answers</h2>
                  <p className="text-gray-500 text-sm mt-1">Submitted on {new Date(selectedSub.submittedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">{selectedSub.autoScore + selectedSub.manualScore} <span className="text-lg text-gray-400">/ {totalPossiblePoints}</span></div>
                  <div className="text-sm text-gray-500 mt-1">Total Score</div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {quiz.questions.map((q, i) => {
                  const pAnswer = selectedSub.answers[q.id];
                  const isAutoGraded = ['MCQ', 'CHECKBOX', 'FILL_BLANKS', 'MATCHING'].includes(q.type);
                  
                  return (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-gray-800"><span className="text-gray-400 mr-2">{i + 1}.</span>{q.text}</h3>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">{q.points} pts</span>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded mb-4">
                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1 block">Participant's Answer</span>
                        {q.type === 'MATCHING' && pAnswer ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.entries(pAnswer).map(([l, r], idx) => (
                              <div key={idx} className="bg-white px-3 py-2 rounded shadow-sm text-sm border border-blue-100">
                                <span className="font-medium">{l}</span> ➡️ {r}
                              </div>
                            ))}
                          </div>
                        ) : q.type === 'CHECKBOX' && Array.isArray(pAnswer) ? (
                          <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                            {pAnswer.map((a, idx) => <li key={idx}>{a}</li>)}
                          </ul>
                        ) : (
                          <div className="text-gray-800 whitespace-pre-wrap">{pAnswer || <span className="text-gray-400 italic">No answer provided</span>}</div>
                        )}
                      </div>

                      <div className="bg-green-50 p-4 rounded">
                        <span className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1 block">Expected Answer</span>
                        {q.type === 'MATCHING' && q.correctAnswer ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.entries(q.correctAnswer).map(([l, r], idx) => (
                              <div key={idx} className="bg-white px-3 py-2 rounded shadow-sm text-sm border border-green-100">
                                <span className="font-medium">{l}</span> ➡️ {r}
                              </div>
                            ))}
                          </div>
                        ) : q.type === 'CHECKBOX' && Array.isArray(q.correctAnswer) ? (
                          <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                            {q.correctAnswer.map((a, idx) => <li key={idx}>{a}</li>)}
                          </ul>
                        ) : (
                          <div className="text-gray-800">{q.correctAnswer || <span className="text-gray-400 italic">Not specified</span>}</div>
                        )}
                      </div>

                      {!isAutoGraded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Manual Grading Required</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Points awarded:</span>
                            <input 
                              type="number"
                              min="0"
                              max={q.points}
                              value={selectedSub.manualScore || 0} // In a real app, track manual score per question. For simplicity, we just add to total.
                              onChange={(e) => {
                                // This is simplified. Proper implementation needs per-question manual scoring.
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded"
                              disabled
                              title="Simplified: Use the total manual score input below"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 flex justify-between items-center">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSub.isFullyGraded}
                      onChange={(e) => handleScoreUpdate(selectedSub._id, selectedSub.manualScore, e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as fully graded</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Total Manual Points:</span>
                  <input 
                    type="number" 
                    value={selectedSub.manualScore}
                    onChange={(e) => handleScoreUpdate(selectedSub._id, Number(e.target.value), selectedSub.isFullyGraded)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 border-dashed h-full flex items-center justify-center text-gray-400 flex-col gap-4">
              <BarChart2 className="w-12 h-12 text-gray-300" />
              <p>Select a submission from the list to view details</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
