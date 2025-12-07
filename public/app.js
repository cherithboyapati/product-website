let allProducts = [];
let purchaseHistory = [];
let cart = [];
let filteredProducts = [];
let stripe = null;
let elements = null;
let cardElement = null;

// Shopping Cart Management
function initCart() {
  const cartBtn = document.getElementById('cart-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const closeCartBtn = document.querySelector('.close-cart');
  const checkoutBtn = document.getElementById('checkout-btn');

  loadCart();

  cartBtn.addEventListener('click', () => {
    cartSidebar.classList.toggle('hidden');
  });

  closeCartBtn.addEventListener('click', () => {
    cartSidebar.classList.add('hidden');
  });

  checkoutBtn.addEventListener('click', openPaymentModal);
}

function addToCart(product, quantity) {
  const existingItem = cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: quantity
    });
  }
  
  saveCart();
  updateCartUI();
  showMessage(`✅ Added ${quantity} x ${product.name} to cart!`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalQty;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    cartTotal.textContent = '$0.00';
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    return `
      <div class="cart-item">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-meta">
          <span>$${item.price.toFixed(2)} × ${item.qty}</span>
          <span>$${itemTotal.toFixed(2)}</span>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
      </div>
    `;
  }).join('');
  
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

function checkout() {
  if (cart.length === 0) {
    showMessage('Your cart is empty', 'error');
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  showMessage(`✅ Order confirmed! Total: $${total.toFixed(2)}. Thank you for your purchase!`, 'success');
  
  cart.forEach(item => {
    purchaseHistory.push({
      name: item.name,
      qty: item.qty,
      total: item.price * item.qty,
      date: new Date().toISOString()
    });
  });
  localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  
  cart = [];
  saveCart();
  updateCartUI();
  document.getElementById('cart-sidebar').classList.add('hidden');
}

// Search & Filter
function initSearch() {
  const searchBox = document.getElementById('search-box');
  const priceFilter = document.getElementById('price-filter');
  const resetBtn = document.getElementById('reset-filters');
  
  searchBox.addEventListener('input', (e) => {
    filterProducts(e.target.value, parseInt(priceFilter.value));
  });
  
  priceFilter.addEventListener('input', (e) => {
    document.getElementById('price-display').textContent = `$0 - $${e.target.value}`;
    filterProducts(searchBox.value, parseInt(e.target.value));
  });
  
  resetBtn.addEventListener('click', () => {
    searchBox.value = '';
    priceFilter.value = 1000;
    document.getElementById('price-display').textContent = '$0 - $1000';
    filterProducts('', 1000);
  });
}

function filterProducts(searchTerm, maxPrice) {
  filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = product.price <= maxPrice;
    return matchesSearch && matchesPrice;
  });
  renderProducts();
}

// Product Details Modal
function initProductModal() {
  const productModal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('close-product');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  
  closeBtn.addEventListener('click', () => {
    productModal.classList.add('hidden');
  });
  
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      productModal.classList.add('hidden');
    }
  });
  
  addToCartBtn.addEventListener('click', () => {
    const qtyInput = document.getElementById('detail-qty');
    const quantity = parseInt(qtyInput.value, 10);
    
    if (!Number.isInteger(quantity) || quantity <= 0) {
      showMessage('Please enter a valid quantity', 'error');
      return;
    }
    
    const productId = addToCartBtn.dataset.productId;
    const product = allProducts.find(p => p.id === productId);
    
    if (product && product.quantity >= quantity) {
      addToCart(product, quantity);
      productModal.classList.add('hidden');
    } else {
      showMessage('Not enough stock', 'error');
    }
  });
}

function openProductDetails(product) {
  document.getElementById('detail-name').textContent = product.name;
  document.getElementById('detail-image').src = product.image;
  document.getElementById('detail-description').textContent = product.description;
  document.getElementById('detail-price').textContent = `$${product.price.toFixed(2)}`;
  document.getElementById('detail-stock').textContent = product.quantity;
  document.getElementById('detail-qty').value = 1;
  document.getElementById('detail-qty').max = product.quantity;
  document.getElementById('add-to-cart-btn').dataset.productId = product.id;
  
  document.getElementById('product-modal').classList.remove('hidden');
}

// Profile Management
function initProfile() {
  const profileBtn = document.getElementById('profile-btn');
  const profileModal = document.getElementById('profile-modal');
  const closeBtn = document.getElementById('close-profile');
  const saveBtn = document.getElementById('save-profile');

  loadProfile();

  profileBtn.addEventListener('click', () => {
    profileModal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    profileModal.classList.add('hidden');
  });

  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.add('hidden');
    }
  });

  saveBtn.addEventListener('click', saveProfile);
}

function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('userProfile')) || {
    name: 'Guest User',
    email: 'guest@example.com',
    phone: '',
    address: ''
  };

  document.getElementById('profile-name').value = profile.name;
  document.getElementById('profile-email').value = profile.email;
  document.getElementById('profile-phone').value = profile.phone;
  document.getElementById('profile-address').value = profile.address;

  purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory')) || [];
  updatePurchaseHistory();
}

function saveProfile() {
  const profile = {
    name: document.getElementById('profile-name').value,
    email: document.getElementById('profile-email').value,
    phone: document.getElementById('profile-phone').value,
    address: document.getElementById('profile-address').value
  };

  localStorage.setItem('userProfile', JSON.stringify(profile));
  showMessage('✅ Profile saved successfully!', 'success');
}

function updatePurchaseHistory() {
  const historyDiv = document.getElementById('purchase-history');
  if (purchaseHistory.length === 0) {
    historyDiv.innerHTML = '<p>No purchases yet</p>';
    return;
  }

  historyDiv.innerHTML = purchaseHistory.map(p => `
    <div style="padding: 10px; background: white; margin: 8px 0; border-radius: 4px; border-left: 4px solid #667eea;">
      <strong>${p.name}</strong> - Qty: ${p.qty} - $${p.total.toFixed(2)}
      <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${new Date(p.date).toLocaleDateString()}</div>
    </div>
  `).join('');
}

async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Failed to load products');
    
    allProducts = await response.json();
    filteredProducts = allProducts;
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    showMessage('Failed to load products', 'error');
  }
}

function renderProducts() {
  const container = document.getElementById('products');
  container.innerHTML = '';

  if (filteredProducts.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">No products found</p>';
    return;
  }

  filteredProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const quantityClass = product.quantity === 0 ? 'out' : product.quantity < 10 ? 'low' : '';
    const quantityText = product.quantity === 0 
      ? 'Out of Stock' 
      : `${product.quantity} in stock`;

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22 fill=%22%23999%22%3EImage%3C/text%3E%3C/svg%3E'">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-meta">
          <div class="price">$${product.price.toFixed(2)}</div>
          <div class="quantity ${quantityClass}">${quantityText}</div>
        </div>
        <div class="purchase-controls">
          <button class="btn-buy" onclick="openProductDetails(${JSON.stringify(product).replace(/"/g, '&quot;')})">View Details</button>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openProductDetails(product));
    container.appendChild(card);
  });
}

function showMessage(text, type) {
  const container = document.getElementById('products');
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  
  container.insertAdjacentElement('beforebegin', message);
  
  setTimeout(() => message.remove(), 4000);
}

// Dark Mode Toggle
function initDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Light Mode';
  }
  
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
  });
}

// Stripe Payment
function initStripePayment() {
  stripe = Stripe('pk_test_51QqrQJGDpvkPq0wFzQ6vQ3vQ3vQ3vQ3vQ');
  elements = stripe.elements();
  cardElement = elements.create('card');
  
  const cardContainer = document.getElementById('card-element');
  if (cardContainer) {
    cardElement.mount('#card-element');
    
    cardElement.addEventListener('change', (event) => {
      const errorDiv = document.getElementById('card-errors');
      if (event.error) {
        errorDiv.textContent = event.error.message;
      } else {
        errorDiv.textContent = '';
      }
    });
  }
}

function openPaymentModal() {
  if (cart.length === 0) {
    showMessage('Your cart is empty', 'error');
    return;
  }
  
  const paymentModal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('close-payment');
  const payBtn = document.getElementById('pay-btn');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const paymentItems = document.getElementById('payment-items');
  paymentItems.innerHTML = cart.map(item => `
    <div class="payment-item">
      <span>${item.name} × ${item.qty}</span>
      <span>$${(item.price * item.qty).toFixed(2)}</span>
    </div>
  `).join('');
  document.getElementById('payment-total').textContent = `$${total.toFixed(2)}`;
  
  paymentModal.classList.remove('hidden');
  
  closeBtn.onclick = () => {
    paymentModal.classList.add('hidden');
  };
  
  paymentModal.onclick = (e) => {
    if (e.target === paymentModal) {
      paymentModal.classList.add('hidden');
    }
  };
  
  payBtn.onclick = async () => {
    await processPayment(total);
  };
}

async function processPayment(amount) {
  const payBtn = document.getElementById('pay-btn');
  const cardholderName = document.getElementById('cardholder-name').value;
  const email = document.getElementById('payment-email').value;
  const errorDiv = document.getElementById('card-errors');
  
  if (!cardholderName || !email) {
    errorDiv.textContent = 'Please fill in all fields';
    return;
  }
  
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';
  
  try {
    const { paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName,
        email: email
      }
    });
    
    if (!paymentMethod) {
      throw new Error('Failed to create payment method');
    }
    
    showMessage(`✅ Payment successful! Order confirmed. Amount: $${amount.toFixed(2)}`, 'success');
    
    cart.forEach(item => {
      purchaseHistory.push({
        name: item.name,
        qty: item.qty,
        total: item.price * item.qty,
        date: new Date().toISOString()
      });
    });
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
    
    cart = [];
    saveCart();
    updateCartUI();
    
    document.getElementById('payment-modal').classList.add('hidden');
    document.getElementById('cart-sidebar').classList.add('hidden');
    
    cardElement.clear();
    document.getElementById('cardholder-name').value = '';
    document.getElementById('payment-email').value = '';
  } catch (error) {
    errorDiv.textContent = error.message || 'Payment failed. Please try again.';
    console.error('Payment error:', error);
  } finally {
    payBtn.disabled = false;
    payBtn.textContent = 'Pay Now';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initProfile();
  initCart();
  initSearch();
  initProductModal();
  initDarkMode();
  initStripePayment();
  loadProducts();
});
