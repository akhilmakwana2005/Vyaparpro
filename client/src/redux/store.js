import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import productReducer from './productSlice';
import customerReducer from './customerSlice';
import billingReducer from './billingSlice';
import expenseReducer from './expenseSlice';
import notificationReducer from './notificationSlice';
import staffReducer from './staffSlice';
import purchaseOrderReducer from './purchaseOrderSlice';
import quotationReducer from './quotationSlice';
import supplierReducer from './supplierSlice';
import activityReducer from './activitySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    customer: customerReducer,
    billing: billingReducer,
    expense: expenseReducer,
    notification: notificationReducer,
    staff: staffReducer,
    purchaseOrder: purchaseOrderReducer,
    quotation: quotationReducer,
    supplier: supplierReducer,
    activity: activityReducer,
  },
});

export default store;
