import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, BarChart2, LogOut, Globe, Globe2 } from 'lucide-react';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const togglePublish = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:5001/api/quizzes/${id}`, 
        { isPublished: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQuizzes();
    } catch (err) {
      console.error('Failed to toggle publish status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" /> <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 p-6 max-w-5xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Quizzes</h2>
          <button 
            onClick={() => navigate('/admin/quiz/new')}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> Create Quiz
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(quiz => (
            <div key={quiz._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-gray-800 line-clamp-1" title={quiz.title}>{quiz.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${quiz.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description || 'No description'}</p>
              
              <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between gap-2">
                <button 
                  onClick={() => navigate(`/admin/quiz/${quiz._id}/edit`)}
                  className="flex-1 flex justify-center items-center gap-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 py-1.5 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => navigate(`/admin/quiz/${quiz._id}/results`)}
                  className="flex-1 flex justify-center items-center gap-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 py-1.5 rounded transition-colors"
                >
                  <BarChart2 className="w-4 h-4" /> Results
                </button>
                <button 
                  onClick={() => togglePublish(quiz._id, quiz.isPublished)}
                  className={`flex-1 flex justify-center items-center gap-1.5 text-sm font-medium py-1.5 rounded transition-colors ${
                    quiz.isPublished ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {quiz.isPublished ? <Globe className="w-4 h-4" /> : <Globe2 className="w-4 h-4" />}
                  {quiz.isPublished ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 border-dashed rounded-xl p-12 text-center text-gray-500">
              <p>No quizzes found. Create your first quiz!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
