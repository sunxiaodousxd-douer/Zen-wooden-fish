// Advanced synth for a realistic wooden fish (woodblock) sound
let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

export const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

// Pre-generate a noise buffer for the "click" impact
const createNoiseBuffer = (ctx: AudioContext) => {
  if (audioBuffer) return audioBuffer;
  const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds of noise is enough
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  audioBuffer = buffer;
  return buffer;
};

export const playWoodblockSound = () => {
  const ctx = initAudio();
  if (!ctx) return;

  const t = ctx.currentTime;

  // 1. The Impact (Noise burst)
  // This simulates the stick hitting the wood surface
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(3000, t);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.02); // Very short sharp click

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);

  // 2. The Resonance (Body of the sound)
  // Simulates the hollow cavity resonance
  const osc = ctx.createOscillator();
  osc.type = 'sine'; // Sine works well for the fundamental hollow tone
  // Randomize pitch slightly for natural variation (around 750Hz - 850Hz is typical for small wooden fish)
  const baseFreq = 800 + Math.random() * 20; 
  osc.frequency.setValueAtTime(baseFreq, t);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, t + 0.1); // Slight pitch drop

  // High Q filter to create that "pop" sound
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(baseFreq, t);
  bandpass.Q.value = 5; // Resonance factor

  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, t);
  mainGain.gain.linearRampToValueAtTime(1.0, t + 0.005); // Fast attack
  mainGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15); // Short decay (wood doesn't sustain)

  osc.connect(bandpass);
  bandpass.connect(mainGain);
  mainGain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + 0.2);

  // 3. Low Thud (Body weight)
  const thudOsc = ctx.createOscillator();
  thudOsc.type = 'triangle';
  thudOsc.frequency.setValueAtTime(150, t);
  
  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.5, t);
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

  thudOsc.connect(thudGain);
  thudGain.connect(ctx.destination);
  thudOsc.start(t);
  thudOsc.stop(t + 0.1);
};