import './globals.css';
import SiteHeader from '@/components/chrome/site-header';
import SiteFooter from '@/components/chrome/site-footer';

// ... (your metadata code stays in the middle) ...

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 lg:px-6 lg:py-10">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
