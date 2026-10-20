import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const manifest = JSON.parse(read("public/manifest.webmanifest"));
const appManifest = read("src/app/manifest.ts");
const layout = read("src/app/layout.tsx");
const pwa = read("src/app/pwa-register.tsx");
const worker = read("public/sw.js");

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const [name, value] of [["public manifest", manifest], ["Next.js manifest source", appManifest]]) {
  if (name === "public manifest") {
    assert(Boolean(value.name && value.short_name), name + ": app name and short name are required");
    assert(Boolean(value.start_url && value.scope), name + ": start_url and scope are required");
    assert(["standalone", "fullscreen", "minimal-ui"].includes(value.display), name + ": display must support app-like installation");
    for (const size of [192, 512]) {
      assert(value.icons?.some(icon => icon.type === "image/png" && icon.sizes === size + "x" + size && icon.src?.startsWith("/africhiko-icon-" + size + ".png")), name + ": missing valid " + size + "px PNG declaration");
    }
  } else {
    assert(value.includes('name: "Africhiko | Welding & Steel Fabrication"'), name + ": identity missing");
    assert(value.includes('start_url: "/"') && value.includes('scope: "/"') && value.includes('display: "standalone"'), name + ": installation fields missing");
    for (const size of [192, 512]) assert(value.includes("/africhiko-icon-" + size + ".png"), name + ": missing " + size + "px PNG icon");
  }
}

assert(layout.includes("beforeinstallprompt") && layout.includes("event.preventDefault()") && layout.includes("__africhikoInstallPrompt"), "layout: early native prompt capture is missing");
assert(pwa.includes("promptWindow.__africhikoPwaListenerReady = true") && pwa.includes("delete promptWindow.__africhikoInstallPrompt"), "PWA controller: early event handoff is missing");
assert(pwa.includes("await prompt.prompt()"), "PWA controller: native prompt must be invoked from the branded click");
assert(pwa.includes("(canInstall || canShowManualInstall)"), "PWA controller: desktop/Android CTA must not be rendered without a native event");
assert(worker.includes('const CACHE_VERSION = "africhiko-shell-v25"'), "service worker: shell cache must be versioned for the resilience fix");
assert(worker.indexOf("try {") < worker.indexOf("importScripts(") && worker.indexOf("importScripts(") < worker.indexOf("} catch (error)"), "service worker: optional Firebase imports must be guarded");

// Execute the actual service worker while simulating a remote Firebase import failure.
// A CDN outage must not prevent the offline/install lifecycle listeners from registering.
const registered = new Set();
const mockSelf = {
  location: { origin: "https://africhiko.invalid" },
  addEventListener(name) { registered.add(name); },
};
const sandbox = {
  self: mockSelf,
  importScripts() { throw new Error("simulated Firebase CDN failure"); },
  console: { error() {}, log() {}, warn() {} },
};
try {
  vm.runInNewContext(worker, sandbox, { filename: "public/sw.js" });
} catch (error) {
  failures.push("service worker crashed when optional Firebase imports failed: " + String(error));
}
for (const name of ["install", "activate", "fetch", "message", "notificationclick"]) {
  assert(registered.has(name), "service worker: " + name + " handler did not register after optional import failure");
}

if (failures.length) {
  console.error("PWA INSTALL VERIFICATION FAILED");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}
console.log("PWA INSTALL VERIFIED — manifest declarations, early native-prompt capture, and service-worker resilience checks passed.");
