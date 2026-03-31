

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);

export default function SensorCard({ 
    sensor, 
    isSelected, 
    onClick 
}: { 
    sensor: any, 
    isSelected: boolean, 
    onClick: () => void 
}) {
    const getStateClass = () => {
        switch(sensor.state) {
            case 'critical': return 'state-critical';
            case 'warning': return 'state-warning';
            case 'silent': return 'state-silent';
            default: return 'state-healthy';
        }
    };

    return (
        <div 
            onClick={onClick}
            className={`glass-card p-5 rounded-2xl text-left cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-white/90 shadow-md border-transparent' : ''
            }`}
        >
            {/* Status indicator glow */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-[40px] opacity-20 ${getStateClass()}`} />
            
            <div className="flex justify-between items-start mb-3 relative z-10">
                <h3 className="font-bold text-lg text-foreground tracking-tight">{sensor.name}</h3>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStateClass()} border border-current shadow-sm`}>
                    {sensor.state}
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium relative z-10">
                <ActivityIcon />
                <span>{sensor.zone?.name || 'Unassigned Zone'}</span>
            </div>
            
            {isSelected && (
                <div className="absolute top-0 right-0 w-1.5 h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            )}
        </div>
    );
}
