// ─── QuotationView.tsx ────────────────────────────────────────────────────────
// Uses @react-pdf/renderer for PDF export (matching InvoiceView pattern).
// Visual UI mirrors InvoiceView layout; PDF uses QuotationPDF.tsx.
// ────────────────────────────────────────────────────────────────────────────────

import { X, Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { QuotationPDF } from './QuotationPDF';
import { api } from '../lib/api';

interface QuotationViewProps {
  quotationId: string;
  onClose: () => void;
}

export function QuotationView({ quotationId, onClose }: QuotationViewProps) {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotation, setQuotation] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerAddress, setCustomerAddress] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [quotations, customers] = await Promise.all([
          api.quotations.list(),
          api.customers.list(),
        ]);
        const qt = (quotations as any[]).find((x) => x.id === quotationId) || null;
        const custMap = Object.fromEntries((customers as any[]).map((c: any) => [c.id, c]));
        const resolvedName = qt ? (custMap[qt.customer_id]?.name || null) : null;
        const resolvedAddress = qt ? (custMap[qt.customer_id]?.address || null) : null;
        const qItems = await api.quotations.getItems(quotationId);
        if (!mounted) return;
        setQuotation(qt);
        setCustomerName(resolvedName);
        setCustomerAddress(resolvedAddress);
        setItems(qItems as any[]);
      } catch (err) {
        console.error('Failed loading quotation:', err);
        if (mounted) setError('Failed loading quotation');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [quotationId]);

  async function exportPdf() {
    if (!quotation) return;
    setIsExporting(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const gct = quotation.gct != null ? Number(quotation.gct) : subtotal * 0.165;
      const discount = quotation.discount != null ? Number(quotation.discount) : 0;
      const finalTotal = subtotal + gct - discount;

      const blob = await pdf(
        <QuotationPDF
          quotation={quotation}
          items={items}
          customerName={customerName}
          customerAddress={customerAddress}
          subtotal={subtotal}
          gct={gct}
          discount={discount}
          finalTotal={finalTotal}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = quotation.quotation_number
        ? `GMC-Quotation-${quotation.quotation_number}.pdf`
        : `quotation-${quotationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Quotation</h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-900 animate-spin" />
            <p className="text-gray-600">Loading quotation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Quotation</h1>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-red-600">{error || 'Quotation not found'}</p>
        </div>
      </div>
    );
  }

  const quotationDate = new Date(quotation.date);
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const gct = quotation.gct != null ? Number(quotation.gct) : subtotal * 0.165;
  const discount = quotation.discount != null ? Number(quotation.discount) : 0;
  const finalTotal = subtotal + gct - discount;

  const statusColor =
    quotation.status === 'accepted'
      ? 'bg-green-100 text-green-700 border border-green-300'
      : quotation.status === 'draft'
      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      : quotation.status === 'rejected'
      ? 'bg-red-100 text-red-700 border border-red-300'
      : 'bg-blue-100 text-blue-700 border border-blue-300';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page-level toolbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quotation <span className="text-[#003366]">#{quotation.quotation_number}</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-md text-sm font-medium hover:bg-blue-900 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* QUOTATION BODY (UI) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#003366] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                GMC Haulage Co. Ltd.
              </h2>
              <p className="text-blue-200 text-xs italic mt-1 tracking-wide">
                "You Provide The Work -- Let Us Do The Haul"
              </p>
            </div>
            <div className="flex items-center justify-center bg-white rounded-lg px-3 py-2 shadow-inner">
              <img
                src="/src/assets/logo.avif"
                alt="GMC Haulage Logo"
                className="h-10 w-auto object-contain"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          </div>
          <div className="mt-4 border-t border-blue-400 opacity-40" />
        </div>

        {/* META */}
        <div className="px-6 pt-4 pb-3">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">
                Quotation Details
              </p>
              <table className="text-sm w-full">
                <tbody>
                  {[
                    ['Quotation No.', quotation.quotation_number],
                    ['Issue Date', !isNaN(quotationDate.getTime())
                      ? quotationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'],
                    ['Valid Until', quotation.valid_until
                      ? new Date(quotation.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '30 Days Net'],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="text-gray-500 pr-3 py-0.5 align-top whitespace-nowrap">{label}:</td>
                      <td className="font-semibold text-gray-900 py-0.5">{value}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="text-gray-500 pr-3 py-0.5 align-middle">Status:</td>
                    <td className="py-0.5">
                      <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                        {quotation.status || 'Draft'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">
                Prepared For
              </p>
              <p className="text-sm font-bold text-gray-900 mb-1">{customerName || '--'}</p>
              <div className="text-xs text-gray-600 leading-relaxed">
                {(customerAddress || '').split(',').map((part, i) => (
                  <p key={i}>{part.trim()}</p>
                ))}
                <p>{quotation.customer_country || 'Jamaica'}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">
                Service
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {quotation.service_description || 'Waste Management & Specialized Haulage'}
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 mb-0.5">Period</p>
                  <p className="font-bold text-gray-900">
                    {!isNaN(quotationDate.getTime())
                      ? quotationDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500 mb-0.5">Quotation Date</p>
                  <p className="font-bold text-gray-900">
                    {!isNaN(quotationDate.getTime())
                      ? quotationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="px-6 pb-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-tl-md w-8 text-center">#</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide">Description</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-center w-16">Qty</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-right w-28">Unit Price</th>
                <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-right w-28 rounded-tr-md">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr
                  key={it.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                >
                  <td className="px-3 py-2 text-center text-gray-400 text-xs font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{it.description}</td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-800 text-xs">{it.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700 text-xs">${Number(it.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900 text-xs">${Number(it.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS + SIGNATURE */}
        <div className="px-6 pt-3 pb-4">
          <div className="flex justify-between items-end gap-8">
            <div className="flex-shrink-0 w-64">
              <div className="relative h-24 w-full">
                <img
                  src="/src/assets/seal.png"
                  className="absolute top-6 left-16 w-28 h-28 opacity-[0.15] pointer-events-none select-none"
                  alt=""
                />
                <img
                  src="/src/assets/sig.png"
                  className="absolute bottom-[-1.8rem] left-0 h-16 w-auto object-contain"
                  alt="Managing Director Signature"
                />
              </div>
              <div className="border-b-2 border-gray-700 mb-2" />
              <p className="text-xs font-bold uppercase text-[#003366]">Managing Director</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Authorized Signature</p>
            </div>
            <div className="w-72 flex-shrink-0">
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 flex justify-between text-sm border-b border-gray-200">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-900">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between text-sm border-b border-gray-200">
                  <span className="text-gray-600">GCT (16.5%)</span>
                  <span className="font-semibold text-gray-900">${gct.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {discount > 0 && (
                  <div className="px-4 py-2.5 flex justify-between text-sm border-b border-gray-200 bg-green-50">
                    <span className="text-green-700">Discount</span>
                    <span className="font-semibold text-green-600">-${discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="bg-[#003366] px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-white text-xs font-bold uppercase tracking-wide">Total Quote</p>
                    <p className="text-blue-200 text-[10px]">Subject to acceptance</p>
                  </div>
                  <p className="text-white text-xl font-black">${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {quotation.notes && (
          <div className="px-8 pb-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-xs font-bold uppercase text-amber-800 mb-1 tracking-wide">Notes</h4>
              <p className="text-sm text-amber-900">{quotation.notes}</p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-6 py-4 border-t-2 border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-2 border-b border-blue-100 pb-1">
                Corporate Tax
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Reg No: <span className="font-bold text-gray-900">104880</span></p>
                <p>TRN No: <span className="font-bold text-gray-900">002933136</span></p>
                <p>Email: <a href="mailto:info@gmchaulageltd.com" className="text-blue-600 font-medium">info@gmchaulageltd.com</a></p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#003366] uppercase tracking-widest mb-2 border-b border-blue-100 pb-1">
                Bank Transfer
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Bank: <span className="font-bold text-gray-900">First Global (May Pen)</span></p>
                <p>Account: <span className="font-bold text-gray-900">991001002662</span></p>
                <p>Type: <span className="font-bold text-gray-900">Business Savings</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
