/**
 * Web Audio API Sound Synthesizer for UrbanCraft 5D
 * 100% self-contained, no external audio files required.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAmbiencePlaying: boolean = false;
  private ambienceNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
  private ambienceTimer: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ambienceNodes) {
      this.stopAmbience();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getAmbiencePlaying(): boolean {
    return this.isAmbiencePlaying;
  }

  // Tactile placement sound
  public playPlace(pitchOffset: number = 0) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Base click/thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 260 + pitchOffset * 15;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);

      // High crisp click
      const click = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(800, now);
      click.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      click.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      click.start(now);
      click.stop(now + 0.04);
    } catch {
      // Ignore audio context errors before user gesture
    }
  }

  // Demolish / Bulldoze sound
  public playDemolish() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      // Low pass filter to create heavy rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.exponentialRampToValueAtTime(90, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Ignore
    }
  }

  // Upgrade building ascending chime
  public playUpgrade() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.22);
      });
    } catch {
      // Ignore
    }
  }

  // Milestone achieved fanfare
  public playMilestone() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chords = [
        { freqs: [440, 554.37, 659.25], time: 0 },
        { freqs: [493.88, 622.25, 739.99], time: 0.16 },
        { freqs: [587.33, 739.99, 880.00, 1174.66], time: 0.34 },
      ];

      chords.forEach(({ freqs, time }) => {
        freqs.forEach((freq) => {
          if (!this.ctx) return;
          const noteTime = now + time;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.14, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.45);
        });
      });
    } catch {
      // Ignore
    }
  }

  // Crisp UI tap
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // Rotate building click
  public playRotate() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // Soothing Ambient City Music Synthesizer (Lofi chord progressions)
  public toggleAmbience() {
    if (this.isAmbiencePlaying) {
      this.stopAmbience();
      return false;
    } else {
      this.startAmbience();
      return true;
    }
  }

  private startAmbience() {
    this.initCtx();
    if (!this.ctx) return;
    this.isAmbiencePlaying = true;

    // Chords (Cmaj9, Am9, Fmaj7, Gsus4)
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // C E G B
      [220.00, 261.63, 329.63, 392.00], // A C E G
      [174.61, 220.00, 261.63, 329.63], // F A C E
      [196.00, 261.63, 293.66, 392.00], // G C D G
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (!this.isAmbiencePlaying || this.isMuted || !this.ctx) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;
      const now = this.ctx.currentTime;
      const duration = 5.5;

      currentChord.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.035, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      });

      this.ambienceTimer = window.setTimeout(playNextChord, 4800);
    };

    playNextChord();
  }

  public stopAmbience() {
    this.isAmbiencePlaying = false;
    if (this.ambienceTimer) {
      window.clearTimeout(this.ambienceTimer);
      this.ambienceTimer = null;
    }
  }
}

export const sound = new SoundEngine();
