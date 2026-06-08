// RetroGuard — Proof-of-Work solver (Web Worker). Roda fora da thread da UI.
// Encontra um `counter` tal que sha256(nonce + counter) tenha `difficulty`
// bits zero à esquerda. Invisível ao usuário.
self.onmessage = async (e) => {
  const { nonce, difficulty } = e.data;
  let counter = 0;
  const enc = new TextEncoder();
  // teto de segurança para não travar (dificuldade alta improvável aqui)
  const MAX = 50_000_000;
  while (counter < MAX) {
    const buf = enc.encode(nonce + counter);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
    if (leadingZeroBits(digest) >= difficulty) {
      self.postMessage({ counter });
      return;
    }
    counter++;
  }
  self.postMessage({ error: "max-iterations" });
};

function leadingZeroBits(bytes) {
  let bits = 0;
  for (const byte of bytes) {
    if (byte === 0) {
      bits += 8;
      continue;
    }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}
