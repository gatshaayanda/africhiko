import {NextResponse, type NextRequest} from "next/server";

const PUBLIC_ROUTES=new Set(["/","/services","/basket","/enquiry","/account","/admin","/offline","/request","/manifest.webmanifest","/robots.txt","/sitemap.xml"]);
const STATIC_ASSET=/\.(?:svg|png|jpe?g|webp|gif|mp4|webm|ico|woff2?|ttf|otf|css|js|map|txt|xml)$/i;

export function middleware(request:NextRequest){
 const path=request.nextUrl.pathname;
 // Disable inherited server/API endpoints until a route is deliberately rebuilt for Africhiko.
 if(path==="/api"||path.startsWith("/api/"))return new NextResponse(null,{status:404});
 // Never serve inherited The Plug raster app icons.
 if(path==="/plug-icon-192.png"||path==="/plug-icon-512.png")return new NextResponse(null,{status:404});
 if(path.startsWith("/_next/")||STATIC_ASSET.test(path)||PUBLIC_ROUTES.has(path))return NextResponse.next();
 // Old storefront/admin routes are not part of Africhiko's first release.
 return new NextResponse(null,{status:404});
}

export const config={matcher:["/:path*"]};
