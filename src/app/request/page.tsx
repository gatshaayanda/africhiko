import { redirect } from "next/navigation";

export const metadata = {
  title: "Request a quotation",
  description: "Describe your welding or steel fabrication project for Africhiko.",
};

export default function RequestPage() {
  redirect("/#enquire");
}
