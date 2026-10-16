const STATUS = { InKitchen: 'Process', Served: 'Served' };

export default function ActiveOrders({ orders, selectedId, onOpen }) {
  return (
    <div className="active-orders" aria-label="Open orders">
      {!orders.length && <p className="muted">No open orders. Orders you send to the kitchen appear here.</p>}
      {orders.map((o) => (
        <button key={o.OrderId} className={`order-chip ${selectedId === o.OrderId ? 'active' : ''}`} onClick={() => onOpen(o.OrderId)}>
          <span className="chip-code">{o.TableName ? `T${o.TableName.replace(/\D/g, '')}` : o.OrderType === 'Delivery' ? 'DL' : 'TA'}</span>
          <span className="chip-body">
            <b>{o.CustomerName || o.TableName || o.OrderNo}</b>
            <small>{o.ItemCount} items → Kitchen</small>
          </span>
          <span className={`pill ${o.Status}`}>{STATUS[o.Status]}</span>
        </button>
      ))}
    </div>
  );
}
