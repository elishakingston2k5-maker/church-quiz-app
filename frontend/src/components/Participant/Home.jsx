import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen } from 'lucide-react';

export default function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axios.get('/api/quizzes/published');
        setQuizzes(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch quizzes', err);
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl mt-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-primary-600 h-3 w-full"></div>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-primary-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800">Church Bible Quizzes</h1>
          </div>
          <p className="text-gray-600 mb-8">Welcome to the online quiz portal. Please select an available quiz below to test your knowledge.</p>
          
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Available Quizzes</h2>
          
          {loading ? (
            <p className="text-gray-500">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 border border-gray-200">
              No quizzes are currently active. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map(quiz => (
                <div key={quiz._id} className="border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200 flex justify-between items-center bg-white group">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 group-hover:text-primary-600 transition-colors">{quiz.title}</h3>
                    {quiz.description && <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>}
                    {quiz.timerMinutes > 0 && (
                      <span className="inline-block mt-2 text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        ⏱ {quiz.timerMinutes} min
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
