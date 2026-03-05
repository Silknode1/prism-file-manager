import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

const data = [
    { name: "Images (.jpg, .png)", value: 400, color: "#3b82f6" },
    { name: "Videos (.mp4, .mov)", value: 300, color: "#a855f7" },
    { name: "Documents (.pdf, .docx)", value: 300, color: "#10b981" },
    { name: "Archives (.zip, .tar)", value: 200, color: "#f59e0b" },
];

export default function FileStatsChart() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-6 rounded-2xl flex flex-col items-center shadow-lg"
        >
            <h3 className="text-lg font-semibold text-slate-200 mb-4 self-start">File Type Distribution</h3>
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={(props: any) => `${props.name?.split(' ')[0] || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                            animationBegin={200}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-400">{entry.name}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
