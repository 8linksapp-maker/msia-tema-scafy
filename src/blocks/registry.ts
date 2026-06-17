// Mapa type → componente Astro. Astro não expõe um tipo público estável p/
// componentes, então usamos `unknown` + cast no renderer (seguro: só renderiza).
import PageHeader from './PageHeader.astro';
import Hero from './Hero.astro';
import Sobre from './Sobre.astro';
import Servicos from './Servicos.astro';
import Numeros from './Numeros.astro';
import PorqueEscolher from './PorqueEscolher.astro';
import ComoFunciona from './ComoFunciona.astro';
import Equipe from './Equipe.astro';
import Depoimentos from './Depoimentos.astro';
import AntesDepois from './AntesDepois.astro';
import Novidades from './Novidades.astro';
import CtaContato from './CtaContato.astro';

export const blockRegistry: Record<string, unknown> = {
  pageHeader: PageHeader,
  hero: Hero,
  sobre: Sobre,
  servicos: Servicos,
  numeros: Numeros,
  porqueEscolher: PorqueEscolher,
  comoFunciona: ComoFunciona,
  equipe: Equipe,
  depoimentos: Depoimentos,
  antesDepois: AntesDepois,
  novidades: Novidades,
  ctaContato: CtaContato,
};
