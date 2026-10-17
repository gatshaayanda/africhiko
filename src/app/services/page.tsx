import {Suspense} from "react";
import AfrichikoPortal from "@/components/AfrichikoPortal";
export default function ServicesPage(){return <Suspense fallback={<main className="af-site"><p>Loading services…</p></main>}><AfrichikoPortal page="services"/></Suspense>}
