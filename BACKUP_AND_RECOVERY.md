# DEIMS Backup and Recovery Procedures

## Automated Backups (Recommended)
It is recommended to run a cron job on the server to execute backups daily.

## Manual Execution
We provide scripts for both Bash (Linux/macOS) and PowerShell (Windows) to handle database and file backups.

### Bash (Linux/macOS)
Located at `server/scripts/backup_recovery.sh`.

**To Backup:**
```bash
cd server/scripts
chmod +x backup_recovery.sh
./backup_recovery.sh backup /path/to/backup/directory
```

**To Restore:**
```bash
./backup_recovery.sh restore /path/to/backup/directory
```

### PowerShell (Windows)
Located at `server/scripts/backup_recovery.ps1`.

**To Backup:**
```powershell
cd server/scripts
.\backup_recovery.ps1 -Command backup -BackupDir C:\Backups\DEIMS
```

**To Restore:**
```powershell
.\backup_recovery.ps1 -Command restore -BackupDir C:\Backups\DEIMS
```

## What is backed up?
1. **Database Dump**: A full `.sql` dump of the MySQL database containing all user data, audit logs, and cases.
2. **Encrypted Evidence**: A `.zip` or `.tar.gz` archive of the `server/encrypted` folder containing all AES-encrypted evidence files.

## Important Note
The blockchain state is decentralized and independent of these backups. The evidence hash references will remain permanently on the blockchain regardless of local data loss.
