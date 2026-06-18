import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const BarcodeScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!isOpen) return;

    let scanner = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        aspectRatio: 1.0,
      },
      false
    );

    const onScan = (decodedText) => {
      // Pause scanner briefly on success to prevent multiple scans
      scanner.pause();
      toast.success(`Scanned: ${decodedText}`);
      onScanSuccess(decodedText);
      
      // Close the modal and cleanup after a short delay
      setTimeout(() => {
        onClose();
        try {
          scanner.clear();
        } catch(e) {}
      }, 500);
    };

    const onError = (errorMessage) => {
      // Ignore background errors as it constantly reports 'not found'
      // console.warn(errorMessage);
    };

    try {
      scanner.render(onScan, onError);
    } catch (err) {
      console.error(err);
      setError('Could not start camera. Please ensure permissions are granted.');
    }

    return () => {
      try {
        scanner.clear();
      } catch (err) {
        console.error('Failed to clear scanner on unmount', err);
      }
    };
  }, [isOpen, onScanSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="bg-gray-900 px-4 py-3 flex justify-between items-center text-white">
          <h3 className="font-bold">Scan Barcode / QR Code</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 flex flex-col items-center">
          {error && <div className="text-red-500 text-sm mb-4 text-center font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}
          
          <div id="reader" className="w-full bg-black rounded-xl overflow-hidden border-2 border-gray-200"></div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Point your camera at the product barcode.<br/> Make sure there is enough light.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
