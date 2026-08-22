import Image from 'next/image';
import Link from 'next/link';
import logo from '../../public/preclore-logo.webp';
import { deriveAccessProfile } from '@/lib/access';
import TactileButton from '@/components/ui/tactile-button';
import { createClient } from '@/lib/supabase/server';

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let access = null;

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, birth_year')
      .eq('id', user.id)
      .maybeSingle();

    access = deriveAccessProfile(profile || {});
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/journal', label: 'Projects' },
    ...(access?.canSubmit ? [{ href: '/submit', label: 'Add Project' }] : []),
    { href: '/support', label: 'Support' },
    ...(user ? [{ href: '/connections', label: 'Requests' }] : []),
    { href: '/profile', label: user ? 'My Profile' : 'Profile' },
    { href: '/auth', label: user ? 'Switch Account' : 'Create / Login' }
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Preclore logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
            priority
          />
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">Preclore</div>
            <div className="text-lg font-black text-ink">Student Research Platform</div>
          </div>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <TactileButton key={item.href} href={item.href} variant="ghost" className="px-4 py-2 text-xs">
              {item.label}
            </TactileButton>
          ))}
        </nav>
      </div>
    </header>
  );
}
