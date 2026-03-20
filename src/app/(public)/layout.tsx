/**
 * @fileOverview Public gateway layout for MAP261125.
 * Forensic: Optimized for absolute stability on mobile devices by providing a clean, non-restrictive container.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 font-body antialiased selection:bg-primary/10">
      {children}
    </div>
  );
}