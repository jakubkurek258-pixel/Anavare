// Pure Client-side Web Audio API synthesizers for instant gamification audio feedback
// No external assets or static file dependencies required! Safe, offline-ready, and lightweight.

export function playSound(type: 'xp' | 'levelup' | 'streak' | 'badge' | 'click') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'xp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      // Dual note chime
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'levelup') {
      // Beautiful triumphant arpeggio: C4, E4, G4, C5, E5, G5, C6
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Staggered arpeggio
        const noteTime = now + index * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
        
        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } else if (type === 'streak') {
      // Ascending energetic flare notes
      const notes = [329.63, 392.00, 493.88, 587.33]; // E4 -> G4 -> B4 -> D5
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const noteTime = now + index * 0.06;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteTime);
        
        // Low pass filter to keep it warm
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.06, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);
        
        osc.start(noteTime);
        osc.stop(noteTime + 0.25);
      });
    } else if (type === 'badge') {
      // Sparkling bell chime sound
      const notes = [587.33, 739.99, 880.00, 1174.66]; // D5 -> F#5 -> A5 -> D6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const noteTime = now + index * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
        
        osc.start(noteTime);
        osc.stop(noteTime + 0.5);
      });
    }
  } catch (err) {
    console.warn('[Web Audio API Warning] Sound synth could not play: ', err);
  }
}
