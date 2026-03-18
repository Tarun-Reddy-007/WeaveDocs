'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/signup') return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-black font-['DM_Sans',sans-serif]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Main footer row */}
        <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 border-b border-gray-200">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="font-['Playfair_Display',serif] text-xl font-black text-black leading-none">
              Weave<span className="italic font-normal">Docs</span>
            </Link>
            <p className="text-[12px] text-gray-400 leading-relaxed max-w-[16rem]">
              Turn static documents into seamless, searchable web experiences.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-3 md:items-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-1">Platform</p>
            {[
              { href: '/services', label: 'Services' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[12px] tracking-[0.1em] uppercase font-semibold text-gray-500 hover:text-black transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-4 md:items-end justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400">Get started</p>
            <Link
              href="/login"
              className="group inline-flex items-center justify-between border border-black text-black px-6 py-3 text-[11px] tracking-widest uppercase font-semibold hover:bg-black hover:text-white transition-all duration-200 w-fit"
            >
              <span>Login</span>
              <span className="ml-4 transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
            © {currentYear} WeaveDocs. All rights reserved.
          </span>
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
            Built for modern teams
          </span>
        </div>
      </div>
    </footer>
  );
}