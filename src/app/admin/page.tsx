import type { Metadata } from "next";
import AfrichikoPortal from "@/components/AfrichikoPortal";

export const metadata: Metadata = {
  title: "Enquiry operations",
  description: "Review Africhiko project enquiries and manage fabrication services.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AfrichikoPortal page="admin" />;
}
