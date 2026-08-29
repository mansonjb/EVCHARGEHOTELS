import type { Metadata } from "next";
import { ListView } from "@/components/list-view";
import { STR, type Lang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = STR[lang as Lang];
  return { title: `${t.listH1} ${t.listH1b} · Bordeaux` };
}

export default async function ListPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <ListView lang={lang as Lang} />;
}
