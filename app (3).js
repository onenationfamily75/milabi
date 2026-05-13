
const WHATSAPP_NUMBER = '254737473583';
const WHATSAPP_DISPLAY = '0737473583';
const STORE_NAME = 'Milabi Global';
const CURRENCY = 'KES';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmt = n => CURRENCY + ' ' + Number(n).toLocaleString('en-KE', {minimumFractionDigits:2, maximumFractionDigits:2});
const qs = name => new URLSearchParams(location.search).get(name);

const Cart = {
  KEY: 'milabi_cart_v1',
  read(){ try{ return JSON.parse(localStorage.getItem(this.KEY)||'[]'); }catch(e){ return []; } },
  write(items){ localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },
  count(){ return this.read().reduce((s,i)=>s+(i.qty||1),0); },
  total(){ return this.read().reduce((s,i)=>s+(Number(i.price)||0)*(i.qty||1),0); },
  add(item, qty=1){
    const items = this.read();
    const ex = items.find(i => i.slug === item.slug);
    if(ex){ ex.qty = (ex.qty||1) + qty; }
    else { items.push({...item, qty}); }
    this.write(items);
  },
  remove(slug){ this.write(this.read().filter(i => i.slug !== slug)); },
  setQty(slug, qty){
    const items = this.read();
    const it = items.find(i => i.slug === slug);
    if(it){ it.qty = Math.max(1, qty|0); }
    this.write(items);
  },
  clear(){ this.write([]); },
  updateBadge(){
    const b = document.getElementById('cart-badge');
    if(b) b.textContent = this.count();
  }
};

function waUrl(text){
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
}

function waBuyNow(p, qty=1){
  const lines = [
    'Hello ' + STORE_NAME + ',',
    '',
    'I would like to *Buy Now*:',
    '',
    '• ' + p.name + ' (x' + qty + ') — ' + fmt((p.price||0) * qty),
    '',
    'Product link: ' + (p.permalink || location.href),
    '',
    'Please confirm availability and delivery details. Thank you!'
  ];
  return waUrl(lines.join('\n'));
}

function waCartConfirm(items){
  if(!items.length) return waUrl('Hello ' + STORE_NAME + ', I would like to place an order.');
  const lines = ['Hello ' + STORE_NAME + ',', '', 'I would like to *confirm my order*:', ''];
  let total = 0;
  items.forEach((i, idx) => {
    const sub = (Number(i.price)||0) * (i.qty||1);
    total += sub;
    lines.push((idx+1) + '. ' + i.name + ' (x' + (i.qty||1) + ') — ' + fmt(sub));
  });
  lines.push('', '*Total:* ' + fmt(total), '', 'Please confirm availability and delivery details. Thank you!');
  return waUrl(lines.join('\n'));
}

function toast(msg){
  let t = document.getElementById('toast');
  if(!t){ t = document.createElement('div'); t.id='toast'; t.className='toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(()=>t.classList.remove('show'), 1800);
}

let CATALOG = null;
async function loadCatalog(){
  if(CATALOG) return CATALOG;
  const r = await fetch('catalog.json', {cache:'no-cache'});
  CATALOG = await r.json();
  return CATALOG;
}

function discountPct(price, oldPrice){
  if(!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price/oldPrice) * 100);
}

function productCard(p){
  const off = discountPct(p.price, p.old_price);
  return `
    <article class="prod-card">
      <a href="product.html?slug=${encodeURIComponent(p.slug)}" class="prod-thumb">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : '🛍️'}
      </a>
      <div class="prod-body">
        ${off ? `<span class="badge-discount">-${off}%</span>` : ''}
        <h3 class="prod-name"><a href="product.html?slug=${encodeURIComponent(p.slug)}">${p.name}</a></h3>
        <div class="price">
          <span class="now">${fmt(p.price)}</span>
          ${p.old_price ? `<span class="was">${fmt(p.old_price)}</span>` : ''}
        </div>
        <div class="prod-actions">
          <button class="btn btn-primary js-add" data-slug="${p.slug}">Add to Cart</button>
          <a class="btn btn-wa" href="${waBuyNow(p)}" target="_blank" rel="noopener">Buy Now</a>
        </div>
      </div>
    </article>
  `;
}

function categoryCard(c){
  return `
    <a class="cat-card" href="category.html?slug=${encodeURIComponent(c.slug)}">
      <div class="emoji">${c.emoji||'🛒'}</div>
      <div class="name">${c.name}</div>
      <div class="count">${c.count||0} products</div>
    </a>
  `;
}

function bindAddButtons(scope=document){
  $$('.js-add', scope).forEach(b => {
    b.addEventListener('click', async () => {
      const c = await loadCatalog();
      const p = c.products.find(x => x.slug === b.dataset.slug);
      if(!p) return;
      Cart.add({slug:p.slug, name:p.name, price:p.price, image:p.image}, 1);
      toast('Added to cart — open cart to confirm on WhatsApp');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
  const route = document.body.dataset.page;

  if(route === 'home'){
    loadCatalog().then(c => {
      const cats = c.categories.map(cat => {
        cat.count = c.products.filter(p => p.category === cat.slug).length;
        return cat;
      });
      $('#cat-grid').innerHTML = cats.map(categoryCard).join('');
      const featured = c.products.slice(0, 12);
      $('#featured-grid').innerHTML = featured.map(productCard).join('') || '<p class="empty">No products yet. Add some in catalog.json.</p>';
      bindAddButtons();
    });
  }

  if(route === 'categories'){
    loadCatalog().then(c => {
      const cats = c.categories.map(cat => {
        cat.count = c.products.filter(p => p.category === cat.slug).length;
        return cat;
      });
      $('#cat-grid').innerHTML = cats.map(categoryCard).join('');
    });
  }

  if(route === 'category'){
    const slug = qs('slug');
    loadCatalog().then(c => {
      const cat = c.categories.find(x => x.slug === slug);
      const items = c.products.filter(p => p.category === slug);
      $('#cat-title').textContent = cat ? cat.name : 'Category';
      $('#cat-count').textContent = items.length + ' product' + (items.length===1?'':'s');
      $('#prod-grid').innerHTML = items.map(productCard).join('') || '<p class="empty">No products in this category yet.</p>';
      bindAddButtons();
    });
  }

  if(route === 'product'){
    const slug = qs('slug');
    loadCatalog().then(c => {
      const p = c.products.find(x => x.slug === slug);
      if(!p){ $('#product').innerHTML = '<p class="empty">Product not found.</p>'; return; }
      const off = discountPct(p.price, p.old_price);
      $('#product').innerHTML = `
        <div class="gallery">${p.image ? `<img src="${p.image}" alt="${p.name}">` : '🛍️'}</div>
        <div>
          ${off ? `<span class="badge-discount">-${off}%</span>` : ''}
          <h1>${p.name}</h1>
          <div class="price">
            <span class="now">${fmt(p.price)}</span>
            ${p.old_price ? `<span class="was">${fmt(p.old_price)}</span>` : ''}
          </div>
          <p class="desc">${p.description || 'Contact us on WhatsApp ' + WHATSAPP_DISPLAY + ' for full product details, sizes, and colour options.'}</p>
          <div class="qty-row">
            <button class="qty-btn" id="qm">−</button>
            <input class="qty-input" id="qty" type="number" value="1" min="1">
            <button class="qty-btn" id="qp">+</button>
          </div>
          <div class="cta-row">
            <button class="btn btn-primary" id="add-btn">Add to Cart</button>
            <a class="btn btn-wa" id="buy-btn" target="_blank" rel="noopener">Buy Now on WhatsApp</a>
          </div>
          <p style="margin-top:18px;color:var(--muted);font-size:.9rem">Confirm orders on WhatsApp: <strong>${WHATSAPP_DISPLAY}</strong></p>
        </div>
      `;
      const qty = () => Math.max(1, parseInt($('#qty').value||'1',10));
      $('#qm').onclick = () => { $('#qty').value = Math.max(1, qty()-1); refreshBuy(); };
      $('#qp').onclick = () => { $('#qty').value = qty()+1; refreshBuy(); };
      $('#qty').oninput = refreshBuy;
      function refreshBuy(){
        $('#buy-btn').href = waBuyNow({...p, permalink: location.href}, qty());
      }
      refreshBuy();
      $('#add-btn').onclick = () => {
        Cart.add({slug:p.slug, name:p.name, price:p.price, image:p.image}, qty());
        toast('Added — open Cart to confirm on WhatsApp');
      };
      document.title = p.name + ' — ' + STORE_NAME;
    });
  }

  if(route === 'cart'){
    renderCart();
  }
});

function renderCart(){
  const items = Cart.read();
  const wrap = document.getElementById('cart-wrap');
  if(!items.length){
    wrap.innerHTML = '<p class="empty">Your cart is empty. <a href="index.html" style="color:var(--brand);font-weight:600">Continue shopping</a></p>';
    return;
  }
  const rows = items.map(i => `
    <tr data-slug="${i.slug}">
      <td><img class="cart-row-img" src="${i.image||''}" alt=""></td>
      <td>${i.name}</td>
      <td>${fmt(i.price)}</td>
      <td>
        <input class="qty-input js-qty" type="number" min="1" value="${i.qty||1}">
      </td>
      <td>${fmt((i.price||0)*(i.qty||1))}</td>
      <td><button class="icon-btn js-remove">Remove</button></td>
    </tr>
  `).join('');
  wrap.innerHTML = `
    <table class="cart-table">
      <thead><tr><th></th><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="cart-summary">
      <div class="total">Total: ${fmt(Cart.total())}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-outline" id="clear-btn">Clear Cart</button>
        <a class="btn btn-wa" id="confirm-wa" target="_blank" rel="noopener">Confirm on WhatsApp</a>
      </div>
    </div>
  `;
  document.getElementById('confirm-wa').href = waCartConfirm(Cart.read());
  document.getElementById('clear-btn').onclick = () => { Cart.clear(); renderCart(); };
  document.querySelectorAll('.js-qty').forEach(inp => {
    inp.addEventListener('change', e => {
      const slug = e.target.closest('tr').dataset.slug;
      Cart.setQty(slug, parseInt(e.target.value||'1',10));
      renderCart();
    });
  });
  document.querySelectorAll('.js-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const slug = e.target.closest('tr').dataset.slug;
      Cart.remove(slug); renderCart();
    });
  });
}
