import Link from 'next/link';
import { cn } from '@/lib/utils';

const baseClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink px-5 py-3 text-sm font-bold transition-transform duration-150 active:translate-y-[3px] active:shadow-none';

const variants = {
  primary: 'bg-coral text-white shadow-[0_4px_0_0_rgba(44,43,42,1)] hover:-translate-y-[1px]',
  secondary: 'bg-butter text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)] hover:-translate-y-[1px]',
  mint: 'bg-mint text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)] hover:-translate-y-[1px]',
  lilac: 'bg-lilac text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)] hover:-translate-y-[1px]',
  ghost: 'bg-white/80 text-ink shadow-[0_4px_0_0_rgba(44,43,42,1)] hover:-translate-y-[1px]'
};

export function buttonClassName({ variant = 'primary', className = '' } = {}) {
  return cn(baseClass, variants[variant], className);
}

export default function TactileButton({
  children,
  href,
  className,
  variant = 'primary',
  type = 'button',
  ...props
}) {
  const classes = buttonClassName({ variant, className });

  if (href) {
    return (
      <Link className={classes} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} type={type} {...props}>
      {children}
    </button>
  );
}
