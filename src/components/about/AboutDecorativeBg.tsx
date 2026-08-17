export default function AboutDecorativeBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" />
      <div className="absolute -right-16 top-1/3 h-96 w-96 rounded-full bg-primary-50 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-primary-100/40 blur-3xl" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface to-primary-50/30" />
    </div>
  );
}
