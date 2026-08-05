import React from 'react';
import { fonts } from '../theme';

const MASCOT_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1785778925507-vgB8EO8iW3U1lqinft9QTxlGNscqWc.png';

export default function HumanMascot({ mood = 'happy', size = 180, message, compact = false }) {
  const messages = {
    happy: 'Ready to sign?',
    correct: 'Great job!',
    encourage: 'You are getting there!',
    focus: 'Let&apos;s practice together.',
  };

  return (
    <div className={`human-mascot human-mascot-${mood} ${compact ? 'human-mascot-compact' : ''}`} style={{ '--mascot-size': `${size}px` }}>
      <div className="human-mascot-art">
        <img src={MASCOT_IMAGE} alt="SignBridge learning guide" />
        <span className="mascot-star mascot-star-one">+</span>
        <span className="mascot-star mascot-star-two">*</span>
      </div>
      {(message || messages[mood]) && (
        <div className="mascot-bubble" style={{ fontFamily: fonts.body }}>
          {message || messages[mood]}
        </div>
      )}
    </div>
  );
}

export { MASCOT_IMAGE };
