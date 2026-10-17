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
const identity=JSON.parse(fs.readFileSync(path.join(root,"scripts/identity.config.json"),"utf8"));
const identityFiles=["src/app/layout.tsx","src/app/manifest.ts","public/sw.js","src/app/offline/page.tsx"];
for(const rel of identityFiles){
  const file=path.join(root,rel);
  if(!fs.existsSync(file)){failures.push(rel+": required identity file missing");continue;}
  let content=fs.readFileSync(file,"utf8");
  for(const allowed of identity.allowedLegacyStrings||[]) content=content.replaceAll(allowed,"");
  for(const pattern of identity.forbiddenSourceIdentity||[]) if(content.toLowerCase().includes(pattern.toLowerCase())) failures.push(rel+": inherited customer-facing identity remains ("+pattern+")");
}
if(!fs.existsSync(path.join(root,"src/components/AfrichikoPortal.tsx"))) failures.push("Africhiko customer/admin portal missing");

// Next.js generates /manifest.webmanifest from src/app/manifest.ts. A public
// file at the same URL shadows that route, so reject duplicate manifests.
if(fs.existsSync(path.join(root,"public/manifest.webmanifest"))) failures.push("public/manifest.webmanifest: duplicate manifest shadows src/app/manifest.ts");

for(const file of walk(root)){
  const rel=path.relative(root,file).replaceAll(path.sep,"/");
  if(ignoredFiles.has(rel)) continue;
  if(!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const content=fs.readFileSync(file,"utf8").replaceAll("BOEMO_REMINDER_CRON_SECRET","__REMINDER_CRON_SECRET__");
  for(const pattern of forbiddenText){
    if(pattern.test(content)) failures.push(`${rel}: inherited identity match ${pattern}`);
  }
}

const generated=fs.readFileSync(path.join(root,"src/app/manifest.ts"),"utf8");
for(const [label,value] of [["name",identity.appName],["short_name",identity.shortName],["theme color",identity.themeColor],["canonical icon",identity.canonicalIcon]]){
  if(!generated.includes(value)) failures.push("src/app/manifest.ts: "+label+" differs from configured identity");
}
for(const icon of ["/icons/icon-192.png","/icons/icon-512.png"]){
  if(!generated.includes(icon)) failures.push("src/app/manifest.ts: required install icon missing ("+icon+")");
  if(!fs.existsSync(path.join(root,"public",icon.replace(/^\//,"")))) failures.push("public"+icon+": install icon file missing");
}
if(!generated.includes('purpose:"maskable"')&&!generated.includes('purpose: "maskable"')) failures.push("src/app/manifest.ts: maskable install icon missing");
const sw=fs.readFileSync(path.join(root,"public/sw.js"),"utf8");
if(!sw.includes(identity.cachePrefix+"-shell-v")) failures.push("public/sw.js: missing Africhiko cache namespace");
if(!sw.includes("/africhiko-mark.svg")) failures.push("public/sw.js: canonical icon missing from app shell");
if(failures.length){
  console.error("IDENTITY VERIFICATION FAILED");
  for(const failure of failures) console.error(" - "+failure);
  process.exit(1);
}
console.log("IDENTITY VERIFIED — Africhiko manifest, icons and cache identity match.");
