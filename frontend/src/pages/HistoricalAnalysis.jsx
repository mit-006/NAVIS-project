import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Legend } from 'recharts';
import { FLOOD_YEARS, computeAllYearStats } from '../data/floodData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
      <div className="mb-3 md:mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function HistoricalAnalysis({ features, allStats }) {
  const chartData = useMemo(() => {
    if (!allStats) return [];
    return FLOOD_YEARS.map((year) => ({
      year: year.toString(),
      exposed: allStats[year].exposedHabitations,
      nonExposed: allStats[year].nonExposedHabitations,
      avgExposure: Number(allStats[year].avgExposure.toFixed(1)),
      maxExposure: Number(allStats[year].maxExposure.toFixed(1)),
      exposedPop: allStats[year].totalExposedPop,
      rate: Number(allStats[year].exposureRate.toFixed(1)),
    }));
  }, [allStats]);

  const yearSummaryData = useMemo(() => {
    if (!allStats) return [];
    return FLOOD_YEARS.map((year) => ({
      year,
      ...allStats[year],
    }));
  }, [allStats]);

  if (!allStats) {
    return <div className="flex items-center justify-center h-full"><p className="text-gray-500">Loading data...</p></div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Historical Flood Analysis</h2>
          <p className="text-sm text-gray-500 mt-1">Year-wise comparison of flood exposure across 228 habitations in Kamrup Metropolitan</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ChartCard title="Exposed Habitations by Year" subtitle="Number of habitations with flood exposure > 0%">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                  formatter={(value, name) => [value, name === 'exposed' ? 'Exposed' : 'Non-Exposed']}
                />
                <Legend />
                <Bar dataKey="exposed" name="Exposed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonExposed" name="Non-Exposed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Average Exposure %" subtitle="Mean flood exposure among exposed habitations">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Avg Exposure']}
                />
                <Area type="monotone" dataKey="avgExposure" stroke="#3b82f6" fill="url(#colorAvg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Estimated Exposed Population" subtitle="Spatial estimate — NOT actual affected population">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value) => [value.toLocaleString(), 'Est. Exposed Pop']}
                />
                <Bar dataKey="exposedPop" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Maximum Exposure %" subtitle="Highest single habitation exposure in each year">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Max Exposure']}
                />
                <Line type="monotone" dataKey="maxExposure" stroke="#ef4444" strokeWidth={2} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Year-wise Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Year</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Exposed Hab.</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Non-Exposed</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Exposure Rate</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Avg Exposure</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Max Exposure</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Est. Exposed Pop</th>
                </tr>
              </thead>
              <tbody>
                {yearSummaryData.map((row) => (
                  <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-gray-900">{row.year}</td>
                    <td className="py-3 px-3 text-right font-medium text-red-600">{row.exposedHabitations}</td>
                    <td className="py-3 px-3 text-right text-gray-600">{row.nonExposedHabitations}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {row.exposureRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">{row.avgExposure.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-medium ${row.maxExposure > 75 ? 'text-red-600' : row.maxExposure > 50 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {row.maxExposure.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">{row.totalExposedPop.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-6">
          <p className="text-xs text-amber-700 font-medium">Important Note</p>
          <p className="text-xs text-amber-600 mt-1">
            All population exposure values are spatial estimates derived from the intersection of habitation polygons with flood inundation data.
            They do NOT represent actual observed affected population during any specific flood event.
          </p>
        </div>
      </div>
    </div>
  );
}
