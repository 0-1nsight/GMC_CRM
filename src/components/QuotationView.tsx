import { X, Download, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  const printRef = useRef<HTMLDivElement | null>(null);

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
        const q = (quotations as any[]).find((x) => x.id === quotationId) || null;
        const custMap = Object.fromEntries((customers as any[]).map((c: any) => [c.id, c]));
        const name = q ? (custMap[q.customer_id]?.name || null) : null;
        const qItems = await api.quotations.getItems(quotationId);
        if (!mounted) return;
        setQuotation(q);
        setCustomerName(name);
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
    if (!printRef.current) return;
    setIsExporting(true);

    try {
      // 1. Capture the main content and footer separately
      const element = printRef.current;
      const footerElement = document.getElementById('pdf-footer');
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Exclude footer from the main capture to prevent double-rendering
        ignoreElements: (el) => el.id === 'pdf-footer'
      });

      let footerCanvas = null;
      if (footerElement) {
        footerCanvas = await html2canvas(footerElement, { scale: 2, backgroundColor: '#ffffff' });
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate content dimensions
      const imgProps = (pdf as any).getImageProperties(imgData);
      const contentHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Footer height logic
      const footerHeight = footerCanvas ? (footerCanvas.height * pdfWidth) / footerCanvas.width : 0;
      const margin = 10;
      const pageContentHeight = pdfHeight - footerHeight - (margin * 2);

      let heightLeft = contentHeightInPdf;
      let position = 0;

      while (heightLeft > 0) {
        // Add content slice
        pdf.addImage(imgData, 'PNG', 0, position + margin, pdfWidth, contentHeightInPdf);
        
        // Add White Mask and Footer to every page
        if (footerCanvas) {
          // Masking rectangle to prevent content overlapping footer
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, pdfHeight - footerHeight - margin, pdfWidth, footerHeight + margin, 'F');
          
          pdf.addImage(
            footerCanvas.toDataURL('image/png'),
            'PNG',
            0,
            pdfHeight - footerHeight - 5,
            pdfWidth,
            footerHeight
          );
        }

        heightLeft -= pageContentHeight;
        position -= pageContentHeight;

        if (heightLeft > 0) {
          pdf.addPage();
        }
      }

      const name = quotation?.quotation_number ? `GMC-Quotation-${quotation.quotation_number}.pdf` : `quotation-${quotationId}.pdf`;
      pdf.save(name);
    } catch (err) {
      console.error('Export PDF failed', err);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) { /* ... same as your current loading state ... */ }

  const quotationDate = new Date(quotation.date);
  const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const gct = quotation.gct !== undefined ? Number(quotation.gct) : (subtotal * 0.165);
  const discount = quotation.discount !== undefined ? Number(quotation.discount) : 0;
  const finalTotal = subtotal + gct - discount;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Quotation #{quotation.quotation_number}</h1>
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

      {/* Main Document Container */}
      <div ref={printRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Centered Header */}
        <div className="mb-10 pb-6 border-b-2 border-[#003366] text-center">
          <h2 className="text-3xl font-black text-[#003366] leading-tight">GMC Haulage Co. LTD.</h2>
          <p className="text-xs italic text-gray-500 uppercase tracking-wider mt-1">
            "You Provide The Work: Let Us Do The Haul"
          </p>
        </div>

        {/* Quotation Meta Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
             <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm max-w-md">
              <span className="text-gray-600 font-medium">Quotation Number:</span>
              <span className="font-bold text-gray-900">{quotation.quotation_number}</span>
              <span className="text-gray-600 font-medium">Date of Issue:</span>
              <span className="font-bold text-gray-900">
                {!isNaN(quotationDate.getTime()) ? quotationDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
              <span className="text-gray-600 font-medium">Valid Until:</span>
              <span className="font-bold text-gray-900">
                {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '30 days from issue'}
              </span>
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`font-bold uppercase text-xs ${
                quotation.status === 'accepted' ? 'text-green-600' : 
                quotation.status === 'pending' ? 'text-yellow-600' : 
                quotation.status === 'rejected' ? 'text-red-600' :
                'text-gray-900'
              }`}>
                {quotation.status || 'Pending'}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#003366]">
              <h3 className="text-xs font-bold text-[#003366] uppercase mb-3 tracking-wider">Prepared For:</h3>
              <p className="text-lg font-bold text-gray-900 mb-1">{customerName}</p>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p>{quotation.customer_address || 'Address Line 1'}</p>
                <p>{quotation.customer_city || 'City, Parish'}</p>
                <p>{quotation.customer_country || 'Jamaica'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <img src="/src/assets/logo.avif" alt="GMC Logo" className="w-40 h-auto mb-6" />
            <div className="w-full bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
              <h3 className="text-xs font-bold text-blue-900 uppercase mb-3 tracking-wider">Quotation For:</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 font-medium block">Service:</span>
                  <span className="text-gray-900 font-semibold">{quotation.service_description || 'Waste Management & Specialized Haulage'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-gray-600 font-medium block text-xs">Quotation Month:</span>
                    <span className="text-gray-900 font-bold">{!isNaN(quotationDate.getTime()) ? quotationDate.toLocaleString('default', { month: 'long' }) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium block text-xs">Quotation Year:</span>
                    <span className="text-gray-900 font-bold">{!isNaN(quotationDate.getTime()) ? quotationDate.getFullYear() : 'N/A'}</span>
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
                <tr key={it.id} className="hover:bg-gray-50 break-inside-avoid">
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
        <div className="flex justify-between items-end mb-12 break-inside-avoid">
          <div className="relative">
            <img 
              src="/src/assets/seal.png" 
              className="absolute -top-16 left-4 w-32 opacity-20 pointer-events-none" 
              alt="Official Seal" 
            />
            <div className="w-64 border-b-2 border-gray-800 mb-2 mt-8"></div>
            <p className="text-xs font-bold uppercase text-[#003366]">Managing Director</p>
            <p className="text-[10px] text-gray-500 font-semibold mt-1">Authorized Signature</p>
          </div>

          <div className="w-80 space-y-3">
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">Subtotal:</span>
              <span className="text-sm font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center px-4 py-2">
                <span className="text-sm text-gray-600 font-medium">Discount:</span>
                <span className="text-sm font-semibold text-green-600">-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">GCT (16.5%):</span>
              <span className="text-sm font-semibold text-gray-900">${gct.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-300 my-2"></div>
            <div className="flex justify-between items-center bg-[#003366] text-white px-6 py-4 rounded-lg shadow-sm">
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase">Total Quote:</span>
                <span className="text-[10px] opacity-80">Subject to acceptance</span>
              </div>
              <span className="text-2xl font-bold">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 break-inside-avoid">
          <h4 className="text-xs font-bold text-[#003366] uppercase mb-3 tracking-wider">Terms & Conditions:</h4>
          <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
            <li>This quotation is valid for 30 days from the date of issue</li>
            <li>Prices are subject to change without notice after the validity period</li>
            <li>Payment terms: {quotation.payment_terms || '50% deposit, balance on completion'}</li>
            <li>Services to be rendered as described in the quotation details</li>
            <li>All prices are in Jamaican Dollars (JMD) and include GCT where applicable</li>
          </ul>
        </div>

        {/* Persistent Footer */}
        <div id="pdf-footer" className="pt-8 border-t-2 border-gray-200 mt-auto">
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