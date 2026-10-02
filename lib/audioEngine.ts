'use client'

const AUDIO_URLS = {
  notification: 'https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/sound/Notification.mp3',
  error: 'https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/sound/Error%20UI.mp3',
  warning: 'https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/sound/edtrimkey-warning.mp3',
  success: 'https://ypmnsgpohaaavbjdqjye.supabase.co/storage/v1/object/public/sound/Success%20UI.mp3'
};

let tkAudioCtx: AudioContext | null = null;
const tkAudioBuffers: Record<string, AudioBuffer> = {};
let isInitialized = false;

export function initAudioEngine() {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;
  isInitialized = true;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  tkAudioCtx = new AudioContextClass();

  Object.entries(AUDIO_URLS).forEach(async ([name, url]) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const decodedAudio = await tkAudioCtx!.decodeAudioData(arrayBuffer);
      tkAudioBuffers[name] = decodedAudio;
    } catch (e) {
      console.error(`Failed to preload ${name}:`, e);
    }
  });

  const unlock = () => {
    if (tkAudioCtx?.state === 'suspended') {
      tkAudioCtx.resume();
    }
  };
  document.addEventListener('click', unlock, { once: true });
}

export function playSound(name: keyof typeof AUDIO_URLS) {
  if (typeof window === 'undefined' || !tkAudioCtx) return;

  try {
    if (tkAudioCtx.state === 'suspended') tkAudioCtx.resume();
    
    const buffer = tkAudioBuffers[name];
    if (!buffer) return;

    const source = tkAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(tkAudioCtx.destination);
    source.start(0);
  } catch (e) {
    console.error("Audio Engine Error:", e);
  }
}
