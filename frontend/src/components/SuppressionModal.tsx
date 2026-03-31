import React from 'react';

const API_BASE = 'http://localhost:3000/api';

const MaintenanceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.82 0l.1.1a2 2 0 0 1 0 2.82l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a2 2 0 0 1 2.82 0l.1.1a2 2 0 0 1 0 2.82l-3.77 3.77a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0"/>
        <path d="m2 22 5-5"/>
        <path d="M9.5 14.5 16 8"/>
        <path d="m5 17 5-5"/>
        <path d="m2.5 15.5 2 2"/>
        <path d="m19.5 2.5 2 2"/>
    </svg>
);

export default function SuppressionModal({ 
    sensor, 
    activeUserId, 
    onClose, 
    onSuccess 
}: { 
    sensor: any, 
    activeUserId: string, 
    onClose: () => void, 
    onSuccess: () => void 
}) {
    const submitSuppression = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const body = {
            sensor_id: sensor.id,
            start_time: formData.get('startTime'),
            end_time: formData.get('endTime')
        };
        
        await fetch(`${API_BASE}/suppression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': activeUserId },
            body: JSON.stringify(body)
        });
        
        onSuccess();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-[120] animate-in fade-in duration-300">
            <div 
                className="absolute inset-0 z-0" 
                onClick={onClose} 
            />
            <div className="glass-panel p-0 rounded-[2.5rem] w-full max-w-lg text-left text-foreground bg-white/90 border border-white/50 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 z-10">
                <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="p-8 relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shadow-inner">
                                <MaintenanceIcon />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase leading-none mb-1">Silence Node</h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Maintenance Protocol</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                    
                    <div className="bg-yellow-500/[0.03] border-2 border-yellow-500/10 p-5 rounded-[1.5rem] mb-8">
                        <p className="text-sm text-yellow-800 font-bold leading-relaxed">
                            Initializing maintenance window for <span className="text-yellow-900 underline decoration-yellow-500/30 underline-offset-4">{sensor.name}</span>.
                        </p>
                        <p className="text-xs text-yellow-700/70 mt-2 font-medium">
                            Alerts and anomaly notifications will be temporarily muted during this window.
                        </p>
                    </div>
                    
                    <form onSubmit={submitSuppression} className="space-y-6">
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Window Commencement</label>
                                <input 
                                    required 
                                    type="datetime-local" 
                                    name="startTime" 
                                    className="w-full bg-white/70 border-2 border-black/[0.05] text-foreground font-mono rounded-2xl p-4 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 outline-none transition-all shadow-sm" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">Window Termination</label>
                                <input 
                                    required 
                                    type="datetime-local" 
                                    name="endTime" 
                                    className="w-full bg-white/70 border-2 border-black/[0.05] text-foreground font-mono rounded-2xl p-4 focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500/50 outline-none transition-all shadow-sm" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="flex-1 bg-black/5 hover:bg-black/10 text-foreground font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-2xl shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transform hover:-translate-y-1 transition-all active:scale-[0.98]"
                            >
                                Activate Silence
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
