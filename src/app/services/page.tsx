import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ServicesPage() {
  const services = [
    {
      id: 'product-catalogs',
      title: 'Product Catalogs',
      description: 'Transform your product catalogs into interactive, searchable web experiences',
      icon: '📦',
      href: '/services/product-catalogs',
    },
  ];

  return (
    <div className="container-centered py-12">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="section-title mb-2">Services</h1>
        <p className="section-subtitle">Choose a service to get started</p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Link key={service.id} href={service.href}>
            <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
              {/* Icon */}
              <div className="text-5xl mb-4">{service.icon}</div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-black mb-3">
                {service.title}
              </h2>

              {/* Description */}
              <p className="text-black flex-1 mb-6">
                {service.description}
              </p>

              {/* CTA Button */}
              <Button variant="primary" size="md" className="w-full">
                Open Service
              </Button>
            </div>
          </Link>
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-16 pt-12 border-t border-gray-300">
        <p className="text-black text-center font-medium">
          More services coming soon...
        </p>
      </div>
    </div>
  );
}
