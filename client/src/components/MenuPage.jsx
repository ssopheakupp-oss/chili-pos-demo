import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, LayoutGrid, Plus, Minus } from 'lucide-react';
import { api, money, finalPrice } from '../api.js';

export default function MenuPage({ cart, addToCart, changeQty, cur, showImages = true }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/categories').then(setCategories).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      const qs = new URLSearchParams();
      if (category) qs.set('categoryId', category);
      if (query) qs.set('q', query);
      api.get(`/products?${qs}`)
        .then((p) => {
          if (cancelled) return;
          setProducts(p);
          setError('');
        })
        .catch((e) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 200); // debounce typing
    return () => { cancelled = true; clearTimeout(t); };
  }, [category, query]);

  const total = categories.reduce((s, c) => s + c.ItemCount, 0);
  const shown = vegOnly ? products.filter((p) => p.IsVeg) : products;
  const qtyOf = (id) => cart.find((i) => i.productId === id)?.qty || 0;

  return (
    <section className="menu-page">
      <div className="topbar">
        <label className="search">
          <Search size={18} />
          <input placeholder="Search product here…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
        </label>
        <button className={`icon-btn ${vegOnly ? 'on' : ''}`} onClick={() => setVegOnly(!vegOnly)} aria-pressed={vegOnly} title="Show vegetarian only">
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="categories">
        <button className={`cat ${category === null ? 'active' : ''}`} onClick={() => setCategory(null)}>
          <span className="cat-icon"><LayoutGrid size={22} /></span>
          <b>All</b><small>{total} Items</small>
        </button>
        {categories.map((c) => (
          <button key={c.CategoryId} className={`cat ${category === c.CategoryId ? 'active' : ''}`} onClick={() => setCategory(c.CategoryId)}>
            <span className="cat-icon">{c.Emoji}</span>
            <b>{c.Name}</b><small>{c.ItemCount} Items</small>
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!error && loading && <p className="empty" role="status">Loading menu…</p>}
      {!error && !loading && !shown.length && <p className="empty">No dishes match your search. Try another name or category.</p>}

      <div className="grid" aria-busy={loading}>
        {shown.map((p) => {
          const qty = qtyOf(p.ProductId);
          return (
            <article key={p.ProductId} className={`card ${qty ? 'selected' : ''}`}>
              {showImages && (
                <div className="thumb">
                  {p.ImageUrl ? <img src={p.ImageUrl} alt="" /> : <span>{p.Emoji || '🍽️'}</span>}
                  {p.DiscountPct > 0 && <em className="badge-off">{p.DiscountPct}% Off</em>}
                </div>
              )}
              <h3>{p.Name}</h3>
              <div className="card-meta">
                <span className="price">
                  {money(finalPrice(p), cur)}
                  {p.DiscountPct > 0 && <s>{money(p.Price, cur)}</s>}
                </span>
                <span className={`diet ${p.IsVeg ? 'veg' : 'nonveg'}`}>{p.IsVeg ? 'Veg' : 'Non Veg'}</span>
              </div>
              {qty ? (
                <div className="stepper">
                  <button onClick={() => changeQty(p.ProductId, -1)} aria-label="Remove one"><Minus size={16} /></button>
                  <b>{qty}</b>
                  <button onClick={() => changeQty(p.ProductId, 1)} aria-label="Add one"><Plus size={16} /></button>
                </div>
              ) : (
                <button className="btn soft" onClick={() => addToCart(p)}>Add to Dish</button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
