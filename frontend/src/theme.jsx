// SignBridge - shared design tokens
//
// Palette (from Color Hunt, as specified):
//   Sage green:   #8FA28A  -> secondary accent / footer & header depth
//   Light sage:   #C7D3C0  -> alternate card background
//   Cream:        #F7F4ED  -> main background
//   Tan/gold:     #C8A96B  -> primary accent
//
// The palette itself doesn't include a near-black text color, so "ink" and
// "inkMuted" below are derived to harmonize with the sage tones while still
// giving proper contrast against the cream background.
//
// Display font: Space Grotesk (geometric grotesk, distinct personality)
// Body font:    Inter (neutral, highly legible - matters for accessibility)
// Mono/utility: IBM Plex Mono (small labels, status text)

export const colors = {
  bg: '#F7F4ED',
  bgAlt: '#C7D3C0',
  ink: '#2E3A2F',
  inkMuted: '#5B6B57',
  border: '#DAD9C9',
  primary: '#C8A96B',
  primaryDark: '#B3925A',
  secondary: '#8FA28A',
  danger: '#B5533D',
};

export const fonts = {
  display: "'Space Grotesk', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

export const fontImport =
  "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');";