import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { triggerToast } from './CmsToaster';
import { githubApi } from '../../lib/adminApi';

const FILE_PATH = 'src/data/config.json';

export default function NapEditor() {
    const [config, setConfig] = useState<any>(null);
    const [fileSha, setFileSha] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        githubApi('read', FILE_PATH)
            .then(data => {
                setConfig(JSON.parse(data?.content || '{}'));
                setFileSha(data.sha);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError('');
        triggerToast('Sincronizando dados de contato...', 'progress', 20);
        try {
            const res = await githubApi('write', FILE_PATH, {
                content: JSON.stringify(config, null, 2),
                sha: fileSha || undefined,
                message: 'CMS: Update config.json (NAP)',
            });
            setFileSha(res.sha);
            triggerToast('Dados salvos com sucesso!', 'success', 100);
        } catch (err: any) {
            setError(err.message);
            triggerToast(`Erro: ${err.message}`, 'error');
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-ink-faint bg-surface rounded-lg border border-border">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p className="font-medium animate-pulse">Conectando ao Repositório...</p>
        </div>
    );

    if (error && !config) return (
        <div className="bg-red-50 text-red-700 p-8 rounded-lg border border-red-200 flex gap-4 items-start">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div><h3 className="text-xl font-bold mb-2">Erro de Leitura</h3><p>{error}</p></div>
        </div>
    );

    const inputClass = "w-full bg-surface border border-border rounded-md px-4 py-3 text-sm focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm text-ink font-medium";
    const labelClass = "block text-sm font-bold text-ink-muted uppercase tracking-wider mb-2 ml-1";

    const setEndereco = (key: string, val: string) => setConfig({ ...config, endereco: { ...(config.endereco || {}), [key]: val } });
    const setRedes = (key: string, val: string) => setConfig({ ...config, redes: { ...(config.redes || {}), [key]: val } });

    return (
        <form onSubmit={handleSave} className="space-y-8 pb-32 max-w-3xl">
            <div className="flex items-center justify-between bg-surface p-4 px-6 rounded-lg border border-border shadow-sm">
                <div>
                    <h2 className="text-lg font-bold text-ink">Dados da Empresa (NAP)</h2>
                    <p className="text-xs text-ink-muted mt-0.5">Edita o arquivo <code className="bg-elev px-1 rounded">{FILE_PATH}</code> — fonte única de nome, endereço e telefone.</p>
                </div>
                <button type="submit" disabled={saving} className="bg-primary hover:brightness-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-all">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" aria-hidden="true" />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {error && <div className="p-5 bg-red-100/50 text-red-700 rounded-lg font-bold border border-red-200 flex gap-3"><AlertCircle className="w-5 h-5 shrink-0" /> {error}</div>}

            <div className="p-8 bg-surface border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-ink mb-8 border-b border-border pb-4">Identificação & Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Nome da Empresa</label>
                        <input type="text" value={config?.nome || ''} onChange={e => setConfig({ ...config, nome: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Telefone</label>
                        <input type="text" placeholder="(11) 0000-0000" value={config?.telefone || ''} onChange={e => setConfig({ ...config, telefone: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>WhatsApp <span className="text-ink-faint normal-case tracking-normal font-medium">(só dígitos, com DDI)</span></label>
                        <input type="text" placeholder="5511000000000" value={config?.whatsapp || ''} onChange={e => setConfig({ ...config, whatsapp: e.target.value })} className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                        <label className={labelClass}>E-mail</label>
                        <input type="text" placeholder="contato@exemplo.com.br" value={config?.email || ''} onChange={e => setConfig({ ...config, email: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Faixa de preço <span className="text-ink-faint normal-case tracking-normal font-medium">($ a $$$$)</span></label>
                        <input type="text" placeholder="$$" value={config?.priceRange || ''} onChange={e => setConfig({ ...config, priceRange: e.target.value })} className={inputClass} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Horário de atendimento</label>
                        <input type="text" placeholder="Seg a Sex 8h-18h · Sáb 8h-12h" value={config?.horario || ''} onChange={e => setConfig({ ...config, horario: e.target.value })} className={inputClass} />
                    </div>
                </div>
            </div>

            <div className="p-8 bg-surface border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-ink mb-8 border-b border-border pb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Rua / Logradouro</label>
                        <input type="text" placeholder="Rua Exemplo, 000" value={config?.endereco?.rua || ''} onChange={e => setEndereco('rua', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Bairro</label>
                        <input type="text" value={config?.endereco?.bairro || ''} onChange={e => setEndereco('bairro', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>CEP</label>
                        <input type="text" placeholder="00000-000" value={config?.endereco?.cep || ''} onChange={e => setEndereco('cep', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>Cidade</label>
                        <input type="text" value={config?.endereco?.cidade || ''} onChange={e => setEndereco('cidade', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label className={labelClass}>UF</label>
                        <input type="text" maxLength={2} value={config?.endereco?.uf || ''} onChange={e => setEndereco('uf', e.target.value.toUpperCase())} className={`${inputClass} uppercase`} />
                    </div>
                </div>
            </div>

            <div className="p-8 bg-surface border border-border rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-ink mb-8 border-b border-border pb-4">Redes Sociais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Instagram</label>
                        <input type="url" placeholder="https://instagram.com/seuperfil" value={config?.redes?.instagram || ''} onChange={e => setRedes('instagram', e.target.value)} className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                        <label className={labelClass}>Facebook</label>
                        <input type="url" placeholder="https://facebook.com/suapagina" value={config?.redes?.facebook || ''} onChange={e => setRedes('facebook', e.target.value)} className={`${inputClass} font-mono`} />
                    </div>
                </div>
            </div>
        </form>
    );
}
