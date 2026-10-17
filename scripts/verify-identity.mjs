import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenText = [
  /\bThe Plug\b/i,
  /the-plug\.vercel\.app/i,
  /theplug-(?:shell|media)-v?\d*/i,
  /__THE_PLUG_FIREBASE_CONFIG__/i,
  /\bboemo\b/i,
  /meating[ -]?place/i,
  /namane[ -]?tyres/i,
  /atlas[ -]?service[ -]?centre/i,
  /tutorme/i,
  /namane-tyres\.vercel\.app/i,
  /boemo-joos-food-deals/i
];

const ignoredDirs = new Set([".git","node_modules",".next","coverage"]);
const ignoredFiles = new Set(["AGENTS.md","scripts/verify-identity.mjs","docs/PWA-FOUNDATION.md"]);
const textExtensions = new Set([".ts",".tsx",".js",".mjs",".css",".json",".webmanifest",".md",".yml",".yaml",".txt",".html",".svg"]);

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const failures = [];
for (const file of walk(root)) {
  const rel = path.relative(root,file).replaceAll(path.sep,"/");
  if (ignoredFiles.has(rel)) continue;
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const content = fs.readFileSync(file,"utf8");
  for (const pattern of forbiddenText) {
    if (pattern.test(content)) failures.push(rel + ": inherited identity match " + pattern);
  }
}

const expectedName = "Africhiko | Welding & Steel Fabrication";
const manifests = [
  ["public/manifest.webmanifest", JSON.parse(fs.readFileSync(path.join(root,"public/manifest.webmanifest"),"utf8"))],
  ["src/app/manifest.ts", fs.readFileSync(path.join(root,"src/app/manifest.ts"),"utf8")]
];
const publicManifest = manifests[0][1];
if (publicManifest.name !== expectedName) failures.push("public/manifest.webmanifest: wrong name");
if (publicManifest.short_name !== "Africhiko") failures.push("public/manifest.webmanifest: wrong short_name");
if (publicManifest.theme_color !== "#6D28D9") failures.push("public/manifest.webmanifest: wrong theme color");
if (!publicManifest.icons?.some(icon => icon.src === "/africhiko-icon.svg")) failures.push("public manifest: Africhiko icon missing");
const appManifest = manifests[1][1];
for (const value of [expectedName, "short_name: \"Africhiko\"", "theme_color: \"#6D28D9\"", "/africhiko-icon.svg"]) {
  if (!appManifest.includes(value)) failures.push("src/app/manifest.ts: missing " + value);
}
for (const file of ["public/africhiko-icon.svg","src/app/pwa-register.tsx","src/app/layout.tsx","public/sw.js"]) {
  if (!fs.existsSync(path.join(root,file))) failures.push(file + ": missing");
}
const sw = fs.readFileSync(path.join(root,"public/sw.js"),"utf8");
if (!/africhiko-shell-v\d+/.test(sw)) failures.push("public/sw.js: missing Africhiko cache namespace");
if (!sw.includes("/africhiko-icon.svg")) failures.push("public/sw.js: Africhiko icon missing from app shell");
if (failures.length) {
  console.error("IDENTITY VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — Africhiko branding and PWA cache namespace are configured.");
