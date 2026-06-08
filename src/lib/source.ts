import {
  docs,
  r36sDocs,
  miyooMiniPlusDocs,
  rg35xxDocs,
  trimuiSmartBrickDocs,
  rg40xxhDocs,
  powkiddyDocs,
  retroidPocket5Docs,
  retroidPocketMiniV2Docs,
  rg406vDocs,
  mangmiAirXDocs,
  retroidPocket6Docs
} from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader, multiple } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

/**
 * General documentation source.
 */
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * R36S console documentation source.
 */
export const r36sSource = loader({
  baseUrl: '/r36s',
  source: r36sDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Miyoo Mini Plus console documentation source.
 */
export const miyooMiniPlusSource = loader({
  baseUrl: '/miyoo-mini-plus',
  source: miyooMiniPlusDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * RG35XX console documentation source.
 */
export const rg35xxSource = loader({
  baseUrl: '/rg35xx',
  source: rg35xxDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * TrimUI Smart Brick console documentation source.
 */
export const trimuiSmartBrickSource = loader({
  baseUrl: '/trimui-smart-brick',
  source: trimuiSmartBrickDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * RG40XX H console documentation source.
 */
export const rg40xxhSource = loader({
  baseUrl: '/rg40xxh',
  source: rg40xxhDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * PowKiddy console documentation source.
 */
export const powkiddySource = loader({
  baseUrl: '/powkiddy',
  source: powkiddyDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Retroid Pocket 5 console documentation source.
 */
export const retroidPocket5Source = loader({
  baseUrl: '/retroid-pocket-5',
  source: retroidPocket5Docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Retroid Pocket Mini V2 console documentation source.
 */
export const retroidPocketMiniV2Source = loader({
  baseUrl: '/retroid-pocket-mini-v2',
  source: retroidPocketMiniV2Docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Anbernic RG-406V console documentation source.
 */
export const rg406vSource = loader({
  baseUrl: '/rg-406v',
  source: rg406vDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Mangmi Air X console documentation source.
 */
export const mangmiAirXSource = loader({
  baseUrl: '/mangmi-air-x',
  source: mangmiAirXDocs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Retroid Pocket 6 console documentation source.
 */
export const retroidPocket6Source = loader({
  baseUrl: '/retroid-pocket-6',
  source: retroidPocket6Docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

/**
 * Combined source for search.
 */
export const searchSource = loader({
  baseUrl: '/',
  source: multiple({
    docs: docs.toFumadocsSource(),
    r36s: r36sDocs.toFumadocsSource(),
    'miyoo-mini-plus': miyooMiniPlusDocs.toFumadocsSource(),
    rg35xx: rg35xxDocs.toFumadocsSource(),
    'trimui-smart-brick': trimuiSmartBrickDocs.toFumadocsSource(),
    rg40xxh: rg40xxhDocs.toFumadocsSource(),
    powkiddy: powkiddyDocs.toFumadocsSource(),
    'retroid-pocket-5': retroidPocket5Docs.toFumadocsSource(),
    'retroid-pocket-mini-v2': retroidPocketMiniV2Docs.toFumadocsSource(),
    'rg-406v': rg406vDocs.toFumadocsSource(),
    'mangmi-air-x': mangmiAirXDocs.toFumadocsSource(),
    'retroid-pocket-6': retroidPocket6Docs.toFumadocsSource(),
  }),
  plugins: [lucideIconsPlugin()],
});

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
