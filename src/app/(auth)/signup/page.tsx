'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Signup attempt:', form);
  };

  const fields = [
    { key: 'name',     label: 'Full Name',       type: 'text',     placeholder: 'Jane Smith',        borderB: true  },
    { key: 'email',    label: 'Email',            type: 'email',    placeholder: 'you@example.com',   borderB: true  },
    { key: 'password', label: 'Password',         type: 'password', placeholder: '••••••••',          borderB: true  },
    { key: 'confirm',  label: 'Confirm Password', type: 'password', placeholder: '••••••••',          borderB: false },
  ];

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-white font-['DM_Sans',sans-serif] flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[45%] border-r border-black flex-col justify-between p-12 bg-black">
        <Link href="/" className="font-['Playfair_Display',serif] text-xl font-black text-white leading-none">
          Weave<span className="italic font-normal">Docs</span>
        </Link>

        {/* Steps */}
        <div className="flex flex-col gap-0">
          <p className="text-[10px] tracking-[0.25em] uppercase text-gray-600 mb-8">
            How it works
          </p>
          {[
            { n: '01', title: 'Create an account',   desc: 'Sign up free — no credit card required.' },
            { n: '02', title: 'Upload your PDF',      desc: 'Drop any PDF and get a live URL instantly.' },
            { n: '03', title: 'Share with anyone',    desc: 'Send a secure link to your audience.' },
          ].map((step, i, arr) => (
            <div
              key={step.n}
              className={`flex gap-5 py-6 ${i < arr.length - 1 ? 'border-b border-gray-800' : ''}`}
            >
              <span className="text-[11px] font-mono text-gray-600 pt-0.5 flex-shrink-0">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{step.title}</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-[12px] text-gray-600 leading-relaxed max-w-xs">
            Already have an account?{' '}
            <Link href="/login" className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors duration-150">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] uppercase font-semibold text-gray-400 hover:text-black transition-colors duration-150"
          >
            ← Home
          </Link>
          <span className="text-[11px] tracking-[0.2em] uppercase text-gray-300">
            Create account
          </span>
        </div>

        {/* Form */}
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col justify-center">

          {/* Heading */}
          <div className="mb-10">
            <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-3">Get started</p>
            <h1 className="font-['Playfair_Display',serif] text-[clamp(2rem,4vw,3rem)] font-black leading-[0.95] text-black">
              Create your<br />
              <span className="italic font-normal">account</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Stacked fields */}
            <div className="mb-6">
              {fields.map(({ key, label, type, placeholder, borderB }) => (
                <div
                  key={key}
                  className={`border transition-colors duration-150 ${borderB ? 'border-b-0' : ''} ${
                    focused === key ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <label className="block px-4 pt-3 text-[10px] tracking-[0.2em] uppercase text-gray-400">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={handleChange(key)}
                    onFocus={() => setFocused(key)}
                    onBlur={() => setFocused(null)}
                    placeholder={placeholder}
                    required
                    className="w-full px-4 pt-1 pb-3 text-sm text-black bg-white outline-none placeholder-gray-300 font-['DM_Sans',sans-serif]"
                  />
                </div>
              ))}
            </div>

            {/* Password hint */}
            <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">
              Use 8 or more characters with a mix of letters, numbers &amp; symbols.
            </p>

            {/* Terms */}
            <label className="flex items-start gap-3 mb-8 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input type="checkbox" required className="peer sr-only" />
                <div className="w-4 h-4 border border-gray-300 peer-checked:border-black peer-checked:bg-black transition-all duration-150" />
                <svg
                  className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[11px] text-gray-400 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-black underline underline-offset-4 hover:text-gray-600 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="group w-full border border-black bg-black text-white px-8 py-4 text-[11px] tracking-widest uppercase font-semibold hover:bg-white hover:text-black transition-all duration-200 flex items-center justify-between"
            >
              <span>Create Account</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-gray-300">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sign in */}
          <p className="text-[12px] text-gray-400 text-center">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-black underline underline-offset-4 hover:text-gray-600 transition-colors duration-150"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Bottom legal */}
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