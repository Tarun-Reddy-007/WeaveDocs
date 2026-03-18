export default function PrivacyPage() {
  const sections = [
    {
      num: '01',
      title: 'Introduction',
      body: "At WeaveDocs, we're committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.",
    },
    {
      num: '02',
      title: 'Information We Collect',
      body: 'We collect information you provide directly, such as when you create an account or upload documents. We also collect certain information automatically when you use our service, including usage data and device identifiers.',
    },
    {
      num: '03',
      title: 'How We Use Your Data',
      body: 'Your data is used solely to operate and improve the WeaveDocs service. We do not sell or share your personal information with third parties for marketing purposes.',
    },
    {
      num: '04',
      title: 'Data Security',
      body: 'We implement industry-standard security measures to protect your information. All documents are encrypted at rest and in transit.',
    },
    {
      num: '05',
      title: 'Contact Us',
      body: 'If you have questions about this Privacy Policy, please contact us at privacy@weavedocs.com. We aim to respond within 48 hours.',
    },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-white font-['DM_Sans',sans-serif]">
      {/* Page header */}
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-gray-400 mb-4">
              WeaveDocs / Legal
            </p>
            <h1 className="font-['Playfair_Display',serif] text-[clamp(2.8rem,6vw,5rem)] font-black leading-[0.95] tracking-tight text-black">
              Privacy<br />
              <span className="italic font-normal">Policy</span>
            </h1>
          </div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-gray-400 md:text-right">
            Last updated<br />
            <span className="text-black font-semibold">March 2026</span>
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto px-6">
        {sections.map((s, i) => (
          <div
            key={s.num}
            className={`border-b py-10 grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_18rem_1fr] gap-6 items-start ${
              i === sections.length - 1 ? 'border-black' : 'border-gray-200'
            }`}
          >
            {/* Number */}
            <span className="text-[11px] font-mono text-gray-400 pt-1">{s.num}</span>

            {/* Title */}
            <h2 className="font-['Playfair_Display',serif] text-xl font-black text-black leading-snug">
              {s.title}
            </h2>

            {/* Body — full width on mobile, beside title on desktop */}
            <p className="col-start-2 md:col-start-3 text-sm text-gray-500 leading-relaxed max-w-xl">
              {s.body}
            </p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-black max-w-6xl mx-auto px-6 py-6 mt-8 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
          WeaveDocs Legal
        </span>
        <a
          href="mailto:privacy@weavedocs.com"
          className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black hover:text-gray-500 transition-colors"
        >
          privacy@weavedocs.com &rarr;
        </a>
      </div>
    </main>
  );
}