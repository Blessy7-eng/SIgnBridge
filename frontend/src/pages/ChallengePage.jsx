import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import Mudra from '../components/Mudra';
import Confetti from '../components/Confetti';
import { colors, fonts, fontImport } from '../theme';
import { UNITS } from '../Curriculum';
import { useProgress } from '../ProgressContext';

const BACKEND_URL = 'http://localhost:5000';
const FRAME_INTERVAL_MS = 90;
const SEND_WIDTH = 480;
const ROUND_SECONDS = 60;
const PER_SIGN_TIMEOUT_MS = 8000; // skip to a new sign if this one isn't solved in time - keeps pace snappy

export default function ChallengePage() {
  const navigate = useNavigate();
  const { isComplete, bestChallengeScore, setBestChallengeScore } = useProgress();

  const [phase, setPhase] = useState('ready'); // ready | playing | results
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [currentSign, setCurrentSign] = useState(null);
  const [reaction, setReaction] = useState(null);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [cameraStatus, setCameraStatus] = useState('requesting');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const currentSignRef = useRef(null);
  const perSignTimeoutRef = useRef(null);
  const roundTimerRef = useRef(null);

  // Build the pool of signs to quiz on: prefer signs you've already
  // completed in Learn mode, but fall back to everything available so
  // brand-new users can still play right away.
  const buildPool = useCallback(() => {
    const readyUnits = UNITS.filter((u) => u.ready);
    const completedPool = [];
    const allPool = [];
    for (const unit of readyUnits) {
      for (const sign of unit.signs) {
        allPool.push(sign);
        if (isComplete(unit.id, sign)) completedPool.push(sign);
      }
    }
    return completedPool.length >= 5 ? completedPool : allPool;
  }, [isComplete]);

  function pickNextSign(pool) {
    if (pool.length === 0) return null;
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (next === currentSignRef.current) {
        next = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    return next;
  }

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraStatus('granted');
      } catch (err) {
        console.error('Camera access denied or unavailable:', err);
        setCameraStatus('denied');
      }
    }
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('connecting'));
    socket.on('connect_error', () => setConnectionStatus('error'));

    socket.on('prediction', (data) => {
      if (!currentSignRef.current) return;
      if (data.word === currentSignRef.current) {
        setScore((s) => s + 1);
        setReaction('correct');
        setConfettiTrigger((t) => t + 1);
        playChime(true);
        advanceToNextSign();
      }
      // Wrong guesses during the challenge are just ignored - no penalty,
      // keeps the game feeling encouraging rather than punishing.
    });

    socket.on('cleared', () => {});
    socket.on('undo_last', () => {});

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (cameraStatus !== 'granted') return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const socket = socketRef.current;
      if (!video || !canvas || !socket || !socket.connected) return;
      if (video.videoWidth === 0) return;
      if (phase !== 'playing') return;

      const scale = SEND_WIDTH / video.videoWidth;
      canvas.width = SEND_WIDTH;
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      socket.emit('frame', { image: canvas.toDataURL('image/jpeg', 0.6) });
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cameraStatus, phase]);

  function advanceToNextSign() {
    clearTimeout(perSignTimeoutRef.current);
    setTimeout(() => setReaction(null), 500);
    const pool = buildPool();
    const next = pickNextSign(pool);
    currentSignRef.current = next;
    setCurrentSign(next);

    perSignTimeoutRef.current = setTimeout(() => {
      advanceToNextSign(); // ran out of time on this one - just move on, no penalty
    }, PER_SIGN_TIMEOUT_MS);
  }

  function startRound() {
    const pool = buildPool();
    if (pool.length === 0) return;

    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setPhase('playing');
    advanceToNextSign();

    roundTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(roundTimerRef.current);
          clearTimeout(perSignTimeoutRef.current);
          currentSignRef.current = null;
          setPhase('results');
          setBestChallengeScore(score + (currentSign ? 0 : 0)); // score already up to date via state
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  // Keep best score updated whenever we land on results (score is settled by then)
  useEffect(() => {
    if (phase === 'results') {
      setBestChallengeScore(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    return () => {
      clearInterval(roundTimerRef.current);
      clearTimeout(perSignTimeoutRef.current);
    };
  }, []);

  function playChime(success) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = success ? 720 : 260;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  }

  const isNewBest = phase === 'results' && score > 0 && score >= bestChallengeScore;

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <style>{`
        ${fontImport}
        .sb-stage { padding: 14px 24px 20px; }
        .sb-video-box { max-width: 640px; }
        @media (max-width: 720px) {
          .sb-stage { padding: 12px 16px 16px; }
        }
      `}</style>

      <main className="sb-stage" style={{ flex: '0 0 auto', width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <PageHeader />

        <h1 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(26px, 5vw, 38px)', color: colors.ink, margin: '0 0 4px' }}>
          Speed Challenge
        </h1>
        <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: colors.inkMuted, marginBottom: '18px' }}>
          Best score: {bestChallengeScore}
        </div>

        {phase === 'ready' && (
          <div className="sb-video-box" style={{ width: '100%', textAlign: 'center', background: colors.bgAlt, border: `1px solid ${colors.border}`, borderRadius: '18px', padding: '32px 24px' }}>
            <Mudra size={110} />
            <p style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.ink, margin: '16px 0 24px', lineHeight: 1.6 }}>
              You've got {ROUND_SECONDS} seconds. Sign as many prompts correctly as you can. No penalty for misses - just keep going!
            </p>
            <button
              onClick={startRound}
              style={{ fontFamily: fonts.body, fontSize: '15px', fontWeight: 600, color: '#FFFFFF', background: colors.primary, border: 'none', borderRadius: '10px', padding: '12px 32px', cursor: 'pointer' }}
            >
              Start
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontFamily: fonts.mono, fontSize: '13px' }}>
              <div style={{ color: colors.primaryDark, fontWeight: 700 }}>⏱ {timeLeft}s</div>
              <div style={{ color: colors.secondary, fontWeight: 700 }}>Score: {score}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <Mudra reaction={reaction} size={56} />
              <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(28px, 6vw, 42px)', color: colors.ink, margin: 0 }}>
                {currentSign}
              </h2>
            </div>

            <div
              className="sb-video-box"
              style={{
                width: '100%',
                height: 'min(38vh, 380px)',
                background: colors.ink,
                border: `3px solid ${reaction === 'correct' ? colors.secondary : colors.border}`,
                borderRadius: '18px',
                overflow: 'hidden',
                position: 'relative',
                transition: 'border-color 0.15s ease',
              }}
            >
              {confettiTrigger > 0 && <Confetti trigger={confettiTrigger} />}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraStatus === 'granted' ? 'block' : 'none' }}
              />
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        )}

        {phase === 'results' && (
          <div className="sb-video-box" style={{ width: '100%', textAlign: 'center', background: colors.bgAlt, border: `1px solid ${colors.border}`, borderRadius: '18px', padding: '32px 24px' }}>
            <Mudra reaction={isNewBest ? 'correct' : null} size={110} />
            <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '26px', color: colors.ink, margin: '16px 0 4px' }}>
              {score} signs!
            </h2>
            <p style={{ fontFamily: fonts.body, fontSize: '13px', color: colors.inkMuted, marginBottom: '24px' }}>
              {isNewBest ? 'New best score!' : `Best: ${bestChallengeScore}`}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={startRound}
                style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: 600, color: '#FFFFFF', background: colors.primary, border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer' }}
              >
                Play again
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: 500, color: colors.ink, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '10px 24px', cursor: 'pointer' }}
              >
                Back home
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
