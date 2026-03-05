export default function BackgroundPrism() {
    return (
        <div className="fixed inset-0 w-full h-full -z-10 bg-slate-950 overflow-hidden">

            {/* Inline style for the noise texture fallback */}
            <style>{`
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>

            {/* The 120s Loop Video */}
            <video
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 brightness-75 contrast-110 saturate-110 opacity-100"
                muted
                loop
                autoPlay
                playsInline
                src="/prism-optimized.mp4"
            />

            {/* Deep Purple Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/85 via-purple-900/80 to-indigo-950/85 mix-blend-multiply pointer-events-none" />

            {/* Radial Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-purple-950/50 mix-blend-overlay pointer-events-none" />

            {/* Noise Texture */}
            <div className="absolute inset-0 noise-bg opacity-[0.015] mix-blend-overlay pointer-events-none" />

        </div>
    );
}
