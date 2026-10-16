export default function TablesPage({ tables, pickTable, openOrder }) {
  return (
    <section className="page">
      <h1>Table Services</h1>
      <p className="muted">Pick a free table to start an order, or open a busy table to add dishes or take payment.</p>
      <div className="table-grid">
        {tables.map((t) => (
          <button key={t.TableId} className={`table-card ${t.Status}`}
            onClick={() => (t.ActiveOrderId ? openOrder(t.ActiveOrderId) : pickTable(t.TableId))}>
            <b>{t.TableName}</b>
            <span>{t.Seats} seats</span>
            <em className={`pill ${t.Status}`}>{t.Status === 'Occupied' ? 'In use' : t.Status === 'Reserved' ? 'Reserved' : 'Free'}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
