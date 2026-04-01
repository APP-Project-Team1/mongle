import React from 'react';
import './Badge.css';

export default function Badge({ text, bg, color, icon: Icon, className = '' }) {
  return (
    <div className={`badge-common ${className}`} style={{ backgroundColor: bg, color }}>
      {Icon && <Icon size={14} className="badge-icon" />}
      {text}
    </div>
  );
}