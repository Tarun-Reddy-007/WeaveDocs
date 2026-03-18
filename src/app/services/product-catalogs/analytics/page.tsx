'use client';

import { Sidebar } from '@/components/layout/sidebar/Sidebar';

const sidebarItems = [
  {
    label: 'Catalogs',
    href: '/services/product-catalogs',
  },
  {
    label: 'Analytics',
    href: '/services/product-catalogs/analytics',
  },
];

export default function AnalyticsPage() {
  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} title="Product Catalogs" />

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-black mb-3">
              Analytics
            </h1>
            <p className="text-black text-lg">
              Track catalog performance and customer engagement
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="card">
              <div className="text-black text-sm font-semibold mb-2">
                Total Views
              </div>
              <div className="text-5xl font-bold text-black">0</div>
              <p className="text-black text-sm mt-2">
                across all catalogs
              </p>
            </div>

            <div className="card">
              <div className="text-black text-sm font-semibold mb-2">
                Searches
              </div>
              <div className="text-5xl font-bold text-black">0</div>
              <p className="text-black text-sm mt-2">
                in the last 30 days
              </p>
            </div>

            <div className="card">
              <div className="text-black text-sm font-semibold mb-2">
                Average Session Time
              </div>
              <div className="text-5xl font-bold text-black">0s</div>
              <p className="text-black text-sm mt-2">
                per visitor
              </p>
            </div>

            <div className="card">
              <div className="text-black text-sm font-semibold mb-2">
                Visitor Retention
              </div>
              <div className="text-5xl font-bold text-black">0%</div>
              <p className="text-black text-sm mt-2">
                return visitors
              </p>
            </div>
          </div>

          {/* Empty Chart State */}
          <div className="card">
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-6">📈</div>

              <h2 className="text-2xl font-bold text-black mb-3">
                No data yet
              </h2>

              <p className="text-black max-w-md">
                Analytics will appear here once you create and share your first catalog
              </p>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 pt-12 border-t border-gray-300">
            <h2 className="text-2xl font-bold text-black mb-6">
              What We Track
            </h2>
            
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Catalog Views
                </h3>
                <p className="text-black">
                  Number of times your catalogs have been accessed
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Search Queries
                </h3>
                <p className="text-black">
                  What customers search for in your catalogs
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-black mb-2">
                  User Engagement
                </h3>
                <p className="text-black">
                  Session duration and page interactions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
