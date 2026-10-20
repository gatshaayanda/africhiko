import {Suspense} from "react";
import AfrichikoPortal from "@/components/AfrichikoPortal";
export default function BasketPage(){return <Suspense fallback={<main className="af-site"><p>Loading basket…</p></main>}><AfrichikoPortal page="basket"/></Suspense>}
