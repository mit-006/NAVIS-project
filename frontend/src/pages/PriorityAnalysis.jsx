import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { computeAllPriorities, getPriorityDistribution, getYearWiseExposedCounts, PRIORITY_LEVELS } from '../data/floodData';
import HabitationDetailPanel from '../components/HabitationDetailPanel';

const PIE_COLORS = PRIORITY_LEVELS.map((l) => l.color);

function PriorityBadge({ level, color, bg, border, score }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color, border: `1px solid ${border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
      {level}
      <span className="text-[10px] font-normal opacity-70">({score})</span>
    </span>
  );
}

export default function PriorityAnalysis({ features, selectedYear }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const ranked = useMemo(() => computeAllPriorities(features), [features]);
  const distribution = useMemo(() => getPriorityDistribution(features), [features]);
  const yearWiseExposed = useMemo(() => getYearWiseExposedCounts(features), [features]);

  const filtered = useMemo(() => {
    if (filterLevel === 'all') return ranked;
    return ranked.filter((r) => r.priority.level === filterLevel);
  }, [ranked, filterLevel]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const distData = useMemo(() =>
    PRIORITY_LEVELS.map((l) => ({ name: l.level, value: distribution[l.level] })),
    [distribution]
  );

  const totalCriticalHigh = distribution.Critical + distribution.High;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 md:px-5 py-2.5 md:py-3 flex-shrink-0 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">NAVIS Analytical Priority</h2>
            <p className="text-[10px] md:text-xs text-gray-500">Priority classification based on flood exposure, frequency, and population impact</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Filter:</label>
            <select
              value={filterLevel}
              onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              {PRIORITY_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>{l.level} ({distribution[l.level]})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">NAVIS Analytical Priority</p>
                <p className="text-xs text-amber-700 mt-1">
                  This is an analytical decision-support indicator derived from processed flood exposure data.
                  It is NOT an official government disaster-risk classification.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Priority Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={distData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {distData.map((entry, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">{totalCriticalHigh} of {features.length} habitations are Critical or High priority</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Exposure Frequency</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearWiseExposed} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Habitations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-gray-400 mt-2 text-center">Number of habitations with flood exposure in each year</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
              <h3 className="font-semibold text-gray-900 mb-3 md:mb-4">Priority Variables</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700">Max Historical Exposure</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Highest flood exposure % across all years. Weight: 40%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700">Flood Frequency</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Number of years with exposure &gt; 0. Weight: 30%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700">Population Exposure</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Max estimated exposed population as % of total. Weight: 30%</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-[10px] text-gray-400">Score = (MaxExposure × 0.4) + (Frequency% × 0.3) + (PopExposure% × 0.3)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 gap-2">
              <h3 className="font-semibold text-gray-900">
                Top Priority Habitations
                <span className="text-sm font-normal text-gray-400 ml-2">({filtered.length} results)</span>
              </h3>
              <div className="flex flex-wrap items-center gap-1">
                {PRIORITY_LEVELS.map((l) => (
                  <button
                    key={l.level}
                    onClick={() => { setFilterLevel(filterLevel === l.level ? 'all' : l.level); setPage(1); }}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors min-h-[32px] ${
                      filterLevel === l.level
                        ? 'text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                    style={filterLevel === l.level ? { backgroundColor: l.color } : {}}
                  >
                    {l.level} ({distribution[l.level]})
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase w-12">Rank</th>
                    <th className="text-left py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Habitation</th>
                    <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Pop.</th>
                    <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Max Exp.</th>
                    <th className="text-center py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Freq.</th>
                    <th className="text-right py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Est. Pop Exp.</th>
                    <th className="text-center py-2.5 px-2 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r, i) => {
                    const p = r.feature.properties;
                    const rank = (page - 1) * perPage + i + 1;
                    return (
                      <tr
                        key={p.pc11_tv_id}
                        className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => { setSelectedFeature(r.feature); setShowPanel(true); }}
                      >
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            rank <= 5 ? 'bg-red-100 text-red-700' :
                            rank <= 15 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-medium text-gray-900">{p.Name}</td>
                        <td className="py-2.5 px-2 text-right text-gray-600">{(p.TOT_P || 0).toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right">
                          <span className={`font-medium ${(p.max_flood_exposure_pct || 0) > 75 ? 'text-red-600' : (p.max_flood_exposure_pct || 0) > 50 ? 'text-orange-600' : 'text-gray-600'}`}>
                            {(p.max_flood_exposure_pct || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-xs font-medium text-gray-600">{p.flood_years_exposed || 0}/5</span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-600">{r.priority.maxExposedPop.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-center">
                          <PriorityBadge {...r.priority} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
          </div>
        </div>
      </div>

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
