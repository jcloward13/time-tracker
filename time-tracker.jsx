import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_START = 8 * 60;
const DEFAULT_END = 18 * 60;
const INTERVAL = 10;
const MIN_START = 0;
const MAX_END = 24 * 60;

const TAGS = ["meeting", "deep work", "break", "admin"];
const TAG_COLORS = { meeting: "#0099ff", "deep work": "#00e5a0", break: "#ff9f43", admin: "#a29bfe" };

const BLOCK_BG_COLORS = ["#1a2e25","#1c2035","#2a1a2e","#2e2218","#1e282e","#2e1e22"];
const BLOCK_BG_COLORS_EXT = ["#201e14","#14202e","#22142e","#2e2414","#142028","#2e1418"];

function pad(n) { return n.toString().padStart(2, "0"); }
function fmtMin(m) {
  const h = Math.floor(m / 60) % 24, mn = m % 60;
  const suf = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${pad(mn)} ${suf}`;
}
function fmtMinShort(m) {
  const h = Math.floor(m / 60) % 24, mn = m % 60;
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${pad(mn)}`;
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function dateToKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function keyToDate(k) { const [y,m,d]=k.split("-").map(Number); return new Date(y,m-1,d); }
function formatDateLabel(key) {
  const d = keyToDate(key), today = todayKey(), yesterday = dateToKey(new Date(Date.now()-86400000));
  if (key===today) return "Today";
  if (key===yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
}
function defaultDayData(startMin=DEFAULT_START, endMin=DEFAULT_END) {
  const total = (endMin-startMin)/INTERVAL;
  return { startMin, endMin, slots: Array.from({length:total},()=>({text:"",tag:"",span:1})) };
}
function blockStart(slots, idx) { let i=idx; while(i>0&&slots[i].span===0)i--; return i; }
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function firstDayOfMonth(y,m){return new Date(y,m,1).getDay();}

const navBtnStyle = {
  background:"none",border:"1px solid #252a32",color:"#4a5568",
  borderRadius:4,width:28,height:28,cursor:"pointer",fontSize:"1rem",
  display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"IBM Plex Mono",flexShrink:0,
};

function MiniCalendar({selectedKey,onSelect,loggedDays}) {
  const selDate=keyToDate(selectedKey);
  const [viewYear,setViewYear]=useState(selDate.getFullYear());
  const [viewMonth,setViewMonth]=useState(selDate.getMonth());
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today=new Date();
  const days=daysInMonth(viewYear,viewMonth), firstDay=firstDayOfMonth(viewYear,viewMonth);
  function prevMonth(){if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);}
  function nextMonth(){if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);}
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=days;d++)cells.push(d);
  return (
    <div style={{background:"#161a1f",border:"1px solid #252a32",borderRadius:8,padding:16,width:260,boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={prevMonth} style={navBtnStyle}>‹</button>
        <span style={{fontFamily:"IBM Plex Mono",fontSize:"0.8rem",color:"#e8eaf0"}}>{monthNames[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={navBtnStyle}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:"0.6rem",color:"#8a9ab0",fontFamily:"IBM Plex Mono",padding:"2px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{
          if(!d)return <div key={i}/>;
          const key=`${viewYear}-${pad(viewMonth+1)}-${pad(d)}`;
          const isSelected=key===selectedKey;
          const isToday=d===today.getDate()&&viewMonth===today.getMonth()&&viewYear===today.getFullYear();
          const hasData=loggedDays.has(key);
          const isFuture=new Date(viewYear,viewMonth,d)>today;
          return (
            <button key={i} onClick={()=>onSelect(key)} disabled={isFuture} style={{
              background:isSelected?"#00e5a0":"transparent",
              border:isToday&&!isSelected?"1px solid #00e5a0":"1px solid transparent",
              borderRadius:4,color:isFuture?"#2a3040":isSelected?"#0d0f12":"#e8eaf0",
              fontFamily:"IBM Plex Mono",fontSize:"0.75rem",padding:"5px 0",
              cursor:isFuture?"default":"pointer",position:"relative",
              fontWeight:isSelected||isToday?600:400,transition:"all 0.1s",
            }}>
              {d}
              {hasData&&!isSelected&&(
                <div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"#00e5a0"}}/>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExpandBtn({label,onClick}) {
  const [hover,setHover]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} style={{
      display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"9px 0",
      background:hover?"rgba(0,229,160,0.04)":"transparent",
      border:`1px dashed ${hover?"#00e5a0":"#252a32"}`,
      borderRadius:5,cursor:"pointer",fontFamily:"IBM Plex Mono",fontSize:"0.7rem",
      color:hover?"#00e5a0":"#3a4555",transition:"all 0.15s",
    }}>{label}</button>
  );
}

export default function TimeTracker() {
  const [activeKey,setActiveKey]=useState(todayKey());
  const [dayData,setDayData]=useState(defaultDayData());
  const [loggedDays,setLoggedDays]=useState(new Set());
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [showCal,setShowCal]=useState(false);
  const [currentMinute,setCurrentMinute]=useState(0);
  const calRef=useRef(null);
  const saveTimer=useRef(null);

  useEffect(()=>{
    function update(){const now=new Date();setCurrentMinute(now.getHours()*60+now.getMinutes());}
    update();const t=setInterval(update,30000);return()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    function handler(e){if(calRef.current&&!calRef.current.contains(e.target))setShowCal(false);}
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);

  useEffect(()=>{
    setLoading(true);
    async function load(){
      try{
        const result=await window.storage.get(`day:${activeKey}`);
        if(result&&result.value)setDayData(JSON.parse(result.value));
        else setDayData(defaultDayData());
      }catch{setDayData(defaultDayData());}
      setLoading(false);
    }
    load();
  },[activeKey]);

  useEffect(()=>{
    async function loadDays(){
      try{
        const result=await window.storage.list("day:");
        if(result&&result.keys)setLoggedDays(new Set(result.keys.map(k=>k.replace("day:",""))));
      }catch{}
    }
    loadDays();
  },[saving]);

  const scheduleSave=useCallback((data)=>{
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      setSaving(true);
      try{await window.storage.set(`day:${activeKey}`,JSON.stringify(data));}catch{}
      setSaving(false);
    },600);
  },[activeKey]);

  function updateDayData(newData){setDayData(newData);scheduleSave(newData);}

  function expandEarlier(){
    const newStart=Math.max(MIN_START,dayData.startMin-60);
    if(newStart===dayData.startMin)return;
    const added=(dayData.startMin-newStart)/INTERVAL;
    const newSlots=[...Array.from({length:added},()=>({text:"",tag:"",span:1})),...dayData.slots];
    updateDayData({...dayData,startMin:newStart,slots:newSlots});
  }

  function expandLater(){
    const newEnd=Math.min(MAX_END,dayData.endMin+60);
    if(newEnd===dayData.endMin)return;
    const added=(newEnd-dayData.endMin)/INTERVAL;
    const newSlots=[...dayData.slots,...Array.from({length:added},()=>({text:"",tag:"",span:1}))];
    updateDayData({...dayData,endMin:newEnd,slots:newSlots});
  }

  function mergeDown(idx){
    const slots=dayData.slots,s=blockStart(slots,idx),span=slots[s].span,next=s+span;
    if(next>=slots.length||slots[next].span===0)return;
    const nextSpan=slots[next].span;
    const ns=slots.map((sl,i)=>{
      if(i===s)return{...sl,span:span+nextSpan};
      if(i>s&&i<s+span+nextSpan)return{...sl,span:0,text:"",tag:"",color:undefined};
      return sl;
    });
    updateDayData({...dayData,slots:ns});
  }

  function splitBlock(idx){
    const slots=dayData.slots,s=blockStart(slots,idx),span=slots[s].span;
    if(span<=1)return;
    const ns=slots.map((sl,i)=>{
      if(i===s)return{...sl,span:span-1};
      if(i===s+span-1)return{...sl,span:1,text:"",tag:""};
      return sl;
    });
    updateDayData({...dayData,slots:ns});
  }

  function setSlotTag(idx, tag) {
    if(tag==="__custom__"){
      const custom=prompt("Enter custom tag name:");
      if(!custom||!custom.trim())return;
      tag=custom.trim().toLowerCase();
    }
    updateDayData({...dayData,slots:dayData.slots.map((sl,j)=>j===idx?{...sl,tag}:sl)});
  }

  function setSlotText(idx,text){
    updateDayData({...dayData,slots:dayData.slots.map((sl,i)=>i===idx?{...sl,text}:sl)});
  }

  function setSlotColor(idx,color){
    updateDayData({...dayData,slots:dayData.slots.map((sl,j)=>j===idx?{...sl,color}:sl)});
  }

  function goDay(offset){
    const d=keyToDate(activeKey);d.setDate(d.getDate()+offset);
    const newKey=dateToKey(d);if(newKey>todayKey())return;setActiveKey(newKey);
  }

  async function clearDay(){
    if(!confirm(`Clear all entries for ${formatDateLabel(activeKey)}?`))return;
    const fresh=defaultDayData();setDayData(fresh);
    try{await window.storage.set(`day:${activeKey}`,JSON.stringify(fresh));}catch{}
  }

  async function backupAll(){
    try{
      const result=await window.storage.list("day:");
      const keys=result&&result.keys?result.keys:[];
      const backup={version:1,exported:new Date().toISOString(),days:{}};
      for(const k of keys){
        const r=await window.storage.get(k);
        if(r&&r.value)backup.days[k.replace("day:","")]=JSON.parse(r.value);
      }
      const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}));
      const a=document.createElement("a");
      a.href=url;a.download=`time-tracker-backup-${todayKey()}.json`;a.click();
      URL.revokeObjectURL(url);
    }catch(e){alert("Backup failed: "+e.message);}
  }

  const restoreInputRef=useRef(null);
  function restoreAll(){restoreInputRef.current.click();}
  async function handleRestoreFile(e){
    const file=e.target.files[0];if(!file)return;
    e.target.value="";
    try{
      const text=await file.text();
      const backup=JSON.parse(text);
      if(!backup.days||typeof backup.days!=="object")throw new Error("Invalid backup file.");
      const entries=Object.entries(backup.days);
      for(const[,data]of entries){
        if(!Array.isArray(data.slots)||typeof data.startMin!=="number"||typeof data.endMin!=="number")
          throw new Error("Invalid backup file: day entries have unexpected structure.");
      }
      const count=entries.length;
      if(!confirm(`Restore ${count} day(s) from backup?\nThis will overwrite any matching days in your current data.`))return;
      for(const[dateKey,data]of entries){
        await window.storage.set(`day:${dateKey}`,JSON.stringify(data));
      }
      window.location.reload();
    }catch(e){alert("Restore failed: "+e.message);}
  }

  function exportDay(){
    const{slots,startMin}=dayData;
    let out=`TIME LOG — ${formatDateLabel(activeKey)} (${activeKey})\n${"─".repeat(52)}\n\n`;
    let i=0;
    while(i<slots.length){
      const s=slots[i];if(s.span===0){i++;continue;}
      const fromMin=startMin+i*INTERVAL,toMin=startMin+(i+s.span)*INTERVAL;
      const range=s.span>1?`${fmtMin(fromMin)} – ${fmtMin(toMin)} (${s.span*10}m)`:fmtMin(fromMin);
      const tag=s.tag?` [${s.tag}]`:"";
      out+=`${range}${tag}\n  ${s.text||"—"}\n\n`;
      i+=s.span;
    }
    const url=URL.createObjectURL(new Blob([out],{type:"text/plain"}));
    const a=document.createElement("a");
    a.href=url;a.download=`time-log-${activeKey}.txt`;a.click();
    URL.revokeObjectURL(url);
  }

  const{slots,startMin,endMin}=dayData;
  const total=slots.length;
  let loggedSlots=0,si=0;
  while(si<total){const s=slots[si];if(s.span===0){si++;continue;}if(s.text.trim())loggedSlots+=s.span;si+=Math.max(1,s.span);}
  const covMin=loggedSlots*INTERVAL;
  const progress=total>0?Math.round((loggedSlots/total)*100):0;
  const isToday=activeKey===todayKey();
  const currentSlotIdx=Math.floor((currentMinute-startMin)/INTERVAL);

  // Group by hour
  const hours=[];
  for(let idx=0;idx<total;idx++){
    const slotMin=startMin+idx*INTERVAL,h=Math.floor(slotMin/60)%24;
    if(hours.length===0||hours[hours.length-1].h!==h)hours.push({h,indices:[]});
    hours[hours.length-1].indices.push(idx);
  }

  return (
    <div style={{fontFamily:"'IBM Plex Sans',sans-serif",background:"#0d0f12",color:"#e8eaf0",minHeight:"100vh",padding:"32px 24px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28,borderBottom:"1px solid #252a32",paddingBottom:20,flexWrap:"wrap"}}>
        <h1 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"1.4rem",fontWeight:600,color:"#00e5a0",letterSpacing:"-0.5px",marginRight:"auto"}}>
          // TIME TRACKER
        </h1>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>goDay(-1)} style={navBtnStyle}>◀</button>
          <div ref={calRef} style={{position:"relative"}}>
            <button onClick={()=>setShowCal(v=>!v)} style={{
              fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.85rem",
              background:"#161a1f",border:`1px solid ${isToday?"#00e5a0":"#252a32"}`,
              color:isToday?"#00e5a0":"#e8eaf0",padding:"6px 14px",
              borderRadius:5,cursor:"pointer",minWidth:210,textAlign:"center",
            }}>
              {formatDateLabel(activeKey)} {showCal?"▲":"▼"}
            </button>
            {showCal&&(
              <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:100}}>
                <MiniCalendar selectedKey={activeKey} loggedDays={loggedDays}
                  onSelect={key=>{setActiveKey(key);setShowCal(false);}}/>
              </div>
            )}
          </div>
          <button onClick={()=>goDay(1)} disabled={isToday} style={{...navBtnStyle,opacity:isToday?0.3:1,cursor:isToday?"default":"pointer"}}>▶</button>
          {!isToday&&(
            <button onClick={()=>setActiveKey(todayKey())} style={{
              fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.7rem",
              background:"rgba(0,229,160,0.08)",border:"1px solid #00e5a0",
              color:"#00e5a0",padding:"5px 10px",borderRadius:5,cursor:"pointer",
            }}>Today</button>
          )}
        </div>
        {saving&&<span style={{fontFamily:"IBM Plex Mono",fontSize:"0.65rem",color:"#4a5568"}}>saving…</span>}
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:20,marginBottom:16,flexWrap:"wrap"}}>
        {[
          {label:"Logged",value:`${loggedSlots} / ${total}`},
          {label:"Time Covered",value:`${Math.floor(covMin/60)}h ${covMin%60}m`},
          {label:"Day Range",value:`${fmtMin(startMin)} – ${fmtMin(endMin)}`},
        ].map(st=>(
          <div key={st.label} style={{background:"#161a1f",border:"1px solid #252a32",borderRadius:6,padding:"10px 18px",fontFamily:"IBM Plex Mono"}}>
            <div style={{fontSize:"0.62rem",color:"#4a5568",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{st.label}</div>
            <div style={{fontSize:"1.05rem",fontWeight:600,color:"#00e5a0"}}>{st.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{height:3,background:"#252a32",borderRadius:2,marginBottom:20,maxWidth:960,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,#00e5a0,#0099ff)",borderRadius:2,transition:"width 0.5s"}}/>
      </div>

      <div style={{fontSize:"0.72rem",color:"#4a5568",marginBottom:16,fontFamily:"IBM Plex Mono"}}>
        <span style={{color:"#0099ff"}}>+ extend</span> to merge slots ·{" "}
        <span style={{color:"#7a6080"}}>− trim</span> to shrink ·{" "}
        use the dashed buttons to expand the day's range
        {!isToday&&<span style={{color:"#ff9f43",marginLeft:12}}>◆ Viewing past day</span>}
      </div>

      {loading?(
        <div style={{color:"#4a5568",fontFamily:"IBM Plex Mono",fontSize:"0.8rem",padding:40}}>Loading…</div>
      ):(
        <div style={{maxWidth:960}}>

          {/* Expand earlier */}
          {startMin>MIN_START&&(
            <div style={{marginBottom:4}}>
              <ExpandBtn label={`+ Add earlier time  (expands before ${fmtMin(startMin)}, currently at ${fmtMin(Math.max(0,startMin-60))}–${fmtMin(startMin)})`} onClick={expandEarlier}/>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"60px 1fr",borderTop:"1px solid #252a32"}}>
            {hours.map(({h,indices})=>(
              <div key={h} style={{display:"contents"}}>
                <div style={{
                  fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.68rem",color:"#4a5568",
                  textAlign:"right",paddingRight:10,paddingTop:10,
                  borderRight:"1px solid #252a32",borderBottom:"1px solid #252a32",
                }}>
                  {h===0?"12AM":h>12?`${h-12}PM`:h===12?"12PM":`${h}AM`}
                </div>
                <div style={{borderBottom:"1px solid #252a32"}}>
                  {indices.map(idx=>{
                    const s=slots[idx],isCont=s.span===0;
                    const bs=blockStart(slots,idx),bspan=slots[bs].span,blockS=slots[bs];
                    const slotMin=startMin+idx*INTERVAL;
                    const isInBlock=isToday&&currentSlotIdx>=bs&&currentSlotIdx<bs+bspan&&currentSlotIdx>=0&&currentSlotIdx<total;
                    const isExtended=slotMin<DEFAULT_START||slotMin>=DEFAULT_END;
                    if(isCont)return null;
                    const blockEndMin=slotMin+bspan*INTERVAL;
                    const durMin=bspan*INTERVAL;
                    const durLabel=durMin>=60?(durMin%60===0?`${durMin/60}h`:`${Math.floor(durMin/60)}h ${durMin%60}m`):`${durMin}m`;
                    return (
                      <div key={idx} id={`slot-${idx}`} style={{
                        display:"flex",alignItems:"stretch",
                        borderBottom:"1px solid #1a1f26",
                        borderLeft:isInBlock?"2px solid #0099ff":bspan>1?"3px solid rgba(0,229,160,0.35)":isExtended?"2px solid rgba(255,159,67,0.25)":"none",
                        background:blockS.color||(blockS.text?(isExtended?BLOCK_BG_COLORS_EXT[bs%BLOCK_BG_COLORS_EXT.length]:BLOCK_BG_COLORS[bs%BLOCK_BG_COLORS.length]):"transparent"),
                        minHeight:bspan*44,transition:"background 0.1s",
                      }}>
                        <div style={{
                          fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",
                          color:isInBlock?"#0099ff":isExtended?"#8a7040":blockS.text?"#00e5a0":"#4a5568",
                          width:48,minWidth:48,display:"flex",alignItems:bspan>1?"flex-start":"center",
                          justifyContent:"flex-end",padding:bspan>1?"8px 8px 0":"0 8px",
                          borderRight:"1px solid #252a32",flexShrink:0,
                          opacity:0.75,
                        }}>
                          {bspan>1?<span style={{textAlign:"right",lineHeight:1.4}}>{fmtMinShort(slotMin)}–<br/>{fmtMinShort(blockEndMin)}</span>:fmtMin(slotMin)}
                        </div>
                            <textarea value={blockS.text} onChange={e=>setSlotText(bs,e.target.value)}
                              placeholder={isInBlock?"← current":""} rows={1}
                              style={{
                                flex:1,background:"transparent",border:"none",
                                color:blockS.text?"#c8f5e5":"#e8eaf0",
                                fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.82rem",
                                padding:"10px 10px",outline:"none",resize:"none",
                                minHeight:bspan*44,lineHeight:1.5,
                              }}/>
                            <div style={{display:"flex",alignItems:"flex-start",gap:5,padding:"8px 8px 0",flexShrink:0}}>
                              {bspan>1&&(
                                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",color:"#00e5a0",padding:"2px 6px",border:"1px solid rgba(0,229,160,0.25)",borderRadius:3,whiteSpace:"nowrap"}}>
                                  {durLabel}
                                </span>
                              )}
                              <select value={blockS.tag||""} onChange={e=>setSlotTag(bs,e.target.value)} style={{
                                background:blockS.tag?"rgba(0,229,160,0.08)":"#0d0f12",
                                border:`1px solid ${blockS.tag?(TAG_COLORS[blockS.tag]||"#00e5a0"):"#3a4555"}`,
                                color:blockS.tag?(TAG_COLORS[blockS.tag]||"#00e5a0"):"#6a8090",
                                fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",padding:"3px 7px",
                                borderRadius:4,cursor:"pointer",whiteSpace:"nowrap",
                              }}>
                                <option value="">tag</option>
                                {TAGS.map(t=><option key={t} value={t}>{t}</option>)}
                                {blockS.tag&&!TAGS.includes(blockS.tag)&&<option value={blockS.tag}>{blockS.tag}</option>}
                                <option value="__custom__">+ custom…</option>
                              </select>
                              <input type="color"
                                value={blockS.color||(isExtended?BLOCK_BG_COLORS_EXT[bs%BLOCK_BG_COLORS_EXT.length]:BLOCK_BG_COLORS[bs%BLOCK_BG_COLORS.length])}
                                onChange={e=>setSlotColor(bs,e.target.value)}
                                title="Change block color"
                                style={{width:22,height:22,border:"1px solid #3a4555",borderRadius:4,cursor:"pointer",padding:2,background:"none"}}/>
                              <button onClick={()=>splitBlock(idx)}
                                onMouseEnter={e=>{e.currentTarget.style.borderColor="#ff7675";e.currentTarget.style.color="#ff7675";}}
                                onMouseLeave={e=>{e.currentTarget.style.borderColor="#503060";e.currentTarget.style.color="#a07898";}}
                                style={{visibility:bspan>1?"visible":"hidden",background:"none",border:"1px solid #503060",color:"#a07898",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",padding:"3px 8px",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap"}}>
                                − trim
                              </button>
                              {bs+bspan<total&&(
                                <button onClick={()=>mergeDown(idx)}
                                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#0099ff";e.currentTarget.style.color="#0099ff";}}
                                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#2a4560";e.currentTarget.style.color="#5a9fc0";}}
                                  style={{background:"none",border:"1px solid #2a4560",color:"#5a9fc0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",padding:"3px 8px",borderRadius:4,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"}}>
                                  + extend
                                </button>
                              )}
                            </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Expand later */}
          {endMin<MAX_END&&(
            <div style={{marginTop:4}}>
              <ExpandBtn label={`+ Add later time  (expands after ${fmtMin(endMin)}, adds ${fmtMin(endMin)}–${fmtMin(Math.min(MAX_END,endMin+60))})`} onClick={expandLater}/>
            </div>
          )}
        </div>
      )}

      <div style={{marginTop:28,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
        {[
          {label:"Export Day",onClick:exportDay,primary:true},
          {label:"Backup All",onClick:backupAll,primary:true},
          {label:"Restore",onClick:restoreAll},
          {label:"Clear Day",onClick:clearDay},
        ].map(b=>(
          <button key={b.label} onClick={b.onClick} style={{
            fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.75rem",padding:"9px 18px",
            borderRadius:5,border:`1px solid ${b.primary?"#00e5a0":"#252a32"}`,
            background:b.primary?"rgba(0,229,160,0.08)":"#161a1f",
            color:b.primary?"#00e5a0":"#e8eaf0",cursor:"pointer",
          }}>{b.label}</button>
        ))}
        <input ref={restoreInputRef} type="file" accept=".json" onChange={handleRestoreFile} style={{display:"none"}}/>
      </div>
    </div>
  );
}
