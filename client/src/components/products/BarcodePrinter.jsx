import { forwardRef } from 'react';
import Barcode from 'react-barcode';

const BarcodePrinter = forwardRef(({ product, quantity = 1, businessName = 'VyaparPro' }, ref) => {
  if (!product || !product.sku) return null;

  // Generate array of length 'quantity'
  const labels = Array.from({ length: quantity });

  return (
    <div
      ref={ref}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '10mm',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8mm 4mm',
          alignContent: 'start'
        }}
      >
        {labels.map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px dashed #e5e7eb',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              height: '35mm',
              overflow: 'hidden'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textAlign: 'center', color: '#1f2937' }}>
              {businessName}
            </div>
            
            <Barcode 
              value={product.sku} 
              width={1.2} 
              height={30} 
              fontSize={10} 
              margin={0} 
              displayValue={true} 
            />
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              width: '100%', 
              marginTop: '4px',
              padding: '0 8px',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                {product.name}
              </span>
              <span style={{ fontSize: '10px', fontWeight: '900', color: '#111827' }}>
                ₹{product.sellingPrice}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

BarcodePrinter.displayName = 'BarcodePrinter';
export default BarcodePrinter;
