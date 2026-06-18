import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import { Bell, Search, Menu, Package, Users, Settings, Loader2, Store, Receipt, FileText, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { getNotifications, markAsRead } from '../redux/notificationSlice';
import { Link } from 'react-router-dom';
import searchService from '../services/searchService';

const DashboardLayout = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notification || { notifications: [] });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  const recentNotifications = notifications?.slice(0, 5) || [];

  const location = useLocation();

  useEffect(() => {
    if (!userInfo) {
      navigate('/auth/login');
      return;
    }

    dispatch(getNotifications());

    // Role-based route protection for staff
    if (userInfo.role === 'staff') {
      const restrictedRoutes = ['/dashboard', '/expenses', '/reports', '/settings'];
      if (restrictedRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/billing', { replace: true });
      }
    }
  }, [userInfo, navigate, location.pathname, dispatch]);

  const handleNotificationClick = (id) => {
    dispatch(markAsRead(id));
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#notification-dropdown') && !e.target.closest('#notification-btn')) {
        setIsNotificationOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchService.globalSearch(searchQuery);
        setSearchResults(data);
        setIsSearchOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!userInfo) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        <header className="bg-white h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 md:hidden">
              <Menu size={20} />
            </button>
            <div className="hidden sm:block relative w-full max-w-md" ref={searchRef}>
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl w-full border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all shadow-sm">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if(e.target.value) setIsSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery) setIsSearchOpen(true);
                  }}
                  placeholder="Search products, customers, bills..." 
                  className="bg-transparent border-none outline-none w-full text-sm" 
                />
                {isSearching ? (
                  <Loader2 size={16} className="text-primary animate-spin flex-shrink-0" />
                ) : searchQuery ? (
                  <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && searchResults && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto no-scrollbar flex flex-col">
                  {!searchResults.products?.length && !searchResults.customers?.length && !searchResults.suppliers?.length && !searchResults.invoices?.length && !searchResults.quotations?.length ? (
                    <div className="p-4 text-center text-sm text-gray-500">No results found for "{searchQuery}"</div>
                  ) : (
                    <div className="py-2">
                      {searchResults.products?.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Products</div>
                          {searchResults.products.map(p => (
                            <Link key={p._id} to={`/products/edit/${p._id}`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : <Package size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 truncate">SKU: {p.sku || 'N/A'} • ₹{p.sellingPrice}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      {searchResults.customers?.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Customers</div>
                          {searchResults.customers.map(c => (
                            <Link key={c._id} to={`/customers`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                                <Users size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                                <p className="text-xs text-gray-500 truncate">{c.mobile}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.suppliers?.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Suppliers</div>
                          {searchResults.suppliers.map(s => (
                            <Link key={s._id} to={`/suppliers`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                                <Store size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                                <p className="text-xs text-gray-500 truncate">{s.mobile}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.invoices?.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Invoices</div>
                          {searchResults.invoices.map(inv => (
                            <Link key={inv._id} to={`/billing`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                                <Receipt size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{inv.invoiceNumber}</p>
                                <p className="text-xs text-gray-500 truncate">{inv.customerName} • ₹{inv.total}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {searchResults.quotations?.length > 0 && (
                        <div className="mb-2">
                          <div className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Quotations</div>
                          {searchResults.quotations.map(q => (
                            <Link key={q._id} to={`/quotations`} onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600 flex-shrink-0">
                                <FileText size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{q.quotationNumber}</p>
                                <p className="text-xs text-gray-500 truncate">{q.customerName} • ₹{q.total}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button 
                id="notification-btn"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)} 
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div id="notification-dropdown" className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((notif) => (
                        <div 
                          key={notif._id} 
                          onClick={() => handleNotificationClick(notif._id)}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 flex gap-3 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center ${notif.type === 'stock' ? 'bg-orange-100 text-orange-600' : notif.type === 'customer' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {notif.type === 'stock' ? <Package size={14} /> : notif.type === 'customer' ? <Users size={14} /> : <Settings size={14} />}
                          </div>
                          <div>
                            <p className={`text-xs ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[9px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                          </div>
                          {!notif.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0 ml-auto"></div>}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500 text-xs">
                        No notifications yet.
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-50 text-center">
                    <Link to="/settings" className="text-xs font-bold text-primary hover:underline">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-gray-200 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden text-indigo-700 flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                {userInfo?.name?.substring(0, 2) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900">{userInfo?.name || 'User'}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[80px]">{userInfo?.role || 'Admin'}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
