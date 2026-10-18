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
if (failures.length) {
  console.error("IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — active Africhiko customer/PWA shell, manifest, cache namespace and enquiry entry are aligned.");
