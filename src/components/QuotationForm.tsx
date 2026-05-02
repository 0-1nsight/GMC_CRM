import { useEffect, useState } from 'react';
import { X, Plus, Trash2, CreditCard as Edit } from 'lucide-react';
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

interface Quotation {
  id: string;
  customer_id: string;
  quotation_number: string;
  date: string;
  valid_until: string | null;
  status: string;
  notes: string | null;
  total: number;
  discount?: number;
}

interface QuotationFormProps {
  quotation: Quotation | null;
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

export function QuotationForm({ quotation, onClose, onSave }: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_number: '',
    date: new Date().toISOString().split('T')[0],
    valid_until: '',
    status: 'draft',
    discount: 0,
    notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([
    { service_id: null, description: '', quantity: 1, quantityMode: 'number', unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    loadCustomers();
    loadServices();
    if (quotation) {
      loadQuotationData();
    } else {
      generateQuotationNumber();
    }
  }, [quotation]);

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

  async function loadQuotationData() {
    if (!quotation) return;
    setFormData({
      customer_id: quotation.customer_id,
      quotation_number: quotation.quotation_number,
      date: formatDateForInput(quotation.date),
      valid_until: formatDateForInput(quotation.valid_until),
      status: quotation.status,
      discount: (quotation as any).discount || 0,
      notes: quotation.notes || '',
    });

    try {
      const data = await api.quotations.getItems(quotation.id);
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
      console.error('Error loading quotation data:', error);
    }
  }

  async function generateQuotationNumber() {
    try {
      const data = await api.quotations.list();
      let newNumber = 'Q-1001';
      if (data && data.length > 0) {
        const quotations = data as any[];
        const lastNumber = parseInt(quotations[0].quotation_number.split('-')[1]);
        newNumber = `Q-${lastNumber + 1}`;
      }
      setFormData(prev => ({ ...prev, quotation_number: newNumber }));
    } catch (error) {
      console.error('Error generating quotation number:', error);
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
        quantity: service.unit || '',
        quantityMode: 'unit',
        total: Number(service.unit_price) || 0,
      };
      setItems(newItems);
    }
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    const mode = newItems[index].quantityMode || 'number';
    if (field === 'quantity' || field === 'unit_price') {
      if (mode === 'unit') {
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
      item.quantityMode = 'number';
      item.quantity = 1;
      item.total = Number(item.unit_price) * Number(item.quantity);
    } else {
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
    const discountValue = Number((formData as any).discount || 0) || 0;
    return subtotal - discountValue;
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

      if (quotation) {
        await api.quotations.update(quotation.id, { ...formData, total, gct });

        try {
          const existing = await api.quotations.getItems(quotation.id);
          if (Array.isArray(existing)) {
            for (const dbItem of existing) {
              if (dbItem && dbItem.id) {
                await api.quotationItems.delete(dbItem.id);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to delete existing quotation items:', err);
        }

        const itemsToInsert = items.map(item => ({
          quotation_id: quotation.id,
          service_id: item.service_id,
          description: item.description,
          quantity: Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0),
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || ((Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0)) * Number(item.unit_price) || 0),
        }));

        for (const item of itemsToInsert) {
          await api.quotationItems.create(item);
        }
      } else {
        const newQuotation = await api.quotations.create({ ...formData, total, gct });

        const itemsToInsert = items.map(item => ({
          quotation_id: (newQuotation as any).id,
          service_id: item.service_id,
          description: item.description,
          quantity: Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0),
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || ((Number(item.quantity) || (item.quantityMode === 'unit' ? 1 : 0)) * Number(item.unit_price) || 0),
        }));

        for (const item of itemsToInsert) {
          await api.quotationItems.create(item);
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving quotation:', error);
      setSubmitError('Failed to save quotation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {quotation ? 'Edit Quotation' : 'New Quotation'}
        </h1>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quotation Details</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Number *</label>
              <input
                type="text"
                required
                value={formData.quotation_number}
                onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
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
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <input
                type="number"
                step="1.00"
                min="0"
                value={(formData as any).discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
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

                {/* Service Column with Edit toggle */}
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1 ml-10">Service</label>
                  <div className="flex items-center gap-2">
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

                {/* Description */}
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

                {/* Quantity */}
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

                {/* Unit Price */}
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

                {/* Total & Trash */}
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
            {submitting ? 'Saving...' : (quotation ? 'Update' : 'Create') + ' Quotation'}
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
