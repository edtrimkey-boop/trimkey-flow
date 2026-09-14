export function Logo({ className = "w-8 h-8", glow = true }: { className?: string; glow?: boolean }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-[#141E30] to-[#080D17] border border-white/15 ${
        glow ? "shadow-[0_0_15px_rgba(38,195,234,0.45)]" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        <defs>
          <linearGradient id="tkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#26C3EA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#26C3EA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2ECC71" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* T-Bar */}
        <path
          d="M 8 12 L 32 12 L 32 17 L 23 17 L 23 30 L 17 30 L 17 17 L 8 17 Z"
          fill="url(#tkGradient)"
        />
        {/* Key notch accent */}
        <circle cx="28" cy="24" r="3" fill="#26C3EA" />
        <path d="M 28 27 L 28 31" stroke="#26C3EA" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}
