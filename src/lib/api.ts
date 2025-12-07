const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  customers: {
    list: () => request('/customers'),
    create: (data: any) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),
  },
  services: {
    list: () => request('/services'),
    create: (data: any) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/services/${id}`, { method: 'DELETE' }),
  },
  quotations: {
    list: () => request('/quotations'),
    create: (data: any) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/quotations/${id}`, { method: 'DELETE' }),
    getItems: (quotationId: string) => request(`/quotation-items/quotation/${quotationId}`),
  },
  quotationItems: {
    create: (data: any) => request('/quotation-items', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/quotation-items/${id}`, { method: 'DELETE' }),
  },
  invoices: {
    list: () => request('/invoices'),
    create: (data: any) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/invoices/${id}`, { method: 'DELETE' }),
    getItems: (invoiceId: string) => request(`/invoice-items/invoice/${invoiceId}`),
  },
  invoiceItems: {
    create: (data: any) => request('/invoice-items', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/invoice-items/${id}`, { method: 'DELETE' }),
  },
};
