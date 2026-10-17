import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const forbiddenText = [
  /\bboemo\b/i,
  /meating[ -]?place/i,
  /namane[ -]?tyres/i,
  /atlas[ -]?service[ -]?centre/i,
  /tutorme/i,
  /namane-tyres\.vercel\.app/i,
  /boemo-joos-food-deals/i,
  /#FFC800/i,
  /#FF7B00/i,
  /#FF2A85/i,
  /#00E5FF/i
];

const ignoredDirs = new Set([".git","node_modules",".next","coverage"]);
const ignoredFiles = new Set(["AGENTS.md","scripts/verify-identity.mjs","docs/PWA-FOUNDATION.md"]);
const textExtensions = new Set([".ts",".tsx",".js",".mjs",".css",".json",".webmanifest",".md",".yml",".yaml",".txt",".html",".svg"]);

function walk(dir){
  const files=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(ignoredDirs.has(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const failures=[];
const identityFiles=["src/app/layout.tsx","src/app/manifest.ts","public/manifest.webmanifest","public/sw.js","src/app/offline/page.tsx"];
for(const rel of identityFiles){const text=fs.readFileSync(path.join(root,rel),"utf8");if(/The Plug|the-plug|theplug|plug-icon|Sneakers & Apparel|Frank/i.test(text))failures.push(rel+": inherited customer-facing identity remains");}
if(!fs.existsSync(path.join(root,"src/components/AfrichikoPortal.tsx"))) failures.push("Africhiko customer/admin portal missing");
for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll(path.sep,"/");
  if(ignoredFiles.has(rel)) continue;
  if(!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const content=fs.readFileSync(file,"utf8").replaceAll("BOEMO_REMINDER_CRON_SECRET","__REMINDER_CRON_SECRET__");
  for(const pattern of forbiddenText){
    if(pattern.test(content)) failures.push(`${rel}: inherited identity match ${pattern}`);
  }
}

const manifest=JSON.parse(fs.readFileSync(path.join(root,"public/manifest.webmanifest"),"utf8"));
if(manifest.name!=="Africhiko | Welding & Steel Fabrication") failures.push("public/manifest.webmanifest: wrong name");
if(manifest.short_name!=="Africhiko") failures.push("public/manifest.webmanifest: wrong short_name");
if(manifest.theme_color!=="#6d28d9") failures.push("public/manifest.webmanifest: wrong theme color");
if(!manifest.icons?.some(icon=>icon.src==="/africhiko-mark.svg")) failures.push("public/manifest.webmanifest: canonical Africhiko icon missing");
if(!fs.existsSync(path.join(root,"public/africhiko-mark.svg"))) failures.push("public/africhiko-mark.svg: missing");
const sw=fs.readFileSync(path.join(root,"public/sw.js"),"utf8");
if(!/theplug-shell-v\d+/.test(sw)) failures.push("public/sw.js: missing The Plug cache namespace");
if(!sw.includes("/africhiko-mark.svg")) failures.push("public/sw.js: canonical icon missing from app shell");
if(failures.length){
  console.error("IDENTITY VERIFICATION FAILED");
  for(const failure of failures) console.error(" - "+failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — Africhiko manifest, icon and cache identity match.");
