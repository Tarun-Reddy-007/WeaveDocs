import Link from 'next/link';

const sections = [
  {
    num: '01',
    title: 'Getting Started',
    slug: 'getting-started',
    description: 'Set up your SECat account and upload your first PDF in under a minute.',
    articles: [
      { title: 'Creating your account', time: '2 min' },
      { title: 'Uploading your first PDF', time: '3 min' },
      { title: 'Sharing a catalog link', time: '2 min' },
    ],
  },
  {
    num: '02',
    title: 'Product Catalogs',
    slug: 'product-catalogs',
    description: 'Learn how to manage, organise, and publish your product catalog documents.',
    articles: [
      { title: 'Creating a catalog', time: '4 min' },
      { title: 'Navigating pages', time: '2 min' },
      { title: 'Using the thumbnail panel', time: '2 min' },
    ],
  },
  {
    num: '03',
    title: 'Analytics',
    slug: 'analytics',
    description: 'Understand how visitors interact with your documents using built-in analytics.',
    articles: [
      { title: 'Reading your metrics', time: '3 min' },
      { title: 'Tracking search queries', time: '3 min' },
      { title: 'Interpreting session data', time: '4 min' },
    ],
  },
  {
    num: '04',
    title: 'Sharing & Access',
    slug: 'sharing',
    description: 'Control who can view your documents with secure, expiring share links.',
    articles: [
      { title: 'Generating a share link', time: '2 min' },
      { title: 'Password protecting a document', time: '3 min' },
      { title: 'Revoking access', time: '2 min' },
    ],
  }
];

export default function DocsPage() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-white font-['DM_Sans',sans-serif]">

      {/* Page header */}
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-gray-400 mb-4">
              SECat / Documentation
            </p>
            <h1 className="font-['Playfair_Display',serif] text-[clamp(2.8rem,6vw,5rem)] font-black leading-[0.95] tracking-tight text-black">
              Cat &amp;<br />
              <span className="italic font-normal">Guides</span>
            </h1>
          </div>
          <div className="flex flex-col gap-4 md:items-end">
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed md:text-right">
              Everything you need to get the most out of SECat.
            </p>
            {/* Search bar */}
            <div className="flex items-center border border-black w-full md:w-72">
              <input
                type="text"
                placeholder="Search docs…"
                className="flex-1 px-4 py-2.5 text-[12px] tracking-wide bg-white text-black placeholder-gray-400 outline-none font-['DM_Sans',sans-serif]"
              />
              <div className="border-l border-black px-4 py-2.5 text-gray-400 text-sm pointer-events-none">
                ⌕
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links strip */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-0 overflow-x-auto">
            {sections.map((s, i) => (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className={`flex-shrink-0 px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-400 hover:text-black transition-colors duration-150 ${
                  i < sections.length - 1 ? 'border-r border-gray-200' : ''
                }`}
              >
                {s.num} {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-6xl mx-auto px-6">
        {sections.map((section, si) => (
          <div
            key={section.slug}
            id={section.slug}
            className="border-b border-black py-14"
          >
            {/* Section header row */}
            <div className="grid grid-cols-1 md:grid-cols-[4rem_20rem_1fr] gap-6 items-start mb-10">
              <span className="text-[11px] font-mono text-gray-400 pt-1">{section.num}</span>
              <div>
                <h2 className="font-['Playfair_Display',serif] text-2xl md:text-3xl font-black text-black leading-tight mb-3">
                  {section.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {section.description}
                </p>
              </div>
              <div className="hidden md:flex justify-end items-start">
                <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300 border border-gray-200 px-3 py-1">
                  {section.articles.length} articles
                </span>
              </div>
            </div>

            {/* Articles */}
            <div className="md:ml-[calc(4rem+1.5rem+20rem)] divide-y divide-gray-100 border-t border-gray-100">
              {section.articles.map((article, ai) => (
                <Link
                  key={ai}
                  href={`/docs/${section.slug}/${article.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group flex items-center justify-between py-4 transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-gray-300 group-hover:text-gray-500 transition-colors">
                      {String(ai + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-black transition-colors duration-150 tracking-wide">
                      {article.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-gray-300 group-hover:text-gray-500 transition-colors">
                      {article.time} read
                    </span>
                    <span className="text-xs text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all duration-150">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer strip */}
      <div className="border-t border-black max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
          Can't find what you're looking for?
        </span>
        <a
          href="mailto:support@secat.com"
          className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black hover:text-gray-500 transition-colors"
        >
          Contact support &rarr;
        </a>
      </div>

    </main>
  );
}