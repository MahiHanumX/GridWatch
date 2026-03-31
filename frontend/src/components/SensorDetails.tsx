

import React from 'react';

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>
);

const BellOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8a7 7 0 0 0-4.5 4.5V19h13"/><path d="M18 13v6k-4.5 19H13"/><path d="M1 1l22 22"/>
    </svg>
);

export default function SensorDetails({
    sensor,
    history,
    onUpdateRules,
    onOpenSuppression,
    onClose
}: {
    sensor: any,
    history: any[],
    onUpdateRules: (e: React.FormEvent<HTMLFormElement>) => void,
    onOpenSuppression: () => void,
    onClose: () => void
}) {
    return (
        <div className="glass-panel p-8 rounded-[2.5rem] w-full max-w-4xl mx-auto flex flex-col max-h-[90vh] shadow-2xl border-white/40 animate-in zoom-in-95 duration-300 relative overflow-hidden bg-white/90 backdrop-blur-3xl">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-50 text-muted-foreground hover:text-foreground"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="flex justify-between items-start mb-6 pb-6 border-b border-black/5 relative shrink-0">
                <div className="space-y-1">
                    <h2 className="text-4xl font-extrabold text-foreground tracking-tighter uppercase">{sensor.name}</h2>
                    <p className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Live Diagnostics & Node Configuration
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2 mr-10">
                    <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-black font-mono text-primary uppercase tracking-widest shadow-inner">
                        NODE: {sensor.id.substring(0,12)}
                    </span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Rules Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-2xl">
                                <SettingsIcon />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-foreground tracking-tight text-xl leading-tight">Detection Rules</h3>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider opacity-60">Threshold Management</p>
                            </div>
                        </div>
                        
                        <form onSubmit={onUpdateRules} className="bg-black/[0.03] p-6 rounded-[2rem] border border-black/[0.04] space-y-6 shadow-inner backdrop-blur-sm">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Min Voltage (V)</label>
                                    <input 
                                        name="ruleAMinVoltage" 
                                        type="number" 
                                        step="any" 
                                        defaultValue={sensor.ruleAMinVoltage ?? ''} 
                                        className="w-full bg-white/70 border border-black/5 text-foreground p-3.5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder-black/10 font-mono text-sm shadow-sm" 
                                        placeholder="Auto"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Max Voltage (V)</label>
                                    <input 
                                        name="ruleAMaxVoltage" 
                                        type="number" 
                                        step="any" 
                                        defaultValue={sensor.ruleAMaxVoltage ?? ''} 
                                        className="w-full bg-white/70 border border-black/5 text-foreground p-3.5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder-black/10 font-mono text-sm shadow-sm" 
                                        placeholder="Auto"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Min Temp (°C)</label>
                                    <input 
                                        name="ruleAMinTemp" 
                                        type="number" 
                                        step="any" 
                                        defaultValue={sensor.ruleAMinTemp ?? ''} 
                                        className="w-full bg-white/70 border border-black/5 text-foreground p-3.5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder-black/10 font-mono text-sm shadow-sm" 
                                        placeholder="Auto"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Max Temp (°C)</label>
                                    <input 
                                        name="ruleAMaxTemp" 
                                        type="number" 
                                        step="any" 
                                        defaultValue={sensor.ruleAMaxTemp ?? ''} 
                                        className="w-full bg-white/70 border border-black/5 text-foreground p-3.5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder-black/10 font-mono text-sm shadow-sm" 
                                        placeholder="Auto"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2 border-t border-black/5 pt-5">
                                <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Drift Sensitivity (%)</label>
                                <input 
                                    name="ruleBChangeThreshold" 
                                    type="number" 
                                    step="any" 
                                    defaultValue={sensor.ruleBChangeThreshold ?? ''} 
                                    className="w-full bg-white/70 border border-black/5 text-foreground p-3.5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all placeholder-black/10 font-mono text-sm shadow-sm" 
                                    placeholder="e.g. 10.0"
                                />
                                <p className="text-[10px] text-muted-foreground font-semibold px-1 opacity-70">Anomaly alert if value swings &gt; X% between packets.</p>
                            </div>

                            <button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl p-4 font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 active:scale-[0.98] mt-2 border border-primary/20"
                            >
                                Deploy New Configuration
                            </button>
                        </form>
                    </div>

                    {/* History Section */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-2xl">
                                    <HistoryIcon />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-foreground tracking-tight text-xl leading-tight">Telemetry Stream</h3>
                                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider opacity-60">Multi-Vector Log</p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={onOpenSuppression} 
                                className="flex items-center gap-2 bg-yellow-500/10 text-yellow-700 border border-yellow-500/30 px-5 py-2.5 text-[11px] font-black rounded-2xl shadow-sm hover:bg-yellow-500/20 transition-all uppercase tracking-[0.1em] active:scale-95"
                            >
                                <BellOffIcon /> Silence
                            </button>
                        </div>
                        
                        <div className="space-y-4 pr-1">
                            {history.length === 0 ? (
                                <div className="text-center py-20 bg-black/[0.02] rounded-[2.5rem] border-2 border-dashed border-black/5 flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center opacity-40">
                                        <HistoryIcon />
                                    </div>
                                    <p className="text-muted-foreground font-bold text-sm tracking-tight">No live telemetry packets in queue.</p>
                                </div>
                            ) : null}
                            
                            {history.map((h: any) => (
                                <div key={h.id} className={`p-5 border rounded-[2rem] bg-white/40 backdrop-blur-md transition-all group relative overflow-hidden ${
                                    h.has_anomaly 
                                    ? 'border-destructive/30 shadow-destructive/5 bg-destructive/[0.03]' 
                                    : 'border-black/[0.06] hover:border-primary/30 hover:bg-white/80 shadow-sm'
                                }`}>
                                    {h.has_anomaly && (
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-destructive/60 shadow-[2px_0_10px_rgba(var(--destructive),0.2)]" />
                                    )}
                                    
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${h.has_anomaly ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                                            <span className="text-foreground text-sm font-black font-mono tracking-tighter">
                                                {new Date(h.timestamp).toLocaleTimeString(undefined, {
                                                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                                                })}
                                            </span>
                                            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">
                                                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-2 ${
                                            h.statusCode === 200 
                                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' 
                                            : 'bg-destructive/10 text-destructive border-destructive/10'
                                        }`}>
                                            CODE {h.statusCode}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col bg-black/[0.03] rounded-2xl px-4 py-3 border border-black/[0.04] transition-all group-hover:bg-white group-hover:shadow-sm">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Voltage</span>
                                            <span className="text-base font-black text-foreground font-mono">{Number(h.voltage).toFixed(1)}<span className="text-xs ml-1 font-bold text-muted-foreground/60 uppercase">V</span></span>
                                        </div>
                                        <div className="flex flex-col bg-black/[0.03] rounded-2xl px-4 py-3 border border-black/[0.04] transition-all group-hover:bg-white group-hover:shadow-sm">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Current</span>
                                            <span className="text-base font-black text-foreground font-mono">{Number(h.current).toFixed(1)}<span className="text-xs ml-1 font-bold text-muted-foreground/60 uppercase">A</span></span>
                                        </div>
                                        <div className="flex flex-col bg-black/[0.03] rounded-2xl px-4 py-3 border border-black/[0.04] transition-all group-hover:bg-white group-hover:shadow-sm">
                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1 opacity-60">Temp</span>
                                            <span className="text-base font-black text-foreground font-mono">{Number(h.temperature).toFixed(1)}<span className="text-xs ml-1 font-bold text-muted-foreground/60 uppercase">°C</span></span>
                                        </div>
                                    </div>

                                    {h.has_anomaly && h.anomalies?.length > 0 && (
                                        <div className="mt-5 space-y-3 border-t border-destructive/10 pt-4">
                                            {h.anomalies.map((an: any) => (
                                                <div key={an.id} className={`p-4 border-2 rounded-2xl text-xs font-bold flex items-center gap-4 ${
                                                    an.isSuppressed 
                                                        ? 'bg-yellow-500/[0.04] border-yellow-500/10 text-yellow-800' 
                                                        : 'bg-destructive/[0.04] border-destructive/10 text-destructive'
                                                }`}>
                                                    <div className={`w-1.5 h-6 rounded-full shrink-0 ${an.isSuppressed ? 'bg-yellow-500/40' : 'bg-destructive/40'}`} />
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                                an.isSuppressed ? 'bg-yellow-500/20' : 'bg-destructive/20'
                                                            }`}>
                                                                VIOLATION: RULE {an.ruleType}
                                                            </span>
                                                        </div>
                                                        <div className="leading-relaxed opacity-90">{an.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

