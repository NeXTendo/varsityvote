
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex bg-[#0A0F1E] font-sans overflow-hidden">
      {/* Mobile Fancy Background (Hidden on Desktop) */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img 
          src="/images/voting_background.png" 
          alt="Voting Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[#0A0F1E]/80 backdrop-blur-sm" />
      </div>

      {/* Left: branding panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col items-center justify-center p-16 text-white border-r border-white/5">
        {/* Desktop Local Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/voting_background.png" 
            alt="Voting Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1E] via-[#0A0F1E]/60 to-[#0A0F1E]" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-12 max-w-xl">
          <div className="space-y-1 group">
            <span className="text-5xl font-black tracking-tighter uppercase block bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">VarsityVote</span>
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] ml-2">Institutional Grade</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-black leading-[1.1] tracking-tighter text-white">
              The Standard for <span className="text-primary">University </span> Governance.
            </h1>
            <p className="text-lg font-medium text-white/60 leading-relaxed max-w-md italic">
              "Ensuring an immutable, transparent, and cryptographically secure mandate for every student."
            </p>
          </div>
        </div>
      </div>

      {/* Right: form (Mobile/Desktop) */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6 lg:p-12 bg-transparent lg:bg-white lg:text-slate-900">
        <div className="w-full max-w-md lg:max-w-sm space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-white/[0.05] lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none p-8 lg:p-0 rounded-[2.5rem] border border-white/10 lg:border-none shadow-2xl shadow-black/40 lg:shadow-none">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center text-center gap-1 mb-2">
            <span className="font-black text-3xl tracking-tighter uppercase text-white bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">VarsityVote</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em] ml-1">Institutional Grade</span>
          </div>
          
          <div className="relative">
            {children}
            {/* Subtle floating elements (Mobile only) */}
            <div className="absolute lg:hidden -z-10 top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[60px]" />
          </div>
        </div>
      </div>
    </div>
  )
}