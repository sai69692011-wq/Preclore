import './globals.css';
import SiteHeader from '@/components/chrome/site-header';

const siteUrl = 'https://preclore.vercel.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Preclore – Student Research Platform',
    template: '%s | Preclore'
  },
  description:
    'Preclore is a student research platform where students can share projects, add public links, and get discovered by teachers, reviewers, and NGOs.',
  keywords: [
    'Preclore',
    'student research platform',
    'student projects',
    'school projects',
    'research showcase',
    'student innovation',
    'project platform'
  ],
  alternates: {
    canonical: '/'
  },
  openGraph: {
    title: 'Preclore – Student Research Platform',
    description:
      'Share student projects, public links, and research ideas on Preclore.',
    url: siteUrl,
    siteName: 'Preclore',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Preclore – Student Research Platform',
    description:
      'Share student projects, public links, and research ideas on Preclore.'
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
