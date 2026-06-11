// Configuração declarativa dos efeitos de fundo customizáveis (React Bits).
// Dirige tanto o painel de controles no construtor quanto os valores aplicados
// no render (SectionFx). Cada efeito lista seus controles com rótulo PT-BR e
// um valor padrão; o valor efetivo vem de section.fxParams (ou do padrão).

export type FxParamValue = string | number | boolean;
export type FxParams = Record<string, FxParamValue>;

export type FxControl =
  | { key: string; label: string; type: "color"; default: string }
  | { key: string; label: string; type: "slider"; min: number; max: number; step: number; default: number }
  | { key: string; label: string; type: "toggle"; default: boolean }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[]; default: string };

export type FxEffect = { label: string; controls: FxControl[] };

const c = (key: string, label: string, def: string): FxControl => ({ key, label, type: "color", default: def });
const s = (key: string, label: string, min: number, max: number, step: number, def: number): FxControl => ({ key, label, type: "slider", min, max, step, default: def });
const t = (key: string, label: string, def: boolean): FxControl => ({ key, label, type: "toggle", default: def });

// Chaves de bg que abrem o customizador.
export const FX_EFFECTS: Record<string, FxEffect> = {
  lightfall: {
    label: "Lightfall",
    controls: [
      c("color1", "Cor 1", "#10b981"), c("color2", "Cor 2", "#6366f1"), c("color3", "Cor 3", "#22d3ee"),
      c("backgroundColor", "Fundo", "#0a0f1a"),
      s("speed", "Velocidade", 0, 2, 0.1, 0.5),
      s("streakCount", "Qtd. de feixes", 1, 10, 1, 2),
      s("streakWidth", "Largura do feixe", 0.2, 3, 0.1, 1),
      s("streakLength", "Comprimento", 0.2, 3, 0.1, 1),
      s("density", "Densidade", 0, 1, 0.05, 0.6),
      s("twinkle", "Cintilação", 0, 2, 0.1, 1),
      s("glow", "Brilho", 0, 2, 0.1, 1),
      s("backgroundGlow", "Brilho do fundo", 0, 1, 0.05, 0.5),
      s("zoom", "Zoom", 1, 5, 0.5, 3),
      t("mouseInteraction", "Luz no cursor", false),
      s("mouseStrength", "Força do cursor", 0, 1, 0.05, 0.5),
      s("mouseRadius", "Raio do cursor", 0, 2, 0.1, 1),
    ],
  },
  lightpillar: {
    label: "Pilar de luz",
    controls: [
      c("topColor", "Cor superior", "#6366f1"), c("bottomColor", "Cor inferior", "#10b981"),
      s("intensity", "Intensidade", 0, 2, 0.1, 1),
      s("rotationSpeed", "Velocidade de rotação", 0, 1, 0.05, 0.3),
      s("glowAmount", "Brilho", 0, 0.02, 0.001, 0.005),
      s("pillarWidth", "Largura do pilar", 0.5, 6, 0.1, 3),
      s("pillarHeight", "Altura do pilar", 0.1, 1, 0.05, 0.4),
      s("noiseIntensity", "Ruído", 0, 1, 0.05, 0.5),
      s("pillarRotation", "Rotação do pilar", -45, 45, 1, 25),
      t("interactive", "Interativo", false),
      { key: "mixBlendMode", label: "Mistura", type: "select", default: "screen", options: [
        { value: "screen", label: "Screen" }, { value: "normal", label: "Normal" }, { value: "plus-lighter", label: "Plus lighter" }, { value: "overlay", label: "Overlay" } ] },
      { key: "quality", label: "Qualidade", type: "select", default: "high", options: [
        { value: "low", label: "Baixa" }, { value: "medium", label: "Média" }, { value: "high", label: "Alta" } ] },
    ],
  },
  silk: {
    label: "Silk",
    controls: [
      s("speed", "Velocidade", 0, 10, 0.5, 5),
      s("scale", "Escala", 0.1, 3, 0.1, 1),
      s("noiseIntensity", "Ruído", 0, 3, 0.1, 1.5),
      s("rotation", "Rotação", 0, 6.28, 0.05, 0),
      c("color", "Cor", "#10b981"),
    ],
  },
  siderays: {
    label: "Raios laterais",
    controls: [
      c("rayColor1", "Cor do raio 1", "#10b981"), c("rayColor2", "Cor do raio 2", "#6366f1"),
      { key: "origin", label: "Origem", type: "select", default: "top-right", options: [
        { value: "top-right", label: "Topo direita" }, { value: "top-left", label: "Topo esquerda" }, { value: "bottom-right", label: "Base direita" }, { value: "bottom-left", label: "Base esquerda" } ] },
      s("speed", "Velocidade", 0, 5, 0.1, 2.5),
      s("intensity", "Intensidade", 0, 4, 0.1, 2),
      s("spread", "Espalhamento", 0, 4, 0.1, 2),
      s("tilt", "Inclinação", -2, 2, 0.1, 0),
      s("saturation", "Saturação", 0, 2, 0.1, 1.5),
      s("blend", "Mistura", 0, 1, 0.05, 0.75),
      s("falloff", "Atenuação", 0, 3, 0.1, 1.6),
      s("opacity", "Opacidade", 0, 1, 0.05, 1),
    ],
  },
  pixelblast: {
    label: "Pixel Blast",
    controls: [
      c("color", "Cor", "#10b981"),
      { key: "variant", label: "Forma", type: "select", default: "square", options: [
        { value: "square", label: "Quadrado" }, { value: "circle", label: "Círculo" }, { value: "triangle", label: "Triângulo" }, { value: "diamond", label: "Losango" } ] },
      s("pixelSize", "Tamanho do pixel", 1, 12, 1, 4),
      s("patternScale", "Escala do padrão", 0.5, 4, 0.1, 2),
      s("patternDensity", "Densidade", 0, 2, 0.1, 1),
      s("pixelSizeJitter", "Variação", 0, 2, 0.1, 0),
      s("speed", "Velocidade", 0, 2, 0.1, 0.5),
      s("edgeFade", "Esmaecer bordas", 0, 1, 0.05, 0.25),
      t("enableRipples", "Ondas", true),
      t("liquid", "Líquido", false),
    ],
  },
  softaurora: {
    label: "Aurora suave",
    controls: [
      c("color1", "Cor 1", "#10b981"), c("color2", "Cor 2", "#6366f1"),
      s("speed", "Velocidade", 0, 2, 0.1, 0.6),
      s("scale", "Escala", 0.5, 3, 0.1, 1.5),
      s("brightness", "Brilho", 0, 2, 0.1, 1),
      s("noiseFrequency", "Frequência do ruído", 0, 5, 0.1, 2.5),
      s("noiseAmplitude", "Amplitude do ruído", 0, 2, 0.1, 1),
      s("bandHeight", "Altura da banda", 0, 1, 0.05, 0.5),
      s("bandSpread", "Espalhamento", 0, 2, 0.1, 1),
      s("octaveDecay", "Decaimento", 0, 1, 0.05, 0.1),
      s("layerOffset", "Deslocamento", -1, 1, 0.05, 0),
      s("colorSpeed", "Velocidade da cor", 0, 2, 0.1, 1),
      t("enableMouseInteraction", "Interação com mouse", false),
      s("mouseInfluence", "Influência do mouse", 0, 1, 0.05, 0.25),
    ],
  },
  aurora: {
    label: "Aurora",
    controls: [
      c("color1", "Cor 1", "#10b981"), c("color2", "Cor 2", "#6366f1"), c("color3", "Cor 3", "#22d3ee"),
      s("speed", "Velocidade", 0, 2, 0.1, 1),
      s("blend", "Mistura", 0, 1, 0.05, 0.5),
      s("amplitude", "Amplitude", 0, 2, 0.1, 1),
    ],
  },
  grainient: {
    label: "Grainient",
    controls: [
      c("color1", "Cor 1", "#10b981"), c("color2", "Cor 2", "#6366f1"), c("color3", "Cor 3", "#b497cf"),
      s("timeSpeed", "Velocidade", 0, 1, 0.05, 0.25),
      s("colorBalance", "Equilíbrio de cor", -1, 1, 0.05, 0),
      s("warpStrength", "Força da distorção", 0, 3, 0.1, 1),
      s("warpFrequency", "Frequência", 0, 10, 0.1, 5),
      s("warpSpeed", "Velocidade da distorção", 0, 5, 0.1, 2),
      s("warpAmplitude", "Amplitude", 0, 100, 1, 50),
      s("blendAngle", "Ângulo da mistura", 0, 360, 1, 0),
      s("blendSoftness", "Suavidade", 0, 1, 0.01, 0.05),
      s("rotationAmount", "Rotação", 0, 1000, 10, 500),
      s("noiseScale", "Escala do ruído", 0, 5, 0.1, 2),
      s("grainAmount", "Granulado", 0, 1, 0.05, 0.1),
      s("grainScale", "Escala do grão", 0, 5, 0.1, 2),
      t("grainAnimated", "Grão animado", false),
      s("contrast", "Contraste", 0, 3, 0.1, 1.5),
      s("gamma", "Gama", 0, 3, 0.1, 1),
      s("saturation", "Saturação", 0, 2, 0.1, 1),
      s("centerX", "Centro X", -1, 1, 0.05, 0),
      s("centerY", "Centro Y", -1, 1, 0.05, 0),
      s("zoom", "Zoom", 0.1, 2, 0.05, 0.9),
    ],
  },
};

export const FX_EFFECT_KEYS = Object.keys(FX_EFFECTS);

/** Mapa key→default para um efeito. */
export function fxDefaults(effect: string): FxParams {
  const e = FX_EFFECTS[effect];
  if (!e) return {};
  const out: FxParams = {};
  for (const ctl of e.controls) out[ctl.key] = ctl.default;
  return out;
}

/** Valor efetivo de um controle: o salvo em params, senão o padrão. */
export function fxVal(effect: string, params: FxParams | undefined, key: string): FxParamValue | undefined {
  const v = params?.[key];
  if (v !== undefined && v !== null) return v;
  const ctl = FX_EFFECTS[effect]?.controls.find((x) => x.key === key);
  return ctl?.default;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Cor válida (#rrggbb) ou fallback. */
export function fxColor(effect: string, params: FxParams | undefined, key: string): string {
  const v = fxVal(effect, params, key);
  return typeof v === "string" && HEX.test(v) ? v : "#10b981";
}
export function fxNum(effect: string, params: FxParams | undefined, key: string): number {
  const v = fxVal(effect, params, key);
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
export function fxBool(effect: string, params: FxParams | undefined, key: string): boolean {
  return Boolean(fxVal(effect, params, key));
}
export function fxStr(effect: string, params: FxParams | undefined, key: string): string {
  const v = fxVal(effect, params, key);
  return typeof v === "string" ? v : "";
}
