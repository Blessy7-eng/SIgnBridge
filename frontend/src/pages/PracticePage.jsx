import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import { colors, fonts, fontImport } from '../theme';
import { getUnit } from '../curriculum';
import { useProgress } from '../ProgressContext';
import { getSignDescription } from '../signDescriptions';
import Mudra from '../components/Mudra';
import Confetti from '../components/Confetti';
import UnitCompleteModal from '../components/UnitCompleteModal';

const BACKEND_URL = 'http://localhost:5000';
const FRAME_INTERVAL_MS = 90;
const SEND_WIDTH = 480;

export default function PracticePage() {
  const { unitId, signName } = useParams();
  const navigate = useNavigate();
  const unit = getUnit(unitId);
  const { markComplete } = useProgress();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [cameraStatus, setCameraStatus] = useState('requesting');
  const [result, setResult] = useState(null); // null | 'correct' | { detected: 'X' }
  const [companionReaction, setCompanionReaction] = useState(null); // drives the always-visible Mudra's expression
  const [streak, setStreak] = useState(0); // consecutive correct signs, resets on a miss
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showUnitComplete, setShowUnitComplete] = useState(false);
  const signNameRef = useRef(signName);

  useEffect(() => {
    signNameRef.current = signName;
    setResult(null); // reset feedback when moving to a new sign
    setCompanionReaction(null);
  }, [signName]);

  const targetIndex = unit ? unit.signs.indexOf(signName) : -1;
  const [showHint, setShowHint] = useState(false);
  const description = getSignDescription(signName);

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
      if (data.word === signNameRef.current) {
        setResult('correct');
        setStreak((s) => {
          const newStreak = s + 1;
          markComplete(unitId, signNameRef.current, newStreak);
          return newStreak;
        });
        playChime(true);
        setCompanionReaction('correct');
        setConfettiTrigger((t) => t + 1);

        const idx = unit.signs.indexOf(signNameRef.current);
        if (idx === unit.signs.length - 1) {
          // Let the per-sign celebration flash briefly before the full
          // unit-complete modal takes over the screen.
          setTimeout(() => setShowUnitComplete(true), 700);
        }
        setTimeout(() => setCompanionReaction(null), 1200);
      } else {
        setResult({ detected: data.word });
        playChime(false);
        setCompanionReaction('wrong');
        setStreak(0);
        setTimeout(() => setCompanionReaction(null), 900);
      }
    });

    // Clear/Backspace gestures aren't meaningful during practice - just
    // ignore them here rather than trying to apply sentence-editing logic
    // that doesn't exist on this page.
    socket.on('cleared', () => {});
    socket.on('undo_last', () => {});

    return () => socket.disconnect();
  }, [unitId]); // NOT signName - the socket connection should persist as you move
                // between signs within the same unit; reconnecting on every
                // sign change was exactly what caused the rapid connect/
                // disconnect churn (and the resulting background-thread
                // race condition) seen in testing.

  useEffect(() => {
    if (cameraStatus !== 'granted') return;
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const socket = socketRef.current;
      if (!video || !canvas || !socket || !socket.connected) return;
      if (video.videoWidth === 0) return;

      const scale = SEND_WIDTH / video.videoWidth;
      canvas.width = SEND_WIDTH;
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      socket.emit('frame', { image: canvas.toDataURL('image/jpeg', 0.6) });
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cameraStatus]);

  function playChime(success) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = success ? 660 : 260;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + (success ? 0.18 : 0.12));
  }

  function goToNext() {
    if (!unit) return;
    const nextIndex = targetIndex + 1;
    setResult(null);
    if (nextIndex < unit.signs.length) {
      navigate(`/learn/${unit.id}/practice/${encodeURIComponent(unit.signs[nextIndex])}`);
    } else {
      navigate(`/learn/${unit.id}`);
    }
  }

  if (!unit || !unit.ready || targetIndex === -1) {
    return <Navigate to="/learn" replace />;
  }

  const statusColor = connectionStatus === 'connected' ? colors.secondary : connectionStatus === 'error' ? colors.danger : colors.inkMuted;

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

        <Link to="/learn" style={{ fontFamily: fonts.mono, fontSize: '11px', color: colors.inkMuted, textDecoration: 'none', marginBottom: '10px' }}>
          ← {unit.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: colors.inkMuted }}>
            Sign {targetIndex + 1} of {unit.signs.length}
          </div>
          {streak > 1 && (
            <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: colors.primaryDark, fontWeight: 600 }}>
              🔥 {streak} in a row
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
          <Mudra reaction={companionReaction} size={64} />
          <h1 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: 'clamp(26px, 5vw, 40px)', color: colors.ink, margin: 0 }}>
            Show me: {signName}
          </h1>
        </div>

        <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: statusColor, marginBottom: '10px' }}>
          ● {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Could not reach server' : 'Connecting to model...'}
        </div>

        <button
          onClick={() => setShowHint((v) => !v)}
          style={{
            fontFamily: fonts.body,
            fontSize: '13px',
            color: colors.primaryDark,
            background: 'transparent',
            border: `1px solid ${colors.primary}`,
            borderRadius: '999px',
            padding: '6px 16px',
            cursor: 'pointer',
            marginBottom: showHint ? '10px' : '18px',
          }}
        >
          {showHint ? 'Hide' : "Don't know this sign? Show a hint"}
        </button>

        {showHint && (
          <div
            className="sb-video-box"
            style={{
              width: '100%',
              background: colors.bgAlt,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <Mudra gesture={signName} size={110} />
            <div style={{ flex: '1 1 180px', fontFamily: fonts.body, fontSize: '13px', color: colors.ink, lineHeight: 1.5 }}>
              {description || (
                <span style={{ color: colors.inkMuted }}>
                  No written guide yet for this sign. Check an ISL reference (like ISLRTC) or your own training notes.
                </span>
              )}
            </div>
          </div>
        )}

        <div
          className="sb-video-box"
          style={{
            width: '100%',
            height: 'min(38vh, 380px)',
            background: colors.ink,
            border: `3px solid ${result === 'correct' ? colors.secondary : colors.border}`,
            borderRadius: '18px',
            overflow: 'hidden',
            position: 'relative',
            transition: 'border-color 0.2s ease',
          }}
        >
          {confettiTrigger > 0 && <Confetti trigger={confettiTrigger} />}

          {result === 'correct' && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,214,102,.32), rgba(6,214,160,.12) 45%, transparent 70%)', pointerEvents: 'none' }} />}

          {cameraStatus === 'denied' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: '#C7C8D6', fontFamily: fonts.body, fontSize: '14px' }}>
              Camera access was denied. Allow camera permission in your browser settings and reload this page.
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: cameraStatus === 'granted' ? 'block' : 'none',
            }}
          />
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="sb-video-box" style={{ width: '100%', marginTop: '16px', minHeight: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {result === 'correct' && (
            <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, #EDFFF4, #FFF8DF)', border: '1px solid #CBE6D1', borderRadius: '16px', padding: '13px 18px', minWidth: '260px', boxShadow: '0 8px 22px rgba(75, 120, 85, .1)' }}>
              <div style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: '20px', color: colors.secondary, marginBottom: '10px' }}>
                ✓ Correct!
              </div>
              <button
                onClick={goToNext}
                style={{
                  fontFamily: fonts.body,
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #C8A96B, #B98743)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 14px rgba(179, 146, 90, .22)',
                }}
              >
                {targetIndex + 1 < unit.signs.length ? 'Next sign →' : 'Finish unit'}
              </button>
            </div>
          )}
          {result && result.detected && (
            <div style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.inkMuted, textAlign: 'center' }}>
              Detected <strong style={{ color: colors.ink }}>{result.detected}</strong> - try again
            </div>
          )}
          {!result && (
            <div style={{ fontFamily: fonts.body, fontSize: '14px', color: '#8B9A85', textAlign: 'center' }}>
              Hold the sign steady in front of your camera...
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showUnitComplete && (
        <UnitCompleteModal
          unitName={unit.name}
          signCount={unit.signs.length}
          xpEarned={unit.signs.length * 10}
          onClose={() => {
            setShowUnitComplete(false);
            navigate('/learn');
          }}
        />
      )}
    </div>
  );
}