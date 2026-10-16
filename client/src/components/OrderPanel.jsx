import { useState } from 'react';
import { Pencil, Banknote, CreditCard, QrCode, Trash2, Plus, Minus } from 'lucide-react';
import { money } from '../api.js';

const TYPES = [['DineIn', 'Dine in'], ['TakeAway', 'Take Away'], ['Delivery', 'Delivery']];
const METHODS = [['Cash', 'Cash', Banknote], ['Card', 'Credit/Debit Card', CreditCard], ['QR', 'QR Code', QrCode]];

export default function OrderPanel({
  cart, totals, taxRate, cur, tables, tableId, setTableId, orderType, setOrderType,
  customer, setCustomer, openOrder, user, changeQty, removeItem, onSubmit, onCancel, onClear,
}) {
  const [method, setMethod] = useState(null);
  const table = tables.find((t) => t.TableId === tableId);
  const locked = !!openOrder; // type and table are fixed once the order exists

  const title = openOrder ? (openOrder.TableName || openOrder.OrderNo) : orderType === 'DineIn' ? (table?.TableName || 'Choose a table') : orderType === 'Delivery' ? 'Delivery order' : 'Take away order';

  return (
    <aside className="panel">
      <header className="panel-head">
        <div>
          <h2>{title}</h2>
          <small>{user.name}</small>
        </div>
        <button className="icon-btn" onClick={onClear} title="Clear this order" aria-label="Clear this order"><Pencil size={16} /></button>
      </header>

      <div className="tabs" role="tablist">
        {TYPES.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={orderType === id} disabled={locked}
            className={orderType === id ? 'active' : ''} onClick={() => setOrderType(id)}>{label}</button>
        ))}
      </div>

      {orderType === 'DineIn' && !locked && (
        <select className="field" value={tableId || ''} onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : null)} aria-label="Table">
          <option value="">Choose a table</option>
          {tables.map((t) => (
            <option key={t.TableId} value={t.TableId} disabled={t.Status === 'Occupied'}>
              {t.TableName} · {t.Seats} seats{t.Status === 'Occupied' ? ' (in use)' : ''}
            </option>
          ))}
        </select>
      )}
      {orderType !== 'DineIn' && (
        <div className="cust">
          <input className="field" placeholder="Customer name" value={customer.name} disabled={locked} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          {orderType === 'Delivery' && (
            <>
              <input className="field" placeholder="Phone" value={customer.phone} disabled={locked} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              <input className="field" placeholder="Delivery address" value={customer.address} disabled={locked} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            </>
          )}
        </div>
      )}

      <ul className="lines">
        {!cart.length && <li className="empty">No dishes yet. Tap “Add to Dish” on the menu.</li>}
        {cart.map((i) => (
          <li key={i.productId} className="line">
            <div className="line-thumb">{i.emoji || '🍽️'}</div>
            <div className="line-body">
              <b>{i.name} <span className={`dot ${i.isVeg ? 'veg' : 'nonveg'}`}>({i.isVeg ? 'Veg' : 'Non Veg'})</span></b>
              <div className="line-row">
                <span className="price">{money(i.price, cur)}</span>
                <span className="qty-mini">
                  <button onClick={() => changeQty(i.productId, -1)} aria-label="Less"><Minus size={12} /></button>
                  {i.qty}X
                  <button onClick={() => changeQty(i.productId, 1)} aria-label="More"><Plus size={12} /></button>
                </span>
                <span className="price strong">{money(i.price * i.qty, cur)}</span>
                <button className="icon-plain" onClick={() => removeItem(i.productId)} aria-label={`Remove ${i.name}`}><Trash2 size={15} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="totals">
        <div><span>Sub Total</span><span>{money(totals.sub, cur)}</span></div>
        <div><span>Tax {taxRate}%</span><span>{money(totals.tax, cur)}</span></div>
        <div className="grand"><span>Total Amount</span><span>{money(totals.total, cur)}</span></div>
      </div>

      <div className="methods">
        {METHODS.map(([id, label, Icon]) => (
          <button key={id} className={`method ${method === id ? 'active' : ''}`} onClick={() => setMethod(method === id ? null : id)} aria-pressed={method === id}>
            <Icon size={20} /><small>{label}</small>
          </button>
        ))}
      </div>

      <div className="actions">
        <button className="btn primary" disabled={!cart.length} onClick={() => { onSubmit(null); setMethod(null); }}>
          {openOrder ? 'Update Order' : 'Place Order'}
        </button>
        <button className="btn outline" disabled={!cart.length || !method} onClick={() => { onSubmit(method); setMethod(null); }}>
          {method ? `Pay ${money(totals.total, cur)} by ${method}` : 'Choose a payment method to pay'}
        </button>
        {openOrder && <button className="btn danger" onClick={onCancel}>Cancel order</button>}
      </div>
    </aside>
  );
}
