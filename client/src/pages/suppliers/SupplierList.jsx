import { useState, useEffect } from 'react';
import { Search, Download, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, ChevronDown, User, FileText, Phone, Mail, MapPin, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../redux/supplierSlice';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/exportCsv';

const SupplierList = () => {
  const dispatch = useDispatch();

  const { suppliers = [], isLoading } = useSelector((state) => state.supplier || {});

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    email: '',
    gstNumber: '',
    openingBalance: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(getSuppliers());
  }, [dispatch]);

  const handleOpenDrawer = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || '',
        contactPerson: supplier.contactPerson || '',
        mobile: supplier.mobile || '',
        email: supplier.email || '',
        gstNumber: supplier.gstNumber || '',
        openingBalance: supplier.openingBalance || '',
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '', contactPerson: '', mobile: '', email: '', gstNumber: '', openingBalance: '', address: '', notes: ''
      });
    }
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingSupplier(null);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        openingBalance: formData.openingBalance ? Number(formData.openingBalance) : 0,
      };

      if (editingSupplier) {
        await dispatch(updateSupplier({ id: editingSupplier._id, data: submitData })).unwrap();
        toast.success('Supplier updated successfully!');
      } else {
        await dispatch(createSupplier(submitData)).unwrap();
        toast.success('Supplier added successfully!');
      }
      handleCloseDrawer();
    } catch (error) {
      toast.error(error || 'Failed to save supplier');
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      dispatch(deleteSupplier(id))
        .unwrap()
        .then(() => toast.success('Supplier deleted successfully!'))
        .catch((err) => toast.error(err || 'Failed to delete supplier'));
    }
  };

  const filtered = suppliers.filter(s => {
    if (!s) return false;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                       (s.mobile && s.mobile.includes(search)) ||
                       (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedSuppliers = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExport = () => {
    const data = filtered.map(s => ({
      'Supplier Name': s.name,
      'Contact Person': s.contactPerson || '',
      'Mobile': s.mobile || '',
      'Email': s.email || '',
      'GST Number': s.gstNumber || '',
      'Opening Balance': s.openingBalance || 0,
      'Address': s.address || '',
      'Added On': new Date(s.createdAt).toLocaleDateString()
    }));
    downloadCSV(data, 'suppliers_list.csv');
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your vendors and track payables.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
            <Download size={16} /> Export List
          </button>
          <button onClick={() => handleOpenDrawer()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-colors shadow-soft">
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Total Suppliers</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{suppliers.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Active Suppliers</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-green-500">{suppliers.filter(s => s.openingBalance >= 0).length}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Total Payables Due</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-red-500">₹{suppliers.reduce((acc, curr) => acc + (curr.openingBalance || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Supplier Table ── */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-gray-100 gap-4">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search suppliers by name or mobile..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none transition-colors w-full bg-gray-50/50"
            />
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-700">{filtered.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}–{Math.min(page * itemsPerPage, filtered.length)}</span> of{' '}
            <span className="font-bold text-gray-700">{filtered.length}</span>
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3.5 px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Supplier Name</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Contact Person</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Mobile</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">GST / Tax Info</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Balance Due</th>
              <th className="text-right py-3.5 px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">Loading suppliers...</td>
              </tr>
            ) : paginatedSuppliers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">No suppliers found.</td>
              </tr>
            ) : (
              paginatedSuppliers.map((supplier, idx) => (
                <tr
                  key={supplier._id}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${idx === paginatedSuppliers.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-bold text-sm items-center justify-center flex flex-shrink-0">
                        {supplier.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{supplier.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{supplier.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700 font-medium">{supplier.contactPerson || '—'}</td>
                  <td className="py-4 px-4 text-sm text-gray-700 font-medium">{supplier.mobile}</td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-medium text-gray-500">{supplier.gstNumber || 'Unregistered'}</span>
                  </td>
                  <td className="py-4 px-4">
                    {supplier.openingBalance > 0 ? (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                        ₹{supplier.openingBalance.toLocaleString('en-IN')} Due
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                        Cleared
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenDrawer(supplier)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(supplier._id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Supplier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <button className="flex items-center gap-1 font-bold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg">
                {itemsPerPage} <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), Math.min(totalPages, page + 1)).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    page === n ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-Over Drawer for Add/Edit ── */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={handleCloseDrawer} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button onClick={handleCloseDrawer} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body (Form) */}
            <div className="flex-1 overflow-y-auto p-6">
              <form id="supplierForm" onSubmit={handleSaveSupplier} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><User size={13} /> Supplier / Company Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Enter company name" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><User size={13} /> Contact Person</label>
                    <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone size={13} /> Mobile Number *</label>
                    <input type="tel" required value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="10-digit number" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><Mail size={13} /> Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="supplier@example.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><FileText size={13} /> GST Number</label>
                    <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase" placeholder="GSTIN" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">Opening Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                      <input type="number" value={formData.openingBalance} onChange={(e) => setFormData({...formData, openingBalance: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="0.00" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin size={13} /> Billing Address</label>
                  <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} rows="3" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Enter full address" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5"><FileText size={13} /> Additional Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="2" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Any remarks" />
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3 justify-end">
              <button onClick={handleCloseDrawer} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button type="submit" form="supplierForm" disabled={isLoading} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-opacity-90 transition-colors shadow-soft disabled:opacity-50 flex items-center gap-2">
                {isLoading ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Save Supplier')}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default SupplierList;
