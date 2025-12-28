import { useState, useEffect } from 'react';

interface FeedbackItem {
    id: string;
    subject: string;
    description: string | null;
    screenshot_url: string | null;
    type: string;
    board_status: string;
    created_at: string;
}

interface MergeModalProps {
    items: FeedbackItem[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function MergeModal({ items, isOpen, onClose, onSuccess }: MergeModalProps) {
    const [primaryId, setPrimaryId] = useState<string>(items[0]?.id || '');
    const [description, setDescription] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial setup when items change
    useEffect(() => {
        if (items.length > 0) {
            // Default primary to the oldest item (often the original report) or just the first
            // Sorting by created_at might be better, but let's just use the first for now
            const sorted = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            setPrimaryId(sorted[0].id);
            setDescription(sorted[0].description || '');
        }
    }, [items]);

    if (!isOpen) return null;

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/feedback/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryId,
                    secondaryIds: items.filter(i => i.id !== primaryId).map(i => i.id),
                    useAI: true,
                    preview: true // Tell backend to just generate description
                })
            });
            const data = await res.json();
            if (data.success) {
                setDescription(data.description);
            } else {
                setError(data.error || 'Failed to generate description');
            }
        } catch (e) {
            setError('An error occurred while calling AI');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmMerge = async () => {
        setIsMerging(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/feedback/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryId,
                    secondaryIds: items.filter(i => i.id !== primaryId).map(i => i.id),
                    mergedDescription: description,
                    useAI: false // We already have the description (either manual or AI generated previously)
                })
            });
            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || 'Failed to merge items');
            }
        } catch (e) {
            setError('An error occurred during merge');
        } finally {
            setIsMerging(false);
        }
    };

    const primaryItem = items.find(i => i.id === primaryId);
    const secondaryItems = items.filter(i => i.id !== primaryId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                                {items.length}
                            </span>
                            Merge Items
                        </h2>
                        <p className="text-white/40 text-sm mt-1">Select a primary item and customize the merged report.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        title="Close modal"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Item Selection */}
                    <div className="w-1/3 border-r border-white/10 overflow-y-auto p-4 space-y-4 bg-black/20">
                        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Select Primary Item</h3>
                        {items.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setPrimaryId(item.id);
                                    if (!description && !isGenerating) {
                                        setDescription(item.description || '');
                                    }
                                }}
                                className={`p - 3 rounded - lg border transition - all cursor - pointer relative ${primaryId === item.id
                                        ? 'bg-blue-500/10 border-blue-500/50'
                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    } `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt - 1 w - 4 h - 4 rounded - full border flex items - center justify - center ${primaryId === item.id ? 'border-blue-400 bg-blue-400' : 'border-white/30'
                                        } `}>
                                        {primaryId === item.id && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">{item.subject}</h4>
                                        <p className="text-xs text-white/40 truncate mt-1">
                                            {item.type} • {item.board_status}
                                        </p>
                                        {item.screenshot_url && (
                                            <div className="mt-2 text-[10px] flex items-center gap-1 text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit">
                                                <span>Has screenshot</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-white/10">
                            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Wait, what happens?</h3>
                            <ul className="text-xs text-white/40 space-y-2 list-disc pl-4">
                                <li>Primary item keeps its ID and history</li>
                                <li>Secondary items are archived (status: Done)</li>
                                <li>Secondary screenshots are added to Primary</li>
                                <li>Vote counts are combined</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right: Preview & Edit */}
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Merged Description</h3>
                            <button
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <span className="animate-pulse">Analyzing images...</span>
                                ) : (
                                    <>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z"></path>
                                        </svg>
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm flex items-start gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="flex-1 min-h-[300px] flex flex-col gap-4">
                            <div className="flex-1 relative group">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full h-full bg-black/20 border border-white/10 rounded-lg p-4 text-white text-sm focus:outline-none focus:border-white/30 resize-none font-mono"
                                    placeholder="Merged description will appear here..."
                                />
                            </div>

                            {/* Attachments Preview */}
                            {(secondaryItems.some(i => i.screenshot_url) || primaryItem?.screenshot_url) && (
                                <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                                    <h4 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">Attachments to be Merged</h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {primaryItem?.screenshot_url && (
                                            <div className="relative shrink-0 w-20 h-20 rounded border border-white/10 overflow-hidden group">
                                                <img src={primaryItem.screenshot_url} className="w-full h-full object-cover" alt="Primary visual" />
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">Primary</div>
                                            </div>
                                        )}
                                        {secondaryItems.filter(i => i.screenshot_url).map(item => (
                                            <div key={item.id} className="relative shrink-0 w-20 h-20 rounded border border-white/10 overflow-hidden group border-blue-500/30">
                                                <img src={item.screenshot_url!} className="w-full h-full object-cover" alt={`Attachment from ${item.subject} `} />
                                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white shadow-sm">+</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmMerge}
                        disabled={isMerging}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                        {isMerging ? 'Merging...' : (
                            <>
                                Confirm Merge <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
