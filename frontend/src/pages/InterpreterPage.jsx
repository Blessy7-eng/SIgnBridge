import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import { colors, fonts, fontImport } from '../theme';
import HumanMascot from '../components/HumanMascot';

const BACKEND_URL = 'http://localhost:5000';
const FRAME_INTERVAL_MS = 60; // was 90 - sends frames more often so the
                               // buffer/vote window on the backend fill
                               // faster in wall-clock time
const SEND_WIDTH = 480;

export default function InterpreterPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const sentenceWordsRef = useRef([]);

  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [cameraStatus, setCameraStatus] = useState('requesting');
  const [sentenceWords, setSentenceWords] = useState([]);
  const [lastWord, setLastWord] = useState('');
  const [mascotMood, setMascotMood] = useState('focus');

  useEffect(() => {
    sentenceWordsRef.current = sentenceWords;
  }, [sentenceWords]);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraStatus('granted');
      } catch (err) {
        console.error('Camera access denied:', err);
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
      setSentenceWords((prev) => [...prev, data.word]);
      setLastWord(data.word);
      setMascotMood('smallSuccess');
      window.setTimeout(() => setMascotMood('focus'), 3000);
      speak(data.word);
    });

    socket.on('cleared', () => {
      setSentenceWords([]);
      setLastWord('');
      speak('Cleared');
    });

    socket.on('undo_last', () => {
      if (sentenceWordsRef.current.length === 0) return;
      playBeep();
      setSentenceWords((prev) => prev.slice(0, -1));
      setLastWord('Backspace');
    });

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

      const scale = SEND_WIDTH / video.videoWidth;
      canvas.width = SEND_WIDTH;
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      socket.emit('frame', { image: canvas.toDataURL('image/jpeg', 0.6) });
    }, FRAME_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cameraStatus]);

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function playBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 350;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio playback restricted:', e);
    }
  }

  const statusColor = connectionStatus === 'connected' ? colors.secondary : connectionStatus === 'error' ? colors.danger : colors.inkMuted;
  const sentence = sentenceWords.join(' ');

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <style>{`
        ${fontImport}
        .sb-stage { padding: 14px 24px 20px; }
        .sb-video-box { max-width: 720px; }
        @media (max-width: 720px) {
          .sb-stage { padding: 12px 16px 16px; }
        }
      `}</style>

      <main
        className="sb-stage"
        style={{
          flex: '0 0 auto',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <PageHeader />

        <h1 style={{ fontFamily: fonts.display, fontWeight: 600, fontSize: 'clamp(20px, 3vw, 26px)', color: colors.ink, margin: '0 0 4px' }}>
          Sign Language Interpreter
        </h1>

        <div style={{ fontFamily: fonts.mono, fontSize: '11px', color: statusColor, marginBottom: '14px' }}>
          ● {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Could not reach server' : 'Connecting to model...'}
        </div>

        <div
          className="sb-video-box"
          style={{
            width: '100%',
            maxHeight: '46vh',
            aspectRatio: '16 / 9',
            background: colors.ink,
            border: `1px solid ${colors.border}`,
            borderRadius: '18px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
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

        <div
          className="sb-video-box"
          style={{
            width: '100%',
            marginTop: '12px',
            background: colors.bgAlt,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '14px 20px',
            minHeight: '24px',
            fontFamily: fonts.body,
            fontSize: '16px',
            color: colors.ink,
          }}
        >
          {sentence || <span style={{ color: '#8B9A85' }}>Your recognized signs will appear here...</span>}
        </div>

        <div className="sb-video-box" style={{ width: '100%', marginTop: '6px', fontFamily: fonts.mono, fontSize: '11px', color: colors.inkMuted }}>
          {lastWord && `Last action: ${lastWord}`}
        </div>
      </main>

      <Footer />
    </div>
  );
}
