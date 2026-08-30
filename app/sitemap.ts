import type { MetadataRoute } from "next";
import { cities, hotels } from "@/lib/data";
import { LANGS } from "@/lib/i18n";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://plugstays.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  for (const lang of LANGS) {
    urls.push({ url: `${BASE}/${lang}`, lastModified: now, changeFrequency: "weekly", priority: 1 });
    urls.push({ url: `${BASE}/${lang}/france`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
    urls.push({ url: `${BASE}/${lang}/methode`, lastModified: now, changeFrequency: "monthly", priority: 0.5 });
    urls.push({
      url: `${BASE}/${lang}/route/paris-bordeaux`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    for (const c of cities) {
      urls.push({
        url: `${BASE}/${lang}/${c.slug}`,
        lastModified: new Date(c.scrapedAt),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
    for (const h of hotels) {
      urls.push({
        url: `${BASE}/${lang}/${h.citySlug}/${h.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }
  return urls;
}
