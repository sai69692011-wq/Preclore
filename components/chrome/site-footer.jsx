import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-paper mt-12">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">
              Preclore v2.4
            </div>
            <p className="mt-1 text-sm text-ink/75">
              Public-interest academic research registry for student-led systems research.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-semibold text-ink/80">
            <Link href="/terms" className="underline hover:text-coral">
              Terms of Service
            </Link>
            <Link href="/privacy" className="underline hover:text-coral">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
