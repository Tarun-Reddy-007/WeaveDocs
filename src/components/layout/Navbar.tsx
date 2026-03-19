'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isPreviewRoute = pathname?.startsWith('/services/product-catalogs/preview/');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setIsOpen(false), [pathname]);

  if (isPreviewRoute) return null;

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_1px_0_0_#000]' : 'border-b border-black'
      }`}
    >
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-['Playfair_Display',serif] text-xl font-black text-black tracking-tight leading-none">
              Weave
              <span className="italic font-normal">Docs</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/services" active={pathname === '/services'}>
              Services
            </NavLink>
            <NavLink href="/docs" active={pathname === '/docs'}>
              Docs
            </NavLink>

            <div className="w-px h-4 bg-gray-300" />

            <Link
              href="/login"
              className="text-[12px] tracking-[0.15em] uppercase font-semibold text-black border border-black px-5 py-2 hover:bg-black hover:text-white transition-all duration-150 font-['DM_Sans',sans-serif]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-[12px] tracking-[0.15em] uppercase font-semibold text-white bg-black px-5 py-2 hover:bg-gray-800 transition-all duration-150 font-['DM_Sans',sans-serif]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-8 h-8 flex flex-col justify-center items-center gap-[5px] group"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-5 h-[1.5px] bg-black transition-all duration-200 origin-center ${
                isOpen ? 'rotate-45 translate-y-[6.5px]' : ''
              }`}
            />
            <span
              className={`block h-[1.5px] bg-black transition-all duration-200 ${
                isOpen ? 'w-0 opacity-0' : 'w-5'
              }`}
            />
            <span
              className={`block w-5 h-[1.5px] bg-black transition-all duration-200 origin-center ${
                isOpen ? '-rotate-45 -translate-y-[6.5px]' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden border-t border-black overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="w-full px-3 sm:px-6 py-6 flex flex-col gap-5">
          {[
            { href: '/services', label: 'Services' },
            { href: '/docs', label: 'Docs' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold uppercase tracking-widest transition-colors font-['DM_Sans',sans-serif] ${
                pathname === href ? 'text-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex gap-3">
            <Link
              href="/login"
              className="flex-1 text-center text-[12px] tracking-widest uppercase font-semibold text-black border border-black py-3 hover:bg-gray-50 transition-colors font-['DM_Sans',sans-serif]"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="flex-1 text-center text-[12px] tracking-widest uppercase font-semibold text-white bg-black py-3 hover:bg-gray-800 transition-colors font-['DM_Sans',sans-serif]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Helper
function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative text-[12px] tracking-[0.12em] uppercase font-semibold transition-colors duration-150 font-['DM_Sans',sans-serif] after:absolute after:-bottom-0.5 after:left-0 after:h-[1.5px] after:bg-black after:transition-all after:duration-200 ${
        active
          ? 'text-black after:w-full'
          : 'text-gray-400 hover:text-black after:w-0 hover:after:w-full'
      }`}
    >
      {children}
    </Link>
  );
}