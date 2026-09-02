import { useEffect, useRef, useCallback } from 'react';

const SIREN_URL = '/assets/siren.mp3';
const SIREN_VOLUME = 0.6;

export default function useDemoAlarm(active, muted) {
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
        startedRef.current = false;
      }
      return;
    }

    if (startedRef.current) return;

    const audio = new Audio(SIREN_URL);
    audio.loop = true;
    audio.volume = SIREN_VOLUME;
    audio.preload = 'auto';
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        startedRef.current = true;
      }).catch(() => {
        startedRef.current = false;
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
        startedRef.current = false;
      }
    };
  }, [active]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = muted;
  }, [muted]);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const retry = useCallback(() => {
    if (!audioRef.current) {
      startedRef.current = false;
      const audio = new Audio(SIREN_URL);
      audio.loop = true;
      audio.volume = SIREN_VOLUME;
      audio.preload = 'auto';
      audioRef.current = audio;
      audio.play().then(() => {
        startedRef.current = true;
      }).catch(() => {});
    }
  }, []);

  return { resume, retry };
}
