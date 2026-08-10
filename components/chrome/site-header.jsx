import Image from 'next/image';
import logo from './preclore-logo.webp';
import TactileButton from '@/components/ui/tactile-button';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/submit', label: 'Add Project' },
  { href: '/journal', label: 'Projects' },
  { href: '/support', label: 'Support' },
  { href: '/payment', label: 'Donate' },
  { href: '/connections', label: 'Requests' },
  { href: '/profile', label: 'My Profile' },
  { href: '/auth', label: 'Login' }
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Preclore logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />

          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
              Preclore v2.4
            </div>
            <div className="text-base font-black text-ink sm:text-lg">
              Student Research Platform
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <TactileButton
              key={item.href}
              href={item.href}
              variant="ghost"
              className="px-3 py-2 text-xs sm:px-4"
            >
              {item.label}
            </TactileButton>
          ))}
        </nav>
      </div>
    </header>
  );
}
