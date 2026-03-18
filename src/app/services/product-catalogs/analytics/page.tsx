'use client';

import { Sidebar } from '@/components/layout/sidebar/Sidebar';

const sidebarItems = [
  { label: 'Catalogs', href: '/services/product-catalogs' },
  { label: 'Analytics', href: '/services/product-catalogs/analytics' },
];

const metrics = [
  { num: '01', label: 'Total Views',          value: '0',  sub: 'across all catalogs'  },
  { num: '02', label: 'Searches',             value: '0',  sub: 'in the last 30 days'  },
  { num: '03', label: 'Avg. Session Time',    value: '0s', sub: 'per visitor'           },
  { num: '04', label: 'Visitor Retention',    value: '0%', sub: 'return visitors'       },
];

const tracked = [
  { num: '01', title: 'Catalog Views',   desc: 'Number of times your catalogs have been accessed by visitors.' },
  { num: '02', title: 'Search Queries',  desc: 'What customers search for inside your catalogs.' },
  { num: '03', title: 'User Engagement', desc: 'Session duration and per-page interaction depth.' },
];

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-white font-['DM_Sans',sans-serif] overflow-hidden">
      <Sidebar items={sidebarItems} title="Product Catalogs" />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="border-b border-black h-14 px-8 flex items-center justify-between flex-shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400">
              Product Catalogs
            </span>
            <span className="text-gray-300">—</span>
            <span className="font-['Playfair_Display',serif] text-sm font-black text-black italic">
              Analytics
            </span>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300">
            Last 30 days
          </span>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Page header */}
          <div className="border-b border-black px-8 py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-3">Overview</p>
              <h1 className="font-['Playfair_Display',serif] text-[clamp(2rem,4vw,3.5rem)] font-black leading-[0.95] tracking-tight text-black">
                Analytics
              </h1>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Track catalog performance and customer engagement across all your shared documents.
            </p>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-black">
            {metrics.map((m, i) => (
              <div
                key={m.num}
                className={`px-8 py-8 flex flex-col gap-3 ${
                  i < metrics.length - 1 ? 'border-r border-black' : ''
                }`}
              >
                <span className="text-[10px] font-mono text-gray-400">{m.num}</span>
                <div className="font-['Playfair_Display',serif] text-[clamp(2.5rem,4vw,3.5rem)] font-black text-black leading-none">
                  {m.value}
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.1em] uppercase font-semibold text-black">{m.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty chart state */}
          <div className="border-b border-black mx-8 my-8">
            <div className="border border-dashed border-gray-300 flex flex-col items-center justify-center py-20 gap-6">
              {/* Mini bar chart illustration */}
              <div className="flex items-end gap-2 h-12">
                {[3, 5, 2, 7, 4, 6, 3, 5, 4, 6, 3, 8].map((h, i) => (
                  <div
                    key={i}
                    className="w-3 bg-gray-200"
                    style={{ height: `${h * 6}px` }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black mb-1">
                  No data yet
                </p>
                <p className="text-[11px] text-gray-400">
                  Analytics will appear once you share your first catalog
                </p>
              </div>
            </div>
          </div>

          {/* What we track */}
          <div className="px-8 pb-12">
            <div className="border-t border-black pt-8 mb-6 flex items-end justify-between">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-black text-black">
                What We <span className="italic font-normal">Track</span>
              </h2>
              <span className="text-[10px] tracking-[0.2em] uppercase text-gray-400">3 metrics</span>
            </div>

            <div className="divide-y divide-gray-200 border-t border-gray-200">
              {tracked.map((t) => (
                <div
                  key={t.num}
                  className="py-6 grid grid-cols-[3rem_12rem_1fr] items-start gap-4"
                >
                  <span className="text-[10px] font-mono text-gray-400 pt-0.5">{t.num}</span>
                  <h3 className="font-['Playfair_Display',serif] text-base font-black text-black">
                    {t.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}