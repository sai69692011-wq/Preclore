import TactileButton from '@/components/ui/tactile-button';

export default function NotFound() {
  return (
    <div className="rounded-[34px] border-2 border-ink bg-white/80 p-8 shadow-[0_8px_0_0_rgba(44,43,42,1)]">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-forest">404</div>
      <h1 className="mt-3 text-4xl font-black text-ink">Quest not found</h1>
      <p className="mt-3 text-sm leading-7 text-ink/80">That registry page does not exist yet.</p>
      <div className="mt-5 flex gap-3">
        <TactileButton href="/journal" variant="secondary">Back to Journal</TactileButton>
        <TactileButton href="/" variant="primary">Go Home</TactileButton>
      </div>
    </div>
  );
}
