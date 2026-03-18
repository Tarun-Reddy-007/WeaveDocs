import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 border-t border-gray-300 mt-16">
      <div className="container-centered py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left: Copyright */}
          <div className="text-black text-sm">
            © {currentYear} WeaveDocs. All rights reserved.
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-black hover:text-black text-sm transition-colors duration-200 font-medium"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-black hover:text-black text-sm transition-colors duration-200 font-medium"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
