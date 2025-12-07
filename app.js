const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8');
    const products = JSON.parse(data);
    res.json(products);
  } catch (err) {
    console.error('Error loading products:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Purchase product (decrease quantity)
app.post('/api/purchase/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;
    
    // Validate input
    const quantity = parseInt(qty, 10);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }
    
    const filePath = path.join(__dirname, 'data', 'products.json');
    const data = fs.readFileSync(filePath, 'utf8');
    let products = JSON.parse(data);
    
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock' });
    }
    
    product.quantity -= quantity;
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
    
    res.json(product);
  } catch (err) {
    console.error('Error processing purchase:', err);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
