export default function TermsPage() {
  const sections = [
    {
      num: '01',
      title: 'Agreement',
      body: 'By accessing and using WeaveDocs, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree, please discontinue use of the platform immediately.',
      list: null,
    },
    {
      num: '02',
      title: 'Use License',
      body: 'Permission is granted to temporarily access the materials on WeaveDocs for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title. Under this license you may not:',
      list: [
        'Modify or copy the materials',
        'Use the materials for any commercial purpose',
        'Attempt to decompile or reverse engineer any software contained',
        'Remove any copyright or other proprietary notations',
        'Transfer the materials or mirror them on any other server',
      ],
    },
    {
      num: '03',
      title: 'Disclaimer',
      body: "The materials on WeaveDocs are provided on an 'as is' basis. WeaveDocs makes no warranties, expressed or implied, and hereby disclaims all other warranties including implied warranties of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.",
      list: null,
    },
    {
      num: '04',
      title: 'Limitations',
      body: 'In no event shall WeaveDocs or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform, even if WeaveDocs or an authorised representative has been notified of the possibility of such damage.',
      list: null,
    },
    {
      num: '05',
      title: 'Governing Law',
      body: 'These terms and conditions are governed by and construed in accordance with applicable laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
      list: null,
    },
    {
      num: '06',
      title: 'Contact Us',
      body: 'If you have any questions about these Terms of Service, please reach out to our legal team directly.',
      list: null,
      contact: 'legal@weavedocs.com',
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
              Terms of<br />
              <span className="italic font-normal">Service</span>
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
            className={`border-b py-10 grid grid-cols-1 md:grid-cols-[4rem_18rem_1fr] gap-6 items-start ${
              i === sections.length - 1 ? 'border-black' : 'border-gray-200'
            }`}
          >
            {/* Number */}
            <span className="text-[11px] font-mono text-gray-400 pt-1">{s.num}</span>

            {/* Title */}
            <h2 className="font-['Playfair_Display',serif] text-xl font-black text-black leading-snug">
              {s.title}
            </h2>

            {/* Body */}
            <div className="col-start-1 md:col-start-3 space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>

              {/* List items */}
              {s.list && (
                <div className="border-l-2 border-black pl-5 space-y-3 mt-4">
                  {s.list.map((item, li) => (
                    <div key={li} className="flex items-start gap-3">
                      <span className="text-[10px] font-mono text-gray-400 mt-0.5 flex-shrink-0">
                        {String(li + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm text-gray-500 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact link */}
              {'contact' in s && s.contact && (
                <a
                  href={`mailto:${s.contact}`}
                  className="inline-flex items-center gap-3 border border-black text-black px-5 py-2.5 text-[11px] tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-200 mt-2 group"
                >
                  <span>{s.contact}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer strip */}
      <div className="border-t border-black max-w-6xl mx-auto px-6 py-6 mt-8 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
          WeaveDocs Legal
        </span>
        <a
          href="mailto:legal@weavedocs.com"
          className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black hover:text-gray-500 transition-colors"
        >
          legal@weavedocs.com &rarr;
        </a>
      </div>

    </main>
  );
}