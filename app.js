const PRODUCTS = [
  { id: 'p1', name: 'Blue T-Shirt', price: 19.99, image: 'https://picsum.photos/seed/tshirt/400/300' },
  { id: 'p2', name: 'Sneakers', price: 79.0, image: 'https://picsum.photos/seed/sneakers/400/300' },
  { id: 'p3', name: 'Leather Wallet', price: 34.5, image: 'https://picsum.photos/seed/wallet/400/300' }
];

const $ = sel => document.querySelector(sel);
const $products = $('#products');
const $cart = $('#cart');
const $cartItems = $('#cart-items');
const $cartCount = $('#cart-count');
const $cartTotal = $('#cart-total');

let cart = JSON.parse(localStorage.getItem('nova_cart') || '{}');

function formatPrice(n){return n.toFixed(2)}

function renderProducts(){
  $products.innerHTML = '';
  for(const p of PRODUCTS){
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>$${formatPrice(p.price)}</p>
      <div class="meta">
        <small>In stock</small>
        <button class="btn" data-id="${p.id}">Add</button>
      </div>
    `;
    $products.appendChild(el);
  }
}

function saveCart(){
  localStorage.setItem('nova_cart', JSON.stringify(cart));
}

function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCartSummary();
}

function removeFromCart(id){
  delete cart[id];
  saveCart();
  renderCart();
}

function renderCart(){
  $cartItems.innerHTML = '';
  const ids = Object.keys(cart);
  let total = 0;
  for(const id of ids){
    const p = PRODUCTS.find(x=>x.id===id);
    const qty = cart[id];
    total += p.price * qty;
    const li = document.createElement('li');
    li.innerHTML = `<span>${p.name} × ${qty}</span><span>$${formatPrice(p.price*qty)}</span>`;
    const remove = document.createElement('button'); remove.textContent='✕'; remove.style.marginLeft='8px'; remove.onclick = ()=>{ removeFromCart(id) };
    li.appendChild(remove);
    $cartItems.appendChild(li);
  }
  $cartTotal.textContent = formatPrice(total);
  renderCartSummary();
}

function renderCartSummary(){
  const count = Object.values(cart).reduce((s,n)=>s+n,0);
  $cartCount.textContent = count;
}

// Event delegation for add buttons
$products.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-id]');
  if(!btn) return;
  addToCart(btn.dataset.id);
});

$('#view-cart').addEventListener('click', ()=>{ $cart.hidden = !$cart.hidden; renderCart(); });
$('#close-cart').addEventListener('click', ()=>{ $cart.hidden = true });
$('#checkout').addEventListener('click', ()=>{
  if(Object.keys(cart).length===0){ alert('Cart is empty'); return }
  alert('Demo checkout — order placed.');
  cart = {}; saveCart(); renderCart();
});

// Init
renderProducts();
renderCartSummary();
