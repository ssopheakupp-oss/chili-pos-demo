import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, isDemoMode, session } from './api.js';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import MenuPage from './components/MenuPage.jsx';
import OrderPanel from './components/OrderPanel.jsx';
import ActiveOrders from './components/ActiveOrders.jsx';
import TablesPage from './components/TablesPage.jsx';
import ReservationPage from './components/ReservationPage.jsx';
import DeliveryPage from './components/DeliveryPage.jsx';
import AccountingPage from './components/AccountingPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';

export default function App() {
  const [user, setUser] = useState(session.user);
  const [page, setPage] = useState('menu');
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [settings, setSettings] = useState({ TaxRate: '5', Currency: '$', RestaurantName: 'Chili POS' });

  // Current order being built
  const [cart, setCart] = useState([]); // { productId, name, price, qty, isVeg }
  const [orderType, setOrderType] = useState('DineIn');
  const [tableId, setTableId] = useState(null);
  const [openOrder, setOpenOrder] = useState(null); // existing order being edited
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, tone = 'ok') => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener('pos-signed-out', out);
    return () => window.removeEventListener('pos-signed-out', out);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [t, a, s] = await Promise.all([api.get('/tables'), api.get('/orders/active'), api.get('/settings')]);
      setTables(t); setActiveOrders(a); setSettings((prev) => ({ ...prev, ...s }));
    } catch (e) { notify(e.message, 'error'); }
  }, [notify]);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const timer = setInterval(refresh, 15000); // keep tables and kitchen status fresh
    return () => clearInterval(timer);
  }, [user, refresh]);

  const taxRate = parseFloat(settings.TaxRate) || 0;
  const totals = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = (sub * taxRate) / 100;
    return { sub, tax, total: sub + tax };
  }, [cart, taxRate]);

  const addToCart = (p) => {
    const price = Number(p.Price) * (1 - (p.DiscountPct || 0) / 100);
    setCart((c) => {
      const found = c.find((i) => i.productId === p.ProductId);
      if (found) return c.map((i) => (i.productId === p.ProductId ? { ...i, qty: Math.min(99, i.qty + 1) } : i));
      return [...c, { productId: p.ProductId, name: p.Name, price: Math.round(price * 100) / 100, qty: 1, isVeg: p.IsVeg, emoji: p.Emoji }];
    });
  };
  const changeQty = (productId, delta) =>
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  const removeItem = (productId) => setCart((c) => c.filter((i) => i.productId !== productId));

  const resetOrder = () => {
    setCart([]); setOpenOrder(null); setTableId(null); setCustomer({ name: '', phone: '', address: '' });
  };

  const loadOrder = async (orderId) => {
    try {
      const o = await api.get(`/orders/${orderId}`);
      setOpenOrder(o); setOrderType(o.OrderType); setTableId(o.TableId);
      setCustomer({ name: o.CustomerName || '', phone: o.CustomerPhone || '', address: o.DeliveryAddress || '' });
      setCart(o.items.map((i) => ({ productId: i.ProductId, name: i.ProductName, price: Number(i.UnitPrice), qty: i.Quantity, isVeg: i.IsVeg, emoji: i.Emoji })));
      setPage('menu');
    } catch (e) { notify(e.message, 'error'); }
  };

  // Save = create or update the order. payWith closes it with a payment.
  const submitOrder = async (payWith) => {
    if (!cart.length) return notify('Add at least one dish first', 'error');
    if (orderType === 'DineIn' && !tableId) return notify('Choose a table for this order', 'error');
    const items = cart.map((i) => ({ productId: i.productId, qty: i.qty }));
    try {
      let order = openOrder
        ? await api.put(`/orders/${openOrder.OrderId}`, { items })
        : await api.post('/orders', {
            orderType, items, tableId: orderType === 'DineIn' ? tableId : null,
            customerName: customer.name, customerPhone: customer.phone, deliveryAddress: customer.address,
          });
      if (payWith) {
        order = await api.post(`/orders/${order.OrderId}/pay`, { paymentMethod: payWith });
        notify(`${order.OrderNo} paid by ${payWith}`);
      } else {
        notify(`${order.OrderNo} sent to the kitchen`);
      }
      resetOrder();
      refresh();
    } catch (e) { notify(e.message, 'error'); }
  };

  const cancelOrder = async () => {
    if (!openOrder || !window.confirm(`Cancel ${openOrder.OrderNo}?`)) return;
    try { await api.patch(`/orders/${openOrder.OrderId}/status`, { status: 'Cancelled' }); resetOrder(); refresh(); notify('Order cancelled'); }
    catch (e) { notify(e.message, 'error'); }
  };

  if (!user) return <Login onLogin={setUser} />;

  const showPanel = page === 'menu' || page === 'tables';
  const cur = settings.Currency || '$';

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} user={user} onLogout={() => { session.clear(); setUser(null); resetOrder(); }} />

      <main className="main">
        {isDemoMode && <div className="demo-banner">Demo mode · sample data only · changes are saved in this browser</div>}
        {page === 'menu' && (
          <>
            <MenuPage cart={cart} addToCart={addToCart} changeQty={changeQty} cur={cur} />
            <ActiveOrders orders={activeOrders} selectedId={openOrder?.OrderId} onOpen={loadOrder} />
          </>
        )}
        {page === 'tables' && (
          <TablesPage tables={tables} tableId={tableId} openOrder={loadOrder}
            pickTable={(id) => { setTableId(id); setOrderType('DineIn'); setPage('menu'); }} />
        )}
        {page === 'reservation' && <ReservationPage tables={tables} notify={notify} />}
        {page === 'delivery' && <DeliveryPage cur={cur} onOpen={loadOrder} />}
        {page === 'accounting' && <AccountingPage cur={cur} />}
        {page === 'settings' && <SettingsPage user={user} settings={settings} onSaved={refresh} notify={notify} />}
      </main>

      {showPanel && (
        <OrderPanel
          cart={cart} totals={totals} taxRate={taxRate} cur={cur}
          tables={tables} tableId={tableId} setTableId={setTableId}
          orderType={orderType} setOrderType={setOrderType}
          customer={customer} setCustomer={setCustomer}
          openOrder={openOrder} user={user}
          changeQty={changeQty} removeItem={removeItem}
          onSubmit={submitOrder} onCancel={cancelOrder} onClear={resetOrder}
        />
      )}

      {toast && <div className={`toast ${toast.tone}`} role="status">{toast.message}</div>}
    </div>
  );
}
