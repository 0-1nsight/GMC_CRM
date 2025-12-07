import { X } from 'lucide-react';
import { api } from '../lib/api';

interface InvoiceViewProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceView({ invoiceId, onClose }: InvoiceViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Invoice</h1>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-gray-600">Loading invoice...</p>
      </div>
    </div>
  );
}
