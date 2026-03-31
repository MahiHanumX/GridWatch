

const ShieldAlertIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.5 0 4.5 1.5 7 2a1 1 0 0 1 1 1z"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
    </svg>
);

export default function LoginScreen({ 
    users, 
    onLogin 
}: { 
    users: any[], 
    onLogin: (user: any) => void 
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="glass-panel p-10 max-w-lg w-full rounded-3xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-700 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                        <ShieldAlertIcon className="w-12 h-12 text-primary" />
                    </div>
                </div>
                
                <h1 className="text-4xl font-extrabold mb-2 text-foreground tracking-tight glow-text-primary">
                    GridWatch
                </h1>
                <p className="text-muted-foreground mb-10 text-lg font-medium tracking-wide">
                    Sensor Intelligence Platform
                </p>
                
                <div className="space-y-4 min-h-[100px] flex flex-col items-center justify-center">
                    {users.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground text-sm font-medium animate-pulse">Initializing Security Context...</p>
                            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-black mt-2">Checking Backend Connection @ :3000</p>
                        </div>
                    ) : (
                        users.map((u: any) => (
                            <button 
                                key={u.id} 
                                onClick={() => onLogin(u)}
                                className="group block w-full text-left p-6 rounded-[1.5rem] bg-white/70 border-2 border-black/[0.03] hover:bg-white hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:scale-[1.02] transform active:scale-95"
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-black text-xl text-foreground group-hover:text-primary transition-colors tracking-tighter uppercase">
                                        {u.username}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/10 text-[10px] font-black tracking-widest text-primary uppercase shadow-inner">
                                        {u.role}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs text-muted-foreground font-semibold transition-colors group-hover:text-foreground/90 uppercase tracking-tight">
                                        {u.zoneId ? `Assigned to: ${u.zoneId}` : 'Full Infrastructure Access'}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
                
                <div className="mt-12 pt-8 border-t border-black/5">
                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.2em]">© 2026 GridWatch Security Protocol v4.2.1-Prod</p>
                </div>
            </div>
        </div>
    );
}
