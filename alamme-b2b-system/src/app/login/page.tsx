'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <form onSubmit={handleLogin} className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl">
        <h1 className="font-serif text-2xl font-bold mb-1">Alamme</h1>
        <p className="text-sm text-gray-500 mb-6">B2B &amp; Reseller System — Login Tim</p>
        <div className="field mb-3">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field mb-4">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? 'Memproses...' : 'Login'}
        </button>
        <p className="text-xs text-gray-400 mt-4">
          Akun dibuat oleh admin lewat Supabase Dashboard &gt; Authentication &gt; Add user.
        </p>
      </form>
    </div>
  );
}
