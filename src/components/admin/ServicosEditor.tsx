import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Plus, Trash2, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

const FILE_PATH = 'src/data/servicos.json';

interface Topico { nivel: 'h2' | 'h3' | 'h4'; titulo: string; conteudo: string; }
interface Servico {
    slug: string;
    nome: string;
    kw: string;
    resumo: string;
    icone: string;
    imagem: string;
    topicos: Topico[];
}

const NIVEL_HINT: Record<Topico['nivel'], string> = {
    h2: 'Seção do corpo',
    h3: 'Pergunta frequente (FAQ)',
    h4: 'Subseção',
};

export default function ServicosEditor() {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        githubApi('read', FILE_PATH)
            .then(data => {
                const parsed = JSON.parse(data?.content || '[]');
                setServicos(Array.isArray(parsed) ? parsed : []);
                setFileSha(data.sha);
            })
            .catch(err => {
                if (err.message.includes('404')) setServicos([]);
                else setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const update = (idx: number, patch: Partial<Servico>) => {
        setServicos(prev => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    };

    const updateTopico = (sIdx: number, tIdx: number, patch: Partial<Topico>) => {
        setServicos(prev => prev.map((s, i) => {
            if (i !== sIdx) return s;
            const topicos = [...(s.topicos || [])];
            topicos[tIdx] = { ...topicos[tIdx], ...patch };
            return { ...s, topicos };
        }));
    };

    const addTopico = (sIdx: number) => {
        setServicos(prev => prev.map((s, i) =>
            i === sIdx ? { ...s, topicos: [...(s.topicos || []), { nivel: 'h2', titulo: '', conteudo: '' }] } : s
        ));
    };

    const removeTopico = (sIdx: number, tIdx: number) => {
        setServicos(prev => prev.map((s, i) => {
            if (i !== sIdx) return s;
            const topicos = [...(s.topicos || [])];
            topicos.splice(tIdx, 1);
            return { ...s, topicos };
        }));
    };

    const moveTopico = (sIdx: number, tIdx: number, dir: -1 | 1) => {
        setServicos(prev => prev.map((s, i) => {
            if (i !== sIdx) return s;
            const topicos = [...(s.topicos || [])];
            const target = tIdx + dir;
            if (target < 0 || target >= topicos.length) return s;
            [topicos[tIdx], topicos[target]] = [topicos[target], topicos[tIdx]];
            return { ...s, topicos };
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Sincronizando serviços...', 'progress', 20);
        try {
            const res = await githubApi('write', FILE_PATH, {
                content: JSON.stringify(servicos, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update servicos.json',
            });
            setFileSha(res.sha);
            triggerToast('Serviços salvos com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-ink-faint bg-surface rounded-lg border border-border">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium animate-pulse">Lendo serviços...</p>
        </div>
    );

    if (error && servicos.length === 0) return (
        <div className="bg-red-50 text-red-700 p-8 rounded-lg border border-red-200 flex gap-4 items-start">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div><h3 className="text-xl font-bold mb-2">Erro de Leitura</h3><p>{error}</p></div>
        </div>
    );

    const inputClass = "w-full bg-surface border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm text-ink font-medium";
    const labelClass = "block text-sm font-bold text-ink-muted uppercase tracking-wider mb-2 ml-1";

    return (
        <form onSubmit={handleSave} className="space-y-6 pb-32 max-w-3xl">
            <div className="flex items-center justify-between bg-surface p-4 px-6 rounded-lg border border-border shadow-sm sticky top-0 z-40">
                <div>
                    <h2 className="text-lg font-bold text-ink">Serviços</h2>
                    <p className="text-xs text-ink-muted mt-0.5">Edita o arquivo <code className="bg-elev px-1 rounded">{FILE_PATH}</code> · {servicos.length} serviços</p>
                </div>
                <button type="submit" disabled={saving} className="bg-primary hover:brightness-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" aria-hidden="true" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {error && <div className="p-5 bg-red-100/50 text-red-700 rounded-lg font-bold border border-red-200 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}

            {servicos.map((s, idx) => {
                const open = openIndex === idx;
                const topicos = s.topicos || [];
                return (
                    <div key={s.slug || idx} className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenIndex(open ? null : idx)}
                            className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-elev transition-colors"
                        >
                            <div className="min-w-0">
                                <p className="font-bold text-ink truncate">{s.nome || s.slug || 'Sem nome'}</p>
                                <p className="text-[11px] font-mono text-ink-faint truncate">{s.slug} · {topicos.length} tópicos</p>
                            </div>
                            {open ? <ChevronDown className="w-5 h-5 text-ink-faint shrink-0" /> : <ChevronRight className="w-5 h-5 text-ink-faint shrink-0" />}
                        </button>

                        {open && (
                            <div className="p-6 pt-2 border-t border-border space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Slug <span className="text-ink-faint normal-case tracking-normal font-medium">(URL)</span></label>
                                        <input type="text" value={s.slug || ''} onChange={e => update(idx, { slug: e.target.value })} className={`${inputClass} font-mono`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Nome</label>
                                        <input type="text" value={s.nome || ''} onChange={e => update(idx, { nome: e.target.value })} className={inputClass} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Palavra-chave</label>
                                        <input type="text" value={s.kw || ''} onChange={e => update(idx, { kw: e.target.value })} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Imagem <span className="text-ink-faint normal-case tracking-normal font-medium">(path)</span></label>
                                        <input type="text" value={s.imagem || ''} onChange={e => update(idx, { imagem: e.target.value })} className={`${inputClass} font-mono`} placeholder="/assets/img/servicos/..." />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Resumo</label>
                                    <textarea rows={2} value={s.resumo || ''} onChange={e => update(idx, { resumo: e.target.value })} className={`${inputClass} resize-y`} />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label className="text-sm font-bold text-ink-muted uppercase tracking-wider">Tópicos do conteúdo</label>
                                        <button type="button" onClick={() => addTopico(idx)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:brightness-90 transition-all">
                                            <Plus className="w-4 h-4" /> Adicionar tópico
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-ink-faint mb-3 ml-1">
                                        <strong>h2</strong>/<strong>h4</strong> formam o corpo da página · <strong>h3</strong> vira pergunta do FAQ. O conteúdo aceita Markdown.
                                    </p>
                                    <div className="space-y-3">
                                        {topicos.length === 0 && (
                                            <p className="text-xs text-ink-faint italic px-1">Nenhum tópico cadastrado.</p>
                                        )}
                                        {topicos.map((t, tIdx) => (
                                            <div key={tIdx} className="bg-elev border border-border rounded-md p-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={t.nivel || 'h2'}
                                                        onChange={e => updateTopico(idx, tIdx, { nivel: e.target.value as Topico['nivel'] })}
                                                        className="bg-surface border border-border rounded-md px-2 py-2 text-xs font-bold uppercase text-ink focus:outline-none focus:border-primary/80 shrink-0"
                                                        aria-label="Nível do tópico"
                                                    >
                                                        <option value="h2">H2</option>
                                                        <option value="h3">H3</option>
                                                        <option value="h4">H4</option>
                                                    </select>
                                                    <span className="text-[10px] text-ink-faint shrink-0 hidden sm:inline">{NIVEL_HINT[t.nivel] || ''}</span>
                                                    <span className="flex-1" />
                                                    <button type="button" onClick={() => moveTopico(idx, tIdx, -1)} disabled={tIdx === 0} className="p-1.5 text-ink-faint hover:text-ink disabled:opacity-30 transition-colors" aria-label="Mover para cima"><ChevronUp className="w-4 h-4" /></button>
                                                    <button type="button" onClick={() => moveTopico(idx, tIdx, 1)} disabled={tIdx === topicos.length - 1} className="p-1.5 text-ink-faint hover:text-ink disabled:opacity-30 transition-colors" aria-label="Mover para baixo"><ChevronDown className="w-4 h-4" /></button>
                                                    <button type="button" onClick={() => removeTopico(idx, tIdx)} aria-label="Remover tópico" className="p-1.5 text-ink-faint hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <input type="text" placeholder="Título do tópico" value={t.titulo || ''} onChange={e => updateTopico(idx, tIdx, { titulo: e.target.value })} className={inputClass} />
                                                <textarea rows={t.nivel === 'h3' ? 2 : 5} placeholder="Conteúdo (Markdown)" value={t.conteudo || ''} onChange={e => updateTopico(idx, tIdx, { conteudo: e.target.value })} className={`${inputClass} resize-y`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </form>
    );
}
