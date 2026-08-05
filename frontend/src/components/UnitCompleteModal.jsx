import React from 'react';
import { colors, fonts } from '../theme';
import Mudra from './Mudra';
import Confetti from './Confetti';

export default function UnitCompleteModal({ unitName, signCount, xpEarned, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 45, 34, 0.64)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(145deg, #FFFCF4 0%, #F7F4ED 65%, #F8E9C9 100%)',
          border: '1px solid rgba(255,255,255,.8)',
          borderRadius: '24px',
          padding: '36px 30px 30px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 70px rgba(10, 28, 16, 0.32)',
          overflow: 'hidden',
        }}
      >
        <Confetti trigger="unit-complete" />

        <div style={{ display: 'inline-flex', padding: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFE29A, #FFB4A2)', boxShadow: '0 8px 20px rgba(200,169,107,.35)' }}>
          <Mudra reaction="correct" size={118} />
        </div>

        <h2 style={{ fontFamily: fonts.display, fontWeight: 700, fontSize: '24px', color: colors.ink, margin: '12px 0 4px' }}>
          Brilliant work!
        </h2>
        <p style={{ fontFamily: fonts.body, fontSize: '14px', color: colors.inkMuted, marginBottom: '20px' }}>
          You learned all {signCount} signs in <strong style={{ color: colors.ink }}>{unitName}</strong>.
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, #E3F3E7, #FFF2C9)',
            border: '1px solid #D4DFC9',
            borderRadius: '999px',
            padding: '8px 18px',
            marginBottom: '24px',
            fontFamily: fonts.mono,
            fontSize: '13px',
            color: colors.ink,
          }}
        >
          +{xpEarned} XP earned
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            fontFamily: fonts.body,
            fontSize: '14px',
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #C8A96B, #B98743)',
            border: 'none',
            borderRadius: '10px',
            padding: '12px',
            cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(179, 146, 90, .28)',
          }}
        >
          Back to path
        </button>
      </div>
    </div>
  );
}