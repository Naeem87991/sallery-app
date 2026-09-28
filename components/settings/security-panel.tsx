'use client';

import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { useSecuritySettings } from '@/hooks/use-security-settings';
import { disablePinSecurity, removePasskeyCredential, savePasskeyCredential, savePinSecurity } from '@/lib/database/repository';
import { createLocalPasskey } from '@/lib/security/passkey';
import { createPinCredentials, verifyPin } from '@/lib/security/pin';
import { clearSecuritySession, markSecuritySessionUnlocked } from '@/lib/security/session-lock';

export function SecurityPanel({ displayName }: { displayName: string }) {
  const { settings, isLoading } = useSecuritySettings();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const hasPin = Boolean(settings?.isPinEnabled);

  const setPin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasPin && (!settings || !await verifyPin(currentPin, settings))) { setStatus('Enter your current PIN correctly before changing it.'); return; }
    if (newPin !== confirmPin) { setStatus('The new PIN and confirmation do not match.'); return; }
    setIsSaving(true); setStatus('');
    try {
      const credentials = await createPinCredentials(newPin);
      const saved = await savePinSecurity(credentials);
      markSecuritySessionUnlocked(saved);
      setCurrentPin(''); setNewPin(''); setConfirmPin(''); setStatus(hasPin ? 'PIN updated locally.' : 'PIN lock enabled locally.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save your PIN.'); }
    finally { setIsSaving(false); }
  };

  const disablePin = async () => {
    if (!settings || !await verifyPin(currentPin, settings)) { setStatus('Enter your current PIN correctly before turning off the lock.'); return; }
    if (!window.confirm('Turn off the local PIN lock? This also removes the local passkey shortcut.')) return;
    setIsSaving(true); setStatus('');
    try { const saved = await disablePinSecurity(); markSecuritySessionUnlocked(saved); setCurrentPin(''); setStatus('PIN lock removed locally.'); }
    catch { setStatus('Could not remove the PIN lock.'); }
    finally { setIsSaving(false); }
  };

  const addPasskey = async () => {
    if (!hasPin) { setStatus('Set a PIN before adding a passkey.'); return; }
    setIsSaving(true); setStatus('');
    try { const credentialId = await createLocalPasskey(displayName); const saved = await savePasskeyCredential(credentialId); markSecuritySessionUnlocked(saved); setStatus('This device can now use its passkey to unlock.'); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not add a passkey on this device.'); }
    finally { setIsSaving(false); }
  };

  const removePasskey = async () => {
    if (!settings?.passkeyCredentialId) return;
    if (!window.confirm('Remove the local passkey shortcut from this workspace?')) return;
    setIsSaving(true); setStatus('');
    try { const saved = await removePasskeyCredential(); markSecuritySessionUnlocked(saved); setStatus('Local passkey shortcut removed.'); }
    catch { setStatus('Could not remove the passkey shortcut.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <p className="security-loading">Checking local security…</p>;
  return <div className="security-panel"><div className="security-state"><span className="security-state-icon"><AppIcon name="lock" aria-hidden="true" size={19} /></span><div><strong>{hasPin ? 'PIN lock is on' : 'PIN lock is off'}</strong><small>{hasPin ? 'Financial views lock again when this browser session ends.' : 'Set a PIN to require an unlock when opening the workspace.'}</small></div>{hasPin ? <button className="secondary-button" type="button" onClick={clearSecuritySession}>Lock now</button> : null}</div><form className="security-pin-form" onSubmit={setPin}>{hasPin ? <PinField label="Current PIN" value={currentPin} onChange={setCurrentPin} autoComplete="current-password" /> : null}<PinField label={hasPin ? 'New PIN' : 'Choose a PIN'} value={newPin} onChange={setNewPin} autoComplete="new-password" /><PinField label="Confirm new PIN" value={confirmPin} onChange={setConfirmPin} autoComplete="new-password" /><p className="form-hint">Use 4–8 digits. The app saves only a PBKDF2 hash and random salt, never the PIN itself.</p><div className="security-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : hasPin ? 'Update PIN' : 'Enable PIN lock'}</button>{hasPin ? <button className="remove-button" type="button" disabled={isSaving} onClick={disablePin}>Remove PIN lock</button> : null}</div></form><div className="passkey-row"><div><strong>Local passkey shortcut</strong><small>{settings?.passkeyCredentialId ? 'Available on this browser or device.' : 'Optional. Compatible secure browsers can use their built-in device check.'}</small></div>{settings?.passkeyCredentialId ? <button className="secondary-button" type="button" disabled={isSaving} onClick={removePasskey}>Remove passkey</button> : <button className="secondary-button" type="button" disabled={isSaving || !hasPin} onClick={addPasskey}>Add passkey</button>}</div><p className="security-note">Passkeys are a local convenience check in this offline app. They are not backed by an external server, and they are not included in backups.</p><span className="security-status" role="status">{status}</span></div>;
}

function PinField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) { return <label className="field"><span>{label}</span><input autoComplete={autoComplete} inputMode="numeric" maxLength={8} pattern="[0-9]*" type="password" value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))} placeholder="••••" required /></label>; }
