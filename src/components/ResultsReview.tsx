import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, File as FileIcon, CheckSquare, Square, FolderSearch, Eye } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";

export type DuplicateGroup = { hash: string; size: number; modified_at: number; files: string[] };

export default function ResultsReview({
    groups,
    onDone
}: {
    groups: DuplicateGroup[],
    onDone: () => void
}) {
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortBy, setSortBy] = useState<"largest" | "smallest" | "newest" | "oldest">("largest");

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024, dm = 2, sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    const toggleSelection = (path: string) => {
        const newPaths = new Set(selectedPaths);
        if (newPaths.has(path)) {
            newPaths.delete(path);
        } else {
            newPaths.add(path);
        }
        setSelectedPaths(newPaths);
    };

    const selectOlderDuplicates = () => {
        const newPaths = new Set(selectedPaths);
        groups.forEach(group => {
            // Because we don't have per-file timestamps yet, we just keep the shortest path (usually original)
            // and trash the rest (the ones with "copy" or long hashes).
            let sortedFiles = [...group.files].sort((a, b) => a.length - b.length);
            sortedFiles.slice(1).forEach(p => newPaths.add(p));
        });
        setSelectedPaths(newPaths);
    };

    const sortedGroups = [...groups].sort((a, b) => {
        if (sortBy === "largest") return b.size - a.size;
        if (sortBy === "smallest") return a.size - b.size;
        if (sortBy === "newest") return b.modified_at - a.modified_at;
        if (sortBy === "oldest") return a.modified_at - b.modified_at;
        return 0;
    });

    const trashSelected = async () => {
        if (selectedPaths.size === 0) return;
        setIsDeleting(true);
        try {
            await invoke("trash_items_cmd", { paths: Array.from(selectedPaths) });
            onDone(); // Complete
        } catch (e) {
            console.error("Trash failed:", e);
            alert("Failed to move to trash: " + e);
        } finally {
            setIsDeleting(false);
        }
    };

    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 border border-slate-800/50 rounded-2xl h-80">
                <FolderSearch size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-medium text-slate-300">No duplicates found</h3>
                <p className="text-slate-500 mt-2">Your system is clean!</p>
                <button onClick={onDone} className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40 rounded-t-2xl">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-100">Review Duplicates</h2>
                    <p className="text-slate-400 text-sm mt-1">Select the files you want to safely move to the macOS Trash.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <select
                        aria-label="Sort duplicate results"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="largest">Largest First</option>
                        <option value="smallest">Smallest First</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                    <button
                        onClick={selectOlderDuplicates}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 hover:border-slate-600"
                    >
                        Auto-select newest to keep
                    </button>
                    <button
                        onClick={trashSelected}
                        disabled={selectedPaths.size === 0 || isDeleting}
                        className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedPaths.size === 0 || isDeleting
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                                : 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20'}
            `}
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Trashing...' : `Trash ${selectedPaths.size} Files`}
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                    {sortedGroups.map((group, idx) => (
                        <motion.div
                            key={group.hash}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-slate-950/50 border border-slate-800/60 rounded-xl overflow-hidden shadow-sm"
                        >
                            <div className="px-5 py-3 bg-slate-900/80 border-b border-slate-800/60 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-indigo-500/10 rounded-md">
                                        <FileIcon size={16} className="text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-slate-300 text-sm">{group.files.length} Identical Files</span>
                                </div>
                                <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                                    {formatBytes(group.size)}
                                </span>
                            </div>
                            <div className="divide-y divide-slate-800/30">
                                {group.files.map((path) => {
                                    const isSelected = selectedPaths.has(path);
                                    return (
                                        <div
                                            key={path}
                                            onClick={() => toggleSelection(path)}
                                            className={`
                        px-5 py-3 flex items-center gap-4 cursor-pointer transition-colors hover:bg-slate-800/40
                        ${isSelected ? 'bg-rose-500/5' : ''}
                      `}
                                        >
                                            <button className="text-slate-400 hover:text-rose-400 transition-colors focus:outline-none">
                                                {isSelected ? <CheckSquare size={18} className="text-rose-500" /> : <Square size={18} />}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm tracking-wide truncate ${isSelected ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                                    {path.split('/').pop()}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate mt-0.5" dir="ltr">
                                                    {path}
                                                </p>
                                            </div>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await openPath(path);
                                                    } catch (err) {
                                                        console.error("Failed to open file:", err);
                                                        alert("Could not open file: " + err);
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
                                                title="Preview File"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
