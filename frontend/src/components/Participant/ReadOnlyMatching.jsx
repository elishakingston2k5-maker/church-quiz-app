import { useState, useEffect, useRef, useMemo } from 'react';

// Color definitions
const COLOR_CORRECT = '#10b981'; // Green
const COLOR_INCORRECT = '#ef4444'; // Red

export default function ReadOnlyMatching({ question, value = {} }) {
  const containerRef = useRef(null);
  
  // Deterministic stable matches sorting alphabetically
  const sortedRight = useMemo(() => {
    return [...question.matchingRight].sort();
  }, [question.matchingRight]);
  
  // Line coordinates state
  const [lines, setLines] = useState([]);

  // Calculate coordinates dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateCoords = () => {
      const containerRect = container.getBoundingClientRect();
      const calculatedLines = [];

      question.options.forEach((leftText, leftIdx) => {
        const pAnswer = value[leftText]; // Participant's selection
        const correctAnswer = question.correctAnswer?.[leftText]; // Expected target
        
        const leftDot = container.querySelector(`[data-dot-left="${leftIdx}"]`);

        // 1. Draw solid line for participant's answer
        if (pAnswer) {
          const actualRightIdx = sortedRight.indexOf(pAnswer);
          const rightDot = container.querySelector(`[data-dot-right="${actualRightIdx}"]`);

          if (leftDot && rightDot) {
            const leftRect = leftDot.getBoundingClientRect();
            const rightRect = rightDot.getBoundingClientRect();

            const x1 = leftRect.left - containerRect.left + leftRect.width / 2;
            const y1 = leftRect.top - containerRect.top + leftRect.height / 2;
            const x2 = rightRect.left - containerRect.left + rightRect.width / 2;
            const y2 = rightRect.top - containerRect.top + rightRect.height / 2;

            const isCorrect = pAnswer === correctAnswer;

            calculatedLines.push({
              key: `act-${leftText}-${pAnswer}`,
              x1,
              y1,
              x2,
              y2,
              color: isCorrect ? COLOR_CORRECT : COLOR_INCORRECT,
              dashed: false,
              opacity: 1,
              strokeWidth: 3.5
            });
          }
        }

        // 2. Draw dashed green line for correct match if participant was incorrect or left it blank
        const wasCorrect = pAnswer === correctAnswer;
        if (!wasCorrect && correctAnswer) {
          const correctRightIdx = sortedRight.indexOf(correctAnswer);
          const correctDot = container.querySelector(`[data-dot-right="${correctRightIdx}"]`);

          if (leftDot && correctDot) {
            const leftRect = leftDot.getBoundingClientRect();
            const correctRect = correctDot.getBoundingClientRect();

            const x1 = leftRect.left - containerRect.left + leftRect.width / 2;
            const y1 = leftRect.top - containerRect.top + leftRect.height / 2;
            const x2 = correctRect.left - containerRect.left + correctRect.width / 2;
            const y2 = correctRect.top - containerRect.top + correctRect.height / 2;

            calculatedLines.push({
              key: `exp-${leftText}-${correctAnswer}`,
              x1,
              y1,
              x2,
              y2,
              color: COLOR_CORRECT,
              dashed: true,
              opacity: 0.6,
              strokeWidth: 2
            });
          }
        }
      });

      setLines(calculatedLines);
    };

    updateCoords();

    const resizeObserver = new ResizeObserver(() => {
      updateCoords();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateCoords);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCoords);
    };
  }, [value, sortedRight, question.options, question.correctAnswer]);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex gap-4 text-xs font-semibold text-gray-500 mb-3 bg-gray-50 p-2 rounded border border-gray-150 justify-center">
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-green-500 inline-block"></span> Correct Match</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 bg-red-500 inline-block"></span> Incorrect Match</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-1 border-t-2 border-dashed border-green-500 inline-block"></span> Expected correct path</span>
      </div>

      <div 
        ref={containerRef}
        className="relative grid grid-cols-2 gap-8 sm:gap-16 md:gap-24 items-stretch p-4 bg-gray-50 rounded-xl border border-gray-200"
      >
        {/* SVG connection lines overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          {lines.map((line) => {
            const dx = Math.abs(line.x2 - line.x1) * 0.5;
            const d = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;
            return (
              <g key={line.key}>
                <path 
                  d={d}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  strokeOpacity={line.opacity}
                  strokeDasharray={line.dashed ? "5 5" : "none"}
                  fill="none"
                />
              </g>
            );
          })}
        </svg>

        {/* Left column */}
        <div className="flex flex-col gap-4 z-20">
          {question.options.map((leftText, idx) => {
            const pAnswer = value[leftText];
            const isCorrect = pAnswer === question.correctAnswer?.[leftText];
            
            return (
              <div 
                key={`left-${idx}`}
                className={`flex items-center justify-between p-3.5 bg-white border rounded-xl shadow-sm ${
                  pAnswer
                    ? isCorrect
                      ? 'border-green-300 bg-green-50/20'
                      : 'border-red-300 bg-red-50/20'
                    : 'border-gray-200'
                }`}
              >
                <span className="text-gray-800 font-medium text-sm sm:text-base pr-2">
                  {leftText}
                </span>

                {/* Dot with status indicator */}
                <div
                  data-dot-left={idx}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    pAnswer
                      ? isCorrect
                        ? 'border-green-500 bg-green-100 text-green-700 text-xs font-extrabold'
                        : 'border-red-500 bg-red-100 text-red-700 text-xs font-extrabold'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {pAnswer ? (isCorrect ? '✓' : '✗') : ''}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4 z-20">
          {sortedRight.map((rightText, idx) => {
            // Find if this option was correct or incorrect for the participant
            const matchedLeftKey = Object.keys(value).find(k => value[k] === rightText);
            const hasMatch = matchedLeftKey !== undefined;
            const isCorrect = hasMatch && question.correctAnswer?.[matchedLeftKey] === rightText;

            return (
              <div 
                key={`right-${idx}`}
                className={`flex items-center justify-between p-3.5 bg-white border rounded-xl shadow-sm ${
                  hasMatch
                    ? isCorrect
                      ? 'border-green-300 bg-green-50/20'
                      : 'border-red-300 bg-red-50/20'
                    : 'border-gray-200'
                }`}
              >
                {/* Dot */}
                <div
                  data-dot-right={idx}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mr-2 ${
                    hasMatch
                      ? isCorrect
                        ? 'border-green-500 bg-green-100 text-green-700 text-xs font-extrabold'
                        : 'border-red-500 bg-red-100 text-red-700 text-xs font-extrabold'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  {hasMatch ? (isCorrect ? '✓' : '✗') : ''}
                </div>

                <span className="text-gray-800 font-medium text-sm sm:text-base pl-2 text-right">
                  {rightText}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
