// Admin canvas. The login page renders standalone; the dashboard supplies its
// own sidebar chrome. Auth is enforced in proxy.ts before this renders.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[100svh] bg-bg">{children}</div>;
}
