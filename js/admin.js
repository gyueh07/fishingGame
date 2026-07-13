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
  const ALL_TITLES=["환경 지킴이","수집가","탐험가","개척자","정복자","전설","신화","초월자","불멸","공허","초보","베테랑","중독자","거장","천 번의 담금질","행운아","드래곤 헌터","부자","재벌"];
  const DEFAULT_BALANCE={bossHpMultiplier:1,bossAttackMultiplier:1,bossRewardMultiplier:1,balancePatchTitle:"기본 밸런스",balancePatchNote:"현재 기본 배율이 적용 중입니다.",balanceRevision:0};
  const firebaseConfig={apiKey:"AIzaSyBLH8EJYZ4x9dez23PkFrMAMo3JD5vaO8I",authDomain:"fishinggame-1c8ac.firebaseapp.com",projectId:"fishinggame-1c8ac",storageBucket:"fishinggame-1c8ac.firebasestorage.app",messagingSenderId:"1075825889471",appId:"1:1075825889471:web:dba6773633846463e4760a",measurementId:"G-HKMKFFCT67"};
  const localDemo=location.hostname==="127.0.0.1"&&new URLSearchParams(location.search).has("adminDemo");

  if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
  const auth=firebase.auth();
  const db=firebase.firestore();
  const serverTimestamp=()=>firebase.firestore.FieldValue.serverTimestamp();
  const $=selector=>document.querySelector(selector);
  const $$=selector=>[...document.querySelectorAll(selector)];
  let currentTarget=null;
  let dashboardLoaded=false;
  let toastTimer=null;

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
    const labels={overview:["OVERVIEW","운영 현황"],users:["PLAYER CONTROL","유저 관리"],balance:["LIVE BALANCE","밸런스 조정"],system:["ADMIN ACCOUNT","관리자 계정"]};
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
    return {
      bossHpMultiplier:clampNumber(data.bossHpMultiplier,.25,5,1),
      bossAttackMultiplier:clampNumber(data.bossAttackMultiplier,.25,5,1),
      bossRewardMultiplier:clampNumber(data.bossRewardMultiplier,.25,5,1),
      balancePatchTitle:String(data.balancePatchTitle||DEFAULT_BALANCE.balancePatchTitle).slice(0,40),
      balancePatchNote:String(data.balancePatchNote||DEFAULT_BALANCE.balancePatchNote).slice(0,240),
      balanceRevision:Math.max(0,Math.floor(Number(data.balanceRevision)||0))
    };
  }

  function applyBalanceForm(balance){
    const normalized=normalizeBalance(balance);
    $("#bossHpMultiplier").value=normalized.bossHpMultiplier;
    $("#bossAttackMultiplier").value=normalized.bossAttackMultiplier;
    $("#bossRewardMultiplier").value=normalized.bossRewardMultiplier;
    $("#balanceTitle").value=normalized.balancePatchTitle;
    $("#balanceNote").value=normalized.balancePatchNote;
    $("#balanceRevision").textContent="REV "+normalized.balanceRevision.toLocaleString();
    $("#metricBossHp").textContent="×"+normalized.bossHpMultiplier.toFixed(2);
    $("#metricBossAttack").textContent="×"+normalized.bossAttackMultiplier.toFixed(2);
    updateBalanceOutputs();
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

  async function grantMoney(amount,reason){
    if(!currentTarget)throw new Error("SELECT_USER");
    assertAdmin();
    const grant=Math.floor(Number(amount));
    if(!Number.isSafeInteger(grant)||grant<=0)throw new Error("INVALID_AMOUNT");
    if(localDemo){showToast(`${currentTarget.id}에게 ${formatMoney(grant)} 지급 화면 검사 완료`);return;}
    const userRef=db.collection("users").doc(currentTarget.id),auditRef=db.collection("adminAuditLogs").doc();
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
      tx.set(auditRef,auditPayload("골드 지급",currentTarget.id,`${String(reason).slice(0,60)} · ${formatMoney(grant)} · ${formatMoney(before)} → ${formatMoney(after)}`));
    });
    await searchUser(currentTarget.id);
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  async function adjustGrowth(values,reason){
    if(!currentTarget)throw new Error("SELECT_USER");
    assertAdmin();
    if(localDemo){showToast(`${currentTarget.id} 성장 수치 화면 검사 완료`);return;}
    const userRef=db.collection("users").doc(currentTarget.id),auditRef=db.collection("adminAuditLogs").doc();
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
      tx.set(auditRef,auditPayload("성장 수치 상향",currentTarget.id,`${String(reason).slice(0,60)} · 낚싯대 Lv.${currentRod} → Lv.${nextRod} · 훈련 ${nextTraining.attack}/${nextTraining.hp}/${nextTraining.critDamage}`));
    });
    await searchUser(currentTarget.id);
    await Promise.all([loadRecentUsers(),loadAudit()]);
  }

  async function publishBalance(values){
    assertAdmin();
    const balance=normalizeBalance(values);
    if(!balance.balancePatchTitle||!balance.balancePatchNote)throw new Error("PATCH_TEXT_REQUIRED");
    if(localDemo){applyBalanceForm({...balance,balanceRevision:Number($("#balanceRevision").textContent.replace(/\D/g,""))+1});showToast("밸런스 게시 화면 검사 완료");return;}
    const configRef=db.collection("config").doc("game"),auditRef=db.collection("adminAuditLogs").doc(),batch=db.batch();
    batch.set(configRef,{bossHpMultiplier:balance.bossHpMultiplier,bossAttackMultiplier:balance.bossAttackMultiplier,bossRewardMultiplier:balance.bossRewardMultiplier,balancePatchTitle:balance.balancePatchTitle,balancePatchNote:balance.balancePatchNote,balanceRevision:firebase.firestore.FieldValue.increment(1),balanceUpdatedAt:serverTimestamp(),balanceUpdatedBy:ADMIN_ID},{merge:true});
    batch.set(auditRef,auditPayload("밸런스 게시","전체",`${balance.balancePatchTitle} · 체력 ×${balance.bossHpMultiplier.toFixed(2)} · 공격 ×${balance.bossAttackMultiplier.toFixed(2)} · 상금 ×${balance.bossRewardMultiplier.toFixed(2)}`));
    await batch.commit();
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
      const patch={nickname:ADMIN_ID,passwordHash:"firebase-auth-managed",sessionTokenHash:String(data.sessionTokenHash||""),sessionTokens:data.sessionTokens&&typeof data.sessionTokens==="object"?data.sessionTokens:{},activeSessionDeviceId:String(data.activeSessionDeviceId||""),activeSessionTokenHash:String(data.activeSessionTokenHash||""),activeSessionSeenAt:time,accountResetVersion:1,cloudRevision:revision,money:Math.max(0,Number(state.money)||0),rodLevel:MAX_ROD,totalEarned:Math.max(0,Number(state.totalEarned)||0),totalFishingCount:Math.max(0,Number(state.totalFishingCount)||0),title:"공허",gameState:state,isAdmin:true,rankingExcluded:true,writeSchemaVersion:USER_WRITE_SCHEMA_VERSION,writeProtocol:USER_WRITE_PROTOCOL_VERSION,writeProtocolSeq:sequence,writeGuardAt:time,updatedAt:time,writeReason:"admin_account_prepare",adminChangedAt:time,adminChangedBy:ADMIN_ID};
      if(!exists)patch.createdAt=time;
      tx.set(userRef,patch,{merge:true});
      tx.set(auditRef,auditPayload("관리자 계정 준비",ADMIN_ID,"낚싯대·훈련·보스·프로필 전체 해금 · 랭킹 제외"));
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
  $("#balanceForm").addEventListener("submit",async event=>{event.preventDefault();const button=event.submitter;setButtonBusy(button,true,"게시 중...");try{await publishBalance({bossHpMultiplier:$("#bossHpMultiplier").value,bossAttackMultiplier:$("#bossAttackMultiplier").value,bossRewardMultiplier:$("#bossRewardMultiplier").value,balancePatchTitle:$("#balanceTitle").value,balancePatchNote:$("#balanceNote").value});setStatus("#balanceStatus","밸런스를 게시했습니다. 게임 새로고침 후 적용됩니다.","success");showToast("밸런스 게시 완료");}catch(error){console.error(error);setStatus("#balanceStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});
  $("#prepareAdminAccount").addEventListener("click",async event=>{const button=event.currentTarget;setButtonBusy(button,true,"계정 준비 중...");try{await prepareAdminGameAccount();setStatus("#adminAccountStatus","관리자 게임 계정을 준비했습니다.","success");showToast("관리자 게임 계정 준비 완료");}catch(error){console.error(error);setStatus("#adminAccountStatus",errorMessage(error),"error");}finally{setButtonBusy(button,false);}});

  if(localDemo){openDashboard();}
  else auth.onAuthStateChanged(async user=>{
    if(isAuthorizedUser(user))openDashboard();
    else if(user)await auth.signOut().catch(()=>{});
  });
})();
