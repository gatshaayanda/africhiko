import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";

export const runtime="nodejs";

function adminApp(){
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("The Plug notifications are not configured yet.");
 const existing=getApps()[0];
 if(existing)return existing;
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
export async function POST(request:Request){
 try{
  const {requestId}=await request.json() as {requestId?:unknown};
  if(typeof requestId!=="string"||!requestId)throw new Error("Missing request ID.");
  const app=adminApp();const db=getFirestore(app);const messaging=getMessaging(app);
  const snap=await db.collection("sourcingRequests").doc(requestId).get();
  if(!snap.exists)throw new Error("Sourcing request not found.");
  const data=snap.data()??{};const customerId=String(data.customerId??"");
  if(!customerId)throw new Error("Sourcing request has no customer.");
  const admins=await db.collection("admins").get();let sent=0;
  const title="The Plug request updated";
  const body=String(data.status??"Your request has been updated.")+(data.quotedPrice!==undefined?" · Quote P"+Number(data.quotedPrice).toFixed(2):"");
  for(const admin of admins.docs){const pref=(await db.collection("notificationPreferences").doc(admin.id).get()).data();if(!pref?.enabled)continue;const tokens=await db.collection("notificationTokens").doc(admin.id).collection("tokens").get();for(const token of tokens.docs){try{await messaging.send({token:String(token.data().token),notification:{title,body},data:{link:"/admin",requestId},webpush:{fcmOptions:{link:(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug.vercel.app")+"/admin"}}});sent++}catch{}}}
  return NextResponse.json({sent});
 }catch(error){console.error("The Plug request notification failed:",error);return NextResponse.json({sent:0,error:error instanceof Error?error.message:"Notification unavailable while The Plug is being built."},{status:400})}
}
