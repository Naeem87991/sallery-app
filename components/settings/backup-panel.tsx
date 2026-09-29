'use client';

import { useState, type ChangeEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { createEncryptedBackup, decryptBackupFile, getBackupSummary, restoreBackup, type DecryptedBackup } from '@/lib/backup/local-backup';
import { formatDate } from '@/lib/formatting/date';

export function BackupPanel() {
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportConfirmation, setExportConfirmation] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DecryptedBackup | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [status, setStatus] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const exportBackup = async () => {
    if (exportPassphrase !== exportConfirmation) { setStatus('The backup passphrase and confirmation do not match.'); return; }
    setIsBusy(true); setStatus('');
    try {
      const backup = await createEncryptedBackup(exportPassphrase);
      downloadBackup(backup, `live-salary-ticker-${new Date().toISOString().slice(0, 10)}.lstbackup`);
      setExportPassphrase(''); setExportConfirmation(''); setStatus('Encrypted backup downloaded. Keep its passphrase somewhere safe.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not create an encrypted backup.'); }
    finally { setIsBusy(false); }
  };

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file); setPreview(null); setRestoreConfirmed(false); setStatus(file ? `Selected ${file.name}. Enter its passphrase to preview.` : '');
  };

  const previewBackup = async () => {
    if (!selectedFile) { setStatus('Choose a .lstbackup file first.'); return; }
    setIsBusy(true); setStatus('');
    try { const backup = await decryptBackupFile(selectedFile, importPassphrase); setPreview(backup); setRestoreConfirmed(false); setStatus('Backup decrypted and validated. Review it before replacing local records.'); }
    catch (error) { setPreview(null); setStatus(error instanceof Error ? error.message : 'Could not read this backup.'); }
    finally { setIsBusy(false); }
  };

  const restore = async () => {
    if (!preview || !restoreConfirmed) { setStatus('Confirm that you want to replace the current local data.'); return; }
    setIsBusy(true); setStatus('');
    try { await restoreBackup(preview); setStatus('Backup restored locally. Security PINs and device passkeys were kept on this device.'); setPreview(null); setSelectedFile(null); setImportPassphrase(''); setRestoreConfirmed(false); }
    catch { setStatus('Could not restore this backup. Your existing local data was not replaced.'); }
    finally { setIsBusy(false); }
  };

  const summary = preview ? getBackupSummary(preview) : null;
  return <div className="backup-panel"><div className="backup-grid"><section className="backup-card"><span className="security-state-icon"><AppIcon name="file" aria-hidden="true" size={19} /></span><p className="eyebrow">EXPORT BACKUP</p><h3>Make an encrypted copy.</h3><p>All local finance and career records are encrypted in a portable <code>.lstbackup</code> file.</p><label className="field"><span>Backup passphrase</span><input autoComplete="new-password" type="password" value={exportPassphrase} onChange={(event) => setExportPassphrase(event.target.value)} placeholder="At least 8 characters" /></label><label className="field"><span>Confirm passphrase</span><input autoComplete="new-password" type="password" value={exportConfirmation} onChange={(event) => setExportConfirmation(event.target.value)} placeholder="Repeat passphrase" /></label><button className="primary-button" type="button" disabled={isBusy} onClick={exportBackup}>{isBusy ? 'Preparing…' : 'Download encrypted backup'}</button></section><section className="backup-card"><span className="security-state-icon"><AppIcon name="shield" aria-hidden="true" size={19} /></span><p className="eyebrow">RESTORE BACKUP</p><h3>Preview before replacing.</h3><p>Only a decrypted, validated backup can replace the local finance records on this device.</p><label className="field"><span>Backup file</span><input accept=".lstbackup,application/json" type="file" onChange={selectFile} /></label><label className="field"><span>Backup passphrase</span><input autoComplete="current-password" type="password" value={importPassphrase} onChange={(event) => setImportPassphrase(event.target.value)} placeholder="Passphrase used for export" /></label><button className="secondary-button" type="button" disabled={isBusy || !selectedFile || !importPassphrase} onClick={previewBackup}>{isBusy ? 'Checking…' : 'Decrypt and preview'}</button></section></div>{summary ? <section className="backup-preview"><div><p className="eyebrow">RESTORE PREVIEW</p><h3>Backup from {formatDate(summary.createdAt.slice(0, 10))}</h3><p>Schema {summary.databaseSchemaVersion} · Security PINs and passkeys are intentionally excluded.</p></div><dl><div><dt>Profiles</dt><dd>{summary.profileCount}</dd></div><div><dt>Attendance</dt><dd>{summary.attendanceCount}</dd></div><div><dt>Company entries</dt><dd>{summary.companyTransactionCount}</dd></div><div><dt>Company loans</dt><dd>{summary.companyLoanCount}</dd></div><div><dt>Pocket entries</dt><dd>{summary.pocketTransactionCount}</dd></div><div><dt>Savings goals</dt><dd>{summary.savingsGoalCount}</dd></div><div><dt>Career records</dt><dd>{summary.careerRecordCount}</dd></div></dl><label className="restore-confirm"><input type="checkbox" checked={restoreConfirmed} onChange={(event) => setRestoreConfirmed(event.target.checked)} /><span>I understand that restoring will replace the current local finance records.</span></label><button className="primary-button restore-button" type="button" disabled={isBusy || !restoreConfirmed} onClick={restore}>{isBusy ? 'Restoring…' : 'Replace local data with this backup'}</button></section> : null}<span className="backup-status" role="status">{status}</span></div>;
}

function downloadBackup(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.style.display = 'none';
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
