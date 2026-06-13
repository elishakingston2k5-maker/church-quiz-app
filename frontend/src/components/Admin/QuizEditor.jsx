import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const isEditMode = !!id;

  const [title, setTitle] = useState('Untitled Quiz');
  const [description, setDescription] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [questions, setQuestions] = useState([
    {
      id: Date.now().toString(),
      type: 'MCQ',
      text: 'Question 1',
      options: ['Option 1'],
      matchingRight: [],
      correctAnswer: 'Option 1',
      points: 1
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchQuiz = async () => {
        try {
          const res = await axios.get(`/api/quizzes/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const q = res.data;
          setTitle(q.title);
          setDescription(q.description || '');
          setTimerMinutes(q.timerMinutes || 0);
          setQuestions(q.questions.length ? q.questions : questions);
        } catch (err) {
          console.error('Failed to load quiz');
        }
      };
      fetchQuiz();
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type: 'MCQ',
        text: '',
        options: ['Option 1'],
        matchingRight: [],
        correctAnswer: '',
        points: 1
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    
    // reset correct answer if type changes
    if (field === 'type') {
      newQuestions[index].correctAnswer = value === 'CHECKBOX' ? [] : '';
      if (value === 'MATCHING') {
        newQuestions[index].options = ['Item 1'];
        newQuestions[index].matchingRight = ['Match 1'];
        newQuestions[index].correctAnswer = { 'Item 1': 'Match 1' };
      }
    }
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    setIsSaving(true);
    // Ensure MATCHING questions have points set to the number of options (pairs)
    const sanitizedQuestions = questions.map(q => {
      if (q.type === 'MATCHING') {
        return { ...q, points: q.options.length };
      }
      return q;
    });
    const payload = { title, description, timerMinutes, questions: sanitizedQuestions };
    try {
      if (isEditMode) {
        await axios.put(`/api/quizzes/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/api/quizzes`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin');
    } catch (err) {
      console.error('Failed to save quiz');
      setIsSaving(false);
    }
  };

  // Helper renderers for options
  const renderOptionsEditor = (q, qIndex) => {
    if (['MCQ', 'CHECKBOX'].includes(q.type)) {
      return (
        <div className="mt-4 space-y-2">
          {q.options.map((opt, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-sm border border-gray-400 flex-shrink-0 ${q.type === 'MCQ' ? 'rounded-full' : ''}`}></div>
              <input 
                type="text" 
                value={opt}
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[optIndex] = e.target.value;
                  updateQuestion(qIndex, 'options', newOpts);
                }}
                className="flex-1 px-3 py-1.5 border-b border-gray-200 focus:border-primary-500 outline-none transition-colors"
                placeholder={`Option ${optIndex + 1}`}
              />
              <button 
                onClick={() => {
                  const newOpts = q.options.filter((_, i) => i !== optIndex);
                  updateQuestion(qIndex, 'options', newOpts);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button 
            onClick={() => updateQuestion(qIndex, 'options', [...q.options, `Option ${q.options.length + 1}`])}
            className="text-sm text-primary-600 font-medium hover:underline mt-2 inline-block"
          >
            Add Option
          </button>
        </div>
      );
    }
    
    if (q.type === 'MATCHING') {
      return (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Left Items</h4>
            {q.options.map((opt, i) => (
              <div key={`l-${i}`} className="flex mb-2">
                 <input 
                  type="text" 
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...q.options];
                    newOpts[i] = e.target.value;
                    updateQuestion(qIndex, 'options', newOpts);
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded"
                />
              </div>
            ))}
            <button onClick={() => updateQuestion(qIndex, 'options', [...q.options, `Item ${q.options.length + 1}`])} className="text-sm text-primary-600">Add Left Item</button>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Right Matches</h4>
            {q.matchingRight.map((match, i) => (
              <div key={`r-${i}`} className="flex mb-2">
                 <input 
                  type="text" 
                  value={match}
                  onChange={(e) => {
                    const newMatches = [...q.matchingRight];
                    newMatches[i] = e.target.value;
                    updateQuestion(qIndex, 'matchingRight', newMatches);
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded"
                />
              </div>
            ))}
            <button onClick={() => updateQuestion(qIndex, 'matchingRight', [...q.matchingRight, `Match ${q.matchingRight.length + 1}`])} className="text-sm text-primary-600">Add Right Match</button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderCorrectAnswerInput = (q, qIndex) => {
    if (q.type === 'FILL_BLANKS') {
      return (
        <div className="mt-4">
          <label className="text-sm font-medium text-green-700 block mb-1">Correct Answer(s)</label>
          <input 
            type="text"
            value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
            className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded"
            placeholder="Expected answer..."
          />
          <p className="text-xs text-green-600 mt-1">
            * For multiple correct answers, separate them with commas or slashes (e.g. <code>Jesus, Christ / Yeshua</code>). Matching is case-insensitive.
          </p>
        </div>
      );
    }

    if (['SHORT_ANSWER', 'PARAGRAPH'].includes(q.type)) {
       return (
         <div className="mt-4">
           <label className="text-sm font-medium text-green-700 block mb-1">Correct Answer (Optional for manual grading)</label>
           <input 
             type="text"
             value={typeof q.correctAnswer === 'string' ? q.correctAnswer : ''}
             onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
             className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded"
             placeholder="Expected answer..."
           />
         </div>
       )
    }

    if (q.type === 'MCQ') {
      return (
        <div className="mt-4">
          <label className="text-sm font-medium text-green-700 block mb-1">Correct Answer</label>
          <select 
            value={q.correctAnswer} 
            onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
            className="w-full px-3 py-2 border border-green-200 bg-green-50 rounded"
          >
            <option value="">Select correct option...</option>
            {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    }

    if (q.type === 'CHECKBOX') {
      const selectedAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
      return (
        <div className="mt-4 bg-green-50 p-3 rounded border border-green-200">
           <label className="text-sm font-medium text-green-700 block mb-2">Correct Answers</label>
           {q.options.map((opt, i) => (
             <label key={i} className="flex items-center gap-2 mb-1 cursor-pointer">
               <input 
                 type="checkbox"
                 checked={selectedAnswers.includes(opt)}
                 onChange={(e) => {
                   let newAnswers = [...selectedAnswers];
                   if (e.target.checked) newAnswers.push(opt);
                   else newAnswers = newAnswers.filter(a => a !== opt);
                   updateQuestion(qIndex, 'correctAnswer', newAnswers);
                 }}
               />
               <span>{opt}</span>
             </label>
           ))}
        </div>
      );
    }
    
    if (q.type === 'MATCHING') {
      const currentPairs = q.correctAnswer || {};
      return (
        <div className="mt-4 bg-green-50 p-3 rounded border border-green-200">
          <label className="text-sm font-medium text-green-700 block mb-2">Define Correct Pairs</label>
          {q.options.map((leftItem, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span className="w-1/2 p-2 bg-white rounded border">{leftItem}</span>
              <span>➡️</span>
              <select 
                className="w-1/2 p-2 rounded border"
                value={currentPairs[leftItem] || ''}
                onChange={(e) => {
                  const newPairs = { ...currentPairs, [leftItem]: e.target.value };
                  updateQuestion(qIndex, 'correctAnswer', newPairs);
                }}
              >
                <option value="">Select match...</option>
                {q.matchingRight.map((r, ri) => <option key={ri} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        </div>
        <button 
          onClick={saveQuiz}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Quiz'}
        </button>
      </header>

      <main className="max-w-3xl mx-auto mt-8 px-4">
        {/* Title and Description */}
        <div className="bg-white rounded-xl shadow-sm border-t-8 border-t-primary-600 p-6 mb-6">
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-3xl font-semibold mb-3 border-b border-transparent focus:border-gray-300 outline-none pb-1 transition-colors"
            placeholder="Quiz Title"
          />
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full text-gray-600 border-b border-transparent focus:border-gray-300 outline-none pb-1 resize-none"
            placeholder="Form description"
            rows={2}
          />
          <div className="mt-4 flex items-center gap-3">
             <label className="text-sm font-medium text-gray-700">Timer (minutes, 0 for no timer):</label>
             <input 
               type="number" 
               min="0"
               value={timerMinutes}
               onChange={e => setTimerMinutes(parseInt(e.target.value) || 0)}
               className="w-20 px-3 py-1 border border-gray-300 rounded outline-none focus:border-primary-500"
             />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex overflow-hidden">
              <div className="w-1.5 bg-primary-500"></div>
              <div className="p-6 w-full relative">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                  <input 
                    type="text" 
                    value={q.text}
                    onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border-b-2 border-gray-200 focus:border-primary-500 outline-none rounded-t text-gray-800 transition-colors"
                    placeholder="Question"
                  />
                  <select 
                    value={q.type}
                    onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                    className="w-full sm:w-48 px-3 py-3 border border-gray-300 rounded outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="CHECKBOX">Checkboxes</option>
                    <option value="MATCHING">Match the Following</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="PARAGRAPH">Paragraph</option>
                    <option value="FILL_BLANKS">Fill in the Blanks</option>
                  </select>
                </div>

                {renderOptionsEditor(q, index)}
                {renderCorrectAnswerInput(q, index)}

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Points:</span>
                    {q.type === 'MATCHING' ? (
                      <span className="text-sm text-gray-700 bg-gray-50 px-2.5 py-1 rounded border border-gray-200 font-medium">
                        {q.options.length} (1 pt per pair)
                      </span>
                    ) : (
                      <input 
                        type="number" 
                        min="0"
                        value={q.points}
                        onChange={(e) => updateQuestion(index, 'points', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded outline-none focus:border-primary-500 text-center"
                      />
                    )}
                  </div>
                  <button 
                    onClick={() => removeQuestion(index)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Add Button */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3">
          <button 
            onClick={addQuestion}
            className="bg-white text-gray-600 shadow-lg border border-gray-200 p-4 rounded-full hover:text-primary-600 hover:border-primary-200 transition-all flex items-center justify-center group"
            title="Add Question"
          >
            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
}
