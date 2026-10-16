import { useState } from 'react';
import { api } from '../api.js';

export default function SettingsPage({ user, settings, onSaved, notify }) {
  const [form, setForm] = useState({ RestaurantName: settings.RestaurantName, TaxRate: settings.TaxRate, Currency: settings.Currency });
  const isAdmin = user.role === 'Admin';

  const save = async (e) => {
    e.preventDefault();
    try { await api.put('/settings', form); notify('Settings saved'); onSaved(); }
    catch (err) { notify(err.message, 'error'); }
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
    </section>
  );
}
