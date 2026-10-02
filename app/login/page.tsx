'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AppIcon } from '@/components/ui/app-icon';

type Mode = 'signin' | 'signup';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(nextPath);
    });
  }, [nextPath, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const supabase = createClient();
    if (mode === 'signin') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : authError.message);
      } else {
        router.replace(nextPath);
        router.refresh();
      }
    } else {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message.includes('already registered')
          ? 'An account with this email already exists. Sign in instead.'
          : authError.message);
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('signin');
        setPassword('');
      }
    }
    setLoading(false);
  }

  return (
    <div className="app-shell" style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(182,255,69,.12)', border: '1px solid rgba(182,255,69,.3)', marginBottom: '16px' }}>
            <AppIcon name="dollar" size={26} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: '22px', letterSpacing: '-0.04em', margin: '0 0 6px' }}>Live Salary Ticker</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        <div className="wizard-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '4px', borderRadius: '12px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--line)' }}>
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button key={m} type="button"
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                style={{ flex: 1, padding: '8px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: '.15s ease', background: mode === m ? 'var(--accent)' : 'transparent', color: mode === m ? '#10200d' : 'var(--muted)' }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'grid', gap: '14px' }}>
              <label className="field">
                <span>Email address</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required disabled={loading} />
              </label>
              <label className="field">
                <span>Password{mode === 'signup' && <em style={{ marginLeft: '6px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>min 6 characters</em>}</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'Choose a strong password' : 'Your password'} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={6} required disabled={loading} />
              </label>
            </div>
            {error && <div className="form-error" role="alert" style={{ marginTop: '16px', marginBottom: 0 }}>{error}</div>}
            {success && <div style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '11px', background: 'rgba(145,231,103,.1)', border: '1px solid rgba(145,231,103,.3)', color: '#bdff9c', fontSize: '11px', lineHeight: 1.5 }} role="status">{success}</div>}
            <button type="submit" className="primary-button" disabled={loading} style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}>
              {loading ? (mode === 'signin' ? 'Signing in…' : 'Creating account…') : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--muted)', fontSize: '11px', lineHeight: 1.5 }}>
          Your financial data is private and encrypted.<br />Only you can access your workspace.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Loading…</span>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
