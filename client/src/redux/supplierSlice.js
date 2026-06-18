import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/suppliers/';

const getConfig = (thunkAPI) => {
  const token = thunkAPI.getState().auth.userInfo.token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getSuppliers = createAsyncThunk('supplier/getAll', async (_, thunkAPI) => {
  try {
    const response = await axios.get(API_URL, getConfig(thunkAPI));
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const createSupplier = createAsyncThunk('supplier/create', async (supplierData, thunkAPI) => {
  try {
    const response = await axios.post(API_URL, supplierData, getConfig(thunkAPI));
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const updateSupplier = createAsyncThunk('supplier/update', async ({ id, data }, thunkAPI) => {
  try {
    const response = await axios.put(API_URL + id, data, getConfig(thunkAPI));
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

export const deleteSupplier = createAsyncThunk('supplier/delete', async (id, thunkAPI) => {
  try {
    await axios.delete(API_URL + id, getConfig(thunkAPI));
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
  }
});

const supplierSlice = createSlice({
  name: 'supplier',
  initialState: {
    suppliers: [],
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
  },
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSuppliers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSuppliers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.suppliers = action.payload;
      })
      .addCase(getSuppliers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createSupplier.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.suppliers.unshift(action.payload);
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.suppliers.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((s) => s._id !== action.payload);
      });
  },
});

export const { reset } = supplierSlice.actions;
export default supplierSlice.reducer;
