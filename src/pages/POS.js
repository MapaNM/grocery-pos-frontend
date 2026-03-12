import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCart, removeFromCart, updateQuantity, clearCart } from '../redux/slices/cartSlice';
import { getProductByBarcode, createSale, getCustomerByPhone } from '../services/api';
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

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      const { data } = await getProductByBarcode(barcode);
      
      if (data.quantity <= 0) {
        toast.error('Product out of stock');
        setBarcode('');
        return;
      }

      dispatch(addToCart(data));
      toast.success(`${data.name} added to cart`);
      setBarcode('');
      barcodeInputRef.current?.focus();
    } catch (error) {
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

      const { data } = await createSale(saleData);
      
      toast.success(`Sale completed! Total: $${total.toFixed(2)}`);
      
      // Reset form
      dispatch(clearCart());
      setAmountPaid('');
      setCustomerPhone('');
      setCustomer(null);
      setPaymentMethod('cash');
      
      // Show receipt info
      alert(`✅ Sale Completed!\n\nSale ID: ${data._id}\nTotal: $${total.toFixed(2)}\nChange: $${(paid - total).toFixed(2)}`);
      
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
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p className="item-barcode">{item.barcode}</p>
                    <p className="item-price">${item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        className="qty-btn"
                        type="button"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                        className="qty-input"
                        min="1"
                      />
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="qty-btn"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="item-total">${item.subtotal.toFixed(2)}</div>
                    
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="btn-remove"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
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
              <p>Points: {customer.loyaltyPoints}</p>
            </div>
          )}
        </div>

        <div className="summary-section">
          <h3>Order Summary</h3>
          
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>Tax (5%):</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          
          <div className="summary-row total-row">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
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
                ${change.toFixed(2)}
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
            onClick={() => dispatch(clearCart())}
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