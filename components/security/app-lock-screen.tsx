'use client';

import { useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { verifyLocalPasskey } from '@/lib/security/passkey';
import { verifyPin } from '@/lib/security/pin';
import { markSecuritySessionUnlocked } from '@/lib/security/session-lock';
import type { SecuritySettings } from '@/types/domain';

export function AppLockScreen({ securitySettings }: { securitySettings: SecuritySettings }) {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const unlockWithPin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setIsUnlocking(true); setStatus('');
    try {
      if (!await verifyPin(pin, securitySettings)) { setStatus('That PIN did not unlock this workspace.'); return; }
      markSecuritySessionUnlocked(securitySettings);
    } catch { setStatus('The PIN could not be checked on this device.'); }
    finally { setIsUnlocking(false); }
  };

  const unlockWithPasskey = async () => {
    if (!securitySettings.passkeyCredentialId) return;
    setIsUnlocking(true); setStatus('');
    try {
      if (!await verifyLocalPasskey(securitySettings.passkeyCredentialId)) { setStatus('The passkey check was cancelled or could not unlock this workspace.'); return; }
      markSecuritySessionUnlocked(securitySettings);
    } finally { setIsUnlocking(false); }
  };

  return <main className="app-lock-screen"><section className="app-lock-card"><span className="app-lock-icon"><AppIcon name="lock" aria-hidden="true" size={25} /></span><p className="eyebrow">LOCAL APP LOCK</p><h1>Your workspace is locked.</h1><p>Enter your PIN to view financial records stored on this device.</p><form onSubmit={unlockWithPin}><label className="field"><span>PIN</span><input autoFocus autoComplete="current-password" inputMode="numeric" maxLength={8} pattern="[0-9]*" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="••••" required /></label><button className="primary-button" type="submit" disabled={isUnlocking}>{isUnlocking ? 'Checking…' : 'Unlock workspace'} <AppIcon name="arrow-right" aria-hidden="true" size={17} /></button></form>{securitySettings.passkeyCredentialId ? <button className="secondary-button lock-passkey-button" type="button" disabled={isUnlocking} onClick={unlockWithPasskey}>Use this device&apos;s passkey</button> : null}<span className="app-lock-status" role="status">{status}</span><small>PIN verification happens locally. No financial data is sent anywhere.</small></section></main>;
}
