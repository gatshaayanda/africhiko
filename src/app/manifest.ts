import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Africhiko | Welding & Steel Fabrication",
    short_name: "Africhiko",
    description: "Install Africhiko for one-tap access to welding and steel fabrication in Botswana. Request a quotation for your project.",
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
        url: "/request",
        icons: [{ src: "/africhiko-icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "My enquiries",
        short_name: "Orders",
        description: "Review your project enquiries",
        url: "/account",
        icons: [{ src: "/africhiko-icon.svg", sizes: "192x192", type: "image/png" }]
      },
      {
        name: "Africhiko admin",
        short_name: "Admin",
        description: "Open protected business control",
        url: "/admin",
        icons: [{ src: "/africhiko-icon.svg", sizes: "192x192", type: "image/png" }]
      }
    ]
  };
}
