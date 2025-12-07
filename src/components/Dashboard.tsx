import { useEffect, useState } from 'react';
import { Users, FileText, Receipt, Briefcase } from 'lucide-react';
import { api } from '../lib/api';

interface Stats {
  customers: number;
  services: number;
  quotations: number;
  invoices: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    services: 0,
    quotations: 0,
    invoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [customers, services, quotations, invoices] = await Promise.all([
        api.customers.list(),
        api.services.list(),
        api.quotations.list(),
        api.invoices.list(),
      ]);

      setStats({
        customers: customers.length,
        services: services.length,
        quotations: quotations.length,
        invoices: invoices.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Customers', value: stats.customers, icon: Users, color: 'bg-blue-500' },
    { label: 'Services', value: stats.services, icon: Briefcase, color: 'bg-green-500' },
    { label: 'Quotations', value: stats.quotations, icon: FileText, color: 'bg-yellow-500' },
    { label: 'Invoices', value: stats.invoices, icon: Receipt, color: 'bg-red-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
