import { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

interface Customer {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  unit_price: number;
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
  quantity: number;
  unit_price: number;
  total: number;
}

export function QuotationForm({ quotation, onClose, onSave }: QuotationFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    quotation_number: '',
    date: new Date().toISOString().split('T')[0],
    valid_until: '',
    status: 'draft',
    notes: '',
  });
  const [items, setItems] = useState<LineItem[]>([
    { service_id: null, description: '', quantity: 1, unit_price: 0, total: 0 },
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
      date: quotation.date,
      valid_until: quotation.valid_until || '',
      status: quotation.status,
      notes: quotation.notes || '',
    });

    try {
      const data = await api.quotations.getItems(quotation.id);
      if (data && data.length > 0) {
        setItems(data.map((item: any) => ({
          id: item.id,
          service_id: item.service_id,
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total: Number(item.total),
        })));
      }
    } catch (error) {
      console.error('Error loading quotation items:', error);
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
        description: service.name,
        unit_price: Number(service.unit_price),
        total: Number(service.unit_price) * newItems[index].quantity,
      };
      setItems(newItems);
    }
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
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
    return items.reduce((sum, item) => sum + Number(item.total), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const total = calculateTotal();

      if (quotation) {
        await api.quotations.update(quotation.id, { ...formData, total });

        for (const item of items.filter(i => i.id)) {
          await api.quotationItems.delete(item.id!);
        }

        const itemsToInsert = items.map(item => ({
          quotation_id: quotation.id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));

        for (const item of itemsToInsert) {
          await api.quotationItems.create(item);
        }
      } else {
        const newQuotation = await api.quotations.create({ ...formData, total });

        const itemsToInsert = items.map(item => ({
          quotation_id: (newQuotation as any).id,
          service_id: item.service_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));

        for (const item of itemsToInsert) {
          await api.quotationItems.create(item);
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving quotation:', error);
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
              <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg">
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service</label>
                  <select
                    value={item.service_id || ''}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Custom item</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-3 md:col-span-1 flex items-end">
                  <div className="text-sm font-semibold text-gray-900 py-2">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {quotation ? 'Update' : 'Create'} Quotation
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
