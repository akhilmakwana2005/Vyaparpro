import { forwardRef } from 'react';

const InvoiceTemplate = forwardRef(({ invoice, business }, ref) => {
  if (!invoice) return null;

  const totalReturned = (invoice.returnedItems || []).reduce((s, r) => s + r.refundAmount, 0);
  const gstRate = invoice.gstAmount > 0 && invoice.subtotal > 0
    ? ((invoice.gstAmount / invoice.subtotal) * 100).toFixed(0)
    : 18;

  const statusColor = {
    Paid: '#16a34a',
    Pending: '#d97706',
    Hold: '#6b7280',
    Returned: '#dc2626',
    'Partial Return': '#ea580c',
  };

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        width: '210mm',
        minHeight: '297mm',
        padding: '14mm 14mm',
        boxSizing: 'border-box',
        color: '#1f2937',
        backgroundColor: '#fff',
        fontSize: '11px',
        lineHeight: '1.5',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #5B4CF0, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: '14px',
              }}
            >
              V
            </div>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#1f2937' }}>
              {business?.businessName || 'VyaparPro'}
            </span>
          </div>
          {business?.businessAddress && (
            <p style={{ color: '#6b7280', fontSize: '10px', maxWidth: '220px' }}>{business.businessAddress}</p>
          )}
          {business?.gstNumber && (
            <p style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>
              <strong>GST:</strong> {business.gstNumber}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #5B4CF0, #7C3AED)',
              color: '#fff',
              padding: '4px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            INVOICE
          </div>
          <div style={{ fontSize: '11px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div><strong>Invoice #:</strong> {invoice.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span
                style={{
                  background: statusColor[invoice.status] + '1a',
                  color: statusColor[invoice.status] || '#374151',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontWeight: 700,
                  fontSize: '10px',
                  border: `1px solid ${statusColor[invoice.status] || '#d1d5db'}`,
                }}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, #5B4CF0, transparent)', marginBottom: '20px' }} />

      {/* ── Bill To ── */}
      <div
        style={{
          background: '#f9fafb', borderRadius: '10px',
          padding: '14px 18px', marginBottom: '24px', border: '1px solid #f3f4f6',
        }}
      >
        <p style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Bill To
        </p>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1f2937' }}>{invoice.customerName}</p>
      </div>

      {/* ── Items Table ── */}
      <table
        style={{
          width: '100%', borderCollapse: 'collapse',
          marginBottom: '20px', fontSize: '11px',
        }}
      >
        <thead>
          <tr style={{ background: 'linear-gradient(135deg, #5B4CF0, #7C3AED)', color: '#fff' }}>
            {['#', 'Item Description', 'SKU', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
              <th
                key={h}
                style={{
                  padding: '10px 12px',
                  textAlign: i <= 1 ? 'left' : 'center',
                  fontWeight: 700, fontSize: '10px', letterSpacing: '0.05em',
                  ...(i === 5 ? { textAlign: 'right' } : {}),
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? '#fff' : '#f9fafb',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{i + 1}</td>
              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1f2937' }}>{item.name}</td>
              <td style={{ padding: '10px 12px', color: '#9ca3af', textAlign: 'center' }}>{item.sku || '—'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>₹{(item.price || 0).toLocaleString('en-IN')}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <div style={{ minWidth: '240px' }}>
          {[
            { label: 'Subtotal', value: invoice.subtotal },
            ...(invoice.gstAmount > 0 ? [{ label: `GST (${gstRate}%)`, value: invoice.gstAmount }] : []),
            ...(invoice.discount > 0 ? [{ label: 'Discount', value: -invoice.discount }] : []),
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '1px solid #f3f4f6', fontSize: '11px', color: '#6b7280',
              }}
            >
              <span>{row.label}</span>
              <span style={{ fontWeight: 600 }}>
                {row.value < 0 ? '−' : ''}₹{Math.abs(row.value || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          {/* Total */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 14px', marginTop: '6px',
              background: 'linear-gradient(135deg, #5B4CF0, #7C3AED)',
              borderRadius: '10px', color: '#fff',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '13px' }}>Grand Total</span>
            <span style={{ fontWeight: 900, fontSize: '14px' }}>₹{(invoice.total || 0).toLocaleString('en-IN')}</span>
          </div>

          {/* Return summary */}
          {totalReturned > 0 && (
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 14px', marginTop: '8px',
                background: '#fef2f2', borderRadius: '10px',
                border: '1px solid #fecaca', color: '#dc2626',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '11px' }}>Amount Returned</span>
              <span style={{ fontWeight: 800, fontSize: '12px' }}>₹{totalReturned.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Returned Items Block ── */}
      {invoice.returnedItems && invoice.returnedItems.length > 0 && (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '24px',
          }}
        >
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Credit Note — Returned Items
          </p>
          <table style={{ width: '100%', fontSize: '11px' }}>
            <thead>
              <tr style={{ color: '#9ca3af' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Item</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px' }}>Qty</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Refund</th>
              </tr>
            </thead>
            <tbody>
              {invoice.returnedItems.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #fecaca' }}>
                  <td style={{ padding: '4px 0', fontWeight: 600, color: '#374151' }}>{r.itemName}</td>
                  <td style={{ padding: '4px 0', textAlign: 'center', color: '#6b7280' }}>{r.quantity}</td>
                  <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    ₹{(r.refundAmount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: '1px solid #f3f4f6', paddingTop: '14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <p style={{ fontSize: '10px', color: '#9ca3af' }}>
          Thank you for your business! 🙏
        </p>
        <p style={{ fontSize: '10px', color: '#c4b5fd', fontWeight: 700 }}>
          Powered by VyaparPro
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
export default InvoiceTemplate;
