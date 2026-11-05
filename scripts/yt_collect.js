// 우발2 유튜브 4개 채널 집계 — youtube.com 페이지에서 실행. 결과는 window.RES 에 저장, 진행상황은 window.prog.
(async()=>{
window.YT={ctx:ytcfg.get('INNERTUBE_CONTEXT')};
window.ytPost=async(ep,body)=>{const r=await fetch('/youtubei/v1/'+ep+'?prettyPrint=false',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.assign({context:YT.ctx},body))});return r.json()};
window.findAll=(o,k,out=[])=>{if(o&&typeof o=='object'){if(k in o)out.push(o[k]);for(const v of Object.values(o))findAll(v,k,out)}return out};
const parseItems=(o,tab)=>{const res=[];
 findAll(o,'lockupViewModel').forEach(v=>{const md=v.metadata?.lockupMetadataViewModel;const parts=findAll(md,'metadataParts').flat().map(p=>p.text?.content||'');res.push({id:v.contentId,pub:parts.find(s=>/전$/.test(s))||'',tab})});
 findAll(o,'shortsLockupViewModel').forEach(v=>{const id=(v.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId)||(v.entityId||'').replace('shorts-shelf-item-','');res.push({id,pub:'',tab})});
 return res};
const getTok=o=>{const t=findAll(o,'continuationItemRenderer').map(c=>c.continuationEndpoint?.continuationCommand?.token).filter(Boolean).sort((a,b)=>b.length-a.length);return t[0]};
const player=async id=>{const j=await ytPost('player',{videoId:id});const d=j.videoDetails||{},mf=j.microformat?.playerMicroformatRenderer||{};return {title:d.title||'',desc:d.shortDescription||'',views:+d.viewCount||0,pub:mf.publishDate||mf.uploadDate||''}};
const scan=async(h,tab)=>{const html=await fetch('/@'+h+'/'+tab).then(r=>r.text());let o=JSON.parse(html.match(/var ytInitialData = (\{.*?\});<\/script>/s)[1]);let items=parseItems(o,tab),tok=getTok(o),pages=1;
 while(tok&&pages<250){ if(tab=='videos'&&items.length&&/([4-9]|1[0-2])개월 전|년 전/.test(items.at(-1).pub))break;
   if(tab=='shorts'&&pages%3==0){const p=await player(items.at(-1).id);if(p.pub&&p.pub<'2026-07-25')break}
   const j=await ytPost('browse',{continuation:tok});items=items.concat(parseItems(j,tab));tok=getTok(j);pages++}
 return items.map(x=>Object.assign(x,{ch:h}))};
window.prog={stage:'scan',done:0};
let all=[];for(const h of ['SBSENTERPLAY','SMALL_Stage','SBSenter.official','SBSNOW'])for(const t of ['videos','shorts'])all=all.concat(await scan(h,t));
const seen=new Set();all=all.filter(a=>a.id&&!seen.has(a.id)&&!/([5-9]|1[0-2])개월 전|년 전/.test(a.pub)&&seen.add(a.id));
prog.stage='player';prog.total=all.length;
for(let i=0;i<all.length;i+=25){await Promise.all(all.slice(i,i+25).map(async a=>{try{Object.assign(a,await player(a.id))}catch(e){}prog.done++}))}
const kw=/우리들의\s?발라드|우발\s?2|Our Ballad/i;
const S2=all.filter(p=>p.pub>='2026-08-01'&&(kw.test(p.title)||kw.test(p.desc))&&!/TOP6 팬콘서트/.test(p.title));
const chName={SBSENTERPLAY:'스브스 예능맛집',SMALL_Stage:'슴올 스테이지','SBSenter.official':'SBS Entertainment',SBSNOW:'SBS'};
const byCh={};let L=[0,0],Sh=[0,0];S2.forEach(p=>{const c=chName[p.ch];byCh[c]=(byCh[c]||0)+p.views;if(p.tab=='videos'){L[0]++;L[1]+=p.views}else{Sh[0]++;Sh[1]+=p.views}});
const ST=S2.filter(p=>p.ch=='SBSENTERPLAY'&&/^\[우리들의 발라드\]/.test(p.title)&&/\d{6}\s*\d+회/.test(p.title)&&!/직캠/.test(p.title)).map(p=>({ep:+p.title.match(/(\d+)회/)[1],views:p.views,pub:p.pub,title:p.title}));
const byEp={};ST.forEach(p=>{byEp[p.ep]=byEp[p.ep]||{n:0,v:0,first:p.pub,top:null};const e=byEp[p.ep];e.n++;e.v+=p.views;if(p.pub<e.first)e.first=p.pub;if(!e.top||p.views>e.top.views)e.top={views:p.views,title:p.title.slice(0,60)}});
window.RES={n:S2.length,tot:S2.reduce((a,b)=>a+b.views,0),L,Sh,byCh,stageN:ST.length,stageTot:ST.reduce((a,b)=>a+b.views,0),byEp,stages:ST.sort((a,b)=>b.ep-a.ep||b.views-a.views).map(p=>[p.ep,p.views,p.title.replace(/^\[우리들의 발라드\]\s*/,'').slice(0,40)])};
prog.stage='done';
})();
'started'
