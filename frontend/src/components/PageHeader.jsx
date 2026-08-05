import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { colors, fonts } from '../theme';

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
      <circle cx="3" cy="14" r="2" fill={colors.primary} />
      <circle cx="10" cy="4" r="2" fill={colors.primary} />
      <circle cx="17" cy="12" r="2" fill={colors.secondary} />
      <path d="M3 14 Q 7 6, 10 4 T 17 12" stroke={colors.border} strokeWidth="1.5" fill="none" strokeDasharray="1 3" />
    </svg>
  );
}

export default function PageHeader() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 auto 14px',
        padding: '0 8px',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: colors.ink,
          fontFamily: fonts.display,
          fontSize: '15px',
          fontWeight: 600,
        }}
      >
        <Mark />
        SignBridge
      </Link>

      <button
        onClick={() => navigate(-1)}
        style={{
          fontFamily: fonts.body,
          fontSize: '13px',
          color: colors.inkMuted,
          background: 'transparent',
          textDecoration: 'none',
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '5px 12px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
}