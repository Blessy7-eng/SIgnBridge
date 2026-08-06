import React, { useEffect, useMemo, useState } from 'react';
import { fonts } from '../theme';

const MASCOT_ASSETS = {
  happy: '/Hello.png',
  pointing: '/Pointing%20to%20progress%20bar.png',
  encourage: '/Keep%20it%20up.png',
  correct: '/Celebration.jpg',
  smallSuccess: '/thumps%20up.jpg',
  focus: '/Thinking.jpg',
  wrong: '/sad.png',
  hover: '/yes.png',
  goodbye: '/goodbye.png',
};

const MESSAGES = {
  happy: "Hi, I'm Mira!",
  pointing: 'Your next step is right here.',
  correct: 'Level Up! Great job!',
  smallSuccess: 'Nice work!',
  wrong: "It's okay! Try again.",
  encourage: 'Keep it up! You are making progress.',
  focus: 'I am focusing on your gesture.',
  goodbye: 'See you next time!',
};

const LABELS = {
  happy: 'Mira is ready to help',
  pointing: 'Mira is pointing to your progress',
  correct: 'Mira is celebrating your answer',
  smallSuccess: 'Mira is giving you a thumbs up',
  wrong: 'Mira is encouraging another try',
  encourage: 'Mira is cheering you on',
  focus: 'Mira is helping you focus',
  goodbye: 'Mira is saying goodbye',
  hover: 'Mira is giving you a thumbs up',
};

export default function HumanMascot({ mood = 'happy', size = 180, message, compact = false, speakable = true, className = '' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [displayedMood, setDisplayedMood] = useState(mood);

  useEffect(() => {
    setDisplayedMood(mood);
    if (mood !== 'correct' && mood !== 'smallSuccess') return undefined;
    const timeout = window.setTimeout(() => setDisplayedMood('encourage'), 3000);
    return () => window.clearTimeout(timeout);
  }, [mood]);

  const hoverMood = isHovered && ['happy', 'pointing', 'encourage'].includes(displayedMood) ? 'hover' : displayedMood;
  const activeMood = hoverMood === 'hover' ? 'hover' : hoverMood;
  const copy = message || MESSAGES[activeMood] || MESSAGES.happy;
  const image = MASCOT_ASSETS[activeMood] || MASCOT_ASSETS.happy;
  const isCelebrating = activeMood === 'correct' || activeMood === 'smallSuccess';
  const moodLabel = useMemo(() => LABELS[activeMood] || LABELS.happy, [activeMood]);

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
      className={`human-mascot human-mascot-${activeMood} ${compact ? 'human-mascot-compact' : ''} ${isHovered ? 'is-hovered' : ''} ${className}`}
      style={{ '--mascot-size': `${size}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="img"
      aria-label={moodLabel}
    >
      <div className="human-mascot-art-wrap">
        <div className="human-mascot-art">
          <img src={image} alt={`${moodLabel}.`} />
          {activeMood === 'pointing' && <span className="mascot-motion-line" aria-hidden="true">→</span>}
          <span className="mascot-star mascot-star-one" aria-hidden="true">+</span>
          <span className="mascot-star mascot-star-two" aria-hidden="true">*</span>
        </div>
        {activeMood === 'correct' && <span className="mascot-reaction mascot-reaction-one">Level Up!</span>}
        {activeMood === 'smallSuccess' && <span className="mascot-reaction mascot-reaction-one">Great Job!</span>}
        {activeMood === 'wrong' && <span className="mascot-reaction mascot-reaction-one">Try again</span>}
        {isCelebrating && <div className="mascot-confetti" aria-hidden="true">✦ · ✧ · ✦ · · ✧</div>}
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

export { MASCOT_ASSETS };
