import './globals.css';
import SiteHeader from '@/components/chrome/site-header';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://preclore.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Preclore v2.4 — Public Good Registry',
    template: '%s | Preclore'
  },
  description:
    'Preclore is a public-good registry for student-led systems research with instant deterministic VQ scoring, searchable journal pages, and direct mission support.',
  keywords: [
    'Preclore',
    'student research',
    'public good registry',
    'systems research',
    'VQ engine',
    'research journal',
    'field verified research'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Preclore v2.4 — Public Good Registry',
    description:
      'A game-like public research registry for student systems work, with instant VQ scoring and a searchable global research journal.',
    url: siteUrl,
    siteName: 'Preclore',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preclore v2.4 — Public Good Registry',
    description:
      'Student-led systems research, instant VQ scoring, and a public-good journal.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
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
