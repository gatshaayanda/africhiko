import type {MetadataRoute} from "next";

const icon = { src: "/africhiko-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" as const };

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Africhiko | Welding & Steel Fabrication",
    short_name: "Africhiko",
    description: "Explore welding and steel fabrication services in Gaborone, Botswana.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f5f8",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    lang: "en",
    categories: ["business", "shopping"],
    prefer_related_applications: false,
    icons: [icon],
    shortcuts: [
      { name: "Browse services", short_name: "Services", description: "Browse Africhiko fabrication services", url: "/services", icons: [icon] },
      { name: "Project enquiry", short_name: "Enquiry", description: "Describe a fabrication project", url: "/enquiry", icons: [icon] },
      { name: "Project basket", short_name: "Basket", description: "Review selected fabrication services", url: "/basket", icons: [icon] },
    ],
  };
}
