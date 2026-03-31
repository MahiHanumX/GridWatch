import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import SensorCard from './components/SensorCard';
import AlertItem from './components/AlertItem';
import SensorDetails from './components/SensorDetails';
import AuditModal from './components/AuditModal';
import SuppressionModal from './components/SuppressionModal';

const API_BASE = 'http://localhost:3000/api';

const FlameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  
  const [sensors, setSensors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingAuditAlert, setViewingAuditAlert] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [suppressingSensor, setSuppressingSensor] = useState<any>(null);
  const [rulesVersion, setRulesVersion] = useState(0);
  
  // 1. Fetch Users
  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then(r => r.json())
      .then(list => setUsers(list));
  }, []);

  // 2. Fetch Data when user logs in
  useEffect(() => {
    if (!activeUser) return;
    
    const headers = { 'x-user-id': activeUser.id };
    
    fetch(`${API_BASE}/sensors`, { headers })
      .then(r => r.json())
      .then(list => setSensors(list));
      
    fetch(`${API_BASE}/alerts`, { headers })
      .then(r => r.json())
      .then(list => setAlerts(list.data || list));
      
    const eventSource = new EventSource(`${API_BASE}/live?userId=${activeUser.id}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === 'sensor_state_change') {
         setSensors(prev => prev.map(s => 
            s.id === data.data.sensor_id ? { ...s, state: data.data.state } : s
         ));
         fetch(`${API_BASE}/alerts`, { headers })
            .then(r => r.json())
            .then(list => setAlerts(list.data || list));
      }
    };
    
    return () => eventSource.close();
  }, [activeUser]);
  
  // 3. Sensor Details / History View
  useEffect(() => {
      if (!selectedSensor || !activeUser) return;
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const refreshHistory = () => {
          fetch(`${API_BASE}/sensors/${selectedSensor.id}/history?from=${twoDaysAgo.toISOString()}&to=${new Date().toISOString()}`, {
              headers: { 'x-user-id': activeUser.id }
          })
          .then(r => r.json())
          .then(res => setHistory(res.data || []));
      }
      
      refreshHistory();
  }, [selectedSensor, activeUser]);
  
  const transitionAlert = async (alertId: string, status: string) => {
      await fetch(`${API_BASE}/alerts/${alertId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': activeUser.id },
          body: JSON.stringify({ status })
      });
      fetch(`${API_BASE}/alerts`, { headers: { 'x-user-id': activeUser.id } })
      .then(r => r.json())
      .then(list => setAlerts(list.data || list));
  };

  const viewAuditLog = async (alert: any) => {
      setViewingAuditAlert(alert);
      setAuditLogs([]);
      fetch(`${API_BASE}/alerts/${alert.id}/audit`, {
          headers: { 'x-user-id': activeUser.id }
      })
      .then(r => r.json())
      .then(res => setAuditLogs(res));
  };
  
  const simulateIngest = async () => {
    if (sensors.length === 0) return alert('No sensors loaded per zone to generate mock ingest!');
    
    const payload = [];
    for (let i = 0; i < 500; i++) {
        const s = sensors[Math.floor(Math.random() * sensors.length)];
        payload.push({
            sensor_id: s.id,
            timestamp: new Date().toISOString(),
            voltage: 220 + (Math.random() * 40 - 20),
            current: 15 + Math.random() * 5,
            temperature: 40 + (Math.random() * 50),
            status_code: 200
        });
    }

    await fetch(`${API_BASE}/../ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    alert('Fired 500 readings simultaneously to async endpoint!');
    if (selectedSensor) {
        setSelectedSensor({...selectedSensor}); // force refresh
    }
  };
  
  const updateSensorRules = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    for (const [key, value] of formData.entries()) {
      if (value !== '') body[key] = Number(value);
      else body[key] = null;
    }
    
    try {
      const response = await fetch(`${API_BASE}/sensors/${selectedSensor.id}/rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': activeUser.id },
          body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update rules');
      }

      const updatedSensor = await response.json();
      
      // Update global sensors list
      const sensorsRes = await fetch(`${API_BASE}/sensors`, { headers: { 'x-user-id': activeUser.id } });
      const list = await sensorsRes.json();
      setSensors(list);
        
      // Update local selected sensor with fresh data from server
      setSelectedSensor(updatedSensor);
      setRulesVersion(v => v + 1);
      
      alert('Rules updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };
  
  const onSuppressionSuccess = () => {
    fetch(`${API_BASE}/sensors`, { headers: { 'x-user-id': activeUser.id } })
      .then(r => r.json())
      .then(list => setSensors(list));
      
    fetch(`${API_BASE}/alerts`, { headers: { 'x-user-id': activeUser.id } })
      .then(r => r.json())
      .then(list => setAlerts(list.data || list));
      
    setSuppressingSensor(null);
  };
  
  if (!activeUser) {
      return <LoginScreen users={users} onLogin={setActiveUser} />;
  }

  return (
    <div className="h-screen max-w-[1600px] mx-auto flex flex-col p-6 gap-6 relative z-0 overflow-hidden">
       {/* Background Glow */}
       <div className="-z-10 absolute top-[-10%] right-1/4 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
       
       <header className="flex justify-between items-end border-b border-black/10 pb-4 pt-2 shrink-0 relative z-10">
           <div className="text-left">
               <h1 className="text-4xl font-extrabold mb-1 tracking-tight glow-text-primary text-foreground">
                   GridWatch <span className="text-primary font-normal">Monitor</span>
               </h1>
               <p className="text-muted-foreground font-medium flex items-center gap-2">
                   Logged in as <b className="text-foreground">{activeUser.username}</b> 
                   <span className="bg-black/5 border border-black/5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">{activeUser.role}</span>
               </p>
           </div>
           <div className="flex gap-3">
               <button onClick={simulateIngest} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-[0_4px_15px_rgba(var(--primary),0.3)] hover:scale-[1.02] active:scale-[0.98] hover:bg-primary/90 transition-all flex items-center gap-2 font-bold text-sm border border-black/5">
                   <FlameIcon /> Ingest Bulk Data
               </button>
               <button onClick={() => { setActiveUser(null); setSelectedSensor(null); }} className="px-4 py-2.5 bg-white border border-black/10 rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shadow-sm transition-all flex items-center gap-2 font-bold text-sm text-foreground">
                   <LogoutIcon /> Logout
               </button>
           </div>
       </header>
       
       <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto lg:overflow-hidden relative z-10 pb-10 lg:pb-0 pr-2">
           {/* Left Column: Sensors */}
           <div className="flex-1 flex flex-col lg:overflow-hidden min-h-[500px] lg:min-h-0">
               <div className="flex justify-between items-center mb-6 pt-4 shrink-0">
                   <h2 className="text-2xl font-bold tracking-tight text-foreground">Live Telemetry Array</h2>
                   <div className="flex items-center gap-4 text-xs font-mono font-bold tracking-wider hidden sm:flex">
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" /> HEALTHY</div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#f59e0b]" /> WARNING</div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]" /> CRITICAL</div>
                       <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-black/20" /> SILENT</div>
                   </div>
               </div>
               
               <div className="flex-1 xl:overflow-y-auto pr-4 custom-scrollbar pb-6">
                   <div className="space-y-8">
                       {Array.from(new Set(sensors.map(s => s.zone?.name || 'Unassigned'))).map(zoneName => (
                           <div key={zoneName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                               <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest opacity-60 border-b border-black/5 pb-2">{zoneName}</h3>
                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                   {sensors.filter(s => (s.zone?.name || 'Unassigned') === zoneName).map(s => (
                                       <SensorCard 
                                           key={s.id} 
                                           sensor={s} 
                                           isSelected={selectedSensor?.id === s.id} 
                                           onClick={() => setSelectedSensor(s)} 
                                       />
                                   ))}
                               </div>
                           </div>
                       ))}
                       {sensors.length === 0 && (
                           <div className="p-8 text-center text-muted-foreground bg-white/50 rounded-2xl border border-white">
                               No sensors available in your zone context.
                           </div>
                       )}
                   </div>
               </div>
           </div>

            {/* Right Column: Alerts */}
            <div className="lg:w-[480px] flex flex-col h-auto lg:h-full lg:overflow-hidden pr-2">
                <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col h-full shadow-2xl border-white/50 bg-white/40 backdrop-blur-3xl overflow-hidden">
                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/10">
                         <div className="flex items-center gap-3">
                             <div className="p-3 bg-destructive/10 rounded-2xl">
                                 <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                             </div>
                             <div>
                                 <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase">
                                     Active Alerts
                                 </h2>
                                 <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Real-time Safety Monitor</p>
                             </div>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="bg-destructive text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-destructive/20">{alerts.length}</span>
                         </div>
                     </div>
                     
                     <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar flex-1 pb-6">
                         {alerts.length === 0 ? (
                             <div className="text-center py-24 bg-black/[0.02] rounded-[2.5rem] border-2 border-dashed border-black/5 flex flex-col items-center gap-5">
                                 <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center opacity-40">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                 </div>
                                 <p className="text-muted-foreground font-bold text-base tracking-tight">System Status: Nominal</p>
                             </div>
                         ) : null}
                         
                         {alerts.map(a => (
                             <div key={a.id} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                 <AlertItem 
                                     alert={a} 
                                     onTransition={transitionAlert} 
                                     onViewAudit={viewAuditLog} 
                                 />
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>

        {/* Global Modal Overlay for Sensor Details */}
        {selectedSensor && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                <div 
                    className="absolute inset-0 z-0" 
                    onClick={() => setSelectedSensor(null)} 
                />
                <div className="relative z-10 w-full max-w-6xl">
                    <SensorDetails 
                        key={selectedSensor.id + '-' + rulesVersion}
                        sensor={selectedSensor} 
                        history={history} 
                        onUpdateRules={updateSensorRules} 
                        onOpenSuppression={() => setSuppressingSensor(selectedSensor)} 
                        onClose={() => setSelectedSensor(null)}
                    />
                </div>
            </div>
        )}
        
        {viewingAuditAlert && (
            <AuditModal auditLogs={auditLogs} onClose={() => setViewingAuditAlert(null)} />
        )}
        
        {suppressingSensor && (
           <SuppressionModal 
               sensor={suppressingSensor} 
               activeUserId={activeUser.id} 
               onClose={() => setSuppressingSensor(null)} 
               onSuccess={onSuppressionSuccess} 
           />
        )}
     </div>
  );
}
