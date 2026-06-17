/**
 * themeData.ts — helpers do tema andaimes (SEO local multi-cidade).
 *
 * Tudo lê de src/data/*.json via readData (editável no /admin).
 * A matriz serviço × cidade é GERADA do data — adicionar cidade/serviço
 * no admin faz nascer páginas novas no próximo build, sem hardcode.
 */
import { readData } from './readData';

export interface NapConfig {
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: { rua: string; bairro: string; cidade: string; uf: string; cep: string };
  horario: string;
  redes: { instagram?: string; facebook?: string };
  priceRange: string;
}

export interface Topico {
  nivel: 'h2' | 'h3' | 'h4';
  titulo: string;
  conteudo: string;
}

export interface Servico {
  slug: string;
  nome: string;
  kw: string;
  resumo: string;
  icone: string;
  imagem: string;
  topicos: Topico[];
}

export interface Local {
  slug: string;
  nome: string;
  uf: string;
  prep: string;
  regiao: string;
  bairrosVizinhos: string[];
  referenciaLocal: string;
  faq: { q: string; a: string }[];
  lat?: string;
  lng?: string;
}

export function getConfig(): NapConfig {
  return readData<NapConfig>('config.json', {} as NapConfig);
}

export function getServicos(): Servico[] {
  return readData<Servico[]>('servicos.json', []);
}

export function getLocais(): Local[] {
  return readData<Local[]>('locais.json', []);
}

/** Páginas de blocos criadas via admin (page-builder). Shape: array de BlockPage. */
export function getPaginas(): import('../blocks/types').BlockPage[] {
  return readData('pages.json', []);
}

export function getServico(slug: string): Servico | undefined {
  return getServicos().find((s) => s.slug === slug);
}

export function getLocal(slug: string): Local | undefined {
  return getLocais().find((l) => l.slug === slug);
}

/** URL da matriz aninhada (modelo Clinify): /{local}/{servico} */
export function matrixUrl(servicoSlug: string, localSlug: string): string {
  return `/${localSlug}/${servicoSlug}`;
}

/** Telefone só dígitos, pra href tel: */
export function telDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

/** Monta o link wa.me com mensagem pré-preenchida. */
export function whatsappLink(numero: string, mensagem = ''): string {
  const n = (numero || '').replace(/\D/g, '');
  const base = `https://wa.me/${n}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

/** Endereço NAP montado em uma linha (fonte única — replicar idêntico). */
export function napEndereco(c: NapConfig): string {
  const e = c.endereco || ({} as NapConfig['endereco']);
  const linha1 = [e.rua, e.bairro].filter(Boolean).join(' — ');
  const linha2 = [[e.cidade, e.uf].filter(Boolean).join('/'), e.cep].filter(Boolean).join(' · ');
  return [linha1, linha2].filter(Boolean).join(', ');
}
