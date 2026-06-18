import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Onboarding
import CreateBusiness from './pages/onboarding/CreateBusiness';
import Success from './pages/onboarding/Success';
import ActivityLogs from './pages/settings/ActivityLogs';
import StaffManagement from './pages/settings/StaffManagement';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Billing
import BillingPage from './pages/billing/BillingPage';
import BillHistory from './pages/billing/BillHistory';

// Products
import ProductList from './pages/products/ProductList';
import AddProduct from './pages/products/AddProduct';
import EditProduct from './pages/products/EditProduct';

// Suppliers
import SupplierList from './pages/suppliers/SupplierList';

// Customers
import CustomerList from './pages/customers/CustomerList';
import AddCustomer from './pages/customers/AddCustomer';
import CustomerDetails from './pages/customers/CustomerDetails';

// Expenses
import ExpenseList from './pages/expenses/ExpenseList';
import AddExpense from './pages/expenses/AddExpense';

// Reports
import SalesReport from './pages/reports/SalesReport';
import Analytics from './pages/reports/Analytics';
import TaxReport from './pages/reports/TaxReport';

// Stock
import StockList from './pages/stock/StockList';
import LowStock from './pages/stock/LowStock';

// Purchase Orders
import PurchaseOrderList from './pages/purchase-orders/PurchaseOrderList';

// Quotations
import QuotationList from './pages/quotations/QuotationList';
import CreateQuotation from './pages/quotations/CreateQuotation';

// Settings
import Profile from './pages/settings/Profile';

// Support
import HelpSupport from './pages/support/HelpSupport';

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Auth ── */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route index element={<Navigate to="/auth/login" replace />} />
        </Route>
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />

        {/* ── Onboarding ── */}
        <Route path="/onboarding" element={<AuthLayout />}>
          <Route path="business" element={<CreateBusiness />} />
          <Route path="success" element={<Success />} />
          <Route index element={<Navigate to="/onboarding/business" replace />} />
        </Route>

        {/* ── Main App ── */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* Billing */}
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/history" element={<BillHistory />} />
          <Route path="quotations" element={<QuotationList />} />
          <Route path="quotations/add" element={<CreateQuotation />} />

          {/* Products */}
          <Route path="products" element={<ProductList />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />

          {/* Customers */}
          <Route path="customers" element={<CustomerList />} />
          <Route path="customers/add" element={<AddCustomer />} />
          <Route path="customers/:id" element={<CustomerDetails />} />

          {/* Expenses */}
          <Route path="expenses" element={<ExpenseList />} />
          <Route path="expenses/add" element={<AddExpense />} />

          {/* Reports */}
          <Route path="reports" element={<SalesReport />} />
          <Route path="reports/analytics" element={<Analytics />} />
          <Route path="reports/tax" element={<TaxReport />} />

          {/* Stock */}
          <Route path="stock" element={<StockList />} />
          <Route path="stock/low" element={<LowStock />} />

          {/* Purchase Orders */}
          <Route path="purchase-orders" element={<PurchaseOrderList />} />

          {/* Suppliers */}
          <Route path="/suppliers" element={<SupplierList />} />

          {/* Settings */}
          <Route path="settings" element={<Profile />} />
          <Route path="settings/staff" element={<StaffManagement />} />
          <Route path="settings/activity" element={<ActivityLogs />} />

          {/* Support */}
          <Route path="support" element={<HelpSupport />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
