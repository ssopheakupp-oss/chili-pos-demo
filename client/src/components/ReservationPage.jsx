import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const blank = { tableId: '', customerName: '', phone: '', guests: 2, reservedFor: '', notes: '' };

export default function ReservationPage({ tables, notify }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const load = useCallback(() => api.get('/reservations').then(setList).catch((e) => notify(e.message, 'error')), [notify]);
  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', { ...form, tableId: Number(form.tableId), guests: Number(form.guests) });
      setForm(blank); notify('Reservation saved'); load();
    } catch (err) { notify(err.message, 'error'); }
  };
  const setStatus = async (id, status) => {
    try { await api.patch(`/reservations/${id}/status`, { status }); load(); } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <section className="page">
      <h1>Reservation</h1>
      <form className="form-row" onSubmit={save}>
        <select className="field" required value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} aria-label="Table">
          <option value="">Table</option>
          {tables.map((t) => <option key={t.TableId} value={t.TableId}>{t.TableName} ({t.Seats})</option>)}
        </select>
        <input className="field" required placeholder="Guest name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className="field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="field narrow" type="number" min="1" max="20" value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} aria-label="Guests" />
        <input className="field" required type="datetime-local" value={form.reservedFor} onChange={(e) => setForm({ ...form, reservedFor: e.target.value })} />
        <button className="btn primary">Save reservation</button>
      </form>

      <table className="data">
        <thead><tr><th>When</th><th>Guest</th><th>Table</th><th>Guests</th><th>Status</th><th /></tr></thead>
        <tbody>
          {!list.length && <tr><td colSpan="6" className="empty">No upcoming reservations.</td></tr>}
          {list.map((r) => (
            <tr key={r.ReservationId}>
              <td>{new Date(r.ReservedFor).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
              <td>{r.CustomerName}<br /><small>{r.Phone}</small></td>
              <td>{r.TableName}</td><td>{r.Guests}</td>
              <td><span className={`pill ${r.Status}`}>{r.Status}</span></td>
              <td className="row-actions">
                {r.Status === 'Booked' && (<>
                  <button className="btn soft sm" onClick={() => setStatus(r.ReservationId, 'Seated')}>Seat</button>
                  <button className="btn soft sm" onClick={() => setStatus(r.ReservationId, 'Cancelled')}>Cancel</button>
                </>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
