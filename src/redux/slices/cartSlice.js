import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);
      if (existItem) {
        existItem.quantity += 1;
        existItem.subtotal = existItem.quantity * existItem.price;
      } else {
        state.cartItems.push({ ...item, quantity: 1, subtotal: item.price });
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x._id !== action.payload);
      cartSlice.caseReducers.calculateTotals(state);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((x) => x._id === id);
      if (item && quantity > 0) {
        item.quantity = quantity;
        item.subtotal = item.quantity * item.price;
        cartSlice.caseReducers.calculateTotals(state);
      }
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
    },
    calculateTotals: (state) => {
      state.subtotal = state.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      state.tax = state.subtotal * 0.05;
      state.total = state.subtotal + state.tax;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
