import { useEffect, useState } from 'react';
import { api, money } from '../api.js';

export default function DeliveryPage({ cur, onOpen }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    api.get(`/orders?type=Delivery&date=${today}`).then(setOrders).catch((e) => setError(e.message));
  }, []);

  return (
    <section className="page">
      <h1>Delivery</h1>
      {error && <p className="form-error">{error}</p>}
      <table className="data">
        <thead><tr><th>Order</th><th>Customer</th><th>Address</th><th>Total</th><th>Status</th><th /></tr></thead>
        <tbody>
          {!orders.length && <tr><td colSpan="6" className="empty">No delivery orders today. Choose “Delivery” in the order panel to create one.</td></tr>}
          {orders.map((o) => (
            <tr key={o.OrderId}>
              <td>{o.OrderNo}</td>
              <td>{o.CustomerName || '—'}<br /><small>{o.CustomerPhone}</small></td>
              <td>{o.DeliveryAddress}</td>
              <td>{money(o.Total, cur)}</td>
              <td><span className={`pill ${o.Status}`}>{o.Status === 'InKitchen' ? 'Process' : o.Status}</span></td>
              <td>{['InKitchen', 'Served'].includes(o.Status) && <button className="btn soft sm" onClick={() => onOpen(o.OrderId)}>Open</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
