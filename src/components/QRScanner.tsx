'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onScan: (data: string) => void;
  onError: (message: string) => void;
  active: boolean; // stop camera when tab is not visible
}

export default function QRScanner({ onScan, onError, active }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number>(0);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!active) {
      stopCamera();
      return;
    }
    startCamera();
    return () => stopCamera();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // rear camera on phones
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
        setScanning(true);
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        onError('Camera access denied. Please allow camera access in your browser settings.');
      } else {
        onError('Could not access camera. Please try again.');
      }
    }
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  function tick() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Dynamic import jsQR to keep it out of the initial bundle
    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      if (code?.data) {
        stopCamera();
        onScan(code.data);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    });
  }

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      {/* Viewfinder overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 border-2 border-white rounded-xl opacity-60" />
      </div>
      {!scanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="text-white text-sm">Starting camera…</p>
        </div>
      )}
    </div>
  );
}
