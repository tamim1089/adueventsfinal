import GlassNav from "@/components/glass/GlassNav";

// Public shell: floating glass nav over the dark canvas. The landing page
// supplies its own backgrounds (video hero, ambient blobs).
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlassNav />
      <main>{children}</main>
    </>
  );
}
