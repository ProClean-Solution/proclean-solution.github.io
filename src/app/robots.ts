import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

/**
 * Alles erlauben und die Sitemap nennen.
 *
 * Ohne diese Datei antwortet die Seite auf /robots.txt mit 404. Das
 * verbietet nichts, aber es ist das Erste, was ein Crawler abruft — und
 * die Sitemap findet er sonst nur, wenn jemand sie von Hand einreicht.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
