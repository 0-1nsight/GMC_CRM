import { X, Download, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../lib/api';
import { Customers } from './Customers';

interface InvoiceViewProps {
  invoiceId: string;
  onClose: () => void;
}

export function InvoiceView({ invoiceId, onClose }: InvoiceViewProps) {
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerAddress, setCustomerAddress] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

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
        const customerAddress = inv ? (custMap[inv.customer_id]?.address || null) : null;
        const invItems = await api.invoices.getItems(invoiceId);
        if (!mounted) return;
        setInvoice(inv);
        setCustomerName(name);
        setCustomerAddress(customerAddress);
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

  async function exportPdf() {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(printRef.current, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const name = invoice?.invoice_number ? `GMC-Invoice-${invoice.invoice_number}.pdf` : `invoice-${invoiceId}.pdf`;
      pdf.save(name);
    } catch (err) {
      console.error('Export PDF failed', err);
    } finally {
      setIsExporting(false);
    }
  }

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
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-900 animate-spin" />
            <p className="text-gray-600">Loading invoice...</p>
          </div>
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

  const invoiceDate = new Date(invoice.date);
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const gct = invoice.gct !== undefined ? Number(invoice.gct) : (subtotal * 0.165);
  const credit = invoice.credit !== undefined ? Number(invoice.credit) : 200;
  const finalTotal = subtotal + gct - credit;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Invoice #{invoice.invoice_number}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportPdf} 
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-md text-sm hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Centered Full Width Header */}
        <div className="mb-10 pb-6 border-b-2 border-[#003366] text-center">
          <h2 className="text-3xl font-black text-[#003366] leading-tight">GMC Haulage Co. LTD.</h2>
          <p className="text-xs italic text-gray-500 uppercase tracking-wider mt-1">
            "You Provide The Work: Let Us Do The Haul"
          </p>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left Column: Details & Billed To */}
          <div className="space-y-6">
             <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm max-w-md">
              <span className="text-gray-600 font-medium">Invoice Number:</span>
              <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
              
              <span className="text-gray-600 font-medium">Date of Issue:</span>
              <span className="font-bold text-gray-900">
                {!isNaN(invoiceDate.getTime()) ? invoiceDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>

              <span className="text-gray-600 font-medium">Payment Terms:</span>
              <span className="font-bold text-gray-900">{invoice.terms || "5"} Days Net</span>
              
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`font-bold uppercase text-xs ${invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {invoice.status || 'Pending'}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#003366] mt-6">
              <h3 className="text-xs font-bold text-[#003366] uppercase mb-3 tracking-wider">Billed To:</h3>
              <p className="text-lg font-bold text-gray-900 mb-1">{customerName}</p>
              <div className="text-sm text-gray-600">
                {/* Split address into multiple paragraph tags */}
                {(customerAddress || 'Address Test').split(',').map((part, index) => (
                  <p key={index} className="mt-2 capitalize">
                    {part.trim().toLocaleLowerCase()}
                  </p>
                ))}

                {/* Added mt-2 here to create the separation you wanted for the country */}
                <p className="mt-2">{invoice.customer_country || 'Jamaica'}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Logo & Service Info */}
          <div className="flex flex-col items-end">
            <img src="/src/assets/logo.avif" alt="GMC Logo" className="w-40 h-auto mb-6" />
            
            <div className="w-full bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mt-6">
              <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 tracking-wider">Invoice For:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 font-medium block">Service:</span>
                  <span className="text-gray-900 font-semibold">{invoice.service_description || 'Waste Management & Specialized Haulage'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-gray-600 font-medium block text-xs">Period:</span>
                    <span className="text-gray-900 font-bold">{!isNaN(invoiceDate.getTime()) ? invoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium block text-xs">Billing Date:</span>
                    <span className="text-gray-900 font-bold">
                      {!isNaN(invoiceDate.getTime()) ? invoiceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#003366] text-white">
                <th className="px-4 py-3 text-xs uppercase font-bold">Description</th>
                <th className="px-4 py-3 text-xs uppercase font-bold text-center w-20">Quantity</th>
                <th className="px-4 py-3 text-xs uppercase font-bold text-right w-32">Unit Price</th>
                <th className="px-4 py-3 text-xs uppercase font-bold text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{it.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center font-semibold">{it.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">${Number(it.unit_price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">${Number(it.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Signature Block */}
        <div className="flex justify-between items-end mb-12">
          {/* Managing Director Signature & Seal */}
          <div className="relative">
            <img 
              src="/src/assets/seal.png" 
              className="absolute -top-8 left-8 w-40 h-40 opacity-20 pointer-events-none" 
              alt="Official Seal" 
            />
            
            {/* <div className="w-64 border-b-2 border-gray-800 mb-2">
              <img 
                src="/src/assets/sig.png" 
                className="h-16 mb-2" 
                alt="Managing Director Signature" 
            
              />
            </div> */}

            <div className="w-64 border-b-2 border-gray-800 mb-2 flex items-end">
              <img 
                src="/src/assets/sig.png" 
                className="h-16" 
                alt="Managing Director Signature" 
              />
            </div>
            
            <p className="text-xs font-bold uppercase text-[#003366]">Managing Director</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Authorized Signature</p>
          </div>

          {/* Totals Section */}
          <div className="w-80 space-y-3">
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">Subtotal:</span>
              <span className="text-sm font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">GCT (16.5%):</span>
              <span className="text-sm font-semibold text-gray-900">${gct.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between items-center bg-[#003366] text-white px-6 py-4 rounded-lg shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase">Total Due:</span>
                <span className="text-[10px] opacity-80">Payable to GMC Haulage Co. LTD.</span>
              </div>
              <span className="text-2xl font-bold">${finalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-2 bg-red-50 rounded-lg border border-red-200 mt-2">
              <span className="text-sm text-red-700 font-medium">Credit Applied:</span>
              <span className="text-sm font-semibold text-red-600">-${credit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t-2 border-gray-200">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-right text-xs">
            <div className="space-y-1 text-left">
              <h4 className="text-[#003366] font-bold uppercase text-xs mb-2 border-b border-blue-100 pb-1">Corporate Tax</h4>
              <p className="text-gray-600">Reg No: <span className="text-gray-900 font-bold">104880</span></p>
              <p className="text-gray-600">TRN No: <span className="text-gray-900 font-bold">002933136</span></p>
              <p className="text-gray-600">Email: <span className="text-blue-600 font-medium">info@gmchaulageltd.com</span></p>
            </div>
            <div className="space-y-1">
              <h4 className="text-[#003366] font-bold uppercase text-xs mb-2 border-b border-blue-100 pb-1">Bank Transfer</h4>
              <p className="text-gray-600">Bank: <span className="text-gray-900 font-bold">First Global (May Pen)</span></p>
              <p className="text-gray-600">Account: <span className="text-gray-900 font-bold">991001002662</span></p>
              <p className="text-gray-600">Type: <span className="text-gray-900 font-bold">Business Savings</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}