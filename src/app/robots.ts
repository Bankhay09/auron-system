import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_APP_URL || "https://www.auronsystem.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/diary", "/settings", "/onboarding"]
    },
    sitemap: `${host}/sitemap.xml`
  };
}
