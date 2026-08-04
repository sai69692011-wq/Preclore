import TactileButton from '@/components/ui/tactile-button';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/submit', label: 'Quest' },
  { href: '/journal', label: 'Journal' },
  { href: '/support', label: 'Support Mission' },
  { href: '/payment', label: 'Payment' },
  { href: '/connections', label: 'Connections' },
  { href: '/profile', label: 'Profile' },
  { href: '/auth', label: 'Auth' }
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-4">
          <img
            src="/preclore-logo.webp"
            alt="Preclore logo"
            className="h-14 w-14 object-contain"
          />

          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
              Preclore v2.4
            </div>
            <div className="text-lg font-black text-ink">
              Public Good Registry
            </div>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <TactileButton
              key={item.href}
              href={item.href}
              variant="ghost"
              className="px-4 py-2 text-xs"
            >
              {item.label}
            </TactileButton>
          ))}
        </nav>
      </div>
    </header>
  );
}
