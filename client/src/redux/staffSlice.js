import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  staffMembers: [],
  isLoading: false,
  error: null,
};

// Async Thunk to get all staff
export const getStaff = createAsyncThunk(
  'staff/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/auth/staff');
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

// Async Thunk to add a new staff member
export const addStaff = createAsyncThunk(
  'staff/add',
  async (staffData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/auth/staff', staffData);
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

// Async Thunk to delete a staff member
export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/auth/staff/${id}`);
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

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearStaffError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Staff
      .addCase(getStaff.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffMembers = action.payload;
      })
      .addCase(getStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add Staff
      .addCase(addStaff.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffMembers.push(action.payload);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Staff
      .addCase(deleteStaff.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.isLoading = false;
        state.staffMembers = state.staffMembers.filter(
          (staff) => staff._id !== action.payload
        );
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStaffError } = staffSlice.actions;
export default staffSlice.reducer;
