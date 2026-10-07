/** Bipe curto de aviso (como no app original). Sem som disponível, não faz nada. */
export function beep(): void {
  try {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.frequency.value = 880;
    gain.gain.value = 0.15;
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      void context.close();
    }, 400);
  } catch {
    // sem áudio: o aviso em texto na tela continua valendo
  }
}
