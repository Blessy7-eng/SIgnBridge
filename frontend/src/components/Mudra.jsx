import React from 'react';
import { colors } from '../theme';

// Mudra - SignBridge's original mascot. Named after the real Sanskrit term
// for a symbolic hand gesture/pose, fitting for an Indian Sign Language app.
//
// IMPORTANT HONESTY NOTE: these are simplified, stylized animations meant
// to give a fun visual sense of each motion - they are NOT a substitute for
// a verified, accurate sign reference. They're only defined for the 6 word
// signs grounded in your original reference chart. For anything else
// (currently: all alphabet letters), Mudra shows a "don't know this one
// yet" idle state instead of guessing at a gesture.

const KNOWN_GESTURES = ['Hello', 'Goodbye', 'Please', 'ThankYou', 'Yes', 'No'];

export default function Mudra({ gesture = null, reaction = null, size = 150 }) {
  const activeGesture = KNOWN_GESTURES.includes(gesture) ? gesture : null;

  let bodyAnimation = 'mudra-idle-bob 2.4s ease-in-out infinite';
  if (reaction === 'correct') bodyAnimation = 'mudra-celebrate-bounce 0.7s ease-out 1';
  if (reaction === 'wrong') bodyAnimation = 'mudra-encourage-tilt 0.5s ease-in-out 1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        @keyframes mudra-idle-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes mudra-celebrate-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-14px) scale(1.06); }
          55% { transform: translateY(0) scale(0.98); }
          75% { transform: translateY(-6px) scale(1.03); }
        }
        @keyframes mudra-encourage-tilt {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-6deg); }
        }
        @keyframes mudra-sparkle {
          0% { opacity: 0; transform: scale(0.4) translateY(4px); }
          40% { opacity: 1; transform: scale(1) translateY(-4px); }
          100% { opacity: 0; transform: scale(0.6) translateY(-14px); }
        }
        @keyframes mudra-blink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }

        /* Hello: hand up near head, waving side to side */
        @keyframes mudra-hello {
          0%, 100% { transform: rotate(-18deg); }
          50% { transform: rotate(18deg); }
        }
        /* Goodbye: similar position, quicker little wiggle */
        @keyframes mudra-goodbye {
          0%, 100% { transform: rotate(-10deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.05); }
        }
        /* Please: hand on chest, small circular rub */
        @keyframes mudra-please {
          0%   { transform: translate(0px, 0px); }
          25%  { transform: translate(4px, -2px); }
          50%  { transform: translate(0px, -4px); }
          75%  { transform: translate(-4px, -2px); }
          100% { transform: translate(0px, 0px); }
        }
        /* ThankYou: hand starts near chin/face, moves outward and down */
        @keyframes mudra-thankyou {
          0%   { transform: translate(0px, 0px); }
          50%  { transform: translate(14px, 10px); }
          100% { transform: translate(0px, 0px); }
        }
        /* Yes: fist nodding up and down */
        @keyframes mudra-yes {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(8px); }
        }
        /* No: pinching fingers open/close */
        @keyframes mudra-no-pinch {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(0.3); }
        }

        .mudra-body { animation: mudra-idle-bob 2.4s ease-in-out infinite; }
        .mudra-eye { transform-box: fill-box; transform-origin: center; animation: mudra-blink 4s ease-in-out infinite; }

        .mudra-arm-hello { transform-box: fill-box; transform-origin: bottom center; animation: mudra-hello 0.9s ease-in-out infinite; }
        .mudra-arm-goodbye { transform-box: fill-box; transform-origin: bottom center; animation: mudra-goodbye 0.5s ease-in-out infinite; }
        .mudra-arm-please { transform-box: fill-box; transform-origin: center; animation: mudra-please 1.6s ease-in-out infinite; }
        .mudra-arm-thankyou { transform-box: fill-box; transform-origin: center; animation: mudra-thankyou 1.4s ease-in-out infinite; }
        .mudra-arm-yes { transform-box: fill-box; transform-origin: center; animation: mudra-yes 0.7s ease-in-out infinite; }
        .mudra-pinch-top { transform-box: fill-box; transform-origin: left center; animation: mudra-no-pinch 0.8s ease-in-out infinite; }
        .mudra-pinch-bottom { transform-box: fill-box; transform-origin: left center; animation: mudra-no-pinch 0.8s ease-in-out infinite reverse; }
      `}</style>

      <svg width={size} height={size * 1.1} viewBox="0 0 140 160">
        <g style={{ animation: bodyAnimation, transformBox: 'fill-box', transformOrigin: 'center' }}>
          {/* Body */}
          <ellipse cx="70" cy="105" rx="38" ry="34" fill={colors.secondary} />
          {/* Head */}
          <circle cx="70" cy="55" r="34" fill={colors.secondary} />
          {/* Cheeks */}
          <circle cx="50" cy="62" r="6" fill={colors.primary} opacity="0.6" />
          <circle cx="90" cy="62" r="6" fill={colors.primary} opacity="0.6" />
          {/* Eyes */}
          <ellipse className="mudra-eye" cx="58" cy="50" rx="4" ry="5" fill={colors.ink} />
          <ellipse className="mudra-eye" cx="82" cy="50" rx="4" ry="5" fill={colors.ink} />
          {/* Smile - shape reflects current reaction */}
          {reaction === 'correct' ? (
            <path d="M55 64 Q70 80, 85 64" stroke={colors.ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : reaction === 'wrong' ? (
            <path d="M60 68 Q70 65, 80 68" stroke={colors.ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M58 66 Q70 74, 82 66" stroke={colors.ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {reaction === 'correct' && (
            <>
              <text x="30" y="30" fontSize="16" style={{ animation: 'mudra-sparkle 0.8s ease-out 1' }}>✨</text>
              <text x="100" y="24" fontSize="14" style={{ animation: 'mudra-sparkle 0.8s ease-out 0.15s 1 both' }}>✨</text>
            </>
          )}

          {/* Resting arm (shown when nothing active / behind gesture arm) */}
          <rect x="30" y="95" width="12" height="34" rx="6" fill={colors.primaryDark} />

          {/* --- Gesture arm + hand: only one rendered at a time --- */}
          {activeGesture === 'Hello' && (
            <g className="mudra-arm-hello">
              <rect x="92" y="30" width="12" height="45" rx="6" fill={colors.primaryDark} />
              <circle cx="98" cy="26" r="11" fill={colors.primary} />
            </g>
          )}

          {activeGesture === 'Goodbye' && (
            <g className="mudra-arm-goodbye">
              <rect x="92" y="30" width="12" height="45" rx="6" fill={colors.primaryDark} />
              <circle cx="98" cy="26" r="11" fill={colors.primary} />
            </g>
          )}

          {activeGesture === 'Please' && (
            <g className="mudra-arm-please">
              <rect x="88" y="70" width="12" height="34" rx="6" fill={colors.primaryDark} />
              <circle cx="94" cy="98" r="12" fill={colors.primary} />
            </g>
          )}

          {activeGesture === 'ThankYou' && (
            <g className="mudra-arm-thankyou">
              <rect x="80" y="35" width="12" height="34" rx="6" fill={colors.primaryDark} />
              <circle cx="86" cy="66" r="11" fill={colors.primary} />
            </g>
          )}

          {activeGesture === 'Yes' && (
            <g className="mudra-arm-yes">
              <rect x="90" y="65" width="12" height="34" rx="6" fill={colors.primaryDark} />
              <circle cx="96" cy="94" r="12" fill={colors.primary} />
            </g>
          )}

          {activeGesture === 'No' && (
            <g>
              <rect x="90" y="60" width="12" height="34" rx="6" fill={colors.primaryDark} />
              <circle cx="96" cy="86" r="12" fill={colors.primary} />
              <rect className="mudra-pinch-top" x="96" y="76" width="14" height="4" rx="2" fill={colors.ink} />
              <rect className="mudra-pinch-bottom" x="96" y="94" width="14" height="4" rx="2" fill={colors.ink} />
            </g>
          )}

          {!activeGesture && (
            <g>
              <rect x="92" y="80" width="12" height="34" rx="6" fill={colors.primaryDark} />
              <circle cx="98" cy="76" r="11" fill={colors.primary} />
            </g>
          )}
        </g>
      </svg>

      <div style={{ fontSize: '11px', color: colors.inkMuted, marginTop: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
        {reaction === 'correct'
          ? 'Yes! Nailed it!'
          : reaction === 'wrong'
          ? 'Almost - try again!'
          : activeGesture
          ? 'Mudra shows you'
          : "Mudra doesn't know this one yet"}
      </div>
    </div>
  );
}