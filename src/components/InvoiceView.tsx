import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface InvoiceViewProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceView({ invoiceId, onClose }: InvoiceViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [invoices, customers] = await Promise.all([
          api.invoices.list(),
          api.customers.list(),
        ]);
        const inv = (invoices as any[]).find((x) => x.id === invoiceId) || null;
        const custMap = Object.fromEntries((customers as any[]).map((c: any) => [c.id, c]));
        const name = inv ? (custMap[inv.customer_id]?.name || null) : null;
        const invItems = await api.invoices.getItems(invoiceId);
        if (!mounted) return;
        setInvoice(inv);
        setCustomerName(name);
        setItems(invItems as any[]);
      } catch (err) {
        console.error('Failed loading invoice:', err);
        if (mounted) setError('Failed loading invoice');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [invoiceId]);

  if (loading) {
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

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Invoice</h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-red-600">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Invoice #{invoice.invoice_number}</h1>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <div className="text-sm text-gray-600">Customer: <span className="font-medium text-gray-900">{customerName}</span></div>
          <div className="text-sm text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</div>
          <div className="text-sm text-gray-600">Status: {invoice.status}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Unit Price</th>
                <th className="px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-2 text-sm text-gray-700">{it.description}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{it.quantity}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">${Number(it.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">${Number(it.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-right">
          <span className="text-lg font-semibold">Total: ${Number(invoice.total).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
