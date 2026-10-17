import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Africhiko | Welding & Steel Fabrication",
    short_name: "Africhiko",
    description: "Welding and steel fabrication in Botswana. Describe your project and request a quotation.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#6D28D9",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: "/africhiko-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
    shortcuts: [
      {
        name: "Request a quotation",
        short_name: "Request",
        description: "Describe your welding or fabrication project",
        url: "/#enquire",
        icons: [{ src: "/africhiko-icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
