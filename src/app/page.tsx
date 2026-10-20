import {Suspense} from "react";
import AfrichikoPortal from "@/components/AfrichikoPortal";
export default function HomePage(){return <Suspense fallback={<main className="af-site"><p>Loading Africhiko…</p></main>}><AfrichikoPortal page="home"/></Suspense>}
