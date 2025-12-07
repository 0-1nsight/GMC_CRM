import { useState } from 'react';
import { LayoutDashboard, Users, Briefcase, FileText, Receipt } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Customers } from './components/Customers';
import { Services } from './components/Services';
import { Quotations } from './components/Quotations';
import { Invoices } from './components/Invoices';

type View = 'dashboard' | 'customers' | 'services' | 'quotations' | 'invoices';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as View, label: 'Customers', icon: Users },
    { id: 'services' as View, label: 'Services', icon: Briefcase },
    { id: 'quotations' as View, label: 'Quotations', icon: FileText },
    { id: 'invoices' as View, label: 'Invoices', icon: Receipt },
  ];

  function renderView() {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers />;
      case 'services':
        return <Services />;
      case 'quotations':
        return <Quotations />;
      case 'invoices':
        return <Invoices />;
      default:
        return <Dashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">CRM Pro</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
