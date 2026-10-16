import { useEffect, useState } from 'react';
import { api, money } from '../api.js';

export default function AccountingPage({ cur }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [s, setS] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([api.get(`/reports/summary?date=${date}`), api.get(`/orders?date=${date}`)])
      .then(([sum, list]) => { setS(sum); setOrders(list); })
      .catch((e) => setError(e.message));
  }, [date]);

  return (
    <section className="page">
      <div className="page-head">
        <h1>Accounting</h1>
        <input className="field narrow-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Report date" />
      </div>
      {error && <p className="form-error">{error}</p>}
      {s && (
        <>
          <div className="stats">
            <div className="stat"><small>Revenue</small><b>{money(s.Revenue, cur)}</b></div>
            <div className="stat"><small>Paid orders</small><b>{s.Orders}</b></div>
            <div className="stat"><small>Tax collected</small><b>{money(s.Tax, cur)}</b></div>
            <div className="stat"><small>Average order</small><b>{money(s.AvgOrder, cur)}</b></div>
          </div>
          <div className="two-col">
            <div className="box">
              <h3>By payment method</h3>
              {!s.byMethod.length && <p className="muted">No payments on this day.</p>}
              {s.byMethod.map((m) => <div className="kv" key={m.PaymentMethod}><span>{m.PaymentMethod} · {m.Orders} orders</span><b>{money(m.Revenue, cur)}</b></div>)}
            </div>
            <div className="box">
              <h3>Best sellers</h3>
              {!s.top.length && <p className="muted">No sales on this day.</p>}
              {s.top.map((t) => <div className="kv" key={t.ProductName}><span>{t.ProductName}</span><b>{t.Qty} sold</b></div>)}
            </div>
          </div>
        </>
      )}
      <table className="data">
        <thead><tr><th>Order</th><th>Type</th><th>Table</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {!orders.length && <tr><td colSpan="6" className="empty">No orders on this day.</td></tr>}
          {orders.map((o) => (
            <tr key={o.OrderId}>
              <td>{o.OrderNo}</td><td>{o.OrderType}</td><td>{o.TableName || '—'}</td>
              <td>{o.PaymentMethod || '—'}</td><td>{money(o.Total, cur)}</td>
              <td><span className={`pill ${o.Status}`}>{o.Status === 'InKitchen' ? 'Process' : o.Status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
