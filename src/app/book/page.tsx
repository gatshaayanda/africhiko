import type { Metadata } from "next";
import { Suspense } from "react";
import BookForm from "./book-form";

export const metadata: Metadata = {
  title: "Request Assistance",
  description: "Request tyre fitting, puncture repair, pressure checks, tyre sales or roadside assistance from Namane Tyres in Gaborone.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <Suspense fallback={<main className="bookPage"><div className="formWrap"><div className="formCard">Loading booking form…</div></div></main>}>
      <BookForm />
    </Suspense>
  );
}
