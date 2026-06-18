import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  invoices: [],
  isLoading: false,
  error: null,
};

// Async Thunk to get all invoices
export const getInvoices = createAsyncThunk(
  'billing/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/invoices');
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk to create a new invoice
export const createInvoice = createAsyncThunk(
  'billing/create',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/invoices', invoiceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk to update invoice status
export const updateInvoice = createAsyncThunk(
  'billing/update',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/invoices/${id}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk to delete an invoice
export const deleteInvoice = createAsyncThunk(
  'billing/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/invoices/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk to ask AI to prepare billing
export const askAIBilling = createAsyncThunk(
  'billing/askAI',
  async (prompt, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/ai/billing-assist', { prompt });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearBillingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Invoices
      .addCase(getInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
      })
      .addCase(getInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Invoice
      .addCase(createInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices.unshift(action.payload);
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Invoice
      .addCase(deleteInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = state.invoices.filter((inv) => inv._id !== action.payload);
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Invoice Status
      .addCase(updateInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.invoices.findIndex((inv) => inv._id === action.payload._id);
        if (idx !== -1) state.invoices[idx] = action.payload;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearBillingError } = billingSlice.actions;
export default billingSlice.reducer;