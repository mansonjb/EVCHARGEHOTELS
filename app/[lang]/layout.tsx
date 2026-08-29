import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { LANGS, type Lang } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!LANGS.includes(lang as Lang)) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <SiteHeader lang={lang as Lang} />
      {children}
    </div>
  );
}
