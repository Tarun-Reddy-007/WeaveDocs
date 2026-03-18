import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  return (
    <div className="container-centered py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="section-title mb-2">Dashboard</h1>
        <p className="section-subtitle">Manage your documents</p>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        {/* Your Documents Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-black mb-2">
              Your Documents
            </h2>
            <p className="text-black">
              Manage and organize your uploaded documents
            </p>
          </div>

          {/* Empty State */}
          <div className="card">
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-black mb-2">
                No documents uploaded yet
              </h3>

              <p className="text-black text-center mb-6 max-w-sm">
                Upload your first document to get started. Supported formats include PDF, DOCX, and more.
              </p>

              <Button variant="primary" size="md">
                Upload Document
              </Button>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-black">
              Recent Activity
            </h2>
          </div>

          {/* Empty Activity State */}
          <div className="card">
            <div className="py-8 text-center">
              <p className="text-black">
                Your activity will appear here
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Stats */}
      <div className="mt-12 pt-12 border-t border-gray-300">
        <h2 className="text-lg font-semibold text-black mb-6">
          Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-black text-sm mb-2 font-medium">Documents</div>
            <div className="text-3xl font-bold text-black">0</div>
          </div>
          <div className="card">
            <div className="text-black text-sm mb-2 font-medium">Total Views</div>
            <div className="text-3xl font-bold text-black">0</div>
          </div>
          <div className="card">
            <div className="text-black text-sm mb-2 font-medium">Storage Used</div>
            <div className="text-3xl font-bold text-black">0 MB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
