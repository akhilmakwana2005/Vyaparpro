import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Phone, ShoppingBag, AlertCircle, FileText, Calendar, Edit2, Trash2, Mail, MapPin, Printer, Download, Eye, Upload } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomers, updateCustomer, deleteCustomer } from '../../redux/customerSlice';
import { getInvoices } from '../../redux/billingSlice';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InvoiceTemplate from '../../components/billing/InvoiceTemplate';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { customers, isLoading } = useSelector((state) => state.customer);
  const { invoices = [], isLoading: isBillingLoading } = useSelector((state) => state.billing || {});
  const { userInfo } = useSelector((state) => state.auth || {});
  const customer = customers.find((c) => c._id === id);

  const [printingBill, setPrintingBill] = useState(null);
  const [downloadingBill, setDownloadingBill] = useState(null);

  const businessInfo = {
    name: userInfo?.businessName || 'VyaparPro',
    address: userInfo?.businessAddress || '123 Business Street, Tech City',
    phone: userInfo?.mobile || '',
    gst: userInfo?.gstNumber || ''
  };

  const printRef = useRef(null);
  const pdfRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingBill?.invoiceNumber || 'Invoice',
    onAfterPrint: () => setPrintingBill(null)
  });

  useEffect(() => {
    if (printingBill) {
      handlePrint();
    }
  }, [printingBill, handlePrint]);

  const handleDownloadPdf = (bill) => {
    setDownloadingBill(bill);
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    
    setTimeout(async () => {
      try {
        const element = pdfRef.current;
        if (element) {
          const canvas = await html2canvas(element, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${bill.invoiceNumber || 'Invoice'}.pdf`);
          
          toast.success('PDF Downloaded!', { id: 'pdf-toast' });
        } else {
          throw new Error('Template not found');
        }
      } catch (error) {
        toast.error('Failed to generate PDF', { id: 'pdf-toast' });
      } finally {
        setDownloadingBill(null);
      }
    }, 500);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    dispatch(getInvoices());
    if (customers.length === 0) {
      dispatch(getCustomers());
    }
  }, [dispatch, customers.length]);

  useEffect(() => {
    if (customer) {
      // Strip '+91 ' prefix from mobile for editing
      const rawMobile = customer.mobile?.startsWith('+91 ')
        ? customer.mobile.slice(4)
        : customer.mobile || '';
      setFormData({
        name: customer.name,
        mobile: rawMobile,
        email: customer.email || '',
        gstNumber: customer.gstNumber || '',
        openingBalance: customer.openingBalance || 0,
        address: customer.address || '',
        notes: customer.notes || '',
      });
      setPreviewImage(customer.image || null);
    }
  }, [customer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      openingBalance: Number(formData.openingBalance),
      image: previewImage,
    };
    try {
      await dispatch(updateCustomer({ id: customer._id, customerData: updatedData })).unwrap();
      toast.success('Customer updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error(err || 'Failed to update customer');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      dispatch(deleteCustomer(customer._id))
        .unwrap()
        .then(() => {
          toast.success('Customer deleted successfully!');
          navigate('/customers');
        })
        .catch((err) => toast.error(err || 'Failed to delete customer'));
    }
  };

  if (!customer && !isLoading) {
    return <div className="p-6 text-center text-gray-500">Customer not found</div>;
  }

  if (isLoading && !customer) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  const customerInvoices = invoices.filter(inv => inv.customerName === customer?.name || inv.customer === customer?._id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalBills = customerInvoices.length;
  const totalPurchase = customerInvoices.filter(i => i.status === 'Paid').reduce((a, b) => a + (b.total || 0), 0);
  const pendingPurchase = customerInvoices.filter(i => i.status === 'Pending' || i.status === 'Hold').reduce((a, b) => a + (b.total || 0), 0);
  const currentBalance = (customer?.openingBalance || 0) + pendingPurchase;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white"
            >
              <Edit2 size={16} /> Edit
            </button>
            <button 
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors bg-white"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Customer Info Card */}
        <div className="col-span-1 space-y-4">
          {isEditing ? (
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="font-bold text-gray-900 mb-4">Edit Customer</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div 
                      className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-400 cursor-pointer overflow-hidden hover:border-primary hover:text-primary transition-colors"
                      onClick={() => document.getElementById('customerImageEdit').click()}
                    >
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={20} className="mb-1" />
                          <span className="text-[10px] font-medium">Upload</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="customerImageEdit" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Opening Due (₹)</label>
                  <input type="number" name="openingBalance" value={formData.openingBalance} onChange={handleChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"></textarea>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                  <button type="submit" disabled={isLoading} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90">{isLoading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-soft p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary bg-opacity-10 text-primary text-3xl font-bold flex items-center justify-center mx-auto mb-3 overflow-hidden border border-gray-100">
                {customer.image ? (
                  <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  customer.name.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{customer.name}</h3>
              <p className="text-gray-500 text-sm">Customer</p>
              
              <div className="mt-5 space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Phone size={14} />
                  </div>
                  <span className="font-medium">{customer.mobile}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Mail size={14} />
                    </div>
                    <span className="font-medium">{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">
                      <MapPin size={14} />
                    </div>
                    <span className="font-medium mt-1.5">{customer.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                    <Calendar size={14} />
                  </div>
                  <span className="font-medium">Added on {new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/billing', { state: { preSelectedCustomer: customer } })}
                className="mt-6 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft"
              >
                New Bill
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-soft p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShoppingBag size={14} />Total Purchase
              </div>
              <span className="font-bold text-gray-900 text-sm">₹ {totalPurchase.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FileText size={14} />Total Bills
              </div>
              <span className="font-bold text-gray-900 text-sm">{totalBills}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                <AlertCircle size={14} className={currentBalance > 0 ? "text-red-500" : "text-green-500"} />
                Current Balance
              </div>
              <span className={`font-bold text-sm ${currentBalance > 0 ? "text-red-500" : "text-green-600"}`}>
                {currentBalance > 0 ? `₹ ${currentBalance.toLocaleString('en-IN')} Due` : 'Clear'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Purchase History */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-soft overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900">Purchase History</h3>
          </div>
          {isBillingLoading ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              Loading invoices...
            </div>
          ) : customerInvoices.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              No bills found for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[550px]">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                    <th className="py-3.5 px-5 text-left">Bill No.</th>
                    <th className="py-3.5 px-5 text-left">Items</th>
                    <th className="py-3.5 px-5 text-left">Amount</th>
                    <th className="py-3.5 px-5 text-left">Date</th>
                    <th className="py-3.5 px-5 text-center">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customerInvoices.map((bill) => (
                    <tr key={bill._id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <td className="py-3.5 px-5 text-primary font-medium hover:underline">{bill.invoiceNumber}</td>
                      <td className="py-3.5 px-5 text-gray-500">{bill.items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0} items</td>
                      <td className="py-3.5 px-5 font-bold text-gray-900">₹ {(bill.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3.5 px-5 text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                          bill.status === 'Pending' ? 'bg-red-100 text-red-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setPrintingBill(bill); }} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                            <Printer size={15} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDownloadPdf(bill); }} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                            <Download size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <InvoiceTemplate ref={printRef} invoiceData={printingBill} businessInfo={businessInfo} />
      </div>

      {/* Off-screen PDF Area */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
        {downloadingBill && (
          <div ref={pdfRef}>
            <InvoiceTemplate invoiceData={downloadingBill} businessInfo={businessInfo} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
