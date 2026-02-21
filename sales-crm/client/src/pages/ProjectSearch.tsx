import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderSearch } from 'lucide-react';
import { searchInquiries, fetchInquiry } from '../lib/api';
import { formatDate, getTimelineDotClass, cn } from '../lib/utils';

export default function ProjectSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [suggestions, setSuggestions] = useState<{ project_key: string; client_name: string; inquiry_date: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKey, setSelectedKey] = useState(searchParams.get('q') || '');

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', selectedKey],
    queryFn: () => fetchInquiry(selectedKey),
    enabled: !!selectedKey,
  });

  useEffect(() => {
    if (query.length >= 3) {
      searchInquiries(query).then(r => {
        setSuggestions(r);
        setShowSuggestions(true);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  function selectProject(key: string) {
    setSelectedKey(key);
    setQuery(key);
    setShowSuggestions(false);
    setSearchParams({ q: key });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Search</h1>
        <p className="text-sm text-gray-500 mt-1">Search by project number to view full inquiry details</p>
      </div>

      <div className="card p-5">
        <div className="relative max-w-xl">
          <FolderSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search project number (e.g. aRMP-2023-042)..."
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
                  onMouseDown={() => selectProject(s.project_key)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <span className="font-mono text-sm text-primary font-medium">{s.project_key}</span>
                  <div className="text-right">
                    <div className="text-xs font-medium text-gray-700">{s.client_name}</div>
                    <div className="text-xs text-gray-400">{formatDate(s.inquiry_date)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && <div className="card p-8 text-center text-sm text-gray-400">Loading...</div>}

      {projectData && !isLoading && (
        <div className="space-y-4">
          {/* Project Header */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <FolderSearch className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 font-mono">{projectData.project_key}</h2>
                  <span className="badge-blue">
                    {projectData.inquiries?.length || 0} product{projectData.inquiries?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {projectData.inquiries?.[0] && (
                  <div className="mt-2 flex gap-4 text-sm text-gray-600">
                    <span>
                      Client: <strong className="text-gray-900">{projectData.inquiries[0].client_name}</strong>
                    </span>
                    <span>
                      Date: <strong className="text-gray-900">{formatDate(projectData.inquiries[0].inquiry_date)}</strong>
                    </span>
                    <span>
                      Source: <span className={cn('badge badge-gray text-xs')}>{projectData.inquiries[0].data_source}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Molecules requested */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Products Requested</h3>
            </div>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>INN</th>
                    <th>Brand</th>
                    <th>Raw Drug</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Qualified</th>
                    <th>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {(projectData.inquiries || []).map((inq: Record<string, string>, i: number) => (
                    <tr key={i}>
                      <td className="font-medium capitalize">{inq.inn || '—'}</td>
                      <td>{inq.brand_name || '—'}</td>
                      <td className="text-gray-500 text-xs max-w-[150px] truncate" title={inq.drug_raw}>{inq.drug_raw || '—'}</td>
                      <td>
                        {inq.inquiry_type ? (
                          <span className={cn('badge text-xs', inq.inquiry_type.toLowerCase().includes('stock') ? 'badge-green' : 'badge-blue')}>
                            {inq.inquiry_type}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{inq.quantity || '—'}</td>
                      <td>
                        {inq.qualified ? (
                          <span className={cn('badge text-xs', inq.qualified.toLowerCase() === 'yes' ? 'badge-green' : 'badge-gray')}>
                            {inq.qualified}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={cn('badge text-xs',
                          inq.item_type === 'INN' ? 'badge-blue' :
                          inq.item_type === 'BRAND' ? 'badge-orange' : 'badge-gray'
                        )}>
                          {inq.item_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional details */}
          {projectData.inquiries?.[0] && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {projectData.inquiries[0].contact_name && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Contact</div>
                    <div className="text-gray-900">{projectData.inquiries[0].contact_name}</div>
                    {projectData.inquiries[0].contact_email && (
                      <div className="text-xs text-gray-500">{projectData.inquiries[0].contact_email}</div>
                    )}
                  </div>
                )}
                {projectData.inquiries[0].transportation && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Transportation</div>
                    <div className="text-gray-900">{projectData.inquiries[0].transportation}</div>
                  </div>
                )}
                {projectData.inquiries[0].intended_use && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Intended Use</div>
                    <div className="text-gray-900">{projectData.inquiries[0].intended_use}</div>
                  </div>
                )}
                {projectData.inquiries[0].ema_active_substance && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">EMA Active Substance</div>
                    <div className="text-gray-900">{projectData.inquiries[0].ema_active_substance}</div>
                  </div>
                )}
                {projectData.inquiries[0].ema_atc_code && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">ATC Code</div>
                    <div className="text-gray-900">{projectData.inquiries[0].ema_atc_code}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedKey && !isLoading && (
        <div className="card p-16 text-center">
          <FolderSearch className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Enter a project number to view its details.</p>
        </div>
      )}
    </div>
  );
}
