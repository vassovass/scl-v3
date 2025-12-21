"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ProxyMember {
    id: string;
    display_name: string;
    submission_count: number;
}

interface ProxyMembersDropdownProps {
    leagueId: string;
    onSelectProxy: (proxy: ProxyMember | null) => void;
    selectedProxy: ProxyMember | null;
    className?: string;
}

export function ProxyMembersDropdown({
    leagueId,
    onSelectProxy,
    selectedProxy,
    className = ""
}: ProxyMembersDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [proxyMembers, setProxyMembers] = useState<ProxyMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCreateInput(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchProxies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leagues/${leagueId}/proxy-members`);
            if (res.ok) {
                const data = await res.json();
                setProxyMembers(data.proxy_members || []);
            }
        } catch (err) {
            console.error("Failed to fetch proxies:", err);
        } finally {
            setLoading(false);
        }
    }, [leagueId]);

    useEffect(() => {
        if (isOpen && proxyMembers.length === 0) {
            fetchProxies();
        }
    }, [isOpen, proxyMembers.length, fetchProxies]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            const res = await fetch(`/api/leagues/${leagueId}/proxy-members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: newName.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setProxyMembers(prev => [data.proxy_member, ...prev]);
                onSelectProxy(data.proxy_member);
                setNewName("");
                setShowCreateInput(false);
                setIsOpen(false);
            }
        } catch (err) {
            console.error("Failed to create proxy:", err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef} data-tour="proxy-members">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${selectedProxy
                        ? "border-amber-600 bg-amber-900/30 text-amber-300 hover:bg-amber-900/50"
                        : "border-slate-700 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                    }`}
            >
                <span>👤</span>
                {selectedProxy ? (
                    <span>Submitting for: <span className="font-semibold">{selectedProxy.display_name}</span></span>
                ) : (
                    <span>Submit for Proxy</span>
                )}
                <span className="text-xs text-slate-500 ml-1">▼</span>
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-800 p-2 shadow-xl ring-1 ring-black/5">
                    <div className="mb-2 px-2 py-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center justify-between">
                        <span>Proxy Members</span>
                        {selectedProxy && (
                            <button
                                onClick={() => {
                                    onSelectProxy(null);
                                    setIsOpen(false);
                                }}
                                className="text-sky-400 hover:text-sky-300 font-medium normal-case"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="py-4 text-center text-sm text-slate-500">Loading...</div>
                    ) : proxyMembers.length === 0 ? (
                        <div className="py-3 px-2 text-sm text-slate-500 text-center">
                            No proxy members yet
                        </div>
                    ) : (
                        <div className="max-h-48 overflow-y-auto space-y-1">
                            {proxyMembers.map((proxy) => (
                                <button
                                    key={proxy.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectProxy(proxy);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${selectedProxy?.id === proxy.id
                                            ? "bg-amber-900/30 text-amber-300"
                                            : "text-slate-200 hover:bg-slate-700 hover:text-white"
                                        }`}
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium shrink-0">
                                        {proxy.display_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate font-medium">{proxy.display_name}</div>
                                        <div className="text-xs text-slate-500">{proxy.submission_count} submissions</div>
                                    </div>
                                    {selectedProxy?.id === proxy.id && (
                                        <span className="text-amber-400">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-2 border-t border-slate-700 pt-2">
                        {showCreateInput ? (
                            <div className="space-y-2 p-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Name (e.g., Joe Soap)"
                                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreate();
                                        if (e.key === "Escape") setShowCreateInput(false);
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateInput(false)}
                                        className="flex-1 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCreate}
                                        disabled={creating || !newName.trim()}
                                        className="flex-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                                    >
                                        {creating ? "..." : "Create"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowCreateInput(true)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-400 hover:bg-amber-900/30 transition"
                            >
                                <span>+</span>
                                <span>Create New Proxy</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
