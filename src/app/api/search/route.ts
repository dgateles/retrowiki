import { source, r36sSource, miyooMiniPlusSource, rg35xxSource, trimuiSmartBrickSource, rg40xxhSource, powkiddySource } from '@/lib/source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const revalidate = false;

// Combina todas as páginas de todas as fontes em um único índice de busca
const allPages = [
  ...source.getPages(),
  ...r36sSource.getPages(),
  ...miyooMiniPlusSource.getPages(),
  ...rg35xxSource.getPages(),
  ...trimuiSmartBrickSource.getPages(),
  ...rg40xxhSource.getPages(),
  ...powkiddySource.getPages(),
];

export const { staticGET: GET } = createSearchAPI('advanced', {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'portuguese',
  indexes: allPages.map((page) => ({
    id: page.url,
    url: page.url,
    title: page.data.title,
    description: page.data.description,
    structuredData: page.data.structuredData,
  })),
});
