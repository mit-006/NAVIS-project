import React, { useState, useMemo } from 'react';
import { FLOOD_YEARS, getExposureCategory, filterFeatures } from '../data/floodData';
import HabitationDetailPanel from '../components/HabitationDetailPanel';

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function HabitationExplorer({ features, selectedYear, setSelectedYear }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('Name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [minExposure, setMinExposure] = useState('');
  const [maxExposure, setMaxExposure] = useState('');
  const [minPop, setMinPop] = useState('');
  const [maxPop, setMaxPop] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const perPage = 20;

  const pctKey = `flood_pct_${selectedYear}`;

  const filtered = useMemo(() => {
    let result = filterFeatures(features, { search, minPop, maxPop, minExposure, maxExposure, year: selectedYear });
    result.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'Name') { aVal = a.properties.Name; bVal = b.properties.Name; }
      else if (sortField === 'TOT_P') { aVal = a.properties.TOT_P || 0; bVal = b.properties.TOT_P || 0; }
      else if (sortField === 'exposure') { aVal = a.properties[pctKey] || 0; bVal = b.properties[pctKey] || 0; }
      else if (sortField === 'frequency') { aVal = a.properties.flood_frequency || 0; bVal = b.properties.flood_frequency || 0; }
      else if (sortField === 'max') { aVal = a.properties.max_flood_exposure_pct || 0; bVal = b.properties.max_flood_exposure_pct || 0; }
      else { aVal = a.properties[sortField] || 0; bVal = b.properties[sortField] || 0; }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return result;
  }, [features, search, sortField, sortDir, pctKey, minExposure, maxExposure, minPop, maxPop]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 md:px-5 py-2.5 md:py-3 flex-shrink-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">Habitation Explorer</h2>
            <p className="text-[10px] md:text-xs text-gray-500">{filtered.length} of 228 habitations shown</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
            >
              {FLOOD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            placeholder="Search habitation name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 flex-1 min-w-[140px] sm:flex-none sm:w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Min exp %"
            value={minExposure}
            onChange={(e) => { setMinExposure(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 w-20 sm:w-28 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max exp %"
            value={maxExposure}
            onChange={(e) => { setMaxExposure(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 w-20 sm:w-28 focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Min pop"
            value={minPop}
            onChange={(e) => { setMinPop(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 w-20 sm:w-28 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setSearch(''); setMinExposure(''); setMaxExposure(''); setMinPop(''); setPage(1); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 min-h-[32px]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th onClick={() => handleSort('Name')} className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                Name <SortIcon field="Name" sortField={sortField} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('TOT_P')} className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                Population <SortIcon field="TOT_P" sortField={sortField} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('frequency')} className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                Freq <SortIcon field="frequency" sortField={sortField} sortDir={sortDir} />
              </th>
              <th onClick={() => handleSort('max')} className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                Max % <SortIcon field="max" sortField={sortField} sortDir={sortDir} />
              </th>
              {FLOOD_YEARS.map((y) => (
                <th key={y} onClick={() => handleSort(`flood_pct_${y}`)} className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                  {y} <SortIcon field={`flood_pct_${y}`} sortField={sortField} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((f) => {
              const p = f.properties;
              const pct = p[pctKey] || 0;
              const cat = getExposureCategory(pct);
              return (
                <tr
                  key={p.pc11_tv_id}
                  className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedFeature(f); setShowPanel(true); }}
                >
                  <td className="py-2.5 px-3 font-medium text-gray-900">{p.Name}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{(p.TOT_P || 0).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-xs font-medium text-gray-600">{p.flood_years_exposed || 0}/5</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`text-xs font-medium ${(p.max_flood_exposure_pct || 0) > 75 ? 'text-red-600' : (p.max_flood_exposure_pct || 0) > 50 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {(p.max_flood_exposure_pct || 0).toFixed(1)}%
                    </span>
                  </td>
                  {FLOOD_YEARS.map((y) => {
                    const yPct = p[`flood_pct_${y}`] || 0;
                    const yCat = getExposureCategory(yPct);
                    return (
                      <td key={y} className="py-2.5 px-3 text-right">
                        {yPct > 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${yCat.color}22`, color: yCat.color === '#e5e7eb' ? '#6b7280' : yCat.color }}>
                            {yPct.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-gray-500">
            Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[32px]"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg border min-h-[32px] ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[32px]"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showPanel && selectedFeature && (
        <HabitationDetailPanel
          feature={selectedFeature}
          selectedYear={selectedYear}
          onClose={() => { setShowPanel(false); setSelectedFeature(null); }}
        />
      )}
    </div>
  );
}
