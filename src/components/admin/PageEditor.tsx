import React, { useState, useEffect } from 'react';
import {
    Save, AlertCircle, Loader2, ChevronDown, ChevronUp,
    Trash2, Plus, GripVertical, FileText,
} from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

const FILE_PATH = 'src/data/pages.json';
const SERVICOS_PATH = 'src/data/servicos.json';

// Slugs reservados por rotas estáticas do tema (precedência sobre [slug].astro).
const RESERVED_SLUGS = ['sobre', 'contato', 'blog', 'privacidade', 'termos', 'search'];

// ─── Types (espelham app/src/blocks/types.ts + as props canônicas dos .astro) ──

interface Crumb { label: string; href: string; }

interface PageHeaderProps { eyebrow?: string; title: string; lead?: string; breadcrumb?: Crumb[]; }
interface HeroProps { eyebrow?: string; title: string; lead?: string; imagem?: string; ctaLabel?: string; ctaMensagem?: string; }
interface SobreProps { imagem?: string; badge?: string; eyebrow?: string; title: string; lead?: string; benefits?: string[]; ctaLabel?: string; ctaHref?: string; }
interface ServicosProps { eyebrow?: string; title: string; items?: { title: string; text?: string; href?: string; imagem?: string }[]; ctaLabel?: string; ctaHref?: string; }
interface NumerosProps { stats?: { value: string; label: string }[]; }
interface PorqueEscolherProps { eyebrow?: string; title: string; imagem?: string; features?: { title: string; text?: string }[]; }
interface ComoFuncionaProps { eyebrow?: string; title: string; steps?: { n: string; title: string; text?: string }[]; }
interface EquipeProps { eyebrow?: string; title: string; members?: { name: string; role?: string; photo?: string }[]; }
interface DepoimentosProps { eyebrow?: string; title: string; rating?: { score: string; label: string }; items?: { quote: string; name: string; role?: string }[]; }
interface AntesDepoisProps { eyebrow?: string; title: string; items?: { label: string; before?: string; after?: string }[]; }
interface NovidadesProps { eyebrow?: string; title: string; items?: { title: string; excerpt?: string; image?: string; href: string }[]; }
interface CtaContatoProps { eyebrow?: string; title: string; lead?: string; origem?: string; ctaMensagem?: string; }

type BlockType =
    | { type: 'pageHeader'; props: PageHeaderProps }
    | { type: 'hero'; props: HeroProps }
    | { type: 'sobre'; props: SobreProps }
    | { type: 'servicos'; props: ServicosProps }
    | { type: 'numeros'; props: NumerosProps }
    | { type: 'porqueEscolher'; props: PorqueEscolherProps }
    | { type: 'comoFunciona'; props: ComoFuncionaProps }
    | { type: 'equipe'; props: EquipeProps }
    | { type: 'depoimentos'; props: DepoimentosProps }
    | { type: 'antesDepois'; props: AntesDepoisProps }
    | { type: 'novidades'; props: NovidadesProps }
    | { type: 'ctaContato'; props: CtaContatoProps };

interface BlockPage { slug: string; title: string; description: string; blocks: BlockType[]; }

// ─── Maps ──────────────────────────────────────────────────────────────────
const BLOCK_LABELS: Record<string, string> = {
    pageHeader: 'Cabeçalho da página',
    hero: 'Hero',
    sobre: 'Sobre',
    servicos: 'Serviços (cards)',
    numeros: 'Números',
    porqueEscolher: 'Por que escolher',
    comoFunciona: 'Como funciona',
    equipe: 'Equipe / frota',
    depoimentos: 'Depoimentos',
    antesDepois: 'Antes e depois',
    novidades: 'Novidades (blog)',
    ctaContato: 'CTA de contato',
};

const BLOCK_ORDER: BlockType['type'][] = [
    'pageHeader', 'hero', 'sobre', 'servicos', 'numeros', 'porqueEscolher',
    'comoFunciona', 'equipe', 'depoimentos', 'antesDepois', 'novidades', 'ctaContato',
];

function emptyBlock(type: BlockType['type']): BlockType {
    switch (type) {
        case 'pageHeader': return { type, props: { title: '', breadcrumb: [] } };
        case 'hero': return { type, props: { title: '' } };
        case 'sobre': return { type, props: { title: '', benefits: [] } };
        case 'servicos': return { type, props: { title: '', items: [] } };
        case 'numeros': return { type, props: { stats: [] } };
        case 'porqueEscolher': return { type, props: { title: '', features: [] } };
        case 'comoFunciona': return { type, props: { title: '', steps: [] } };
        case 'equipe': return { type, props: { title: '', members: [] } };
        case 'depoimentos': return { type, props: { title: '', items: [] } };
        case 'antesDepois': return { type, props: { title: '', items: [] } };
        case 'novidades': return { type, props: { title: '', items: [] } };
        case 'ctaContato': return { type, props: { title: '' } };
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputClass = 'w-full bg-surface border border-border rounded-md px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm';
const labelClass = 'block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5 ml-0.5';
const subHeadClass = 'text-[10px] font-bold text-ink-faint uppercase tracking-widest mb-3 mt-5';
const itemCardClass = 'p-4 bg-elev border border-border rounded-lg space-y-3';
const addBtnClass = 'text-xs font-bold text-primary hover:brightness-90 flex items-center gap-1 transition-all';

function StringListFields({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
    return (
        <>
            <p className={subHeadClass}>{label} ({items.length})</p>
            <div className="space-y-2">
                {items.map((s, i) => (
                    <div key={i} className="flex gap-2">
                        <input type="text" value={s} onChange={e => onChange(items.map((x, idx) => idx === i ? e.target.value : x))} className={`${inputClass} flex-1`} placeholder={placeholder} />
                        <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 px-2"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => onChange([...items, ''])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar</button>
        </>
    );
}

// ─── Field renderers ──────────────────────────────────────────────────────────

function PageHeaderFields({ props, onChange }: { props: PageHeaderProps; onChange: (p: PageHeaderProps) => void }) {
    const p = props; const up = (k: keyof PageHeaderProps, v: any) => onChange({ ...p, [k]: v });
    const bc = p.breadcrumb || [];
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Lead</label><textarea rows={2} value={p.lead || ''} onChange={e => up('lead', e.target.value)} className={`${inputClass} resize-y`} /></div>
            <p className={subHeadClass}>Trilha / breadcrumb ({bc.length})</p>
            <div className="space-y-2">
                {bc.map((b, i) => (
                    <div key={i} className="flex gap-2">
                        <input type="text" value={b.label} onChange={e => up('breadcrumb', bc.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className={`${inputClass} flex-1`} placeholder="Rótulo" />
                        <input type="text" value={b.href} onChange={e => up('breadcrumb', bc.map((x, idx) => idx === i ? { ...x, href: e.target.value } : x))} className={`${inputClass} flex-1`} placeholder="/link" />
                        <button type="button" onClick={() => up('breadcrumb', bc.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 px-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('breadcrumb', [...bc, { label: '', href: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar item</button>
        </div>
    );
}

function HeroFields({ props, onChange }: { props: HeroProps; onChange: (p: HeroProps) => void }) {
    const p = props; const up = (k: keyof HeroProps, v: any) => onChange({ ...p, [k]: v });
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Lead</label><textarea rows={2} value={p.lead || ''} onChange={e => up('lead', e.target.value)} className={`${inputClass} resize-y`} /></div>
            <div><label className={labelClass}>Imagem de fundo (path)</label><input type="text" value={p.imagem || ''} onChange={e => up('imagem', e.target.value)} className={inputClass} placeholder="/assets/img/..." /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Texto do botão</label><input type="text" value={p.ctaLabel || ''} onChange={e => up('ctaLabel', e.target.value)} className={inputClass} placeholder="Pedir Orçamento" /></div>
                <div><label className={labelClass}>Mensagem WhatsApp</label><input type="text" value={p.ctaMensagem || ''} onChange={e => up('ctaMensagem', e.target.value)} className={inputClass} /></div>
            </div>
        </div>
    );
}

function SobreFields({ props, onChange }: { props: SobreProps; onChange: (p: SobreProps) => void }) {
    const p = props; const up = (k: keyof SobreProps, v: any) => onChange({ ...p, [k]: v });
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Imagem (path)</label><input type="text" value={p.imagem || ''} onChange={e => up('imagem', e.target.value)} className={inputClass} placeholder="/assets/img/..." /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Badge</label><input type="text" value={p.badge || ''} onChange={e => up('badge', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            </div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Lead</label><textarea rows={2} value={p.lead || ''} onChange={e => up('lead', e.target.value)} className={`${inputClass} resize-y`} /></div>
            <StringListFields label="Benefícios" items={p.benefits || []} onChange={v => up('benefits', v)} placeholder="Benefício" />
            <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Texto do botão</label><input type="text" value={p.ctaLabel || ''} onChange={e => up('ctaLabel', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Link do botão</label><input type="text" value={p.ctaHref || ''} onChange={e => up('ctaHref', e.target.value)} className={inputClass} placeholder="/contato" /></div>
            </div>
        </div>
    );
}

function ServicosFields({ props, onChange }: { props: ServicosProps; onChange: (p: ServicosProps) => void }) {
    const p = props; const up = (k: keyof ServicosProps, v: any) => onChange({ ...p, [k]: v });
    const items = p.items || [];
    const upd = (i: number, patch: Partial<NonNullable<ServicosProps['items']>[number]>) => up('items', items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <p className={subHeadClass}>Cards ({items.length})</p>
            <div className="space-y-3">
                {items.map((it, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Card {i + 1}</span><button type="button" onClick={() => up('items', items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Título</label><input type="text" value={it.title} onChange={e => upd(i, { title: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Texto</label><input type="text" value={it.text || ''} onChange={e => upd(i, { text: e.target.value })} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>Link</label><input type="text" value={it.href || ''} onChange={e => upd(i, { href: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Imagem</label><input type="text" value={it.imagem || ''} onChange={e => upd(i, { imagem: e.target.value })} className={inputClass} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('items', [...items, { title: '', text: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar card</button>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div><label className={labelClass}>Texto do botão</label><input type="text" value={p.ctaLabel || ''} onChange={e => up('ctaLabel', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Link do botão</label><input type="text" value={p.ctaHref || ''} onChange={e => up('ctaHref', e.target.value)} className={inputClass} /></div>
            </div>
        </div>
    );
}

function NumerosFields({ props, onChange }: { props: NumerosProps; onChange: (p: NumerosProps) => void }) {
    const stats = props.stats || [];
    const up = (v: NumerosProps['stats']) => onChange({ stats: v });
    return (
        <div className="space-y-3">
            <p className={subHeadClass}>Estatísticas ({stats.length})</p>
            <div className="space-y-3">
                {stats.map((s, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Número {i + 1}</span><button type="button" onClick={() => up(stats.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>Valor</label><input type="text" value={s.value} onChange={e => up(stats.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))} className={inputClass} placeholder="+500" /></div>
                            <div><label className={labelClass}>Label</label><input type="text" value={s.label} onChange={e => up(stats.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className={inputClass} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up([...stats, { value: '', label: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar número</button>
        </div>
    );
}

function PorqueEscolherFields({ props, onChange }: { props: PorqueEscolherProps; onChange: (p: PorqueEscolherProps) => void }) {
    const p = props; const up = (k: keyof PorqueEscolherProps, v: any) => onChange({ ...p, [k]: v });
    const feats = p.features || [];
    const upd = (i: number, patch: Partial<{ title: string; text: string }>) => up('features', feats.map((f, idx) => idx === i ? { ...f, ...patch } : f));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Imagem central (path)</label><input type="text" value={p.imagem || ''} onChange={e => up('imagem', e.target.value)} className={inputClass} /></div>
            <p className={subHeadClass}>Diferenciais ({feats.length})</p>
            <div className="space-y-3">
                {feats.map((f, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Item {i + 1}</span><button type="button" onClick={() => up('features', feats.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Título</label><input type="text" value={f.title} onChange={e => upd(i, { title: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Texto</label><input type="text" value={f.text || ''} onChange={e => upd(i, { text: e.target.value })} className={inputClass} /></div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('features', [...feats, { title: '', text: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar diferencial</button>
        </div>
    );
}

function ComoFuncionaFields({ props, onChange }: { props: ComoFuncionaProps; onChange: (p: ComoFuncionaProps) => void }) {
    const p = props; const up = (k: keyof ComoFuncionaProps, v: any) => onChange({ ...p, [k]: v });
    const steps = p.steps || [];
    const upd = (i: number, patch: Partial<{ n: string; title: string; text: string }>) => up('steps', steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <p className={subHeadClass}>Passos ({steps.length})</p>
            <div className="space-y-3">
                {steps.map((s, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Passo {i + 1}</span><button type="button" onClick={() => up('steps', steps.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div className="grid grid-cols-4 gap-3">
                            <div><label className={labelClass}>Nº</label><input type="text" value={s.n} onChange={e => upd(i, { n: e.target.value })} className={inputClass} placeholder="01" /></div>
                            <div className="col-span-3"><label className={labelClass}>Título</label><input type="text" value={s.title} onChange={e => upd(i, { title: e.target.value })} className={inputClass} /></div>
                        </div>
                        <div><label className={labelClass}>Texto</label><input type="text" value={s.text || ''} onChange={e => upd(i, { text: e.target.value })} className={inputClass} /></div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('steps', [...steps, { n: String(steps.length + 1).padStart(2, '0'), title: '', text: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar passo</button>
        </div>
    );
}

function EquipeFields({ props, onChange }: { props: EquipeProps; onChange: (p: EquipeProps) => void }) {
    const p = props; const up = (k: keyof EquipeProps, v: any) => onChange({ ...p, [k]: v });
    const members = p.members || [];
    const upd = (i: number, patch: Partial<{ name: string; role: string; photo: string }>) => up('members', members.map((m, idx) => idx === i ? { ...m, ...patch } : m));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <p className={subHeadClass}>Membros ({members.length})</p>
            <div className="space-y-3">
                {members.map((m, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Membro {i + 1}</span><button type="button" onClick={() => up('members', members.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Nome</label><input type="text" value={m.name} onChange={e => upd(i, { name: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Função</label><input type="text" value={m.role || ''} onChange={e => upd(i, { role: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Foto (path)</label><input type="text" value={m.photo || ''} onChange={e => upd(i, { photo: e.target.value })} className={inputClass} /></div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('members', [...members, { name: '', role: '', photo: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar membro</button>
        </div>
    );
}

function DepoimentosFields({ props, onChange }: { props: DepoimentosProps; onChange: (p: DepoimentosProps) => void }) {
    const p = props; const up = (k: keyof DepoimentosProps, v: any) => onChange({ ...p, [k]: v });
    const items = p.items || [];
    const upd = (i: number, patch: Partial<{ quote: string; name: string; role: string }>) => up('items', items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Rating — Score</label><input type="text" value={p.rating?.score || ''} onChange={e => up('rating', { ...p.rating, score: e.target.value, label: p.rating?.label || '' })} className={inputClass} placeholder="4,9" /></div>
                <div><label className={labelClass}>Rating — Label</label><input type="text" value={p.rating?.label || ''} onChange={e => up('rating', { ...p.rating, label: e.target.value, score: p.rating?.score || '' })} className={inputClass} /></div>
            </div>
            <p className={subHeadClass}>Depoimentos ({items.length})</p>
            <div className="space-y-3">
                {items.map((it, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Depoimento {i + 1}</span><button type="button" onClick={() => up('items', items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Citação</label><textarea rows={2} value={it.quote} onChange={e => upd(i, { quote: e.target.value })} className={`${inputClass} resize-y`} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>Nome</label><input type="text" value={it.name} onChange={e => upd(i, { name: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Função</label><input type="text" value={it.role || ''} onChange={e => upd(i, { role: e.target.value })} className={inputClass} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('items', [...items, { quote: '', name: '', role: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar depoimento</button>
        </div>
    );
}

function AntesDepoisFields({ props, onChange }: { props: AntesDepoisProps; onChange: (p: AntesDepoisProps) => void }) {
    const p = props; const up = (k: keyof AntesDepoisProps, v: any) => onChange({ ...p, [k]: v });
    const items = p.items || [];
    const upd = (i: number, patch: Partial<{ label: string; before: string; after: string }>) => up('items', items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <p className={subHeadClass}>Pares antes/depois ({items.length})</p>
            <div className="space-y-3">
                {items.map((it, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Par {i + 1}</span><button type="button" onClick={() => up('items', items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Rótulo</label><input type="text" value={it.label} onChange={e => upd(i, { label: e.target.value })} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>Antes (path)</label><input type="text" value={it.before || ''} onChange={e => upd(i, { before: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Depois (path)</label><input type="text" value={it.after || ''} onChange={e => upd(i, { after: e.target.value })} className={inputClass} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('items', [...items, { label: '', before: '', after: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar par</button>
        </div>
    );
}

function NovidadesFields({ props, onChange }: { props: NovidadesProps; onChange: (p: NovidadesProps) => void }) {
    const p = props; const up = (k: keyof NovidadesProps, v: any) => onChange({ ...p, [k]: v });
    const items = p.items || [];
    const upd = (i: number, patch: Partial<{ title: string; excerpt: string; image: string; href: string }>) => up('items', items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <p className="text-[11px] text-ink-faint -mb-1">Se houver posts no blog, eles têm prioridade sobre estes itens.</p>
            <p className={subHeadClass}>Artigos manuais ({items.length})</p>
            <div className="space-y-3">
                {items.map((it, i) => (
                    <div key={i} className={itemCardClass}>
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-ink-faint uppercase">Artigo {i + 1}</span><button type="button" onClick={() => up('items', items.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button></div>
                        <div><label className={labelClass}>Título</label><input type="text" value={it.title} onChange={e => upd(i, { title: e.target.value })} className={inputClass} /></div>
                        <div><label className={labelClass}>Resumo</label><input type="text" value={it.excerpt || ''} onChange={e => upd(i, { excerpt: e.target.value })} className={inputClass} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={labelClass}>Imagem (path)</label><input type="text" value={it.image || ''} onChange={e => upd(i, { image: e.target.value })} className={inputClass} /></div>
                            <div><label className={labelClass}>Link</label><input type="text" value={it.href} onChange={e => upd(i, { href: e.target.value })} className={inputClass} /></div>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => up('items', [...items, { title: '', excerpt: '', image: '', href: '' }])} className={addBtnClass}><Plus className="w-3 h-3" /> Adicionar artigo</button>
        </div>
    );
}

function CtaContatoFields({ props, onChange }: { props: CtaContatoProps; onChange: (p: CtaContatoProps) => void }) {
    const p = props; const up = (k: keyof CtaContatoProps, v: any) => onChange({ ...p, [k]: v });
    return (
        <div className="space-y-3">
            <div><label className={labelClass}>Eyebrow</label><input type="text" value={p.eyebrow || ''} onChange={e => up('eyebrow', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Título *</label><input type="text" value={p.title} onChange={e => up('title', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Lead</label><textarea rows={2} value={p.lead || ''} onChange={e => up('lead', e.target.value)} className={`${inputClass} resize-y`} /></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Origem <span className="text-ink-faint normal-case tracking-normal font-medium">(tag do lead)</span></label><input type="text" value={p.origem || ''} onChange={e => up('origem', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Mensagem WhatsApp</label><input type="text" value={p.ctaMensagem || ''} onChange={e => up('ctaMensagem', e.target.value)} className={inputClass} /></div>
            </div>
        </div>
    );
}

// ─── Block card wrapper ───────────────────────────────────────────────────────

function BlockCard({ block, index, total, onChange, onMoveUp, onMoveDown, onRemove }: {
    block: BlockType; index: number; total: number;
    onChange: (b: BlockType) => void; onMoveUp: () => void; onMoveDown: () => void; onRemove: () => void;
}) {
    const [open, setOpen] = useState(false);
    const label = BLOCK_LABELS[block.type] || block.type;
    const renderFields = () => {
        switch (block.type) {
            case 'pageHeader': return <PageHeaderFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'hero': return <HeroFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'sobre': return <SobreFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'servicos': return <ServicosFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'numeros': return <NumerosFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'porqueEscolher': return <PorqueEscolherFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'comoFunciona': return <ComoFuncionaFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'equipe': return <EquipeFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'depoimentos': return <DepoimentosFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'antesDepois': return <AntesDepoisFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'novidades': return <NovidadesFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            case 'ctaContato': return <CtaContatoFields props={block.props} onChange={p => onChange({ ...block, props: p })} />;
            default: return <p className="text-xs text-ink-faint">Tipo desconhecido: {(block as any).type}</p>;
        }
    };
    return (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <GripVertical className="w-4 h-4 text-ink-faint shrink-0" />
                <span className="text-[10px] font-bold text-ink-faint uppercase tracking-widest mr-1">{index + 1}</span>
                <span className="text-sm font-semibold text-ink flex-1">{label}</span>
                <code className="text-[10px] bg-elev text-ink-faint px-1.5 py-0.5 rounded">{block.type}</code>
                <div className="flex items-center gap-1 ml-2">
                    <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-1 rounded text-ink-faint hover:text-ink disabled:opacity-30 transition-colors" title="Mover para cima"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded text-ink-faint hover:text-ink disabled:opacity-30 transition-colors" title="Mover para baixo"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={onRemove} className="p-1 rounded text-red-400 hover:text-red-600 transition-colors ml-1" title="Remover bloco"><Trash2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => setOpen(o => !o)} className="p-1 rounded text-ink-muted hover:text-ink transition-colors ml-1">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                </div>
            </div>
            {open && <div className="p-5">{renderFields()}</div>}
        </div>
    );
}

// ─── Page card ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function PageCard({ page, index, servicoSlugs, allSlugs, onChange, onRemove }: {
    page: BlockPage; index: number; servicoSlugs: Set<string>; allSlugs: string[];
    onChange: (p: BlockPage) => void; onRemove: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [addType, setAddType] = useState<BlockType['type']>('pageHeader');
    const up = (k: keyof BlockPage, v: any) => onChange({ ...page, [k]: v });

    const slug = page.slug || '';
    const collidesServico = servicoSlugs.has(slug);
    const collidesReserved = RESERVED_SLUGS.includes(slug);
    const duplicate = allSlugs.filter(s => s === slug).length > 1;

    const updateBlock = (i: number, b: BlockType) => up('blocks', page.blocks.map((x, idx) => idx === i ? b : x));
    const moveBlock = (i: number, dir: -1 | 1) => {
        const next = [...page.blocks]; const t = i + dir;
        if (t < 0 || t >= next.length) return;
        [next[i], next[t]] = [next[t], next[i]];
        up('blocks', next);
    };

    return (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
            <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-elev transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-elev text-ink-muted flex items-center justify-center shrink-0"><FileText className="w-5 h-5" aria-hidden="true" /></div>
                    <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{page.title || page.slug || 'Página sem título'}</p>
                        <p className="text-[11px] font-mono text-ink-faint truncate">/{slug} · {page.blocks.length} blocos</p>
                    </div>
                </div>
                {open ? <ChevronDown className="w-5 h-5 text-ink-faint shrink-0" /> : <ChevronUp className="w-5 h-5 text-ink-faint shrink-0 rotate-90" />}
            </button>

            {open && (
                <div className="p-6 pt-2 border-t border-border space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Slug <span className="text-ink-faint normal-case tracking-normal font-medium">(URL)</span></label>
                            <input type="text" value={slug} onChange={e => up('slug', slugify(e.target.value))} className={`${inputClass} font-mono`} placeholder="minha-pagina" />
                        </div>
                        <div>
                            <label className={labelClass}>Título (tag title)</label>
                            <input type="text" value={page.title || ''} onChange={e => up('title', e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Meta descrição</label>
                        <textarea rows={2} value={page.description || ''} onChange={e => up('description', e.target.value)} className={`${inputClass} resize-y`} />
                    </div>

                    {/* Slug guards */}
                    {collidesServico && (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex gap-2 text-xs font-medium"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> O slug <code className="font-mono">{slug}</code> é de um serviço — esta página será IGNORADA em favor do hub do serviço.</div>
                    )}
                    {collidesReserved && (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex gap-2 text-xs font-medium"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> O slug <code className="font-mono">{slug}</code> é de uma rota estática do tema — esta página NÃO será gerada (a rota fixa tem precedência).</div>
                    )}
                    {duplicate && (
                        <div className="p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200 flex gap-2 text-xs font-medium"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> Slug duplicado: outra página já usa <code className="font-mono">{slug}</code>.</div>
                    )}

                    {/* Blocks */}
                    <div>
                        <p className={subHeadClass}>Blocos da página ({page.blocks.length})</p>
                        {page.blocks.length === 0 ? (
                            <div className="p-6 text-center text-ink-faint border-2 border-dashed border-border rounded-lg"><p className="text-sm font-medium">Nenhum bloco ainda</p></div>
                        ) : (
                            <div className="space-y-3">
                                {page.blocks.map((b, i) => (
                                    <BlockCard key={i} block={b} index={i} total={page.blocks.length}
                                        onChange={nb => updateBlock(i, nb)} onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)}
                                        onRemove={() => up('blocks', page.blocks.filter((_, idx) => idx !== i))} />
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 mt-4">
                            <select value={addType} onChange={e => setAddType(e.target.value as BlockType['type'])} className={`${inputClass} flex-1`} aria-label="Tipo de bloco">
                                {BLOCK_ORDER.map(t => <option key={t} value={t}>{BLOCK_LABELS[t]} ({t})</option>)}
                            </select>
                            <button type="button" onClick={() => up('blocks', [...page.blocks, emptyBlock(addType)])} className="bg-elev hover:bg-border text-ink px-4 py-2.5 rounded-md font-bold text-sm flex items-center gap-1.5 shrink-0 transition-colors"><Plus className="w-4 h-4" /> Adicionar bloco</button>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border">
                        <button type="button" onClick={onRemove} className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1.5 transition-colors"><Trash2 className="w-4 h-4" /> Excluir esta página</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function PageEditor() {
    const [pages, setPages] = useState<BlockPage[]>([]);
    const [servicoSlugs, setServicoSlugs] = useState<Set<string>>(new Set());
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            githubApi('read', FILE_PATH).catch(err => {
                if (err.message.includes('404')) return { content: '[]', sha: '' };
                throw err;
            }),
            githubApi('read', SERVICOS_PATH).catch(() => ({ content: '[]', sha: '' })),
        ])
            .then(([pagesRes, servicosRes]) => {
                const parsed = JSON.parse(pagesRes?.content || '[]');
                setPages(Array.isArray(parsed) ? parsed : []);
                setFileSha(pagesRes.sha);
                const servicos = JSON.parse(servicosRes?.content || '[]');
                setServicoSlugs(new Set((Array.isArray(servicos) ? servicos : []).map((s: any) => s.slug)));
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const addPage = () => setPages(p => [...p, { slug: '', title: '', description: '', blocks: [] }]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Salvando páginas...', 'progress', 20);
        try {
            const res = await githubApi('write', FILE_PATH, {
                content: JSON.stringify(pages, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update pages.json',
            });
            setFileSha(res.sha);
            triggerToast('Páginas salvas!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-ink-faint bg-surface rounded-lg border border-border">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium animate-pulse">Carregando páginas...</p>
        </div>
    );

    const allSlugs = pages.map(p => p.slug);

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-32 max-w-3xl">
            <div className="flex items-center justify-between bg-surface p-4 px-6 rounded-lg border border-border shadow-sm sticky top-0 z-40">
                <div>
                    <h2 className="text-lg font-bold text-ink">Páginas</h2>
                    <p className="text-xs text-ink-muted mt-0.5">Edita o arquivo <code className="bg-elev px-1 rounded">{FILE_PATH}</code> · {pages.length} páginas</p>
                </div>
                <button type="submit" disabled={saving} className="bg-primary hover:brightness-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" aria-hidden="true" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {error && <div className="p-5 bg-red-100/50 text-red-700 rounded-lg font-bold border border-red-200 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}

            {pages.length === 0 && (
                <div className="p-12 text-center text-ink-faint border-2 border-dashed border-border rounded-lg"><p className="font-medium text-sm">Nenhuma página criada ainda.</p></div>
            )}

            {pages.map((page, idx) => (
                <PageCard key={idx} page={page} index={idx} servicoSlugs={servicoSlugs} allSlugs={allSlugs}
                    onChange={p => setPages(prev => prev.map((x, i) => i === idx ? p : x))}
                    onRemove={() => setPages(prev => prev.filter((_, i) => i !== idx))} />
            ))}

            <button type="button" onClick={addPage} className="w-full border-2 border-dashed border-border hover:border-primary/50 hover:bg-elev text-ink-muted hover:text-primary rounded-lg py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                <Plus className="w-5 h-5" /> Adicionar nova página
            </button>
        </form>
    );
}
