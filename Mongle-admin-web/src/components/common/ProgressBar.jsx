import React from 'react';
import './ProgressBar.css';

export default function ProgressBar({ percent, color = 'var(--accent-primary)', trackColor = 'var(--bg-tertiary)', showText = true, height = 6 }) {
  return (
    <div className="progress-wrap-common">
      <div 
        className="progress-track-common" 
        style={{ backgroundColor: trackColor, height, borderRadius: height / 2 }}
      >
        <div 
          className="progress-fill-common" 
          style={{ width: `${percent}%`, backgroundColor: color, height: '100%', borderRadius: height / 2 }} 
        />
      </div>
      {showText && <span className="progress-pct-common">{percent}%</span>}
    </div>
  );
}
