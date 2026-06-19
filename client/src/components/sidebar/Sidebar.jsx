import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Receipt, Package, Users,
  CreditCard, BarChart3, Box, Settings,
  HelpCircle, ShoppingBag, LogOut, ShoppingCart, FileText, Store, Activity, Database
} from 'lucide-react';
import { logout } from '../../redux/authSlice';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const dispatch = useDispatch();

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', ownerOnly: true },
    { icon: Receipt, label: 'Billing', path: '/billing' },
    { icon: FileText, label: 'Quotations', path: '/quotations' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Users, label: 'Customers', path: '/customers' },
    { icon: CreditCard, label: 'Expenses', path: '/expenses', ownerOnly: true },
    { icon: BarChart3, label: 'Reports', path: '/reports', ownerOnly: true },
    { icon: Box, label: 'Stock', path: '/stock' },
    { icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders', ownerOnly: true },
    { icon: Store, label: 'Suppliers', path: '/suppliers', ownerOnly: true },
    { icon: Users, label: 'Staff', path: '/settings/staff', ownerOnly: true },
    { icon: Activity, label: 'Activity Logs', path: '/settings/activity', ownerOnly: true },
    { icon: HelpCircle, label: 'Help & Support', path: '/support' },
    { icon: Settings, label: 'Settings', path: '/settings', ownerOnly: true },
  ];

  const { userInfo } = useSelector((state) => state.auth);
  const isOwner = userInfo?.role === 'owner';

  const menuItems = allMenuItems.filter(item => isOwner || !item.ownerOnly);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      {/* Backdrop Overlay for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-20 md:hidden transition-opacity duration-300"
        />
      )}

      <div className={`w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-30 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="p-6">
          <div className="flex items-center gap-2">
            {userInfo?.logo ? (
              <img src={userInfo.logo} alt="Shop Logo" className="h-8 w-auto rounded object-contain max-w-[40px]" />
            ) : (
              <div className="bg-primary text-white p-1.5 rounded-lg">
                <ShoppingBag size={20} />
              </div>
            )}
            <span className="text-xl font-bold text-gray-900 truncate">
              {userInfo?.businessName || 'VyaparPro'}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto no-scrollbar">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.path === '/settings' 
              ? location.pathname === '/settings'
              : location.pathname.includes(item.path);

            return (
              <Link
                key={index}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm w-full">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
