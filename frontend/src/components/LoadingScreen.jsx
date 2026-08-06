import React, { useEffect, useMemo, useState } from 'react';

const TIPS = [
  'Did you know? Indian Sign Language has its own unique grammar and syntax!',
  'Warming up the interpreter engine for you...',
  'Fun fact: Over 7 million people use ISL to communicate daily!',
  'Practice makes perfect — keeping your streak alive!',
  'Getting Mira ready to practice with you...',
];

const MASCOT_IMAGES = ['/Thinking.jpg', '/Hello.png', '/Keep%20it%20up.png', '/yes.png', '/mascot-expression-12.png'];

export default function LoadingScreen({ onComplete, label = 'Loading your next lesson' }) {
  const [progress, setProgress] = useState(0);
  const finishRef = React.useRef(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const next = Math.min(100, ((Date.now() - startedAt) / 2400) * 100);
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(timer);
        finishRef.current = window.setTimeout(onComplete, 180);
      }
    }, 40);
    return () => {
      window.clearInterval(timer);
      if (finishRef.current) window.clearTimeout(finishRef.current);
    };
  }, [onComplete]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const tipTimer = window.setInterval(() => setTipIndex((index) => (index + 1) % TIPS.length), 2500);
    const imageTimer = window.setInterval(() => setImageIndex((index) => (index + 1) % MASCOT_IMAGES.length), 3000);
    return () => {
      window.clearInterval(tipTimer);
      window.clearInterval(imageTimer);
    };
  }, []);

  const tip = useMemo(() => TIPS[tipIndex], [tipIndex]);

  return (
    <div className="sb-loading-overlay" role="status" aria-live="polite" aria-label={label} aria-busy={progress < 100}>
      <div className="sb-loading-particle sb-loading-particle-one" aria-hidden="true">+</div>
      <div className="sb-loading-particle sb-loading-particle-two" aria-hidden="true">*</div>
      <div className="sb-loading-particle sb-loading-particle-three" aria-hidden="true">o</div>
      <div className="sb-loading-card">
        <div className="sb-loading-mascot-wrap">
          <div className="sb-loading-ring" aria-hidden="true" />
          <img className="sb-loading-mascot" src={MASCOT_IMAGES[imageIndex]} alt="Mira, your SignBridge guide" />
        </div>
        <p className="sb-loading-kicker">SIGNBRIDGE</p>
        <h2>One moment, learner.</h2>
        <p className="sb-loading-tip" key={tipIndex}>{tip}</p>
        <div className="sb-loading-progress" role="progressbar" aria-label="Loading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="sb-loading-meta"><span>Preparing your practice space</span><strong>{Math.round(progress)}%</strong></div>
      </div>
    </div>
  );
}
