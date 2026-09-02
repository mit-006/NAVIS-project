import React from 'react';
import { PRIORITY_LEVELS } from '../data/floodData';

function Step({ number, title, description, color }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${color}`}>
          {number}
        </div>
        <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
      </div>
      <div className="pb-8">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

function FormulaCard({ title, formula, description }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="bg-white rounded-lg p-3 border border-gray-200 font-mono text-sm text-blue-700 mb-2">
        {formula}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

export default function Methodology() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Methodology & Data Sources</h2>
          <p className="text-sm text-gray-500 mt-1">How flood exposure and analytical priority are calculated in NAVIS</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-5">Processing Pipeline</h3>
          <div className="ml-2">
            <Step number="1" title="Census Population Data" description="Census 2011 PCA-TV data for Kamrup Metropolitan District (District Code 322). Contains population, households, and demographic attributes for 228 unique town/village codes." color="bg-slate-600" />
            <Step number="2" title="AIKOSH Village Geometry" description="PC11 Village Polygons from SHRUG/AIKOSH. Provides geospatial boundaries for each census town/village. 100% join match with Census data." color="bg-green-600" />
            <Step number="3" title="228 Habitations Created" description="Census population data joined with AIKOSH geometry to create the habitation layer. Each habitation has both demographic attributes and spatial polygon geometry." color="bg-blue-600" />
            <Step number="4" title="NDEM Historical Flood Inundation" description="Assam Yearly Aggregate Flood Inundation data from NDEM/NRSC/ISRO. Binary inundation data (flooded/not flooded) for years 1998, 1999, 2004, 2012, 2013." color="bg-cyan-600" />
            <Step number="5" title="Spatial Intersection" description="Each habitation polygon is intersected with flood inundation polygons for each year. The area of intersection is calculated to determine the proportion of each habitation that was flooded." color="bg-purple-600" />
            <Step number="6" title="Flood Exposure Percentage" description="Flood exposure percentage is calculated as the ratio of flooded area to total habitation area, expressed as a percentage." color="bg-amber-600" />
            <Step number="7" title="Population Exposure Estimate" description="Estimated exposed population is calculated by multiplying total population by the flood exposure percentage. This is a spatial estimate, not actual observed data." color="bg-red-600" />
            <Step number="8" title="Analytical Priority Classification" description="A priority score is computed for each habitation using a weighted combination of maximum exposure, flood frequency, and population exposure. This is an analytical decision-support indicator." color="bg-rose-600" />
            <Step number="9" title="Decision Support" description="The flood exposure and priority data are presented through the dashboard for disaster management decision-making." color="bg-slate-800" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Formulas</h3>
          <div className="space-y-4">
            <FormulaCard
              title="Flood Exposure %"
              formula="Flood Exposure % = (Flooded Area / Total Habitation Area) × 100"
              description="The proportion of a habitation's area that was inundated during a specific flood year."
            />
            <FormulaCard
              title="Estimated Exposed Population"
              formula="Estimated Exposed Population = Population × (Flood Exposure % / 100)"
              description="A spatial estimate of population potentially affected. Does NOT represent actual observed affected population."
            />
            <FormulaCard
              title="Flood Frequency"
              formula="Flood Frequency = Flood-Exposed Years / Available Flood Years"
              description="The proportion of analysed years in which a habitation experienced flood exposure. Range: 0.0 to 1.0."
            />
            <FormulaCard
              title="NAVIS Analytical Priority Score"
              formula="Score = (MaxExposure × 0.4) + (Frequency% × 0.3) + (PopExposure% × 0.3)"
              description="Weighted combination of maximum historical exposure (40%), flood frequency (30%), and population exposure ratio (30%). All components normalized to 0–100 scale."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">NAVIS Analytical Priority</h3>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
            <p className="text-sm font-semibold text-amber-800">Important Disclaimer</p>
            <p className="text-xs text-amber-700 mt-1">
              This is an analytical decision-support indicator derived from processed flood exposure data.
              It is <strong>NOT</strong> an official government disaster-risk classification or red-zone designation.
            </p>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-3">Variables Used</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Max Historical Exposure</p>
              <p className="text-[11px] text-gray-500 mt-1">Highest flood exposure % across all 5 analysed years (1998–2013). Weight: 40%.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Flood Frequency</p>
              <p className="text-[11px] text-gray-500 mt-1">Number of years with flood exposure &gt; 0 (out of 5). Weight: 30%.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Population Exposure</p>
              <p className="text-[11px] text-gray-500 mt-1">Maximum estimated exposed population as % of total habitation population. Weight: 30%.</p>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-700 mb-3">Classification Rules</h4>
          <div className="space-y-2">
            {PRIORITY_LEVELS.map((l) => (
              <div key={l.level} className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: l.bg, border: `1px solid ${l.border}` }}>
                <span className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }}></span>
                <div className="flex-1">
                  <span className="text-sm font-semibold" style={{ color: l.color }}>{l.level}</span>
                  <span className="text-xs text-gray-500 ml-2">Score ≥ {l.minScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Sources</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Census 2011 (PCA-TV)</p>
                <p className="text-xs text-gray-500">Population Census of India 2011, Town/Village level data. Source: Office of the Registrar General & Census Commissioner, India.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AIKOSH Census Village Geometry (SHRUG PC11)</p>
                <p className="text-xs text-gray-500">Spatial polygons for Census 2011 villages. Source: SHRUG (Spatial Heterogeneous Repository of Useful Geographies), AIKOSH platform. License: CC BY-NC-SA 4.0.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">NDEM Flood Inundation Data</p>
                <p className="text-xs text-gray-500">Assam Yearly Aggregate Flood Inundation 1998-2013, 2021. Source: National Disaster Management EMPanelled Data (NDEM), NRSC/ISRO. Binary inundation data (flooded/not flooded).</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Validation</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Habitation records', value: '228', status: 'pass' },
              { label: 'Geometry validation', value: 'PASS', status: 'pass' },
              { label: 'Duplicate IDs', value: '0', status: 'pass' },
              { label: 'Missing geometry', value: '0', status: 'pass' },
              { label: 'Flood exposure range', value: '0–100%', status: 'pass' },
              { label: 'Flooded > habitation area', value: '0', status: 'pass' },
            ].map((item) => (
              <div key={item.label} className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs text-green-700 font-medium">{item.label}</p>
                <p className="text-lg font-bold text-green-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-green-100 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-800">Data Validation: PASSED</p>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 mb-6">
          <h3 className="font-semibold text-amber-800 mb-2">Important Disclaimers</h3>
          <ul className="space-y-2 text-xs text-amber-700">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Flood exposure is calculated by spatially intersecting Census/AIKOSH habitation polygons with historical NDEM flood inundation polygons.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Estimated exposed population is a spatial estimate derived from population × inundated-area percentage. It does NOT represent observed numbers of people affected during a disaster.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Flood inundation data is binary (flooded/not flooded) with no depth or severity information.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>Exposure categories (No, Low, Moderate, High, Very High) are visualization categories only and do NOT represent official government risk classifications.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>NAVIS Analytical Priority is a weighted score for internal decision-support purposes. It is NOT an official government disaster-risk classification or red-zone designation.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>This platform is a decision-support tool and does NOT claim to identify official Red Zones or provide authoritative risk assessments.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Future Multi-Hazard Architecture</h3>
          <p className="text-sm text-gray-600 mb-4">
            NAVIS is designed as a multi-hazard decision-support platform. The current MVP implements flood hazard only. The architecture supports adding additional hazards:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: 'Flood', status: 'active' },
              { name: 'Landslide', status: 'planned' },
              { name: 'Riverbank Erosion', status: 'planned' },
              { name: 'Extreme Rainfall', status: 'planned' },
              { name: 'Cyclone', status: 'planned' },
              { name: 'Drought', status: 'planned' },
              { name: 'Earthquake', status: 'planned' },
              { name: 'Urban Waterlogging', status: 'planned' },
            ].map((h) => (
              <div
                key={h.name}
                className={`rounded-lg p-2.5 text-xs font-medium text-center ${
                  h.status === 'active'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-400 border border-gray-200'
                }`}
              >
                {h.name}
                {h.status === 'active' && <span className="block text-[10px] mt-0.5 text-blue-500">Active</span>}
                {h.status === 'planned' && <span className="block text-[10px] mt-0.5 text-gray-400">Planned</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
