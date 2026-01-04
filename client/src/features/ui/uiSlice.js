import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  isUploading: false,
  notification: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setUploadLoading: (state, action) => {
      state.isUploading = action.payload;
    },
    setNotification: (state, action) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    }
  }
});

export const { setLoading, setUploadLoading, setNotification, clearNotification } = uiSlice.actions;
export default uiSlice.reducer;
