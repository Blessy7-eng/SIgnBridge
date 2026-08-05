// SignBridge - written hints shown on the Practice page when the learner
// isn't sure how to form a sign.
//
// The 6 word entries below are grounded in the reference chart you shared
// earlier in this project - not guessed. The alphabet entries are left
// blank deliberately: authentic ISL fingerspelling is generally TWO-HANDED
// (unlike ASL, which is one-handed), and I don't have a verified source
// for the exact two-handed shape of each letter. Rather than guess and
// risk teaching something wrong, fill these in from ISLRTC
// (https://islrtc.nic.in) or your own training reference - whatever your
// model was actually trained on.

export const SIGN_DESCRIPTIONS = {
  Hello: 'Raise your hand near your head, palm facing out, and give a small wave.',
  Goodbye: 'Raise your hand near your head and wiggle your fingers.',
  Please: 'Flat hand on your chest, move it in a small circular motion.',
  ThankYou: 'Fingers near your chin, move your hand outward and down, away from your face.',
  Yes: 'Make a fist and move it up and down, like a nodding head.',
  No: 'Bring your fingers and thumb together repeatedly, like a snapping/pinching motion.',

  // Fill these in once you have a verified ISL reference for each letter:
  // A: '...',
  // B: '...',
  // etc.
};

export function getSignDescription(sign) {
  return SIGN_DESCRIPTIONS[sign] || null;
}