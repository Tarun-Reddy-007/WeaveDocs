export default function PrivacyPage() {
  return (
    <div className="container-centered py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="section-title mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-black">
          <section>
            <h2 className="text-2xl font-semibold text-black mb-4">
              Introduction
            </h2>
            <p>
              At WeaveDocs, we&apos;re committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, and safeguard your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Information We Collect
            </h2>
            <p>
              We collect information you provide directly, such as when you create an account 
              or upload documents. We also collect certain information automatically when you 
              use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at 
              privacy@weavedocs.com
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
