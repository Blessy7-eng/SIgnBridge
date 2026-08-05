import React from 'react';
import { colors } from '../theme';

const PARTICLE_COLORS = ['#FF5F7E', '#FFD166', '#06D6A0', '#4D96FF', '#A66CFF', '#FFFFFF'];
const PARTICLE_COUNT = 48;

// Renders a burst of confetti particles. Pass a changing `trigger` value
// (e.g. an incrementing counter) to replay the animation - the key change
// forces React to remount the particles, restarting the CSS animation.
export default function Confetti({ trigger }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
      const distance = 90 + Math.random() * 125;
      return {
        id: i,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance - 45,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.08,
        size: 6 + Math.random() * 6,
      };
    });
  }, [trigger]);

  return (
    <div
      key={trigger}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes confetti-fly {
          0%   { transform: translate(0, 0) rotate(0deg) scale(.25); opacity: 0; }
          14%  { opacity: 1; transform: translate(calc(var(--tx) * .14), calc(var(--ty) * .14)) rotate(45deg) scale(1.15); }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)) scale(.78); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '50% 0 50% 0' : '2px',
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rotation}deg`,
            animation: `confetti-fly 1.25s cubic-bezier(.16,.8,.35,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}