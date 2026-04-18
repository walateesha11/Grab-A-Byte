import React from 'react';

const DEFAULT_TEXT = 'ORDER NOW • CONCURRENCY CONTROL • GRAB A BYTE • ACID COMPLIANCE • FRESH FOOD • ROW-LEVEL LOCKING • ';

/**
 * Reusable marquee banner.
 * Props:
 *   text    — override the scrolling text string
 *   bgColor — override the background color (CSS value)
 *   color   — override the text color (CSS value)
 */
export default function Marquee({ text = DEFAULT_TEXT, bgColor, color }) {
  const style = {
    ...(bgColor && { backgroundColor: bgColor }),
  };
  const textStyle = {
    ...(color && { color }),
  };

  return (
    <div className="marquee" style={style} aria-hidden="true">
      <div className="marquee-track">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="marquee-text" style={textStyle}>{text}</span>
        ))}
      </div>
    </div>
  );
}
