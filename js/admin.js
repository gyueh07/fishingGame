(()=>{
  "use strict";

  const ADMIN_ID="admin";
  const ADMIN_AUTH_EMAIL="admin@fishinglife.app";
  const USER_WRITE_SCHEMA_VERSION=250;
  const USER_WRITE_PROTOCOL_VERSION=4;
  const MAX_ROD=2000;
  const MAX_RESEARCH=10;
  const MAX_TRAINING=15;
  const BOSS_IDS=["kraken","hydra","leviathan","behemoth","phoenix","bahamut","tiamat","jormungandr","fenrir","surtr","cerberus","nidhogg","azhi_dahaka","typhon","angra_mainyu","erebos","chronos","nyarlathotep","yog_sothoth","azathoth"];
  const GRADE_NAMES=["쓰레기","일반","희귀","영웅","전설","신화","초월","영원","공허"];
  const BUCKET_SHARD_COUNT=128;
  const DEFAULT_GRADE_BALANCE={
    "쓰레기":{chance:8,basePrice:1,attackMin:0,attackMax:0,hpMin:0,hpMax:0},
    "일반":{chance:55,basePrice:100,attackMin:30,attackMax:150,hpMin:450,hpMax:2700},
    "희귀":{chance:25,basePrice:1500,attackMin:100,attackMax:500,hpMin:1500,hpMax:9000},
    "영웅":{chance:8,basePrice:100000,attackMin:500,attackMax:2000,hpMin:7500,hpMax:36000},
    "전설":{chance:2.2,basePrice:9000000,attackMin:2000,attackMax:8000,hpMin:30000,hpMax:240000},
    "신화":{chance:.7,basePrice:75000000,attackMin:8000,attackMax:20000,hpMin:120000,hpMax:540000},
    "초월":{chance:.12,basePrice:1000000000,attackMin:20000,attackMax:50000,hpMin:360000,hpMax:1500000},
    "영원":{chance:0,basePrice:100000000000,attackMin:150000,attackMax:300000,hpMin:1800000,hpMax:4500000},
    "공허":{chance:0,basePrice:10000000000000,attackMin:900000,attackMax:2100000,hpMin:13500000,hpMax:31500000}
  };
  const DEFAULT_STAR_BALANCE=[
    {tier:0,chance:70,attackMin:1,attackMax:1,hpMin:1,hpMax:1,dodgeMin:1,dodgeMax:10,critRateMin:10,critRateMax:20,critDamageMin:150,critDamageMax:250},
    {tier:1,chance:20,attackMin:1,attackMax:3,hpMin:1,hpMax:3,dodgeMin:10,dodgeMax:15,critRateMin:20,critRateMax:30,critDamageMin:250,critDamageMax:350},
    {tier:2,chance:8,attackMin:3,attackMax:7,hpMin:3,hpMax:7,dodgeMin:15,dodgeMax:25,critRateMin:30,critRateMax:40,critDamageMin:350,critDamageMax:450},
    {tier:3,chance:2,attackMin:7,attackMax:20,hpMin:7,hpMax:20,dodgeMin:25,dodgeMax:45,critRateMin:40,critRateMax:50,critDamageMin:450,critDamageMax:500},
    {tier:4,chance:0,attackMin:20,attackMax:50,hpMin:20,hpMax:50,dodgeMin:45,dodgeMax:60,critRateMin:50,critRateMax:60,critDamageMin:500,critDamageMax:650}
  ];
  const DEFAULT_TRAINING_BALANCE={costMultiplier:1,attackEffectMultiplier:1,hpEffectMultiplier:1,critDamageEffectMultiplier:1};
  const ALL_TITLES=["환경 지킴이","수집가","탐험가","개척자","정복자","전설","신화","초월자","불멸","공허","초보","베테랑","중독자","거장","천 번의 담금질","행운아","드래곤 헌터","부자","재벌"];
  const DEFAULT_BALANCE={bossHpMultiplier:1,bossAttackMultiplier:1,bossRewardMultiplier:1,gradeBalance:DEFAULT_GRADE_BALANCE,starBalance:DEFAULT_STAR_BALANCE,trainingBalance:DEFAULT_TRAINING_BALANCE,announcements:[],operationsRevision:0,balancePatchTitle:"기본 밸런스",balancePatchNote:"현재 기본 배율이 적용 중입니다.",balanceRevision:0};
  const firebaseConfig={apiKey:"AIzaSyBLH8EJYZ4x9dez23PkFrMAMo3JD5vaO8I",authDomain:"fishinggame-1c8ac.firebaseapp.com",projectId:"fishinggame-1c8ac",storageBucket:"fishinggame-1c8ac.firebasestorage.app",messagingSenderId:"1075825889471",appId:"1:1075825889471:web:dba6773633846463e4760a",measurementId:"G-HKMKFFCT67"};
  const localDemo=location.hostname==="127.0.0.1"&&new URLSearchParams(location.search).has("adminDemo");

  if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth();
  const db=firebase.firestore();
  const serverTimestamp=()=>firebase.firestore.FieldValue.serverTimestamp();
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  let currentTarget=null;
  let adminBalanceConfig=DEFAULT_BALANCE;
  let dashboardLoaded=false;
  let toastTimer=null;
  let existingFishCatalog=[];
  let existingFishByName=new Map();

  function cleanNickname(value){
    const cleaned=String(value||"").trim().replace(/\s+/g,"_").slice(0,16);
    return /^[A-Za-z0-9_\-가-힣]{1,16}$/.test(cleaned)?cleaned:"";
  }

  function escapeHtml(value){
    return String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  }

  function clampNumber(value,min,max,fallback=min){
    const number=Number(value);
    return Number.isFinite(number)?Math.min(max,Math.max(min,number)):fallback;
  }

  function initializeFishGrantCatalog(){
    const source=typeof fishByGrade!=="undefined"&&fishByGrade&&typeof fishByGrade==="object"?fishByGrade:{};
    const sizes=typeof sizeData!=="undefined"&&sizeData&&typeof sizeData==="object"?sizeData:{};
    existingFishCatalog=GRADE_NAMES.flatMap(grade=>(Array.isArray(source[grade])?source[grade]:[]).map(name=>({name:String(name),grade,sizeRange:Array.isArray(sizes[name])?sizes[name]:null})));
    existingFishByName=new Map(existingFishCatalog.map(fish=>[fish.name,fish]));
    const select=$("#grantFishSelect");
    if(!select)return;
    select.innerHTML='<option value="">물고기를 선택하세요</option>'+GRADE_NAMES.map(grade=>{
      const fishes=existingFishCatalog.filter(fish=>fish.grade===grade);
      return fishes.length?`<optgroup label="${escapeHtml(grade)}">${fishes.map(fish=>`<option value="${escapeHtml(fish.name)}">${escapeHtml(fish.name)}</option>`).join("")}</optgroup>`:"";
    }).join("");
    syncFishGrantSelection();
  }

  function syncFishGrantSelection(){
    const selected=existingFishByName.get($("#grantFishSelect")?.value||"");
    const gradeInput=$("#grantFishGrade"),sizeInput=$("#grantFishSize");
    if(gradeInput)gradeInput.value=selected?.grade||"";
    if(!sizeInput)return;
    if(!selected){sizeInput.disabled=false;sizeInput.value="";sizeInput.placeholder="물고기 선택 후 자동 설정";sizeInput.removeAttribute("max");return;}
    const range=selected.sizeRange;
    if(!range){sizeInput.value="";sizeInput.disabled=true;sizeInput.placeholder="크기 없음";sizeInput.removeAttribute("max");return;}
    const minimum=Number(range[0])||0,maximum=Math.max(minimum,Number(range[1])||minimum);
    sizeInput.disabled=false;sizeInput.min=String(minimum);sizeInput.max=String(maximum);sizeInput.placeholder=`${minimum} ~ ${maximum}`;
    sizeInput.value=String(Math.round(((minimum+maximum)/2)*10)/10);
  }

  function randomInt(min,max){return Math.floor(min+Math.random()*(max-min+1));}

  function fishSizeRatio(catalogFish,size){
    const range=catalogFish?.sizeRange;
    if(size===null||!Array.isArray(range)||Number(range[1])<=Number(range[0]))return .5;
    return clampNumber((Number(size)-Number(range[0]))/(Number(range[1])-Number(range[0])),0,1,.5);
  }

  function rollStarRange(min,max,tier,ratio,stat){
    const balance=adminBalanceConfig.starBalance?.[tier]||DEFAULT_STAR_BALANCE[tier]||DEFAULT_STAR_BALANCE[0];
    const minMultiplier=Number(balance[stat+"Min"]||1),maxMultiplier=Number(balance[stat+"Max"]||1);
    const scaledMin=Math.max(1,Math.floor((tier===0?min:max)*minMultiplier)+(tier===0?0:1));
    const scaledMax=Math.max(scaledMin,Math.floor(max*maxMultiplier));
    if(tier!==0)return randomInt(scaledMin,scaledMax);
    const roll=clampNumber((Math.random()+Math.random()+ratio)/3,0,1,.5);
    return Math.floor(scaledMin+(scaledMax-scaledMin)*roll);
  }

  function makeAutomaticCombatStats(catalogFish,size,stars){
    if(catalogFish.grade==="쓰레기")return {attack:0,hp:0,maxHp:0,dodge:0,critRate:0,critDamage:0,_baseAttack:0,_baseMaxHp:0,_baseCritDamage:0,status:"전투 불가",combatVersion:16,hpBalanceVersion:1,voidStatBalanceVersion:1,stars:{attack:0,hp:0,dodge:0,critRate:0,critDamage:0}};
    const gradeBalance=adminBalanceConfig.gradeBalance?.[catalogFish.grade]||DEFAULT_GRADE_BALANCE[catalogFish.grade],defaults=DEFAULT_GRADE_BALANCE[catalogFish.grade];
    const attackMin=Number(gradeBalance.attackMin)||1,attackMax=Math.max(attackMin,Number(gradeBalance.attackMax)||attackMin),hpMin=Number(gradeBalance.hpMin)||1,hpMax=Math.max(hpMin,Number(gradeBalance.hpMax)||hpMin),ratio=fishSizeRatio(catalogFish,size);
    const attack=rollStarRange(attackMin,attackMax,stars.attack,ratio,"attack"),maxHp=rollStarRange(hpMin,hpMax,stars.hp,.5,"hp");
    const dodgeBalance=adminBalanceConfig.starBalance?.[stars.dodge]||DEFAULT_STAR_BALANCE[stars.dodge],dodge=Math.round((Number(dodgeBalance.dodgeMin)+(Number(dodgeBalance.dodgeMax)-Number(dodgeBalance.dodgeMin))*clampNumber((Math.random()+Math.random()+ratio)/3,0,1,.5))*10)/10;
    const critRateBalance=adminBalanceConfig.starBalance?.[stars.critRate]||DEFAULT_STAR_BALANCE[stars.critRate],critRate=Math.round((Number(critRateBalance.critRateMin)+Math.random()*(Number(critRateBalance.critRateMax)-Number(critRateBalance.critRateMin)))*10)/10;
    const critDamageBalance=adminBalanceConfig.starBalance?.[stars.critDamage]||DEFAULT_STAR_BALANCE[stars.critDamage],critDamage=randomInt(Math.floor(Number(critDamageBalance.critDamageMin)),Math.floor(Number(critDamageBalance.critDamageMax)));
    const attackScale=(Number(gradeBalance.attackMin)+Number(gradeBalance.attackMax))/Math.max(1,Number(defaults.attackMin)+Number(defaults.attackMax)),hpScale=(Number(gradeBalance.hpMin)+Number(gradeBalance.hpMax))/Math.max(1,Number(defaults.hpMin)+Number(defaults.hpMax));
    return {attack,hp:maxHp,maxHp,dodge,critRate,critDamage,_baseAttack:attack,_baseMaxHp:maxHp,_baseCritDamage:critDamage,status:"정상",combatVersion:16,hpBalanceVersion:1,voidStatBalanceVersion:1,stars,_liveOpsRawBaseAttack:attack/Math.max(.0001,attackScale),_liveOpsRawBaseMaxHp:maxHp/Math.max(.0001,hpScale),_liveOpsAttackMultiplier:attackScale,_liveOpsHpMultiplier:hpScale};
  }

  function formatMoney(value){
    const amount=Math.max(0,Math.floor(Number(value)||0));
    return amount.toLocaleString("ko-KR")+"원";
  }

  function formatDate(value){
    const date=value?.toDate?value.toDate():value instanceof Date?value:new Date(Number(value)||Date.now());
    return new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(date);
  }

  function setConnection(kind,text){
    const badge=$("#adminConnection");
    badge.className="connection-badge "+kind;
    badge.querySelector("span").textContent=text;
  }

  function showToast(message,kind="success"){
    const toast=$("#adminToast");
    toast.textContent=String(message||"");
    toast.className="admin-toast show"+(kind==="error"?" error":"");
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.className="admin-toast",3200);
  }

  function setStatus(selector,message,kind=""){
    const element=$(selector);
    if(!element)return;
    element.textContent=String(message||"");
    element.className=(selector==="#adminLoginStatus"?"form-status":"action-status")+(kind?" "+kind:"");
  }

  function setButtonBusy(button,busy,label){
    if(!button)return;
    if(busy){button.dataset.originalText=button.textContent;button.textContent=label||"처리 중...";button.disabled=true;}
    else{button.textContent=button.dataset.originalText||button.textContent;button.disabled=false;}
  }

  function isAuthorizedUser(user){
    return !!user&&String(user.email||"").toLowerCase()===ADMIN_AUTH_EMAIL;
  }

  function assertAdmin(){
    if(localDemo)return;
    if(!isAuthorizedUser(auth.currentUser))throw new Error("ADMIN_AUTH_REQUIRED");
  }

  function switchTab(tab){
    const labels={overview:["OVERVIEW","운영 현황"],users:["PLAYER CONTROL","유저 관리"],balance:["LIVE BALANCE","밸런스 조정"],notices:["ANNOUNCEMENTS","공지 관리"],system:["ADMIN ACCOUNT","관리자 계정"]};
    $$('[data-admin-tab]').forEach(button=>button.classList.toggle("active",button.dataset.adminTab===tab));
    $$('[data-admin-view]').forEach(view=>{const active=view.dataset.adminView===tab;view.classList.toggle("active",active);view.hidden=!active;});
    $("#adminSectionEyebrow").textContent=labels[tab]?.[0]||labels.overview[0];
    $("#adminSectionTitle").textContent=labels[tab]?.[1]||labels.overview[1];
  }

  function openDashboard(){
    $("#adminLogin").hidden=true;
    $("#adminApp").hidden=false;
    setConnection("online",localDemo?"로컬 화면 검사":"Firebase 연결됨");
    if(!dashboardLoaded){dashboardLoaded=true;loadDashboardData();}
  }

  function normalizeBalance(data={}){
    const gradeSource=data.gradeBalance&&typeof data.gradeBalance==="object"?data.gradeBalance:{};
    const gradeBalance=Object.fromEntries(GRADE_NAMES.map(name=>{const row=gradeSource[name]||{},defaults=DEFAULT_GRADE_BALANCE[name],pair=(minKey,maxKey,defaultMin,defaultMax,legacy=1)=>{const low=clampNumber(row[minKey],0,Number.MAX_SAFE_INTEGER,defaultMin*legacy),high=clampNumber(row[maxKey],0,Number.MAX_SAFE_INTEGER,defaultMax*legacy);return [Math.min(low,high),Math.max(low,high)];},attack=pair("attackMin","attackMax",defaults.attackMin,defaults.attackMax,clampNumber(row.attackMultiplier,.05,20,1)),hp=pair("hpMin","hpMax",defaults.hpMin,defaults.hpMax,clampNumber(row.hpMultiplier,.05,20,1));return [name,{chance:clampNumber(row.chance,0,100,defaults.chance*clampNumber(row.chanceMultiplier,0,20,1)),basePrice:Math.round(clampNumber(row.basePrice,0,Number.MAX_SAFE_INTEGER,defaults.basePrice*clampNumber(row.priceMultiplier,.05,20,1))),attackMin:Math.round(attack[0]),attackMax:Math.round(attack[1]),hpMin:Math.round(hp[0]),hpMax:Math.round(hp[1])}];}));
    const starSource=Array.isArray(data.starBalance)?data.starBalance:[];
    const starBalance=enforceStarTierOrder(DEFAULT_STAR_BALANCE.map((defaults,tier)=>{const row=starSource.find(item=>Number(item?.tier)===tier)||starSource[tier]||{};const pair=(minKey,maxKey,min,max)=>{const low=clampNumber(row[minKey],min,max,defaults[minKey]),high=clampNumber(row[maxKey],min,max,defaults[maxKey]);return [Math.min(low,high),Math.max(low,high)];},attack=pair("attackMin","attackMax",.05,100),hp=pair("hpMin","hpMax",.05,100),dodge=pair("dodgeMin","dodgeMax",0,100),critRate=pair("critRateMin","critRateMax",0,100),critDamage=pair("critDamageMin","critDamageMax",100,2000);return {tier,chance:clampNumber(row.chance,0,100,defaults.chance),attackMin:attack[0],attackMax:attack[1],hpMin:hp[0],hpMax:hp[1],dodgeMin:dodge[0],dodgeMax:dodge[1],critRateMin:critRate[0],critRateMax:critRate[1],critDamageMin:critDamage[0],critDamageMax:critDamage[1]};}));
    const trainingSource=data.trainingBalance&&typeof data.trainingBalance==="object"?data.trainingBalance:{};
    return {
      bossHpMultiplier:clampNumber(data.bossHpMultiplier,.25,5,1),
      bossAttackMultiplier:clampNumber(data.bossAttackMultiplier,.25,5,1),
      bossRewardMultiplier:clampNumber(data.bossRewardMultiplier,.25,5,1),
      balancePatchTitle:String(data.balancePatchTitle||DEFAULT_BALANCE.balancePatchTitle).slice(0,40),
      balancePatchNote:String(data.balancePatchNote||DEFAULT_BALANCE.balancePatchNote).slice(0,240),
      balanceRevision:Math.max(0,Math.floor(Number(data.balanceRevision)||0)),
      operationsRevision:Math.max(0,Math.floor(Number(data.operationsRevision)||0)),
      announcements:(Array.isArray(data.announcements)?data.announcements:[]).slice(0,30),
      gradeBalance,
      starBalance,
      trainingBalance:{costMultiplier:clampNumber(trainingSource.costMultiplier,.05,20,1),attackEffectMultiplier:clampNumber(trainingSource.attackEffectMultiplier,0,20,1),hpEffectMultiplier:clampNumber(trainingSource.hpEffectMultiplier,0,20,1),critDamageEffectMultiplier:clampNumber(trainingSource.critDamageEffectMultiplier,0,20,1)}
    };
  }

  function enforceStarTierOrder(rows){
    const ordered=rows.map(row=>({...row}));
    ["attack","hp","dodge","critRate","critDamage"].forEach(stat=>{
      for(let tier=1;tier<ordered.length;tier++){
        const minimumKey=stat+"Min",maximumKey=stat+"Max",previousMaximum=Number(ordered[tier-1][maximumKey])||0;
        ordered[tier][minimumKey]=Math.max(Number(ordered[tier][minimumKey])||0,previousMaximum);
        ordered[tier][maximumKey]=Math.max(Number(ordered[tier][maximumKey])||0,ordered[tier][minimumKey]);
      }
    });
    return ordered;
  }

  function applyBalanceForm(balance){
    const normalized=normalizeBalance(balance);
    adminBalanceConfig=normalized;
    $("#bossHpMultiplier").value=normalized.bossHpMultiplier;
    $("#bossAttackMultiplier").value=normalized.bossAttackMultiplier;
    $("#bossRewardMultiplier").value=normalized.bossRewardMultiplier;
    $("#balanceTitle").value=normalized.balancePatchTitle;
    $("#balanceNote").value=normalized.balancePatchNote;
    $("#balanceRevision").textContent="REV "+normalized.balanceRevision.toLocaleString();
    $("#metricBossHp").textContent="×"+normalized.bossHpMultiplier.toFixed(2);
    $("#metricBossAttack").textContent="×"+normalized.bossAttackMultiplier.toFixed(2);
    $("#gradeBalanceEditor").innerHTML=GRADE_NAMES.map(name=>{const row=normalized.gradeBalance[name];return `<div class="balance-table-row" data-grade-row="${escapeHtml(name)}"><strong>${escapeHtml(name)}</strong><label>기본 확률값<input data-grade-field="chance" type="number" min="0" max="100" step="0.01" value="${row.chance}"></label><label>기준 판매가<input data-grade-field="basePrice" type="number" min="0" step="1" value="${row.basePrice}"></label>${gradeRangeInput("공격력",row,"attack")}${gradeRangeInput("체력",row,"hp")}</div>`;}).join("");
    $("#starBalanceEditor").innerHTML=normalized.starBalance.map(row=>`<div class="balance-table-row" data-star-row="${row.tier}"><strong>${row.tier?`${row.tier}성`:"무별"}${row.tier===4?' <small>기본 0%</small>':""}</strong><label>확률(%)<input data-star-field="chance" type="number" min="0" max="100" step="0.1" value="${row.chance}"></label>${starRangeInput("공격 범위",row,"attack")}${starRangeInput("체력 범위",row,"hp")}${starRangeInput("회피율",row,"dodge")}${starRangeInput("치명타 확률",row,"critRate")}${starRangeInput("치명타 피해",row,"critDamage")}</div>`).join("");
    const training=normalized.trainingBalance;
    $("#trainingBalanceEditor").innerHTML=`<label>강화 비용 배율<input data-training-field="costMultiplier" type="number" min="0.05" max="20" step="0.05" value="${training.costMultiplier}"></label><label>공격 훈련 효과<input data-training-field="attackEffectMultiplier" type="number" min="0" max="20" step="0.05" value="${training.attackEffectMultiplier}"></label><label>체력 훈련 효과<input data-training-field="hpEffectMultiplier" type="number" min="0" max="20" step="0.05" value="${training.hpEffectMultiplier}"></label><label>치명타 훈련 효과<input data-training-field="critDamageEffectMultiplier" type="number" min="0" max="20" step="0.05" value="${training.critDamageEffectMultiplier}"></label>`;
    renderAdminNotices(normalized.announcements);
    updateBalanceOutputs();
  }

  function starRangeInput(label,row,key){
    return `<label>${label}<span class="range-pair"><input data-star-field="${key}Min" aria-label="${label} 최소" type="number" step="0.1" value="${row[key+"Min"]}"><input data-star-field="${key}Max" aria-label="${label} 최대" type="number" step="0.1" value="${row[key+"Max"]}"></span></label>`;
  }

  function gradeRangeInput(label,row,key){
    return `<label>${label} 최소 ~ 최대<span class="range-pair"><input data-grade-field="${key}Min" aria-label="${label} 최소" type="number" min="0" step="1" value="${row[key+"Min"]}"><input data-grade-field="${key}Max" aria-label="${label} 최대" type="number" min="0" step="1" value="${row[key+"Max"]}"></span></label>`;
  }

  function renderAdminNotices(items=[]){
    const list=(Array.isArray(items)?items:[]).slice(0,30);
    $("#adminNoticeList").innerHTML=list.length?list.map(item=>`<article class="notice-admin-item"><small>${escapeHtml(String(item.category||"update").toUpperCase())}</small><b>${escapeHtml(item.title||"운영 공지")}</b><p>${escapeHtml(item.body||"")}</p><time>${escapeHtml(formatDate(item.createdAtMillis))}</time></article>`).join(""):'<p class="empty-row">아직 게시한 공지가 없습니다.</p>';
  }

  function collectBalanceForm(){
    const gradeBalance={};
    $$('[data-grade-row]').forEach(row=>{const values={};row.querySelectorAll('[data-grade-field]').forEach(input=>values[input.dataset.gradeField]=input.value);gradeBalance[row.dataset.gradeRow]=values;});
    const starBalance=$$('[data-star-row]').map(row=>{const values={tier:Number(row.dataset.starRow)};row.querySelectorAll('[data-star-field]').forEach(input=>values[input.dataset.starField]=input.value);return values;});
    const trainingBalance={};
    $$('[data-training-field]').forEach(input=>trainingBalance[input.dataset.trainingField]=input.value);
    return {bossHpMultiplier:$("#bossHpMultiplier").value,bossAttackMultiplier:$("#bossAttackMultiplier").value,bossRewardMultiplier:$("#bossRewardMultiplier").value,balancePatchTitle:$("#balanceTitle").value,balancePatchNote:$("#balanceNote").value,gradeBalance,starBalance,trainingBalance};
  }

  function updateBalanceOutputs(){
    $("#bossHpOutput").textContent="×"+Number($("#bossHpMultiplier").value).toFixed(2);
    $("#bossAttackOutput").textContent="×"+Number($("#bossAttackMultiplier").value).toFixed(2);
    $("#bossRewardOutput").textContent="×"+Number($("#bossRewardMultiplier").value).toFixed(2);
  }

  function demoUsers(){
    return [
      {id:"바다왕",data:{nickname:"바다왕",money:4200000000000,rodLevel:1820,gameState:{bucket:Array(42)},updatedAt:new Date()}},
      {id:"심해선장",data:{nickname:"심해선장",money:950000000000,rodLevel:1275,gameState:{bucket:Array(18)},updatedAt:new Date(Date.now()-3600000)}},
      {id:"초보낚시꾼",data:{nickname:"초보낚시꾼",money:37000000,rodLevel:92,gameState:{bucket:Array(7)},updatedAt:new Date(Date.now()-7200000)}}
    ];
  }

  function renderRecentUsers(entries){
    $("#metricUsers").textContent=entries.length.toLocaleString()+"명";
    $("#recentUsers").innerHTML=entries.length?entries.map(entry=>{
      const user=entry.data||{},name=user.nickname||entry.id;
      return `<button type="button" class="data-row" data-user-open="${escapeHtml(entry.id)}"><div><b>${escapeHtml(name)}</b><small>${user.rankingExcluded?"랭킹 제외":"일반 유저"}</small></div><span>${escapeHtml(formatMoney(user.money))}</span><span>Lv.${Number(user.rodLevel||1).toLocaleString()}</span><span>${escapeHtml(formatDate(user.updatedAt))}</span></button>`;
    }).join(""):'<p class="empty-row">조회된 유저가 없습니다.</p>';
  }

  function renderAudit(entries){
    $("#metricAudits").textContent=entries.length.toLocaleString()+"건";
    $("#auditLog").innerHTML=entries.length?entries.map(entry=>{
      const log=entry.data||{};
      return `<article class="data-row audit"><div><b>${escapeHtml(log.action||"운영 작업")}</b><small>${escapeHtml(formatDate(log.createdAt))}</small></div><span>${escapeHtml(log.target||"-")}</span><span>${escapeHtml(log.detail||"")}</span><span>${escapeHtml(log.actorId||ADMIN_ID)}</span></article>`;
    }).join(""):'<p class="empty-row">아직 운영 기록이 없습니다.</p>';
  }

  async function loadRecentUsers(){
    if(localDemo){renderRecentUsers(demoUsers());return;}
    assertAdmin();
    let snapshot;
    try{snapshot=await db.collection("users").orderBy("updatedAt","desc").limit(20).get();}
    catch(error){console.warn(error);snapshot=await db.collection("users").limit(20).get();}
    renderRecentUsers(snapshot.docs.map(doc=>({id:doc.id,data:doc.data()||{}})));
  }

  async function loadAudit(){
    if(localDemo){renderAudit([{data:{action:"골드 지급",target:"바다왕",detail:"이벤트 보상 · 10억원",actorId:ADMIN_ID,createdAt:new Date()}},{data:{action:"밸런스 게시",target:"전체",detail:"보스 체력 ×1.10",actorId:ADMIN_ID,createdAt:new Date(Date.now()-5400000)}}]);return;}
    assertAdmin();
    const snapshot=await db.collection("adminAuditLogs").orderBy("createdAt","desc").limit(12).get();
    renderAudit(snapshot.docs.map(doc=>({id:doc.id,data:doc.data()||{}})));
  }

  async function loadBalance(){
    if(localDemo){applyBalanceForm({...DEFAULT_BALANCE,bossHpMultiplier:1.1,bossAttackMultiplier:.95,balanceRevision:7,balancePatchTitle:"심해 보스 조정",balancePatchNote:"초반 보스의 전투 시간을 조정했습니다."});return;}
    assertAdmin();
    const snapshot=await db.collection("config").doc("game").get();
    applyBalanceForm(snapshot.exists?snapshot.data()||{}:DEFAULT_BALANCE);
  }

  async function loadDashboardData(){
    setConnection("","데이터 불러오는 중");
    try{
      await Promise.all([loadBalance(),loadRecentUsers(),loadAudit()]);
      setConnection("online",localDemo?"로컬 화면 검사":"Firebase 연결됨");
    }catch(error){console.error(error);setConnection("error","불러오기 실패");showToast("관리자 데이터를 불러오지 못했습니다.","error");}
  }

  function userEntryFromSnapshot(id,data){
    return {id,data:{...data,nickname:data.nickname||id}};
  }

  function setCurrentTarget(entry){
    currentTarget=entry;
    const user=entry.data||{},state=user.gameState&&typeof user.gameState==="object"?user.gameState:{},training=state.trainingLevels&&typeof state.trainingLevels==="object"?state.trainingLevels:{};
    $("#targetSummary").hidden=false;
    $("#targetName").textContent=user.nickname||entry.id;
    $("#targetMoney").textContent=formatMoney(user.money??state.money);
    $("#targetRod").textContent="Lv."+Number(user.rodLevel??state.rodLevel??1).toLocaleString();
    const bucketCount=Number(user.bucketCount??state.bucketManifest?.totalCount??(Array.isArray(state.bucket)?state.bucket.length:0));
    $("#targetFish").textContent=bucketCount.toLocaleString()+"마리";
    $("#targetUpdated").textContent=formatDate(user.updatedAt);
    $("#adjustRod").value=Math.max(1,Number(user.rodLevel??state.rodLevel??1));
    $("#adjustAttack").value=Math.max(0,Number(training.attack||0));
    $("#adjustHp").value=Math.max(0,Number(training.hp||0));
    $("#adjustCrit").value=Math.max(0,Number(training.critDamage||0));
    $("#moneyGrantForm button[type=submit]").disabled=false;
    $("#growthAdjustForm button[type=submit]").disabled=false;
    $("#fishGrantForm button[type=submit]").disabled=false;
    setStatus("#userActionStatus","");
  }

  async function searchUser(nickname){
    const id=cleanNickname(nickname);
    if(!id)throw new Error("INVALID_NICKNAME");
    if(localDemo){
      const match=demoUsers().find(entry=>entry.id===id)||demoUsers()[0];
      setCurrentTarget(match);
      return;
    }
    assertAdmin();
    const snapshot=await db.collection("users").doc(id).get();
    if(!snapshot.exists)throw new Error("USER_NOT_FOUND");
    setCurrentTarget(userEntryFromSnapshot(snapshot.id,snapshot.data()||{}));
  }

  function protectedUserPatch(data,gameState,reason){
    return {
      money:Math.max(0,Math.floor(Number(gameState.money??data.money)||0)),
      rodLevel:Math.max(1,Math.floor(Number(gameState.rodLevel??data.rodLevel)||1)),
      totalEarned:Math.max(0,Math.floor(Number(gameState.totalEarned??data.totalEarned)||0)),
      totalFishingCount:Math.max(0,Math.floor(Number(gameState.totalFishingCount??data.totalFishingCount)||0)),
      accountResetVersion:1,
      cloudRevision:Math.max(0,Math.floor(Number(data.cloudRevision)||0))+1,
      gameState:{...gameState,saveSchemaVersion:USER_WRITE_SCHEMA_VERSION,accountResetVersion:1},
      writeSchemaVersion:USER_WRITE_SCHEMA_VERSION,
      writeProtocol:USER_WRITE_PROTOCOL_VERSION,
      writeProtocolSeq:Math.max(0,Math.floor(Number(data.writeProtocolSeq)||0))+1,
      writeGuardAt:serverTimestamp(),
      updatedAt:serverTimestamp(),
      writeReason:reason,
      adminChangedAt:serverTimestamp(),
      adminChangedBy:ADMIN_ID
    };
  }

  function auditPayload(action,target,detail){
    return {action,target,detail,actorId:ADMIN_ID,actorEmail:ADMIN_AUTH_EMAIL,createdAt:serverTimestamp()};
  }

  function personalNoticePayload(category,title,body,extra={}){
    return {category,title:String(title||"관리자 지원").slice(0,50),body:String(body||"").slice(0,500),createdAt:serverTimestamp(),createdAtMillis:Date.now(),...extra};
  }

  async function grantMoney(amount,reason){
    if(!currentTarget)throw new Error("SELECT_USER");
    assertAdmin();
    const grant=Math.floor(Number(amount));
    if(!Number.isSafeInteger(grant)||grant<=0)throw new Error("INVALID_AMOUNT");
    if(localDemo){showToast(`${currentTarget.id}에게 ${formatMoney(grant)} 지급 화면 검사 완료`);return;}
    const userRef=db.collection("users").doc(currentTarget.id),auditRef=db.collection("adminAuditLogs").doc(),noticeRef=userRef.collection("adminNotices").doc();
    await db.runTransaction(async tx=>{
      const snapshot=await tx.get(userRef);
      if(!snapshot.exists)throw new Error("USER_NOT_FOUND");
      const data=snapshot.data()||{},state=data.gameState&&typeof data.gameState==="object"?{...data.gameState}:{};
      const before=Math.max(0,Math.floor(Number(state.money??data.money)||0)),after=before+grant;
      if(!Number.isSafeInteger(after))throw new Error("AMOUNT_TOO_LARGE");
      state.money=after;
      const patch=protectedUserPatch(data,state,"admin_money_grant");
      patch.adminGrantTotal=Math.max(0,Math.floor(Number(data.adminGrantTotal)||0))+grant;
      tx.set(userRef,patch,{merge:true});
      tx.set(noticeRef,personalNoticePayload("money","골드가 지급되었습니다",`${formatMoney(grant)} · ${String(reason).slice(0,60)}`,{amount:grant}));
      tx.set(auditRef,auditPayload("골드 지급",currentTarget.id,`${String(reason).slice(0,60)} · ${formatMoney(grant)} · ${formatMoney(before)} → ${formatMoney(after)}`));
    });
    await searchUser(currentTarget.id);
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  async function adjustGrowth(values,reason){
    if(!currentTarget)throw new Error("SELECT_USER");
    assertAdmin();
    if(localDemo){showToast(`${currentTarget.id} 성장 수치 화면 검사 완료`);return;}
    const userRef=db.collection("users").doc(currentTarget.id),auditRef=db.collection("adminAuditLogs").doc(),noticeRef=userRef.collection("adminNotices").doc();
    await db.runTransaction(async tx=>{
      const snapshot=await tx.get(userRef);
      if(!snapshot.exists)throw new Error("USER_NOT_FOUND");
      const data=snapshot.data()||{},state=data.gameState&&typeof data.gameState==="object"?{...data.gameState}:{};
      const currentRod=Math.max(1,Math.floor(Number(state.rodLevel??data.rodLevel)||1)),currentTraining=state.trainingLevels&&typeof state.trainingLevels==="object"?state.trainingLevels:{};
      const nextRod=Math.max(currentRod,Math.floor(clampNumber(values.rod,1,MAX_ROD,currentRod)));
      const nextTraining={
        attack:Math.max(Number(currentTraining.attack)||0,Math.floor(clampNumber(values.attack,0,MAX_TRAINING,0))),
        hp:Math.max(Number(currentTraining.hp)||0,Math.floor(clampNumber(values.hp,0,MAX_TRAINING,0))),
        critDamage:Math.max(Number(currentTraining.critDamage)||0,Math.floor(clampNumber(values.critDamage,0,MAX_TRAINING,0)))
      };
      const changed=nextRod>currentRod||Object.keys(nextTraining).some(key=>nextTraining[key]>Number(currentTraining[key]||0));
      if(!changed)throw new Error("NO_GROWTH_CHANGE");
      state.rodLevel=nextRod;state.trainingLevels=nextTraining;
      const patch=protectedUserPatch(data,state,"admin_growth_support");
      tx.set(userRef,patch,{merge:true});
      tx.set(noticeRef,personalNoticePayload("growth","성장 지원이 적용되었습니다",`${String(reason).slice(0,60)} · 낚싯대 Lv.${nextRod} · 훈련 ${nextTraining.attack}/${nextTraining.hp}/${nextTraining.critDamage}`));
      tx.set(auditRef,auditPayload("성장 수치 상향",currentTarget.id,`${String(reason).slice(0,60)} · 낚싯대 Lv.${currentRod} → Lv.${nextRod} · 훈련 ${nextTraining.attack}/${nextTraining.hp}/${nextTraining.critDamage}`));
    });
    await searchUser(currentTarget.id);
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  function stableStorageHash(value){
    const text=String(value||"");let hash=2166136261;
    for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619);}
    return hash>>>0;
  }

  function bucketShardIdForFish(fish){return "shard_"+String(stableStorageHash(fish?.id)%BUCKET_SHARD_COUNT).padStart(3,"0");}

  function makeAdminFish(values,index=0){
    const now=Date.now(),name=String(values.name||"").trim().slice(0,40),catalogFish=existingFishByName.get(name);
    if(!catalogFish)throw new Error("INVALID_FISH");
    const grade=catalogFish.grade;
    const star=value=>Math.max(0,Math.min(4,Math.floor(Number(value)||0))),stars={attack:star(values.attackStar),hp:star(values.hpStar),dodge:star(values.dodgeStar),critRate:star(values.critRateStar),critDamage:star(values.critDamageStar)};
    const gradeBalance=adminBalanceConfig.gradeBalance?.[grade]||DEFAULT_GRADE_BALANCE[grade],sizeText=String(values.size??"").trim(),size=sizeText!==""&&Number(sizeText)>=0?Number(Number(sizeText).toFixed(1)):null,basePrice=Math.max(0,Number(gradeBalance.basePrice)||0),gradePower=Math.max(0,GRADE_NAMES.indexOf(grade)),price=grade==="쓰레기"?Math.max(1,Math.floor((Math.floor(Math.random()*30)+1)*Math.max(1,basePrice))):Math.max(1,Math.floor(basePrice+(size===null?7777:size)*gradePower*1000+Math.random()*basePrice*.4)),combat=makeAutomaticCombatStats(catalogFish,size,stars);
    const id=`admin_${now.toString(36)}_${index.toString(36)}_${Math.random().toString(36).slice(2,10)}`,order=now*1000+index+Math.floor(Math.random()*100);
    return {id,name,grade,size,price,locked:false,isNewCatch:false,time:`${new Date(now).toLocaleString("ko-KR")} · 관리자 지급`,adminGranted:true,adminGrantedAtMillis:now,_bucketStorageOrder:order,combat};
  }

  async function grantFish(values,reason){
    if(!currentTarget)throw new Error("SELECT_USER");
    assertAdmin();
    const quantity=Math.max(1,Math.min(20,Math.floor(Number(values.quantity)||1))),fishes=Array.from({length:quantity},(_,index)=>makeAdminFish(values,index));
    if(localDemo){showToast(`${currentTarget.id}에게 ${fishes[0].name} ${quantity}마리 지급 화면 검사 완료`);return;}
    const userRef=db.collection("users").doc(currentTarget.id),auditRef=db.collection("adminAuditLogs").doc(),noticeRef=userRef.collection("adminNotices").doc(),groups=new Map();
    fishes.forEach(fish=>{const shardId=bucketShardIdForFish(fish),list=groups.get(shardId)||[];list.push(fish);groups.set(shardId,list);});
    await db.runTransaction(async tx=>{
      const userSnapshot=await tx.get(userRef);
      if(!userSnapshot.exists)throw new Error("USER_NOT_FOUND");
      const data=userSnapshot.data()||{},state=data.gameState&&typeof data.gameState==="object"?{...data.gameState}:{};
      const split=Number(state.bucketStorage?.version||0)>=1,shardEntries=[];
      if(split){for(const [shardId,newFish] of groups){const ref=userRef.collection("bucketShards").doc(shardId),snapshot=await tx.get(ref);shardEntries.push({ref,shardId,newFish,oldItems:snapshot.exists&&Array.isArray(snapshot.data()?.items)?snapshot.data().items:[]});}}
      const patch=protectedUserPatch(data,state,"admin_fish_grant"),revision=patch.cloudRevision;
      if(split){
        const oldCount=Math.max(0,Number(state.bucketStorage?.count??state.bucketSummary?.count??data.bucketCount)||0),nextCount=oldCount+fishes.length;
        patch.gameState={...patch.gameState,bucket:[],bucketStorage:{...(state.bucketStorage||{}),version:1,shardCount:BUCKET_SHARD_COUNT,count:nextCount},bucketSummary:{...(state.bucketSummary||{}),count:nextCount}};
        shardEntries.forEach(entry=>{const items=[...entry.oldItems,...entry.newFish.map(fish=>({order:fish._bucketStorageOrder,fish}))];tx.set(entry.ref,{owner:currentTarget.id,shardId:entry.shardId,items,count:items.length,cloudRevision:revision,storageVersion:1,updatedAt:serverTimestamp()});});
      }else patch.gameState={...patch.gameState,bucket:[...(Array.isArray(state.bucket)?state.bucket:[]),...fishes]};
      tx.set(userRef,patch,{merge:true});
      tx.set(noticeRef,personalNoticePayload("fish","물고기가 지급되었습니다",`${fishes[0].grade} 등급 ${fishes[0].name} ${quantity.toLocaleString()}마리 · ${String(reason).slice(0,80)}`,{fishIds:fishes.map(fish=>fish.id),fishName:fishes[0].name,fishGrade:fishes[0].grade,fishCount:quantity}));
      tx.set(auditRef,auditPayload("물고기 지급",currentTarget.id,`${fishes[0].grade} ${fishes[0].name} ${quantity}마리 · ${String(reason).slice(0,80)}`));
    });
    await searchUser(currentTarget.id);
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  async function publishBalance(values){
    assertAdmin();
    const balance=normalizeBalance(values);
    if(!balance.balancePatchTitle||!balance.balancePatchNote)throw new Error("PATCH_TEXT_REQUIRED");
    if(localDemo){applyBalanceForm({...balance,balanceRevision:Number($("#balanceRevision").textContent.replace(/\D/g,""))+1});showToast("밸런스 게시 화면 검사 완료");return;}
    const configRef=db.collection("config").doc("game"),auditRef=db.collection("adminAuditLogs").doc(),createdAtMillis=Date.now();
    await db.runTransaction(async tx=>{
      const snapshot=await tx.get(configRef),current=snapshot.exists?snapshot.data()||{}:{},announcements=(Array.isArray(current.announcements)?current.announcements:[]).slice(0,29);
      announcements.unshift({id:`balance_${createdAtMillis}`,category:"balance",title:balance.balancePatchTitle,body:balance.balancePatchNote,createdAtMillis});
      tx.set(configRef,{bossHpMultiplier:balance.bossHpMultiplier,bossAttackMultiplier:balance.bossAttackMultiplier,bossRewardMultiplier:balance.bossRewardMultiplier,gradeBalance:balance.gradeBalance,starBalance:balance.starBalance,trainingBalance:balance.trainingBalance,announcements,balancePatchTitle:balance.balancePatchTitle,balancePatchNote:balance.balancePatchNote,balanceRevision:Math.max(0,Number(current.balanceRevision)||0)+1,operationsRevision:Math.max(0,Number(current.operationsRevision)||0)+1,balanceUpdatedAt:serverTimestamp(),balanceUpdatedBy:ADMIN_ID},{merge:true});
      tx.set(auditRef,auditPayload("밸런스 게시","전체",`${balance.balancePatchTitle} · 체력 ×${balance.bossHpMultiplier.toFixed(2)} · 공격 ×${balance.bossAttackMultiplier.toFixed(2)} · 상금 ×${balance.bossRewardMultiplier.toFixed(2)}`));
    });
    await Promise.all([loadBalance(),loadAudit()]);
  }

  async function publishNotice(category,title,body){
    assertAdmin();
    title=String(title||"").trim().slice(0,50);body=String(body||"").trim().slice(0,500);category=["update","balance","event","maintenance"].includes(category)?category:"update";
    if(!title||!body)throw new Error("PATCH_TEXT_REQUIRED");
    if(localDemo){const item={id:`notice_${Date.now()}`,category,title,body,createdAtMillis:Date.now()};renderAdminNotices([item,...(adminBalanceConfig.announcements||[])]);showToast("공지 게시 화면 검사 완료");return;}
    const configRef=db.collection("config").doc("game"),auditRef=db.collection("adminAuditLogs").doc(),createdAtMillis=Date.now();
    await db.runTransaction(async tx=>{
      const snapshot=await tx.get(configRef),current=snapshot.exists?snapshot.data()||{}:{},announcements=(Array.isArray(current.announcements)?current.announcements:[]).slice(0,29);
      announcements.unshift({id:`notice_${createdAtMillis}_${Math.random().toString(36).slice(2,7)}`,category,title,body,createdAtMillis});
      tx.set(configRef,{announcements,operationsRevision:Math.max(0,Number(current.operationsRevision)||0)+1,noticeUpdatedAt:serverTimestamp(),noticeUpdatedBy:ADMIN_ID},{merge:true});
      tx.set(auditRef,auditPayload("공지 게시","전체",`${title} · ${category}`));
    });
    await Promise.all([loadBalance(),loadAudit()]);
  }

  function freshAdminState(){
    const defeated={},difficultyClears={};
    BOSS_IDS.forEach(id=>{defeated[id]=true;difficultyClears[id]={normal:true,hard:true,crazy:true};});
    return {saveSchemaVersion:USER_WRITE_SCHEMA_VERSION,accountResetVersion:1,money:0,totalEarned:0,rodLevel:MAX_ROD,bucket:[],collection:{},ranking:[],totalFishingCount:0,dailyFishing:{date:"",count:0},gradeCounts:{},completedAchievements:[...ALL_TITLES],marketHour:null,marketRates:{},notifications:[],messages:[],researchLevels:{fishing:MAX_RESEARCH,appraisal:MAX_RESEARCH},trainingLevels:{attack:MAX_TRAINING,hp:MAX_TRAINING,critDamage:MAX_TRAINING},unlockedTitles:[...ALL_TITLES],equippedTitle:"공허",profileCosmetics:{border:"azathoth",aura:"azathoth",background:"공허",attackEffect:"공허"},battleHistory:{boss:[],pvp:[]},seenUpdateNoticeIds:[],bossProgress:{defeated,difficultyClears,hp:{},materials:{},selectedBossId:"azathoth",selectedDifficulty:"crazy",cooldownUntil:0,cooldowns:{}},pvpPrepIndexes:[],partyPresets:{boss:[],pvp:[]},fusionMainFishId:"",fusionMainFishIds:{},aquariumFishIds:[]};
  }

  function applyAdminPrivilegesToState(existingState){
    const base=freshAdminState(),state=existingState&&typeof existingState==="object"?{...base,...existingState}:base;
    const progress=state.bossProgress&&typeof state.bossProgress==="object"?state.bossProgress:{};
    state.saveSchemaVersion=USER_WRITE_SCHEMA_VERSION;state.accountResetVersion=1;state.rodLevel=MAX_ROD;
    state.researchLevels={fishing:MAX_RESEARCH,appraisal:MAX_RESEARCH};
    state.trainingLevels={attack:MAX_TRAINING,hp:MAX_TRAINING,critDamage:MAX_TRAINING};
    state.completedAchievements=[...new Set([...(state.completedAchievements||[]),...ALL_TITLES])];
    state.unlockedTitles=[...new Set([...(state.unlockedTitles||[]),...ALL_TITLES])];
    state.equippedTitle=state.equippedTitle||"공허";
    const defeated={...(progress.defeated||{})},difficultyClears={...(progress.difficultyClears||{})};
    BOSS_IDS.forEach(id=>{defeated[id]=true;difficultyClears[id]={normal:true,hard:true,crazy:true};});
    state.bossProgress={...base.bossProgress,...progress,defeated,difficultyClears};
    state.profileCosmetics=state.profileCosmetics&&typeof state.profileCosmetics==="object"?state.profileCosmetics:base.profileCosmetics;
    return state;
  }

  async function prepareAdminGameAccount(){
    assertAdmin();
    if(localDemo){setStatus("#adminAccountStatus","관리자 게임 계정 준비 화면 검사 완료","success");showToast("관리자 계정 준비 완료");return;}
    const userRef=db.collection("users").doc(ADMIN_ID),auditRef=db.collection("adminAuditLogs").doc();
    await db.runTransaction(async tx=>{
      const snapshot=await tx.get(userRef),exists=snapshot.exists,data=exists?snapshot.data()||{}:{};
      const state=applyAdminPrivilegesToState(data.gameState);
      const revision=exists?Math.max(0,Number(data.cloudRevision)||0)+1:0,sequence=Math.max(0,Number(data.writeProtocolSeq)||0)+1,time=serverTimestamp();
      const patch={nickname:ADMIN_ID,passwordHash:"firebase-auth-managed",sessionTokenHash:String(data.sessionTokenHash||""),sessionTokens:data.sessionTokens&&typeof data.sessionTokens==="object"?data.sessionTokens:{},activeSessionDeviceId:String(data.activeSessionDeviceId||""),activeSessionTokenHash:String(data.activeSessionTokenHash||""),activeSessionSeenAt:time,accountResetVersion:1,cloudRevision:revision,money:Math.max(0,Number(state.money)||0),rodLevel:MAX_ROD,totalEarned:Math.max(0,Number(state.totalEarned)||0),totalFishingCount:Math.max(0,Number(state.totalFishingCount)||0),title:"공허",gameState:state,isAdmin:true,rankingExcluded:true,publicHidden:true,writeSchemaVersion:USER_WRITE_SCHEMA_VERSION,writeProtocol:USER_WRITE_PROTOCOL_VERSION,writeProtocolSeq:sequence,writeGuardAt:time,updatedAt:time,writeReason:"admin_account_prepare",adminChangedAt:time,adminChangedBy:ADMIN_ID};
      if(!exists)patch.createdAt=time;
      tx.set(userRef,patch,{merge:true});
      tx.set(auditRef,auditPayload("관리자 계정 준비",ADMIN_ID,"전체 해금 · 랭킹/검색/프로필/수족관 등 공개 화면 숨김"));
    });
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  function errorMessage(error){
    const code=String(error?.code||error?.message||"");
    if(code.includes("wrong-password")||code.includes("invalid-credential"))return "비밀번호가 맞지 않습니다.";
    if(code.includes("user-not-found"))return "Firebase에 관리자 계정이 없습니다.";
    if(code.includes("operation-not-allowed"))return "Firebase Authentication에서 이메일 로그인을 켜주세요.";
    if(code.includes("ADMIN_AUTH_REQUIRED"))return "관리자 로그인이 필요합니다.";
    if(code.includes("INVALID_NICKNAME"))return "닉네임을 정확히 입력해주세요.";
    if(code.includes("USER_NOT_FOUND"))return "해당 유저를 찾지 못했습니다.";
    if(code.includes("SELECT_USER"))return "먼저 유저를 검색해주세요.";
    if(code.includes("INVALID_AMOUNT"))return "지급 금액은 1 이상의 정수여야 합니다.";
    if(code.includes("AMOUNT_TOO_LARGE"))return "지급 후 금액이 너무 큽니다.";
    if(code.includes("NO_GROWTH_CHANGE"))return "기존보다 높은 성장 수치를 입력해주세요.";
    if(code.includes("PATCH_TEXT_REQUIRED"))return "패치 제목과 내용을 입력해주세요.";
    if(code.includes("INVALID_FISH"))return "기존 물고기를 선택하고 전투 수치를 정확히 입력해주세요.";
    if(code.includes("permission-denied"))return "Firestore 관리자 규칙을 게시해주세요.";
    return "처리 중 오류가 발생했습니다.";
  }

  async function handleLogin(event){
    event.preventDefault();
    const id=String($("#adminId").value||"").trim().toLowerCase(),password=String($("#adminPassword").value||""),button=event.submitter||event.currentTarget.querySelector("button[type=submit]");
    if(id!==ADMIN_ID){setStatus("#adminLoginStatus","관리자 아이디가 맞지 않습니다.","error");return;}
    if(!password){setStatus("#adminLoginStatus","비밀번호를 입력해주세요.","error");return;}
    if(localDemo){openDashboard();return;}
    setButtonBusy(button,true,"로그인 확인 중...");setStatus("#adminLoginStatus","Firebase 관리자 계정을 확인하고 있습니다.");
    try{
      await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
      const credential=await auth.signInWithEmailAndPassword(ADMIN_AUTH_EMAIL,password);
      if(!isAuthorizedUser(credential.user))throw new Error("ADMIN_AUTH_REQUIRED");
      $("#adminPassword").value="";setStatus("#adminLoginStatus","관리자 확인 완료","success");openDashboard();
    }catch(error){console.error(error);await auth.signOut().catch(()=>{});setStatus("#adminLoginStatus",errorMessage(error),"error");}
    finally{setButtonBusy(button,false);}
  }

  $("#adminLoginForm").addEventListener("submit",handleLogin);
  $("#adminLogout").addEventListener("click",async()=>{if(!localDemo)await auth.signOut().catch(()=>{});location.reload();});
  $$('[data-admin-tab]').forEach(button=>button.addEventListener("click",()=>switchTab(button.dataset.adminTab)));
  $$('[data-admin-refresh]').forEach(button=>button.addEventListener("click",async()=>{setButtonBusy(button,true,"…");try{if(button.dataset.adminRefresh==="users")await loadRecentUsers();else await loadAudit();showToast("새로고침했습니다.");}catch(error){console.error(error);showToast(errorMessage(error),"error");}finally{setButtonBusy(button,false);}}));
  $$('[type=range]').forEach(input=>input.addEventListener("input",updateBalanceOutputs));
  $("#resetBalance").addEventListener("click",()=>applyBalanceForm(DEFAULT_BALANCE));
  $("#recentUsers").addEventListener("click",async event=>{const row=event.target.closest("[data-user-open]");if(!row)return;switchTab("users");$("#targetNickname").value=row.dataset.userOpen;try{await searchUser(row.dataset.userOpen);}catch(error){showToast(errorMessage(error),"error");}});
  $("#userSearchForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"검색 중...");try{await searchUser($("#targetNickname").value);showToast("유저를 불러왔습니다.");}catch(error){console.error(error);setStatus("#userActionStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#moneyGrantForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"지급 중...");try{await grantMoney($("#grantAmount").value,$("#grantReason").value);$("#grantAmount").value="";setStatus("#userActionStatus","골드를 지급하고 운영 기록에 남겼습니다.","success");showToast("골드 지급 완료");}catch(error){console.error(error);setStatus("#userActionStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#growthAdjustForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"저장 중...");try{await adjustGrowth({rod:$("#adjustRod").value,attack:$("#adjustAttack").value,hp:$("#adjustHp").value,critDamage:$("#adjustCrit").value},$("#growthReason").value);setStatus("#userActionStatus","성장 수치를 저장하고 운영 기록에 남겼습니다.","success");showToast("성장 수치 저장 완료");}catch(error){console.error(error);setStatus("#userActionStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#grantFishSelect").addEventListener("change",syncFishGrantSelection);
  $("#fishGrantForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"지급 중...");try{await grantFish({name:$("#grantFishSelect").value,size:$("#grantFishSize").value,quantity:$("#grantFishQuantity").value,attackStar:$("#grantFishAttackStar").value,hpStar:$("#grantFishHpStar").value,dodgeStar:$("#grantFishDodgeStar").value,critRateStar:$("#grantFishCritRateStar").value,critDamageStar:$("#grantFishCritDamageStar").value},$("#grantFishReason").value);setStatus("#userActionStatus","물고기를 지급했습니다. 접속 중인 유저에게 바로 표시됩니다.","success");showToast("물고기 지급 완료");}catch(error){console.error(error);setStatus("#userActionStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#balanceForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"게시 중...");try{await publishBalance(collectBalanceForm());setStatus("#balanceStatus","밸런스를 게시했습니다. 접속 중인 게임에도 바로 적용됩니다.","success");showToast("밸런스 게시 완료");}catch(error){console.error(error);setStatus("#balanceStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#noticeForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"게시 중...");try{await publishNotice($("#noticeCategory").value,$("#noticeTitle").value,$("#noticeBody").value);$("#noticeTitle").value="";$("#noticeBody").value="";setStatus("#noticeStatus","공지를 게시했습니다. 접속 중인 유저에게 바로 표시됩니다.","success");showToast("공지 게시 완료");}catch(error){console.error(error);setStatus("#noticeStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#prepareAdminAccount").addEventListener("click",async event=>{const button=event.currentTarget;setButtonBusy(button,true,"계정 준비 중...");try{await prepareAdminGameAccount();setStatus("#adminAccountStatus","관리자 게임 계정을 준비했습니다.","success");showToast("관리자 게임 계정 준비 완료");}catch(error){console.error(error);setStatus("#adminAccountStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});

  initializeFishGrantCatalog();

  if(localDemo){openDashboard();}
  else auth.onAuthStateChanged(async user=>{
    if(isAuthorizedUser(user))openDashboard();
    else if(user)await auth.signOut().catch(()=>{});
  });
})();
