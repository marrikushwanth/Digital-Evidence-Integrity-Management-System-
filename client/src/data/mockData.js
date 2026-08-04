export const initialUsers = [
  { id: 'USR-0001', fullName: 'Kushwanth', username: 'kushwanth', password: 'kushwanth', role: 'Super Admin', status: 'Active', initials: 'K', email: 'kushwanth@deims.soc' },
  { id: 'USR-0002', fullName: 'Adithya', username: 'adithya', password: 'adithya', role: 'Admin', status: 'Active', initials: 'A', email: 'adithya@deims.soc' },
  { id: 'USR-0003', fullName: 'Harsha', username: 'harsha', password: 'harsha', role: 'Investigator', status: 'Active', initials: 'H', email: 'harsha@deims.soc' },
  { id: 'USR-0004', fullName: 'Mem1', username: 'mem1', password: 'mem1', role: 'Auditor', status: 'Active', initials: 'M1', email: 'mem1@deims.soc' },
  { id: 'USR-0005', fullName: 'Mem2', username: 'mem2', password: 'mem2', role: 'Editor', status: 'Active', initials: 'M2', email: 'mem2@deims.soc' },
  { id: 'USR-0006', fullName: 'Mem3', username: 'mem3', password: 'mem3', role: 'Viewer', status: 'Active', initials: 'M3', email: 'mem3@deims.soc' },
  { id: 'USR-0007', fullName: 'Mem4', username: 'mem4', password: 'mem4', role: 'Investigator', status: 'Pending Approval', initials: 'M4', email: 'mem4@deims.soc' },
  { id: 'USR-0008', fullName: 'Mem5', username: 'mem5', password: 'mem5', role: 'Viewer', status: 'Pending Approval', initials: 'M5', email: 'mem5@deims.soc' }
];

export const initialCases = [
  { id: 'CAS-9982', title: 'Ransomware Outbreak on Corp Financial Server', investigator: 'Harsha', status: 'Active', priority: 'Critical', createdDate: '2026-07-18T09:30:00Z', evidenceCount: 4 },
  { id: 'CAS-9983', title: 'Insider Data Exfiltration via Encrypted Tunnel', investigator: 'Adithya', status: 'Under Review', priority: 'High', createdDate: '2026-07-15T11:45:00Z', evidenceCount: 3 },
  { id: 'CAS-9984', title: 'APT41 Spear-Phishing & Memory Dump Extraction', investigator: 'Harsha', status: 'Active', priority: 'Critical', createdDate: '2026-07-10T08:10:00Z', evidenceCount: 5 }
];

export const initialEvidence = [
  { id: 'EVD-9921-X', caseId: 'CAS-9982', fileName: 'fin_server_db_master.E01', fileSize: 42949672960, fileType: 'Disk Image', sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', aesEncrypted: true, uploadDate: '2026-07-18T10:15:30Z', verificationStatus: 'Verified' },
  { id: 'EVD-9922-Y', caseId: 'CAS-9982', fileName: 'lockbit_payload_sample.exe', fileSize: 2457600, fileType: 'Executable Binary', sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08', aesEncrypted: true, uploadDate: '2026-07-18T11:05:00Z', verificationStatus: 'Verified' },
  { id: 'EVD-6611-T', caseId: 'CAS-9984', fileName: 'cctv_server_room_entrance.mp4', fileSize: 1073741824, fileType: 'Video', sha256: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', aesEncrypted: false, uploadDate: '2026-07-12T13:10:00Z', verificationStatus: 'Tampered' }
];

export const initialCustodyTimeline = [
  // Events for EVD-9921-X
  { id: 'CUST-001', evidenceId: 'EVD-9921-X', caseId: 'CAS-9982', action: 'Evidence Uploaded', actor: 'Harsha', role: 'Investigator', status: 'Success', timestamp: '2026-07-18T10:15:30Z', location: 'Secure Forensics Vault' },
  { id: 'CUST-002', evidenceId: 'EVD-9921-X', caseId: 'CAS-9982', action: 'Integrity Verified', actor: 'Adithya', role: 'Admin', status: 'Success', timestamp: '2026-07-19T14:30:10Z', location: 'Review Station B' },
  { id: 'CUST-003', evidenceId: 'EVD-9921-X', caseId: 'CAS-9982', action: 'Report Generated', actor: 'Harsha', role: 'Investigator', status: 'Information', timestamp: '2026-07-20T09:00:00Z', location: 'Review Station B' },
  
  // Events for EVD-9922-Y
  { id: 'CUST-004', evidenceId: 'EVD-9922-Y', caseId: 'CAS-9982', action: 'Evidence Uploaded', actor: 'Harsha', role: 'Investigator', status: 'Success', timestamp: '2026-07-18T11:05:00Z', location: 'Secure Forensics Vault' },
  { id: 'CUST-005', evidenceId: 'EVD-9922-Y', caseId: 'CAS-9982', action: 'Integrity Verified', actor: 'SYSTEM', role: 'System', status: 'Success', timestamp: '2026-07-18T11:06:00Z', location: 'Automated Check Node' },
  
  // Events for EVD-6611-T
  { id: 'CUST-006', evidenceId: 'EVD-6611-T', caseId: 'CAS-9984', action: 'Evidence Uploaded', actor: 'Mem1', role: 'Auditor', status: 'Success', timestamp: '2026-07-12T13:10:00Z', location: 'Branch Office 2' },
  { id: 'CUST-007', evidenceId: 'EVD-6611-T', caseId: 'CAS-9984', action: 'Evidence Tampered', actor: 'SYSTEM', role: 'System', status: 'Tampered', timestamp: '2026-07-20T12:00:00Z', location: 'Primary Storage Cluster' },
];

export const initialAuditLogs = [
  { id: 'LOG-701', timestamp: '2026-07-21T10:12:45Z', user: 'Kushwanth', action: 'APPROVE_USER', details: 'Approved account registration', ipAddress: '192.168.1.1', status: 'SUCCESS' },
  { id: 'LOG-702', timestamp: '2026-07-20T16:12:45Z', user: 'Harsha', action: 'VERIFY_HASH', details: 'Verified SHA-256 hash (MATCH)', ipAddress: '192.168.1.104', status: 'SUCCESS' },
  { id: 'LOG-703', timestamp: '2026-07-20T14:30:00Z', user: 'SYSTEM', action: 'INTEGRITY_ALERT', details: 'Hash mismatch - Tampered', ipAddress: '127.0.0.1', status: 'WARNING' }
];

export const initialNotifications = [
  { id: 'NOTIF-1', title: 'Evidence Tampering Alert!', message: 'File cctv_server_room_entrance.mp4 (EVD-6611-T) failed integrity verification check.', timestamp: '10m ago', type: 'danger', read: false },
  { id: 'NOTIF-2', title: 'Pending Registration', message: 'New users Mem4 and Mem5 registered and waiting for administrator approval.', timestamp: '1h ago', type: 'warning', read: false }
];

export const mockThreatFeed = [
  { id: 1, type: 'CRITICAL', text: 'APT41 Malicious SSH Tunnel Blocked', time: '11:38:12' },
  { id: 2, type: 'WARNING', text: 'Hash Checksum Recalculated - MISMATCH DETECTED', time: '11:35:40' },
  { id: 3, type: 'INFO', text: 'YubiKey 2FA Token Verified for Super Admin', time: '11:30:00' }
];

export const chartDataArea = [
  { name: '00:00', load: 30, events: 10 },
  { name: '04:00', load: 20, events: 5 },
  { name: '08:00', load: 50, events: 20 },
  { name: '12:00', load: 85, events: 45 },
  { name: '16:00', load: 60, events: 25 },
  { name: '20:00', load: 45, events: 15 }
];
