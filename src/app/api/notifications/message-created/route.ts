import {NextResponse} from "next/server";
import {cert,getApps,initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
export const runtime="nodejs";
function app(){
 const raw=process.env.FIREBASE_ADMIN_KEY;
 if(!raw)throw new Error("The Plug notifications are not configured yet. Add FIREBASE_ADMIN_KEY in Vercel.");
 const existing=getApps()[0];if(existing)return existing;
 let serviceAccount:Record<string,unknown>;
 try{serviceAccount=JSON.parse(raw) as Record<string,unknown>}catch{throw new Error("The Plug notification credentials are not valid JSON yet.")}
 return initializeApp({credential:cert(serviceAccount as Parameters<typeof cert>[0])});
}
export async function POST(request:Request){
 try{
  const a=app(),header=request.headers.get("authorization")||"",match=header.match(/^Bearer\s+(.+)$/i);
  if(!match)throw new Error("Missing authentication token.");
  const uid=(await getAuth(a).verifyIdToken(match[1])).uid;
  const {conversationId,messageId}=await request.json() as {conversationId?:unknown;messageId?:unknown};
  if(typeof conversationId!=="string"||!conversationId||typeof messageId!=="string"||!messageId)throw new Error("Missing conversation message identifiers.");
  const db=getFirestore(a),conversationRef=db.collection("conversations").doc(conversationId);
  const [conversation,message]=await Promise.all([conversationRef.get(),conversationRef.collection("messages").doc(messageId).get()]);
  if(!conversation.exists||!message.exists)throw new Error("Conversation message not found.");
  const data=conversation.data()??{},msg=message.data()??{},senderRole=String(msg.senderRole??"");
  if(String(msg.senderId??"")!==uid)throw new Error("Message does not belong to this sender.");
  let recipientIds:string[]=[];
  if(senderRole==="customer"){
   if(String(data.customerId??"")!==uid)throw new Error("Customer is not a participant in this conversation.");
   const admins=await db.collection("admins").get();
   recipientIds=admins.docs.filter(d=>["owner","staff"].includes(String(d.data()?.role??"").toLowerCase())).map(d=>d.id);
  }else if(senderRole==="admin"){
   const admin=await db.collection("admins").doc(uid).get();
   if(!admin.exists||!["owner","staff"].includes(String(admin.data()?.role??"").toLowerCase()))throw new Error("Only Plug staff can send a staff reply notification.");
   const customerId=String(data.customerId??"");
   if(!customerId)throw new Error("Conversation has no customer.");
   recipientIds=[customerId];
  }else{
   throw new Error("Message sender role is invalid.");
  }
  const dbPrefs=await Promise.all(recipientIds.map(async recipient=>{
   const [pref,tokens]=await Promise.all([db.collection("notificationPreferences").doc(recipient).get(),db.collection("notificationTokens").doc(recipient).collection("tokens").get()]);
   return {recipient,enabled:pref.data()?.enabled===true,tokens:tokens.docs.map(t=>({doc:t,token:String(t.data().token??"")})).filter(t=>t.token)};
  }));
  const messaging=getMessaging(a),preview=(String(msg.text??"").trim()||"Attachment sent").slice(0,120),base=(process.env.NEXT_PUBLIC_BASE_URL||"https://the-plug-pearl.vercel.app");
  let sent=0,failed=0;
  for(const target of dbPrefs){
   if(!target.enabled||!target.tokens.length)continue;
   const link=senderRole==="customer"?"/admin":"/account";
   const title=senderRole==="customer"?String(data.customerName??"A customer")+" sent a message":"The Plug replied";
   const response=await messaging.sendEachForMulticast({
    tokens:target.tokens.map(t=>t.token),notification:{title,body:preview},
    data:{title,body:preview,link,conversationId,messageId,type:"message-created"},
    webpush:{fcmOptions:{link:base+link},notification:{tag:"the-plug-message-"+conversationId,icon:"/plug-icon.svg",badge:"/plug-icon.svg"}}
   });
   sent+=response.successCount;failed+=response.failureCount;
   await Promise.all(response.responses.map(async(result,index)=>{
    const code=result.error?.code;
    if(!result.success&&(code==="messaging/registration-token-not-registered"||code==="messaging/invalid-registration-token"))await target.tokens[index].doc.ref.delete().catch(()=>{});
   }));
  }
  return NextResponse.json({sent,failed});
 }catch(error){
  console.error("The Plug conversation notification failed:",error);
  return NextResponse.json({sent:0,error:error instanceof Error?error.message:"The Plug could not notify the conversation recipient."},{status:400});
 }
}
