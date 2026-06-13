import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import ReadOnlyMatching from '../Participant/ReadOnlyMatching';

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
          axios.get(`/api/submissions/quiz/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`/api/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
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
      await axios.put(`/api/submissions/${subId}/score`, { manualScore, isFullyGraded }, {
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

const getQuestionScore = (q, pAns) => {
  if (!pAns) return 0;
  
  if (q.type === 'MATCHING') {
    let score = 0;
    if (q.correctAnswer && typeof q.correctAnswer === 'object') {
      q.options.forEach(leftItem => {
        if (pAns[leftItem] && pAns[leftItem] === q.correctAnswer[leftItem]) {
          score += 1;
        }
      });
    }
    return score;
  }
  
  if (q.type === 'FILL_BLANKS') {
    const expected = typeof q.correctAnswer === 'string' ? q.correctAnswer : '';
    const allowed = expected.split(/[,/|]+/).map(a => a.trim().toLowerCase()).filter(Boolean);
    const participantAns = typeof pAns === 'string' ? pAns.trim().toLowerCase() : '';
    return (allowed.length > 0 && allowed.includes(participantAns)) ? q.points : 0;
  }
  
  if (['MCQ', 'CHECKBOX'].includes(q.type)) {
    return JSON.stringify(pAns) === JSON.stringify(q.correctAnswer) ? q.points : 0;
  }
  
  return 0;
};

  const downloadAnswerSheet = () => {
    if (!selectedSub || !quiz) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to download/print the answer sheet.");
      return;
    }

    const questionsHtml = quiz.questions.map((q, idx) => {
      const pAns = selectedSub.answers[q.id];
      const maxPts = q.type === 'MATCHING' ? q.options.length : q.points;
      const isAuto = ['MCQ', 'CHECKBOX', 'FILL_BLANKS', 'MATCHING'].includes(q.type);
      const score = isAuto ? getQuestionScore(q, pAns) : 0;

      let checkBadge = '';
      if (isAuto) {
        if (score === maxPts) {
          checkBadge = '<span class="status-icon icon-correct">✅</span>';
        } else if (score === 0) {
          checkBadge = '<span class="status-icon icon-incorrect">❌</span>';
        } else {
          checkBadge = `<span class="status-icon icon-warning">⚠️ ${score}/${maxPts}</span>`;
        }
      } else {
        if (selectedSub.isFullyGraded) {
          checkBadge = selectedSub.manualScore > 0 ? '<span class="status-icon icon-correct">✅</span>' : '<span class="status-icon icon-incorrect">❌</span>';
        } else {
          checkBadge = '<span class="status-icon icon-review">⏳ Review</span>';
        }
      }

      if (q.type === 'MATCHING') {
        const sortedRight = [...q.matchingRight].sort();
        
        return `
          <div class="question-card">
            <div class="question-header">
              <h3>Question ${idx + 1}: ${q.text} ${checkBadge}</h3>
              <span class="score-badge">${score} / ${maxPts} pts</span>
            </div>
            
            <div class="matching-container" id="matching-${q.id}" data-options='${JSON.stringify(q.options)}' data-sorted-right='${JSON.stringify(sortedRight)}' data-correct-answer='${JSON.stringify(q.correctAnswer || {})}' data-p-ans='${JSON.stringify(pAns || {})}'>
              <!-- Left side -->
              <div class="matching-column">
                ${q.options.map((leftText, leftIdx) => {
                  const userMatch = pAns?.[leftText];
                  const correctMatch = q.correctAnswer?.[leftText];
                  const isCorrect = userMatch === correctMatch;
                  
                  const statusClass = userMatch ? (isCorrect ? 'card-correct' : 'card-incorrect') : '';
                  const dotClass = userMatch ? (isCorrect ? 'dot-correct' : 'dot-incorrect') : '';
                  const symbol = userMatch ? (isCorrect ? '✓' : '✗') : '';
                  
                  return `
                    <div class="matching-card ${statusClass}">
                      <span class="matching-text">${leftText}</span>
                      <div class="matching-dot left-dot ${dotClass}" data-dot-left="${leftIdx}">${symbol}</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- SVG Overlay -->
              <svg class="matching-svg" id="svg-${q.id}"></svg>

              <!-- Right side -->
              <div class="matching-column">
                ${sortedRight.map((rightText, rightIdx) => {
                  const matchedLeftKey = Object.keys(pAns || {}).find(k => pAns[k] === rightText);
                  const hasMatch = matchedLeftKey !== undefined;
                  const isCorrect = hasMatch && q.correctAnswer?.[matchedLeftKey] === rightText;
                  
                  const statusClass = hasMatch ? (isCorrect ? 'card-correct' : 'card-incorrect') : '';
                  const dotClass = hasMatch ? (isCorrect ? 'dot-correct' : 'dot-incorrect') : '';
                  const symbol = hasMatch ? (isCorrect ? '✓' : '✗') : '';
                  
                  return `
                    <div class="matching-card ${statusClass}">
                      <div class="matching-dot right-dot ${dotClass}" data-dot-right="${rightIdx}">${symbol}</div>
                      <span class="matching-text">${rightText}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      }

      let pAnswerStr = '';
      if (q.type === 'CHECKBOX' && Array.isArray(pAns)) {
        pAnswerStr = pAns.join(', ');
      } else {
        pAnswerStr = pAns || '<span class="no-answer">No answer provided</span>';
      }

      let expectedStr = '';
      if (q.type === 'CHECKBOX' && Array.isArray(q.correctAnswer)) {
        expectedStr = q.correctAnswer.join(', ');
      } else {
        expectedStr = q.correctAnswer || 'Not specified';
      }

      return `
        <div class="question-card">
          <div class="question-header">
            <h3>Question ${idx + 1}: ${q.text} ${checkBadge}</h3>
            <span class="score-badge">${isAuto ? score : (selectedSub.isFullyGraded ? selectedSub.manualScore : 'Manual')} / ${maxPts} pts</span>
          </div>
          <div class="answer-section">
            <div class="answer-block user-answer ${isAuto ? (score === maxPts ? 'block-correct' : 'block-incorrect') : ''}">
              <span class="block-title">Participant's Answer:</span>
              <div class="answer-content">${pAnswerStr}</div>
            </div>
            <div class="answer-block correct-answer">
              <span class="block-title">Expected Correct Answer:</span>
              <div class="answer-content">${expectedStr}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const documentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Answer Sheet - ${selectedSub.participantName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            color: #1e3a8a;
            font-size: 28px;
          }
          .header p {
            margin: 4px 0;
            color: #555;
            font-size: 14px;
          }
          .score-summary {
            background-color: #f0f6ff;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 35px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .score-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          .score-value {
            font-size: 32px;
            font-weight: 900;
            color: #2563eb;
          }
          .question-card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 25px;
            page-break-inside: avoid;
            background-color: #fff;
          }
          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .question-header h3 {
            margin: 0;
            font-size: 16px;
            color: #1f2937;
            font-weight: 600;
            padding-right: 15px;
          }
          .status-icon {
            display: inline-block;
            margin-left: 8px;
            font-size: 16px;
            vertical-align: middle;
          }
          .icon-correct { color: #10b981; }
          .icon-incorrect { color: #ef4444; }
          .icon-warning {
            font-size: 11px;
            background-color: #fef3c7;
            color: #d97706;
            border: 1px solid #fde68a;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
          }
          .icon-review {
            font-size: 11px;
            background-color: #ffedd5;
            color: #ea580c;
            border: 1px solid #fed7aa;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
          }
          .score-badge {
            background-color: #f3f4f6;
            color: #374151;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            white-space: nowrap;
          }
          .answer-section {
            display: grid;
            grid-template-cols: 1fr;
            gap: 15px;
          }
          @media (min-width: 600px) {
            .answer-section {
              grid-template-cols: 1fr 1fr;
            }
          }
          .answer-block {
            padding: 12px 16px;
            border-radius: 8px;
          }
          .user-answer {
            background-color: #eff6ff;
            border: 1px solid #dbeafe;
          }
          .correct-answer {
            background-color: #f0fdf4;
            border: 1px solid #dcfce7;
          }
          .block-correct {
            border-color: #a7f3d0 !important;
            background-color: #f0fdf4 !important;
          }
          .block-incorrect {
            border-color: #fca5a5 !important;
            background-color: #fef2f2 !important;
          }
          .block-title {
            display: block;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
          }
          .user-answer .block-title {
            color: #2563eb;
          }
          .correct-answer .block-title {
            color: #16a34a;
          }
          .answer-content {
            font-size: 14px;
            color: #1f2937;
            white-space: pre-wrap;
          }
          .matching-container {
            position: relative;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 120px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-top: 15px;
          }
          .matching-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
            z-index: 20;
          }
          .matching-card {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 10px 14px;
          }
          .card-correct {
            border-color: #a7f3d0;
            background-color: #f0fdf4;
          }
          .card-incorrect {
            border-color: #fca5a5;
            background-color: #fef2f2;
          }
          .matching-text {
            font-size: 14px;
            color: #1f2937;
            font-weight: 500;
          }
          .matching-dot {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #d1d5db;
            background-color: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
          }
          .dot-correct {
            border-color: #10b981;
            background-color: #d1fae5;
            color: #065f46;
          }
          .dot-incorrect {
            border-color: #ef4444;
            background-color: #fee2e2;
            color: #991b1b;
          }
          .matching-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
            overflow: visible;
          }
          .no-answer {
            color: #9ca3af;
            font-style: italic;
          }
          @media print {
            body {
              padding: 20px;
            }
            .question-card {
              border: 1px solid #ccc;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Church Quiz Competition</h1>
          <p>Participant Answer Sheet: <b>${selectedSub.participantName}</b></p>
          <p>Quiz: ${quiz.title}</p>
          <p>Submitted on: ${new Date(selectedSub.submittedAt).toLocaleString()}</p>
        </div>
        
        <div class="score-summary">
          <span class="score-title">Final Graded Score</span>
          <span class="score-value">${selectedSub.autoScore + selectedSub.manualScore} / ${totalPossiblePoints}</span>
        </div>
        
        <div class="questions-list">
          ${questionsHtml}
        </div>
        
        <script>
          window.onload = function() {
            // Render matching curves
            const matchContainers = document.querySelectorAll('.matching-container');
            matchContainers.forEach(container => {
              const svg = container.querySelector('.matching-svg');
              if (!svg) return;

              const containerRect = container.getBoundingClientRect();
              const options = JSON.parse(container.getAttribute('data-options'));
              const sortedRight = JSON.parse(container.getAttribute('data-sorted-right'));
              const correctAnswer = JSON.parse(container.getAttribute('data-correct-answer'));
              const pAns = JSON.parse(container.getAttribute('data-p-ans'));

              options.forEach((leftText, leftIdx) => {
                const pAnswer = pAns[leftText];
                const correctVal = correctAnswer[leftText];
                const leftDot = container.querySelector('[data-dot-left="' + leftIdx + '"]');

                if (pAnswer) {
                  const actualRightIdx = sortedRight.indexOf(pAnswer);
                  const rightDot = container.querySelector('[data-dot-right="' + actualRightIdx + '"]');
                  if (leftDot && rightDot) {
                    const leftRect = leftDot.getBoundingClientRect();
                    const rightRect = rightDot.getBoundingClientRect();

                    const x1 = leftRect.left - containerRect.left + leftRect.width / 2;
                    const y1 = leftRect.top - containerRect.top + leftRect.height / 2;
                    const x2 = rightRect.left - containerRect.left + rightRect.width / 2;
                    const y2 = rightRect.top - containerRect.top + rightRect.height / 2;

                    const isCorrect = pAnswer === correctVal;
                    const color = isCorrect ? '#10b981' : '#ef4444';

                    const dx = Math.abs(x2 - x1) * 0.5;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2);
                    path.setAttribute('stroke', color);
                    path.setAttribute('stroke-width', '3');
                    path.setAttribute('fill', 'none');
                    svg.appendChild(path);
                  }
                }

                const wasCorrect = pAnswer === correctVal;
                if (!wasCorrect && correctVal) {
                  const correctRightIdx = sortedRight.indexOf(correctVal);
                  const correctDot = container.querySelector('[data-dot-right="' + correctRightIdx + '"]');
                  if (leftDot && correctDot) {
                    const leftRect = leftDot.getBoundingClientRect();
                    const correctRect = correctDot.getBoundingClientRect();

                    const x1 = leftRect.left - containerRect.left + leftRect.width / 2;
                    const y1 = leftRect.top - containerRect.top + leftRect.height / 2;
                    const x2 = correctRect.left - containerRect.left + correctRect.width / 2;
                    const y2 = correctRect.top - containerRect.top + correctRect.height / 2;

                    const dx = Math.abs(x2 - x1) * 0.5;
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2);
                    path.setAttribute('stroke', '#10b981');
                    path.setAttribute('stroke-width', '2');
                    path.setAttribute('stroke-dasharray', '4 4');
                    path.setAttribute('stroke-opacity', '0.6');
                    path.setAttribute('fill', 'none');
                    svg.appendChild(path);
                  }
                }
              });
            });

            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(documentHtml);
    printWindow.document.close();
  };

  if (!quiz) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const totalPossiblePoints = quiz.questions.reduce((acc, q) => acc + (q.type === 'MATCHING' ? q.options.length : q.points), 0);

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
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 gap-4">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedSub.participantName}'s Answers</h2>
                    <button
                      onClick={downloadAnswerSheet}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                    >
                      <span>📥</span> Download Answer Sheet
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm mt-1.5">Submitted on {new Date(selectedSub.submittedAt).toLocaleString()}</p>
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
                  const score = isAutoGraded ? getQuestionScore(q, pAnswer) : 0;
                  const maxPts = q.type === 'MATCHING' ? q.options.length : q.points;
                  
                  return (
                    <div key={q.id} className="border border-gray-200 rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-semibold text-gray-800"><span className="text-gray-400 mr-2">{i + 1}.</span>{q.text}</h3>
                          
                          {/* Grade ticks and crosses */}
                          {isAutoGraded && (
                            score === maxPts ? (
                              <span className="text-green-500 font-bold" title="Correct">✅</span>
                            ) : score === 0 ? (
                              <span className="text-red-500 font-bold" title="Incorrect">❌</span>
                            ) : (
                              <span className="text-yellow-600 font-bold bg-yellow-50 border border-yellow-250 px-2 py-0.5 rounded text-xs" title="Partially Correct">
                                ⚠️ {score}/{maxPts}
                              </span>
                            )
                          )}
                        </div>
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                          {maxPts} pts
                        </span>
                      </div>
                      
                      {q.type === 'MATCHING' ? (
                        <div className="mt-3">
                          <ReadOnlyMatching question={q} value={pAnswer || {}} />
                        </div>
                      ) : (
                        <>
                          <div className={`p-4 rounded mb-4 border ${
                            isAutoGraded 
                              ? score === maxPts 
                                ? 'bg-green-50/20 border-green-200' 
                                : 'bg-red-50/20 border-red-200'
                              : 'bg-blue-50 border-blue-100'
                          }`}>
                            <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1 block">Participant's Answer</span>
                            {q.type === 'CHECKBOX' && Array.isArray(pAnswer) ? (
                              <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                                {pAnswer.map((a, idx) => <li key={idx}>{a}</li>)}
                              </ul>
                            ) : (
                              <div className="text-gray-800 whitespace-pre-wrap font-medium">{pAnswer || <span className="text-gray-400 italic">No answer provided</span>}</div>
                            )}
                          </div>

                          <div className="bg-green-50 p-4 rounded border border-green-200">
                            <span className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-1 block">Expected Answer</span>
                            {q.type === 'CHECKBOX' && Array.isArray(q.correctAnswer) ? (
                              <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                                {q.correctAnswer.map((a, idx) => <li key={idx}>{a}</li>)}
                              </ul>
                            ) : (
                              <div className="text-gray-800 font-medium">{q.correctAnswer || <span className="text-gray-400 italic">Not specified</span>}</div>
                            )}
                          </div>
                        </>
                      )}

                      {!isAutoGraded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Manual Grading Required</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Points awarded:</span>
                            <input 
                              type="number"
                              min="0"
                              max={q.points}
                              value={selectedSub.manualScore || 0}
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
              
              <div className="p-6 border-t border-gray-250 bg-gray-50 sticky bottom-0 flex justify-between items-center">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedSub.isFullyGraded}
                      onChange={(e) => handleScoreUpdate(selectedSub._id, selectedSub.manualScore, e.target.checked)}
                      className="w-4 h-4 text-primary-650 rounded border-gray-300 focus:ring-primary-500"
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
