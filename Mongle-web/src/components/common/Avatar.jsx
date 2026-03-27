import React from 'react';
import './Avatar.css';

export default function Avatar({ initials, bg, color, size = 40 }) {
  return (
    <div 
      className="avatar-common" 
      style={{ 
        backgroundColor: bg, 
        color: color,
        width: size,
        height: size,
        borderRadius: size / 2,
        fontSize: size * 0.4
      }}
    >
      {initials}
    </div>
  );
}
