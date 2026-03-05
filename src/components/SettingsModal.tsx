import { motion } from "framer-motion";
import { X, Shield, Moon } from "lucide-react";

export default function SettingsModal({
    isOpen,
    onClose,
    ignoreRecall,
    setIgnoreRecall
}: {
    isOpen: boolean,
    onClose: () => void,
    ignoreRecall: boolean,
    setIgnoreRecall: (val: boolean) => void
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 w-full max-w-lg rounded-2xl shadow-2xl p-6"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-slate-100 tracking-wide">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">

                    {/* Exclusions */}
                    <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Scan Exclusions</h3>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <div className="flex gap-4 items-center">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Shield size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-slate-200 font-medium">Ignore "Recall AI" Exports</p>
                                    <p className="text-slate-500 text-xs mt-1">Prevents identical AI transcripts/tags from being flagged.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={ignoreRecall}
                                    onChange={(e) => setIgnoreRecall(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>
                    </section>

                    {/* Appearance */}
                    <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Appearance</h3>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                            <div className="flex gap-4 items-center">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Moon size={20} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-slate-200 font-medium">Liquid Glass Theme</p>
                                    <p className="text-slate-500 text-xs mt-1">Utilizes hardware acceleration for background effects.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-not-allowed">
                                <input type="checkbox" className="sr-only peer" checked disabled />
                                <div className="w-11 h-6 bg-slate-700 opacity-50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                            </label>
                        </div>
                    </section>

                </div>
            </motion.div>
        </div>
    );
}
