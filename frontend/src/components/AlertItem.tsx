

export default function AlertItem({ 
    alert, 
    onTransition, 
    onViewAudit 
}: { 
    alert: any, 
    onTransition: (id: string, status: string) => void, 
    onViewAudit: (alert: any) => void 
}) {
    const isCritical = alert.severity === 'critical';
    const isOpen = alert.status === 'open';
    const isAcknowledged = alert.status === 'acknowledged';
    
    return (
        <div className={`p-5 rounded-[1.5rem] text-left bg-white/70 backdrop-blur-md border transition-all duration-300 group ${
            isCritical 
            ? 'border-destructive/20 hover:border-destructive/40 shadow-[0_4px_20px_rgba(var(--destructive),0.05)] hover:shadow-[0_8px_30px_rgba(var(--destructive),0.1)]' 
            : 'border-yellow-500/20 hover:border-yellow-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.05)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]'
        }`}>
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-0.5">
                    <h4 className="font-extrabold text-foreground text-[15px] tracking-tight group-hover:text-primary transition-colors">
                        {alert.sensor?.name || alert.sensorId}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • System Alert
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border shadow-sm ${
                        isOpen 
                        ? 'bg-primary/10 text-primary border-primary/20 animate-pulse-slow' 
                        : isAcknowledged 
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    }`}>
                        {alert.status}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border ${
                        isCritical 
                        ? 'bg-destructive text-destructive-foreground border-destructive/20' 
                        : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                    }`}>
                        {alert.severity}
                    </span>
                </div>
            </div>
            
            <div className="relative mb-5 group-hover:transform group-hover:scale-[1.01] transition-transform">
                <div className={`absolute top-0 left-0 w-1 h-full rounded-full ${isCritical ? 'bg-destructive' : 'bg-yellow-500'}`} />
                <div className="pl-4 py-1 text-[13px] text-foreground/80 leading-relaxed font-semibold italic">
                    "{alert.anomaly?.description}"
                </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => onViewAudit(alert)} 
                    className="flex-none p-2 bg-black/[0.03] border border-black/5 text-foreground hover:bg-black/[0.08] transition-all rounded-xl shadow-sm"
                    title="View Audit Trail"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </button>
                
                {isOpen && (
                    <button 
                        onClick={() => onTransition(alert.id, 'acknowledged')} 
                        className="flex-1 bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-[0_4px_12px_rgba(var(--primary),0.2)] active:scale-95 border border-primary/20"
                    >
                        Ack
                    </button>
                )}
                
                <button 
                    onClick={() => onTransition(alert.id, 'resolved')} 
                    className="flex-1 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest px-3 py-2.5 rounded-xl hover:bg-emerald-600 transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] active:scale-95 border border-emerald-600/20"
                >
                    Resolve
                </button>
            </div>
        </div>
    );
}
