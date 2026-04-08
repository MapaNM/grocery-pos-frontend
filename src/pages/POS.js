import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '../redux/slices/cartSlice';
import { getProductByBarcode, getCustomerByPhone } from '../services/api';
import offlineManager from '../utils/offlineManager';
import offlineDB from '../utils/offlineDB';
import './POS.css';

const POS = () => {
  const dispatch = useDispatch();
  const { cartItems, subtotal, tax, total } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.auth);

  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  const barcodeInputRef = useRef(null);

  // Initialize offline database and sync products
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        await offlineDB.init();
        console.log('✅ Offline DB initialized');
        
        // Sync products from server to local DB
        await offlineManager.syncProducts();
        console.log('✅ Products synced to offline DB');
        
        // Get count of products in offline DB
        const products = await offlineDB.getProducts();
        console.log(`📦 ${products.length} products available offline`);
      } catch (error) {
        console.error('❌ Failed to initialize offline mode:', error);
        toast.error('Failed to initialize offline mode');
      }
    };

    initializeOffline();
  }, []);

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      // Step 1: Try offline DB first (faster)
      let data = await offlineManager.getProductByBarcode(barcode);
      
      // Step 2: If not found offline and we're online, try server
      if (!data && navigator.onLine) {
        try {
          const response = await getProductByBarcode(barcode);
          data = response.data;
          
          // Save to offline DB for future use
          await offlineDB.saveProducts([data]);
          console.log('✅ Product fetched from server and cached');
        } catch (error) {
          console.error('❌ Product not on server:', error);
        }
      }
      
      // Step 3: Still not found? Show error
      if (!data) {
        toast.error('Product not found. Check barcode or add product first.');
        setBarcode('');
        return;
      }

      // Step 4: Check stock
      if (data.quantity <= 0) {
        toast.error('Product out of stock');
        setBarcode('');
        return;
      }

      // Step 5: Add to cart
      dispatch(addToCart(data));
      toast.success(`${data.name} added to cart`);
      setBarcode('');
      barcodeInputRef.current?.focus();
      
    } catch (error) {
      console.error('❌ Error finding product:', error);
      toast.error('Product not found');
      setBarcode('');
    }
  };

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    const item = cartItems.find(i => i._id === id);
    
    if (item && newQuantity > item.stockQuantity) {
      toast.warning(`Only ${item.stockQuantity} available in stock`);
      return;
    }
    
    dispatch(updateQuantity({ id, quantity: newQuantity }));
  };

  const handleRemoveItem = (id) => {
    dispatch(removeFromCart(id));
    toast.info('Item removed from cart');
  };

  const handleCustomerLookup = async () => {
    if (!customerPhone.trim()) return;

    try {
      const { data } = await getCustomerByPhone(customerPhone);
      setCustomer(data);
      toast.success(`Customer found: ${data.name}`);
    } catch (error) {
      toast.error('Customer not found');
      setCustomer(null);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    if (paid < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    setLoading(true);

    try {
      const saleData = {
        items: cartItems.map(item => ({
          product: item._id,
          productName: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod,
        amountPaid: paid,
        customer: customer?._id || null,
      };

      const result = await offlineManager.createSale(saleData);
      
      // Update local product quantities
      for (const item of cartItems) {
        const newQuantity = item.stockQuantity - item.quantity;
        await offlineManager.updateProductQuantity(item._id, newQuantity);
      }

      if (result.offline) {
        toast.success('Sale saved offline! Will sync when online.');
      } else {
        toast.success(`Sale completed! Total: $${total.toFixed(2)}`);
      }
      
      // Show receipt info
      alert(`✅ Sale Completed!\n\nTotal: $${total.toFixed(2)}\nPaid: $${paid.toFixed(2)}\nChange: $${(paid - total).toFixed(2)}\n\nPayment: ${paymentMethod}`);
      
      // Reset form
      dispatch(clearCart());
      setAmountPaid('');
      setCustomerPhone('');
      setCustomer(null);
      setPaymentMethod('cash');
      
    } catch (error) {
      const message = error.response?.data?.message || 'Sale failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const change = parseFloat(amountPaid) - total || 0;

  return (
    <div className="pos-container">
      <div className="pos-left">
        <div className="pos-header">
          <h2>Point of Sale</h2>
          <p>Cashier: {userInfo?.name}</p>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="barcode-section">
          <input
            ref={barcodeInputRef}
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Scan or enter barcode..."
            className="barcode-input"
            autoFocus
          />
          <button type="submit" className="btn-scan">Add</button>
        </form>

        <div className="cart-section">
          <h3>Cart Items ({cartItems.length})</h3>
          
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>🛒</p>
              <p>No items in cart</p>
              <p>Scan products to add them</p>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map((item) => {
                // Safety variables
                const itemId = item._id || '';
                const itemName = item.name || 'Unknown Product';
                const itemBarcode = item.barcode || 'N/A';
                const itemPrice = Number(item.price) || 0;
                const itemQuantity = Number(item.quantity) || 1;
                const itemStock = Number(item.stockQuantity) || 0;
                const itemSubtotal = Number(item.subtotal) || 0;

                return (
                  <div key={itemId} className="cart-item">
                    <div className="item-info">
                      <h4>{itemName}</h4>
                      <p className="item-barcode">{itemBarcode}</p>
                      <p className="item-price">${itemPrice.toFixed(2)} each</p>
                      <p className="item-stock">Stock: {itemStock}</p>
                    </div>
                    
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          onClick={() => handleQuantityChange(itemId, itemQuantity - 1)}
                          className="qty-btn"
                          type="button"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={itemQuantity}
                          onChange={(e) => handleQuantityChange(itemId, parseInt(e.target.value) || 1)}
                          className="qty-input"
                          min="1"
                          max={itemStock}
                        />
                        <button
                          onClick={() => handleQuantityChange(itemId, itemQuantity + 1)}
                          className="qty-btn"
                          type="button"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="item-total">${itemSubtotal.toFixed(2)}</div>
                      
                      <button
                        onClick={() => handleRemoveItem(itemId)}
                        className="btn-remove"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pos-right">
        <div className="customer-section">
          <h3>Customer (Optional)</h3>
          <div className="customer-lookup">
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter phone number"
              className="customer-input"
            />
            <button onClick={handleCustomerLookup} className="btn-lookup" type="button">
              Lookup
            </button>
          </div>
          {customer && (
            <div className="customer-info">
              <p><strong>{customer.name}</strong></p>
              <p>Phone: {customer.phone}</p>
              <p>Points: {customer.loyaltyPoints || 0}</p>
            </div>
          )}
        </div>

        <div className="summary-section">
          <h3>Order Summary</h3>
          
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${(Number(subtotal) || 0).toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>VAT (5%):</span>
            <span>${(Number(tax) || 0).toFixed(2)}</span>
          </div>
          
          <div className="summary-row total-row">
            <span>Total:</span>
            <span>${(Number(total) || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="payment-section">
          <h3>Payment</h3>
          
          <div className="payment-method">
            <label>Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="payment-select"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital">Digital Wallet</option>
            </select>
          </div>

          <div className="amount-paid">
            <label>Amount Paid:</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="amount-input"
            />
          </div>

          {amountPaid && (
            <div className={`change-display ${change < 0 ? 'insufficient' : ''}`}>
              <span>Change:</span>
              <span className="change-amount">
                ${(Number(change) || 0).toFixed(2)}
              </span>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            className="btn-checkout"
            type="button"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>

          <button
            onClick={() => {
              dispatch(clearCart());
              toast.info('Cart cleared');
            }}
            disabled={cartItems.length === 0}
            className="btn-clear"
            type="button"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;