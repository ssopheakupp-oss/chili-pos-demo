import { useState } from 'react';
import { api } from '../api.js';

export default function SettingsPage({ user, settings, onSaved, notify, allowPasswordChange = true }) {
  const [form, setForm] = useState({ RestaurantName: settings.RestaurantName, TaxRate: settings.TaxRate, Currency: settings.Currency });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const isAdmin = user.role === 'Admin';

  const save = async (e) => {
    e.preventDefault();
    try { await api.put('/settings', form); notify('Settings saved'); onSaved(); }
    catch (err) { notify(err.message, 'error'); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify('New passwords do not match', 'error');
      return;
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      notify('Password changed');
    } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <section className="page">
      <h1>Settings</h1>
      {!isAdmin && <p className="muted">Only an admin can change these settings.</p>}
      <form className="settings-form" onSubmit={save}>
        <label>Restaurant name
          <input className="field" disabled={!isAdmin} value={form.RestaurantName} onChange={(e) => setForm({ ...form, RestaurantName: e.target.value })} />
        </label>
        <label>Tax rate (%)
          <input className="field" type="number" min="0" max="100" step="0.01" disabled={!isAdmin} value={form.TaxRate} onChange={(e) => setForm({ ...form, TaxRate: e.target.value })} />
        </label>
        <label>Currency symbol
          <input className="field" maxLength={3} disabled={!isAdmin} value={form.Currency} onChange={(e) => setForm({ ...form, Currency: e.target.value })} />
        </label>
        {isAdmin && <button className="btn primary">Save settings</button>}
      </form>
      {allowPasswordChange && (
        <>
          <h2>Change your password</h2>
          <form className="settings-form" onSubmit={changePassword}>
            <label>Current password
              <input className="field" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
            </label>
            <label>New password (at least 12 characters)
              <input className="field" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
            </label>
            <label>Confirm new password
              <input className="field" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
            </label>
            <button className="btn primary">Change password</button>
          </form>
        </>
      )}
    </section>
  );
}
