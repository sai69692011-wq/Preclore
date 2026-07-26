import './globals.css';
import SiteHeader from '@/components/chrome/site-header';

export const metadata = {
  title: 'Preclore v2.4 — Public Good Registry',
  description: 'Minimalist game-like public good registry for student systems research.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6 lg:py-10">{children}</main>
      </body>
    </html>
  );
}
