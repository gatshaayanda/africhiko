import fs from "node:fs";
const required=["src/components/AfrichikoPortal.tsx","src/app/page.tsx","src/app/services/page.tsx","src/app/basket/page.tsx","src/app/enquiry/page.tsx","src/app/account/page.tsx","src/app/admin/page.tsx","middleware.ts","firestore.rules","storage.rules","public/sw.js","src/lib/firebase/client.ts"];
const missing=required.filter(path=>!fs.existsSync(path));
const portal=fs.existsSync("src/components/AfrichikoPortal.tsx")?fs.readFileSync("src/components/AfrichikoPortal.tsx","utf8"):"";
const rules=fs.existsSync("firestore.rules")?fs.readFileSync("firestore.rules","utf8"):"";
const firebaseClient=fs.existsSync("src/lib/firebase/client.ts")?fs.readFileSync("src/lib/firebase/client.ts","utf8"):"";
const failures=[...missing.map(path=>"missing required file: "+path)];
for(const text of ["Gates & security","Trailers","Carports & sheds","Beds & furniture","Laser cutting","Custom work","Submit enquiry for review","Project location","Dimensions / size","Materials / finish","admins collection"]){if(!portal.includes(text))failures.push("portal missing expected customer/admin flow marker: "+text)}
const middleware=fs.existsSync("middleware.ts")?fs.readFileSync("middleware.ts","utf8"):"";
if(!middleware.includes("path.startsWith(\"/api/\")")||!middleware.includes("status:404"))failures.push("middleware does not quarantine inherited API endpoints");
if(!firebaseClient.includes('projectId: "africhiko"')||!firebaseClient.includes("NEXT_PUBLIC_FIREBASE_PROJECT_ID === expectedAfrichikoFirebase.projectId")||!firebaseClient.includes("NEXT_PUBLIC_FIREBASE_APP_ID === expectedAfrichikoFirebase.appId"))failures.push("Firebase client does not fail closed for non-Africhiko project configuration");
if(!rules.includes("match /services/")||!rules.includes("match /enquiries/")||!rules.includes("function isAdmin()"))failures.push("Firestore rules do not define the intended service/enquiry/admin boundaries");
if(rules.includes("allow read,write:if true")||rules.includes("allow read, write: if true"))failures.push("dangerous open Firestore rule detected");
if(failures.length){console.error("AFRICHIKO READINESS FAILED");for(const failure of failures)console.error(" - "+failure);process.exit(1)}
console.log("AFRICHIKO SOURCE READINESS CHECK PASSED. This static check does not prove Firebase rules are deployed or runtime flows work.");
