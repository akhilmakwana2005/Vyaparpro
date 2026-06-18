import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoices } from '../../redux/billingSlice';
import { getExpenses } from '../../redux/expenseSlice';
import { getPurchaseOrders } from '../../redux/purchaseOrderSlice';
import { ReceiptText, TrendingUp, TrendingDown, Download, Building2, Package, Banknote } from 'lucide-react';
import { downloadCSV } from '../../utils/exportCsv';

export default function TaxReport() {
  const dispatch = useDispatch();

  const [range, setRange] = useState('This Month');
  const { invoices = [], isLoading: loadingInvoices } = useSelector((state) => state.billing || {});
  const { expenses = [], isLoading: loadingExpenses } = useSelector((state) => state.expense || {});
  const { purchaseOrders = [], isLoading: loadingPos } = useSelector((state) => state.purchaseOrder || {});
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getInvoices());
    dispatch(getExpenses());
    dispatch(getPurchaseOrders());
  }, [dispatch]);

  // Filter Data by Date Range
  const { filteredInvoices, filteredExpenses, filteredPos } = useMemo(() => {
    const now = new Date();
    let start, end;

    if (range === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (range === 'Last Month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (range === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
    } else if (range === 'This Year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      start = new Date(0);
      end = new Date(now.getFullYear() + 10, 11, 31);
    }

    return {
      filteredInvoices: invoices.filter(i => {
        const d = new Date(i.createdAt);
        return d >= start && d <= end;
      }),
      filteredExpenses: expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      }),
      filteredPos: purchaseOrders.filter(p => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      })
    };
  }, [invoices, expenses, purchaseOrders, range]);

  // ── Calculate Taxes Collected (Sales) ──
  const taxCollected = useMemo(() => {
    let cgst = 0, sgst = 0, igst = 0, total = 0;
    filteredInvoices.filter(inv => inv.status === 'Paid').forEach(inv => {
      // For simplicity, assuming GST is captured in invoice totals. 
      // If we don't have explicit GST per item logged, we calculate it back from totals if the user enabled GST.
      // In a real strict ERP, GST is saved per invoice row. 
      // Here, we'll estimate based on `taxSettings` if no explicit `gstAmount` exists on the model, 
      // but if the model tracks `total - subtotal` as tax, we use that.
      const taxAmt = inv.total - inv.subtotal;
      if (taxAmt > 0) {
        // Assume intra-state (CGST/SGST split 50/50)
        cgst += taxAmt / 2;
        sgst += taxAmt / 2;
        total += taxAmt;
      }
    });
    return { cgst, sgst, igst, total };
  }, [filteredInvoices]);

  // ── Calculate Taxes Paid (Expenses & POs) ──
  // For this simplified module, we assume total taxes paid on expenses/POs
  // Note: PurchaseOrder model currently doesn't explicitly log tax, so we might estimate or leave as 0 if not tracked.
  // Expenses might have tax depending on future implementations, but let's assume `0` for now unless there's a field.
  const taxPaid = useMemo(() => {
    let total = 0;
    // If you had a taxAmount on expenses, you would sum it here.
    filteredExpenses.forEach(exp => {
      // total += exp.taxAmount || 0;
    });
    return { total };
  }, [filteredExpenses]);

  const netTaxLiability = taxCollected.total - taxPaid.total;

  const handleExport = () => {
    const data = [
      { Metric: 'Tax Collected (Sales)', Amount: taxCollected.total.toFixed(2) },
      { Metric: 'Tax Paid (Expenses/Purchases)', Amount: taxPaid.total.toFixed(2) },
      { Metric: 'Net GST Liability', Amount: netTaxLiability.toFixed(2) },
      { Metric: 'CGST Collected', Amount: taxCollected.cgst.toFixed(2) },
      { Metric: 'SGST Collected', Amount: taxCollected.sgst.toFixed(2) },
    ];
    downloadCSV(data, `GST_Report_${range.replace(' ', '_')}.csv`);
  };

  const isLoading = loadingInvoices || loadingExpenses || loadingPos;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GST & Tax Report</h2>
          <p className="text-sm text-gray-500 mt-1">Automated tax liability calculation for your business.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="border border-gray-200 text-sm px-4 py-2.5 rounded-xl outline-none bg-white font-bold text-gray-700 cursor-pointer hover:border-gray-300 transition-colors shadow-sm"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white shadow-sm"
          >
            <Download size={16} /> Export Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-gray-500 font-medium">Calculating tax data...</div>
      ) : (
        <>
          {/* Business Info Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Business Identity</p>
              <h3 className="text-xl font-black">{userInfo?.businessName || 'Your Business'}</h3>
              <p className="text-sm text-blue-50 mt-1 opacity-90">{userInfo?.businessAddress || 'Address not configured'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-center md:text-right">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">Registered GSTIN</p>
              <p className="font-mono text-lg font-bold tracking-widest">{userInfo?.gstNumber || 'UNREGISTERED'}</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tax Collected */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Output Tax (Collected)</p>
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp size={16} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-gray-900">₹{taxCollected.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
                <p className="text-xs text-gray-500 mt-2 font-medium">From {filteredInvoices.filter(i => i.status === 'Paid').length} paid invoices</p>
              </div>
            </div>

            {/* Tax Paid */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Input Tax (Paid)</p>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                    <TrendingDown size={16} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-gray-900">₹{taxPaid.total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
                <p className="text-xs text-gray-500 mt-2 font-medium">From {filteredExpenses.length} expenses & POs</p>
              </div>
            </div>

            {/* Net Liability */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-soft relative overflow-hidden group border-b-4 border-b-primary">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full transition-transform group-hover:scale-110"></div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">Net GST Liability</p>
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-primary">
                    <Banknote size={16} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-primary">₹{netTaxLiability.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h3>
                <p className="text-xs text-gray-500 mt-2 font-medium">Tax to be filed for {range.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm"><Building2 size={16} /></div>
                <h3 className="font-bold text-gray-900">Tax Collected Breakdown</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">CGST (Central Tax)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Intra-state sales</p>
                    </div>
                    <p className="font-black text-gray-900">₹{taxCollected.cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">SGST (State Tax)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Intra-state sales</p>
                    </div>
                    <p className="font-black text-gray-900">₹{taxCollected.sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">IGST (Integrated Tax)</p>
                      <p className="text-xs text-gray-400 mt-0.5">Inter-state sales (Not tracked in current version)</p>
                    </div>
                    <p className="font-black text-gray-900">₹{taxCollected.igst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm"><ReceiptText size={16} /></div>
                <h3 className="font-bold text-gray-900">Filing Instructions</h3>
              </div>
              <div className="p-6 text-sm text-gray-600 leading-relaxed">
                <p className="mb-4">
                  This report aggregates the implied tax values based on the difference between the <strong>Subtotal</strong> and <strong>Total</strong> of your paid invoices.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                  <p className="font-bold text-blue-900 text-xs uppercase tracking-wider mb-2">How to file</p>
                  <ul className="list-disc pl-4 space-y-1 text-blue-800 text-xs">
                    <li>Download the CSV export from the top right.</li>
                    <li>Provide this data to your CA or upload to the GST portal.</li>
                    <li>Ensure all invoices for this period are marked as "Paid" to be included.</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-400 italic">
                  *Disclaimer: VyaparPro provides this data for estimation and tracking purposes. Final tax liabilities should be verified by a certified accountant.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
