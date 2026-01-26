import {
  docs,
  r36sDocs,
  miyooDocs,
  rg35xxDocs,
  trimuiDocs,
  powkiddyDocs
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
 * Miyoo Mini console documentation source.
 */
export const miyooSource = loader({
  baseUrl: '/miyoo',
  source: miyooDocs.toFumadocsSource(),
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
 * TrimUI console documentation source.
 */
export const trimuiSource = loader({
  baseUrl: '/trimui',
  source: trimuiDocs.toFumadocsSource(),
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
 * Combined source for search.
 */
export const searchSource = loader({
  baseUrl: '/',
  source: multiple({
    docs: docs.toFumadocsSource(),
    r36s: r36sDocs.toFumadocsSource(),
    miyoo: miyooDocs.toFumadocsSource(),
    rg35xx: rg35xxDocs.toFumadocsSource(),
    trimui: trimuiDocs.toFumadocsSource(),
    powkiddy: powkiddyDocs.toFumadocsSource(),
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
