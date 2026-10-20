import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Africhiko",
    short_name: "Africhiko",
    description: "Welding and steel fabrication in Botswana. Browse services and request a project quotation.",
    start_url: "/",
    display: "standalone",
    background_color: "#6d28d9",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "construction"],
    icons: [
      { src: "/africhiko-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/africhiko-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
