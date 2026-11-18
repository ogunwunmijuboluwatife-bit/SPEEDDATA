/* DataPilot runtime: sign-in, database and AI on Supabase + Vercel */
(()=>{
const C=window.DP_CONFIG||{};let sb=null,SES=null,ROLE=null,okR;const ready=new Promise(r=>okR=r);
const css="position:fixed;inset:0;z-index:999;background:#0a1f4e;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Segoe UI,Roboto,Arial,sans-serif";
function gate(msg){let o=document.getElementById("dpg");if(!o){o=document.createElement("div");o.id="dpg";o.style.cssText=css;document.body.appendChild(o)}
 o.innerHTML=`<div style="background:#fff;border-radius:14px;max-width:380px;width:100%;padding:24px"><h2 style="margin:0 0 4px;color:#0a1f4e">DataPilot</h2><p style="margin:0 0 14px;color:#5d6f89">Sign in to continue</p><input id="dn" class="fi" placeholder="Full name (new accounts)" style="width:100%;padding:10px;margin:4px 0;border:1px solid #d5e0f0;border-radius:8px"><input id="de" type="email" placeholder="Email" style="width:100%;padding:10px;margin:4px 0;border:1px solid #d5e0f0;border-radius:8px"><input id="dp" type="password" placeholder="Password (8+ characters)" style="width:100%;padding:10px;margin:4px 0;border:1px solid #d5e0f0;border-radius:8px"><p id="dm" style="color:#b3261e;min-height:20px;margin:6px 0">${msg||""}</p><button id="di" style="background:#1f5fe0;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer">Sign in</button> <button id="du" style="background:#eaf1fd;color:#0a1f4e;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer">Create account</button> <button id="df" style="background:none;border:0;color:#1f5fe0;cursor:pointer;margin-top:8px">Forgot password</button></div>`;
 const v=i=>document.getElementById(i).value.trim(),m=t=>document.getElementById("dm").textContent=t;
 document.getElementById("di").onclick=async()=>{const{error}=await sb.auth.signInWithPassword({email:v("de"),password:v("dp")});if(error)m(error.message)};
 document.getElementById("du").onclick=async()=>{if(!v("dn"))return m("Enter your full name.");const{data,error}=await sb.auth.signUp({email:v("de"),password:v("dp"),options:{data:{full_name:v("dn")}}});if(error)m(error.message);else if(!data.session)m("Check your email to confirm your account, then sign in.")};
 document.getElementById("df").onclick=async()=>{if(!v("de"))return m("Enter your email first.");const{error}=await sb.auth.resetPasswordForEmail(v("de"),{redirectTo:location.origin});m(error?error.message:"Reset link sent. Check your email.")}}
async function start(s){SES=s;const g=document.getElementById("dpg");if(g)g.remove();const u=s.user,nm=(u.user_metadata&&u.user_metadata.full_name)||u.email.split("@")[0];
 try{await sb.from("docs").upsert({path:"profiles/"+u.id,coll:"profiles",uid:u.id,data:{name:nm}})}catch(e){}
 try{const r=await sb.from("staff").select("role").eq("uid",u.id).maybeSingle();ROLE=r.data&&r.data.role||null}catch(e){}
 const b=document.createElement("button");b.textContent="Sign out";b.style.cssText="position:fixed;top:8px;right:10px;z-index:30;background:#eaf1fd;color:#0a1f4e;border:0;border-radius:8px;padding:6px 12px;cursor:pointer";b.onclick=async()=>{await sb.auth.signOut();location.reload()};document.body.appendChild(b);okR(nm)}
function init(){if(!window.supabase||!/^https?:/.test(C.SUPABASE_URL||"")){document.body.innerHTML='<p style="padding:30px;font-family:sans-serif">DataPilot is not configured yet. Edit config.js with your Supabase URL and anon key.</p>';return}
 sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY);sb.auth.getSession().then(({data})=>{if(data.session)start(data.session);else gate()});sb.auth.onAuthStateChange((ev,s)=>{if(s&&!SES)start(s)})}
if(document.readyState=="loading")document.addEventListener("DOMContentLoaded",init);else init();
const nid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36);
const D=r=>({exists:!!r,id:r?r.path.split("/").pop():"",data:()=>r?r.data:undefined});
function ref(c,id){const p=c+"/"+id,uid=()=>SES.user.id;return{id,
 async get(){const r=await sb.from("docs").select("path,data").eq("path",p).maybeSingle();if(r.error)throw r.error;return D(r.data)},
 async set(d){const r=await sb.from("docs").upsert({path:p,coll:c,uid:uid(),data:d});if(r.error)throw r.error},
 async update(d){const g=await this.get();if(!g.exists)throw Error("document does not exist");await this.set({...g.data(),...d})},
 async delete(){const r=await sb.from("docs").delete().eq("path",p);if(r.error)throw r.error}}}
function qry(c){let o=null,l=1000,dir=false;const q={orderBy(f,d){o=f;dir=d=="desc";return q},limit(n){l=n;return q},
 async get(){let r=sb.from("docs").select("path,data").eq("coll",c);if(o)r=r.order("data->>"+o,{ascending:!dir});r=await r.limit(l);if(r.error)throw r.error;return{docs:r.data.map(D),size:r.data.length}}};return q}
const db={collection:c=>Object.assign(qry(c),{doc:id=>ref(c,id),async add(d){const id=nid();await ref(c,id).set(d);return ref(c,id)}})};
const user={isOwner:async()=>ROLE=="super",canEdit:async()=>!!ROLE,can:async()=>true,id:async()=>SES.user.id,me:async()=>({id:SES.user.id,name:(SES.user.user_metadata&&SES.user.user_metadata.full_name)||""}),
 async profiles(ids){const o={};if(!ids.length)return o;const r=await sb.from("docs").select("path,data").in("path",ids.map(i=>"profiles/"+i));(r.data||[]).forEach(x=>o[x.path.split("/")[1]]={name:x.data.name||""});return o}};
async function sample(input){const messages=typeof input=="string"?[{role:"user",content:input}]:input,opts=arguments[1]||{};
 const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+SES.access_token},body:JSON.stringify({messages})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw{code:r.status==429?"rate_limited":"error",message:j.error||"AI request failed"};
 opts.onText&&opts.onText({text:j.text,delta:j.text});return{text:j.text,truncated:false}}
const downloads={async save({filename,data}){const b=data instanceof Blob?data:new Blob([data]),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);return{saved:true}}};
window.claude={async use(n){await ready;return({db,user,sample,downloads})[n]||null}};
})();
