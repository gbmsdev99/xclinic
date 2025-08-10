import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  data: string;
  uid: string;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data, uid, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });
    }
  }, [data, size]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `qr-code-${uid}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <div className="text-center">
        <canvas ref={canvasRef} className="mx-auto mb-4 border border-gray-200 rounded-lg" />
        <button
          onClick={downloadQR}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download QR Code</span>
        </button>
        <p className="text-sm text-gray-600 mt-2">
          Save this QR code for quick check-in at the clinic
        </p>
      </div>
    </div>
  );
};