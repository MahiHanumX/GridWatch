import React from 'react';

const AuditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M2 12h4"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/>
    </svg>
);

export default function AuditModal({ 
    auditLogs, 
    onClose 
}: { 
    auditLogs: any[], 
    onClose: () => void 
}) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-[120] animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 z-0" 
                onClick={onClose} 
            />
            <div className="glass-panel p-0 rounded-[2.5rem] w-full max-w-xl text-left text-foreground bg-white/95 border border-white/50 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 z-10 max-h-[85vh] flex flex-col">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="p-8 pb-4 shrink-0 relative z-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                                <AuditIcon />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase leading-none mb-1">Audit Trail</h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Incident Chain of Custody</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-8 pb-8 pr-4 custom-scrollbar space-y-4 relative z-10">
                    {auditLogs.length === 0 ? (
                        <div className="text-center py-20 bg-black/[0.02] rounded-[2rem] border-2 border-dashed border-black/5">
                            <p className="text-muted-foreground font-bold text-sm tracking-tight">Accessing encrypted log sequence...</p>
                        </div>
                    ) : null}
                    
                    {auditLogs.map((log: any) => (
                        <div key={log.id} className="p-5 border-2 border-black/[0.03] bg-white rounded-3xl transition-all hover:bg-white hover:shadow-xl hover:border-primary/20 group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-muted-foreground text-[10px] font-black font-mono uppercase tracking-[0.15em] opacity-60">
                                    {new Date(log.changedAt).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-primary/70 tracking-widest">Recorded</span>
                                </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-2 mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                    log.fromStatus === 'CRITICAL' ? 'bg-destructive/10 text-destructive border-destructive/10' :
                                    log.fromStatus === 'ACKNOWLEDGED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' :
                                    'bg-black/5 text-muted-foreground border-black/5'
                                }`}>
                                    {log.fromStatus || 'INITIAL'}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-30"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                    log.toStatus === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' :
                                    log.toStatus === 'ACKNOWLEDGED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' :
                                    'bg-primary/10 text-primary border-primary/20'
                                }`}>
                                    {log.toStatus}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-black/[0.02] p-3 rounded-2xl border border-black/[0.02] group-hover:bg-primary/[0.02] transition-colors">
                                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[10px] font-black border border-black/[0.05] text-muted-foreground">
                                    {log.user?.username?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1 opacity-50">Authorized Agent</p>
                                    <p className="text-xs font-bold text-foreground">
                                        {log.user ? `${log.user.username} ` : 'System Automated Task'}
                                        <span className="text-[9px] text-muted-foreground ml-1 font-medium italic">({log.user?.role || 'Service Worker'})</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="p-8 pt-0 mt-auto shrink-0 relative z-10">
                    <button 
                        onClick={onClose}
                        className="w-full bg-primary text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transform hover:-translate-y-1 transition-all active:scale-[0.98]"
                    >
                        Close Log Viewer
                    </button>
                </div>
            </div>
        </div>
    );
}
