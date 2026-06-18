import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  getPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '../../redux/purchaseOrderSlice';
import {
  ShoppingCart, Plus, CheckCircle, Trash2, Eye,
  Clock, Package, AlertCircle, ChevronDown,
} from 'lucide-react';
import CreatePurchaseOrder from './CreatePurchaseOrder';

const StatusBadge = ({ status }) => {
  const map = {
    Pending:   'bg-amber-100 text-amber-700',
    Received:  'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-500',
  };
  const icons = {
    Pending:   <Clock size={10} />,
    Received:  <CheckCircle size={10} />,
    Cancelled: <AlertCircle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {icons[status]} {status}
    </span>
  );
};

export default function PurchaseOrderList() {
  const dispatch = useDispatch();
  const { purchaseOrders, loading } = useSelector((s) => s.purchaseOrder || {});
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    dispatch(getPurchaseOrders());
  }, [dispatch]);

  const handleMarkReceivedClick = (po) => {
    if (po.status === 'Received') return;
    setConfirmAction({ type: 'receive', po });
  };

  const handleCancelClick = (po) => {
    if (po.status === 'Received') return toast.error('Cannot cancel a received PO');
    setConfirmAction({ type: 'cancel', po });
  };

  const confirmActionHandler = async () => {
    if (!confirmAction) return;
    const { type, po } = confirmAction;
    setConfirmAction(null);

    if (type === 'receive') {
      try {
        await dispatch(updatePurchaseOrder({ id: po._id, updates: { status: 'Received' } })).unwrap();
        toast.success('PO marked as received! Stock updated.');
      } catch (err) {
        toast.error(err || 'Failed to update PO');
      }
    } else if (type === 'cancel') {
      try {
        await dispatch(deletePurchaseOrder(po._id)).unwrap();
        toast.success('Purchase order cancelled');
      } catch (err) {
        toast.error(err || 'Failed to cancel');
      }
    }
  };

  const filtered = (purchaseOrders || []).filter(
    (po) => statusFilter === 'All' || po.status === statusFilter
  );

  const stats = {
    total: purchaseOrders?.length || 0,
    pending: purchaseOrders?.filter((p) => p.status === 'Pending').length || 0,
    received: purchaseOrders?.filter((p) => p.status === 'Received').length || 0,
    totalValue: purchaseOrders?.reduce((s, p) => s + (p.totalAmount || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Purchase Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track goods ordered from suppliers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm w-fit"
        >
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total POs', value: stats.total, color: 'text-primary', bg: 'bg-primary/10', icon: ShoppingCart },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
          { label: 'Received', value: stats.received, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
          { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl shadow-soft flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['All', 'Pending', 'Received', 'Cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === f ? 'bg-primary text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <ShoppingCart size={40} strokeWidth={1} />
            <p className="text-sm font-medium">No purchase orders found</p>
            <button onClick={() => setShowCreate(true)} className="text-primary text-sm font-bold hover:underline">
              Create your first PO →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-500">
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5">Expected</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((po) => (
                  <>
                    <tr key={po._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === po._id ? null : po._id)}
                            className="text-gray-400 hover:text-primary transition-colors"
                          >
                            <ChevronDown size={14} className={`transition-transform ${expandedId === po._id ? 'rotate-180' : ''}`} />
                          </button>
                          <span className="text-sm font-bold text-gray-900">#{po.poNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-900">{po.supplierName}</p>
                        {po.supplierContact && <p className="text-xs text-gray-400">{po.supplierContact}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 font-medium">{po.items?.length || 0} item(s)</td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">₹{(po.totalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={po.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {po.status === 'Pending' && (
                            <button
                              onClick={() => handleMarkReceivedClick(po)}
                              className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              <CheckCircle size={13} /> Received
                            </button>
                          )}
                          {po.status !== 'Received' && (
                            <button
                              onClick={() => handleCancelClick(po)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === po._id && (
                      <tr key={`${po._id}-expanded`}>
                        <td colSpan={7} className="bg-gray-50 px-5 py-4">
                          <div className="max-w-2xl">
                            <p className="text-xs font-bold text-gray-500 mb-3">Order Items</p>
                            <div className="space-y-2">
                              {po.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                    {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-bold text-gray-700">Qty: {item.quantity}</p>
                                    <p className="text-xs text-gray-500">@ ₹{item.purchasePrice?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {po.notes && <p className="text-xs text-gray-500 mt-3 italic">📝 {po.notes}</p>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreatePurchaseOrder onClose={() => setShowCreate(false)} />}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmAction.type === 'receive' ? 'Mark as Received?' : 'Cancel Purchase Order?'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.type === 'receive' 
                ? `Mark PO #${confirmAction.po.poNumber} as Received? This will add stock to inventory.`
                : `Are you sure you want to cancel PO #${confirmAction.po.poNumber}?`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmActionHandler} className={`px-4 py-2 text-white rounded-xl text-sm font-bold ${confirmAction.type === 'receive' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {confirmAction.type === 'receive' ? 'Mark Received' : 'Cancel PO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
