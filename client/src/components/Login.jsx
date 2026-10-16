import { useState } from 'react';
import { api, apiConfigured, isDemoMode, session } from '../api.js';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isDemoMode) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="brand-mark big">CHILI<br />POS</div>
          <h1>Explore Chili POS</h1>
          <p className="muted">Interactive demo with sample data. Changes stay in this browser and do not reach your restaurant database.</p>
          <button className="btn primary" onClick={() => {
            const demoUser = { id: 1, name: 'Demo Manager', role: 'Admin' };
            session.save('demo', demoUser);
            onLogin(demoUser);
          }}>Enter demo</button>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await api.post('/auth/login', { username, password });
      session.save(token, user);
      onLogin(user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark big">CHILI<br />POS</div>
        <h1>Sign in to your shift</h1>
        <p className="muted">Sign in with your restaurant account.</p>
        <label>Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {!apiConfigured && <p className="form-error" role="status">Database sign-in is unavailable until the administrator configures the HTTPS POS API.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || !username || !password || !apiConfigured}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
