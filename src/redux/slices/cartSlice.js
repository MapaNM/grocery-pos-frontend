import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cartItems: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  discount: 0,
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
        state.cartItems.push({
          ...item,
          stockQuantity: item.quantity, // Store original stock
          quantity: 1,                   // Cart quantity starts at 1
          subtotal: item.price,
        });
      }

      cartSlice.caseReducers.calculateTotals(state);
    },

    removeFromCart: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter((item) => item._id !== id);
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
      state.discount = 0;
    },

    setDiscount: (state, action) => {
      state.discount = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },

    calculateTotals: (state) => {
      // Calculate subtotal
      state.subtotal = state.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // Calculate tax (5%)
      state.tax = state.subtotal * 0.05;
      
      // Calculate total
      state.total = state.subtotal + state.tax - state.discount;
      
      // Ensure total is not negative
      if (state.total < 0) {
        state.total = 0;
      }
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart,
  setDiscount,
  calculateTotals 
} = cartSlice.actions;

export default cartSlice.reducer;