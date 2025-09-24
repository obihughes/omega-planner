// Lightweight celebration utilities (confetti + success chime)

let audioCtx: AudioContext | null = null;

function ensureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  try { (audioCtx as any).resume?.(); } catch {}
  return audioCtx;
}

function playTone(frequency: number, durationMs: number, volume = 0.05) {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  oscillator.start(now);
  oscillator.stop(now + durationMs / 1000);
}

function isSoundEnabled(): boolean {
  // Reuse Focus page preference if present
  try {
    if (typeof window === 'undefined') return true;
    const raw = window.localStorage.getItem('omega-planner-focus-sound-enabled-v1');
    if (raw == null) return true;
    return raw === '1' || raw === 'true';
  } catch { return true; }
}

export function playSuccessChime() {
  if (!isSoundEnabled()) return;
  playTone(880, 120, 0.06);
  setTimeout(() => playTone(1175, 140, 0.06), 130);
  setTimeout(() => playTone(1568, 180, 0.05), 300);
}

export function spawnConfettiAt(x: number, y: number) {
  if (typeof document === 'undefined') return;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  const colors = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F', '#8338EC'];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    const w = 6 + Math.random() * 4;
    const h = 8 + Math.random() * 6;
    piece.style.position = 'absolute';
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.width = `${w}px`;
    piece.style.height = `${h}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.opacity = '1';
    piece.style.transform = `translate3d(0,0,0) rotate(${Math.floor(Math.random() * 360)}deg)`;
    piece.style.transition = 'transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms linear';
    piece.style.willChange = 'transform, opacity';
    container.appendChild(piece);

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 120;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance * 1.2 + 10;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        piece.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${Math.floor(Math.random() * 360)}deg)`;
        piece.style.opacity = '0';
      });
    });
  }

  setTimeout(() => {
    if (container.parentNode) container.parentNode.removeChild(container);
  }, 900);
}

export function spawnConfettiFromElement(el: HTMLElement | null) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  spawnConfettiAt(x, y);
}

export function celebrateAtElement(el: HTMLElement | null) {
  spawnConfettiFromElement(el);
  try { playSuccessChime(); } catch {}
}


