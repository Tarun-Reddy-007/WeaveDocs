import { Providers } from '@/app/providers';

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="flex flex-col min-h-screen bg-neutral-950">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
