'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white">
      {/* Hero */}
      <section className="border-b border-black">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-36 grid md:grid-cols-2 gap-0">
          {/* Left: headline */}
          <div className="border-r border-black pr-10 flex flex-col justify-center">
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="inline-block text-[11px] tracking-[0.25em] font-semibold uppercase text-gray-500 border border-gray-300 px-3 py-1">
                Document Platform
              </span>
            </motion.div>

            <div className="font-['Playfair_Display',serif] text-[clamp(3rem,7vw,6rem)] font-black leading-[0.95] tracking-tight text-black mb-8 overflow-hidden">
              {/* "Weave" — slides up */}
              <motion.div
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              >
                Weave
              </motion.div>

              {/* "Docs" — slides up with slight delay, italic */}
              <motion.div
                className="italic font-normal"
                initial={{ y: '110%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              >
                Docs
              </motion.div>
            </div>

            <motion.p
              className="text-[15px] leading-relaxed text-gray-500 max-w-xs font-['DM_Sans',sans-serif]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: 0.5 }}
            >
              Turn static documents into seamless,<br />
              searchable web experiences.
            </motion.p>
          </div>

          {/* Right: CTA block */}
          <motion.div
            className="pl-10 flex flex-col justify-between py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <div className="space-y-10">
              <p className="text-[13px] tracking-[0.15em] uppercase text-gray-400 font-['DM_Sans',sans-serif]">
                Upload once — share everywhere
              </p>
              <div className="flex flex-col gap-4">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-between bg-black text-white px-8 py-4 text-sm tracking-widest uppercase font-semibold transition-all duration-200 hover:bg-gray-900 font-['DM_Sans',sans-serif]"
                >
                  <span>Get Started</span>
                  <span className="ml-6 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/services"
                  className="group inline-flex items-center justify-between border border-black text-black px-8 py-4 text-sm tracking-widest uppercase font-semibold transition-all duration-200 hover:bg-gray-50 font-['DM_Sans',sans-serif]"
                >
                  <span>See Services</span>
                  <span className="ml-6 transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-3 gap-4">
              {[
                { n: '10s', label: 'Upload time' },
                { n: '∞', label: 'Searchable' },
                { n: '100%', label: 'Secure links' },
              ].map(({ n, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                >
                  <div className="text-2xl font-black text-black font-['Playfair_Display',serif]">{n}</div>
                  <div className="text-[11px] text-gray-400 tracking-widest uppercase mt-1 font-['DM_Sans',sans-serif]">{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
          {[
            { num: '01', title: 'Fast Upload', desc: 'Drop a PDF and get a live URL in under ten seconds.' },
            { num: '02', title: 'Fully Searchable', desc: 'Full-text search across every document in your workspace.' },
            { num: '03', title: 'Easy Sharing', desc: 'Send password-protected links to exactly the right audience.' },
          ].map(({ num, title, desc }, i) => (
            <motion.div
              key={num}
              className="px-0 md:px-10 py-10 md:py-0 first:pl-0 last:pr-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 + i * 0.12 }}
            >
              <div className="text-[11px] font-mono text-gray-400 mb-4">{num}</div>
              <h3 className="text-xl font-black text-black mb-3 font-['Playfair_Display',serif]">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-['DM_Sans',sans-serif]">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="border-t border-black max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 font-['DM_Sans',sans-serif]">
          Built for modern teams
        </span>
        <Link
          href="/login"
          className="text-[11px] tracking-[0.2em] uppercase font-semibold text-black hover:text-gray-600 transition-colors font-['DM_Sans',sans-serif]"
        >
          Start free →
        </Link>
      </div>
    </main>
  );
}