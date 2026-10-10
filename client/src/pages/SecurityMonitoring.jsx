import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, CheckCircle2, UserX, MapPin, FileDown } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

export default function SecurityMonitoring() {
  const { apiFetch } = useApp();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        apiFetch('/security/dashboard'),
        apiFetch('/security/events')
      ]);
      setStats(statsRes.data.data);
      setEvents(eventsRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch('/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ template: 'security_report' })
      });
      
      if (res.data?.success) {
        const reportId = res.data.data.id;
        
        // Use token logic to download
        const local = localStorage.getItem('soc_token');
        const session = sessionStorage.getItem('soc_token');
        let token = null;
        if (local) token = JSON.parse(local);
        else if (session) token = JSON.parse(session);
        
        const response = await fetch(`http://localhost:5000/api/reports/${reportId}/download`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error("Download failed");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `DEIMS_Security_Report_${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate security PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-soc-cyan font-mono-tabular animate-pulse">Loading Security Feed...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-5 h-5 text-soc-cyan" /> Security Monitoring
          </h1>
          <p className="text-xs text-soc-muted font-mono-tabular">Live global security telemetry and login auditing.</p>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="px-4 py-2 bg-soc-cyan/10 border border-soc-cyan text-soc-cyan text-xs font-mono-tabular font-bold rounded flex justify-center items-center gap-2 hover:bg-soc-cyan hover:text-black transition-colors"
        >
          <FileDown className="w-4 h-4" /> {isGenerating ? 'GENERATING...' : 'DAILY PDF REPORT'}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SocCard className="p-4">
            <div className="text-xs text-soc-muted uppercase mb-1">Total Attempts</div>
            <div className="text-2xl text-soc-text font-mono-tabular">{stats.total_attempts}</div>
          </SocCard>
          <SocCard className="p-4">
            <div className="text-xs text-soc-muted uppercase mb-1 text-soc-green flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Successful</div>
            <div className="text-2xl text-soc-green font-mono-tabular">{stats.successful_logins}</div>
          </SocCard>
          <SocCard className="p-4">
            <div className="text-xs text-soc-muted uppercase mb-1 text-red-400 flex items-center gap-1"><UserX className="w-3 h-3"/> Failed</div>
            <div className="text-2xl text-red-400 font-mono-tabular">{stats.failed_logins}</div>
          </SocCard>
          <SocCard className="p-4">
            <div className="text-xs text-soc-muted uppercase mb-1 text-yellow-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Suspicious IPs</div>
            <div className="text-2xl text-yellow-400 font-mono-tabular">{stats.suspicious_ips}</div>
          </SocCard>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SocCard>
            <div className="p-4 border-b border-soc-panel-border">
              <h2 className="text-sm font-mono-tabular font-bold text-soc-text uppercase">Login Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-tabular">
                <thead className="text-soc-muted uppercase bg-[#0a1122]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">User</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-soc-panel-border/50">
                  {events.map(ev => (
                    <tr 
                      key={ev.id} 
                      className="hover:bg-soc-cyan/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(ev)}
                    >
                      <td className="p-3 text-soc-text">{new Date(ev.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-soc-muted">{ev.event_type.replace('_', ' ')}</td>
                      <td className="p-3 text-soc-cyan">{ev.attempted_identifier || ev.user_id || '-'}</td>
                      <td className="p-3 text-soc-text">{ev.ip_address}</td>
                      <td className={`p-3 font-bold ${ev.event_result === 'SUCCESS' ? 'text-soc-green' : ev.event_result === 'FAILURE' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {ev.event_result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SocCard>
        </div>
        
        <div>
          <SocCard className="h-full">
            <div className="p-4 border-b border-soc-panel-border">
              <h2 className="text-sm font-mono-tabular font-bold text-soc-text uppercase">Event Details</h2>
            </div>
            <div className="p-4">
              {selectedEvent ? (
                <div className="space-y-4 text-xs font-mono-tabular text-soc-text">
                  <div><span className="text-soc-muted uppercase block text-[10px]">Event Type</span> {selectedEvent.event_type}</div>
                  <div><span className="text-soc-muted uppercase block text-[10px]">Timestamp</span> {new Date(selectedEvent.timestamp).toLocaleString()}</div>
                  <div><span className="text-soc-muted uppercase block text-[10px]">User Identifier</span> {selectedEvent.attempted_identifier || selectedEvent.user_id || 'N/A'}</div>
                  
                  <div className="bg-[#0a1122] p-3 rounded border border-soc-panel-border space-y-2 mt-4">
                    <div className="font-bold text-soc-cyan flex items-center gap-1 mb-2"><MapPin className="w-3 h-3"/> IP Location Info</div>
                    <div><span className="text-soc-muted">IP:</span> {selectedEvent.ip_address}</div>
                    <div><span className="text-soc-muted">Approximate IP Location:</span> {selectedEvent.ip_city || 'Unknown'}, {selectedEvent.ip_region}, {selectedEvent.ip_country}</div>
                    <div><span className="text-soc-muted">ISP:</span> {selectedEvent.isp || 'N/A'}</div>
                    <div><span className="text-soc-muted">ASN:</span> {selectedEvent.asn || 'N/A'}</div>
                    {selectedEvent.ip_latitude != null && selectedEvent.ip_longitude != null && (
                      <div className="pt-2">
                        <a
                          href={`https://www.google.com/maps?q=${selectedEvent.ip_latitude},${selectedEvent.ip_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-soc-cyan hover:text-white transition-colors"
                        >
                          [ 🌐 View Approximate Location ]
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#0a1122] p-3 rounded border border-soc-panel-border space-y-2 mt-4">
                    <div className="font-bold text-soc-cyan flex items-center gap-1 mb-2"><MapPin className="w-3 h-3"/> GPS Info</div>
                    <div><span className="text-soc-muted">Permission:</span> {selectedEvent.location_permission || 'UNAVAILABLE'}</div>
                    {selectedEvent.gps_latitude != null && (
                      <>
                        <div><span className="text-soc-muted">Latitude:</span> {selectedEvent.gps_latitude}</div>
                        <div><span className="text-soc-muted">Longitude:</span> {selectedEvent.gps_longitude}</div>
                        <div><span className="text-soc-muted">Accuracy:</span> ±{selectedEvent.gps_accuracy}m</div>
                      </>
                    )}
                    {selectedEvent.location_permission === 'GRANTED' && selectedEvent.gps_latitude != null && selectedEvent.gps_longitude != null && (
                      <div className="pt-2">
                        <a
                          href={`https://www.google.com/maps?q=${selectedEvent.gps_latitude},${selectedEvent.gps_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-soc-cyan hover:text-white transition-colors"
                        >
                          [ 📍 View on Google Maps ]
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className="text-soc-muted uppercase block text-[10px]">Device Info</span>
                    <p>{selectedEvent.device_type} - {selectedEvent.operating_system} - {selectedEvent.browser}</p>
                  </div>
                  
                  <div className="mt-4">
                    <span className="text-soc-muted uppercase block text-[10px]">Result</span>
                    <span className={`font-bold ${selectedEvent.event_result === 'SUCCESS' ? 'text-soc-green' : 'text-red-500'}`}>
                      {selectedEvent.event_result}
                      {selectedEvent.failure_reason && ` - ${selectedEvent.failure_reason}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-soc-muted text-xs font-mono-tabular text-center py-8">Select an event to view details.</div>
              )}
            </div>
          </SocCard>
        </div>
      </div>
    </motion.div>
  );
}
