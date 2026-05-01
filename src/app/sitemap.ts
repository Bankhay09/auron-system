import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const host = process.env.NEXT_PUBLIC_APP_URL || "https://www.auronsystem.com";
  return [
    { url: `${host}/login`, lastModified: new Date() },
    { url: `${host}/register`, lastModified: new Date() },
    { url: `${host}/forgot-password`, lastModified: new Date() }
  ];
}
