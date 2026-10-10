import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Download, CheckCircle2, FileText, Printer, FileDown } from 'lucide-react';
import SocCard from '../components/ui/SocCard';
import { useApp } from '../context/AppContext';

export default function Reports() {
  const { cases, apiFetch } = useApp();
  const [reportType, setReportType] = useState('case_summary');
  const [selectedCase, setSelectedCase] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const getAuthToken = () => {
    const local = localStorage.getItem('soc_token');
    const session = sessionStorage.getItem('soc_token');
    if (local) return JSON.parse(local);
    if (session) return JSON.parse(session);
    return null;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReportReady(false);
    setErrorMsg(null);
    setReportId(null);
    
    try {
      const url = selectedCase 
        ? `/reports/generate/${selectedCase}` 
        : `/reports/generate`;
        
      const res = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify({ template: reportType })
      });
      
      if (res.status !== 201 && res.status !== 200 && !res.data?.success) {
        throw new Error(res.data?.message || `HTTP ${res.status}`);
      }
      
      setReportId(res.data.data.id);
      setReportReady(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(`Unable to connect to the DEIMS server. ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!reportReady || !reportId) return;
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Authentication failed. Please log in again.");
      
      const url = `http://localhost:5000/api/reports/${reportId}/download`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        let errText = await response.text();
        try {
          const json = JSON.parse(errText);
          errText = json.message || json.error || errText;
        } catch(e) {}
        throw new Error(errText || `HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty.');
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        console.warn('Unexpected PDF content type:', contentType);
      }
      
      let safeName = selectedCase ? `Case_${selectedCase}` : 'Global';
      safeName = safeName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `DEIMS_${safeName}_Forensic_Report.pdf`;
      
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      
    } catch (err) {
      console.error(err);
      alert(`Unable to download PDF. ${err.message}`);
    }
  };

  const handlePrint = () => {
    if (reportReady) {
      window.print();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-mono-tabular font-bold text-soc-text uppercase tracking-widest flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-soc-cyan" /> Report Generator
        </h1>
        <p className="text-xs text-soc-muted font-mono-tabular">Compile and export secure investigation documentation.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded text-sm font-mono-tabular">
          {errorMsg}
        </div>
      )}

      <SocCard>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Report Template</label>
              <select 
                value={reportType}
                onChange={(e) => { setReportType(e.target.value); setReportReady(false); }}
                className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 px-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan appearance-none"
              >
                <option value="case_summary">Case Summary</option>
                <option value="evidence_integrity">Evidence Integrity Report</option>
                <option value="chain_of_custody">Chain of Custody Report</option>
                <option value="merkle_integrity">Merkle Integrity Report</option>
                <option value="audit_export">System Audit Report</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono-tabular text-soc-muted uppercase tracking-wider block">Target Case (Optional)</label>
              <select 
                value={selectedCase}
                onChange={(e) => { setSelectedCase(e.target.value); setReportReady(false); }}
                className="w-full bg-[#03070f] border border-soc-panel-border rounded-md py-2.5 px-3 text-sm text-soc-text focus:outline-none focus:border-soc-cyan appearance-none"
              >
                <option value="">All Cases</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 rounded-md font-mono-tabular font-bold uppercase tracking-widest text-xs transition-colors ${
              isGenerating 
                ? 'bg-soc-panel-border text-soc-muted cursor-wait'
                : 'bg-soc-cyan/10 border border-soc-cyan text-soc-cyan hover:bg-soc-cyan hover:text-black shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
          >
            {isGenerating ? 'Compiling Data...' : 'Generate Report'}
          </button>
          
          {reportReady && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 border border-soc-panel-border rounded-lg p-6 bg-[#03070f]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-soc-green/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-soc-green" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-soc-text">Report Compiled Successfully</h3>
                  <p className="text-xs text-soc-muted font-mono-tabular">Generated: {new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-[#0a1122] p-4 rounded text-xs text-soc-text font-mono-tabular border border-soc-panel-border mb-6">
                <p><span className="text-soc-muted uppercase w-24 inline-block">Format:</span> Secure PDF</p>
                <p><span className="text-soc-muted uppercase w-24 inline-block">Template:</span> {reportType.toUpperCase()}</p>
                <p><span className="text-soc-muted uppercase w-24 inline-block">Scope:</span> {selectedCase || 'Global'}</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleDownload}
                  className="flex-1 py-2 bg-soc-green/10 border border-soc-green text-soc-green text-xs font-mono-tabular font-bold rounded flex justify-center items-center gap-2 hover:bg-soc-green hover:text-black transition-colors"
                >
                  <FileDown className="w-4 h-4" /> Download PDF
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-2 bg-[#0a1122] border border-soc-panel-border text-soc-text text-xs font-mono-tabular font-bold rounded flex justify-center items-center gap-2 hover:bg-soc-panel-border transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </SocCard>
    </motion.div>
  );
}
