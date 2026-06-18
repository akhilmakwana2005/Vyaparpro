import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://vyaparpro-o6hq.onrender.com/api/purchase-orders';

const getConfig = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getPurchaseOrders = createAsyncThunk('purchaseOrder/getAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axios.get(API_URL, getConfig());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createPurchaseOrder = createAsyncThunk('purchaseOrder/create', async (poData, { rejectWithValue }) => {
  try {
    const { data } = await axios.post(API_URL, poData, getConfig());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updatePurchaseOrder = createAsyncThunk('purchaseOrder/update', async ({ id, updates }, { rejectWithValue }) => {
  try {
    const { data } = await axios.put(`${API_URL}/${id}`, updates, getConfig());
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deletePurchaseOrder = createAsyncThunk('purchaseOrder/delete', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getConfig());
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const purchaseOrderSlice = createSlice({
  name: 'purchaseOrder',
  initialState: {
    purchaseOrders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPurchaseOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getPurchaseOrders.fulfilled, (state, action) => { state.loading = false; state.purchaseOrders = action.payload; })
      .addCase(getPurchaseOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createPurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders.unshift(action.payload);
      })

      .addCase(updatePurchaseOrder.fulfilled, (state, action) => {
        const idx = state.purchaseOrders.findIndex((p) => p._id === action.payload._id);
        if (idx !== -1) state.purchaseOrders[idx] = action.payload;
      })

      .addCase(deletePurchaseOrder.fulfilled, (state, action) => {
        state.purchaseOrders = state.purchaseOrders.filter((p) => p._id !== action.payload);
      });
  },
});

export default purchaseOrderSlice.reducer;
