import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, Check, Loader2, X } from 'lucide-react';

export function normalizeTeamName(v: string): string {
    return (v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
}

interface TeamComboboxProps {
    value: string;
    onChange: (team: string) => void;
    /** Todos os times já existentes (estáticos + cadastrados + vindos dos produtos) */
    teams: string[];
    /** Cadastra um novo time na lista oficial (persistência). Retorna o nome salvo. */
    onCreateTeam: (team: string) => Promise<boolean>;
    placeholder?: string;
}

export function TeamCombobox({ value, onChange, teams, onCreateTeam, placeholder }: TeamComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uniqueTeams = useMemo(() => {
        const seen = new Map<string, string>();
        for (const t of teams) {
            const name = (t || '').trim();
            if (!name) continue;
            const key = normalizeTeamName(name);
            if (!key) continue;
            if (!seen.has(key)) seen.set(key, name);
        }
        return Array.from(seen.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }, [teams]);

    const filtered = useMemo(() => {
        const q = normalizeTeamName(query);
        if (!q) return uniqueTeams;
        return uniqueTeams.filter(t => normalizeTeamName(t).includes(q));
    }, [uniqueTeams, query]);

    const trimmedQuery = query.trim();
    const exactExists = uniqueTeams.some(t => normalizeTeamName(t) === normalizeTeamName(trimmedQuery));
    const canCreate = trimmedQuery.length >= 2 && !exactExists;

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 30);
    }, [open]);

    const select = (team: string) => {
        onChange(team);
        setOpen(false);
        setQuery('');
    };

    const handleCreate = async () => {
        if (!canCreate || creating) return;
        setCreating(true);
        try {
            const ok = await onCreateTeam(trimmedQuery);
            if (ok) select(trimmedQuery);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 bg-slate-800 text-white rounded-lg border border-white/10 p-2.5 text-xs text-left hover:border-white/25 transition-colors"
            >
                <span className="flex items-center gap-2 truncate">
                    <Search size={13} className="text-gray-400 shrink-0" />
                    <span className={value ? 'truncate' : 'text-gray-400 truncate'}>
                        {value || 'Pesquisar ou selecionar time...'}
                    </span>
                </span>
                {value && value !== 'Personalizado' && (
                    <X
                        size={13}
                        className="text-gray-400 hover:text-white shrink-0"
                        onClick={(e) => { e.stopPropagation(); onChange('Personalizado'); }}
                    />
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-2 border-b border-white/5">
                        <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-2">
                            <Search size={13} className="text-gray-400" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (filtered.length > 0) select(filtered[0]);
                                        else if (canCreate) handleCreate();
                                    }
                                    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
                                }}
                                placeholder={placeholder || 'Pesquisar ou digitar novo time...'}
                                className="w-full bg-transparent text-white text-xs p-2 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                        {!query && (
                            <button
                                type="button"
                                onClick={() => select('Personalizado')}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5"
                            >
                                Personalizado / Geral
                                {value === 'Personalizado' && <Check size={13} className="text-green-400" />}
                            </button>
                        )}

                        {filtered.map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => select(t)}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs text-white hover:bg-white/5"
                            >
                                <span className="truncate">{t}</span>
                                {normalizeTeamName(value) === normalizeTeamName(t) && <Check size={13} className="text-green-400" />}
                            </button>
                        ))}

                        {filtered.length === 0 && !canCreate && (
                            <p className="px-3 py-3 text-xs text-gray-500">Nenhum time encontrado.</p>
                        )}
                    </div>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-green-300 bg-green-950/40 border-t border-green-500/20 hover:bg-green-900/40 disabled:opacity-60"
                        >
                            {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                            {creating ? 'Cadastrando...' : <>Cadastrar "{trimmedQuery}"</>}
                        </button>
                    )}

                    {exactExists && trimmedQuery.length >= 2 && (
                        <p className="px-3 py-2 text-[10px] text-amber-300/80 border-t border-white/5">
                            Este time já está cadastrado — selecione na lista acima.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
