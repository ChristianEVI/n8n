import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FlaskConical, ExternalLink, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react';
import { searchMolecules, fetchMolecule } from '../lib/api';
import { formatDate, daysSince, getTimelineDotClass, cn } from '../lib/utils';

type SortKey = 'inquiry_date' | 'client_name' | 'project_key' | 'inquiry_type';
type SortDir = 'asc' | 'desc';

export default function MoleculeSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedInn, setSelectedInn] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<{ inn: string; brand_name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('inquiry_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: moleculeData, isLoading } = useQuery({
    queryKey: ['molecule', selectedInn],
    queryFn: () => fetchMolecule(selectedInn),
    enabled: !!selectedInn,
  });

  useEffect(() => {
    if (query.length >= 2) {
      searchMolecules(query).then(results => {
        setSuggestions(results);
        setShowSuggestions(true);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  function selectMolecule(inn: string) {
    setSelectedInn(inn);
    setQuery(inn);
    setShowSuggestions(false);
    setSearchParams({ q: inn });
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  const sortedInquiries = moleculeData?.inquiries ? [...moleculeData.inquiries].sort((a: Record<string, string>, b: Record<string, string>) => {
    const va = a[sortKey] || '';
    const vb = b[sortKey] || '';
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  }) : [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const thresholdDate = twelveMonthsAgo.toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Molecule Search</h1>
        <p className="text-sm text-gray-500 mt-1">Search by INN or brand name to see all inquiries</p>
      </div>

      {/* Search */}
      <div className="card p-5">
        <div className="relative max-w-xl">
          <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search INN or brand name (e.g. rituximab, Herceptin)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onMouseDown={() => selectMolecule(s.inn)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="badge-blue font-mono text-xs">{s.inn}</span>
                  {s.brand_name && <span className="text-xs text-gray-500">{s.brand_name}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="card p-8 text-center text-sm text-gray-400">Loading...</div>
      )}

      {moleculeData && !isLoading && (
        <div className="space-y-5">
          {/* Molecule Card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="kpi-icon bg-blue-500 flex-shrink-0">
                <FlaskConical className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 capitalize">{selectedInn}</h2>
                {moleculeData.lookup && (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                    {moleculeData.lookup.brand_name && (
                      <span><span className="font-medium">Brand:</span> {moleculeData.lookup.brand_name}</span>
                    )}
                    {moleculeData.lookup.atc_code && (
                      <span><span className="font-medium">ATC:</span> {moleculeData.lookup.atc_code}</span>
                    )}
                    {moleculeData.lookup.is_biosimilar !== undefined && (
                      <span className={cn('badge', moleculeData.lookup.is_biosimilar ? 'badge-orange' : 'badge-blue')}>
                        {moleculeData.lookup.is_biosimilar ? 'Biosimilar' : 'Originator'}
                      </span>
                    )}
                    {moleculeData.lookup.ema_url && (
                      <a
                        href={moleculeData.lookup.ema_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        EMA Link
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 flex-shrink-0 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{moleculeData.stats?.total_inquiries || 0}</div>
                  <div className="text-xs text-gray-400">Total Inquiries</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{moleculeData.stats?.unique_clients || 0}</div>
                  <div className="text-xs text-gray-400">Unique Clients</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700">{formatDate(moleculeData.stats?.first_inquiry)}</div>
                  <div className="text-xs text-gray-400">First Inquiry</div>
                  <div className="text-xs font-medium text-gray-700 mt-1">{formatDate(moleculeData.stats?.last_inquiry)}</div>
                  <div className="text-xs text-gray-400">Last Inquiry</div>
                </div>
              </div>
            </div>

            {/* Re-engagement alert */}
            {moleculeData.reEngagement?.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <span className="font-medium">{moleculeData.reEngagement.length} client(s)</span> haven't inquired about {selectedInn} in over 12 months.
                  These rows are highlighted below.
                </div>
              </div>
            )}
          </div>

          {/* Customer Timeline Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Customer Inquiry Timeline</h3>
              <span className="badge-gray">{sortedInquiries.length} entries</span>
            </div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('inquiry_date')} className="cursor-pointer">
                      <span className="flex items-center gap-1">Date <SortIcon col="inquiry_date" /></span>
                    </th>
                    <th onClick={() => handleSort('project_key')}>
                      <span className="flex items-center gap-1">Project <SortIcon col="project_key" /></span>
                    </th>
                    <th onClick={() => handleSort('client_name')}>
                      <span className="flex items-center gap-1">Client <SortIcon col="client_name" /></span>
                    </th>
                    <th>Contact</th>
                    <th onClick={() => handleSort('inquiry_type')}>
                      <span className="flex items-center gap-1">Type <SortIcon col="inquiry_type" /></span>
                    </th>
                    <th>Quantity</th>
                    <th>Qualified</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInquiries.map((inq: Record<string, string>, i: number) => {
                    const isReEngagement = inq.inquiry_date && inq.inquiry_date < thresholdDate;
                    const days = daysSince(inq.inquiry_date);
                    return (
                      <tr key={i} className={isReEngagement ? 'bg-yellow-50' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={getTimelineDotClass(inq.inquiry_type)} />
                            <span>{formatDate(inq.inquiry_date)}</span>
                            {isReEngagement && (
                              <span title={`${days} days ago`}>
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-primary">{inq.project_key}</td>
                        <td className="font-medium">{inq.client_name || '—'}</td>
                        <td className="text-gray-500">{inq.contact_name || '—'}</td>
                        <td>
                          {inq.inquiry_type ? (
                            <span className={cn('badge text-xs', inq.inquiry_type.toLowerCase().includes('stock') ? 'badge-green' : 'badge-blue')}>
                              {inq.inquiry_type}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="text-gray-500">{inq.quantity || '—'}</td>
                        <td>
                          {inq.qualified ? (
                            <span className={cn('badge', inq.qualified.toLowerCase() === 'yes' || inq.qualified === '1' ? 'badge-green' : 'badge-gray')}>
                              {inq.qualified}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedInquiries.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No inquiries found for this molecule.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedInn && !isLoading && (
        <div className="card p-16 text-center">
          <FlaskConical className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Search for a molecule to see its inquiry history and customer list.</p>
        </div>
      )}
    </div>
  );
}
