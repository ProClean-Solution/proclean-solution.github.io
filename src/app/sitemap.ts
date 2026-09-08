import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

/**
 * Eine Seite, ein Eintrag.
 *
 * Die Sitemap wirkt hier klein, gehört aber dazu: sie ist der Weg, eine
 * neue Adresse in der Google Search Console einzureichen, ohne auf einen
 * eingehenden Verweis zu warten.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
