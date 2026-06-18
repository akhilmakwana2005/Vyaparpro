import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/activity-logs/';

// Get user token
const getConfig = (thunkAPI) => {
  const token = thunkAPI.getState().auth.userInfo.token;
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getActivityLogs = createAsyncThunk(
  'activity/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(API_URL, getConfig(thunkAPI));
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    logs: [],
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
      .addCase(getActivityLogs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActivityLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.logs = action.payload;
      })
      .addCase(getActivityLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = activitySlice.actions;
export default activitySlice.reducer;
