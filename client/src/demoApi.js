const STORAGE_KEY = 'chili-pos-demo-data-v1';

const categories = [
  { CategoryId: 1, Name: 'Starters', Emoji: '🥗', SortOrder: 1 },
  { CategoryId: 2, Name: 'Mains', Emoji: '🍛', SortOrder: 2 },
  { CategoryId: 3, Name: 'Noodles', Emoji: '🍜', SortOrder: 3 },
  { CategoryId: 4, Name: 'Drinks', Emoji: '🥤', SortOrder: 4 },
];

const products = [
  { ProductId: 1, CategoryId: 1, CategoryName: 'Starters', Name: 'Fresh Garden Salad', Price: 6.5, IsVeg: true, DiscountPct: 0, Emoji: '🥗' },
  { ProductId: 2, CategoryId: 1, CategoryName: 'Starters', Name: 'Crispy Spring Rolls', Price: 5.5, IsVeg: true, DiscountPct: 10, Emoji: '🥟' },
  { ProductId: 3, CategoryId: 1, CategoryName: 'Starters', Name: 'Chicken Satay', Price: 8, IsVeg: false, DiscountPct: 0, Emoji: '🍢' },
  { ProductId: 4, CategoryId: 2, CategoryName: 'Mains', Name: 'Basil Chicken Rice', Price: 12.5, IsVeg: false, DiscountPct: 0, Emoji: '🍚' },
  { ProductId: 5, CategoryId: 2, CategoryName: 'Mains', Name: 'Khmer Red Curry', Price: 14, IsVeg: false, DiscountPct: 0, Emoji: '🍛' },
  { ProductId: 6, CategoryId: 2, CategoryName: 'Mains', Name: 'Vegetable Green Curry', Price: 12, IsVeg: true, DiscountPct: 0, Emoji: '🥘' },
  { ProductId: 7, CategoryId: 2, CategoryName: 'Mains', Name: 'Grilled River Fish', Price: 16, IsVeg: false, DiscountPct: 5, Emoji: '🐟' },
  { ProductId: 8, CategoryId: 3, CategoryName: 'Noodles', Name: 'Phnom Penh Noodles', Price: 10.5, IsVeg: false, DiscountPct: 0, Emoji: '🍜' },
  { ProductId: 9, CategoryId: 3, CategoryName: 'Noodles', Name: 'Vegetable Pad Thai', Price: 11, IsVeg: true, DiscountPct: 0, Emoji: '🍝' },
  { ProductId: 10, CategoryId: 3, CategoryName: 'Noodles', Name: 'Beef Lok Lak Noodles', Price: 13.5, IsVeg: false, DiscountPct: 0, Emoji: '🥢' },
  { ProductId: 11, CategoryId: 4, CategoryName: 'Drinks', Name: 'Fresh Lime Soda', Price: 3.5, IsVeg: true, DiscountPct: 0, Emoji: '🍋' },
  { ProductId: 12, CategoryId: 4, CategoryName: 'Drinks', Name: 'Iced Cambodian Coffee', Price: 4, IsVeg: true, DiscountPct: 0, Emoji: '☕' },
  { ProductId: 13, CategoryId: 4, CategoryName: 'Drinks', Name: 'Mango Smoothie', Price: 5, IsVeg: true, DiscountPct: 0, Emoji: '🥭' },
  { ProductId: 14, CategoryId: 4, CategoryName: 'Drinks', Name: 'Bottled Water', Price: 1.5, IsVeg: true, DiscountPct: 0, Emoji: '💧' },
];

const tables = [
  { TableId: 1, TableName: 'T01', Seats: 2, Status: 'Available' },
  { TableId: 2, TableName: 'T02', Seats: 4, Status: 'Available' },
  { TableId: 3, TableName: 'T03', Seats: 4, Status: 'Available' },
  { TableId: 4, TableName: 'T04', Seats: 6, Status: 'Available' },
  { TableId: 5, TableName: 'T05', Seats: 2, Status: 'Reserved' },
  { TableId: 6, TableName: 'T06', Seats: 4, Status: 'Available' },
  { TableId: 7, TableName: 'T07', Seats: 6, Status: 'Available' },
  { TableId: 8, TableName: 'T08', Seats: 2, Status: 'Available' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const priceItems = (items) => {
  if (!Array.isArray(items) || !items.length) throw new Error('Add at least one item to the order');
  return items.map((item) => {
    const product = products.find((entry) => entry.ProductId === Number(item.productId));
    const qty = Number(item.qty);
    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error('One of the items is no longer available');
    }
    return {
      ProductId: product.ProductId,
      ProductName: product.Name,
      UnitPrice: round2(product.Price * (1 - product.DiscountPct / 100)),
      Quantity: qty,
      IsVeg: product.IsVeg,
      Emoji: product.Emoji,
      Note: item.note || null,
    };
  });
};

function applyTotals(order, items, taxRate) {
  const sub = round2(items.reduce((total, item) => total + item.UnitPrice * item.Quantity, 0));
  const tax = round2((sub * Number(taxRate)) / 100);
  return { ...order, items, SubTotal: sub, TaxRate: Number(taxRate), TaxAmount: tax, Total: round2(sub + tax) };
}

function makeDate(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function initialData() {
  const data = {
    settings: { RestaurantName: 'Chili Garden', TaxRate: '5', Currency: '$' },
    tables: clone(tables),
    reservations: [
      {
        ReservationId: 1, TableId: 5, TableName: 'T05', CustomerName: 'Sokha Chan',
        Phone: '012 345 678', Guests: 2, ReservedFor: makeDate(3), Notes: 'Window seat', Status: 'Booked',
      },
    ],
    orders: [],
    nextOrderId: 1005,
    nextReservationId: 2,
  };
  const createSample = (details, itemIds, quantities, createdHoursAgo, paymentMethod) => {
    const items = priceItems(itemIds.map((productId, index) => ({ productId, qty: quantities[index] })));
    const order = applyTotals({
      OrderId: details.OrderId,
      OrderNo: `CH-${details.OrderId}`,
      OrderType: details.OrderType,
      TrafficSource: details.TrafficSource || details.OrderType,
      Status: details.Status,
      TableId: details.TableId || null,
      TableName: data.tables.find((table) => table.TableId === details.TableId)?.TableName || null,
      CustomerName: details.CustomerName || null,
      CustomerPhone: details.CustomerPhone || null,
      DeliveryAddress: details.DeliveryAddress || null,
      PaymentMethod: paymentMethod || null,
      CreatedAt: makeDate(-createdHoursAgo),
      PaidAt: paymentMethod ? makeDate(-createdHoursAgo) : null,
    }, items, data.settings.TaxRate);
    data.orders.push(order);
  };

  createSample({ OrderId: 1001, OrderType: 'DineIn', TableId: 2, Status: 'InKitchen' }, [4, 8, 11], [2, 1, 2], 0.35);
  createSample({ OrderId: 1002, OrderType: 'TakeAway', Status: 'Paid', CustomerName: 'Dara Vann' }, [2, 5, 12], [1, 1, 2], 1.2, 'Cash');
  createSample({
    OrderId: 1003, OrderType: 'Delivery', Status: 'InKitchen', CustomerName: 'Lina Sok',
    CustomerPhone: '098 765 432', DeliveryAddress: '21 Street 240, Phnom Penh',
  }, [5, 13], [1, 2], 0.15);
  createSample({ OrderId: 1004, OrderType: 'DineIn', TableId: 6, Status: 'Paid' }, [3, 7], [1, 1], 2.1, 'Card');
  return data;
}

function readData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const data = initialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  try {
    const data = JSON.parse(stored);
    let changed = false;
    for (const order of data.orders) {
      if (!order.TrafficSource) {
        order.TrafficSource = order.OrderType;
        changed = true;
      }
    }
    if (changed) writeData(data);
    return data;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return readData();
  }
}

function writeData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function orderById(data, id) {
  const order = data.orders.find((entry) => entry.OrderId === Number(id));
  if (!order) throw new Error('Order not found');
  return order;
}

function activeOrders(data) {
  return data.orders.filter((order) => ['InKitchen', 'Served'].includes(order.Status));
}

function listOrders(data, query) {
  return data.orders.filter((order) =>
    (!query.get('date') || dateKey(order.CreatedAt) === query.get('date')) &&
    (!query.get('type') || order.OrderType === query.get('type')))
    .sort((a, b) => b.CreatedAt.localeCompare(a.CreatedAt));
}

function makeOrder(data, body) {
  const { orderType = 'DineIn', tableId, customerName, customerPhone, deliveryAddress } = body || {};
  const trafficSource = body?.trafficSource || orderType;
  if (!['DineIn', 'TakeAway', 'Delivery'].includes(orderType)) throw new Error('Invalid order type');
  if (!['DineIn', 'TakeAway', 'Delivery', 'Phone', 'Referral', 'SocialMedia', 'Other'].includes(trafficSource)) {
    throw new Error('Invalid traffic source');
  }
  if (orderType === 'DineIn' && !tableId) throw new Error('Choose a table for dine-in orders');
  if (orderType === 'Delivery' && (!deliveryAddress || !customerPhone)) {
    throw new Error('Delivery needs a phone number and address');
  }
  if (orderType === 'DineIn' && activeOrders(data).some((order) => order.TableId === Number(tableId))) {
    throw new Error('This table already has an open order. Open it from the bottom bar');
  }
  const id = data.nextOrderId++;
  const table = data.tables.find((entry) => entry.TableId === Number(tableId));
  const order = applyTotals({
    OrderId: id,
    OrderNo: `DEMO-${String(id).padStart(4, '0')}`,
    OrderType: orderType,
    TrafficSource: trafficSource,
    Status: 'InKitchen',
    TableId: orderType === 'DineIn' ? Number(tableId) : null,
    TableName: orderType === 'DineIn' ? table?.TableName || null : null,
    CustomerName: customerName || null,
    CustomerPhone: customerPhone || null,
    DeliveryAddress: deliveryAddress || null,
    PaymentMethod: null,
    CreatedAt: new Date().toISOString(),
    PaidAt: null,
  }, priceItems(body.items), data.settings.TaxRate);
  data.orders.unshift(order);
  return order;
}

function reportSummary(data, date) {
  const paid = data.orders.filter((order) => order.Status === 'Paid' && dateKey(order.PaidAt || order.CreatedAt) === date);
  const byMethod = Object.values(paid.reduce((groups, order) => {
    const key = order.PaymentMethod || 'Other';
    const group = groups[key] || (groups[key] = { PaymentMethod: key, Orders: 0, Revenue: 0 });
    group.Orders += 1;
    group.Revenue += order.Total;
    return groups;
  }, {})).map((group) => ({ ...group, Revenue: round2(group.Revenue) }));
  const byTrafficSource = Object.values(paid.reduce((groups, order) => {
    const key = order.TrafficSource || order.OrderType;
    const group = groups[key] || (groups[key] = { TrafficSource: key, Orders: 0, Revenue: 0 });
    group.Orders += 1;
    group.Revenue += order.Total;
    return groups;
  }, {})).map((group) => ({ ...group, Revenue: round2(group.Revenue) }))
    .sort((a, b) => b.Revenue - a.Revenue);
  const items = paid.flatMap((order) => order.items);
  const bestSellers = Object.values(items.reduce((groups, item) => {
    const group = groups[item.ProductName] || (groups[item.ProductName] = { ProductName: item.ProductName, Qty: 0, Revenue: 0 });
    group.Qty += item.Quantity;
    group.Revenue += item.Quantity * item.UnitPrice;
    return groups;
  }, {})).sort((a, b) => b.Qty - a.Qty).slice(0, 5);
  const revenue = round2(paid.reduce((sum, order) => sum + order.Total, 0));
  return {
    Orders: paid.length,
    Revenue: revenue,
    Tax: round2(paid.reduce((sum, order) => sum + order.TaxAmount, 0)),
    AvgOrder: paid.length ? round2(revenue / paid.length) : 0,
    byMethod,
    byType: [],
    byTrafficSource,
    top: bestSellers,
  };
}

export async function demoRequest(method, path, body) {
  const [pathname, search = ''] = path.split('?');
  const query = new URLSearchParams(search);
  const data = readData();
  let result;

  if (method === 'GET' && pathname === '/categories') {
    result = categories.map((category) => ({
      ...category,
      ItemCount: products.filter((product) => product.CategoryId === category.CategoryId).length,
    }));
  } else if (method === 'GET' && pathname === '/products') {
    result = products.filter((product) =>
      (!query.get('categoryId') || product.CategoryId === Number(query.get('categoryId'))) &&
      (!query.get('q') || product.Name.toLowerCase().includes(query.get('q').toLowerCase())));
  } else if (method === 'GET' && pathname === '/tables') {
    result = data.tables.map((table) => {
      const order = activeOrders(data).find((entry) => entry.TableId === table.TableId);
      return {
        ...table,
        Status: order ? 'Occupied' : table.Status,
        ActiveOrderId: order?.OrderId || null,
        ActiveTotal: order?.Total || null,
      };
    });
  } else if (method === 'GET' && pathname === '/settings') {
    result = data.settings;
  } else if (method === 'PUT' && pathname === '/settings') {
    data.settings = { ...data.settings, ...body };
    writeData(data);
    result = data.settings;
  } else if (method === 'GET' && pathname === '/orders/active') {
    result = activeOrders(data).map((order) => ({
      ...order,
      ItemCount: order.items.reduce((sum, item) => sum + item.Quantity, 0),
    }));
  } else if (method === 'GET' && pathname === '/orders') {
    result = listOrders(data, query);
  } else if (method === 'POST' && pathname === '/orders') {
    result = makeOrder(data, body);
    writeData(data);
  } else if (method === 'GET' && pathname === '/reservations') {
    result = [...data.reservations].sort((a, b) => a.ReservedFor.localeCompare(b.ReservedFor));
  } else if (method === 'POST' && pathname === '/reservations') {
    const { tableId, customerName, phone, guests = 2, reservedFor, notes } = body || {};
    if (!tableId || !customerName || !reservedFor) throw new Error('Table, guest name and time are required');
    const time = new Date(reservedFor).getTime();
    const hasConflict = data.reservations.some((reservation) =>
      reservation.TableId === Number(tableId) && reservation.Status === 'Booked' &&
      Math.abs(new Date(reservation.ReservedFor).getTime() - time) < 90 * 60 * 1000);
    if (hasConflict) throw new Error('That table is already booked within 90 minutes of this time');
    const table = data.tables.find((entry) => entry.TableId === Number(tableId));
    result = {
      ReservationId: data.nextReservationId++,
      TableId: Number(tableId),
      TableName: table?.TableName || '',
      CustomerName: customerName,
      Phone: phone || null,
      Guests: Number(guests),
      ReservedFor: new Date(reservedFor).toISOString(),
      Notes: notes || null,
      Status: 'Booked',
    };
    data.reservations.push(result);
    writeData(data);
  } else {
    const reservationStatus = pathname.match(/^\/reservations\/(\d+)\/status$/);
    const orderPay = pathname.match(/^\/orders\/(\d+)\/pay$/);
    const orderStatus = pathname.match(/^\/orders\/(\d+)\/status$/);
    const orderId = pathname.match(/^\/orders\/(\d+)$/);

    if (method === 'PATCH' && reservationStatus) {
      const reservation = data.reservations.find((entry) => entry.ReservationId === Number(reservationStatus[1]));
      if (!reservation) throw new Error('Reservation not found');
      if (!['Booked', 'Seated', 'Cancelled', 'NoShow'].includes(body?.status)) throw new Error('Invalid reservation status');
      reservation.Status = body.status;
      writeData(data);
      result = { ok: true };
    } else if (method === 'POST' && orderPay) {
      const order = orderById(data, orderPay[1]);
      if (!['Cash', 'Card', 'QR'].includes(body?.paymentMethod)) throw new Error('Choose Cash, Card or QR');
      if (!['InKitchen', 'Served'].includes(order.Status)) throw new Error('This order is already closed');
      order.Status = 'Paid';
      order.PaymentMethod = body.paymentMethod;
      order.PaidAt = new Date().toISOString();
      writeData(data);
      result = order;
    } else if (method === 'PATCH' && orderStatus) {
      const order = orderById(data, orderStatus[1]);
      if (!['InKitchen', 'Served', 'Cancelled'].includes(body?.status)) throw new Error('Invalid status');
      if (!['InKitchen', 'Served'].includes(order.Status)) throw new Error('This order is already closed');
      order.Status = body.status;
      writeData(data);
      result = order;
    } else if (method === 'GET' && orderId) {
      result = orderById(data, orderId[1]);
    } else if (method === 'PUT' && orderId) {
      const order = orderById(data, orderId[1]);
      if (!['InKitchen', 'Served'].includes(order.Status)) throw new Error('This order is closed and cannot be changed');
      const updated = applyTotals(order, priceItems(body?.items), data.settings.TaxRate);
      Object.assign(order, updated, { UpdatedAt: new Date().toISOString() });
      writeData(data);
      result = order;
    } else if (method === 'GET' && pathname === '/reports/summary') {
      result = reportSummary(data, query.get('date') || dateKey(new Date()));
    } else {
      throw new Error(`Demo API does not support ${method} ${pathname}`);
    }
  }

  return clone(result);
}
