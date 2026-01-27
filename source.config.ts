import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';

/**
 * Main documentation source (general guides).
 */
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * R36S console documentation.
 */
export const r36sDocs = defineDocs({
  dir: 'content/r36s',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * Miyoo Mini Plus console documentation.
 */
export const miyooMiniPlusDocs = defineDocs({
  dir: 'content/miyoo-mini-plus',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * RG35XX console documentation.
 */
export const rg35xxDocs = defineDocs({
  dir: 'content/rg35xx',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * TrimUI Smart Brick console documentation.
 */
export const trimuiSmartBrickDocs = defineDocs({
  dir: 'content/trimui-smart-brick',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * RG40XX H console documentation.
 */
export const rg40xxhDocs = defineDocs({
  dir: 'content/rg40xxh',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * PowKiddy console documentation.
 */
export const powkiddyDocs = defineDocs({
  dir: 'content/powkiddy',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
