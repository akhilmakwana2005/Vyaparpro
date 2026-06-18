import { forwardRef } from 'react';

const QuotationTemplate = forwardRef(({ quotation, business }, ref) => {
  if (!quotation) return null;

  const gstRate = quotation.gstAmount > 0 && quotation.subtotal > 0
    ? ((quotation.gstAmount / quotation.subtotal) * 100).toFixed(0)
    : 18;

  // Colors based on the provided image
  const primaryDark = '#1B3568';
  const primaryLight = '#2E81BA';
  const primaryLighter = '#6CB8E1';
  const grayBg = '#ECEFF2';
  
  return (
    <div
      ref={ref}
      style={{
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '11px',
        lineHeight: '1.5',
        overflow: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* ── Top Header Shapes ── */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '140px', background: primaryDark, borderBottomLeftRadius: '50px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '40px' }}>
        <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '2px', margin: 0, zIndex: 10 }}>ESTIMATE:</h1>
        
        {/* Abstract graphics inside header */}
        <div style={{ position: 'absolute', right: '40px', top: '20px', width: '60px', height: '60px', borderRadius: '50%', background: primaryLighter, opacity: 0.9 }}></div>
        <div style={{ position: 'absolute', right: '0', top: '0', width: '80px', height: '140px', background: primaryLight, borderBottomLeftRadius: '40px' }}></div>
        <div style={{ position: 'absolute', right: '10px', top: '90px', display: 'flex', gap: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B3568' }}></div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1B3568' }}></div>
        </div>
      </div>

      <div style={{ padding: '40px 40px 0 40px', position: 'relative', zIndex: 1 }}>
        {/* Logo Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50% 50% 0 50%', background: primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: primaryDark }}></div>
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111', lineHeight: 1, textTransform: 'uppercase' }}>
              {business?.businessName?.split(' ')[0] || 'LOGO'}
            </h2>
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#111', lineHeight: 1, textTransform: 'uppercase' }}>
              {business?.businessName?.split(' ').slice(1).join(' ') || 'HERE'}
            </h2>
          </div>
        </div>

        {/* Info Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 800, color: primaryLight, textTransform: 'uppercase' }}>Estimate To:</p>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 700, color: '#111' }}>{quotation.customerName}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', color: '#555' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: primaryLight }}></div>
              <span>{quotation.customerPhone || 'Mobile No. Provided'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#555' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: primaryLight }}></div>
              <span>{quotation.customerAddress || 'Address on file'}</span>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'right', color: '#555', fontSize: '10px' }}>
            <p style={{ margin: '0 0 4px 0' }}><strong>Estimate No:</strong> {quotation.quotationNumber}</p>
            <p style={{ margin: '0 0 4px 0' }}><strong>Estimate Date:</strong> {new Date(quotation.createdAt).toLocaleDateString('en-IN')}</p>
            {quotation.validUntil && (
              <p style={{ margin: 0 }}><strong>Valid Until:</strong> {new Date(quotation.validUntil).toLocaleDateString('en-IN')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Body Split */}
      <div style={{ display: 'flex', minHeight: '350px' }}>
        
        {/* Left Sidebar (Gray) */}
        <div style={{ width: '35%', background: grayBg, padding: '40px 30px', borderTopRightRadius: '40px', borderBottomRightRadius: '40px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 800, color: '#111', textTransform: 'uppercase' }}>Payment<br/>Method</h4>
            <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '10px' }}>Bank Account</p>
            <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: '10px' }}>UPI</p>
            <p style={{ margin: 0, color: '#555', fontSize: '10px' }}>Cash / Check</p>
          </div>

          <div>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: 800, color: '#111', textTransform: 'uppercase' }}>Terms &<br/>Conditions:</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '9px', lineHeight: '1.6' }}>
              {quotation.notes || 'This estimate is valid for 15 days from the date of issue. Prices are subject to change based on market availability. Goods once sold cannot be returned unless agreed upon in writing. Subject to local jurisdiction.'}
            </p>
          </div>
        </div>

        {/* Right Content (Table) */}
        <div style={{ width: '65%', padding: '30px 40px 0 30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ borderTop: `2px solid ${primaryDark}`, borderBottom: `2px solid ${primaryDark}` }}>
                <th style={{ padding: '15px 0', textAlign: 'left', fontWeight: 800, color: '#111', width: '45%' }}>PRODUCT</th>
                <th style={{ padding: '15px 0', textAlign: 'center', fontWeight: 800, color: '#111' }}>PRICE</th>
                <th style={{ padding: '15px 0', textAlign: 'center', fontWeight: 800, color: '#111' }}>QTY</th>
                <th style={{ padding: '15px 0', textAlign: 'right', fontWeight: 800, color: '#111' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px 0', color: '#444' }}>{item.name}</td>
                  <td style={{ padding: '15px 0', textAlign: 'center', color: '#444' }}>₹{(item.price || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '15px 0', textAlign: 'center', color: '#444' }}>{item.quantity}</td>
                  <td style={{ padding: '15px 0', textAlign: 'right', color: '#444' }}>₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: `2px solid ${primaryDark}`, paddingBottom: '15px', marginBottom: '40px' }}>
            <div style={{ width: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#111' }}>SUB TOTAL</span>
                <span style={{ color: '#444' }}>₹{(quotation.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#111' }}>TAX ({gstRate}%)</span>
                <span style={{ color: '#444' }}>₹{(quotation.gstAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              {quotation.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#111' }}>DISCOUNT</span>
                  <span style={{ color: '#444' }}>- ₹{(quotation.discount || 0).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, color: '#111' }}>TOTAL</span>
                <span style={{ fontWeight: 800, color: '#111' }}>₹{(quotation.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <p style={{ margin: '0 0 10px 0', color: '#111', fontWeight: 600 }}>{business?.businessName || 'VyaparPro Business'}</p>
              {/* Fake signature line */}
              <div style={{ fontFamily: "'Brush Script MT', cursive, sans-serif", fontSize: '24px', color: primaryDark, borderBottom: '1px solid #ccc', paddingBottom: '5px', marginBottom: '5px', width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic' }}>
                Approved
              </div>
              <p style={{ margin: 0, fontWeight: 800, color: '#111' }}>Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Shapes ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', background: primaryDark, display: 'flex', alignItems: 'center' }}>
        {/* Left abstract graphics */}
        <div style={{ position: 'absolute', bottom: 0, left: '40px', width: '80px', height: '100%', background: primaryLight, borderTopLeftRadius: '20px', borderTopRightRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ width: '40%', height: '50%', background: primaryLighter }}></div>
            <div style={{ width: '100%', height: '30%', background: primaryDark, display: 'flex', padding: '5px', boxSizing: 'border-box', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></div>
            </div>
        </div>
        
        {/* Right circles */}
        <div style={{ position: 'absolute', right: '80px', top: '30px', width: '40px', height: '40px', borderRadius: '50%', background: primaryLighter }}></div>
        <div style={{ position: 'absolute', right: '-30px', bottom: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: primaryLight, opacity: 0.8 }}></div>

        {/* Contact Info */}
        <div style={{ marginLeft: '160px', color: '#fff', fontSize: '11px', zIndex: 10 }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 600 }}>+91 {business?.phone || '123 456 7890'}</p>
          <p style={{ margin: '0 0 5px 0' }}>hello@{business?.businessName?.replace(/\s+/g, '').toLowerCase() || 'company'}.com</p>
          <p style={{ margin: 0 }}>www.{business?.businessName?.replace(/\s+/g, '').toLowerCase() || 'company'}.com</p>
        </div>
      </div>
      
    </div>
  );
});

QuotationTemplate.displayName = 'QuotationTemplate';
export default QuotationTemplate;
