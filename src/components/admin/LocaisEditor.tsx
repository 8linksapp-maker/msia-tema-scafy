import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2, Plus, Trash2, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

const FILE_PATH = 'src/data/locais.json';

interface FaqItem { q: string; a: string; }
interface Local {
    slug: string;
    nome: string;
    uf: string;
    prep: string;
    regiao: string;
    bairrosVizinhos: string[];
    referenciaLocal: string;
    faq: FaqItem[];
    lat?: string;
    lng?: string;
}

export default function LocaisEditor() {
    const [locais, setLocais] = useState<Local[]>([]);
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        githubApi('read', FILE_PATH)
            .then(data => {
                const parsed = JSON.parse(data?.content || '[]');
                setLocais(Array.isArray(parsed) ? parsed : []);
                setFileSha(data.sha);
            })
            .catch(err => {
                if (err.message.includes('404')) setLocais([]);
                else setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    const update = (idx: number, patch: Partial<Local>) => {
        setLocais(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    };

    const updateFaq = (lIdx: number, fIdx: number, patch: Partial<FaqItem>) => {
        setLocais(prev => prev.map((l, i) => {
            if (i !== lIdx) return l;
            const faq = [...(l.faq || [])];
            faq[fIdx] = { ...faq[fIdx], ...patch };
            return { ...l, faq };
        }));
    };

    const addFaq = (lIdx: number) => {
        setLocais(prev => prev.map((l, i) =>
            i === lIdx ? { ...l, faq: [...(l.faq || []), { q: '', a: '' }] } : l
        ));
    };

    const removeFaq = (lIdx: number, fIdx: number) => {
        setLocais(prev => prev.map((l, i) => {
            if (i !== lIdx) return l;
            const faq = [...(l.faq || [])];
            faq.splice(fIdx, 1);
            return { ...l, faq };
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Sincronizando cidades...', 'progress', 20);
        try {
            const res = await githubApi('write', FILE_PATH, {
                content: JSON.stringify(locais, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update locais.json',
            });
            setFileSha(res.sha);
            triggerToast('Cidades salvas com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-ink-faint bg-surface rounded-lg border border-border">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium animate-pulse">Lendo cidades...</p>
        </div>
    );

    if (error && locais.length === 0) return (
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
                    <h2 className="text-lg font-bold text-ink">Localidades atendidas</h2>
                    <p className="text-xs text-ink-muted mt-0.5">Edita o arquivo <code className="bg-elev px-1 rounded">{FILE_PATH}</code> · {locais.length} localidades</p>
                </div>
                <button type="submit" disabled={saving} className="bg-primary hover:brightness-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" aria-hidden="true" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {error && <div className="p-5 bg-red-100/50 text-red-700 rounded-lg font-bold border border-red-200 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}

            {locais.map((l, idx) => {
                const open = openIndex === idx;
                return (
                    <div key={l.slug || idx} className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenIndex(open ? null : idx)}
                            className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-elev transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-md bg-elev text-ink-muted flex items-center justify-center shrink-0"><MapPin className="w-5 h-5" aria-hidden="true" /></div>
                                <div className="min-w-0">
                                    <p className="font-bold text-ink truncate">{l.nome || l.slug || 'Sem nome'}{l.uf ? ` / ${l.uf}` : ''}</p>
                                    <p className="text-[11px] font-mono text-ink-faint truncate">{l.slug}</p>
                                </div>
                            </div>
                            {open ? <ChevronDown className="w-5 h-5 text-ink-faint shrink-0" /> : <ChevronRight className="w-5 h-5 text-ink-faint shrink-0" />}
                        </button>

                        {open && (
                            <div className="p-6 pt-2 border-t border-border space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                                    <div className="sm:col-span-6">
                                        <label className={labelClass}>Nome</label>
                                        <input type="text" value={l.nome || ''} onChange={e => update(idx, { nome: e.target.value })} className={inputClass} />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className={labelClass}>UF</label>
                                        <input type="text" maxLength={2} value={l.uf || ''} onChange={e => update(idx, { uf: e.target.value.toUpperCase() })} className={`${inputClass} uppercase`} />
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label className={labelClass}>Preposição</label>
                                        <select value={l.prep || 'em'} onChange={e => update(idx, { prep: e.target.value })} className={inputClass} aria-label="Preposição">
                                            <option value="em">em</option>
                                            <option value="no">no</option>
                                            <option value="na">na</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Slug <span className="text-ink-faint normal-case tracking-normal font-medium">(URL)</span></label>
                                    <input type="text" value={l.slug || ''} onChange={e => update(idx, { slug: e.target.value })} className={`${inputClass} font-mono`} />
                                </div>
                                <div>
                                    <label className={labelClass}>Região</label>
                                    <input type="text" value={l.regiao || ''} onChange={e => update(idx, { regiao: e.target.value })} className={inputClass} placeholder="Grande São Paulo" />
                                </div>
                                <div>
                                    <label className={labelClass}>Bairros vizinhos <span className="text-ink-faint normal-case tracking-normal font-medium">(um por linha)</span></label>
                                    <textarea
                                        rows={4}
                                        value={(l.bairrosVizinhos || []).join('\n')}
                                        onChange={e => update(idx, { bairrosVizinhos: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                                        className={`${inputClass} resize-y`}
                                        placeholder="Mooca&#10;Tatuapé&#10;Santana"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Referência local <span className="text-ink-faint normal-case tracking-normal font-medium">(parágrafo único da cidade)</span></label>
                                    <textarea
                                        rows={4}
                                        value={l.referenciaLocal || ''}
                                        onChange={e => update(idx, { referenciaLocal: e.target.value })}
                                        className={`${inputClass} resize-y`}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label className="text-sm font-bold text-ink-muted uppercase tracking-wider">Perguntas frequentes</label>
                                        <button type="button" onClick={() => addFaq(idx)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:brightness-90 transition-all">
                                            <Plus className="w-4 h-4" /> Adicionar pergunta
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(l.faq || []).length === 0 && (
                                            <p className="text-xs text-ink-faint italic px-1">Nenhuma pergunta cadastrada.</p>
                                        )}
                                        {(l.faq || []).map((f, fIdx) => (
                                            <div key={fIdx} className="bg-elev border border-border rounded-md p-3 space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <input type="text" placeholder="Pergunta" value={f.q || ''} onChange={e => updateFaq(idx, fIdx, { q: e.target.value })} className={`${inputClass} flex-1`} />
                                                    <button type="button" onClick={() => removeFaq(idx, fIdx)} aria-label="Remover pergunta" className="p-2 mt-0.5 text-ink-faint hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                                <textarea rows={2} placeholder="Resposta" value={f.a || ''} onChange={e => updateFaq(idx, fIdx, { a: e.target.value })} className={`${inputClass} resize-y`} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Latitude</label>
                                        <input type="text" value={l.lat || ''} onChange={e => update(idx, { lat: e.target.value })} className={`${inputClass} font-mono`} placeholder="-23.55" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Longitude</label>
                                        <input type="text" value={l.lng || ''} onChange={e => update(idx, { lng: e.target.value })} className={`${inputClass} font-mono`} placeholder="-46.63" />
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
