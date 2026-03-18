export default function TermsPage() {
  return (
    <div className="container-centered py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="section-title mb-8">Terms of Service</h1>
        
        <div className="space-y-8 text-black">
          <section>
            <h2 className="text-2xl font-semibold text-black mb-4">
              Agreement
            </h2>
            <p>
              By accessing and using WeaveDocs, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Use License
            </h2>
            <p>
              Permission is granted to temporarily download one copy of the materials 
              (information or software) on WeaveDocs for personal, non-commercial transitory 
              viewing only. This is the grant of a license, not a transfer of title, and 
              under this license you may not:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose</li>
              <li>Attempt to decompile or reverse engineer any software contained</li>
              <li>Remove any copyright or other proprietary notations</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Disclaimer
            </h2>
            <p>
              The materials on WeaveDocs are provided on an 'as is' basis. WeaveDocs makes no 
              warranties, expressed or implied, and hereby disclaims and negates all other warranties 
              including, without limitation, implied warranties or conditions of merchantability, 
              fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Contact Us
            </h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at 
              legal@weavedocs.com
            </p>
          </section>

          <div className="border-t border-gray-300 pt-8 text-black text-sm">
            Last updated: March 2026
          </div>
        </div>
      </div>
    </div>
  );
}
