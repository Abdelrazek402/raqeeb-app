// Web Audio & Real MP3 Audio Manager for Spiritual Adhan & Feedback sound effects

export interface MuezzinOption {
  id: string;
  nameAr: string;
  locationAr: string;
  type: 'voice' | 'tone';
  urls: string[];
}

export const MUEZZIN_LIST: MuezzinOption[] = [
  {
    id: 'mecca',
    nameAr: 'أذان الحرم المكي',
    locationAr: 'مكة المكرمة',
    type: 'voice',
    urls: [
      '/audio/makkah_adhan.mp3',
      '/audio/makkah.mp3'
    ]
  },
  {
    id: 'madina',
    nameAr: 'أذان الحرم النبوي',
    locationAr: 'المدينة المنورة',
    type: 'voice',
    urls: [
      '/audio/madinah_adhan.mp3',
      '/audio/madinah.mp3'
    ]
  },
  {
    id: 'aqsa',
    nameAr: 'أذان المسجد الأقصى',
    locationAr: 'القدس الشريف',
    type: 'voice',
    urls: [
      '/audio/aqsa_adhan.mp3',
      '/audio/aqsa.mp3'
    ]
  },
  {
    id: 'azhar',
    nameAr: 'أذان الجامع الأزهر الشريف',
    locationAr: 'القاهرة - الجامع الأزهر',
    type: 'voice',
    urls: [
      '/audio/azhar_adhan.mp3'
    ]
  },
  {
    id: 'egypt',
    nameAr: 'أذان الإذاعة المصرية',
    locationAr: 'جمهورية مصر العربية',
    type: 'voice',
    urls: [
      '/audio/egypt_adhan.mp3'
    ]
  },
  {
    id: 'tone_chime',
    nameAr: 'نغمة تنبيه هادئة',
    locationAr: 'تنبيه صلب وقصير',
    type: 'tone',
    urls: []
  }
];

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentAdhanAudio: HTMLAudioElement | null = null;
  private isPlayingAdhanFlag: boolean = false;
  private onEndListeners: Array<() => void> = [];
  private onStateListeners: Array<(isPlaying: boolean) => void> = [];

  constructor() {
    // Lazy AudioContext initialization
  }

  public addStateListener(listener: (isPlaying: boolean) => void) {
    this.onStateListeners.push(listener);
    listener(this.isAdhanPlaying());
  }

  public removeStateListener(listener: (isPlaying: boolean) => void) {
    this.onStateListeners = this.onStateListeners.filter(l => l !== listener);
  }

  private notifyState(playing: boolean) {
    this.onStateListeners.forEach(fn => fn(playing));
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAdhan();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public addOnEndListener(listener: () => void) {
    this.onEndListeners.push(listener);
  }

  public removeOnEndListener(listener: () => void) {
    this.onEndListeners = this.onEndListeners.filter(l => l !== listener);
  }

  private notifyEnd() {
    this.isPlayingAdhanFlag = false;
    this.currentAdhanAudio = null;
    this.onEndListeners.forEach(fn => fn());
    this.notifyState(false);
  }

  // Play Real Human Voice MP3 Recording (NO ROBOT VOICE / SpeechSynthesis)
  public playAdhan(voiceKey?: string): boolean {
    if (this.isMuted) return false;

    this.stopAdhan(); // Stop any currently playing audio first

    const key = voiceKey || localStorage.getItem('raqeeb_adhan_sound') || 'mecca';
    const muezzin = MUEZZIN_LIST.find(m => m.id === key) || MUEZZIN_LIST[0];

    // Ensure AudioContext is unlocked synchronously
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (muezzin.type === 'tone') {
      this.playSpiritualReflectTone();
      this.isPlayingAdhanFlag = true;
      this.notifyState(true);
      setTimeout(() => this.notifyEnd(), 2800);
      return true;
    }

    this.isPlayingAdhanFlag = true;
    this.notifyState(true);
    let urlIndex = 0;

    const tryPlayNextUrl = () => {
      if (urlIndex >= muezzin.urls.length) {
        // If MP3 URLs fail, fall back to gentle chime (NEVER robotic SpeechSynthesis!)
        this.playSpiritualReflectTone();
        setTimeout(() => this.notifyEnd(), 2800);
        return;
      }

      const currentUrl = muezzin.urls[urlIndex];
      urlIndex++;

      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = currentUrl;
        audio.volume = 1.0;

        this.currentAdhanAudio = audio;

        audio.onended = () => {
          this.notifyEnd();
        };

        audio.onerror = () => {
          console.warn(`Failed loading audio from ${currentUrl}, trying next fallback...`);
          tryPlayNextUrl();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn(`HTML5 audio play rejected for ${currentUrl}:`, err);
            tryPlayNextUrl();
          });
        }
      } catch {
        tryPlayNextUrl();
      }
    };

    tryPlayNextUrl();
    return true;
  }

  public stopAdhan() {
    if (this.currentAdhanAudio) {
      try {
        this.currentAdhanAudio.pause();
        this.currentAdhanAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAdhanAudio = null;
    }

    this.isPlayingAdhanFlag = false;
    this.notifyEnd();
  }

  public isAdhanPlaying(): boolean {
    return this.isPlayingAdhanFlag || (!!this.currentAdhanAudio && !this.currentAdhanAudio.paused);
  }

  public playPrayerAlert() {
    this.playAdhan();
  }

  // Gentle spiritual chime for Intention reminder
  public playIntentionChime() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.3); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.6); // G5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  // Subtle reminder chime for 10-minute alert
  public playTenMinReminder() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [440, 554.37].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.15);

      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.8);
    });
  }

  // Deep warning sound when an adult site or forbidden search is attempted
  public playBlockWarning() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.5);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Success click / confirmation sound
  public playSuccessTone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2); // A5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Cross-Device Phone Link Ring (Find My Phone / Buzzer)
  public playPhoneRingTone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [853, 960, 853, 960].forEach((freq, i) => {
      const startTime = now + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  // Shared clipboard sync chime
  public playClipboardTone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [659.25, 783.99, 1046.50].forEach((freq, i) => {
      const startTime = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Soft waterdrop click for digital bead / Istighfar counter
  public playIstighfarClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Deep serene meditative chime for reflection & breathing cycles
  public playSpiritualReflectTone() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => { // C-major chord
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 2.5);
    });
  }
}

export const sounds = new SoundManager();
