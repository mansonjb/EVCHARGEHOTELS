import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://plugstays.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // Les routes d'image générées gaspillent le budget de crawl.
      { userAgent: "Googlebot", disallow: ["/*opengraph-image"] },
      { userAgent: "Bingbot", disallow: ["/*opengraph-image"] },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
