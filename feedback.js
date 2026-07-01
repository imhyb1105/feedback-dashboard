(function(){'use strict';
var ss='.fb{position:fixed;right:20px;bottom:20px;z-index:9998;border-radius:22px;padding:8px 14px;background:var(--accent,#1a3a5c);color:#fff;border:0;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;gap:4px}@media(max-width:480px){.fb{right:10px;bottom:10px;padding:6px 10px;font-size:12px;border-radius:16px;gap:2px}}.fm{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.35);display:none;align-items:center;justify-content:center}.fm.s{display:flex}.fd{background:#fff;border-radius:14px;padding:20px;max-width:400px;width:92%;max-height:85vh;overflow-y:auto;font:14px system-ui,"PingFang SC","Microsoft YaHei",sans-serif}.fd h3{margin:0 0 4px;font-size:1rem}.fd .fu{margin:0 0 10px;color:#888}.fd label{display:block;font-weight:600;margin:8px 0 2px}.fd input,.fd select,.fd textarea{width:100%;padding:6px 10px;border:1px solid #e0e0e0;border-radius:8px;box-sizing:border-box}.fd textarea{min-height:68px}.fd .fa{display:flex;justify-content:flex-end;margin-top:12px}.fd .fa button{padding:6px 16px;border:0;cursor:pointer}.fd .fs{background:var(--accent,#1a3a5c);color:#fff}.fd .fc{background:#eee;color:#555}.fd .fp{font-size:.7rem;color:#aaa;margin-top:10px;text-align:center}.ft{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:10000;background:#333;color:#fff;padding:6px 16px;border-radius:20px;opacity:0;pointer-events:none}.ft.s{opacity:1}';
var st=document.createElement('style');st.textContent=ss;document.head.appendChild(st);
var sb=null,pr='',sid='';
function gid(){try{var id=sessionStorage.getItem('fb_sid');if(!id){id=crypto.randomUUID();sessionStorage.setItem('fb_sid',id);}return id;}catch(e){return's_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);}}
function ts(m){var e=document.getElementById('ft');if(!e){e=document.createElement('div');e.id='ft';e.className='ft';document.body.appendChild(e);}e.textContent=m;e.classList.add('s');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('s');},3000);}
function inj(){
var b=document.createElement('button');b.className='fb';b.innerHTML='💬 反馈';document.body.appendChild(b);
var o=document.createElement('div');o.className='fm';o.id='fm';
o.innerHTML='<div class="fd"><h3>💬 反馈与建议</h3><p class="fu">你的意见能帮我把工具做得更好</p><label>类型</label><select id="ftyp"><option value="bug">Bug 报告</option><option value="feature">功能建议</option><option value="improvement">改进建议</option><option value="other">其他</option></select><label>标题</label><input id="ftit" maxlength="200" placeholder="简要描述"><label>详细内容</label><textarea id="fct" maxlength="2000" placeholder="请描述你的问题或建议"></textarea><label>联系方式（选填）</label><input id="fcn" maxlength="100" placeholder="邮箱或微信"><div class="fa"><button class="fc" id="fcc">取消</button><button class="fs" id="fsb">提交反馈</button></div><p class="fp">提交即表示同意收集信息用于改进产品</p></div>';
document.body.appendChild(o);
b.addEventListener('click',function(){o.classList.add('s');});
o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('s');});
document.getElementById('fcc').addEventListener('click',function(){o.classList.remove('s');});
document.getElementById('fsb').addEventListener('click',sh);
}
function sh(){
var ty=document.getElementById('ftyp').value,ti=document.getElementById('ftit').value.trim(),ct=document.getElementById('fct').value.trim(),cn=document.getElementById('fcn').value.trim();
if(!ti||!ct){ts('请填写标题和详细内容');return;}
window.Feedback.submitFeedback({type:ty,title:ti,content:ct,contact:cn||undefined}).then(function(){
document.getElementById('fm').classList.remove('s');
document.getElementById('ftit').value='';document.getElementById('fct').value='';document.getElementById('fcn').value='';
ts('反馈已提交，谢谢！');
}).catch(function(e){console.warn(e);ts('提交失败，请稍后重试');});}
window.addEventListener('error',function(e){window.Feedback.trackEvent({event:'js_error',metadata:{msg:e.message.substring(0,200)}});});
window.addEventListener('unhandledrejection',function(e){window.Feedback.trackEvent({event:'unhandled_rejection',metadata:{reason:String(e.reason).substring(0,200)}});});
window.Feedback={
initFeedback:function(o){if(!o||!o.project||!o.supabaseUrl||!o.supabaseKey)return;pr=o.project;sid=gid();if(typeof supabase!=='undefined'&&supabase.createClient){sb=supabase.createClient(o.supabaseUrl,o.supabaseKey);}else{return;}inj();window.Feedback.trackEvent({event:'page_view'});},
submitFeedback:function(d){if(!sb)return Promise.reject(new Error('no init'));return sb.from('feedbacks').insert({project:pr,session_id:sid,type:d.type,title:d.title,content:d.content,contact:d.contact||null});},
trackEvent:function(d){if(!sb)return;sb.from('usage_events').insert({project:pr,session_id:sid,event:d.event,metadata:d.metadata||null}).then(function(r){if(r.error)console.warn(r.error);}).catch(function(){});}
};
})();
