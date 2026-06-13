import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import InteractiveMatching from './InteractiveMatching';

export default function QuizTaker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [participantName, setParticipantName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch quiz details
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`/api/quizzes/published/${id}`);
        setQuiz(res.data);
      } catch (err) {
        setError('Quiz not found or not available.');
      }
    };
    fetchQuiz();
  }, [id]);

  // Load saved progress
  useEffect(() => {
    if (hasStarted) {
      const saved = localStorage.getItem(`quiz_${id}_progress`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers || {});
          if (parsed.timeLeft && quiz?.timerMinutes) {
             // Basic restoration. In a real app, calculate elapsed time since startedAt
             setTimeLeft(parsed.timeLeft);
          }
        } catch (e) {}
      } else if (quiz?.timerMinutes) {
        setTimeLeft(quiz.timerMinutes * 60);
      }
    }
  }, [hasStarted, id, quiz]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (hasStarted && timeLeft !== null && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          // Auto save time and answers
          localStorage.setItem(`quiz_${id}_progress`, JSON.stringify({ answers, timeLeft: newTime }));
          if (newTime <= 0) {
            clearInterval(timer);
            handleSubmit(true);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, submitted, answers]);

  const handleAnswerChange = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (hasStarted) {
      localStorage.setItem(`quiz_${id}_progress`, JSON.stringify({ answers: newAnswers, timeLeft }));
    }
  };

  const performSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmModal(false);
    try {
      await axios.post('/api/submissions', {
        quizId: id,
        participantName,
        answers
      });
      setSubmitted(true);
      localStorage.removeItem(`quiz_${id}_progress`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (isAutoSubmit = false) => {
    if (!participantName.trim()) {
      alert("Please enter your name before submitting.");
      return;
    }

    if (isAutoSubmit) {
      performSubmit();
    } else {
      setShowConfirmModal(true);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return <div className="min-h-screen flex justify-center pt-20 text-gray-500">Loading quiz...</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Quiz Submitted!</h2>
          <p className="text-gray-600 mb-8">Thank you, {participantName}. Your answers have been recorded successfully.</p>
          <button onClick={() => navigate('/')} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors w-full">
            Return to Home Page
          </button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
          <div className="border-b border-gray-100 pb-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description}</p>
            {quiz.timerMinutes > 0 && (
              <div className="mt-4 flex items-center gap-2 text-primary-700 bg-primary-50 p-3 rounded-lg text-sm font-medium">
                <Clock className="w-5 h-5" /> This quiz has a time limit of {quiz.timerMinutes} minutes.
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <input 
                type="text"
                required
                value={participantName}
                onChange={e => setParticipantName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>
            <button 
              onClick={() => {
                if(participantName.trim().length < 2) {
                  alert("Please enter a valid name.");
                  return;
                }
                setHasStarted(true);
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface Renderers
  const renderQuestionInput = (q, index) => {
    const pAnswer = answers[q.id];

    if (q.type === 'MCQ') {
      return (
        <div className="space-y-3 mt-4">
          {q.options.map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${pAnswer === opt ? 'bg-primary-50 border-primary-500' : 'hover:bg-gray-50 border-gray-200'}`}>
              <input 
                type="radio" 
                name={q.id}
                value={opt}
                checked={pAnswer === opt}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (q.type === 'CHECKBOX') {
      const selectedOpts = Array.isArray(pAnswer) ? pAnswer : [];
      return (
        <div className="space-y-3 mt-4">
          {q.options.map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedOpts.includes(opt) ? 'bg-primary-50 border-primary-500' : 'hover:bg-gray-50 border-gray-200'}`}>
              <input 
                type="checkbox" 
                checked={selectedOpts.includes(opt)}
                onChange={(e) => {
                  let newArr = [...selectedOpts];
                  if (e.target.checked) newArr.push(opt);
                  else newArr = newArr.filter(a => a !== opt);
                  handleAnswerChange(q.id, newArr);
                }}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANKS') {
      return (
        <div className="mt-4">
          <input 
            type="text" 
            value={pAnswer || ''}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            placeholder="Your answer"
          />
        </div>
      );
    }

    if (q.type === 'PARAGRAPH') {
      return (
        <div className="mt-4">
          <textarea 
            value={pAnswer || ''}
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-y"
            placeholder="Your answer"
            rows={5}
          />
        </div>
      );
    }

    if (q.type === 'MATCHING') {
      return (
        <InteractiveMatching 
          key={q.id}
          question={q}
          value={pAnswer || {}}
          onChange={(newVal) => handleAnswerChange(q.id, newVal)}
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 line-clamp-1">{quiz.title}</h1>
          <span className="text-sm text-gray-500">{participantName}</span>
        </div>
        
        {timeLeft !== null && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary-50 text-primary-700'}`}>
            <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto mt-8 px-4">
        {/* Progress bar */}
        <div className="mb-6 bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-500 mb-6 font-medium">Answered {Object.keys(answers).length} of {quiz.questions.length}</p>

        <div className="space-y-6">
          {quiz.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  <span className="text-gray-400 mr-2">{index + 1}.</span> {q.text}
                </h3>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded whitespace-nowrap">
                  {q.type === 'MATCHING' ? `${q.options.length} pts` : `${q.points} pts`}
                </span>
              </div>
              
              {renderQuestionInput(q, index)}
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors shadow-lg disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </main>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full transform transition-all duration-300 scale-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Submission</h3>
            <p className="text-gray-550 text-sm mb-6 leading-relaxed">
              Are you sure you want to submit your quiz? You will not be able to change your answers after this.
            </p>
            
            {/* Progress stats */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-6 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Total Questions:</span>
                <span className="text-gray-800 font-bold">{quiz.questions.length}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Answered Questions:</span>
                <span className="text-primary-600 font-bold">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-650 font-medium">
                <span>Unanswered Questions:</span>
                <span className={`${quiz.questions.length - Object.keys(answers).length > 0 ? 'text-orange-600 font-bold' : 'text-gray-500 font-bold'}`}>
                  {quiz.questions.length - Object.keys(answers).length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-850 font-semibold rounded-xl transition-colors border border-gray-200 text-center"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={performSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-md text-center flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
