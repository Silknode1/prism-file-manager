import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderSearch, Settings, Trash2, ShieldCheck, Activity } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import FileStatsChart from "./FileStatsChart";
import ResultsReview, { DuplicateGroup } from "./ResultsReview";
import SettingsModal from "./SettingsModal";

type ProgressEvent = { scanned: number; duplicates_found: number; bytes_saved: number };

export default function Dashboard() {
    const [isScanning, setIsScanning] = useState(false);
    const [stats, setStats] = useState<ProgressEvent>({ scanned: 0, duplicates_found: 0, bytes_saved: 0 });
    const [results, setResults] = useState<DuplicateGroup[] | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [ignoreRecall, setIgnoreRecall] = useState(true);

    useEffect(() => {
        const unlistenProgress = listen<ProgressEvent>("scan-progress", (event) => {
            setStats(event.payload);
        });

        const unlistenComplete = listen<DuplicateGroup[]>("scan-complete", (event) => {
            setIsScanning(false);
            setResults(event.payload);
        });

        return () => {
            unlistenProgress.then((f) => f());
            unlistenComplete.then((f) => f());
        };
    }, []);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024, dm = 2, sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    };

    const startScan = async () => {
        setIsScanning(true);
        setStats({ scanned: 0, duplicates_found: 0, bytes_saved: 0 });
        setResults(null);
        try {
            await invoke("start_scan_cmd", {
                options: {
                    paths: ["/Users/danielcarney/Downloads"], // Default for demo, usually requested from user
                    ignore_rules: ignoreRecall ? ["Recall"] : [],
                    min_size: 1024,
                }
            });
        } catch (e) {
            console.error(e);
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-100 flex flex-col font-sans overflow-hidden">
            <header className="h-16 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800/50 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck size={18} className="text-white" />
                    </div>
                    <h1 className="text-lg font-semibold tracking-wide bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
                        PRISM
                    </h1>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                    <button
                        title="Settings"
                        aria-label="Settings"
                        className="hover:text-white transition-colors duration-200"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                ignoreRecall={ignoreRecall}
                setIgnoreRecall={setIgnoreRecall}
            />

            <main className="flex-1 p-6 flex flex-col gap-6 relative z-0 overflow-y-auto">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <AnimatePresence mode="wait">
                    {results ? (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-10 h-full max-w-7xl mx-auto w-full"
                        >
                            <ResultsReview groups={results} onDone={() => setResults(null)} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-6 max-w-7xl mx-auto w-full"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <section className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center gap-6">
                                    <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                        <FolderSearch size={48} className="text-indigo-400" />
                                    </div>
                                    <div className="space-y-2 max-w-lg">
                                        <h2 className="text-3xl font-bold tracking-tight">Clean duplicate files with confidence</h2>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            Find exact duplicates using parallel BLAKE3 hashing. Save gigabytes of space securely.
                                        </p>
                                    </div>

                                    <button
                                        onClick={startScan}
                                        disabled={isScanning}
                                        className={`
                      relative group flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-all duration-300
                      ${isScanning
                                                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
                                            }
                    `}
                                    >
                                        {isScanning ? (
                                            <>
                                                <Activity className="animate-pulse" size={18} />
                                                Scanning Context...
                                            </>
                                        ) : (
                                            <>
                                                <FolderSearch size={18} />
                                                Start Demo Scan (~/Downloads)
                                            </>
                                        )}
                                    </button>
                                </section>

                                <FileStatsChart />
                            </div>

                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "Scanned Files", value: stats.scanned.toLocaleString(), sub: "Total searched", icon: Activity, color: "text-blue-400" },
                                    { label: "Duplicates Found", value: stats.duplicates_found.toLocaleString(), sub: formatBytes(stats.bytes_saved) + " savings", icon: Trash2, color: "text-rose-400" },
                                    { label: "Unique Hashes", value: (stats.scanned > 0 ? (stats.scanned - stats.duplicates_found) : 0).toLocaleString(), sub: "BLAKE3 secured", icon: ShieldCheck, color: "text-emerald-400" },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl flex items-start gap-4 hover:bg-slate-800/40 transition-colors cursor-default">
                                        <div className={`p-3 rounded-lg bg-slate-950 border border-slate-800 shadow-md ${stat.color}`}>
                                            <stat.icon size={24} />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                                            <h3 className="text-2xl font-semibold tracking-tight mt-1">{stat.value}</h3>
                                            <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
