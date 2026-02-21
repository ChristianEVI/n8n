import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FlaskConical, Building2, FolderSearch,
  Mail, Upload, Settings, ChevronLeft, ChevronRight,
  Search, Microscope,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { searchAccounts, searchMolecules, searchInquiries } from '../lib/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/molecules', icon: FlaskConical, label: 'Molecule Search' },
  { to: '/accounts', icon: Building2, label: 'Accounts' },
  { to: '/projects', icon: FolderSearch, label: 'Projects' },
  { to: '/emails', icon: Mail, label: 'Email & Tasks' },
  { to: '/import', icon: Upload, label: 'Data Import' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SearchResult {
  type: 'molecule' | 'account' | 'project';
  label: string;
  sublabel?: string;
  id?: string | number;
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    try {
      const [molecules, accounts, projects] = await Promise.all([
        searchMolecules(q),
        searchAccounts(q),
        searchInquiries(q),
      ]);

      const results: SearchResult[] = [
        ...molecules.slice(0, 3).map((m: { inn: string; brand_name: string }) => ({
          type: 'molecule' as const,
          label: m.inn,
          sublabel: m.brand_name || undefined,
          id: m.inn,
        })),
        ...accounts.slice(0, 3).map((a: { id: number; name: string; inquiry_count: number }) => ({
          type: 'account' as const,
          label: a.name,
          sublabel: `${a.inquiry_count} inquiries`,
          id: a.id,
        })),
        ...projects.slice(0, 3).map((p: { project_key: string; client_name: string }) => ({
          type: 'project' as const,
          label: p.project_key,
          sublabel: p.client_name,
          id: p.project_key,
        })),
      ];

      setSearchResults(results);
      setSearchOpen(results.length > 0);
    } catch {
      setSearchResults([]);
    }
  }

  function handleResultClick(result: SearchResult) {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'molecule') {
      navigate(`/molecules?q=${encodeURIComponent(result.id as string)}`);
    } else if (result.type === 'account') {
      navigate(`/accounts?id=${result.id}`);
    } else {
      navigate(`/projects?q=${encodeURIComponent(result.id as string)}`);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-gray-200', collapsed && 'justify-center')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-primary leading-tight">aRMP CRM</div>
              <div className="text-xs text-gray-400">Sales Intelligence</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive', collapsed && 'justify-center px-2')
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center p-3 border-t border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search molecules, accounts, projects..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary"
            />
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleResultClick(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0',
                      r.type === 'molecule' ? 'bg-blue-100 text-blue-700' :
                      r.type === 'account' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    )}>
                      {r.type === 'molecule' ? 'MOL' : r.type === 'account' ? 'ACC' : 'PRJ'}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{r.label}</div>
                      {r.sublabel && <div className="text-xs text-gray-500">{r.sublabel}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
