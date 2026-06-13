import { useState, useEffect, useRef } from 'react';

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#6366f1', // Indigo
];

// Helper to shuffle array and guarantee it is not identical to the original order (if length > 1)
const shuffleArray = (arr) => {
  if (!arr || arr.length <= 1) return [...(arr || [])];
  const newArr = [...arr];
  let attempts = 0;
  // Keep shuffling until the order is different from the original
  while (newArr.join(',') === arr.join(',') && attempts < 20) {
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    attempts++;
  }
  return newArr;
};

export default function InteractiveMatching({ question, value = {}, onChange }) {
  const containerRef = useRef(null);
  
  // Shuffled right options (stabilized on mount, resets if question changes)
  const [shuffledRight, setShuffledRight] = useState(() => shuffleArray(question.matchingRight));

  // Reset shuffled array if the question id changes
  useEffect(() => {
    setShuffledRight(shuffleArray(question.matchingRight));
  }, [question.id, question.matchingRight]);
  
  // Selection states for click-to-connect
  const [activeLeft, setActiveLeft] = useState(null); // left item index
  const [activeRight, setActiveRight] = useState(null); // right item index
  
  // Line coordinates for drawing SVG lines
  const [lines, setLines] = useState([]);

  // Clear all matches
  const handleReset = () => {
    onChange({});
    setActiveLeft(null);
    setActiveRight(null);
  };

  // Helper to connect a left item and right item
  const connect = (leftText, rightText) => {
    const newPairs = { ...value };
    
    // Maintain 1-to-1 relationship:
    // If this right side option is already matched to another left item, remove it
    Object.keys(newPairs).forEach(k => {
      if (newPairs[k] === rightText) {
        delete newPairs[k];
      }
    });

    newPairs[leftText] = rightText;
    onChange(newPairs);
  };

  // Click handler for left side dot/card
  const handleLeftClick = (leftIdx, leftText) => {
    const currentMatch = value[leftText];

    if (currentMatch) {
      // Disconnect current match and make this left item active for routing
      const newPairs = { ...value };
      delete newPairs[leftText];
      onChange(newPairs);
      setActiveLeft(leftIdx);
      setActiveRight(null);
    } else {
      if (activeRight !== null) {
        const rightText = shuffledRight[activeRight];
        connect(leftText, rightText);
        setActiveRight(null);
      } else {
        setActiveLeft(activeLeft === leftIdx ? null : leftIdx);
      }
    }
  };

  // Click handler for right side dot/card
  const handleRightClick = (rightIdx, rightText) => {
    // Find if this right option is already connected to any left option
    const connectedLeftKey = Object.keys(value).find(k => value[k] === rightText);

    if (connectedLeftKey) {
      // Disconnect the match and make that left item active for routing
      const leftIdx = question.options.indexOf(connectedLeftKey);
      const newPairs = { ...value };
      delete newPairs[connectedLeftKey];
      onChange(newPairs);
      setActiveLeft(leftIdx);
      setActiveRight(null);
    } else {
      if (activeLeft !== null) {
        const leftText = question.options[activeLeft];
        connect(leftText, rightText);
        setActiveLeft(null);
      } else {
        setActiveRight(activeRight === rightIdx ? null : rightIdx);
      }
    }
  };

  // Track coordinates of dots dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateCoords = () => {
      const containerRect = container.getBoundingClientRect();
      const newLines = [];

      question.options.forEach((leftText, leftIdx) => {
        const rightText = value[leftText];
        if (rightText) {
          const leftDot = container.querySelector(`[data-dot-left="${leftIdx}"]`);
          const rightIdx = shuffledRight.indexOf(rightText);
          const rightDot = container.querySelector(`[data-dot-right="${rightIdx}"]`);

          if (leftDot && rightDot) {
            const leftRect = leftDot.getBoundingClientRect();
            const rightRect = rightDot.getBoundingClientRect();

            const x1 = leftRect.left - containerRect.left + leftRect.width / 2;
            const y1 = leftRect.top - containerRect.top + leftRect.height / 2;
            const x2 = rightRect.left - containerRect.left + rightRect.width / 2;
            const y2 = rightRect.top - containerRect.top + rightRect.height / 2;

            newLines.push({
              key: `${leftText}-${rightText}`,
              x1,
              y1,
              x2,
              y2,
              color: COLORS[leftIdx % COLORS.length]
            });
          }
        }
      });

      setLines(newLines);
    };

    // Calculate once DOM is ready
    updateCoords();

    // Use ResizeObserver to watch for layout/size changes
    const resizeObserver = new ResizeObserver(() => {
      updateCoords();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateCoords);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCoords);
    };
  }, [value, shuffledRight, question.options]);

  return (
    <div className="w-full select-none">
      {/* Click-to-connect instructions */}
      <div className="text-xs text-gray-500 mb-4 flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-150">
        <span>👉 <strong>Click a dot</strong> on one side, then click a dot on the other side to match them. Click a line's dot to disconnect/reconnect.</span>
        {Object.keys(value).length > 0 && (
          <button 
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Main matching container */}
      <div 
        ref={containerRef}
        className="relative grid grid-cols-2 gap-8 sm:gap-16 md:gap-24 items-stretch p-4 bg-gray-50 rounded-xl border border-gray-200"
      >
        {/* SVG overlay for drawing connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          {lines.map((line) => {
            const dx = Math.abs(line.x2 - line.x1) * 0.5;
            // Draw a smooth bezier curve
            const d = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;
            return (
              <g key={line.key}>
                {/* Glow/Back shadow effect */}
                <path 
                  d={d}
                  stroke={line.color}
                  strokeWidth="6"
                  strokeOpacity="0.15"
                  fill="none"
                />
                {/* Main line */}
                <path 
                  d={d}
                  stroke={line.color}
                  strokeWidth="3.5"
                  fill="none"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Left Side Column (Options/Keys) */}
        <div className="flex flex-col gap-4 z-20">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center border-b border-gray-200 pb-1.5 mb-1">
            Category
          </div>
          {question.options.map((leftText, idx) => {
            const hasMatch = value[leftText] !== undefined;
            const isActive = activeLeft === idx;
            const lineColor = COLORS[idx % COLORS.length];

            return (
              <div 
                key={`left-${idx}`}
                onClick={() => handleLeftClick(idx, leftText)}
                className={`flex items-center justify-between p-3.5 bg-white border rounded-xl shadow-sm cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'border-primary-500 ring-2 ring-primary-100' 
                    : hasMatch 
                      ? 'border-gray-200 opacity-90' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <span className="text-gray-800 font-medium text-sm sm:text-base pr-2 select-text">
                  {leftText}
                </span>
                
                {/* Dot */}
                <button
                  type="button"
                  data-dot-left={idx}
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid double toggle on parent div click
                    handleLeftClick(idx, leftText);
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none flex-shrink-0 ${
                    isActive 
                      ? 'border-primary-500 bg-primary-50' 
                      : hasMatch 
                        ? 'bg-white' 
                        : 'border-gray-300 bg-white hover:border-primary-500'
                  }`}
                  style={hasMatch ? { borderColor: lineColor } : {}}
                >
                  <span 
                    className={`w-2 h-2 rounded-full transition-transform ${
                      isActive 
                        ? 'bg-primary-600 scale-110 animate-pulse' 
                        : hasMatch 
                          ? '' 
                          : 'bg-gray-300'
                    }`}
                    style={hasMatch ? { backgroundColor: lineColor } : {}}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Side Column (Matches) */}
        <div className="flex flex-col gap-4 z-20">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center border-b border-gray-200 pb-1.5 mb-1">
            Matches
          </div>
          {shuffledRight.map((rightText, idx) => {
            // Check if this right option is matched to any left option
            const matchedLeftKey = Object.keys(value).find(k => value[k] === rightText);
            const hasMatch = matchedLeftKey !== undefined;
            const isActive = activeRight === idx;
            const leftIdx = hasMatch ? question.options.indexOf(matchedLeftKey) : -1;
            const lineColor = hasMatch ? COLORS[leftIdx % COLORS.length] : '';

            return (
              <div 
                key={`right-${idx}`}
                onClick={() => handleRightClick(idx, rightText)}
                className={`flex items-center justify-between p-3.5 bg-white border rounded-xl shadow-sm cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'border-primary-500 ring-2 ring-primary-100' 
                    : hasMatch 
                      ? 'border-gray-200 opacity-90' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Dot */}
                <button
                  type="button"
                  data-dot-right={idx}
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid double toggle on parent div click
                    handleRightClick(idx, rightText);
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none flex-shrink-0 mr-2 ${
                    isActive 
                      ? 'border-primary-500 bg-primary-50' 
                      : hasMatch 
                        ? 'bg-white' 
                        : 'border-gray-300 bg-white hover:border-primary-500'
                  }`}
                  style={hasMatch ? { borderColor: lineColor } : {}}
                >
                  <span 
                    className={`w-2 h-2 rounded-full transition-transform ${
                      isActive 
                        ? 'bg-primary-600 scale-110 animate-pulse' 
                        : hasMatch 
                          ? '' 
                          : 'bg-gray-300'
                    }`}
                    style={hasMatch ? { backgroundColor: lineColor } : {}}
                  />
                </button>

                <span className="text-gray-800 font-medium text-sm sm:text-base pl-2 text-right select-text">
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
