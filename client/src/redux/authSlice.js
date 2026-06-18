import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Get user from localStorage if it exists
const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const initialState = {
  userInfo: userInfoFromStorage,
  staffList: [],
  isLoading: false,
  error: null,
};

// Async Thunk for Login
export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/login', userData);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
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

// Async Thunk for Register
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
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

// Async Thunk for Logout
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  return null;
});

// Async Thunk for Updating Profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.userInfo.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put('/api/auth/profile', userData, config);
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk for Getting Staff
export const getStaff = createAsyncThunk(
  'auth/getStaff',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.userInfo.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/auth/staff', config);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk for Adding Staff
export const addStaff = createAsyncThunk(
  'auth/addStaff',
  async (staffData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.userInfo.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post('/api/auth/staff', staffData, config);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Async Thunk for Deleting Staff
export const deleteStaff = createAsyncThunk(
  'auth/deleteStaff',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.userInfo.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/auth/staff/${id}`, config);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userInfo = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userInfo = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.userInfo = null;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userInfo = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Staff
      .addCase(getStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffList = action.payload;
      })
      .addCase(getStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Staff
      .addCase(addStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffList.push(action.payload);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Staff
      .addCase(deleteStaff.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffList = state.staffList.filter(staff => staff._id !== action.payload);
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;
