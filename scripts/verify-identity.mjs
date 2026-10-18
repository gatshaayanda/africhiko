import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const expectedName = "Africhiko | Welding & Steel Fabrication";
const publicManifestPath = path.join(root, "public/manifest.webmanifest");
const publicManifest = JSON.parse(fs.readFileSync(publicManifestPath, "utf8"));
const appManifest = fs.readFileSync(path.join(root, "src/app/manifest.ts"), "utf8");
const shell = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
const layout = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "src/app/page.tsx"), "utf8");
const portal = fs.readFileSync(path.join(root, "src/components/AfrichikoPortal.tsx"), "utf8");
const requestPage = fs.readFileSync(path.join(root, "src/app/request/page.tsx"), "utf8");
const firebaseConfigRoute = fs.readFileSync(path.join(root, "src/app/api/firebase/messaging-sw-config/route.ts"), "utf8");
const accountRoute = fs.readFileSync(path.join(root, "src/app/account/page.tsx"), "utf8");
const adminRoute = fs.readFileSync(path.join(root, "src/app/admin/page.tsx"), "utf8");
const offlinePage = fs.readFileSync(path.join(root, "src/app/offline/page.tsx"), "utf8");
const savedRoute = fs.readFileSync(path.join(root, "src/app/saved/page.tsx"), "utf8");
const orderRoute = fs.readFileSync(path.join(root, "src/app/orders/[id]/page.tsx"), "utf8");
const requestTrackingRoute = fs.readFileSync(path.join(root, "src/app/requests/[id]/page.tsx"), "utf8");
const productRoute = fs.readFileSync(path.join(root, "src/app/products/[id]/page.tsx"), "utf8");
const inviteRoute = fs.readFileSync(path.join(root, "src/app/invite/[inviteId]/page.tsx"), "utf8");
const storefrontAdminRoute = fs.readFileSync(path.join(root, "src/app/admin/storefront/page.tsx"), "utf8");
const communityAdminRoute = fs.readFileSync(path.join(root, "src/app/admin/community/page.tsx"), "utf8");
const defaultIcon = fs.readFileSync(path.join(root, "public/icon.svg"), "utf8");
const africhikoIcon = fs.readFileSync(path.join(root, "public/africhiko-icon.svg"), "utf8");

if (JSON.stringify(publicManifest.name) !== JSON.stringify(expectedName)) failures.push("public manifest has the wrong app name");
if (publicManifest.short_name !== "Africhiko") failures.push("public manifest has the wrong short name");
if (publicManifest.theme_color !== "#6D28D9") failures.push("public manifest has the wrong theme color");
for (const [src, size] of [["/africhiko-icon-192.png", 192], ["/africhiko-icon-512.png", 512]]) {
  const icon = publicManifest.icons?.find(item => item.src === src && item.type === "image/png" && item.sizes === size + "x" + size);
  const iconPath = path.join(root, "public", src.slice(1));
  if (!icon) failures.push("public manifest must declare the " + size + "px PNG icon");
  if (!fs.existsSync(iconPath)) failures.push("generated PWA icon is missing: " + src);
  else {
    const bytes = fs.readFileSync(iconPath);
    if (bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" || bytes.readUInt32BE(16) !== size || bytes.readUInt32BE(20) !== size) failures.push("PWA icon is not a valid " + size + "x" + size + " PNG: " + src);
  }
}
if (!publicManifest.icons?.some(icon => icon.src === "/africhiko-icon.svg" && icon.type === "image/svg+xml")) failures.push("public manifest must retain the SVG fallback with the correct MIME type");
if (!appManifest.includes(expectedName) || !appManifest.includes('short_name: "Africhiko"') || !appManifest.includes('theme_color: "#6D28D9"')) failures.push("Next.js manifest identity does not match Africhiko");
if (!fs.existsSync(path.join(root, "public/africhiko-icon.svg"))) failures.push("Africhiko SVG fallback icon asset is missing");
if (!fs.existsSync(path.join(root, "public/africhiko-icon-180.png"))) failures.push("Apple touch icon is missing");
if (!/africhiko-shell-v\d+/.test(shell) || !shell.includes("/africhiko-icon.svg")) failures.push("service-worker cache or icon identity is incorrect");
if (/\bThe Plug\b|the-plug\.vercel\.app|__THE_PLUG_FIREBASE_CONFIG__/i.test([layout, home, requestPage, firebaseConfigRoute, shell].join("\n"))) failures.push("active customer/PWA runtime still contains source-app identity");
if (!portal.includes("PROJECT ENQUIRY") || !portal.includes("Submit enquiry for review") || !portal.includes("Project brief") || portal.includes("wa.me/")) failures.push("Africhiko project enquiry flow is missing or contains an external WhatsApp handoff");
if (!requestPage.includes('redirect("/#enquire")')) failures.push("quotation shortcut does not lead to the Africhiko enquiry form");
if (!shell.includes('const CACHE_VERSION = "africhiko-shell-v19"') || !shell.includes('key.startsWith("theplug-shell-")') || !shell.includes('key.startsWith("theplug-media-")')) failures.push("service-worker version or inherited-cache cleanup is incorrect");
if (defaultIcon !== africhikoIcon) failures.push("default browser icon does not match Africhiko identity");
for (const legacyIcon of ["plug-icon.svg", "plug-icon-192.png", "plug-icon-512.png"]) {
  if (fs.existsSync(path.join(root, "public", legacyIcon))) failures.push("inherited The Plug icon asset remains: " + legacyIcon);
}
if (!accountRoute.includes('AfrichikoPortal page="account"')) failures.push("customer account route is not wired to Africhiko enquiries");
if (!adminRoute.includes('AfrichikoPortal page="admin"')) failures.push("admin route is not wired to Africhiko enquiry operations");
if (!offlinePage.includes("CONNECTION INTERRUPTED") || /public finds|The Plug|THE PLUG/i.test(offlinePage)) failures.push("offline page contains inherited retail identity or copy");
if (!savedRoute.includes('redirect("/services")')) failures.push("legacy saved-finds route is not redirected to Africhiko services");
if (!orderRoute.includes('redirect("/account")') || !requestTrackingRoute.includes('redirect("/account")')) failures.push("legacy retail tracking routes are not redirected to Africhiko enquiries");
if (!productRoute.includes('redirect("/services")') || !inviteRoute.includes('redirect("/account")')) failures.push("legacy retail product/invite routes are not redirected");
if (!storefrontAdminRoute.includes('redirect("/admin")') || !communityAdminRoute.includes('redirect("/admin")')) failures.push("legacy admin routes are not redirected to Africhiko operations");
if (/\\bThe Plug\\b|the-plug\\.vercel\\.app|__THE_PLUG_FIREBASE_CONFIG__/i.test([layout, home, requestPage, firebaseConfigRoute, shell, accountRoute, adminRoute, offlinePage, savedRoute, orderRoute, requestTrackingRoute, productRoute, inviteRoute, storefrontAdminRoute, communityAdminRoute].join("\\n"))) failures.push("active customer/PWA runtime still contains source-app identity");
if (failures.length) {
  console.error("IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — active Africhiko customer/PWA shell, manifest, cache namespace and enquiry entry are aligned.");
