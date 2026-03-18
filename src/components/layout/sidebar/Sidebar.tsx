'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  href: string;
  icon?: string;
}

interface SidebarProps {
  items: SidebarItem[];
  title: string;
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-52 bg-white border-r border-black min-h-screen sticky top-14 flex flex-col font-['DM_Sans',sans-serif] flex-shrink-0">

      {/* Title */}
      <div className="border-b border-black px-6 h-12 flex items-center">
        <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400">
          {title}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col py-3 flex-1">
        {items.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center justify-between px-6 py-3 transition-colors duration-150 ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
            >
              {/* Active left bar */}
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-[2px] bg-white" />
              )}

              <div className="flex items-center gap-3 min-w-0">
                {/* Index number */}
                <span className={`text-[10px] font-mono flex-shrink-0 ${isActive ? 'text-gray-400' : 'text-gray-300 group-hover:text-gray-400'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Label */}
                <span className={`text-[11px] tracking-[0.12em] uppercase font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </div>

              {/* Arrow */}
              <span className={`text-xs flex-shrink-0 transition-transform duration-150 ${
                isActive ? 'text-white' : 'text-gray-300 group-hover:text-black group-hover:translate-x-0.5'
              }`}>
                →
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom strip */}
      <div className="border-t border-gray-200 px-6 py-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-300">
          WeaveDocs
        </p>
      </div>

    </aside>
  );
}