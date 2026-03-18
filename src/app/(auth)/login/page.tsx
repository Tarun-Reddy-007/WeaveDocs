'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
  };

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-white font-['DM_Sans',sans-serif] flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[45%] border-r border-black flex-col justify-between p-12 bg-black">
        <Link href="/" className="font-['Playfair_Display',serif] text-xl font-black text-white leading-none">
          Weave<span className="italic font-normal">Docs</span>
        </Link>

        <div>
          <p className="font-['Playfair_Display',serif] text-[clamp(2rem,3.5vw,3rem)] font-black text-white leading-[1.05] tracking-tight mb-6">
            Your documents,<br />
            <span className="italic font-normal">live on the web.</span>
          </p>
          <p className="text-[13px] text-gray-500 leading-relaxed max-w-xs">
            Upload a PDF and get a shareable, searchable web experience in seconds.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t border-gray-800 pt-8">
          {[
            { n: '10s', label: 'Upload' },
            { n: '∞',   label: 'Search' },
            { n: '100%', label: 'Secure' },
          ].map(({ n, label }) => (
            <div key={label}>
              <div className="font-['Playfair_Display',serif] text-2xl font-black text-white">{n}</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-gray-600 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16">

        {/* Top: back link */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] uppercase font-semibold text-gray-400 hover:text-black transition-colors duration-150"
          >
            ← Home
          </Link>
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-300">
            Sign in
          </span>
        </div>

        {/* Form */}
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">

          {/* Heading */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-3">Welcome back</p>
            <h1 className="font-['Playfair_Display',serif] text-[clamp(2rem,4vw,3rem)] font-black leading-[0.95] text-black">
              Sign in to<br />
              <span className="italic font-normal">your account</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-0">

            {/* Email */}
            <div className={`border border-b-0 transition-colors duration-150 ${focused === 'email' ? 'border-black' : 'border-gray-200'}`}>
              <label className="block px-4 pt-3 text-[10px] tracking-[0.2em] uppercase text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                required
                className="w-full px-4 pt-1 pb-3 text-sm text-black bg-white outline-none placeholder-gray-300 font-['DM_Sans',sans-serif]"
              />
            </div>

            {/* Password */}
            <div className={`border transition-colors duration-150 ${focused === 'password' ? 'border-black' : 'border-gray-200'}`}>
              <label className="block px-4 pt-3 text-[10px] tracking-[0.2em] uppercase text-gray-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                required
                className="w-full px-4 pt-1 pb-3 text-sm text-black bg-white outline-none placeholder-gray-300 font-['DM_Sans',sans-serif]"
              />
            </div>

            {/* Forgot password */}
            <div className="flex justify-end mt-3 mb-6">
              <Link
                href="/forgot-password"
                className="text-[11px] tracking-[0.1em] uppercase text-gray-400 hover:text-black transition-colors duration-150"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="group w-full border border-black bg-black text-white px-8 py-4 text-[11px] tracking-widest uppercase font-semibold hover:bg-white hover:text-black transition-all duration-200 flex items-center justify-between"
            >
              <span>Sign In</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sign up */}
          <p className="text-[12px] text-gray-400 text-center">
            No account yet?{' '}
            <Link
              href="/signup"
              className="font-semibold text-black underline underline-offset-4 hover:text-gray-600 transition-colors duration-150"
            >
              Create one
            </Link>
          </p>

        </div>

        {/* Bottom: legal */}
        <div className="flex items-center justify-between mt-12">
          <span className="text-[10px] tracking-[0.15em] uppercase text-gray-300">
            © {new Date().getFullYear()} WeaveDocs
          </span>
          <div className="flex gap-4">
            {['Privacy', 'Terms'].map(l => (
              <Link
                key={l}
                href={`/${l.toLowerCase()}`}
                className="text-[10px] tracking-[0.15em] uppercase text-gray-300 hover:text-black transition-colors duration-150"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}