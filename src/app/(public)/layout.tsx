import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";

// Public shell: full-width nav with a hairline rule (not a floating glass pill),
// and a shared editorial footer. Each page supplies its own backgrounds and
// band rhythm.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
