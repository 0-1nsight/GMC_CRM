import { useEffect, useState } from 'react';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { api } from '../lib/api';

interface Customer {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  unit: string;
}

interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  date: string;
  due_date: string | null;
  status: string;
  notes: string | null;
  total: number;
  credit?: number;
}

interface InvoiceFormProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSave: () => void;
}

interface LineItem {
  id?: string;
  service_id: string | null;
  description: string;
  quantity: number | string;
  quantityMode?: 'unit' | 'number';
  unit_price: number;
  total: number;
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function InvoiceForm({ invoice, onClose, onSave }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    credit: 0,
    notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([
    { service_id: null, description: '', quantity: 1, quantityMode: 'number', unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    loadCustomers();
    loadServices();
    if (invoice) {
      loadInvoiceData()
    } else {
      generateInvoiceNumber();
    }
  }, [invoice]);

  async function loadCustomers() {
    try {
      const data = await api.customers.list();
      setCustomers(data as Customer[]);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async function loadServices() {
    try {
      const data = await api.services.list();
      setServices(data as Service[]);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  }

  async function loadInvoiceData() {
    if (!invoice) return;
      setFormData({
        customer_id: invoice.customer_id,
        invoice_number: invoice.invoice_number,
        date: formatDateForInput(invoice.date),
        due_date: formatDateForInput(invoice.due_date),
        status: invoice.status,
        credit: (invoice as any).credit || 0,
        notes: invoice.notes || '',
      });

      try {
        const data = await api.invoices.getItems(invoice.id);
        if (data && data.length > 0) {
          setItems(data.map((item: any) => ({
            id: item.id,
            service_id: item.service_id,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            total: Number(item.total) || (Number(item.quantity) * Number(item.unit_price)) || 0,
          })));
        }
      } catch (error) {
        console.error('Error loading invoice data:', error);
      }
  }

  async function generateInvoiceNumber() {
    try {
      const data = await api.invoices.list();
      let newNumber = 'INV-202601';
      if (data && data.length > 0) {
        const invoices = data as any[];
        const lastNumber = parseInt(invoices[0].invoice_number.split('-')[1]);
        newNumber = `INV-${lastNumber + 1}`;
      }
      setFormData(prev => ({ ...prev, invoice_number: newNumber }));
    } catch (error) {
      console.error('Error generating invoice number:', error);
    }
  }

  function handleServiceChange(index: number, serviceId: string) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        service_id: serviceId,
        description: service.description,
        unit_price: Number(service.unit_price),
        // default to unit mode and show the service unit in quantity column
        quantity: service.unit || '',
        quantityMode: 'unit',
        // when in unit mode, total represents one unit
        total: Number(service.unit_price) || 0,
      };
      setItems(newItems);
    }
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recompute total depending on whether quantity is numeric or a unit string
    const mode = newItems[index].quantityMode || 'number';
    if (field === 'quantity' || field === 'unit_price') {
      if (mode === 'unit') {
        // unit mode: treat as 1 unit
        newItems[index].total = Number(newItems[index].unit_price) || 0;
      } else {
        newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
      }
    }

    setItems(newItems);
  }

  function toggleQuantityMode(index: number) {
    const newItems = [...items];
    const item = newItems[index];
    if (!item) return;
    if (item.quantityMode === 'unit') {
      // switch to numeric mode
      item.quantityMode = 'number';
      item.quantity = 1;
      item.total = Number(item.unit_price) * Number(item.quantity);
    } else {
      // switch to unit mode, try to set unit from services list
      const svc = services.find(s => s.id === item.service_id);
      item.quantityMode = 'unit';
      item.quantity = svc?.unit || '';
      item.total = Number(item.unit_price) || 0;
    }
    setItems(newItems);
  }

  function addItem() {
    setItems([...items, { service_id: null, description: '', quantity: 1, unit_price: 0, total: 0 }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function calculateTotal() {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const creditValue = Number((formData as any).credit || 0) || 0;
    return subtotal - creditValue;
  }

  function calculateGct() {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    return Number((subtotal * 0.165).toFixed(2));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const total = calculateTotal();
      const gct = calculateGct();

      if (invoice) {
        await api.invoices.update(invoice.id, { ...formData, total, gct });

        // Delete existing DB items for this invoice, then re-insert current form items
        try {
          const existing = await api.invoices.getItems(invoice.id);
          if (Array.isArray(existing)) {
            for (const dbItem of existing) {
              if (dbItem && dbItem.id) {
                await api.invoiceItems.delete(dbItem.id);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to delete existing invoice items:', err);
        }

        const itemsToInsert = items.map(item => ({
          invoice_id: invoice.id,
          service_id: item.service_id,
          description: item.description,
          // always send a numeric quantity (unit-mode -> 1)
          quantity: Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0),
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || ((Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0)) * Number(item.unit_price) || 0),
        }));

        for (const item of itemsToInsert) {
          await api.invoiceItems.create(item);
        }
      } else {
        const newInvoice = await api.invoices.create({ ...formData, total, gct });

        const itemsToInsert = items.map(item => ({
          invoice_id: (newInvoice as any).id,
          service_id: item.service_id,
          description: item.description,
          quantity: Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0),
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || ((Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0)) * Number(item.unit_price) || 0),
        }));

        for (const item of itemsToInsert) {
          await api.invoiceItems.create(item);
        }
      }

      onSave(); 
    } catch (error) {
      console.error('Error saving invoice:', error);
      setSubmitError('Failed to save invoice. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {invoice ? 'Edit Invoice' : 'New Invoice'}
        </h1>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
              <input
                type="text"
                required
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              {/* <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label> */}
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit / Discount</label>
              <input
                type="number"
                step="1.00"
                min="0"
                value={(formData as any).credit}
                onChange={(e) => setFormData({ ...formData, credit: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center p-4 bg-gray-50 rounded-lg">
                
                {/* 1. Edit Button - span 1 */}
                {/* <div className="col-span-1 flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => toggleQuantityMode(index)}
                    title={item.quantityMode === 'unit' ? 'Switch to numeric quantity' : 'Switch to unit quantity'}
                    className="p-1 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div> */}

                {/* 2. Service - span 2 (Reduced from 3) */}
                {/* <div className="col-span-12 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={item.service_id || ''}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Custom item</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div> */}
                {/* 1. Service Column */}
      <div className="col-span-12 md:col-span-3">
        <label className="block text-xs font-medium text-gray-700 mb-1 ml-10">Service</label>
        <div className="flex items-center gap-2">
          {/* Edit Button next to Select */}
          <button
            type="button"
            onClick={() => toggleQuantityMode(index)}
            title={item.quantityMode === 'unit' ? 'Switch to numeric quantity' : 'Switch to unit quantity'}
            className="p-2 bg-white border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 flex-shrink-0"
          >
            <Edit className="w-4 h-4" />
          </button>

          <select
            value={item.service_id || ''}
            onChange={(e) => handleServiceChange(index, e.target.value)}
            className="flex-1 min-w-0 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Custom item</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name}</option>
            ))}
          </select>
        </div>
      </div>




                {/* 3. Description - span 3 (Reduced from 4) */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 4. Quantity - span 2 */}
                <div className="col-span-6 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                  {item.quantityMode === 'unit' ? (
                    <div className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {String(item.quantity || '')}
                    </div>
                  ) : (
                    <input
                      type="number"
                      required
                      value={Number(item.quantity)}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  )}
                </div>

                {/* 5. Unit Price - span 2 */}
                <div className="col-span-6 md:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>

                {/* 6. Total & Trash - span 2 (Combined to force same line) */}
                <div className="col-span-12 md:col-span-2 flex items-end justify-between md:justify-end gap-3 pb-1">
                  <div className="text-right">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Total</label>
                    <div className="text-sm font-bold text-gray-900">
                      ${item.total.toFixed(2)}
                    </div>
                  </div>
                  
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{submitError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {submitting ? 'Saving...' : (invoice ? 'Update' : 'Create') + ' Invoice'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
