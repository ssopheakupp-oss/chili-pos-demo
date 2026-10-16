import { useState } from 'react';
import { api, isDemoMode, session } from '../api.js';

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
          <p className="muted">This interactive demo saves sample orders and settings only in this browser.</p>
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
        <label>Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
        </label>
        <label>Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || !username || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
