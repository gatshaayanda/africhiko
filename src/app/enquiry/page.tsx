import {Suspense} from "react";
import AfrichikoPortal from "@/components/AfrichikoPortal";
export default function EnquiryPage(){return <Suspense fallback={<main className="af-site"><p>Loading project enquiry…</p></main>}><AfrichikoPortal page="enquiry"/></Suspense>}
