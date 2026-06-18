import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://vyaparpro-o6hq.onrender.com/api/quotations';

const getConfig = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getQuotations = createAsyncThunk('quotations/getAll', async (_, thunkAPI) => {
  try {
    const response = await axios.get(API_URL, getConfig());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const getQuotationById = createAsyncThunk('quotations/getById', async (id, thunkAPI) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getConfig());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createQuotation = createAsyncThunk('quotations/create', async (quotationData, thunkAPI) => {
  try {
    const response = await axios.post(API_URL, quotationData, getConfig());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateQuotation = createAsyncThunk('quotations/update', async ({ id, updates }, thunkAPI) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, updates, getConfig());
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteQuotation = createAsyncThunk('quotations/delete', async (id, thunkAPI) => {
  try {
    await axios.delete(`${API_URL}/${id}`, getConfig());
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const convertQuotationToInvoice = createAsyncThunk('quotations/convert', async (id, thunkAPI) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/convert`, {}, getConfig());
    return response.data; // { quotation, invoice }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const quotationSlice = createSlice({
  name: 'quotation',
  initialState: {
    quotations: [],
    quotation: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearQuotationState: (state) => {
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getQuotations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getQuotations.fulfilled, (state, action) => { state.loading = false; state.quotations = action.payload; })
      .addCase(getQuotations.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(getQuotationById.pending, (state) => { state.loading = true; })
      .addCase(getQuotationById.fulfilled, (state, action) => { state.loading = false; state.quotation = action.payload; })
      .addCase(getQuotationById.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(createQuotation.pending, (state) => { state.loading = true; })
      .addCase(createQuotation.fulfilled, (state, action) => { state.loading = false; state.quotations.unshift(action.payload); })
      .addCase(createQuotation.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      
      .addCase(updateQuotation.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(q => q._id === action.payload._id);
        if (index !== -1) state.quotations[index] = action.payload;
      })
      
      .addCase(deleteQuotation.fulfilled, (state, action) => {
        state.quotations = state.quotations.filter(q => q._id !== action.payload);
      })
      
      .addCase(convertQuotationToInvoice.fulfilled, (state, action) => {
        const index = state.quotations.findIndex(q => q._id === action.payload.quotation._id);
        if (index !== -1) state.quotations[index] = action.payload.quotation;
      });
  },
});

export const { clearQuotationState } = quotationSlice.actions;
export default quotationSlice.reducer;
