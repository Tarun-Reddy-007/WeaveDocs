import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="container-centered text-center">
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 className="section-title mb-4">
            WeaveDocs
          </h1>

          {/* Tagline */}
          <p className="section-subtitle mb-8">
            Turn static documents into seamless web experiences
          </p>

          {/* Description */}
          <p className="text-black text-lg max-w-xl mx-auto mb-12">
            Transform your PDF documents into interactive, searchable web experiences. 
            Upload once, share everywhere.
          </p>

          {/* CTA Button */}
          <Link href="/login">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>

          {/* Feature Hints */}
          <div className="mt-16 pt-12 border-t border-gray-300">
            <p className="text-black text-sm mb-8 font-medium">
              Built for modern teams
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-black font-semibold mb-2">Fast Upload</div>
                <p className="text-black text-sm">
                  Get your documents online in seconds
                </p>
              </div>
              <div>
                <div className="text-black font-semibold mb-2">Fully Searchable</div>
                <p className="text-black text-sm">
                  Find content across all your documents
                </p>
              </div>
              <div>
                <div className="text-black font-semibold mb-2">Easy Sharing</div>
                <p className="text-black text-sm">
                  Share secure links with your audience
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
