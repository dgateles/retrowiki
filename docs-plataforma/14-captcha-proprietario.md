# 14 — Captcha Proprietário (RetroGuard)

Defesa **própria** contra bots e spam no cadastro (e em submissões/comentários),
sem depender de terceiros (Turnstile/hCaptcha/reCAPTCHA). Projetada para ser
**invisível por padrão**, **acessível** (WCAG 2.2 — SC 3.3.8 Autenticação
Acessível) e **respeitosa com privacidade**.

> **Premissa honesta:** nenhum captcha sozinho "resolve" bots — especialmente
> fazendas humanas. RetroGuard **eleva o custo** do abuso automatizado e se
> combina com **verificação de e-mail** (doc 12), **rate limiting**, **reputação**
> e **moderação** (doc 04/09). É uma camada, não uma bala de prata.

## 14.1 Estratégia em camadas

| Camada | O que faz | Custo p/ usuário | Custo p/ bot em escala |
|---|---|---|---|
| **1. Proof-of-Work (PoW) invisível** | Cliente resolve um quebra-cabeça computacional | ~Imperceptível (Web Worker) | **Alto** (CPU × N tentativas) |
| **2. Sinais comportamentais** | Honeypot, tempo de preenchimento, interação, prova de JS | Zero | Médio (precisa simular navegador real) |
| **3. Nonce assinado + single-use** | Impede replay e precomputação | Zero | Alto (cada tentativa exige desafio novo) |
| **4. Desafio adaptativo (step-up)** | Só para risco alto: dificuldade maior ou desafio acessível | Baixo (raro) | Alto |
| **5. Reputação de IP + rate limit** | Bloqueia origens abusivas/datacenter | Zero | Alto |

A maioria dos usuários legítimos passa pelas camadas 1–3 **sem ver nada**.

## 14.2 Camada 1 — Proof-of-Work invisível

O servidor emite um desafio; o cliente precisa achar um `counter` tal que
`sha256(nonce || counter)` tenha **D bits zero à esquerda**. Verificação é O(1);
resolução é O(2^D) em média. `D` (dificuldade) é **adaptativo** ao risco.

### Emissão do desafio (servidor)

O desafio é **assinado (HMAC)** e **stateless** — carrega tudo que o servidor
precisa para verificar sem guardar estado, exceto o registro anti-replay.

```ts
// lib/captcha/challenge.ts
import 'server-only';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = process.env.CAPTCHA_SECRET!;          // env, server-only
const TTL_MS = 2 * 60_000;                            // 2 min

export type Challenge = {
  nonce: string; difficulty: number; action: string; exp: number; sig: string;
};

function sign(c: Omit<Challenge, 'sig'>): string {
  const data = `${c.nonce}.${c.difficulty}.${c.action}.${c.exp}`;
  return createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function issueChallenge(action: string, difficulty: number): Challenge {
  const base = { nonce: randomBytes(16).toString('hex'),
                 difficulty, action, exp: nowMs() + TTL_MS };
  return { ...base, sig: sign(base) };
}

export function verifySig(c: Challenge): boolean {
  const expected = sign({ nonce: c.nonce, difficulty: c.difficulty, action: c.action, exp: c.exp });
  const a = Buffer.from(expected), b = Buffer.from(c.sig);
  return a.length === b.length && timingSafeEqual(a, b) && c.exp > nowMs();
}
```

> `nowMs()` deve usar o relógio do servidor. (Em ambientes que proíbem
> `Date.now()` em scripts isolados, o servidor real não tem essa restrição.)

### Resolução (cliente, em Web Worker — não trava a UI)

```ts
// public/captcha-worker.js  (Web Worker)
self.onmessage = async (e) => {
  const { nonce, difficulty } = e.data;
  let counter = 0;
  while (true) {
    const buf = new TextEncoder().encode(nonce + counter);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
    if (leadingZeroBits(hash) >= difficulty) { self.postMessage({ counter }); return; }
    counter++;
  }
};
function leadingZeroBits(bytes) {
  let bits = 0;
  for (const byte of bytes) {
    if (byte === 0) { bits += 8; continue; }
    bits += Math.clz32(byte) - 24; break;
  }
  return bits;
}
```

```ts
// componente cliente: roda ao focar o formulário, sem fricção
const worker = new Worker('/captcha-worker.js');
worker.postMessage({ nonce: challenge.nonce, difficulty: challenge.difficulty });
worker.onmessage = (e) => setSolution({ ...challenge, counter: e.data.counter });
```

### Verificação (servidor)

```ts
// lib/captcha/verify.ts
import 'server-only';
import { createHash } from 'node:crypto';

export async function verifyCaptcha(
  solution: Challenge & { counter: number; signals?: Signals },
  ctx: { action: string },
): Promise<boolean> {
  // 1) assinatura válida, não expirada, e ação correta (anti-precomputação)
  if (!verifySig(solution) || solution.action !== ctx.action) return false;

  // 2) anti-replay: nonce só pode ser consumido uma vez
  const fresh = await consumeNonce(solution.nonce, solution.exp); // INSERT único; falha se já existe
  if (!fresh) return false;

  // 3) PoW realmente resolvido
  const hash = createHash('sha256').update(solution.nonce + solution.counter).digest();
  if (leadingZeroBits(hash) < solution.difficulty) return false;

  // 4) sinais comportamentais (camada 2) — pode exigir step-up em vez de barrar
  if (solution.signals && riskFromSignals(solution.signals) === 'BLOCK') return false;

  return true;
}
```

`consumeNonce` grava o nonce numa tabela com TTL (limpa por cron):

```prisma
model CaptchaNonce {
  nonce String   @id
  exp   DateTime
  @@index([exp])
}
```

## 14.3 Camada 2 — Sinais comportamentais

Coletados no cliente e enviados junto da solução; pontuados no servidor.

- **Honeypot:** campo oculto (`aria-hidden`, fora da tela, `autocomplete="off"`,
  `tabindex="-1"`) que humanos não preenchem. Preenchido ⇒ bot.
- **Tempo de preenchimento:** submissão em < ~1,5 s ⇒ suspeito.
- **Prova de execução de JS:** resolver o PoW já prova que JS rodou (bots simples
  sem JS não passam).
- **Entropia de interação (opcional, privacy-friendly):** houve `focus`,
  `keydown`, movimento de ponteiro? Guardamos **booleans/contagens agregadas**, não
  trajetórias — nada de fingerprinting invasivo.

```ts
type Signals = { honeypot: string; elapsedMs: number; interacted: boolean };
function riskFromSignals(s: Signals): 'OK' | 'STEP_UP' | 'BLOCK' {
  if (s.honeypot) return 'BLOCK';
  if (s.elapsedMs < 1500 || !s.interacted) return 'STEP_UP';
  return 'OK';
}
```

## 14.4 Camada 3 — Dificuldade adaptativa

`D` (bits do PoW) varia conforme o risco da origem — invisível para a maioria,
caro para abusadores:

| Sinal de risco | Dificuldade `D` | Tempo aprox. (cliente típico) |
|---|---|---|
| Origem limpa, 1ª tentativa | 16 | ~50–150 ms |
| IP com histórico ruim / datacenter | 20 | ~0,5–1,5 s |
| Rajada (muitas tentativas/janela) | 22–24 | vários segundos |

A escolha de `D` acontece na **emissão** (`issueChallenge`), a partir de
reputação de IP + rate counters. O cliente nunca escolhe a dificuldade (vem
assinada).

## 14.5 Camada 4 — Step-up acessível (só quando necessário)

Se as camadas 1–3 indicarem risco alto (e não bloqueio direto), pedimos um
desafio extra — **sem testes cognitivos** (exigência da SC 3.3.8):

- **Preferencial:** elevar a dificuldade do PoW (continua invisível, só mais
  lento). Resolve a maioria dos casos sem UI extra.
- **Se ainda assim suspeito:** desafio interativo **acessível** com alternativas:
  - versão **textual/áudio** equivalente (nunca só imagem);
  - rótulos/instruções por leitor de tela;
  - **caminho alternativo garantido:** concluir o cadastro via **verificação de
    e-mail** (doc 12) — assim ninguém fica trancado por não conseguir um desafio
    visual. A conta só ganha permissões após confirmar o e-mail de qualquer forma.

> Regra de acessibilidade: o fluxo **padrão é invisível** (PoW) e **não** depende
> de reconhecer objetos/texto distorcido. O step-up sempre oferece alternativa
> não-cognitiva. Validar com axe + teclado + leitor de tela (ver [07](./07-semantica-e-acessibilidade.md)).

## 14.6 Integração nos fluxos

```ts
// no cadastro (doc 12) e em submissão/comentário (doc 04)
const ok = await verifyCaptcha(input.captcha, { action: 'register' });
if (!ok) return { ok: false, error: 'CAPTCHA' };
```

- `action` distinto por fluxo (`register`, `submit`, `comment`) — um desafio de
  cadastro não vale para submissão (escopo + anti-reuso).
- Sempre combinado com **rate limit** e, no cadastro, com **verificação de
  e-mail** obrigatória.

## 14.7 Análise de ameaças

| Ataque | Defesa |
|---|---|
| **Replay** (reusar uma solução válida) | Nonce single-use (`consumeNonce`) + `exp` curto |
| **Precomputação** (gerar soluções offline) | Nonce aleatório do servidor + HMAC + TTL + `action` ligada |
| **Adulterar dificuldade** (mandar `D=0`) | `D` faz parte do HMAC; alteração invalida a assinatura |
| **Bots sem JS** | PoW exige `crypto.subtle` (JS real) |
| **Solvers distribuídos / botnets** | Custo de PoW × rate limit × reputação de IP × dificuldade adaptativa |
| **Fazendas humanas** | PoW não barra humanos — mas e-mail verificado + reputação + moderação + custo por conta limitam o ganho |
| **Bypass de acessibilidade** | Fluxo padrão invisível; step-up com alternativa por e-mail (ninguém fica preso) |
| **DoS no emissor de desafios** | Emissão é barata e cacheável; rate limit no endpoint de desafio |
| **Roubo do segredo** | `CAPTCHA_SECRET` em env (server-only); rotação periódica |

## 14.8 Privacidade

- **Sem terceiros**: nenhum dado sai para Google/Cloudflare.
- **Sem fingerprinting invasivo**: guardamos sinais agregados (booleans/contagens),
  não trajetórias de mouse nem identificadores persistentes.
- IP usado só para rate limit/reputação, **armazenado com hash** quando persistido.
- Transparente nas diretrizes/política de privacidade.

## 14.9 Limites e operação

- Ajustar `D` por métricas reais (taxa de abuso vs. tempo de resolução). Começar
  conservador (16) e subir sob ataque.
- Monitorar: tentativas bloqueadas, distribuição de dificuldade, falsos positivos
  (usuários legítimos barrados → revisar limiares).
- Manter `CaptchaNonce` enxuta (cron limpa expirados).
- Reavaliar periodicamente: se o abuso escalar além do que o PoW comporta,
  RetroGuard pode **coexistir** com um provedor externo como camada adicional —
  sem reescrever os fluxos (a interface `verifyCaptcha` permanece).
