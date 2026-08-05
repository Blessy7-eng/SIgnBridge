import React, { useMemo, useState } from 'react';
import { fonts } from '../theme';

const MASCOT_IMAGE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1785778925507-vgB8EO8iW3U1lqinft9QTxlGNscqWc.png';

const MESSAGES = {
  happy: 'Ready to sign?',
  correct: 'Great job!',
  wrong: 'That was close. Try once more.',
  encourage: 'Small steps add up.',
  focus: "Let's practice together.",
};

export default function HumanMascot({ mood = 'happy', size = 180, message, compact = false, speakable = true }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const copy = message || MESSAGES[mood] || MESSAGES.happy;
  const moodLabel = useMemo(() => ({
    happy: 'Mira is ready to help',
    correct: 'Mira is celebrating your answer',
    wrong: 'Mira is encouraging another try',
    encourage: 'Mira is cheering you on',
    focus: 'Mira is helping you focus',
  }[mood] || 'SignBridge learning guide'), [mood]);

  function speakMessage() {
    if (!speakable || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(copy);
    utterance.rate = 0.92;
    utterance.pitch = 1.08;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div
      className={`human-mascot human-mascot-${mood} ${compact ? 'human-mascot-compact' : ''} ${isHovered ? 'is-hovered' : ''}`}
      style={{ '--mascot-size': `${size}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={moodLabel}
    >
      <div className="human-mascot-art-wrap">
        <div className="human-mascot-art">
          <img src={MASCOT_IMAGE} alt="Mira, the SignBridge learning guide" />
          <span className="mascot-star mascot-star-one" aria-hidden="true">+</span>
          <span className="mascot-star mascot-star-two" aria-hidden="true">*</span>
        </div>
        {mood === 'correct' && <span className="mascot-reaction mascot-reaction-one" aria-hidden="true">+1</span>}
        {mood === 'wrong' && <span className="mascot-reaction mascot-reaction-one" aria-hidden="true">Try</span>}
      </div>
      {(copy || speakable) && (
        <div className="mascot-bubble-row">
          <div className="mascot-bubble" style={{ fontFamily: fonts.body }}>{copy}</div>
          {speakable && (
            <button className={`mascot-speak ${isSpeaking ? 'is-speaking' : ''}`} type="button" onClick={speakMessage} aria-label="Hear Mira speak" title="Hear Mira speak">
              {isSpeaking ? '...' : 'Listen'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export { MASCOT_IMAGE };
