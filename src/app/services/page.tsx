import Link from 'next/link';

export default function ServicesPage() {
  const services = [
    {
      id: 'product-catalogs',
      title: 'Product Catalogs',
      description:
        'Transform your product catalogs into interactive, searchable web experiences that convert.',
      num: '01',
      tag: 'Available',
      href: '/services/product-catalogs',
    },
  ];

  const coming: Array<{ num?: string; title?: string; tag?: string }> = [
    {  },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-white font-['DM_Sans',sans-serif]">
      {/* Page header */}
      <div className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.25em] uppercase text-gray-400 mb-4">
              SECat / Services
            </p>
            <h1 className="font-['Playfair_Display',serif] text-[clamp(2.1rem,4.4vw,4rem)] font-black leading-[0.95] tracking-tight text-black">
              Our<br />
              <span className="italic font-normal">Services</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Pick a service to convert your static documents into live, shareable web experiences.
          </p>
        </div>
      </div>

      {/* Services list */}
      <div className="max-w-6xl mx-auto px-6">
        {/* Active services */}
        {services.map((s) => (
          <Link key={s.id} href={s.href} className="group block border-b border-black">
            <div className="py-10 grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_1fr_auto] items-center gap-6">
              {/* Number */}
              <span className="text-[11px] font-mono text-gray-400">{s.num}</span>

              {/* Title */}
              <h2 className="font-['Playfair_Display',serif] text-2xl md:text-3xl font-black text-black group-hover:italic transition-all duration-200">
                {s.title}
              </h2>

              {/* Description — hidden on mobile */}
              <p className="hidden md:block text-sm text-gray-500 leading-relaxed max-w-sm">
                {s.description}
              </p>

              {/* CTA */}
              <div className="flex items-center gap-4">
                <span className="hidden md:inline text-[11px] tracking-[0.2em] uppercase text-black border border-black px-3 py-1">
                  {s.tag}
                </span>
                <span className="inline-flex items-center justify-center w-10 h-10 border border-black text-black group-hover:bg-black group-hover:text-white transition-all duration-200 text-lg">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}

        {/* Coming soon rows */}
        {coming.map((s) => (
          <div
            key={s.num ?? 'coming-empty'}
            className="border-b border-gray-200 py-10 grid grid-cols-[3rem_1fr_auto] md:grid-cols-[4rem_1fr_1fr_auto] items-center gap-6 opacity-40 cursor-not-allowed select-none"
          >
            <span className="text-[11px] font-mono text-gray-400">{s.num ?? ''}</span>
            <h2 className="font-['Playfair_Display',serif] text-2xl md:text-3xl font-black text-black">
              {s.title ?? ''}
            </h2>
            <span className="hidden md:block" />
            <div className="flex items-center gap-4">
              <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 border border-gray-300 px-3 py-1">
                {s.tag ?? ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="border-t border-black max-w-6xl mx-auto px-6 py-6 mt-8 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
          More services on the way
        </span>
        <Link
          href="/"
          className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black hover:text-gray-500 transition-colors"
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}