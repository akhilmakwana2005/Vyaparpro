import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfile, getStaff, addStaff, deleteStaff } from '../../redux/authSlice';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../redux/notificationSlice';
import { getProducts } from '../../redux/productSlice';
import { getCustomers } from '../../redux/customerSlice';
import { getInvoices } from '../../redux/billingSlice';
import toast from 'react-hot-toast';
import { User, Store, FileText, Lock, Bell, Users, Camera, ChevronRight, Trash2, Plus, Package, Settings as SettingsIcon, Check, Database, Download, UploadCloud, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business', icon: Store },
  { id: 'gst', label: 'GST Settings', icon: FileText },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

// Generate a consistent gradient color from a string
const getAvatarGradient = (name = '') => {
  const colors = [
    ['#6366f1', '#8b5cf6'],
    ['#ec4899', '#f43f5e'],
    ['#0ea5e9', '#3b82f6'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#f97316'],
    ['#8b5cf6', '#6366f1'],
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const Profile = () => {
  const dispatch = useDispatch();
  const { userInfo, staffList, isLoading } = useSelector((state) => state.auth);
  const { notifications, isLoading: notifLoading } = useSelector((state) => state.notification || { notifications: [] });
  const { products } = useSelector((state) => state.product || { products: [] });
  const { customers } = useSelector((state) => state.customer || { customers: [] });
  const { invoices } = useSelector((state) => state.billing || { invoices: [] });
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Picture State — stored in localStorage per user
  const [avatarSrc, setAvatarSrc] = useState(null);

  // Load saved avatar from localStorage on mount
  useEffect(() => {
    if (userInfo?._id) {
      const saved = localStorage.getItem(`avatar_${userInfo._id}`);
      if (saved) setAvatarSrc(saved);
    }
  }, [userInfo?._id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Max 2MB allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setAvatarSrc(base64);
      if (userInfo?._id) {
        localStorage.setItem(`avatar_${userInfo._id}`, base64);
        // Dispatch a window event so Sidebar/Navbar can also update
        window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { userId: userInfo._id, src: base64 } }));
      }
      toast.success('Profile picture updated!');
    };
    reader.readAsDataURL(file);
  };

  // Form States
  const [profileData, setProfileData] = useState({ name: '', mobile: '', email: '' });
  const [businessData, setBusinessData] = useState({ businessName: '', businessAddress: '' });
  const [gstData, setGstData] = useState({ 
    gstNumber: '', 
    cgst: 9, 
    sgst: 9, 
    igst: 18, 
    showGstOnBills: true, 
    defaultTax: 'GST 18%' 
  });
  const [securityData, setSecurityData] = useState({ password: '', confirmPassword: '' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', mobile: '', password: '' });

  useEffect(() => {
    if (userInfo) {
      setProfileData({
        name: userInfo.name || '',
        mobile: userInfo.mobile || '',
        email: userInfo.email || '',
      });
       
      setBusinessData({
        businessName: userInfo.businessName || '',
        businessAddress: userInfo.businessAddress || '',
      });
       
      setGstData({
        gstNumber: userInfo.gstNumber || '',
        cgst: userInfo.taxSettings?.cgst || 9,
        sgst: userInfo.taxSettings?.sgst || 9,
        igst: userInfo.taxSettings?.igst || 18,
        showGstOnBills: userInfo.taxSettings?.showGstOnBills ?? true,
        defaultTax: userInfo.taxSettings?.defaultTax || 'GST 18%',
      });
    }
    if (userInfo?.role === 'owner') {
      dispatch(getStaff());
    }
  }, [userInfo, dispatch]);

  useEffect(() => {
    if (activeTab === 'notifications') {
      dispatch(getNotifications());
    }
    if (activeTab === 'data') {
      dispatch(getProducts());
      dispatch(getCustomers());
      dispatch(getInvoices());
    }
  }, [activeTab, dispatch]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err || 'Update failed');
    }
  };

  const handleUpdateBusiness = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(businessData)).unwrap();
      toast.success('Business settings updated');
    } catch (err) {
      toast.error(err || 'Update failed');
    }
  };

  const handleUpdateGST = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile({
        gstNumber: gstData.gstNumber,
        taxSettings: {
          cgst: gstData.cgst,
          sgst: gstData.sgst,
          igst: gstData.igst,
          showGstOnBills: gstData.showGstOnBills,
          defaultTax: gstData.defaultTax,
        }
      })).unwrap();
      toast.success('GST settings updated');
    } catch (err) {
      toast.error(err || 'Update failed');
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (securityData.password !== securityData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      await dispatch(updateProfile({ password: securityData.password })).unwrap();
      toast.success('Password updated successfully');
      setSecurityData({ password: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err || 'Update failed');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addStaff(newStaff)).unwrap();
      toast.success('Staff member added');
      setNewStaff({ name: '', email: '', mobile: '', password: '' });
    } catch (err) {
      toast.error(err || 'Failed to add staff');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await dispatch(deleteStaff(id)).unwrap();
        toast.success('Staff member removed');
      } catch (err) {
        toast.error(err || 'Failed to remove staff');
      }
    }
  };

  const handleExportData = async () => {
    try {
      const toastId = toast.loading('Generating backup...');
      const { data } = await axios.get('/api/backup/export', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VyaparPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Backup downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to export data');
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error(`No data available to export for ${filename}`);
      return;
    }
    
    // Flatten data slightly for CSV
    const flattenedData = data.map(item => {
      const flat = {};
      Object.keys(item).forEach(key => {
        if (typeof item[key] !== 'object') {
          flat[key] = item[key];
        } else if (Array.isArray(item[key])) {
          flat[key] = `[${item[key].length} items]`;
        } else if (item[key] && item[key]._id) {
          flat[key] = item[key]._id;
        }
      });
      return flat;
    });

    const keys = Object.keys(flattenedData[0]);
    const csvContent = [
      keys.join(','),
      ...flattenedData.map(row => keys.map(k => {
        let val = row[k] === null || row[k] === undefined ? '' : row[k];
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully!`);
  };

  const handleImportData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Importing data will OVERWRITE your entire existing database (Products, Customers, Bills, etc.). Are you absolutely sure you want to proceed?')) {
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target.result);
          const toastId = toast.loading('Importing backup...');
          
          await axios.post('/api/backup/import', json, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          });
          
          toast.success('Data imported successfully! Please reload the page.', { id: toastId });
          setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
          toast.error(err?.response?.data?.message || 'Invalid backup file or import failed');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      toast.error('Failed to read file');
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-soft p-3 flex md:flex-col gap-1 overflow-x-auto whitespace-nowrap md:overflow-x-visible">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors md:w-full ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    {tab.label}
                  </div>
                  {activeTab !== tab.id && <ChevronRight size={14} className="text-gray-300 hidden md:block" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Profile Settings</h3>
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="relative flex-shrink-0">
                  {/* Avatar — shows photo if uploaded, else gradient initials */}
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold uppercase shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${getAvatarGradient(userInfo?.name)[0]}, ${getAvatarGradient(userInfo?.name)[1]})`,
                      }}
                    >
                      {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Camera button — triggers file input */}
                  <label
                    htmlFor="avatarInput"
                    className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-soft cursor-pointer hover:bg-opacity-90 transition-colors"
                    title="Change profile picture"
                  >
                    <Camera size={13} />
                  </label>
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{userInfo?.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{userInfo?.role}</p>
                  {avatarSrc && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarSrc(null);
                        if (userInfo?._id) localStorage.removeItem(`avatar_${userInfo._id}`);
                        toast.success('Profile picture removed');
                      }}
                      className="text-xs text-red-500 mt-1 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
              <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                  <input type="tel" value={profileData.mobile} onChange={(e) => setProfileData({...profileData, mobile: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                  <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" required />
                </div>
                <div className="col-span-1 sm:col-span-2 pt-2">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Business Settings</h3>
              <form onSubmit={handleUpdateBusiness} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Shop/Business Name</label>
                  <input type="text" value={businessData.businessName} onChange={(e) => setBusinessData({...businessData, businessName: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Business Address</label>
                  <textarea value={businessData.businessAddress} onChange={(e) => setBusinessData({...businessData, businessAddress: e.target.value})} rows="3" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"></textarea>
                </div>
                <div className="col-span-1 sm:col-span-2 pt-2">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'gst' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">GST Settings</h3>
              <form onSubmit={handleUpdateGST} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GSTIN Number</label>
                  <input type="text" value={gstData.gstNumber} onChange={(e) => setGstData({...gstData, gstNumber: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary uppercase" placeholder="e.g. 22AAAAA0000A1Z5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CGST Rate (%)</label>
                    <input type="number" value={gstData.cgst} onChange={(e) => setGstData({...gstData, cgst: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SGST Rate (%)</label>
                    <input type="number" value={gstData.sgst} onChange={(e) => setGstData({...gstData, sgst: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">IGST Rate (%)</label>
                    <input type="number" value={gstData.igst} onChange={(e) => setGstData({...gstData, igst: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Default Tax Category</label>
                    <select value={gstData.defaultTax} onChange={(e) => setGstData({...gstData, defaultTax: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary bg-white">
                      <option value="GST 0%">GST 0%</option>
                      <option value="GST 5%">GST 5%</option>
                      <option value="GST 12%">GST 12%</option>
                      <option value="GST 18%">GST 18%</option>
                      <option value="GST 28%">GST 28%</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer" onClick={() => setGstData({...gstData, showGstOnBills: !gstData.showGstOnBills})}>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Show GST on Bills</p>
                    <p className="text-xs text-gray-500 mt-0.5">Include GST breakup in generated bills</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${gstData.showGstOnBills ? 'bg-primary' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${gstData.showGstOnBills ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Security</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                  <input type="password" value={securityData.password} onChange={(e) => setSecurityData({...securityData, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required minLength="6" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                  <input type="password" value={securityData.confirmPassword} onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required minLength="6" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50">
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Staff List */}
              <div className="bg-white rounded-2xl shadow-soft p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Staff Members</h3>
                {userInfo?.role !== 'owner' ? (
                  <p className="text-sm text-gray-500">Only the business owner can manage staff members.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <th className="pb-3 font-medium">Name</th>
                            <th className="pb-3 font-medium">Contact</th>
                            <th className="pb-3 font-medium">Role</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-800">
                          {staffList?.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-6 text-center text-gray-500">No staff members found.</td>
                            </tr>
                          ) : (
                            staffList?.map((staff) => (
                              <tr key={staff._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                <td className="py-4 font-medium">{staff.name}</td>
                                <td className="py-4">
                                  <div>{staff.mobile}</div>
                                  <div className="text-xs text-gray-500">{staff.email}</div>
                                </td>
                                <td className="py-4 capitalize">{staff.role}</td>
                                <td className="py-4 text-right">
                                  <button onClick={() => handleDeleteStaff(staff._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove Staff">
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Staff Form */}
                    <div className="mt-8 border-t border-gray-100 pt-8">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-primary" /> Add New Staff
                      </h4>
                      <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <input type="text" placeholder="Full Name" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required />
                        </div>
                        <div>
                          <input type="tel" placeholder="Mobile Number" value={newStaff.mobile} onChange={(e) => setNewStaff({...newStaff, mobile: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required />
                        </div>
                        <div>
                          <input type="email" placeholder="Email Address" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required />
                        </div>
                        <div>
                          <input type="password" placeholder="Password" value={newStaff.password} onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary" required minLength="6" />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50">
                            {isLoading ? 'Adding...' : 'Add Staff Member'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Data Management</h3>
              <p className="text-sm text-gray-500 mb-8">Securely backup your business data or export records for accounting.</p>

              {userInfo?.role !== 'owner' ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-200">
                  Only the business owner can manage data backups.
                </div>
              ) : (
                <div className="space-y-8">
                  {/* System Backup (JSON) */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Database size={18} className="text-blue-600" />
                      System Backup & Restore (JSON)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Export */}
                      <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50 flex flex-col items-start hover:border-gray-200 transition-colors">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                          <Download size={20} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">Export System Backup</h4>
                        <p className="text-xs text-gray-500 mb-6 flex-1">Download a full JSON database backup.</p>
                        <button 
                          onClick={handleExportData}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          <Download size={14} /> Download Backup
                        </button>
                      </div>

                      {/* Import */}
                      <div className="border border-red-100 rounded-2xl p-6 bg-red-50/30 flex flex-col items-start hover:border-red-200 transition-colors">
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4">
                          <UploadCloud size={20} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1 text-sm">Restore Backup</h4>
                        <p className="text-xs text-gray-500 mb-6 flex-1">Upload a previous VyaparPro JSON backup.</p>
                        
                        <div className="w-full relative">
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={handleImportData}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            title="Choose a backup JSON file"
                          />
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-200 bg-white text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors">
                            <UploadCloud size={14} /> Upload & Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accounting Export (CSV) */}
                  <div className="border-t border-gray-100 pt-8">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FileSpreadsheet size={18} className="text-green-600" />
                      Export Data to Excel (CSV)
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">Export specific modules in CSV format to share with your CA or use in Excel/Google Sheets.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Products CSV */}
                      <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Products</p>
                          <p className="text-xs text-gray-500">{products.length} Items</p>
                        </div>
                        <button 
                          onClick={() => exportToCSV(products, 'VyaparPro_Products')}
                          className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"
                        >
                          <Download size={14} />
                        </button>
                      </div>

                      {/* Customers CSV */}
                      <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Customers</p>
                          <p className="text-xs text-gray-500">{customers.length} People</p>
                        </div>
                        <button 
                          onClick={() => exportToCSV(customers, 'VyaparPro_Customers')}
                          className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"
                        >
                          <Download size={14} />
                        </button>
                      </div>

                      {/* Invoices CSV */}
                      <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-900">Billing History</p>
                          <p className="text-xs text-gray-500">{invoices.length} Bills</p>
                        </div>
                        <button 
                          onClick={() => exportToCSV(invoices, 'VyaparPro_Invoices')}
                          className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-soft p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell size={20} className="text-primary" /> Notifications
                </h3>
                {notifications?.some(n => !n.isRead) && (
                  <button 
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-xs font-bold flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Check size={14} /> Mark all as read
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {notifLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500">Loading notifications...</div>
                ) : notifications?.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id} 
                      className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${!notif.isRead ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-0.5 w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center ${notif.type === 'stock' ? 'bg-orange-100 text-orange-600' : notif.type === 'customer' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          {notif.type === 'stock' ? <Package size={18} /> : notif.type === 'customer' ? <Users size={18} /> : <SettingsIcon size={18} />}
                        </div>
                        <div>
                          <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <button onClick={() => dispatch(markAsRead(notif._id))} className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="Mark as read">
                            <Check size={16} />
                          </button>
                        )}
                        <button onClick={() => dispatch(deleteNotification(notif._id))} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Bell size={28} />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">No notifications</h4>
                    <p className="text-xs text-gray-500 mt-1">You are all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
