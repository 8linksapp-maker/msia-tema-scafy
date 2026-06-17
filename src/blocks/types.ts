// Block types do page-builder do andaimes. Cada `type` mapeia 1:1 pra um
// componente Astro em registry.ts. Usado pra criar PÁGINAS NOVAS via admin
// (PageEditor, próximo passo) — NÃO converte home/sobre/contato.
export const BLOCK_TYPES = [
  'pageHeader',
  'hero', 'sobre', 'servicos', 'numeros', 'porqueEscolher',
  'comoFunciona', 'equipe', 'depoimentos', 'antesDepois',
  'novidades', 'ctaContato',
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export interface Block { type: BlockType; props: Record<string, unknown>; }

/** Shape de uma página-de-blocos (pages.json é um array destes). */
export interface BlockPage {
  slug: string;
  title: string;
  description: string;
  blocks: Block[];
}
