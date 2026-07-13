(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const gradeClasses = {
    "쓰레기":"trash", "일반":"normal", "희귀":"rare", "영웅":"hero", "전설":"legend",
    "신화":"myth", "초월":"transcend", "영원":"eternal", "공허":"void"
  };
  const specialFishEmojis = {
    "호수에 비친 은하수":"🌌", "호수에 비친 별":"⭐", "호수에 비친 달":"🌙", "바다를 삼킨 태양":"☀️",
    "휘몰아치는 마음":"🌪️", "영롱한 다이아몬드":"💎", "얼어붙은 마음":"🧊", "빛나는 마음":"✨",
    "불타는 마음":"🔥", "무한한 시간":"⏳",
    "잃어버린 첫 번째 편지 조각 ✉️":"✉️", "잃어버린 두 번째 편지 조각 ✉️":"📨", "잃어버린 세 번째 편지 조각 ✉️":"💌",
    "수상한 기운 👁️":"👁️", "기묘한 기운 🌀":"🌀"
  };
  const bossSymbols = {
    kraken:"🐙", hydra:"🐍", leviathan:"🐋", behemoth:"🦏", phoenix:"🔥", bahamut:"🐉", tiamat:"🐲",
    jormungandr:"🐍", fenrir:"🐺", surtr:"🌋", cerberus:"🐕", nidhogg:"🐉", azhi_dahaka:"🐲", typhon:"🌪️", angra_mainyu:"🌑",
    erebos:"🌘", chronos:"⏳", nyarlathotep:"🎭", yog_sothoth:"🚪", azathoth:"🕳️"
  };
  const ratingColors = {PERFECT:"#ffe46a", GREAT:"#5ef0d1", GOOD:"#73cfff", BAD:"#ff8b91"};
  const cosmeticGrades = {
    "영웅":{slug:"hero",icon:"🔵",name:"영웅",primary:"#6f9dff",secondary:"#2858d9"},
    "전설":{slug:"legend",icon:"🟠",name:"전설",primary:"#ffac55",secondary:"#ff6238"},
    "신화":{slug:"myth",icon:"🔴",name:"신화",primary:"#ff6279",secondary:"#ff263f"},
    "초월":{slug:"transcend",icon:"🟡",name:"초월",primary:"#ffe25b",secondary:"#ff9f1c"},
    "영원":{slug:"eternal",icon:"🟢",name:"영원",primary:"#45f1d0",secondary:"#00a98e"},
    "공허":{slug:"void",icon:"🟣",name:"공허",primary:"#d053ff",secondary:"#4b006e"}
  };
  const profileAuraTierClasses=[1,2,3,4,5].map(tier=>`profile-aura-tier-${tier}`);
  const gradeAttackClasses=Object.values(cosmeticGrades).map(config=>"grade-attack-"+config.slug);
  const gradeAttackTriggerClasses=["grade-attack-trigger-a","grade-attack-trigger-b"];
  const bossFinisherClasses=["boss-finisher","boss-finisher-prelude","boss-finisher-hard","boss-finisher-crazy","pvp-finisher",...Object.values(cosmeticGrades).map(config=>"boss-finisher-"+config.slug)];
  const feedbackSettings=(()=>{try{const saved=JSON.parse(localStorage.getItem("fishingLifeFeedbackSettings")||"{}");return {sound:saved.sound!==false,vibration:saved.vibration!==false,timeBackground:saved.timeBackground!==false};}catch{return {sound:true,vibration:true,timeBackground:true};}})();
  let gameAudioContext=null;

  const state = {
    activeView:"fishingView", bucketKey:"", bossKey:"", collectionKey:"", previousBucketCount:0,
    initialized:false, toastTimer:null, trainingSyncKey:"", trainingBucketRef:null, timingActive:false, timingStartedAt:0, timingDuration:1900,
    timingTarget:.5, timingPosition:0, timingRaf:0, timingTimeout:0,
    battleReplayToken:0, battleReplaySpeed:1, battleReplaySkip:false, battleReplayRunning:false,lastBattleReplay:null, bossPartySortOrder:"전투력", catchCelebrationTimer:0,
    pvpReplayToken:0,pvpReplaySpeed:1,pvpReplaySkip:false,pvpReplayRunning:false,lastPvpReplay:null,pvpReplayDom:null,pvpPartySortOrder:"전투력",pvpVisibleCount:30,pendingPvpRequest:null,
    fusionMaterialIds:[],fusionAnimationResolve:null,presetEditorType:"boss",presetEditorIds:[],
    renderQueued:false,renderForce:false,bucketRenderToken:0,replayDom:null,replaySummonKey:"",replaySummonIds:new Set(),lastActionHtml:"",replayBossHpValue:0,bossHpAnimationToken:0,bossPartyVisibleCount:30,soundAt:{},gradeAttackPulse:0,transferFishIds:[],transferTarget:"",transferVisibleCount:30,transferScrollTop:0,rankingSections:null,authMode:"login",fishingTimeKey:"",aquariumEdit:false,aquariumVisibleCount:30,aquariumGalleryCache:null,aquariumGalleryAt:0,publicAquariumCurrent:null
  };
  globalThis.isFishingLifeBattleLocked=()=>!!(state.battleReplayRunning||state.pvpReplayRunning);
  globalThis.showFishingLifeBattleLockNotice=()=>showToast("전투가 끝난 뒤 나갈 수 있습니다. 빠르게 보려면 건너뛰기를 눌러주세요.");

  function getProfileAuraTier(auraId){
    const boss=bossList.find(item=>item.id===auraId);if(!boss)return 0;
    const gradeOrder=Object.keys(cosmeticGrades),gradeIndex=Math.max(0,gradeOrder.indexOf(boss.grade)),gradeBosses=bossList.filter(item=>item.grade===boss.grade),isGradeFinal=gradeBosses.at(-1)?.id===boss.id;
    if(boss.id==="azathoth")return 5;
    let tier=gradeIndex<=1?1:gradeIndex<=3?2:gradeIndex===4?3:4;
    if(isGradeFinal)tier=Math.min(4,tier+1);
    return tier;
  }
  function getProfileAuraClass(auraId){const tier=getProfileAuraTier(auraId);return tier?`profile-aura-tier-${tier}`:"";}
  function applyProfileAuraTier(target,auraId){if(!target)return;target.classList.remove(...profileAuraTierClasses);const tierClass=getProfileAuraClass(auraId);if(tierClass)target.classList.add(tierClass);target.dataset.auraTier=String(getProfileAuraTier(auraId)||"");}
  function clearGradeAttackEffect(arena){if(arena)arena.classList.remove(...gradeAttackClasses,...gradeAttackTriggerClasses);}
  function clearBossFinisher(arena){if(!arena)return;arena.classList.remove(...bossFinisherClasses);arena.querySelector(".replay-boss")?.classList.remove("defeated");arena.querySelectorAll(".pvp-battle-side").forEach(side=>side.classList.remove("finisher-winner","finisher-loser"));}
  function triggerGradeAttackEffect(arena,grade){
    const config=cosmeticGrades[grade];if(!arena||!config)return false;
    clearGradeAttackEffect(arena);state.gradeAttackPulse=(state.gradeAttackPulse+1)%2;
    arena.classList.add("grade-attack-"+config.slug,state.gradeAttackPulse?"grade-attack-trigger-a":"grade-attack-trigger-b");
    return true;
  }

  function saveFeedbackSettings(){
    localStorage.setItem("fishingLifeFeedbackSettings",JSON.stringify(feedbackSettings));
  }

  function getAudioContext(){
    if(!feedbackSettings.sound)return null;
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return null;
    if(!gameAudioContext)gameAudioContext=new AudioCtor();
    if(gameAudioContext.state==="suspended")gameAudioContext.resume().catch(()=>{});
    return gameAudioContext;
  }

  function scheduleTone(ctx,{frequency=440,endFrequency=frequency,duration=.12,delay=0,type="sine",gain=.045}={}){
    const start=ctx.currentTime+delay,osc=ctx.createOscillator(),volume=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(35,frequency),start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35,endFrequency),start+duration);
    volume.gain.setValueAtTime(.0001,start);volume.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),start+.012);volume.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(volume);volume.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.025);
  }

  function playGameSound(type,detail=""){
    const now=typeof performance!=="undefined"?performance.now():Date.now(),cooldown=type==="bossAttack"?90:type==="crit"?120:0;
    if(cooldown&&state.soundAt[type]&&now-Number(state.soundAt[type])<cooldown)return;
    state.soundAt[type]=now;
    const ctx=getAudioContext();if(!ctx)return;
    const tones=[];
    if(type==="cast")tones.push({frequency:220,endFrequency:520,duration:.24,type:"triangle",gain:.035});
    else if(type==="bite")tones.push({frequency:640,duration:.06,gain:.04},{frequency:860,duration:.08,delay:.09,gain:.045});
    else if(type==="timing"){
      if(detail==="PERFECT")tones.push({frequency:880,duration:.14,gain:.04},{frequency:1320,duration:.18,delay:.07,gain:.045},{frequency:1760,duration:.24,delay:.15,gain:.035});
      else if(detail==="GREAT")tones.push({frequency:660,duration:.12,gain:.035},{frequency:990,duration:.16,delay:.08,gain:.035});
      else if(detail==="GOOD")tones.push({frequency:520,duration:.14,gain:.03});
      else tones.push({frequency:210,endFrequency:105,duration:.28,type:"sawtooth",gain:.025});
    }else if(type==="catch"){
      const order={"전설":0,"신화":1,"초월":2,"영원":3,"공허":4},level=order[detail];
      if(level===undefined)return;
      const base=520+level*85;
      tones.push({frequency:base,duration:.18,gain:.034},{frequency:base*1.25,duration:.24,delay:.08,gain:.038},{frequency:base*1.5,duration:.3,delay:.17,gain:.032});
    }else if(type==="bossAttack")tones.push({frequency:130,endFrequency:65,duration:.2,type:"square",gain:.025});
    else if(type==="crit")tones.push({frequency:1180,endFrequency:420,duration:.16,type:"sawtooth",gain:.035},{frequency:90,duration:.2,delay:.04,type:"square",gain:.03});
    else if(type==="crazy")tones.push({frequency:70,endFrequency:45,duration:.6,type:"sawtooth",gain:.04},{frequency:440,endFrequency:110,duration:.48,delay:.08,type:"square",gain:.025});
    else if(type==="summon")tones.push({frequency:120,endFrequency:360,duration:.34,type:"triangle",gain:.03},{frequency:520,duration:.22,delay:.18,type:"sine",gain:.032});
    else if(type==="victory")tones.push({frequency:523,duration:.18,gain:.035},{frequency:659,duration:.2,delay:.12,gain:.04},{frequency:784,duration:.22,delay:.24,gain:.04},{frequency:1046,duration:.36,delay:.38,gain:.035});
    else if(type==="fusion")tones.push({frequency:260,endFrequency:720,duration:.42,type:"triangle",gain:.032},{frequency:740,duration:.16,delay:.38,gain:.04},{frequency:1110,duration:.25,delay:.48,gain:.035});
    else if(type==="evolution"){
      const stage=Math.max(1,Math.min(3,Number(detail)||1)),base=220+stage*80;
      tones.push({frequency:70+stage*15,endFrequency:45,duration:.65,type:"sawtooth",gain:.035},{frequency:base,endFrequency:base*2,duration:.5,delay:.18,type:"triangle",gain:.04},{frequency:base*2.5,duration:.35,delay:.62,gain:.04});
    }
    tones.forEach(tone=>scheduleTone(ctx,tone));
  }

  function gameVibrate(kind){
    if(!feedbackSettings.vibration||typeof navigator.vibrate!=="function")return;
    const patterns={bite:[35,35,55],crit:[30,20,85],victory:[45,35,45,35,110],fusion:[30,30,65],evolution:[70,35,90,35,140]};
    navigator.vibrate(patterns[kind]||35);
  }

  function safe(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  }
  function plain(value) {
    const div = document.createElement("div");
    div.innerHTML = sanitizeGameHtml(String(value ?? ""));
    return div.textContent
      .replace(/[\u2500-\u257F\u231C-\u231F]+/g, " ")
      .replace(/(^|\s)[０-９]{1,6}\s+/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
  }
  function gradeClass(grade) { return "grade-" + (gradeClasses[grade] || "normal"); }
  function fishEvolutionClass(fish){
    const stage=Math.max(0,Math.min(3,Number(fish?.fusion?.evolutionStage??fish?.evolutionStage??0)));
    return stage?`fish-evolution-stage-${stage}`:"";
  }
  function fishEvolutionBadge(fish){
    const stage=Math.max(0,Math.min(3,Number(fish?.fusion?.evolutionStage??fish?.evolutionStage??0)));
    return stage?`<i class="fish-evolution-badge">${stage===3?"FINAL":`EV${stage}`}</i>`:"";
  }
  function fishIcon(fish) {
    const name = String(fish?.name || "");
    if (specialFishEmojis[name]) return specialFishEmojis[name];
    const specialName=Object.keys(specialFishEmojis).find(key=>name===displayFishName(key));
    if(specialName)return specialFishEmojis[specialName];
    if (/드래곤|룡|이무기/.test(name)) return "🐉";
    if (/고래/.test(name)) return "🐋";
    if (/상어/.test(name)) return "🦈";
    if (/문어|오징어|낙지/.test(name)) return "🐙";
    if (/게|새우|가재/.test(name)) return "🦀";
    if (/해파리/.test(name)) return "🪼";
    if (/조개|굴|전복/.test(name)) return "🐚";
    if (/해마/.test(name)) return "🐴";
    return fish?.grade === "쓰레기" ? "🗑️" : "🐟";
  }
  function combatStars(combat,stat){
    const tier=Math.max(0,Math.min(3,Number(combat?.stars?.[stat]||0)));
    return tier?`<span class="stat-stars" aria-label="${tier}성">${"★".repeat(tier)}</span>`:"";
  }
  function compactNumber(value) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return "0";
    if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(n >= 1e13 ? 0 : 1) + "조";
    if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(n >= 1e9 ? 0 : 1) + "억";
    if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(n >= 1e5 ? 0 : 1) + "만";
    return Math.floor(n).toLocaleString();
  }
  function combatHpNumber(value){
    let n=Math.max(0,Math.floor(Number(value||0)));
    if(!Number.isFinite(n))return "0";
    const parts=[];
    if(n>=1e12){const jo=Math.floor(n/1e12);parts.push(jo.toLocaleString()+"조");n%=1e12;}
    if(n>=1e8){const eok=Math.floor(n/1e8);parts.push(eok.toLocaleString()+"억");n%=1e8;}
    if(n>=1e4){const man=Math.floor(n/1e4);parts.push(man.toLocaleString()+"만");n%=1e4;}
    if(!parts.length)return n.toLocaleString();
    return parts.join(" ");
  }
  function stripPvpUiTokens(value){
    return String(value??"").replace(/\[?\[?\s*PVP[\s_-]*SIDE\s*:?\s*(?:left|right)\s*\]?\]?/gi,"").replace(/[ \t]{2,}/g," ").trim();
  }
  function showToast(message) {
    return showGameNotice(message);
  }
  function showGameNotice(message){
    const toast=$("#gameToast");if(!toast||!message)return;
    const config=message&&typeof message==="object"?message:{},raw=typeof message==="object"?config.message||config.title||"":message,holder=document.createElement("div");holder.innerHTML=sanitizeGameHtml(String(raw));const lines=(holder.textContent||"").split(/\n+/).map(line=>stripPvpUiTokens(line)).filter(Boolean),headline=stripPvpUiTokens(config.title||lines.shift()||"알림"),detail=stripPvpUiTokens(config.detail||lines.join(" · "));
    const danger=config.kind==="danger"||(!config.kind&&/부족|불가|실패|없습니다|오류|남아|잠금|기절/.test(headline+detail)),success=config.kind==="success"||(!config.kind&&/완료|성공|획득|판매|장착|저장|해제|보냈습니다/.test(headline+detail)),kind=danger?"danger":success?"success":"info",icon=config.icon||(danger?"⚠️":success?"✅":"🎮"),eyebrow=config.eyebrow||(kind==="danger"?"진행할 수 없음":kind==="success"?"완료":"게임 알림");
    toast.className=`game-toast game-notice ${kind}`;toast.innerHTML=`<span>${safe(icon)}</span><div><small>${safe(eyebrow)}</small><b>${safe(headline)}</b>${detail?`<p>${safe(detail)}</p>`:""}</div>`;requestAnimationFrame(()=>toast.classList.add("show"));clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>toast.classList.remove("show"),Math.max(2200,Number(config.duration||3800)));
  }
  globalThis.showFishingLifeNotice=showGameNotice;
  const achievementUnlockQueue=[];
  let achievementUnlockRunning=false;
  async function runAchievementUnlockQueue(){
    if(achievementUnlockRunning)return;
    achievementUnlockRunning=true;
    const host=$("#achievementFeed");
    while(achievementUnlockQueue.length){
      const achievement=achievementUnlockQueue.shift();
      if(!host)break;
      host.innerHTML=`<article class="achievement-unlock-card"><span>🏆</span><div><small>업적 달성</small><b>${safe(achievement.name||"업적 달성")}</b><p>${safe(achievement.desc||"새로운 업적을 달성했습니다.")}</p><strong>${Number(achievement.reward||0)>0?`+${safe(formatMoney(achievement.reward))}`:"칭호 업적 달성"}</strong></div></article>`;
      const card=host.firstElementChild;
      requestAnimationFrame(()=>card?.classList.add("show"));
      playGameSound("victory");gameVibrate("victory");
      await sleep(4300);
      card?.classList.remove("show");
      await sleep(260);
      host.replaceChildren();
    }
    achievementUnlockRunning=false;
  }
  globalThis.showFishingLifeAchievementUnlocks=list=>{
    (Array.isArray(list)?list:[list]).filter(Boolean).forEach(item=>achievementUnlockQueue.push(item));
    runAchievementUnlockQueue();
  };
  function showWorldCatchAlert({nickname="다른 선장",fishName="희귀한 물고기",fishGrade="영원"}={}){
    const host=$("#worldCatchFeed");if(!host)return;
    const card=document.createElement("article");
    card.className=`world-catch-card ${gradeClass(fishGrade)}`;
    card.innerHTML=`<span>${fishIcon({name:fishName,grade:fishGrade})}</span><div><small>희귀 물고기 소식 · ${safe(fishGrade)}</small><b>${safe(nickname)} 님</b><p>${safe(fishName)} 낚시 성공!</p></div>`;
    host.appendChild(card);
    while(host.children.length>3)host.firstElementChild?.remove();
    requestAnimationFrame(()=>card.classList.add("show"));
    setTimeout(()=>{card.classList.remove("show");setTimeout(()=>card.remove(),280);},8500);
  }
  globalThis.showWorldCatchAlert=showWorldCatchAlert;
  const modalScrollSelectors=[".aquarium-choice-list",".selection-fish-list",".boss-party-list",".transfer-fish-list",".inbox-list",".ranking-list",".preset-bucket-list"];
  function captureModalScroll(){
    const body=$("#modalBody"),positions={body:body?.scrollTop||0,pageX:window.scrollX||0,pageY:window.scrollY||0,children:{}};
    modalScrollSelectors.forEach(selector=>{const element=$(selector,body);if(element)positions.children[selector]=element.scrollTop||0;});
    return positions;
  }
  function restoreModalScroll(positions){
    if(!positions)return;
    const body=$("#modalBody");if(body)body.scrollTop=Math.max(0,Number(positions.body||0));
    Object.entries(positions.children||{}).forEach(([selector,top])=>{const element=$(selector,body);if(element)element.scrollTop=Math.max(0,Number(top||0));});
    window.scrollTo({left:Number(positions.pageX||0),top:Number(positions.pageY||0),behavior:"auto"});
  }
  function openUiModal(title, html) {
    const overlay=$("#modalOverlay"),sameModal=overlay?.style.display==="block"&&$("#modalTitle")?.textContent===title,scrollPositions=sameModal?captureModalScroll():null;
    state.battleReplayToken++;
    state.pvpReplayToken++;
    overlay?.classList.remove("emergency-recovery-mode","login-required-mode","battle-replay-mode");
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    overlay.style.display = "block";
    if(scrollPositions)requestAnimationFrame(()=>restoreModalScroll(scrollPositions));
  }
  function openVersionBlocker(detail=""){
    const message=String(detail||cloudVersionGateMessage||"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.");
    openUiModal("업데이트 확인",`<div class="game-dialog"><div class="dialog-summary warning"><div><small>계정 기록 보호</small><b>업데이트 확인이 필요합니다.</b><p>${safe(message)}</p></div><span>🛡️</span></div><div class="confirm-danger"><b>확인이 끝날 때까지 낚시·판매·강화·전송을 잠시 멈춥니다.</b><p>현재 기록은 이 기기에 안전하게 보관되어 있습니다.</p></div><div id="versionGateRetryStatus" class="login-gate-status" role="status">최신 버전을 확인해주세요.</div><div class="dialog-actions"><button class="primary" data-version-gate-retry>새로고침하고 확인</button></div></div>`);
  }
  globalThis.showFishingLifeVersionBlocker=openVersionBlocker;
  if(cloudGameReadOnlyBlocked)setTimeout(()=>openVersionBlocker(cloudVersionGateMessage),0);
  function openLoginGate(message="",checking=false,mode=state.authMode){
    if(currentUser&&!checking)return;
    state.authMode=mode==="register"?"register":"login";
    const registering=state.authMode==="register",savedNickname=localStorage.getItem("textFishingLastLoginNickname")||"";
    const title=registering?"새 계정 만들기":"FishingLife 로그인";
    const guide=registering?"모든 계정은 Lv.1부터 새로 시작합니다.":"로그인해야 게임을 시작할 수 있습니다.";
    openUiModal(title,`<div class="game-dialog login-gate"><section class="login-gate-hero"><span>${registering?"🌊":"🎣"}</span><div><small>${registering?"새 선장":"다시 오신 것을 환영합니다"}</small><h2>${registering?"새 항해 시작":"FishingLife"}</h2><p>${guide}</p></div></section><form id="loginGateForm" class="login-gate-form" data-auth-mode="${state.authMode}"><label><span>닉네임</span><input id="loginGateNickname" name="nickname" type="text" maxlength="16" autocomplete="username" autocapitalize="none" placeholder="닉네임 입력" value="${safe(savedNickname)}"></label><label><span>비밀번호</span><input id="loginGatePassword" name="password" type="password" autocomplete="${registering?"new-password":"current-password"}" placeholder="비밀번호 입력"></label><div id="loginGateStatus" class="login-gate-status ${message?"error":""}" role="status" aria-live="polite">${safe(message||guide)}</div><button id="loginGateSubmit" class="login-gate-submit" type="submit"><span>${registering?"🌊":"⚓"}</span><b>${registering?"Lv.1로 시작하기":"로그인"}</b></button></form><div class="login-gate-footer"><span>${registering?"이미 계정이 있나요?":"처음 시작하시나요?"}</span><button type="button" data-auth-switch="${registering?"login":"register"}">${registering?"로그인하기":"새 계정 만들기"}</button></div></div>`);
    $("#modalOverlay")?.classList.add("login-required-mode");
    setTimeout(()=>$("#loginGateNickname")?.focus(),30);
  }
  function updateLoginGateStatus(message,kind="loading"){
    const status=$("#loginGateStatus"),button=$("#loginGateSubmit");
    if(status){status.className="login-gate-status "+kind;status.textContent=message||"";}
    const loading=kind==="loading";
    if(button){button.disabled=loading;button.classList.toggle("loading",loading);const label=button.querySelector("b");if(label)label.textContent=loading?(state.authMode==="register"?"계정 만드는 중...":"로그인 중..."):(state.authMode==="register"?"Lv.1로 시작하기":"로그인");}
    $$("#loginGateForm input,.login-gate-footer button").forEach(control=>control.disabled=loading);
  }
  async function submitLoginGate(){
    const nickname=$("#loginGateNickname")?.value||"",password=$("#loginGatePassword")?.value||"";
    $("#sessionTakeoverPanel")?.remove();
    const registering=$("#loginGateForm")?.dataset.authMode==="register";
    updateLoginGateStatus(registering?"새 계정을 만들고 있습니다.":"계정을 확인하고 있습니다.","loading");
    const result=registering?await registerUser(nickname,password):await loginUser(nickname,password);
    if(!result?.ok&&$("#loginGateSubmit"))$("#loginGateSubmit").disabled=false;
  }
  globalThis.openFishingLifeLogin=openLoginGate;
  globalThis.updateFishingLifeLoginStatus=updateLoginGateStatus;
  globalThis.completeFishingLifeLogin=nickname=>{
    $("#modalOverlay")?.classList.remove("login-required-mode");
    if(["FishingLife 로그인","새 계정 만들기"].includes($("#modalTitle")?.textContent||""))closeModal(true);
    showGameNotice({icon:"⚓",eyebrow:"로그인 완료",title:`${nickname} 선장님, 어서 오세요`,detail:"낚시터를 열고 남은 게임 기록을 불러오고 있습니다.",kind:"success",duration:3000});
  };

  function openDeleteAccountWarning(){
    if(!currentUser){openLoginGate();return;}
    openUiModal("계정 탈퇴",`<div class="game-dialog delete-account-dialog"><div class="dialog-summary warning"><div><small>계정 삭제</small><b>${safe(currentUser)} 계정을 탈퇴할까요?</b><p>탈퇴하면 레벨, 지갑, 물고기, 전투 기록을 되돌릴 수 없습니다.</p></div><span>⚠️</span></div><div class="confirm-danger"><b>정말 탈퇴하려면 한 번 더 확인해주세요.</b><p>다음 화면에서 비밀번호를 입력해야 최종 탈퇴됩니다.</p></div><div class="dialog-actions"><button data-delete-account-next>계속</button><button class="primary" data-delete-account-cancel>취소</button></div></div>`);
  }
  globalThis.openFishingLifeDeleteAccount=openDeleteAccountWarning;

  function openDeleteAccountFinal(){
    openUiModal("최종 탈퇴 확인",`<div class="game-dialog delete-account-dialog"><div class="dialog-summary danger"><div><small>마지막 확인</small><b>정말 ${safe(currentUser)} 계정을 삭제할까요?</b><p>삭제한 기록은 복구할 수 없습니다.</p></div><span>🗑️</span></div><form id="deleteAccountForm" class="login-gate-form"><label><span>현재 비밀번호</span><input id="deleteAccountPassword" type="password" autocomplete="current-password" placeholder="비밀번호 입력"></label><div id="deleteAccountStatus" class="login-gate-status" role="status">비밀번호를 입력한 뒤 최종 탈퇴를 눌러주세요.</div><button class="login-gate-submit delete-final-button" type="submit"><span>🗑️</span><b>정말 탈퇴하기</b></button></form><div class="dialog-actions"><button class="primary" data-delete-account-cancel>취소</button></div></div>`);
    setTimeout(()=>$("#deleteAccountPassword")?.focus(),30);
  }

  async function submitDeleteAccount(){
    const password=$("#deleteAccountPassword")?.value||"",status=$("#deleteAccountStatus"),button=$("#deleteAccountForm button[type=submit]");
    if(!password){if(status){status.className="login-gate-status error";status.textContent="비밀번호를 입력해주세요.";}return;}
    if(button)button.disabled=true;
    if(status){status.className="login-gate-status loading";status.textContent="계정과 모든 기록을 삭제하고 있습니다.";}
    const result=await deleteAccount(password);
    if(!result?.ok){if(button)button.disabled=false;if(status){status.className="login-gate-status error";status.textContent=result?.message||"탈퇴하지 못했습니다.";}return;}
    closeModal(true);
    showGameNotice({icon:"🌊",eyebrow:"계정 삭제 완료",title:"탈퇴가 완료되었습니다",detail:"계정과 모든 게임 기록을 삭제했습니다.",kind:"info",duration:4500});
    setTimeout(()=>openLoginGate("탈퇴가 완료되었습니다. 새 계정을 만들거나 다른 계정으로 로그인해주세요."),500);
  }

  function emergencyRecoveryFeaturedHtml(summary){
    const featured=Array.isArray(summary?.featured)?summary.featured:[];
    if(!featured.length)return '<p class="emergency-recovery-empty">표시할 물고기가 없습니다.</p>';
    return `<div class="emergency-recovery-fish">${featured.map(fish=>`<span class="${gradeClass(fish.grade)}"><i>${fishIcon(fish)}</i><b>${safe(fish.name)}</b><small>${safe(fish.grade)}</small></span>`).join("")}</div>`;
  }

  function emergencyRecoveryGradeHtml(summary){
    const order=["공허","영원","초월","신화","전설"],rows=order.filter(grade=>Number(summary?.gradeSummary?.[grade]||0)>0);
    return rows.length?`<div class="emergency-recovery-grades">${rows.map(grade=>`<span class="${gradeClass(grade)}">${safe(grade)} ${Number(summary.gradeSummary[grade]).toLocaleString()}</span>`).join("")}</div>`:"";
  }

  function emergencyRecoveryStateCard(kind,label,summary,featured=true){
    return `<article class="emergency-recovery-card ${kind}"><header><small>${kind==="local"?"이 기기 기록":"클라우드 기록"}</small><b>${safe(label)}</b></header><div class="emergency-recovery-stats"><span><small>낚싯대</small><strong>Lv.${Number(summary.rodLevel||1).toLocaleString()}</strong></span><span><small>지갑</small><strong>${safe(formatMoney(summary.money||0))}</strong></span><span><small>물고기</small><strong>${Number(summary.fishCount||0).toLocaleString()}마리</strong></span><span><small>총 낚시</small><strong>${Number(summary.totalFishingCount||0).toLocaleString()}회</strong></span><span class="wide"><small>PVP 전투력 · 저장 파티 또는 상위 3마리</small><strong>${Number(summary.pvpPower||0)>0?safe(compactNumber(summary.pvpPower)):"기록 없음"}</strong></span></div>${emergencyRecoveryGradeHtml(summary)}${featured?`<div class="emergency-recovery-featured"><small>등급이 높은 물고기 최대 5마리</small>${emergencyRecoveryFeaturedHtml(summary)}</div>`:""}</article>`;
  }

  function openEmergencyAccountRecovery(){
    const snapshot=typeof prepareEmergencyRecoveryOffer==="function"?prepareEmergencyRecoveryOffer():null;
    if(!snapshot)return false;
    const currentState=lastCloudSyncedState||getGameState(),serverSummary=getEmergencySnapshotSummary(currentState),localSummary=getEmergencySnapshotSummary(snapshot.state),unassigned=!snapshot.username;
    const accountName=String(snapshot.username||currentUser||"현재");
    const warningTitle=unassigned?"주인을 확인할 수 없는 임시 기록입니다.":`${safe(accountName)} 계정에 저장되지 못한 기록이 이 기기에 있습니다.`;
    openUiModal(`${safe(accountName)} 기록 선택`,`<div class="game-dialog emergency-recovery"><section class="emergency-recovery-hero"><span>🛟</span><div><small>게임 기록 선택</small><h2>어느 기록으로 계속할까요?</h2><p>레벨, 돈, 물고기 수를 보고 하나를 골라주세요.</p></div></section><div class="emergency-recovery-warning"><b>${warningTitle}</b><p>선택하기 전에는 게임 저장을 잠시 멈춥니다.</p></div><div class="emergency-recovery-grid">${emergencyRecoveryStateCard("server","클라우드에 저장된 기록",serverSummary,false)}${emergencyRecoveryStateCard("local","이 기기에 남은 기록",localSummary,false)}</div><div id="emergencyRecoveryStatus" class="emergency-recovery-status" role="status" aria-live="polite">사용할 기록을 선택해주세요.</div><div class="emergency-recovery-actions"><button class="primary" data-emergency-restore="${safe(snapshot.id)}"><span>📱</span><b>이 기기 기록 사용</b><small>이 기기에 남은 기록으로 계속합니다</small></button><button data-emergency-keep="${safe(snapshot.id)}"><span>☁️</span><b>클라우드 기록 사용</b><small>한 번 더 누르면 확정</small></button></div></div>`);
    $("#modalOverlay")?.classList.add("emergency-recovery-mode");
    return true;
  }
  globalThis.offerFishingLifeEmergencyRecovery=()=>{
    if(typeof shouldOfferFishingLifeEmergencyRecovery!=="function"||!shouldOfferFishingLifeEmergencyRecovery())return false;
    return openEmergencyAccountRecovery();
  };
  function legacyTextHtml(value) {
    return sanitizeGameHtml(stripPvpUiTokens(value)).replace(/\n/g, "<br>");
  }
  function replayActionHtml(value){
    const source=String(value??""),html=legacyTextHtml(source);
    if(source.includes("battle-event"))return html;
    return html
      .replace(/치명타!/g,'<span class="battle-result-badge critical">💥 치명타</span>')
      .replace(/회피(?:했습니다\.|!|(?=<br>|$))/g,'<span class="battle-result-badge dodge">💨 회피</span>')
      .replace(/(^|<br>)([\d,]+) 피해(?=<br>|$)/g,'$1<span class="battle-impact-number damage">-$2 피해</span>')
      .replace(/(^|<br>)([\d,]+) 회복(?=<br>|$)/g,'$1<span class="battle-impact-number heal">+$2 회복</span>');
  }
  function replayImpactBadge(value){
    const text=String(value||"");
    if(text.includes("치명타"))return '<span class="battle-result-badge critical">💥 치명타</span>';
    if(/회피(?:!|했습니다|$)/.test(text))return '<span class="battle-result-badge dodge">💨 회피</span>';
    return "";
  }

  function hpPercent(current,max){
    return Math.max(0,Math.min(100,Number(current||0)/Math.max(1,Number(max||1))*100));
  }

  function replayFishEffectsHtml(effects=[]){
    return (Array.isArray(effects)?effects:[]).map(effect=>{
      const key=String(effect?.key||"effect").replace(/[^a-z0-9-]/gi,"");
      const stacks=Math.max(0,Number(effect?.stacks||0)),label=String(effect?.label||"상태 효과"),detail=String(effect?.detail||"");
      const text=stacks>0?`${label} ${stacks}중첩`:detail?`${label} ${detail}`:label;
      return `<span class="replay-effect replay-effect-${key}" title="${safe(text)}"><i>${safe(effect?.icon||"•")}</i><b>${safe(text)}</b></span>`;
    }).join("");
  }

  function updateReplayFishEffects(host,effects=[]){
    if(!host)return;
    const html=replayFishEffectsHtml(effects);
    if(host.dataset.effectsHtml===html)return;
    host.innerHTML=html;host.dataset.effectsHtml=html;host.hidden=!html;
  }

  function replayDelay(frame){
    const text=String(frame?.entry??frame??"");
    if(frame?.skillResult)return frame.skillSourceKind==="damage"?1900:2600;
    if(text.includes("battle-event--crazy-passive"))return 7200;
    if(text.includes("battle-event--crazy"))return 6600;
    if(text.includes("battle-event--phase"))return 6000;
    if(text.includes("battle-event--void"))return 5800;
    if(text.includes("battle-event--ally"))return 4800;
    if(text.includes("battle-event--skill"))return 4800;
    if(text.includes("battle-event--passive"))return 4200;
    if(/턴 \d+|내 턴|보스 턴/.test(plain(text)))return 1560;
    return 1140;
  }

  function replayEventKind(entry){
    const text=String(entry||"");
    if(text.includes("battle-event--crazy-passive"))return "phase";
    if(text.includes("battle-event--crazy"))return "crazy";
    if(text.includes("battle-event--phase"))return "phase";
    if(text.includes("battle-event--ally"))return "ally";
    if(text.includes("battle-event--passive"))return "passive";
    if(text.includes("battle-event--skill"))return "skill";
    return "normal";
  }

  const voidReplayVariants=[
    {key:"letter-one",className:"battle-event--void-letter-one",label:"공허의 기록 1"},
    {key:"letter-two",className:"battle-event--void-letter-two",label:"공허의 기록 1I"},
    {key:"letter-three",className:"battle-event--void-letter-three",label:"공허의 마지막 기록"},
    {key:"observer",className:"battle-event--void-observer",label:"공허의 관측"},
    {key:"anomaly",className:"battle-event--void-anomaly",label:"이상 현상"}
  ];

  function getVoidReplayVariant(entry){
    const text=String(entry||"");
    return voidReplayVariants.find(item=>text.includes(item.className))||null;
  }

  function clearVoidReplayClasses(element,prefix="event-void-"){
    if(!element)return;
    voidReplayVariants.forEach(item=>element.classList.remove(prefix+item.key));
  }
  const allyReplayVariants=[
    {key:"solar",className:"battle-event--ally-solar"},{key:"ascension",className:"battle-event--ally-ascension"},{key:"constellation",className:"battle-event--ally-constellation"},
    {key:"white-flame",className:"battle-event--ally-white-flame"},{key:"tide",className:"battle-event--ally-tide"},{key:"heartbeat",className:"battle-event--ally-heartbeat"}
  ];
  function getAllyReplayVariant(entry){const text=String(entry||"");return allyReplayVariants.find(item=>text.includes(item.className))||null;}
  function clearAllyReplayClasses(element){if(!element)return;allyReplayVariants.forEach(item=>element.classList.remove("event-ally-"+item.key));}

  function replayDetailText(entry){
    const div=document.createElement("div");
    div.innerHTML=sanitizeGameHtml(String(entry??"")).replace(/<br\s*\/?>/gi,"\n");
    return div.textContent
      .replace(/[\u2500-\u257F\u231C-\u231F]+/g," ")
      .split(/\n+/)
      .map(line=>line.replace(/\s+/g," ").trim())
      .filter(line=>line&&!/^HP\s/i.test(line)&&!/^\[[█▓▒░ ]+\]\s*\d+(?:\.\d+)?%?$/.test(line))
      .join("\n");
  }

  function replayFishKey(fish,index){
    return String(fish?.key??fish?.id??fish?.battleLabel??`${fish?.name||"fish"}-${index}`);
  }

  function buildSkillResultRows(beforeFrame,afterFrame){
    const rows=[];
    const beforeBossHp=Math.max(0,Number(beforeFrame?.bossHp||0)),afterBossHp=Math.max(0,Number(afterFrame?.bossHp||0));
    if(beforeBossHp!==afterBossHp)rows.push({kind:"boss",name:"보스",beforeHp:beforeBossHp,afterHp:afterBossHp,maxHp:Math.max(1,Number(afterFrame?.bossMaxHp||beforeFrame?.bossMaxHp||1)),delta:afterBossHp-beforeBossHp});
    const beforeFish=new Map((beforeFrame?.fish||[]).map((fish,index)=>[replayFishKey(fish,index),fish]));
    (afterFrame?.fish||[]).forEach((fish,index)=>{
      const previous=beforeFish.get(replayFishKey(fish,index))||(beforeFrame?.fish||[])[index];
      if(!previous)return;
      const beforeHp=Math.max(0,Number(previous.hp||0)),afterHp=Math.max(0,Number(fish.hp||0));
      if(beforeHp!==afterHp)rows.push({kind:"fish",fish,name:fish.battleLabel||fish.displayName||fish.name||`물고기 ${index+1}`,grade:fish.grade,beforeHp,afterHp,maxHp:Math.max(1,Number(fish.maxHp||previous.maxHp||1)),delta:afterHp-beforeHp});
    });
    return rows;
  }

  function prepareBossReplayFrames(rawFrames){
    const source=Array.isArray(rawFrames)?rawFrames:[],skillFrames=[];
    for(let i=0;i<source.length;i++){
      const frame=source[i],kind=replayEventKind(frame?.entry),voidVariant=getVoidReplayVariant(frame?.entry),isVoid=!!voidVariant||String(frame?.entry||"").includes("battle-event--void"),isAllySkill=kind==="ally",isAllyAttack=String(frame?.entry||"").includes("battle-event--ally-attack");
      if(!["skill","crazy"].includes(kind)&&!isVoid&&!isAllySkill){skillFrames.push(frame);continue;}
      const next=source[i+1],nextKind=replayEventKind(next?.entry);
      const nextText=plain(next?.entry||"");
      const resultRows=next?buildSkillResultRows(frame,next):[];
      const canMerge=next&&nextKind==="normal"&&!/^(전투 시작|턴 \d+|내 턴|보스 턴)/.test(nextText)&&(!isAllySkill||resultRows.length>0);
      if(!canMerge){skillFrames.push(frame);continue;}
      const skillDetail=isAllySkill?"":replayDetailText(next.entry);
      const impactKind=nextText.includes("치명타")?"critical":/회피(?:!|했습니다|$)/.test(nextText)?"dodge":"",merged=resultRows.length?{...frame,summons:next.summons||frame.summons,skillDetail,impactKind,allyAttack:isAllySkill||isAllyAttack}:{...next,entry:frame.entry,skillDetail,impactKind};
      skillFrames.push(merged);
      if(resultRows.length)skillFrames.push({...next,skillResult:true,skillResultRows:resultRows,skillSourceKind:isVoid?"void":isAllySkill||isAllyAttack?"ally":kind,skillSourceVariant:voidVariant?.key||""});
      i++;
    }
    const frames=[];let previous=null;
    skillFrames.forEach(frame=>{
      if(!previous){frames.push(frame);previous=frame;return;}
      const fishRows=frame.skillResult?[]:buildSkillResultRows(previous,frame).filter(item=>item.kind==="fish");
      if(fishRows.length&&replayEventKind(frame.entry)==="normal"){
        frames.push({...frame,fish:previous.fish||frame.fish,bossHp:previous.bossHp??frame.bossHp,damageIntro:true});
        frames.push({...frame,skillResult:true,skillResultRows:fishRows,skillSourceKind:"damage"});
      }else frames.push(frame);
      previous=frame;
    });
    return frames;
  }

  function replaySummonIcon(name){
    const value=String(name||"");
    if(value.includes("용"))return "🐲";
    if(value.includes("복제"))return "👤";
    if(value.includes("시간의 잔상"))return "⏳";
    if(value.includes("은빛 문"))return "🚪";
    return "🌀";
  }

  function renderReplaySummons(summons,entry=""){
    const host=state.replayDom?.summons||$("#replayBossSummons");
    if(!host)return;
    const list=Array.isArray(summons)?summons:[],counts={};
    list.forEach(s=>{counts[s.name]=(counts[s.name]||0)+1;});
    const entryText=String(entry||""),previousIds=state.replaySummonIds instanceof Set?state.replaySummonIds:new Set(),currentIds=new Set(list.map(s=>String(s.key||s.name))),newIds=new Set([...currentIds].filter(id=>!previousIds.has(id)));
    const targetKey=list.map(s=>counts[s.name]>1?`${s.name} ${Number(s.order||1)}`:s.name).find(label=>entryText.includes(label))||list.find(s=>entryText.includes(s.name))?.name||"";
    const renderKey=list.map(s=>`${s.key||s.name}:${Number(s.hp||0)}:${Number(s.maxHp||0)}:${Number(s.attack||0)}`).join("|")+`>${targetKey}`;
    if(renderKey===state.replaySummonKey)return;
    state.replaySummonKey=renderKey;
    host.classList.toggle("show",list.length>0);
    host.innerHTML=list.length?`<small class="replay-summon-title">보스 소환물 · ${list.length}</small><div>${list.map(s=>{
      const label=counts[s.name]>1?`${s.name} ${Number(s.order||1)}`:s.name;
      const targeted=entryText.includes(label)||entryText.includes(s.name);
      const spawned=newIds.has(String(s.key||s.name));
      return `<article class="replay-summon ${targeted?"targeted":""} ${spawned?"spawned":""}"><span>${replaySummonIcon(s.name)}</span><div><small>${spawned?"새로 등장":"보스 소환물"}</small><b>${safe(label)}</b><em>⚔ ${compactNumber(s.attack)}</em><div class="replay-hp summon-hp"><i style="width:${hpPercent(s.hp,s.maxHp)}%"></i></div><em>${combatHpNumber(s.hp)} / ${combatHpNumber(s.maxHp)}</em></div></article>`;
    }).join("")}</div>`:"";
    state.replaySummonIds=currentIds;
    if(newIds.size){host.classList.remove("summon-arrival");void host.offsetWidth;host.classList.add("summon-arrival");playGameSound("summon");}
  }

  function renderReplayBossStatuses(statuses){
    const host=state.replayDom?.statuses||$("#replayBossStatuses");if(!host)return;
    const list=Array.isArray(statuses)?statuses:[];host.hidden=!list.length;
    host.innerHTML=list.map(status=>{const hasGauge=Number.isFinite(Number(status.current))&&Number.isFinite(Number(status.max)),percent=hasGauge?hpPercent(status.current,status.max):0;return `<article class="replay-boss-status"><span>${safe(status.icon||"✦")}</span><div><small>${safe(status.label||"보스 상태")} · ${safe(status.state||"")}</small><b>${safe(status.text||(hasGauge?`${combatHpNumber(status.current)} / ${combatHpNumber(status.max)}`:"활성"))}</b>${hasGauge?`<i><em style="width:${percent}%"></em></i>`:""}</div></article>`;}).join("");
  }

  const bossSceneClasses=["boss-attack-scene","boss-scene-abyss","boss-scene-venom","boss-scene-flame","boss-scene-storm","boss-scene-shadow","boss-scene-void","boss-scene-crazy"];
  function clearBossAttackScene(arena){if(arena)arena.classList.remove(...bossSceneClasses);}
  function getBossAttackSceneTheme(bossId,text){
    const id=String(bossId||""),value=String(text||"");
    if(["erebos","chronos","nyarlathotep","yog_sothoth","azathoth"].includes(id)||/공허|차원|시간선|우주|종착점|말소/.test(value))return "void";
    if(["phoenix","surtr","cerberus"].includes(id)||/불꽃|화염|불길|용암|폭염|검의 비/.test(value))return "flame";
    if(["hydra","tiamat","azhi_dahaka"].includes(id)||/독|저주|오색|쇠약|부패/.test(value))return "venom";
    if(["bahamut","jormungandr","typhon"].includes(id)||/번개|폭풍|벼락|천둥|회오리|해일/.test(value))return "storm";
    if(["behemoth","fenrir","nidhogg","angra_mainyu"].includes(id)||/어둠|그림자|지진|포식|절망|종말/.test(value))return "shadow";
    return "abyss";
  }
  function triggerBossAttackScene(arena,bossId,text,kind){
    if(!arena)return;
    clearBossAttackScene(arena);
    void arena.offsetWidth;
    arena.classList.add("boss-attack-scene","boss-scene-"+getBossAttackSceneTheme(bossId,text));
    if(kind==="crazy")arena.classList.add("boss-scene-crazy");
  }

  function setReplayBossHp(value,maxHp){
    const dom=state.replayDom||{},bar=dom.bossBar||$("#replayBossHpBar"),text=dom.bossHp||$("#replayBossHpText"),hp=Math.max(0,Number(value||0)),max=Math.max(1,Number(maxHp||1));
    state.replayBossHpValue=hp;
    if(bar)bar.style.width=hpPercent(hp,max)+"%";
    if(text)text.textContent=combatHpNumber(hp)+" / "+combatHpNumber(max);
  }

  function updateReplayBossHp(frame,kind){
    const target=Math.max(0,Number(frame?.bossHp||0)),max=Math.max(1,Number(frame?.bossMaxHp||1)),from=Math.max(0,Number(state.replayBossHpValue||0));
    const animate=target>from&&target-from>Math.max(1,max*.001);
    const token=++state.bossHpAnimationToken;
    if(!animate){setReplayBossHp(target,max);return;}
    const duration=kind==="revival"?1250:["phase","crazy"].includes(kind)?1000:650,start=performance.now();
    const step=now=>{
      if(token!==state.bossHpAnimationToken)return;
      const progress=Math.max(0,Math.min(1,(now-start)/duration)),eased=1-Math.pow(1-progress,3);
      setReplayBossHp(Math.round(from+(target-from)*eased),max);
      if(progress<1)requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function updateReplayFrame(frame){
    const dom=state.replayDom||{},arena=dom.arena||$("#bossBattleArena"),action=dom.action||$("#battleActionCard");
    if(!arena||!action||!frame)return;
    clearBossFinisher(arena);
    const entryText=String(frame.entry||""),kind=replayEventKind(frame.entry),voidVariant=getVoidReplayVariant(frame.entry),allyVariant=getAllyReplayVariant(frame.entry),isVoid=entryText.includes("battle-event--void"),isCrazyPassive=entryText.includes("battle-event--crazy-passive"),isCrazyPassiveApex=entryText.includes("battle-event--crazy-passive-phoenix-apex"),isRevival=entryText.includes("battle-event--revival")||/부활|되살아/.test(plain(entryText)),isAllyAttack=!!frame.allyAttack||entryText.includes("battle-event--ally-attack"),isSkillResult=!!frame.skillResult,text=plain(`${frame.entry||""} ${frame.skillDetail||""}`);
    arena.classList.remove("hit-player","hit-boss","event-skill","event-crazy","event-passive","event-phase","event-ally","event-void","event-result","event-dodge","event-crazy-passive","event-crazy-passive-apex","event-revival");clearGradeAttackEffect(arena);clearBossAttackScene(arena);
    clearVoidReplayClasses(arena);clearAllyReplayClasses(arena);if(allyVariant)arena.classList.add("event-ally-"+allyVariant.key);
    const bossName=arena.dataset.bossName||"";
    const bossAttack=!isSkillResult&&kind!=="ally"&&(/보스 턴/.test(text)||(bossName&&text.includes(bossName+"의")));
    const playerAttack=!isSkillResult&&!bossAttack&&(/ 공격|피해/.test(text)||isAllyAttack);
    let attackerIndex=-1;
    if(playerAttack||kind==="ally"){
      const fishes=frame.fish||[];
      attackerIndex=fishes.findIndex(fish=>fish.battleLabel&&text.includes(fish.battleLabel));
      if(attackerIndex<0){
        const matches=fishes.map((fish,index)=>({index,label:String(fish.displayName||fish.name||"")})).filter(item=>item.label&&text.includes(item.label)).sort((a,b)=>b.label.length-a.label.length);
        attackerIndex=matches.length?matches[0].index:-1;
      }
    }
    const attacker=attackerIndex>=0?frame.fish[attackerIndex]:null;
    if(kind!=="normal")arena.classList.add("event-"+kind);
    if(isCrazyPassive)arena.classList.add("event-crazy-passive");
    if(isCrazyPassiveApex)arena.classList.add("event-crazy-passive-apex");
    if(isRevival)arena.classList.add("event-revival");
    if(isVoid){arena.classList.add("event-void");if(voidVariant)arena.classList.add("event-void-"+voidVariant.key);}
    else if(bossAttack)arena.classList.add("hit-player");
    else if(playerAttack)arena.classList.add("hit-boss");
    if(bossAttack||["crazy","phase","passive"].includes(kind)||isRevival)triggerBossAttackScene(arena,arena.dataset.bossId,text,kind==="crazy"||isCrazyPassive?"crazy":kind);
    const attackGrade=isProfileCosmeticUnlocked("attackEffect",profileCosmetics.attackEffect)?profileCosmetics.attackEffect:"";
    const attackConfig=cosmeticGrades[attackGrade];
    if(playerAttack&&attackConfig)triggerGradeAttackEffect(arena,attackGrade);

    if(kind==="crazy"||kind==="phase"||isVoid||isRevival)playGameSound("crazy");
    else if(kind==="ally")playGameSound("timing","GREAT");
    else if(kind==="skill")playGameSound("bossAttack");
    else if(bossAttack&&/공격|피해|치명타/.test(text))playGameSound("bossAttack");
    if(!isSkillResult&&text.includes("치명타")){playGameSound("crit");gameVibrate("crit");}
    if(isCrazyPassive)gameVibrate(isCrazyPassiveApex?"victory":"crit");
    if(!isSkillResult&&/회피(?:!|했습니다|$)/.test(text))arena.classList.add("event-dodge");

    const turnLabel=dom.turnLabel||$("#battleTurnLabel");
    if(turnLabel&&frame.turn)turnLabel.textContent="TURN "+frame.turn;
    updateReplayBossHp(frame,isRevival?"revival":kind);
    const dimensionActive=!!frame.dimension?.active,activeDimension=String(frame.dimension?.activeGroup||"");
    arena.classList.toggle("dimension-split",dimensionActive);arena.dataset.activeDimension=dimensionActive?activeDimension:"";
    const dimensionLabel=dom.dimension||$("#battleDimensionState");if(dimensionLabel){dimensionLabel.hidden=!dimensionActive;dimensionLabel.innerHTML=dimensionActive?`<span class="${activeDimension==="A"?"active":""}">A차원 ${activeDimension==="A"?"· 행동":"· 대기"}</span><i>차원 단절</i><span class="${activeDimension==="B"?"active":""}">B차원 ${activeDimension==="B"?"· 행동":"· 대기"}</span>`:"";}
    (frame.fish||[]).forEach((fish,index)=>{
      const card=dom.fishCards?.[index]||$(`[data-replay-fish-index="${index}"]`),bar=dom.fishBars?.[index]||$(`[data-replay-fish-bar="${index}"]`),hp=dom.fishHp?.[index]||$(`[data-replay-fish-hp="${index}"]`),effects=dom.fishEffects?.[index]||$(`[data-replay-fish-effects="${index}"]`);
      if(card)card.classList.toggle("down",Number(fish.hp)<=0);
      if(card)card.classList.toggle("attacking",index===attackerIndex);
      if(card){card.classList.toggle("dimension-a",dimensionActive&&fish.dimensionGroup==="A");card.classList.toggle("dimension-b",dimensionActive&&fish.dimensionGroup==="B");card.classList.toggle("dimension-inactive",dimensionActive&&fish.dimensionGroup!==activeDimension);}
      if(bar)bar.style.width=hpPercent(fish.hp,fish.maxHp)+"%";
      if(hp)hp.textContent=combatHpNumber(fish.hp)+" / "+combatHpNumber(fish.maxHp);
      updateReplayFishEffects(effects,fish.effects);
    });
    renderReplaySummons(frame.summons, text);
    renderReplayBossStatuses(frame.bossStatuses);

    if(isSkillResult){
      arena.classList.add("event-result");
      action.className=`battle-action-card is-result is-result-${frame.skillSourceKind||"skill"}${frame.skillSourceVariant?` is-result-void-${frame.skillSourceVariant}`:""}`;
      const rows=(frame.skillResultRows||[]).map(item=>{
        const lost=Math.max(0,-Number(item.delta||0)),healed=Math.max(0,Number(item.delta||0)),rate=Math.abs(Number(item.delta||0))/Math.max(1,Number(item.maxHp||1))*100;
        const symbol=item.kind==="boss"?safe(arena.dataset.bossSymbol||"🐲"):fishIcon(item.fish||item);
        return `<article class="battle-skill-result-row ${item.kind==="boss"?"boss":"fish"} ${item.grade?gradeClass(item.grade):""}"><span>${symbol}</span><div><b>${safe(item.kind==="boss"?bossName:item.name)}</b><small>${combatHpNumber(item.beforeHp)} → ${combatHpNumber(item.afterHp)} / ${combatHpNumber(item.maxHp)}</small><i><em style="width:${hpPercent(item.afterHp,item.maxHp)}%"></em></i></div><strong class="${healed?"heal":"damage"}">${healed?`+${combatHpNumber(healed)} 회복`:`-${combatHpNumber(lost)} · ${rate.toFixed(1)}%`}</strong></article>`;
      }).join("");
      const damageResult=frame.skillSourceKind==="damage",actionHtml=`<section class="battle-skill-result"><small>${damageResult?"피해 결과":"스킬 적용 결과"}</small><h3>${damageResult?"피해 적용 결과":"스킬 적용 결과"}</h3>${rows||`<p>${safe(replayDetailText(frame.entry))}</p>`}</section>`;
      if(actionHtml!==state.lastActionHtml){action.innerHTML=actionHtml;state.lastActionHtml=actionHtml;}
      return;
    }

    action.className="battle-action-card "+(kind!=="normal"?"is-"+kind:"")+(isVoid?" is-void":"")+(voidVariant?" is-void-"+voidVariant.key:"")+(isCrazyPassive?" is-crazy-passive":"")+(isCrazyPassiveApex?" is-crazy-passive-apex":"")+(isRevival?" is-revival":"");
    const bossEventLabel=isRevival?"보스 부활":isCrazyPassive?"크레이지 패시브":kind==="crazy"?"크레이지 궁극기":kind==="phase"?"페이즈 전환":kind==="passive"?"보스 패시브":"보스 스킬";
    const actorBanner=attacker?`<div class="battle-attacker-banner ${kind==="ally"?"ally":""} ${allyVariant?`ally-${allyVariant.key}`:""} ${isVoid?"void":""}"><span>${fishIcon(attacker)}</span><div><small>${isVoid?(voidVariant?.label||"공허 스킬"):isAllyAttack?"특성 추가 공격":kind==="ally"?"내 물고기 스킬":"내 공격"}</small><b>${safe(attacker.battleLabel||attacker.name)}</b></div></div>`:["skill","crazy","passive","phase"].includes(kind)?`<div class="battle-attacker-banner boss"><span>${safe(arena.dataset.bossSymbol||"🐲")}</span><div><small>${bossEventLabel}</small><b>${safe(bossName)}</b></div></div>`:bossAttack?`<div class="battle-attacker-banner boss"><span>${safe(arena.dataset.bossSymbol||"🐲")}</span><div><small>보스 공격</small><b>${safe(bossName)}</b></div></div>`:"";
    const detail=frame.skillDetail?`<div class="battle-skill-detail"><small>스킬 효과</small>${replayImpactBadge(frame.skillDetail)}<p>${safe(frame.skillDetail).replace(/\n/g,"<br>")}</p></div>`:"";
    const actionHtml=actorBanner+`<div class="battle-action-text">${replayActionHtml(frame.entry)}${detail}</div>`;
    if(actionHtml!==state.lastActionHtml){action.innerHTML=actionHtml;state.lastActionHtml=actionHtml;}
  }

  function getBossFinisherFish(replay){
    const frames=Array.isArray(replay?.frames)?replay.frames:[];
    for(let frameIndex=frames.length-1;frameIndex>=Math.max(0,frames.length-12);frameIndex--){
      const frame=frames[frameIndex],text=plain(frame?.entry||""),fishes=Array.isArray(frame?.fish)?frame.fish:[];
      const matches=fishes.map((fish,index)=>({fish,index,label:String(fish.battleLabel||fish.displayName||fish.name||"")})).filter(item=>item.label&&text.includes(item.label)).sort((a,b)=>b.label.length-a.label.length);
      if(matches.length)return matches[0].fish;
      const nameMatches=fishes.map((fish,index)=>({fish,index,label:String(fish.displayName||fish.name||"")})).filter(item=>item.label&&text.includes(item.label)).sort((a,b)=>b.label.length-a.label.length);
      if(nameMatches.length)return nameMatches[0].fish;
    }
    const finalFish=frames.at(-1)?.fish||[];
    return finalFish.find(fish=>Number(fish.hp)>0)||finalFish[0]||null;
  }

  async function playBossFinisher(replay){
    if(replay?.result!=="처치 성공")return;
    const arena=state.replayDom?.arena||$("#bossBattleArena"),action=state.replayDom?.action||$("#battleActionCard");
    if(!arena||!action)return;
    const attacker=getBossFinisherFish(replay),attackGrade=isProfileCosmeticUnlocked("attackEffect",profileCosmetics.attackEffect)?profileCosmetics.attackEffect:"",attackConfig=cosmeticGrades[attackGrade],difficulty=String(replay.boss?.difficulty||"").toLowerCase();
    arena.classList.remove("event-skill","event-crazy","event-passive","event-phase","event-ally","event-void","event-result","event-dodge","event-crazy-passive","event-crazy-passive-apex","hit-player","hit-boss");
    clearVoidReplayClasses(arena);clearAllyReplayClasses(arena);clearBossAttackScene(arena);clearBossFinisher(arena);clearGradeAttackEffect(arena);
    if(difficulty==="hard"||difficulty==="crazy")arena.classList.add("boss-finisher-"+difficulty);
    if(attackConfig)arena.classList.add("boss-finisher-"+attackConfig.slug);
    action.className=`battle-action-card is-finisher-prelude${attackConfig?` is-finisher-${attackConfig.slug}`:""}`;
    action.innerHTML=`<section class="battle-finisher-prelude"><small>FINAL ATTACK READY</small><strong>${safe(attackConfig?attackConfig.name+" 전용 공격 효과":"마지막 공격")} 준비</strong><p>전장이 바뀌고 결정타가 시작됩니다.</p></section>`;
    arena.classList.add("boss-finisher-prelude");
    playGameSound(difficulty==="crazy"?"crazy":"bossAttack");
    await sleep(state.battleReplaySkip?40:520);
    arena.classList.remove("boss-finisher-prelude");arena.classList.add("boss-finisher");
    if(attackConfig)triggerGradeAttackEffect(arena,attackGrade);
    arena.querySelector(".replay-boss")?.classList.add("defeated");
    setReplayBossHp(0,replay.boss?.maxHp||1);
    const attackerName=attacker?.battleLabel||attacker?.displayName||attacker?.name||"내 파티";
    action.className=`battle-action-card is-finisher${attackConfig?` is-finisher-${attackConfig.slug}`:""}`;
    action.innerHTML=`<section class="battle-finisher-card"><small>${difficulty==="crazy"?"CRAZY BOSS FINISH":"BOSS FINISH"}</small><div><span>${attacker?fishIcon(attacker):"⚔️"}</span><i></i><strong>${safe(arena.dataset.bossSymbol||"🐲")}</strong></div><h3>마지막 일격</h3><p><b>${safe(attackerName)}</b>의 결정타가 ${safe(replay.boss?.name||arena.dataset.bossName||"보스")}를 쓰러뜨렸습니다.</p>${attackConfig?`<em>${safe(attackConfig.name)} 전용 공격 효과</em>`:""}</section>`;
    state.lastActionHtml=action.innerHTML;
    playGameSound("crit");gameVibrate(difficulty==="crazy"?"victory":"crit");
    const gradeIndex=Math.max(0,Object.keys(cosmeticGrades).indexOf(attackGrade)),duration=state.battleReplaySkip?80:1450+gradeIndex*90+(difficulty==="crazy"?250:0);
    await sleep(duration);
  }

  function finishBossBattleReplay(replay){
    const success=replay.result==="처치 성공",action=$("#battleActionCard"),arena=$("#bossBattleArena");
    const healthRows=(replay.healthReport||[]).map(item=>{const recoveryLeft=Number(item.recoveryUntil||0)>0?Math.max(0,Number(item.recoveryUntil)-Date.now()):Number(item.recoveryMs||0),knockedOut=item.status==="기절"||Number(item.endHp||0)<=0;return `<div class="battle-health-row ${gradeClass(item.grade)} ${knockedOut?"knocked-out":""}"><span>${fishIcon(item)}</span><div><b>${safe(item.name)}</b><small>${combatHpNumber(item.startHp)} → ${combatHpNumber(item.endHp)} / ${combatHpNumber(item.maxHp)}</small><i><em style="width:${Math.max(0,Math.min(100,Number(item.remainingRate||0)))}%"></em></i></div><strong>-${Number(item.lostRate||0).toFixed(1)}%</strong><small>${recoveryLeft>0?`${knockedOut?"기절":"회복"} ${safe(formatRemain(recoveryLeft))}`:"정상"}</small></div>`;}).join("");
    const healthSummary=healthRows?`<section class="battle-health-summary"><small>파티 피해 현황</small>${healthRows}</section>`:"";
    if(arena){arena.classList.remove("event-skill","event-crazy","event-passive","event-phase","event-ally","event-void","event-result","event-dodge","event-crazy-passive","event-crazy-passive-apex","hit-player","hit-boss");clearVoidReplayClasses(arena);clearAllyReplayClasses(arena);clearGradeAttackEffect(arena);clearBossAttackScene(arena);clearBossFinisher(arena);arena.classList.add(success?"battle-win":"battle-lose");}
    if(action){action.className="battle-action-card";action.innerHTML=`<div class="battle-finish-card ${success?"win":"lose"}"><small>${success?"보스 처치 성공":"보스 처치 실패"}</small><strong>${success?"처치 성공":"처치 실패"}</strong><p>총 피해 ${Number(replay.totalDamage||0).toLocaleString()}</p>${success?`<p>${safe(replay.rewardDrop)} × ${Number(replay.rewardDropCount||0).toLocaleString()}${replay.rewardMoney>0?` · ${safe(formatMoney(replay.rewardMoney))}`:""}</p>`:""}${healthSummary}<div class="battle-finish-actions"><button data-battle-replay>다시 보기</button><button data-battle-close>닫기</button></div></div>`;}
    const title=$("#modalTitle");if(title)title.textContent=success?"보스 레이드 승리":"보스 레이드 패배";
    const turnLabel=$("#battleTurnLabel");if(turnLabel)turnLabel.textContent="전투 종료";
    if(success){playGameSound("victory");gameVibrate("victory");}
  }

  function findBossFinisherFrameIndex(frames,replay){
    if(replay?.result!=="처치 성공")return -1;
    for(let index=frames.length-1;index>0;index--){
      const before=Math.max(0,Number(frames[index-1]?.bossHp||0)),after=Math.max(0,Number(frames[index]?.bossHp||0));
      if(before>0&&after<=0)return index;
    }
    for(let index=frames.length-1;index>=0;index--){
      const frame=frames[index],text=plain(frame?.entry||"");
      if(Number(frame?.bossHp)<=0&&(/공격|피해|치명타|폭발|일격/.test(text)||frame?.skillResult))return index;
    }
    return -1;
  }

  async function playBossBattleReplay(replay){
    const token=++state.battleReplayToken;
    state.battleReplaySkip=false;state.battleReplayRunning=true;
    const frames=prepareBossReplayFrames(replay.frames);
    const finisherFrameIndex=findBossFinisherFrameIndex(frames,replay);let finisherPlayed=false;
    for(let i=0;i<frames.length;i++){
      if(token!==state.battleReplayToken||$("#modalOverlay")?.style.display==="none")return;
      if(i===finisherFrameIndex){await playBossFinisher(replay);finisherPlayed=true;break;}
      if(state.battleReplaySkip){if(replay?.result==="처치 성공"){await playBossFinisher(replay);finisherPlayed=true;}else updateReplayFrame(frames[frames.length-1]);break;}
      updateReplayFrame(frames[i]);
      await sleep(Math.max(45,replayDelay(frames[i])/Math.max(1,state.battleReplaySpeed)));
    }
    if(token===state.battleReplayToken&&replay?.result==="처치 성공"&&!finisherPlayed){await playBossFinisher(replay);}
    if(token===state.battleReplayToken){state.battleReplayRunning=false;finishBossBattleReplay(replay);}
  }

  function openBossBattleReplay(replay){
    state.lastBattleReplay=replay;
    state.battleReplaySpeed=1;
    const first=replay.frames?.[0]||{bossHp:replay.boss.maxHp,bossMaxHp:replay.boss.maxHp,fish:[]};
    const party=(first.fish||[]).map((fish,index)=>`<article class="replay-fish ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}" data-replay-fish-index="${index}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)} ${fishEvolutionBadge(fish)}</b><div class="replay-hp"><i data-replay-fish-bar="${index}" style="width:${hpPercent(fish.hp,fish.maxHp)}%"></i></div><small data-replay-fish-hp="${index}">${combatHpNumber(fish.hp)} / ${combatHpNumber(fish.maxHp)}</small></div><div class="replay-fish-effects" data-replay-fish-effects="${index}" ${fish.effects?.length?"":"hidden"}>${replayFishEffectsHtml(fish.effects)}</div></article>`).join("");
    const borderId=isProfileCosmeticUnlocked("border",profileCosmetics.border)?profileCosmetics.border:"",auraId=isProfileCosmeticUnlocked("aura",profileCosmetics.aura)?profileCosmetics.aura:"";
    const borderBoss=bossList.find(boss=>boss.id===borderId),auraBoss=bossList.find(boss=>boss.id===auraId),captainName=currentUser||"게스트 선장",captainTitle=currentUser?getCurrentTitle():"";
    const captainAvatar=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓",captainClasses=`profile-preview battle-player-avatar ${borderBoss?"has-profile-border":""} ${auraBoss?"has-profile-aura":""} ${getProfileAuraClass(auraBoss?.id)}`;
    const captainStyle=`--profile-border-color:${borderBoss?.color||"#4ee4ce"};--profile-aura-color:${auraBoss?.color||"#4ee4ce"}`;
    openUiModal(`${replay.boss.name} · ${replay.boss.difficulty}`,`<div class="boss-battle-replay"><header class="battle-replay-head"><div><small>보스전 재생</small><b id="battleTurnLabel">전투 시작</b></div><div class="battle-speed"><button class="active" data-battle-speed="1">×1</button><button data-battle-speed="2">×2</button><button data-battle-speed="4">×4</button><button data-battle-skip>건너뛰기</button></div></header><section id="bossBattleArena" class="boss-battle-arena" data-boss-id="${safe(replay.boss.id||"")}" data-boss-name="${safe(replay.boss.name)}" data-boss-symbol="${safe(bossSymbols[replay.boss.id]||"🐲")}" data-boss-difficulty="${safe(replay.boss.difficulty||"")}" style="--boss-scene-color:${safe(replay.boss.color||"#ff647e")}"><div class="boss-attack-backdrop" aria-hidden="true"><i></i><i></i></div><div class="grade-attack-layer" aria-hidden="true"><i></i><i></i><i></i></div><div class="boss-finisher-layer" aria-hidden="true"><i></i><i></i><strong>FINAL</strong></div><div id="battleDimensionState" class="battle-dimension-state" hidden></div><div class="replay-boss-zone"><div class="replay-boss ${gradeClass(replay.boss.grade)}"><div class="replay-boss-symbol">${bossSymbols[replay.boss.id]||"🐲"}</div><div><small>${safe(replay.boss.grade)} · ${safe(replay.boss.difficulty)}</small><h2>${safe(replay.boss.name)}</h2><div class="replay-hp boss-hp"><i id="replayBossHpBar" style="width:${hpPercent(first.bossHp,first.bossMaxHp)}%"></i></div><b id="replayBossHpText">${combatHpNumber(first.bossHp)} / ${combatHpNumber(first.bossMaxHp)}</b></div></div><div id="replayBossStatuses" class="replay-boss-statuses" hidden></div><div id="replayBossSummons" class="replay-boss-summons"></div></div><div class="battle-versus">VS</div><div class="replay-player-zone"><div class="battle-player-card"><div class="${captainClasses}" style="${captainStyle}" data-aura-symbol="${safe(auraBoss?bossSymbols[auraBoss.id]||"✦":"")}"><span>${captainAvatar}</span></div><div><small>내 파티 · 물고기 ${(first.fish||[]).length}</small><b>${safe(captainName)}</b><em>${safe(captainTitle?`[${captainTitle}]`:"칭호 없음")}</em></div></div><div class="replay-party">${party}</div></div><div id="battleActionCard" class="battle-action-card">전투가 시작됩니다.</div></section></div>`);
    $("#modalOverlay")?.classList.add("battle-replay-mode");
    state.replaySummonKey="";state.replaySummonIds=new Set();state.lastActionHtml="";state.replayBossHpValue=Number(first.bossHp||0);state.bossHpAnimationToken++;
    state.replayDom={arena:$("#bossBattleArena"),action:$("#battleActionCard"),turnLabel:$("#battleTurnLabel"),bossBar:$("#replayBossHpBar"),bossHp:$("#replayBossHpText"),statuses:$("#replayBossStatuses"),dimension:$("#battleDimensionState"),summons:$("#replayBossSummons"),fishCards:$$('[data-replay-fish-index]'),fishBars:$$('[data-replay-fish-bar]'),fishHp:$$('[data-replay-fish-hp]'),fishEffects:$$('[data-replay-fish-effects]')};
    playBossBattleReplay(replay);
  }

  function pvpProfileVisual(profile){
    const cosmetics=normalizeProfileCosmetics(profile),borderBoss=bossList.find(boss=>boss.id===cosmetics.border),auraBoss=bossList.find(boss=>boss.id===cosmetics.aura);
    return {classes:`profile-preview pvp-player-avatar ${borderBoss?"has-profile-border":""} ${auraBoss?"has-profile-aura":""} ${getProfileAuraClass(auraBoss?.id)}`,style:`--profile-border-color:${borderBoss?.color||"#4ee4ce"};--profile-aura-color:${auraBoss?.color||"#4ee4ce"}`,aura:auraBoss?bossSymbols[auraBoss.id]||"✦":"",avatar:borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓",attackEffect:cosmetics.attackEffect};
  }
  function pvpReplayTeamHtml(team,side){
    return (team||[]).map((fish,index)=>`<article class="pvp-replay-fish ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}" data-pvp-replay-fish="${side}-${index}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)} ${fishEvolutionBadge(fish)}</b><small>⚔ ${combatHpNumber(fish.attack)} · 💥 ${Number(fish.critRate||0).toFixed(1)}%</small><div class="replay-hp"><i data-pvp-replay-bar="${side}-${index}" style="width:${hpPercent(fish.hp,fish.maxHp)}%"></i></div><small data-pvp-replay-hp="${side}-${index}">${combatHpNumber(fish.hp)} / ${combatHpNumber(fish.maxHp)}</small></div></article>`).join("");
  }
  function pvpIntroTeamHtml(team,name,label){
    const list=team||[],totalAttack=list.reduce((sum,fish)=>sum+Number(fish.attack||0),0),totalHp=list.reduce((sum,fish)=>sum+Number(fish.maxHp||0),0),averageCrit=list.length?list.reduce((sum,fish)=>sum+Number(fish.critRate||0),0)/list.length:0,averageDodge=list.length?list.reduce((sum,fish)=>sum+Number(fish.dodge||0),0)/list.length:0;
    return `<article class="pvp-intro-side ${label==="내 파티"?"ally":"enemy"}"><small>${label}</small><h3>${safe(name||"상대")}</h3><div class="pvp-intro-total"><span>총 공격력 <b>${compactNumber(totalAttack)}</b></span><span>총 체력 <b>${compactNumber(totalHp)}</b></span><span>평균 치명타 <b>${averageCrit.toFixed(1)}%</b></span><span>평균 회피 <b>${averageDodge.toFixed(1)}%</b></span></div><div class="pvp-intro-fishes">${list.map(fish=>`<div class="${gradeClass(fish.grade)}"><span>${fishIcon(fish)}</span><p><b>${safe(fish.name)}</b><small>⚔ ${compactNumber(fish.attack)} · ❤️ ${compactNumber(fish.maxHp)}<br>💨 ${Number(fish.dodge||0).toFixed(1)}% · 💥 ${Number(fish.critRate||0).toFixed(1)}% / ${Number(fish.critDamage||0).toFixed(0)}%</small></p></div>`).join("")}</div></article>`;
  }
  function pvpEntryForViewer(entry,mineSide,legacySwap=false){
    const source=String(entry||"");
    const hasInternalSide=/\[\[\s*PVP[\s_-]*SIDE\s*:\s*(?:left|right)\s*\]\]|\bPVP[\s_-]*SIDE\s*:?\s*(?:left|right)\b/i.test(source);
    if(hasInternalSide)return source.replace(/\[\[\s*PVP[\s_-]*SIDE\s*:\s*(left|right)\s*\]\]|\bPVP[\s_-]*SIDE\s*:?\s*(left|right)\b/gi,(_,wrappedSide,plainSide)=>String(wrappedSide||plainSide).toLowerCase()===mineSide?"(아군)":"(적)").replace(/\[?\[?\s*PVP[\s_-]*SIDE\s*:?\s*(?:left|right)\s*\]?\]?/gi,"");
    if(!legacySwap)return source;
    return source.replaceAll("(아군)","__PVP_ALLY__").replaceAll("(적)","(아군)").replaceAll("__PVP_ALLY__","(적)");
  }

  function splitPvpSkillPresentation(entry){
    const host=document.createElement("div");
    host.innerHTML=sanitizeGameHtml(String(entry||"")).replace(/<br\s*\/?>/gi,"\n");
    const events=[...host.querySelectorAll(".battle-event")];
    if(!events.length)return null;
    const introHtml=events.map(event=>event.outerHTML).join("<br>");
    events.forEach(event=>event.remove());
    const detail=host.textContent.split(/\n+/).map(line=>line.replace(/\s+/g," ").trim()).filter(Boolean).join("\n");
    return {introHtml,detail};
  }

  function buildPvpSkillResultRows(beforeFrame,afterFrame){
    const rows=[];
    ["left","right"].forEach(side=>{
      const beforeTeam=beforeFrame?.[side]||[],afterTeam=afterFrame?.[side]||[];
      const beforeById=new Map(beforeTeam.map((fish,index)=>[String(fish?.id??`${side}-${index}`),fish]));
      afterTeam.forEach((fish,index)=>{
        const previous=beforeById.get(String(fish?.id??`${side}-${index}`))||beforeTeam[index];
        if(!previous)return;
        const beforeHp=Math.max(0,Number(previous.hp||0)),afterHp=Math.max(0,Number(fish.hp||0));
        if(beforeHp!==afterHp)rows.push({side,fish,name:fish.name||`물고기 ${index+1}`,grade:fish.grade,beforeHp,afterHp,maxHp:Math.max(1,Number(fish.maxHp||previous.maxHp||1)),delta:afterHp-beforeHp});
      });
    });
    return rows;
  }

  function preparePvpReplayFrames(rawFrames){
    const source=Array.isArray(rawFrames)?rawFrames:[],frames=[];
    let previous=null;
    source.forEach(frame=>{
      const presentation=splitPvpSkillPresentation(frame?.entry);
      if(!presentation){
        const damageRows=previous?buildPvpSkillResultRows(previous,frame):[];
        if(damageRows.length){frames.push({...frame,left:previous.left||frame.left,right:previous.right||frame.right,damageIntro:true});frames.push({...frame,skillResult:true,skillResultRows:damageRows,skillSourceKind:"damage"});}
        else frames.push(frame);
        previous=frame;return;
      }
      const before=previous||frame,resultRows=buildPvpSkillResultRows(before,frame),voidVariant=getVoidReplayVariant(frame.entry);
      const intro={...frame,left:before.left||frame.left,right:before.right||frame.right,entry:presentation.introHtml,skillPhase:"intro",skillDetail:resultRows.length?"":presentation.detail,impactKind:String(frame.entry||"").includes("치명타")?"critical":/회피(?:!|했습니다|$)/.test(String(frame.entry||""))?"dodge":""};
      frames.push(intro);
      if(resultRows.length)frames.push({...frame,entry:presentation.detail||frame.entry,skillResult:true,skillResultRows:resultRows,skillSourceKind:String(frame.entry||"").includes("battle-event--void")?"void":"ally",skillSourceVariant:voidVariant?.key||""});
      previous=frame;
    });
    return frames;
  }

  function updatePvpReplayFrame(frame){
    const dom=state.pvpReplayDom;if(!dom||!frame)return;
    clearBossFinisher(dom.arena);
    const mine=frame[dom.mineSide]||[],enemy=frame[dom.enemySide]||[],displayEntry=pvpEntryForViewer(frame.entry,dom.mineSide,dom.legacySwap),voidVariant=getVoidReplayVariant(frame.entry),allyVariant=getAllyReplayVariant(frame.entry),isVoid=String(frame.entry||"").includes("battle-event--void"),isSkillResult=!!frame.skillResult,text=plain(`${displayEntry} ${frame.skillDetail||""}`),actorIsMine=frame.actorSide===dom.mineSide;
    dom.arena.classList.remove("hit-ally","hit-enemy","event-skill","event-void","event-crit","event-dodge","event-result");clearVoidReplayClasses(dom.arena);clearAllyReplayClasses(dom.arena);if(allyVariant)dom.arena.classList.add("event-ally-"+allyVariant.key);clearGradeAttackEffect(dom.arena);
    if(isSkillResult)dom.arena.classList.add("event-result");
    else if(/특성|발동|부활|되감|봉인|관측|회복|각성|폭발|유언|문장|페이지|오류/.test(text))dom.arena.classList.add("event-skill");
    else if(frame.actorSide)dom.arena.classList.add(actorIsMine?"hit-enemy":"hit-ally");
    if(isVoid){dom.arena.classList.add("event-void");if(voidVariant)dom.arena.classList.add("event-void-"+voidVariant.key);playGameSound("crazy");}
    if(!isSkillResult&&text.includes("치명타")){dom.arena.classList.add("event-crit");playGameSound("crit");gameVibrate("crit");}
    if(!isSkillResult&&/회피(?:!|했습니다|$)/.test(text))dom.arena.classList.add("event-dodge");
    const updateTeam=(team,side,cards,bars,hps)=>team.forEach((fish,index)=>{const card=cards[index],bar=bars[index],hp=hps[index],attacking=frame.actorSide===side&&String(frame.actorId||"")===String(fish.id||"");if(card){card.classList.toggle("down",Number(fish.hp)<=0);card.classList.toggle("attacking",attacking);}if(bar)bar.style.width=hpPercent(fish.hp,fish.maxHp)+"%";if(hp)hp.textContent=combatHpNumber(fish.hp)+" / "+combatHpNumber(fish.maxHp);});
    updateTeam(mine,dom.mineSide,dom.mineCards,dom.mineBars,dom.mineHp);updateTeam(enemy,dom.enemySide,dom.enemyCards,dom.enemyBars,dom.enemyHp);
    if(frame.turn)dom.turnLabel.textContent="TURN "+frame.turn;
    const actorTeam=frame.actorSide===dom.mineSide?mine:frame.actorSide===dom.enemySide?enemy:[],actor=actorTeam.find(f=>String(f.id||"")===String(frame.actorId||""));
    const pvpAttackGrade=actorIsMine?(isProfileCosmeticUnlocked("attackEffect",profileCosmetics.attackEffect)?profileCosmetics.attackEffect:""):dom.enemyAttackEffect;
    if(!isSkillResult&&actor&&frame.actorSide&&/공격|치명타|피해/.test(text)&&cosmeticGrades[pvpAttackGrade])triggerGradeAttackEffect(dom.arena,pvpAttackGrade);
    if(isSkillResult){
      dom.action.className=`battle-action-card is-result is-result-${frame.skillSourceKind||"ally"}${frame.skillSourceVariant?` is-result-void-${frame.skillSourceVariant}`:""}`;
      const rows=(frame.skillResultRows||[]).map(item=>{const lost=Math.max(0,-Number(item.delta||0)),healed=Math.max(0,Number(item.delta||0)),rate=Math.abs(Number(item.delta||0))/Math.max(1,Number(item.maxHp||1))*100,sideLabel=item.side===dom.mineSide?"아군":"적";return `<article class="battle-skill-result-row ${gradeClass(item.grade)}"><span>${fishIcon(item.fish||item)}</span><div><b>(${sideLabel}) ${safe(item.name)}</b><small>${combatHpNumber(item.beforeHp)} → ${combatHpNumber(item.afterHp)} / ${combatHpNumber(item.maxHp)}</small><i><em style="width:${hpPercent(item.afterHp,item.maxHp)}%"></em></i></div><strong class="${healed?"heal":"damage"}">${healed?`+${combatHpNumber(healed)} 회복`:`-${combatHpNumber(lost)} · ${rate.toFixed(1)}%`}</strong></article>`;}).join("");
      const detail=replayDetailText(displayEntry),damageResult=frame.skillSourceKind==="damage",actionHtml=`<section class="battle-skill-result"><small>${damageResult?"피해 결과":"행동 적용 결과"}</small><h3>${damageResult?"피해 적용 결과":"스킬 적용 결과"}</h3>${rows||`<p>${safe(detail||"체력 변화 없이 효과가 적용되었습니다.")}</p>`}</section>`;
      if(actionHtml!==state.lastActionHtml){dom.action.innerHTML=actionHtml;state.lastActionHtml=actionHtml;}return;
    }
    dom.action.className=`battle-action-card${isVoid?" is-void":""}${voidVariant?` is-void-${voidVariant.key}`:""}`;
    const actorHtml=actor?`<div class="battle-attacker-banner ${actorIsMine?"ally":"boss"} ${isVoid?"void":""}"><span>${fishIcon(actor)}</span><div><small>${isVoid?(voidVariant?.label||"공허 스킬"):actorIsMine?"내 공격":"상대 공격"}</small><b>${safe(actor.name)}</b></div></div>`:"";
    const detail=frame.skillDetail?`<div class="battle-skill-detail"><small>스킬 효과</small>${replayImpactBadge(frame.skillDetail)}<p>${safe(frame.skillDetail).replace(/\n/g,"<br>")}</p></div>`:frame.impactKind?`<div class="battle-skill-detail impact-only">${frame.impactKind==="critical"?'<span class="battle-result-badge critical">💥 치명타</span>':'<span class="battle-result-badge dodge">💨 회피</span>'}</div>`:"";
    const actionHtml=actorHtml+`<div class="battle-action-text">${replayActionHtml(displayEntry)}${detail}</div>`;
    if(actionHtml!==state.lastActionHtml){dom.action.innerHTML=actionHtml;state.lastActionHtml=actionHtml;}
  }
  function getPvpFinisherFish(replay,winnerSide){
    const frames=Array.isArray(replay?.frames)?replay.frames:[];
    for(let index=frames.length-1;index>=0;index--){
      const frame=frames[index];if(frame?.actorSide!==winnerSide)continue;
      const team=frame[winnerSide]||[],actor=team.find(fish=>String(fish.id||"")===String(frame.actorId||""));
      if(actor)return actor;
    }
    const finalTeam=frames.at(-1)?.[winnerSide]||[];
    return finalTeam.find(fish=>Number(fish.hp)>0)||finalTeam[0]||null;
  }

  async function playPvpFinisher(replay){
    const dom=state.pvpReplayDom;if(!dom||!replay?.winnerName)return;
    const winnerSide=replay.left?.name===replay.winnerName?"left":replay.right?.name===replay.winnerName?"right":"";if(!winnerSide)return;
    const winnerIsMine=winnerSide===dom.mineSide,attackGrade=winnerIsMine?dom.mineAttackEffect:dom.enemyAttackEffect,attackConfig=cosmeticGrades[attackGrade],attacker=getPvpFinisherFish(replay,winnerSide),loserSide=winnerSide==="left"?"right":"left";
    dom.arena.classList.remove("hit-ally","hit-enemy","event-skill","event-void","event-crit","event-dodge","event-result");clearVoidReplayClasses(dom.arena);clearAllyReplayClasses(dom.arena);clearBossFinisher(dom.arena);clearGradeAttackEffect(dom.arena);
    if(attackConfig)dom.arena.classList.add("boss-finisher-"+attackConfig.slug);
    dom.arena.querySelector(`[data-pvp-side="${winnerSide}"]`)?.classList.add("finisher-winner");dom.arena.querySelector(`[data-pvp-side="${loserSide}"]`)?.classList.add("finisher-loser");
    dom.action.className=`battle-action-card is-finisher-prelude${attackConfig?` is-finisher-${attackConfig.slug}`:""}`;
    dom.action.innerHTML=`<section class="battle-finisher-prelude"><small>PVP FINAL ATTACK READY</small><strong>${safe(attackConfig?attackConfig.name+" 전용 공격 효과":"마지막 공격")} 준비</strong><p>전장이 바뀌고 승부를 끝낼 공격이 시작됩니다.</p></section>`;
    dom.arena.classList.add("boss-finisher-prelude");playGameSound("bossAttack");
    await sleep(state.pvpReplaySkip?40:520);
    dom.arena.classList.remove("boss-finisher-prelude");dom.arena.classList.add("boss-finisher","pvp-finisher");
    if(attackConfig)triggerGradeAttackEffect(dom.arena,attackGrade);
    const opponentName=winnerSide==="left"?replay.right?.name:replay.left?.name;
    dom.action.className=`battle-action-card is-finisher${attackConfig?` is-finisher-${attackConfig.slug}`:""}`;
    dom.action.innerHTML=`<section class="battle-finisher-card"><small>PVP FINISH</small><div><span>${attacker?fishIcon(attacker):"⚔️"}</span><i></i><strong>🏆</strong></div><h3>마지막 일격</h3><p><b>${safe(attacker?.name||replay.winnerName)}</b>의 결정타가 ${safe(opponentName||"상대")}와의 승부를 끝냈습니다.</p>${attackConfig?`<em>${safe(attackConfig.name)} 전용 공격 효과</em>`:""}</section>`;
    playGameSound("crit");gameVibrate(winnerIsMine?"victory":"crit");
    const gradeIndex=Math.max(0,Object.keys(cosmeticGrades).indexOf(attackGrade));await sleep(state.pvpReplaySkip?80:1450+gradeIndex*90);
  }

  function finishPvpBattleReplay(replay){
    const dom=state.pvpReplayDom;if(!dom)return;
    const won=replay.winnerName&&replay.winnerName===currentUser,draw=!replay.winnerName;
    dom.arena.classList.remove("hit-ally","hit-enemy","event-skill","event-void","event-crit","event-dodge","event-result");clearVoidReplayClasses(dom.arena);clearGradeAttackEffect(dom.arena);clearBossFinisher(dom.arena);
    dom.arena.classList.add(draw?"battle-draw":won?"battle-win":"battle-lose");
    dom.action.className="battle-action-card";
    dom.action.innerHTML=`<div class="battle-finish-card ${draw?"draw":won?"win":"lose"}"><small>PVP 전투 종료</small><strong>${draw?"무승부":won?"승리":"패배"}</strong><p>${legacyTextHtml(replay.summary||"")}</p><div class="battle-finish-actions"><button data-pvp-replay>다시 보기</button><button data-pvp-replay-close>닫기</button></div></div>`;
    dom.turnLabel.textContent="전투 종료";
    if(won){playGameSound("victory");gameVibrate("victory");}
  }
  function findPvpFinisherFrameIndex(frames,replay,dom){
    if(!replay?.winnerName||!dom)return -1;
    const winnerSide=replay.left?.name===replay.winnerName?"left":replay.right?.name===replay.winnerName?"right":"";if(!winnerSide)return -1;
    const loserSide=winnerSide==="left"?"right":"left";
    for(let index=frames.length-1;index>0;index--){
      const before=frames[index-1]?.[loserSide]||[],after=frames[index]?.[loserSide]||[],beforeAlive=before.some(fish=>Number(fish.hp)>0),afterAlive=after.some(fish=>Number(fish.hp)>0);
      if(beforeAlive&&!afterAlive)return index;
    }
    for(let index=frames.length-1;index>=0;index--){
      const frame=frames[index],text=plain(frame?.entry||"");
      if(frame?.actorSide===winnerSide&&/공격|피해|치명타|폭발|일격|쓰러/.test(text))return index;
    }
    return -1;
  }
  async function playPvpBattleReplay(replay){
    const token=++state.pvpReplayToken;state.pvpReplaySkip=false;state.pvpReplayRunning=true;state.lastActionHtml="";
    const intro=$("#pvpBattleIntro"),countdown=$("#pvpIntroCountdown"),localFinisherDemo=location.hostname==="127.0.0.1"&&new URLSearchParams(location.search).has("pvpFinisherDemo");
    if(intro){
      for(let remaining=localFinisherDemo?0:7;remaining>=1;remaining--){
        if(token!==state.pvpReplayToken||$("#modalOverlay")?.style.display==="none")return;
        if(countdown)countdown.textContent=String(remaining);
        if(state.pvpReplayDom?.turnLabel)state.pvpReplayDom.turnLabel.textContent=`전투 준비 · ${remaining}`;
        await sleep(1000);
        if(state.pvpReplaySkip)break;
      }
      intro.hidden=true;state.pvpReplayDom?.arena?.classList.remove("is-intro");
      if(state.pvpReplayDom?.turnLabel)state.pvpReplayDom.turnLabel.textContent="전투 시작";
    }
    const frames=preparePvpReplayFrames(replay.frames);
    const finisherFrameIndex=findPvpFinisherFrameIndex(frames,replay,state.pvpReplayDom);let finisherPlayed=false;
    for(let index=0;index<frames.length;index++){
      if(token!==state.pvpReplayToken||$("#modalOverlay")?.style.display==="none")return;
      if(index===finisherFrameIndex){await playPvpFinisher(replay);finisherPlayed=true;break;}
      if(state.pvpReplaySkip){if(replay?.winnerName){await playPvpFinisher(replay);finisherPlayed=true;}else updatePvpReplayFrame(frames[frames.length-1]);break;}
      const frame=frames[index],text=plain(frame.entry),base=frame.skillResult?(frame.skillSourceKind==="damage"?950:1500):String(frame.entry||"").includes("battle-event--void")?1700:/특성|부활|되감|각성|폭발|유언/.test(text)?1500:/^턴 \d+/.test(text)?480:850;
      updatePvpReplayFrame(frame);
      await sleep(Math.max(160,base/(0.35*Math.max(1,state.pvpReplaySpeed))));
    }
    if(token===state.pvpReplayToken&&replay?.winnerName&&!finisherPlayed){await playPvpFinisher(replay);}
    if(token===state.pvpReplayToken){state.pvpReplayRunning=false;finishPvpBattleReplay(replay);}
  }
  function openPvpBattleReplay(replay){
    if(!replay||!Array.isArray(replay.frames)||!replay.frames.length)return showToast("재생할 1대1 전투 기록이 없습니다.");
    state.lastPvpReplay=replay;state.pvpReplaySpeed=1;
    const mineSide=currentUser===replay.right?.name?"right":currentUser===replay.left?.name?"left":"left",enemySide=mineSide==="left"?"right":"left",mine=replay[mineSide]||{},enemy=replay[enemySide]||{},first=replay.frames[0],mineTeam=first[mineSide]||[],enemyTeam=first[enemySide]||[],mineProfile=pvpProfileVisual(mine.profile),enemyProfile=pvpProfileVisual(enemy.profile);
    openUiModal("1대1 라이브 전투",`<div class="pvp-battle-replay"><header class="battle-replay-head"><div><small>1대1 전투 재생</small><b id="pvpBattleTurnLabel">전투 준비 · 7</b></div><div class="battle-speed"><button class="active" data-pvp-battle-speed="1">×1</button><button data-pvp-battle-speed="2">×2</button><button data-pvp-battle-speed="4">×4</button><button data-pvp-battle-skip>건너뛰기</button></div></header><section id="pvpBattleArena" class="pvp-battle-arena is-intro"><div class="grade-attack-layer" aria-hidden="true"><i></i><i></i><i></i></div><div class="boss-finisher-layer" aria-hidden="true"><i></i><i></i><strong>FINAL</strong></div><div id="pvpBattleIntro" class="pvp-battle-intro"><header><small>1대1 대전</small><h2>출전 파티 비교</h2><p><strong id="pvpIntroCountdown">7</strong>초 후 교대 전투가 시작됩니다.</p></header><div class="pvp-intro-matchup">${pvpIntroTeamHtml(mineTeam,mine.name,"내 파티")}<strong>VS</strong>${pvpIntroTeamHtml(enemyTeam,enemy.name,"상대 파티")}</div><i class="pvp-intro-timer"></i></div><section class="pvp-battle-side ally" data-pvp-side="${mineSide}"><div class="battle-player-card"><div class="${mineProfile.classes}" style="${mineProfile.style}" data-aura-symbol="${safe(mineProfile.aura)}"><span>${mineProfile.avatar}</span></div><div><small>나의 선장</small><b>${safe(mine.name||"나")}</b><em>${safe(mine.title?`[${mine.title}]`:"칭호 없음")}</em></div></div><div class="pvp-live-team">${pvpReplayTeamHtml(mineTeam,mineSide)}</div></section><div class="battle-versus">VS</div><section class="pvp-battle-side enemy" data-pvp-side="${enemySide}"><div class="battle-player-card rival"><div class="${enemyProfile.classes}" style="${enemyProfile.style}" data-aura-symbol="${safe(enemyProfile.aura)}"><span>${enemyProfile.avatar}</span></div><div><small>상대 선장</small><b>${safe(enemy.name||"상대")}</b><em>${safe(enemy.title?`[${enemy.title}]`:"칭호 없음")}</em></div></div><div class="pvp-live-team">${pvpReplayTeamHtml(enemyTeam,enemySide)}</div></section><div id="pvpBattleAction" class="battle-action-card">한 마리씩 번갈아 공격합니다.</div></section></div>`);
    $("#modalOverlay")?.classList.add("battle-replay-mode");
    const sideElements=side=>({cards:$$(`[data-pvp-replay-fish^="${side}-"]`),bars:$$(`[data-pvp-replay-bar^="${side}-"]`),hp:$$(`[data-pvp-replay-hp^="${side}-"]`)}),mineElements=sideElements(mineSide),enemyElements=sideElements(enemySide);
    state.pvpReplayDom={arena:$("#pvpBattleArena"),action:$("#pvpBattleAction"),turnLabel:$("#pvpBattleTurnLabel"),mineSide,enemySide,legacySwap:!!(replay.perspectiveName&&replay.perspectiveName!==currentUser),mineAttackEffect:cosmeticGrades[mineProfile.attackEffect]?mineProfile.attackEffect:"",enemyAttackEffect:cosmeticGrades[enemyProfile.attackEffect]?enemyProfile.attackEffect:"",mineCards:mineElements.cards,mineBars:mineElements.bars,mineHp:mineElements.hp,enemyCards:enemyElements.cards,enemyBars:enemyElements.bars,enemyHp:enemyElements.hp};
    playPvpBattleReplay(replay);
  }
  globalThis.openPvpBattleReplay=openPvpBattleReplay;

  function maybeOpenLocalBattleReplayDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("battleDemo"))return;
    const demoParams=new URLSearchParams(location.search),phoenixReviveDemo=demoParams.has("phoenixReviveDemo"),finisherDemo=demoParams.has("finisherDemo");
    const boss=phoenixReviveDemo
      ? {id:"phoenix",name:"피닉스",grade:"전설",color:"#ff6f47",difficulty:"크레이지",maxHp:70000000000}
      : {id:"azathoth",name:"아자토스",grade:"공허",color:"#d053ff",difficulty:"크레이지",maxHp:70000000000};
    const fish=[
      {key:"1",name:"바다를 삼킨 태양",grade:"공허",hp:4200000000,maxHp:4200000000,status:"정상",effects:[{key:"burn",icon:"🔥",label:"화상",stacks:2},{key:"poison",icon:"☠️",label:"독",stacks:3}]},
      {key:"2",name:"해신룡",grade:"영원",hp:3600000000,maxHp:3600000000,status:"정상",effects:[{key:"root",icon:"🌿",label:"뿌리 연결",detail:"2턴"}]},
      {key:"3",name:"휘몰아치는 마음",grade:"초월",hp:2900000000,maxHp:2900000000,status:"정상",effects:[{key:"weakness",icon:"⚔️",label:"쇠약"},{key:"fear",icon:"💨",label:"공포"}]},
      {key:"4",name:"빛나는 마음",grade:"영원",hp:3300000000,maxHp:3300000000,status:"정상",effects:[{key:"redirect",icon:"🐿️",label:"이간질"}]},
      {key:"5",name:"얼어붙은 마음",grade:"영원",hp:3100000000,maxHp:3100000000,status:"정상",effects:[]}
    ];
    const showSummons=demoParams.has("summonDemo"),showVoidSummons=demoParams.has("voidSummonDemo");
    if(finisherDemo){bossList.filter(item=>item.grade==="공허").forEach(item=>{bossProgress.defeated[item.id]=true;bossProgress.difficultyClears[item.id]={normal:true,hard:true,crazy:true};});profileCosmetics.attackEffect="공허";}
    const demoSummons=showVoidSummons
      ? [{key:"demo-time-echo",name:"시간의 잔상",order:1,hp:875000000,maxHp:875000000,attack:14400000},{key:"demo-gate-watcher",name:"은빛 문의 감시자",order:1,hp:9000000000,maxHp:9000000000,attack:43500000}]
      : [1,2,3].map(order=>({key:"demo-dragon-"+order,name:"새끼 용",order,hp:900000000,maxHp:900000000,attack:120000000}));
    const demoFishHp=fish.map(item=>item.hp),frame=(entry,turn,bossHp,damageIndex=-1,summons=[])=>{if(damageIndex>=0)demoFishHp[damageIndex]=Math.floor(fish[damageIndex].hp*.55);return {entry,turn,bossHp,bossMaxHp:boss.maxHp,summons,fish:fish.map((item,index)=>({...item,battleLabel:`[${item.grade}] ${item.name}`,hp:demoFishHp[index]}))};};
    const solarEvent=frame('<span class="battle-event battle-event--ally battle-event--ally-attack battle-event--ally-solar"><span class="battle-event__eyebrow">SOLAR BURST</span><b>바다를 삼킨 태양 · 태양 폭발</b><span class="battle-event__body">태양 주기가 완성되어 전장을 밝힙니다.</span></span>',3,34000000000,-1,showSummons?demoSummons:[]),solarResult=frame("[공허] 바다를 삼킨 태양 공격\n치명타!\n16,000,000,000 피해",3,18000000000,-1,showSummons?demoSummons:[]);
    const phoenixApexEvent=frame('<span class="battle-event battle-event--phase battle-event--revival battle-event--revival-phoenix battle-event--crazy-passive battle-event--crazy-passive-phoenix-apex"><span class="battle-event__eyebrow">크레이지 부활</span><b><span style="color:#ff6f47">피닉스</span> · 불멸의 재점화</b><span class="battle-event__body">2번째 부활 · 체력 50%로 되살아났습니다.</span></span>',7,Math.floor(boss.maxHp*.5));
    const frames=finisherDemo?[frame("턴 9",9,12000000000),frame("[공허] 바다를 삼킨 태양 공격\n치명타!\n12,000,000,000 피해\n아자토스를 쓰러뜨렸습니다.",9,0)]:phoenixReviveDemo?[frame("피닉스가 쓰러졌습니다.",7,0),phoenixApexEvent]:demoParams.has("solarDemo")?[solarEvent,solarResult]:[
      frame("전투 시작",0,boss.maxHp),frame("턴 1",1,boss.maxHp),frame('<span class="battle-event battle-event--skill"><span class="battle-event__eyebrow">보스 스킬</span><b><span style="color:#d053ff">아자토스</span> · 맹목의 핵동</b><span class="battle-event__body">회피 불가 전체 공격이 발동했습니다.</span></span>',1,62000000000,-1,showSummons?demoSummons:[]),
      frame("아자토스의 맹목의 핵동\n치명타!\n파티 전체가 피해를 받았습니다.",1,62000000000,1,showSummons?demoSummons:[]),frame('<span class="battle-event battle-event--phase"><span class="battle-event__eyebrow">보스 변화</span><b><span style="color:#d053ff">아자토스</span> · 최종 각성</b><span class="battle-event__body">전투 규칙이 바뀌고 두 번째 행동이 시작됩니다.</span></span>',2,34000000000,-1,showSummons?demoSummons:[]),frame("아자토스의 추가 공격\n대상 2 / 3\n2,000,000 피해",2,34000000000,0,showSummons?demoSummons:[]),solarEvent,solarResult,
      frame('<span class="battle-event battle-event--crazy"><span class="battle-event__eyebrow">크레이지 궁극기</span><b><span style="color:#d053ff">아자토스</span> · 잠든 신의 개안</b><span class="battle-event__body">전투당 한 번만 사용하는 궁극기가 발동했습니다.</span></span>',3,18000000000),frame("아자토스를 쓰러뜨렸습니다.",4,0)
    ];
    const healthReport=[
      {name:"바다를 삼킨 태양",grade:"공허",startHp:4200000000,endHp:2100000000,maxHp:4200000000,lostRate:50,remainingRate:50,recoveryUntil:Date.now()+300000,recoveryMs:300000},
      {name:"해신룡",grade:"영원",startHp:3600000000,endHp:0,maxHp:3600000000,lostRate:100,remainingRate:0,recoveryUntil:Date.now()+300000,recoveryMs:300000,status:"기절"},
      {name:"휘몰아치는 마음",grade:"초월",startHp:2900000000,endHp:2900000000,maxHp:2900000000,lostRate:0,remainingRate:100,recoveryUntil:0,recoveryMs:0},
      {name:"빛나는 마음",grade:"영원",startHp:3300000000,endHp:3300000000,maxHp:3300000000,lostRate:0,remainingRate:100,recoveryUntil:0,recoveryMs:0},
      {name:"얼어붙은 마음",grade:"영원",startHp:3100000000,endHp:3100000000,maxHp:3100000000,lostRate:0,remainingRate:100,recoveryUntil:0,recoveryMs:0}
    ];
    setTimeout(()=>openBossBattleReplay({boss,frames,result:"처치 성공",totalDamage:70000000000,rewardMoney:3000000000000000,rewardDrop:"혼돈의 핵",rewardDropCount:8,healthReport}),80);
  }

  function maybeOpenLocalPvpReplayDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("pvpBattleDemo"))return;
    currentUser="로컬테스터";
    const leftBase=[{id:"void-observer",name:"수상한 기운 👁️",grade:"공허",attack:2400000,hp:12000000,maxHp:12000000,critRate:28,critDamage:250,dodge:18,status:"정상",evolutionStage:2},{id:"eternal-heart",name:"휘몰아치는 마음",grade:"영원",attack:1800000,hp:9800000,maxHp:9800000,critRate:24,critDamage:230,dodge:14,status:"정상"}];
    const rightBase=[{id:"rival-dragon",name:"해신룡",grade:"신화",attack:1700000,hp:9000000,maxHp:9000000,critRate:21,critDamage:220,dodge:12,status:"정상"},{id:"rival-sun",name:"바다를 삼킨 태양",grade:"초월",attack:2100000,hp:10500000,maxHp:10500000,critRate:26,critDamage:240,dodge:15,status:"정상"}];
    const snapshot=(entry,turn,leftHp=leftBase.map(f=>f.hp),rightHp=rightBase.map(f=>f.hp),actorSide="",actorId="")=>({entry,turn,actorSide,actorId,left:leftBase.map((fish,index)=>({...fish,hp:leftHp[index]})),right:rightBase.map((fish,index)=>({...fish,hp:rightHp[index]}))});
    const voidEvent='<span class="battle-event battle-event--ally battle-event--void battle-event--void-observer"><span class="battle-event__eyebrow">공허의 관측</span><b><span style="color:#d96aff">[[PVP_SIDE:left]] 수상한 기운</span> · 뒤틀린 관측</b><span class="battle-event__body">상대의 공격을 분석해 효과를 뒤집었습니다.</span></span>';
    const pvpFinisherDemo=new URLSearchParams(location.search).has("pvpFinisherDemo"),frames=pvpFinisherDemo?[snapshot("PVP SIDE left 수상한 기운 공격\n치명타!\n상대 파티를 쓰러뜨렸습니다.",5,[12000000,9800000],[0,0],"left","void-observer")]:[snapshot("전투 시작",0),snapshot("턴 1",1),snapshot(voidEvent+"\n[[PVP_SIDE:left]] 수상한 기운의 반전 공격\n치명타!\n1,600,000 피해",1,[12000000,9800000],[7400000,10500000],"left","void-observer"),snapshot("PVP SIDE right 해신룡 공격\n900,000 피해",1,[11100000,9800000],[7400000,10500000],"right","rival-dragon"),snapshot("PVP SIDE left 수상한 기운 회피!",2,[11100000,9800000],[7400000,10500000],"right","rival-sun")];
    setTimeout(()=>openPvpBattleReplay({id:"local-pvp-ui-demo",left:{name:"로컬테스터",title:"관측자",profile:{attackEffect:"공허"}},right:{name:"도전자",title:"심해의 창",profile:{attackEffect:"영원"}},frames,winnerName:"로컬테스터",summary:"로컬 1대1 스킬 UI 검사 완료"}),80);
  }

  function maybeOpenLocalNoticeDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("inboxNoticeDemo"))return;
    setTimeout(()=>globalThis.showFishingLifeInboxNotice?.(3),220);
  }
  function maybeOpenLocalRankingDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("rankingDemo"))return;
    setTimeout(()=>openRanking(),100);
  }

  function applyLocalCosmeticDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("cosmeticDemo"))return;
    const apex=new URLSearchParams(location.search).get("cosmeticDemo")==="apex",targets=apex?bossList.map(boss=>boss.id):["kraken","hydra"];
    targets.forEach(id=>{bossProgress.defeated[id]=true;bossProgress.difficultyClears[id]={normal:true,hard:true,crazy:true};});
    profileCosmetics=apex?{border:"azathoth",aura:"azathoth",background:"공허",attackEffect:"공허"}:{border:"kraken",aura:"hydra",background:"영웅",attackEffect:"영웅"};
  }

  function applyLocalFusionDemo(){
    if(location.hostname!=="127.0.0.1")return;
    const params=new URLSearchParams(location.search);
    if(!params.has("fusionDemo")&&!params.has("presetDemo")&&!params.has("infoDemo")&&!params.has("recoveryDemo")&&!params.has("aquariumDemo"))return;
    const makeDemoFish=(id,name,grade,attack,hp,price,stage=0,count=0)=>({id,name,grade,size:null,price,locked:false,time:"로컬 UI 검사",combat:{attack,hp,maxHp:hp,dodge:18,critRate:32,critDamage:260,_baseAttack:attack,_baseMaxHp:hp,_baseCritDamage:260,status:"정상",combatVersion:16,hpBalanceVersion:1,voidStatBalanceVersion:1,stars:{attack:1,hp:1,dodge:0,critRate:1,critDamage:1}},fusion:count||stage?{count,evolutionStage:stage,hpBalanceVersion:1,voidStatBalanceVersion:1,permanentAttack:attack,permanentMaxHp:hp,totalAttackGain:0,totalHpGain:0,totalGoldSpent:0}:undefined});
    bucket=[makeDemoFish("demo-main","해신룡","영원",1000000,5000000,1000000000,0,2),makeDemoFish("demo-mat-1","해신룡","영원",600000,3000000,1000000000),makeDemoFish("demo-mat-2","해신룡","영원",750000,3600000,1000000000),makeDemoFish("demo-mat-3","해신룡","영원",920000,4100000,1000000000),makeDemoFish("demo-evo","바다를 삼킨 태양","공허",2400000,12000000,5000000000,3,18),makeDemoFish("demo-party","휘몰아치는 마음","초월",480000,2400000,500000000)];
    if(params.has("aquariumDemo"))for(let index=7;index<=48;index++)bucket.push(makeDemoFish(`demo-aquarium-${index}`,`전시 물고기 ${index}`,index%3===0?"전설":index%2===0?"영웅":"희귀",200000+index*11000,900000+index*23000,1000000));
    if(params.has("newCatchDemo"))bucket[bucket.length-1].isNewCatch=true;
    currentUser="로컬테스터";money=1000000000000;fusionMainFishId="demo-main";fusionMainFishIds={"해신룡":"demo-main","바다를 삼킨 태양":"demo-evo"};partyPresets={boss:["demo-evo"],pvp:["demo-party"]};
    if(params.has("worldAlertDemo"))setTimeout(()=>showWorldCatchAlert({nickname:"바다왕",fishName:"무한한 시간",fishGrade:"영원"}),260);
    if(params.has("recoveryDemo")){const c=ensureCombatStats(bucket[4]);c.hp=Math.floor(c.maxHp*.42);c.status="회복 중";c.stunUntil=Date.now()+180000;}
    setTimeout(()=>params.has("aquariumDemo")?openAquarium(true):params.has("infoDemo")?openMyInfo():params.has("recoveryDemo")?openRecoveryBattleConfirm([bucket[4]]):params.has("pvpPartyDemo")?openPvpPanel():params.has("presetDemo")?openPresets():openFusionLab(),80);
  }

  function installOutputBridge() {
    const basePrint = print;
    print = function(value) {
      basePrint(value);
      if(globalThis.pendingFishingEscape){const escaped=globalThis.pendingFishingEscape;delete globalThis.pendingFishingEscape;showEscapeCelebration(escaped);}
      state.bucketKey = state.bossKey = state.collectionKey = "";
      queueUiRender(true);
    };

    const basePreview = printPreview;
    printPreview = function(title, summary, buttonText, modalContent) {
      basePreview(title, summary, buttonText, modalContent);
      if(title==="전투 종료"&&globalThis.pendingBossBattleReplay){
        const replay=globalThis.pendingBossBattleReplay;
        delete globalThis.pendingBossBattleReplay;
        openBossBattleReplay(replay);
        return;
      }
      if (title === "전투 종료" || title === "대전 결과") {
        const isPvp = title === "대전 결과";
        openUiModal(title, `
          <div class="game-dialog battle-result ${isPvp ? "pvp-result" : "boss-result"}">
            <div class="dialog-summary"><div><small>${isPvp ? "1대1 대전" : "보스전"}</small><b>${legacyTextHtml(summary)}</b></div><span>${isPvp ? "⚔️" : "🐲"}</span></div>
            <details class="battle-details"><summary>상세 전투 기록 보기</summary><div class="battle-log">${legacyTextHtml(modalContent)}</div></details>
          </div>`);
      }
    };
  }

  async function runGameCommand(command) {
    const commandInput = $("#command");
    if (!commandInput || typeof runCommand !== "function") return;
    commandInput.value = command;
    const result = runCommand();
    if (result && typeof result.then === "function") await result;
    state.bucketKey = state.bossKey = state.collectionKey = "";
    queueUiRender(true);
  }

  function switchView(viewId) {
    if(!currentUser){openLoginGate("로그인해야 게임 메뉴를 이용할 수 있습니다.");return;}
    if (!document.getElementById(viewId)) return;
    if (viewId !== "bossView" && isBossMenu && typeof leaveBossMenu === "function") leaveBossMenu();
    state.activeView = viewId;
    $$(".game-view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(`[data-view-target]`).forEach(button => button.classList.toggle("active", button.dataset.viewTarget === viewId));
    const view = document.getElementById(viewId);
    $("#pageTitle").textContent = view.dataset.title || "낚시터";
    $("#pageEyebrow").textContent = view.dataset.eyebrow || "";
    window.scrollTo({top:0,behavior:window.matchMedia?.("(max-width: 850px)").matches?"auto":"smooth"});
    renderAll(true);
  }

  function renderHeader() {
    const loggedIn = Boolean(currentUser);
    $("#sideUserName").textContent = loggedIn ? currentUser : "로그인 필요";
    $("#accountName").textContent = loggedIn ? `${currentUser} 선장` : "로그인이 필요합니다";
    $("#accountHelp").textContent = loggedIn ? "클라우드에 게임 진행 상황을 저장하고 있습니다." : "회원가입하거나 기존 계정으로 로그인하세요.";
    $("#onlineBadge").classList.toggle("online", loggedIn);
    $("#onlineBadge").classList.toggle("offline", !loggedIn);
    $("#topMoney").textContent = loggedIn ? formatMoney(money) : "0원";
    $("#topRod").textContent = `Lv.${Number(rodLevel || 1).toLocaleString()}`;
    $("#bucketNavCount").textContent = Number(bucket.length || 0).toLocaleString();
    $("#bucketNavCount").hidden = bucket.length === 0;
    renderProfileCosmetics();
  }

  function renderProfileCosmetics(){
    const borderId=isProfileCosmeticUnlocked("border",profileCosmetics.border)?profileCosmetics.border:"";
    const auraId=isProfileCosmeticUnlocked("aura",profileCosmetics.aura)?profileCosmetics.aura:"";
    const backgroundGrade=isProfileCosmeticUnlocked("background",profileCosmetics.background)?profileCosmetics.background:"";
    const borderBoss=bossList.find(boss=>boss.id===borderId),auraBoss=bossList.find(boss=>boss.id===auraId);
    const targets=[$("#profilePreview"),$(".captain-avatar")].filter(Boolean);
    targets.forEach(target=>{
      target.classList.toggle("has-profile-border",!!borderBoss);
      target.classList.toggle("has-profile-aura",!!auraBoss);
      target.style.setProperty("--profile-border-color",borderBoss?.color||"#4ee4ce");
      target.style.setProperty("--profile-aura-color",auraBoss?.color||"#4ee4ce");
      target.dataset.auraSymbol=auraBoss?bossSymbols[auraBoss.id]||"✦":"";
      target.dataset.borderSymbol=borderBoss?bossSymbols[borderBoss.id]||"✦":"";
      applyProfileAuraTier(target,auraBoss?.id);
      const avatar=target.querySelector("span");
      if(avatar)avatar.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
      else if(target.classList.contains("captain-avatar"))target.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
    });
    document.body.dataset.profileBackground=cosmeticGrades[backgroundGrade]?.slug||"";
  }

  function showCatchCelebration(fish) {
    const layer = $("#catchCelebration");
    const newDiscovery=!!fish.isNewCatch;
    layer.classList.remove("escaped");
    layer.classList.toggle("new-discovery",newDiscovery);
    $("#celebrationKicker").textContent=newDiscovery?"새로운 발견":"물고기 획득";
    $("#celebrationIcon").textContent = fishIcon(fish);
    $("#celebrationName").textContent = fish.name;
    $("#celebrationMeta").textContent = `[${fish.grade}] ${fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`} · ${formatMoney(fish.price || 0)}`;
    layer.classList.remove("show");
    void layer.offsetWidth;
    layer.classList.add("show");
    clearTimeout(state.catchCelebrationTimer);
    state.catchCelebrationTimer=setTimeout(()=>layer.classList.remove("show"),2450);
    playGameSound("catch",fish.grade);
    if(newDiscovery){fish.isNewCatch=false;saveGame();state.bucketKey="";}
  }

  function showEscapeCelebration(result){
    const layer=$("#catchCelebration");
    layer.classList.remove("show");
    layer.classList.add("escaped");
    layer.classList.remove("new-discovery");
    $("#celebrationKicker").textContent="물고기 도주";
    $("#celebrationIcon").textContent="💨";
    $("#celebrationName").textContent=`${result.name} 도주!`;
    $("#celebrationMeta").textContent=`[${result.grade}] ${result.timingResult} 판정 · 도주 확률 ${Number(result.escapeChance||0).toFixed(1)}%`;
    void layer.offsetWidth;
    layer.classList.add("show");
    clearTimeout(state.catchCelebrationTimer);
    state.catchCelebrationTimer=setTimeout(()=>layer.classList.remove("show","escaped"),2450);
  }

  function getFishingTimeTheme(now=new Date()){
    const hour=now.getHours();
    if(hour>=5&&hour<8)return {key:"dawn",icon:"🌅",label:"새벽"};
    if(hour>=8&&hour<17)return {key:"day",icon:"☀️",label:"낮"};
    if(hour>=17&&hour<20)return {key:"sunset",icon:"🌇",label:"노을"};
    return {key:"night",icon:"🌙",label:"밤"};
  }

  function applyFishingTimeTheme(force=false){
    const scene=$("#fishingScene"),badge=$("#sceneTimeBadge");if(!scene)return;
    const now=new Date(),theme=getFishingTimeTheme(now),clock=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`,key=`${feedbackSettings.timeBackground?theme.key:"static"}|${clock}`;
    if(!force&&state.fishingTimeKey===key)return;
    state.fishingTimeKey=key;
    scene.classList.remove("time-dawn","time-day","time-sunset","time-night","time-static");
    scene.classList.add(feedbackSettings.timeBackground?`time-${theme.key}`:"time-static");
    if(badge){badge.classList.toggle("disabled",!feedbackSettings.timeBackground);badge.querySelector("b").textContent=clock;}
  }

  function renderFishing() {
    const scene = $("#fishingScene");
    const castButton = $("#castButton");
    applyFishingTimeTheme();
    scene.classList.toggle("is-fishing", Boolean(isFishing));
    castButton.disabled = Boolean(isFishing || state.timingActive);
    $("#fishingStateTag").textContent = isFishing ? "입질을 기다리는 중" : state.timingActive ? "타이밍 도전" : "잔잔한 물결";
    $("#fishingHeadline").textContent = isFishing ? "수면 아래 움직임이 느껴져요" : state.timingActive ? "정확한 순간에 낚아채세요!" : "오늘은 어떤 물고기를 만날까요?";
    $("#fishingHint").textContent = isFishing ? "낚싯대를 거두지 말고 조금만 기다려주세요." : state.timingActive ? "가운데 노란 구간은 PERFECT 확률입니다." : "낚싯대를 던지고 타이밍에 맞춰 낚아채세요.";
    castButton.querySelector("b").textContent = isFishing ? "낚시 중..." : "낚싯대 던지기";
    $("#castSubText").textContent = isFishing ? "물고기가 다가오고 있어요" : "";
    $("#castSubText").hidden = !isFishing;
    $("#totalFishingStat").textContent = `${Number(getTodayFishingCount()).toLocaleString()}회`;
    $("#bucketStat").textContent = `${Number(bucket.length || 0).toLocaleString()}마리`;
    $("#collectionStat").textContent = `${Object.keys(collection || {}).length.toLocaleString()}종`;
    $("#bossStat").textContent = `${Object.values(bossProgress?.defeated || {}).filter(Boolean).length.toLocaleString()}마리`;

    const latest = bucket[bucket.length - 1];
    if (latest) {
      $("#catchIcon").textContent = fishIcon(latest);
      $("#catchGrade").textContent = `[${latest.grade}] 최근 획득`;
      $("#catchGrade").style.color = grades.find(item => item.name === latest.grade)?.color || "";
      $("#catchName").textContent = latest.name;
      $("#catchMeta").textContent = `${latest.size === null ? "특별 개체" : `${formatSize(latest.size)}cm`} · ${formatMoney(latest.price || 0)}`;
    }
    if (state.initialized && bucket.length > state.previousBucketCount && latest) {
      $("#catchSpotlight").classList.remove("caught");
      void $("#catchSpotlight").offsetWidth;
      $("#catchSpotlight").classList.add("caught");
      showCatchCelebration(latest);
    }
    state.previousBucketCount = bucket.length;
  }

  function startTimingGame() {
    if (!currentUser) { showToast("낚시를 시작하려면 먼저 로그인해주세요."); switchView("communityView"); return; }
    if (isFishing || state.timingActive) return;
    state.timingActive = true;
    playGameSound("cast");
    setTimeout(()=>{if(state.timingActive){playGameSound("bite");gameVibrate("bite");}},360);
    state.timingStartedAt = performance.now();
    state.timingDuration = 1500 + Math.random() * 750;
    state.timingTarget = .35 + Math.random() * .30;
    $("#timingTrack").style.setProperty("--target", `${state.timingTarget * 100}%`);
    $("#timingResult").textContent = "";
    $("#timingResult").className = "timing-result";
    $("#timingGame").classList.add("active");
    $("#timingGame").setAttribute("aria-hidden", "false");
    renderFishing();

    const animate = now => {
      if (!state.timingActive) return;
      const phase = ((now - state.timingStartedAt) % state.timingDuration) / state.timingDuration;
      state.timingPosition = phase < .5 ? phase * 2 : (1 - phase) * 2;
      $("#timingNeedle").style.left = `${state.timingPosition * 100}%`;
      state.timingRaf = requestAnimationFrame(animate);
    };
    state.timingRaf = requestAnimationFrame(animate);
    state.timingTimeout = setTimeout(() => resolveTimingGame("BAD"), 6500);
  }

  function resolveTimingGame(forcedRating = "") {
    if (!state.timingActive) return;
    const distance = Math.abs(state.timingPosition - state.timingTarget);
    const rating = forcedRating || (distance <= .05 ? "PERFECT" : distance <= .12 ? "GREAT" : distance <= .23 ? "GOOD" : "BAD");
    playGameSound("timing",rating);
    cancelAnimationFrame(state.timingRaf);
    clearTimeout(state.timingTimeout);
    state.timingActive = false;
    const showClickedResult = !forcedRating;
    if (showClickedResult) {
      $("#timingResult").textContent = rating;
      $("#timingResult").className = `timing-result show ${rating.toLowerCase()}`;
    }
    $("#timingNeedle").style.boxShadow = `0 0 18px ${ratingColors[rating]}`;
    setFishingTimingResult(rating);
    setTimeout(() => {
      $("#timingGame").classList.remove("active");
      $("#timingGame").setAttribute("aria-hidden", "true");
      $("#timingResult").textContent = "";
      $("#timingResult").className = "timing-result";
      runGameCommand("낚시");
    }, showClickedResult ? 650 : 0);
  }

  function renderRecentCatches() {
    const recent = bucket.map((fish, originalIndex) => ({fish, originalIndex})).filter(({fish})=>fish&&!fish.transferredFrom&&!Number(fish.transferredAtMillis||0)&&!String(fish.time||"").includes("받은 선물")).slice(-10).reverse();
    $("#recentCatchCount").textContent = `${recent.length} / 10`;
    $("#recentCatchEmpty").hidden = recent.length > 0;
    $("#recentCatchGrid").hidden = recent.length === 0;
    $("#recentCatchGrid").innerHTML = recent.map(({fish, originalIndex}, index) => `
      <button type="button" class="recent-catch-item ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}" data-recent-bucket-index="${originalIndex}" data-tooltip="${safe(fish.time || "최근 획득")}" aria-label="${safe(fish.name)} 상세정보 보기">
        <span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>${safe(fish.grade)} · 상세정보 보기</small></div><em>${index + 1}회 전</em>
      </button>`).join("");
  }

  function openRecentCatches(){
    const recent=bucket.map((fish,originalIndex)=>({fish,originalIndex})).filter(({fish})=>fish&&!fish.transferredFrom&&!Number(fish.transferredAtMillis||0)&&!String(fish.time||"").includes("받은 선물")).slice(-10).reverse(),cards=recent.map(({fish,originalIndex},index)=>`<button type="button" class="recent-catch-item ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}" data-recent-bucket-index="${originalIndex}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>${safe(fish.grade)} · ${safe(fish.time||"최근 획득")}</small></div><em>${index+1}회 전</em></button>`).join("");
    openUiModal("최근 잡은 물고기",`<div class="game-dialog recent-catch-dialog"><div class="dialog-summary"><div><small>최근 낚시</small><b>최근 기록 ${recent.length} / 10</b><p>물고기를 누르면 상세 능력치를 확인할 수 있습니다.</p></div><span>🎣</span></div><div class="recent-catch-grid">${cards||`<div class="recent-catch-empty">최근 낚시 기록이 없습니다.</div>`}</div></div>`);
  }

  function openSaleConfirmation(displayNumber){
    const idx=getBucketIndexByDisplayNumber(Number(displayNumber)),fish=bucket[idx];if(!fish)return showToast("물고기를 찾을 수 없습니다.");
    if(fish.locked)return showToast("잠금된 물고기는 판매할 수 없습니다.");
    if(isAquariumFish(fish))return showToast("수족관에 전시 중인 물고기는 전시 해제 후 판매할 수 있습니다.");
    const finalPrice=applyMarketPrice(fish);
    openUiModal("판매 확인",`<div class="game-dialog confirm-sale-dialog"><div class="dialog-summary ${gradeClass(fish.grade)}"><div><small>물고기 판매</small><b>${safe(fish.name)}</b><p>${safe(fish.grade)} · 판매 금액 ${safe(formatMoney(finalPrice))}</p></div><span>${fishIcon(fish)}</span></div><div class="confirm-danger"><b>정말 판매할까요?</b><p>판매한 물고기는 되돌릴 수 없습니다.${isFishInPartyPreset(fish)?" 저장 파티에서도 제거됩니다.":""}</p></div><div class="dialog-actions"><button class="danger" data-confirm-sell="${Number(displayNumber)}">${safe(formatMoney(finalPrice))}에 판매</button><button onclick="closeModal()">취소</button></div></div>`);
  }

  function openBulkSaleConfirmation(){
    const sellable=bucket.filter(f=>!f.locked&&!isAquariumFish(f)),total=sellable.reduce((sum,f)=>sum+applyMarketPrice(f),0),protectedCount=bucket.length-sellable.length,aquariumProtected=bucket.filter(isAquariumFish).length;
    if(!sellable.length)return showToast(bucket.length?"판매 가능한 물고기가 없습니다.":"양동이가 비어 있습니다.");
    openUiModal("일괄판매 확인",`<div class="game-dialog confirm-sale-dialog"><div class="dialog-summary"><div><small>일괄판매</small><b>${sellable.length.toLocaleString()}마리 일괄판매</b><p>보호된 물고기 ${protectedCount.toLocaleString()}마리${aquariumProtected?` · 수족관 ${aquariumProtected.toLocaleString()}마리 포함`:""}는 제외됩니다.</p></div><span>🪙</span></div><div class="confirm-danger"><b>정말 모두 판매할까요?</b><p>판매 대상에 포함된 저장 파티 물고기도 함께 제거되며 되돌릴 수 없습니다.</p></div><div class="sale-total-preview"><small>예상 판매 금액</small><strong>${safe(formatMoney(total))}</strong></div><div class="dialog-actions"><button class="danger" data-confirm-bulk-sell>${safe(formatMoney(total))}에 일괄판매</button><button onclick="closeModal()">취소</button></div></div>`);
  }

  function showSaleResult({count=1,total=0,fish=null}={}){
    closeModal(true);const card=document.createElement("div");card.className="sale-result-pop";card.innerHTML=`<span>${fish?fishIcon(fish):"🪙"}</span><div><small>${count>1?`${Number(count).toLocaleString()}마리 판매 완료`:safe(fish?.name||"판매 완료")}</small><b>+${safe(formatMoney(total))}</b></div>`;document.body.appendChild(card);requestAnimationFrame(()=>card.classList.add("show"));setTimeout(()=>{card.classList.remove("show");setTimeout(()=>card.remove(),260);},2300);state.bucketKey="";renderAll(true);
  }
  globalThis.showFishingLifeSaleResult=showSaleResult;

  function bucketRenderKey() {
    return `${bucket.length}|${bucketSortOrder}|${fusionMainFishId}|${Object.values(fusionMainFishIds||{}).join(",")}|${normalizeAquariumFishIds(aquariumFishIds).join(",")}|${bucket[0]?.id||""}|${bucket[bucket.length-1]?.id||""}`;
  }
  function fishCardHtml(entry,index){
    const fish=entry.fish;if(fish&&fish.grade!=="쓰레기")updateRecoveringFishHp(fish);
    const combat=ensureCombatStats(fish),no=index+1,healthPercent=Math.floor(hpPercent(combat.hp,combat.maxHp)),recoveryLeft=Math.max(0,Number(combat.stunUntil||0)-Date.now()),knockedOut=!!combat.knockedOut||combat.status==="기절"||combat.hp<=0;
    const isFusionMain=isFusionMainFish(fish),isDisplayed=isAquariumFish(fish),stage=getFishEvolutionStage(fish),fusionCount=getFishFusionCount(fish);
    return `<article class="fish-card ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)} ${isFusionMain?"fusion-main":""} ${isDisplayed?"aquarium-displayed":""}">
      <div class="fish-card-top"><span class="fish-card-icon">${fishIcon(fish)}</span><span class="fish-card-index">NO.${no}${fish.locked?" · 🔒":""}${isFusionMain?" · 🧬 본체":""}${isDisplayed?" · 🫧 전시":""}</span></div>
      <span class="fish-card-grade">${safe(fish.grade)}${stage?` · ${safe(getFishEvolutionLabel(fish))}`:""}</span><h3>${safe(fish.name)} ${fishEvolutionBadge(fish)}</h3><p>${fish.size===null?"특별 개체":`${formatSize(fish.size)}cm`}${fusionCount?` · 합성 ${fusionCount}회`:""}</p>
      <div class="fish-stats"><div><small>공격력 ${combatStars(combat,"attack")}</small><b>${compactNumber(combat.attack)}</b></div><div><small>체력 ${combatStars(combat,"hp")} · ${healthPercent}%</small><b>${compactNumber(combat.hp)} / ${compactNumber(combat.maxHp)}</b><span class="bucket-hp-track"><i style="width:${healthPercent}%"></i></span>${recoveryLeft>0?`<em class="bucket-recovery ${knockedOut?"knocked-out":""}" data-recovery-until="${Number(combat.stunUntil||0)}" data-recovery-kind="${knockedOut?"knockout":"recovery"}">${knockedOut?"💫 기절":"❤️‍🩹 회복"} ${safe(formatRemain(recoveryLeft))}</em>`:""}</div></div>
      <div class="fish-actions"><button data-fish-action="info" data-number="${no}" data-tooltip="능력치와 특성을 확인합니다">상세</button>${fish.grade!=="쓰레기"?`<button data-fish-action="fusion" data-number="${no}" data-tooltip="합성 본체·진화 화면을 엽니다">합성/진화</button>`:""}<button data-fish-action="lock" data-number="${no}" data-tooltip="${fish.locked?"잠금을 해제합니다":"판매되지 않도록 잠급니다"}">${fish.locked?"잠금 해제":"잠금"}</button><button class="sell" data-fish-action="sell" data-number="${no}" data-tooltip="${isDisplayed?"수족관 전시 해제 후 판매할 수 있습니다.":"현재 시세로 판매합니다"}" ${fish.locked||isDisplayed?"disabled":""}>${isDisplayed?"전시 중":"판매"}</button></div>
    </article>`;
  }
  function scheduleBucketChunk(list,start,token){
    const grid=$("#bucketGrid"),status=$("#bucketRenderStatus"),mobile=window.matchMedia?.("(max-width: 850px)").matches,chunkSize=mobile?20:60;
    const appendChunk=()=>{
      if(token!==state.bucketRenderToken||state.activeView!=="bucketView"||!grid)return;
      const end=Math.min(list.length,start+chunkSize);
      grid.insertAdjacentHTML("beforeend",list.slice(start,end).map((entry,offset)=>fishCardHtml(entry,start+offset)).join(""));
      if(end<list.length){if(status){status.hidden=false;status.textContent=`물고기 ${end.toLocaleString()} / ${list.length.toLocaleString()}마리 표시 중…`;}scheduleBucketChunk(list,end,token);}
      else if(status){status.hidden=true;status.textContent="";}
    };
    if(typeof requestIdleCallback==="function")requestIdleCallback(appendChunk,{timeout:120});
    else setTimeout(appendChunk,16);
  }
  function renderBucket(force = false) {
    if(state.activeView!=="bucketView")return;
    const key = bucketRenderKey();
    if (!force && key === state.bucketKey) return;
    state.bucketKey = key;
    renderRecentCatches();
    const grid = $("#bucketGrid"), empty = $("#bucketEmpty");
    $("#bucketSummary").textContent = bucket.length ? `${bucket.length.toLocaleString()}마리 보유 · 원하는 물고기를 선택해 관리하세요.` : "보유 중인 물고기가 없습니다.";
    empty.classList.toggle("visible", bucket.length === 0);
    grid.hidden = bucket.length === 0;
    $$("[data-sort]").forEach(button => button.classList.toggle("active", button.dataset.sort === bucketSortOrder));
    if (!bucket.length) { state.bucketRenderToken++;grid.replaceChildren();const status=$("#bucketRenderStatus");if(status)status.hidden=true;return; }
    const list = sortedBucketList();
    const token=++state.bucketRenderToken,mobile=window.matchMedia?.("(max-width: 850px)").matches,initialCount=Math.min(list.length,mobile?20:60);
    grid.innerHTML=list.slice(0,initialCount).map((entry,index)=>fishCardHtml(entry,index)).join("");
    const status=$("#bucketRenderStatus");
    if(initialCount<list.length){if(status){status.hidden=false;status.textContent=`물고기 ${initialCount.toLocaleString()} / ${list.length.toLocaleString()}마리 표시 중…`;}scheduleBucketChunk(list,initialCount,token);}
    else if(status){status.hidden=true;status.textContent="";}
  }

  function openFishDetailByBucketIndex(idx) {
    const fish = bucket[idx];
    if (!fish) return showToast("존재하지 않는 물고기입니다.");
    const displayNumber = getDisplayNumberByBucketIndex(idx);
    const c = ensureCombatStats(fish), trait = getFishTrait(fish);
    const fusionCount=getFishFusionCount(fish),stage=getFishEvolutionStage(fish);
    openUiModal(fish.name, `<div class="game-dialog"><div class="dialog-summary fish-detail-summary ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}"><div><small>${safe(fish.grade)} · 양동이 ${displayNumber}번${stage?` · ${safe(getFishEvolutionLabel(fish))}`:""}</small><b>${safe(fish.name)} ${fishEvolutionBadge(fish)}</b>${fish.grade!=="쓰레기"?`<p>합성 ${fusionCount}회 · 공격력/체력 20% 고정 전이</p>`:""}</div><span>${fishIcon(fish)}</span></div>
      <div class="dialog-card-grid"><article class="dialog-card"><small>공격력 ${combatStars(c,"attack")}</small><strong>${Number(c.attack).toLocaleString()}</strong></article><article class="dialog-card"><small>체력 ${combatStars(c,"hp")}</small><strong>${Number(c.hp).toLocaleString()} / ${Number(c.maxHp).toLocaleString()}</strong></article><article class="dialog-card"><small>회피율 ${combatStars(c,"dodge")}</small><strong>${Number(c.dodge).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 확률 ${combatStars(c,"critRate")}</small><strong>${Number(c.critRate).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 피해 ${combatStars(c,"critDamage")}</small><strong>${Number(c.critDamage).toFixed(0)}%</strong></article></div>
      ${trait ? `<article class="dialog-card ${gradeClass(fish.grade)}"><small>고유 특성</small><h3>${safe(trait.name)}</h3><p>${safe(trait.desc)}</p></article>` : ""}${isAquariumFish(fish)?'<div class="aquarium-detail-note">🫧 현재 나만의 수족관에 전시 중입니다. 전투·본체·진화 사용 가능</div>':""}${fish.grade!=="쓰레기"?`<div class="dialog-actions"><button class="primary" ${isFusionMainFish(fish)?"data-fusion-clear-main=\""+safe(fish.id)+"\"":"data-fusion-main-id=\""+safe(fish.id)+"\""}>${isFusionMainFish(fish)?"합성 본체 해제":"합성 본체로 설정"}</button><button data-fusion-open-name="${safe(fish.name)}">합성·진화 열기</button>${isAquariumFish(fish)?'<button data-ui-action="aquarium">수족관으로 돌아가기</button>':""}</div>`:""}</div>`);
  }
  function openFishDetail(displayNumber) {
    openFishDetailByBucketIndex(getBucketIndexByDisplayNumber(Number(displayNumber)));
  }

  function receivedFishIndexes(fishIds=[],message=null){
    const ids=new Set((Array.isArray(fishIds)?fishIds:[]).map(String).filter(Boolean));
    let indexes=bucket.map((fish,index)=>({fish,index})).filter(({fish})=>fish&&ids.has(String(fish.id||""))).map(item=>item.index);
    if(indexes.length||!message)return indexes;
    const names=new Set((Array.isArray(message.fishNames)?message.fishNames:[]).map(String)),sender=String(message.from||""),created=Number(message.createdAtMillis||0),count=Math.max(1,Number(message.count||1));
    indexes=bucket.map((fish,index)=>({fish,index})).filter(({fish})=>fish&&(!sender||String(fish.transferredFrom||"")===sender)&&(!names.size||names.has(String(fish.name||"")))&&(!created||Math.abs(Number(fish.transferredAtMillis||0)-created)<10*60*1000)).sort((a,b)=>Number(b.fish.transferredAtMillis||0)-Number(a.fish.transferredAtMillis||0)).slice(0,count).map(item=>item.index);
    return indexes;
  }

  function markInboxMessageReadQuietly(message){
    if(!message||message.read===true)return;
    message.read=true;
    saveGame();
    if(currentUser)saveCloudData().catch(console.error);
    renderInboxBadge();
  }

  function openReceivedFishDetails(fishIds=[],message=null){
    const indexes=receivedFishIndexes(fishIds,message);
    if(!indexes.length)return showToast("받은 물고기를 양동이에서 찾지 못했습니다. 잠시 후 다시 확인해주세요.");
    markInboxMessageReadQuietly(message);
    if(indexes.length===1)return openFishDetailByBucketIndex(indexes[0]);
    const cards=indexes.map(index=>{const fish=bucket[index],c=ensureCombatStats(fish);return `<article class="dialog-card received-fish-card ${gradeClass(fish.grade)}"><small>${safe(fish.grade)} · 선물받은 물고기</small><h3>${safe(fish.name)} ${fishEvolutionBadge(fish)}</h3><p>⚔ 공격력 ${Number(c.attack).toLocaleString()} · ❤️ 체력 ${Number(c.hp).toLocaleString()} / ${Number(c.maxHp).toLocaleString()}</p><button data-received-fish-id="${safe(fish.id)}">전체 능력치 보기</button></article>`;}).join("");
    openUiModal("선물받은 물고기",`<div class="game-dialog"><div class="dialog-summary"><div><small>선물 도착</small><b>물고기 ${indexes.length.toLocaleString()}마리</b><p>각 물고기를 눌러 별·특성·합성·진화 정보를 확인할 수 있습니다.</p></div><span>🎁</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  globalThis.showFishingLifeReceivedFishNotice=fishIds=>{
    const ids=[...new Set((Array.isArray(fishIds)?fishIds:[]).map(String).filter(Boolean))];
    if(!ids.length)return;
    showGameNotice({icon:"🎁",eyebrow:"물고기 선물 도착",title:`물고기 ${ids.length.toLocaleString()}마리를 받았습니다`,detail:"능력치를 바로 확인할 수 있습니다.",kind:"success",duration:9000});
    const toast=$("#gameToast"),holder=toast?.querySelector("div");
    if(!holder)return;
    const button=document.createElement("button");button.type="button";button.className="game-notice-action";button.textContent="능력치 보기";button.addEventListener("click",()=>openReceivedFishDetails(ids));holder.appendChild(button);
  };

  function renderCollection(force = false) {
    const discovered = Object.keys(collection || {}).length, total = allFishCount();
    const key = `${discovered}|${Object.values(gradeCounts || {}).join("|")}`;
    if (!force && key === state.collectionKey) return;
    state.collectionKey = key;
    const percent = total ? Math.min(100, discovered / total * 100) : 0;
    $("#collectionPercent").textContent = `${percent.toFixed(1)}%`;
    $("#collectionCount").textContent = `${discovered.toLocaleString()} / ${total.toLocaleString()}종 발견`;
    $(".collection-ring").style.setProperty("--collection-progress", `${percent}%`);
    $("#gradeCollectionGrid").innerHTML = grades.map(grade => {
      const names = fishByGrade[grade.name] || [], found = names.filter(name => collection?.[name]).length;
      return `<article class="grade-progress-card ${gradeClass(grade.name)}"><span>${safe(grade.name)}</span><b>${found} / ${names.length}</b><small>발견한 물고기</small></article>`;
    }).join("");
  }

  function openFishCollection() {
    const cards = grades.flatMap(grade => (fishByGrade[grade.name] || []).map(name => {
      const got = Boolean(collection?.[name]);
      return `<article class="dialog-card ${gradeClass(grade.name)}" style="opacity:${got ? 1 : .42}"><small>${safe(grade.name)}</small><h3>${got ? `${fishIcon({name,grade:grade.name})} ${safe(name)}` : "❔ 미발견"}</h3><p>${got ? `${Number(collection[name].count || 0).toLocaleString()}회 발견` : "낚시터에서 발견할 수 있습니다."}</p></article>`;
    })).join("");
    openUiModal("물고기 도감", `<div class="game-dialog"><div class="dialog-summary"><div><small>물고기 도감</small><b>${Object.keys(collection || {}).length} / ${allFishCount()}종</b></div><span>📖</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }
  function openCoreCollection() {
    const cards = bossList.map(boss => {
      const owned = Number(bossProgress?.materials?.[boss.drop] || 0), discovered = owned > 0 || isBossDifficultyCleared(boss,"normal");
      return `<article class="dialog-card ${gradeClass(boss.grade)}"><small>${safe(boss.name)}</small><h3>${discovered ? `💎 ${safe(boss.drop)}` : "❔ 미발견 코어"}</h3><strong>x${owned.toLocaleString()}</strong></article>`;
    }).join("");
    openUiModal("코어 도감", `<div class="game-dialog"><div class="dialog-summary"><div><small>보스 코어</small><b>일반 1~3 · 어려움 3~5 · 크레이지 5~10</b></div><span>💎</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function renderBosses(force = false) {
    const key = `${bossProgress?.selectedDifficulty||"normal"}|${bossList.map(b => bossProgress?.materials?.[b.drop] || 0).join("|")}|${bossList.map(b => BOSS_DIFFICULTY_ORDER.map(d=>isBossDifficultyCleared(b,d)?1:0).join("")).join("|")}`;
    if (!force && key === state.bossKey) return;
    state.bossKey = key;
    $("#bossGrid").innerHTML = bossList.map((boss, index) => {
      const unlocked = isBossUnlocked(boss), cleared = isBossDifficultyCleared(boss,"normal"), owned = Number(bossProgress?.materials?.[boss.drop] || 0);
      const difficultyBadges=BOSS_DIFFICULTY_ORDER.map(id=>{const config=getBossDifficultyConfig(id),done=isBossDifficultyCleared(boss,id),open=isBossDifficultyUnlocked(boss,id);return `<span class="difficulty-badge ${done?"cleared":open?"open":"locked"}">${config.name}${done?" ✓":open?"":" 🔒"}</span>`;}).join("");
      return `<article class="boss-card ${gradeClass(boss.grade)} ${unlocked ? "" : "locked"}" data-tooltip="${safe(boss.skillName)}"><div class="boss-card-head"><div><small>${safe(boss.grade)} · ${cleared ? "일반 처치 완료" : unlocked ? "도전 가능" : "잠김"}</small><h3>${safe(boss.name)}</h3><p>${safe(boss.skillName)}</p></div><span class="boss-card-symbol">${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-difficulty-status">${difficultyBadges}</div><div class="boss-stats"><span>❤️ ${compactNumber(boss.hp)}</span><span>⚔️ ${compactNumber(Math.floor(boss.attack*BOSS_ATTACK_BALANCE_MULTIPLIER))}</span><span>💨 ${boss.dodge}%</span></div><div class="boss-reward"><span>💎 ${safe(boss.drop)}</span><b>x${owned.toLocaleString()}</b></div><button data-boss-index="${index + 1}" ${unlocked ? "" : "disabled"}>${unlocked ? "난이도 선택 · 도전" : "이전 보스 일반 처치 필요"}</button></article>`;
    }).join("");
  }

  function getBossMechanicBlocks(baseBoss){
    const holder=document.createElement("div");
    holder.innerHTML=sanitizeGameHtml(buildBossInfoText(baseBoss));
    const sections=holder.textContent.split("────────────────────");
    const mechanicText=String(sections[3]||"").trim();
    return mechanicText.split(/\n\s*\n+/).map(block=>block.trim()).filter(Boolean);
  }

  function bossSkillGuideHtml(baseBoss,difficultyId){
    const difficulty=getBossDifficultyConfig(difficultyId),multiplier=Number(difficulty.skillMultiplier||1);
    let category="";
    const cards=[];
    getBossMechanicBlocks(baseBoss).forEach(block=>{
      const lines=block.split(/\n+/).map(line=>line.trim()).filter(Boolean);
      if(!lines.length)return;
      if(lines[0]==="스킬"||lines[0]==="패시브"){category=lines[0]==="스킬"?"skill":"passive";return;}
      const rawTitle=lines.shift();
      const alreadyScaled=String(baseBoss.skillName||"")&&rawTitle.startsWith(String(baseBoss.skillName));
      const title=rawTitle.replace(/\((\d+(?:\.\d+)?)%\)/g,(_match,rate)=>`(${Number((Number(rate)*(alreadyScaled?1:multiplier)).toFixed(2)).toLocaleString()}%)`);
      const body=lines.join("\n").replace(/^(.+?)\s+(\d+(?:\.\d+)?)%(\s*:)/gm,(_match,name,rate,suffix)=>`${name} ${Number((Number(rate)*multiplier).toFixed(2)).toLocaleString()}%${suffix}`);
      const passive=/^(패시브|크레이지 진화|크레이지 전용)/.test(rawTitle)||(!/\(\d+(?:\.\d+)?%\)/.test(rawTitle)&&category!=="skill");
      cards.push(`<article class="boss-intel-card ${passive?"passive":"skill"}"><small>${passive?"지속 효과":"보스 스킬"}</small><b>${safe(title)}</b><p>${safe(body).replace(/\n/g,"<br>")}</p></article>`);
    });
    const crazyName=baseBoss.crazySkillName||CRAZY_BOSS_SKILL_NAMES[baseBoss.id]||"크레이지 궁극기";
    const crazyCard=difficultyId==="crazy"?`<article class="boss-intel-card crazy"><small>크레이지 궁극기 · 전투당 1회</small><b>${safe(crazyName)}</b><p>${safe(CRAZY_BOSS_SKILL_DESCRIPTIONS[baseBoss.id]||"크레이지 전용 궁극기가 발동합니다.")}</p><em>매 행동 10% · 체력 35% 이하에서 미사용 시 확정 발동</em></article>`:"";
    return `<section class="boss-prebattle-intel ${gradeClass(baseBoss.grade)}"><header><div><small>보스 정보 · ${safe(difficulty.name)}</small><h3>전투 전 스킬 정보</h3><p>현재 난이도 기본 스킬 확률 ×${Number(multiplier.toFixed(2)).toLocaleString()} 반영</p></div><span>${bossSymbols[baseBoss.id]||"🐲"}</span></header><div class="boss-intel-grid">${cards.join("")}${crazyCard}</div></section>`;
  }

  function openBossParty(bossNumber = 0) {
    if (!currentUser) { showToast("보스전에 도전하려면 먼저 로그인해주세요."); switchView("communityView"); return; }
    recoverStunnedFish();
    isBossMenu = true;
    if (bossNumber) {
      state.bossPartyVisibleCount=30;
      const boss = bossList[Number(bossNumber) - 1];
      if (boss && isBossUnlocked(boss)) { bossProgress.selectedBossId = boss.id; bossProgress.selectedDifficulty=getSelectedBossDifficulty(boss); saveGame(); }
    }
    const baseBoss = getCurrentBoss(), difficultyId=getSelectedBossDifficulty(baseBoss), difficulty=getBossDifficultyConfig(difficultyId), boss=getBossForDifficulty(baseBoss,difficultyId);
    const gradeRank=Object.fromEntries(grades.map((grade,index)=>[grade.name,index]));
    const displayNumberMap=new Map(sortedBucketList().map((entry,index)=>[entry.originalIndex,index+1]));
    const list=bucket.map((fish,originalIndex)=>{if(!fish||fish.grade==="쓰레기")return null;const combat=ensureCombatStats(fish),power=combat.attack*(1+combat.critRate/100*Math.max(0,combat.critDamage/100-1))+combat.maxHp*.2;return {fish,originalIndex,combat,power};}).filter(Boolean).sort((a,b)=>{
      if(state.bossPartySortOrder==="공격력")return b.combat.attack-a.combat.attack||b.originalIndex-a.originalIndex;
      if(state.bossPartySortOrder==="체력")return b.combat.maxHp-a.combat.maxHp||b.originalIndex-a.originalIndex;
      if(state.bossPartySortOrder==="등급")return (gradeRank[b.fish.grade]??-1)-(gradeRank[a.fish.grade]??-1)||b.power-a.power;
      if(state.bossPartySortOrder==="최근 획득")return b.originalIndex-a.originalIndex;
      return b.power-a.power||b.originalIndex-a.originalIndex;
    });
    const visibleEntries=list.slice(0,state.bossPartyVisibleCount),visibleIds=new Set(visibleEntries.map(entry=>entry.fish.id));
    list.forEach(entry=>{if(bossPrepIndexes.includes(entry.originalIndex)&&!visibleIds.has(entry.fish.id)){visibleEntries.push(entry);visibleIds.add(entry.fish.id);}});
    const fishCards = visibleEntries.map(entry => {
      const fish = entry.fish, no = displayNumberMap.get(entry.originalIndex), selected = bossPrepIndexes.includes(entry.originalIndex), c = entry.combat, knockedOut=!!c.knockedOut||c.status==="기절"||c.hp<=0;
      return `<article class="boss-party-fish ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)} ${selected ? "selected" : ""} ${knockedOut?"knocked-out":""}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)} ${fishEvolutionBadge(fish)}</b><small>⚔ ${compactNumber(c.attack)} ${combatStars(c,"attack")} · ❤️ ${compactNumber(c.hp)} / ${compactNumber(c.maxHp)} ${combatStars(c,"hp")}${knockedOut?" · 기절":""}</small></div><button data-boss-prep-number="${no}" data-selected="${selected ? 1 : 0}" ${knockedOut?"disabled":""}>${knockedOut?"기절":selected?"해제":"참가"}</button></article>`;
    }).join("");
    const cooldown = getBossCooldownLeft(boss.id,difficultyId);
    const difficultyButtons=BOSS_DIFFICULTY_ORDER.map(id=>{const config=getBossDifficultyConfig(id),open=isBossDifficultyUnlocked(baseBoss,id),done=isBossDifficultyCleared(baseBoss,id);return `<button data-boss-difficulty="${id}" class="${id===difficultyId?"active":""}" ${open?"":"disabled"}>${config.name}${done?" ✓":open?"":" 🔒"}</button>`;}).join("");
    const sortButtons=["전투력","공격력","체력","등급","최근 획득"].map(order=>`<button data-boss-party-sort="${order}" class="${state.bossPartySortOrder===order?"active":""}">${order}</button>`).join("");
    const firstReward=getBossDifficultyReward(baseBoss,difficultyId),coreRange=getBossCoreRange(difficultyId);
    const bossIntel=bossSkillGuideHtml(baseBoss,difficultyId);
    const moreParty=list.length>visibleIds.size?`<button class="boss-party-more" data-boss-party-more>물고기 더 보기 · ${visibleIds.size.toLocaleString()} / ${list.length.toLocaleString()}</button>`:"";
    openUiModal(`${boss.name} · ${difficulty.name}`, `<div class="game-dialog"><div class="dialog-summary ${gradeClass(boss.grade)}"><div><small>${safe(boss.grade)} 보스 · ${safe(difficulty.name)} · 파티 ${bossPrepIndexes.length} / 5</small><b>${safe(boss.name)}</b><p>❤️ ${boss.hp.toLocaleString()} · ⚔️ ${boss.attack.toLocaleString()} · 💨 ${boss.dodge}%</p><p>최초 상금 ${formatMoney(firstReward)} · 💎 ${safe(boss.drop)} ${coreRange.min}~${coreRange.max}개</p></div><span>${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-difficulty-selector">${difficultyButtons}</div>${bossIntel}<div class="party-preset-quick"><div><small>저장 파티</small><b>보스전 파티 ${partyPresets.boss.length} / 5</b></div><button data-party-preset-load="boss" ${partyPresets.boss.length?"":"disabled"}>${partyPresets.boss.length?"보스전 파티 불러오기":"저장된 파티 없음"}</button></div><div class="boss-party-sort"><small>출전 물고기 정렬</small><div>${sortButtons}</div></div><div class="boss-party-list">${fishCards || "출전 가능한 물고기가 없습니다."}</div>${moreParty}<div class="dialog-actions"><button class="primary" data-boss-start data-boss-id="${boss.id}" data-start-boss-difficulty="${difficultyId}" data-boss-difficulty-name="${safe(difficulty.name)}" ${cooldown > 0 ? "disabled" : ""}>${cooldown > 0 ? `쿨타임 ${formatRemain(cooldown)}` : `${safe(difficulty.name)} 도전 시작`}</button><button data-ui-action="coreCollection">보유 코어 확인</button></div></div>`);
  }

  function updateOpenBossCooldown(){
    const button=$("#modalBody [data-boss-start]");
    if(!button)return;
    const left=getBossCooldownLeft(button.dataset.bossId,button.dataset.startBossDifficulty);
    button.disabled=left>0;
    button.textContent=left>0?`쿨타임 ${formatRemain(left)}`:`${button.dataset.bossDifficultyName||"선택한 난이도"} 도전 시작`;
  }

  function updateBucketRecoveryCountdowns(){
    $$("[data-recovery-until]").forEach(label=>{
      const left=Math.max(0,Number(label.dataset.recoveryUntil||0)-Date.now());
      const knockedOut=label.dataset.recoveryKind==="knockout";
      label.textContent=left>0?`${knockedOut?"💫 기절":"❤️‍🩹 회복"} ${formatRemain(left)}`:"회복 완료";
    });
  }

  function openMarket() {
    refreshMarketIfNeeded();
    const order = {"영원":0,"초월":1,"신화":2,"전설":3};
    const cards = Object.entries(marketRates).sort((a,b) => (order[getFishGradeByName(a[0])] ?? 9) - (order[getFishGradeByName(b[0])] ?? 9) || b[1]-a[1]).map(([name, bonus]) => {
      const grade = getFishGradeByName(name), discovered = Boolean(collection?.[name]);
      return `<article class="dialog-card market-card ${gradeClass(grade)}"><span>${discovered ? fishIcon({name,grade}) : "❔"}</span><div><small>${discovered ? safe(grade) : "미발견"}</small><h3>${discovered ? safe(displayFishName(name)) : "???"}</h3></div><strong>+${bonus}%</strong></article>`;
    }).join("");
    openUiModal("현재 시세", `<div class="game-dialog"><div class="dialog-summary"><div><small>시세 상승</small><b>${Object.keys(marketRates).length}종 가격 상승</b><p>다음 갱신까지 약 ${getNextMarketMinutes()}분</p></div><span>📈</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function openWallet() {
    openUiModal("내 지갑", `<div class="game-dialog"><div class="dialog-summary"><div><small>${safe(currentUser || "로그인 필요")}</small><b>${formatMoney(currentUser ? money : 0)}</b></div><span>💰</span></div><div class="dialog-card-grid"><article class="dialog-card"><small>총 획득 골드</small><strong>${formatMoney(totalEarned)}</strong></article><article class="dialog-card"><small>낚싯대</small><strong>Lv.${rodLevel.toLocaleString()}</strong></article><article class="dialog-card"><small>보유 물고기</small><strong>${bucket.length.toLocaleString()}마리</strong></article><article class="dialog-card"><small>장착 칭호</small><strong>${safe(getCurrentTitle() || "없음")}</strong></article></div></div>`);
  }
  function openAchievements() {
    const newly = updateAchievements(); checkSpecialTitles(); if (newly.length) saveGame();
    const completed = getCurrentCompletedAchievements();
    const cards = achievementList.map(a => { const done = completed.includes(a.name); return `<article class="dialog-card" style="opacity:${done ? 1 : .62}"><small>${done ? "✅ 달성" : "미달성"}</small><h3>${safe(a.name)}</h3><p>${safe(a.desc)}</p><strong>${formatMoney(a.reward)}</strong></article>`; }).join("");
    const rate = achievementList.length ? completed.length / achievementList.length * 100 : 0;
    openUiModal("업적", `<div class="game-dialog"><div class="dialog-summary"><div><small>ACHIEVEMENT</small><b>${completed.length} / ${achievementList.length} 달성</b><div class="progress-track"><i style="width:${rate}%"></i></div></div><span>🏅</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }
  function openTitles() {
    const owned = getOwnedTitles();
    const cards = owned.map((title,index) => `<article class="dialog-card"><small>${getCurrentTitle() === title ? "장착 중" : "보유 칭호"}</small><h3>🎖️ ${safe(title)}</h3><button data-title-index="${index + 1}" ${getCurrentTitle() === title ? "disabled" : ""}>${getCurrentTitle() === title ? "현재 장착" : "장착하기"}</button></article>`).join("") || `<article class="dialog-card"><h3>보유한 칭호가 없습니다.</h3></article>`;
    openUiModal("칭호", `<div class="game-dialog"><div class="dialog-summary"><div><small>현재 칭호</small><b>${safe(getCurrentTitle() || "없음")}</b></div><span>🎖️</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function cosmeticChoiceCard({type,id,name,desc,icon,color,unlocked,selected}){
    const status=selected?"장착 중":unlocked?"사용 가능":"잠김";
    return `<article class="cosmetic-card ${selected?"selected":""} ${unlocked?"":"locked"}" style="--cosmetic-color:${safe(color||"#4ee4ce")}"><span class="cosmetic-icon">${icon||"✦"}</span><div><small>${status}</small><h3>${safe(name)}</h3><p>${safe(desc)}</p></div><button data-cosmetic-type="${type}" data-cosmetic-id="${safe(id)}" ${unlocked&&!selected?"":"disabled"}>${selected?"현재 장착":unlocked?"장착":"조건 미달"}</button></article>`;
  }

  function openCosmetics(){
    const defaultCards=[
      cosmeticChoiceCard({type:"border",id:"",name:"기본 테두리",desc:"프로필 테두리를 해제합니다.",icon:"⚓",unlocked:true,selected:!profileCosmetics.border}),
      cosmeticChoiceCard({type:"aura",id:"",name:"오라 없음",desc:"프로필 오라와 특별 테두리을 해제합니다.",icon:"○",unlocked:true,selected:!profileCosmetics.aura}),
      cosmeticChoiceCard({type:"background",id:"",name:"기본 배경",desc:"FishingLife의 기본 심해 배경으로 돌아갑니다.",icon:"🌊",unlocked:true,selected:!profileCosmetics.background}),
      cosmeticChoiceCard({type:"attackEffect",id:"",name:"기본 공격 연출",desc:"등급 정복 빛 공격 연출을 사용하지 않습니다.",icon:"⚔️",unlocked:true,selected:!profileCosmetics.attackEffect})
    ].join("");
    const borders=bossList.map(boss=>cosmeticChoiceCard({type:"border",id:boss.id,name:boss.name+" 테두리",desc:boss.name+" 어려움 최초 클리어",icon:bossSymbols[boss.id],color:boss.color,unlocked:isProfileCosmeticUnlocked("border",boss.id),selected:profileCosmetics.border===boss.id})).join("");
    const auras=bossList.map(boss=>cosmeticChoiceCard({type:"aura",id:boss.id,name:boss.name+" 오라",desc:`${boss.name} 크레이지 최초 클리어 · 테두리 빛 단계 ${getProfileAuraTier(boss.id)}/5`,icon:bossSymbols[boss.id],color:boss.color,unlocked:isProfileCosmeticUnlocked("aura",boss.id),selected:profileCosmetics.aura===boss.id})).join("");
    const gradeRewards=Object.entries(cosmeticGrades).map(([grade,config],gradeIndex)=>{
      const gradeBosses=bossList.filter(boss=>boss.grade===grade),cleared=gradeBosses.filter(boss=>isBossDifficultyCleared(boss,"crazy")).length,unlocked=isBossGradeCrazyCleared(grade);
      return `<article class="grade-cosmetic-card ${unlocked?"unlocked":"locked"}" style="--cosmetic-color:${config.primary};--cosmetic-secondary:${config.secondary}"><span>${config.icon}</span><div><small>${unlocked?`등급 정복 완료 · 빛 단계 ${gradeIndex+1}/6`:`${cleared} / ${gradeBosses.length} 크레이지`}</small><h3>${safe(config.name)}</h3><p>${safe(grade)} 보스 전원의 크레이지 정복 보상입니다. 배경 광륜과 공격 빛 효과는 후반 등급일수록 커지며, 공격 연출은 아군의 매 공격에 적용됩니다.</p><div class="cosmetic-actions"><button data-cosmetic-type="background" data-cosmetic-id="${grade}" ${unlocked&&profileCosmetics.background!==grade?"":"disabled"}>${profileCosmetics.background===grade?"배경 장착 중":"배경 장착"}</button><button data-cosmetic-type="attackEffect" data-cosmetic-id="${grade}" ${unlocked&&profileCosmetics.attackEffect!==grade?"":"disabled"}>${profileCosmetics.attackEffect===grade?"공격 연출 장착 중":"공격 연출 장착"}</button></div></div></article>`;
    }).join("");
    openUiModal("프로필 꾸미기",`<div class="game-dialog cosmetics-dialog"><div class="dialog-summary"><div><small>보스 정복 보상</small><b>보스 정복 보상</b><p>어려움 테두리 · 크레이지 오라 · 등급 정복 배경과 공격 연출</p></div><div id="cosmeticProfilePreview" class="profile-preview"><i class="profile-aura-layer"></i><span>⚓</span></div></div><section class="cosmetic-section"><h3>기본 설정</h3><div class="cosmetic-grid">${defaultCards}</div></section><section class="cosmetic-section"><h3>프로필 테두리</h3><div class="cosmetic-grid">${borders}</div></section><section class="cosmetic-section"><h3>개별 보스 오라</h3><div class="cosmetic-grid">${auras}</div></section><section class="cosmetic-section"><h3>등급 정복 보상</h3><div class="grade-cosmetic-grid">${gradeRewards}</div></section></div>`);
    const preview=$("#cosmeticProfilePreview");
    if(preview){
      const borderBoss=bossList.find(boss=>boss.id===profileCosmetics.border),auraBoss=bossList.find(boss=>boss.id===profileCosmetics.aura);
      preview.classList.toggle("has-profile-border",!!borderBoss);preview.classList.toggle("has-profile-aura",!!auraBoss);
      preview.style.setProperty("--profile-border-color",borderBoss?.color||"#4ee4ce");preview.style.setProperty("--profile-aura-color",auraBoss?.color||"#4ee4ce");preview.dataset.auraSymbol=auraBoss?bossSymbols[auraBoss.id]||"✦":"";preview.dataset.borderSymbol=borderBoss?bossSymbols[borderBoss.id]||"✦":"";applyProfileAuraTier(preview,auraBoss?.id);
      const previewAvatar=preview.querySelector("span");if(previewAvatar)previewAvatar.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
    }
  }

  function aquariumFishButton(fish,index,owner=""){
    if(!fish)return owner?`<div class="aquarium-fish empty slot-${index+1}"><span>·</span><small>빈 전시칸</small></div>`:`<button class="aquarium-fish empty slot-${index+1}" data-aquarium-edit aria-label="빈 전시칸"><span>＋</span><small>전시칸 ${index+1}</small></button>`;
    const combat=ensureCombatStats(fish),stage=getFishEvolutionStage(fish);
    const data=owner?`data-public-aquarium-owner="${safe(owner)}" data-public-aquarium-fish-id="${safe(fish.id)}"`:`data-aquarium-detail-id="${safe(fish.id)}"`;
    const aquariumGrade=gradeClasses[fish.grade]||"normal";
    return `<button class="aquarium-fish slot-${index+1} aquarium-grade-${aquariumGrade} ${fishEvolutionClass(fish)}" ${data} aria-label="${safe(fish.name)} 상세정보 보기"><i class="aquarium-aura"></i><span>${fishIcon(fish)}</span><div><small>${safe(fish.grade)}${stage?` · ${safe(getFishEvolutionLabel(fish))}`:""}</small><b>${safe(fish.name)}</b><em>⚔ ${compactNumber(combat.attack)} · ❤️ ${compactNumber(combat.maxHp)}</em></div></button>`;
  }

  function openAquarium(edit=state.aquariumEdit){
    ensureAllFishIds();state.aquariumEdit=!!edit;
    const displayed=getAquariumFishes(),slots=Array.from({length:5},(_,index)=>aquariumFishButton(displayed[index],index)).join("");
    let editor="";
    if(state.aquariumEdit){
      const list=sortedBucketList(),selected=new Set(normalizeAquariumFishIds(aquariumFishIds)),visible=list.slice(0,state.aquariumVisibleCount);
      const cards=visible.map(entry=>{const fish=entry.fish,active=selected.has(String(fish.id)),full=!active&&selected.size>=5,combat=ensureCombatStats(fish);return `<button type="button" class="aquarium-choice ${gradeClass(fish.grade)} ${active?"selected":""}" data-aquarium-select-id="${safe(fish.id)}" ${full?"disabled":""}><span>${fishIcon(fish)}</span><div><small>${safe(fish.grade)} · ${fish.size===null?"특별 개체":`${formatSize(fish.size)}cm`}</small><b>${safe(fish.name)}</b><em>⚔ ${compactNumber(combat.attack)} · ❤️ ${compactNumber(combat.maxHp)}</em></div><strong>${active?"전시 중":full?"5칸 사용 중":"전시"}</strong></button>`;}).join("");
      const more=visible.length<list.length?`<button class="boss-party-more" data-aquarium-more>물고기 더 보기 · ${visible.length.toLocaleString()} / ${list.length.toLocaleString()}</button>`:"";
      editor=`<section class="aquarium-editor"><header><div><small>수족관 전시</small><h3>전시할 물고기 선택</h3></div><b>${selected.size} / 5</b></header><p>전투·합성 본체·진화에는 사용할 수 있고, 판매·전송·합성 재료로 소모되는 행동은 보호됩니다.</p><div class="aquarium-choice-list">${cards||'<div class="fusion-empty">전시할 물고기가 없습니다.</div>'}</div>${more}<div class="dialog-actions"><button class="primary" data-aquarium-finish>전시 완료</button><button data-aquarium-clear ${selected.size?"":"disabled"}>모두 전시 해제</button></div></section>`;
    }
    openUiModal("나만의 수족관",`<div class="game-dialog aquarium-dialog"><section class="aquarium-hero"><div><small>MY AQUARIUM · ${displayed.length}/5</small><h2>${displayed.length?"나만의 물고기를 감상하세요":"첫 물고기를 전시해보세요"}</h2><p>물고기를 누르면 크기·별·능력치·특성을 확인할 수 있습니다.</p></div><div class="aquarium-hero-actions"><button data-aquarium-gallery>수족관 광장</button><button data-aquarium-edit>${state.aquariumEdit?"선택 계속하기":"전시 편집"}</button></div></section><div class="aquarium-tank"><div class="aquarium-light"></div><div class="aquarium-bubbles"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="aquarium-floor"><i></i><i></i><i></i></div>${slots}</div>${editor}</div>`);
  }

  function publicAquariumEntry(data,id=""){
    const user=data&&typeof data==="object"?data:{},game=user.gameState&&typeof user.gameState==="object"?user.gameState:{},summaryFish=Array.isArray(game.bucketSummary?.aquarium)?game.bucketSummary.aquarium.filter(Boolean):[],owned=Array.isArray(game.bucket)?game.bucket.filter(Boolean):[],ids=normalizeAquariumFishIds(game.aquariumFishIds),fishes=(summaryFish.length?summaryFish:ids.map(fishId=>owned.find(f=>String(f.id||"")===fishId)).filter(Boolean)).slice(0,5);
    return {owner:cleanNickname(user.nickname||id),title:String(user.title||game.equippedTitle||""),cosmetics:normalizeProfileCosmetics(game.profileCosmetics),fishes};
  }

  function aquariumGalleryCard(entry){
    const visual=pvpProfileVisual(entry.cosmetics),fishPreview=entry.fishes.map(f=>`<span class="${gradeClass(f.grade)}" title="${safe(f.name)}"><i>${fishIcon(f)}</i><em>${safe(f.grade)}</em></span>`).join("");
    return `<article class="aquarium-gallery-card"><div class="${visual.classes}" style="${visual.style}" data-aura-symbol="${safe(visual.aura)}"><span>${visual.avatar}</span></div><div class="aquarium-gallery-user"><small>${safe(entry.title?`[${entry.title}]`:"칭호 없음")}</small><b>${safe(entry.owner)}</b><div>${fishPreview}</div></div><button data-public-aquarium-owner="${safe(entry.owner)}">구경하기</button></article>`;
  }

  function renderAquariumGallery(entries=state.aquariumGalleryCache||[],message=""){
    const list=(entries||[]).filter(entry=>entry.owner&&entry.owner!==currentUser&&entry.fishes.length).slice(0,30),cards=list.map(aquariumGalleryCard).join("");
    openUiModal("수족관 광장",`<div class="game-dialog aquarium-gallery-dialog"><div class="dialog-summary"><div><small>수족관 광장</small><b>다른 선장의 수족관을 구경하세요</b><p>전시 물고기는 구경만 할 수 있으며 능력치와 진화 정보를 확인할 수 있습니다.</p></div><span>🫧</span></div><form id="aquariumSearchForm" class="aquarium-search"><input id="aquariumSearchNickname" maxlength="16" autocomplete="off" placeholder="닉네임으로 수족관 찾기"><button type="submit">검색</button></form>${message?`<div class="aquarium-gallery-message">${safe(message)}</div>`:""}<div class="aquarium-gallery-list">${cards||'<div class="fusion-empty">아직 공개된 다른 수족관이 없습니다.</div>'}</div><div class="dialog-actions"><button class="primary" data-ui-action="aquarium">내 수족관으로</button><button data-aquarium-gallery-refresh>새로고침</button></div></div>`);
  }

  async function openAquariumGallery(force=false){
    if(!force&&Array.isArray(state.aquariumGalleryCache)&&Date.now()-state.aquariumGalleryAt<60000)return renderAquariumGallery();
    openUiModal("수족관 광장",`<div class="game-dialog"><div class="dialog-summary"><div><small>수족관 광장</small><b>수족관을 불러오는 중...</b><p>전시 중인 선장만 목록에 표시합니다.</p></div><span>🫧</span></div></div>`);
    try{
      if(currentUser&&hasPendingLocalCloudChanges())await saveCloudData();
      const snapshot=await db.collection("users").limit(60).get(),entries=snapshot.docs.map(doc=>publicAquariumEntry(doc.data(),doc.id)).filter(entry=>entry.owner&&entry.fishes.length).sort((a,b)=>b.fishes.length-a.fishes.length||a.owner.localeCompare(b.owner,"ko"));
      state.aquariumGalleryCache=entries;state.aquariumGalleryAt=Date.now();renderAquariumGallery(entries);
    }catch(error){console.error(error);renderAquariumGallery([],"수족관 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");}
  }

  async function openPublicAquarium(owner){
    owner=cleanNickname(owner);if(!owner)return showToast("닉네임을 입력해주세요.");
    let entry=(state.aquariumGalleryCache||[]).find(item=>item.owner===owner)||null;
    if(!entry){
      openUiModal("수족관 찾기",`<div class="game-dialog"><div class="dialog-summary"><div><small>수족관 찾기</small><b>${safe(owner)} 수족관을 찾는 중...</b></div><span>🔎</span></div></div>`);
      try{const snap=await db.collection("users").doc(owner).get();if(!snap.exists)return renderAquariumGallery(state.aquariumGalleryCache||[],"존재하지 않는 닉네임입니다.");entry=publicAquariumEntry(snap.data(),owner);}catch(error){console.error(error);return renderAquariumGallery(state.aquariumGalleryCache||[],"수족관을 불러오지 못했습니다.");}
    }
    if(!entry.fishes.length)return renderAquariumGallery(state.aquariumGalleryCache||[],`${owner} 님은 아직 물고기를 전시하지 않았습니다.`);
    state.publicAquariumCurrent=entry;
    const slots=Array.from({length:5},(_,index)=>aquariumFishButton(entry.fishes[index],index,entry.owner)).join(""),visual=pvpProfileVisual(entry.cosmetics);
    openUiModal(`${entry.owner}의 수족관`,`<div class="game-dialog aquarium-dialog public-aquarium"><section class="aquarium-hero"><div class="aquarium-owner-head"><div class="${visual.classes}" style="${visual.style}" data-aura-symbol="${safe(visual.aura)}"><span>${visual.avatar}</span></div><div><small>선장 수족관 · ${entry.fishes.length}/5</small><h2>${safe(entry.owner)}${entry.owner===currentUser?" · 나":""}</h2><p>${safe(entry.title?`[${entry.title}]`:"장착 칭호 없음")} · 물고기를 눌러 상세정보 보기</p></div></div><button data-aquarium-gallery>광장으로</button></section><div class="aquarium-tank"><div class="aquarium-light"></div><div class="aquarium-bubbles"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="aquarium-floor"><i></i><i></i><i></i></div>${slots}</div></div>`);
  }

  function openPublicAquariumFishDetail(owner,fishId){
    const entry=state.publicAquariumCurrent?.owner===owner?state.publicAquariumCurrent:(state.aquariumGalleryCache||[]).find(item=>item.owner===owner),fish=entry?.fishes.find(f=>String(f.id||"")===String(fishId));if(!fish)return showToast("전시 물고기를 찾을 수 없습니다.");
    const combat=ensureCombatStats(fish),trait=getFishTrait(fish),stage=getFishEvolutionStage(fish),fusionCount=getFishFusionCount(fish);
    openUiModal(`${owner}의 ${fish.name}`,`<div class="game-dialog public-fish-detail"><div class="dialog-summary fish-detail-summary ${gradeClass(fish.grade)} ${fishEvolutionClass(fish)}"><div><small>${safe(owner)}의 수족관 · ${safe(fish.grade)}${stage?` · ${safe(getFishEvolutionLabel(fish))}`:""}</small><b>${safe(fish.name)} ${fishEvolutionBadge(fish)}</b><p>${fish.size===null?"특별 개체":`${formatSize(fish.size)}cm`} · 합성 ${fusionCount}회</p></div><span>${fishIcon(fish)}</span></div><div class="dialog-card-grid"><article class="dialog-card"><small>공격력 ${combatStars(combat,"attack")}</small><strong>${Number(combat.attack).toLocaleString()}</strong></article><article class="dialog-card"><small>체력 ${combatStars(combat,"hp")}</small><strong>${Number(combat.hp).toLocaleString()} / ${Number(combat.maxHp).toLocaleString()}</strong></article><article class="dialog-card"><small>회피율</small><strong>${Number(combat.dodge).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 확률</small><strong>${Number(combat.critRate).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 피해</small><strong>${Number(combat.critDamage).toFixed(0)}%</strong></article></div>${trait?`<article class="dialog-card ${gradeClass(fish.grade)}"><small>고유 특성</small><h3>${safe(trait.name)}</h3><p>${safe(trait.desc)}</p></article>`:""}<div class="dialog-actions"><button class="primary" data-public-aquarium-owner="${safe(owner)}">수족관으로 돌아가기</button><button data-aquarium-gallery>수족관 광장</button></div></div>`);
  }

  function openSettings(){
    openUiModal("설정",`<div class="game-dialog settings-dialog"><div class="dialog-summary"><div><small>게임 설정</small><b>게임 환경 설정</b><p>설정은 이 기기에 저장됩니다.</p></div><span>⚙️</span></div><article class="setting-row"><div><span>🌅</span><div><h3>실제 시간 낚시터</h3><p>현재 시간에 맞춰 해·노을·달·별과 바다 색상이 바뀝니다.</p></div></div><button data-feedback-toggle="timeBackground" class="${feedbackSettings.timeBackground?"on":"off"}">${feedbackSettings.timeBackground?"켜짐":"꺼짐"}</button></article><article class="setting-row"><div><span>🔊</span><div><h3>효과음</h3><p>낚싯줄 던지기·판정·획득·보스 공격·치명타·승리 효과음</p></div></div><button data-feedback-toggle="sound" class="${feedbackSettings.sound?"on":"off"}">${feedbackSettings.sound?"켜짐":"꺼짐"}</button></article><article class="setting-row"><div><span>📳</span><div><h3>모바일 진동</h3><p>입질과 치명타 순간의 진동</p></div></div><button data-feedback-toggle="vibration" class="${feedbackSettings.vibration?"on":"off"}">${feedbackSettings.vibration?"켜짐":"꺼짐"}</button></article></div>`);
  }

  function openRecoveryBattleConfirm(fishes=getPreparedRecoveryFishes()){
    const list=(fishes||[]).map(f=>{const c=ensureCombatStats(f),left=Math.max(0,Number(c.stunUntil||0)-Date.now()),hpRate=Math.max(0,Math.min(100,Number(c.hp||0)/Math.max(1,Number(c.maxHp||1))*100));return `<article class="recovery-confirm-fish ${gradeClass(f.grade)}"><span>${fishIcon(f)}</span><div><small>${safe(f.grade)} · ${left?formatRemain(left):"회복 진행 중"}</small><b>${safe(f.name)}</b><i><em style="width:${hpRate}%"></em></i><p>❤️ ${combatHpNumber(c.hp)} / ${combatHpNumber(c.maxHp)} · ${hpRate.toFixed(1)}%</p></div></article>`;}).join("");
    openUiModal("회복 중인 물고기",`<div class="game-dialog recovery-confirm-dialog"><div class="dialog-summary warning"><div><small>파티 상태</small><b>부상 상태로 출전할까요?</b><p>현재 체력 그대로 보스전에 참가하며, 전투 후 다시 회복 시간이 적용될 수 있습니다.</p></div><span>❤️‍🩹</span></div><div class="recovery-confirm-list">${list}</div><div class="dialog-actions"><button class="primary" data-boss-confirm>현재 체력으로 시작</button><button onclick="closeModal()">파티 다시 선택</button></div></div>`);
  }
  globalThis.openRecoveryBattleConfirm=openRecoveryBattleConfirm;

  function openMyInfo(){
    if(!currentUser)return openUiModal("내정보",`<div class="game-dialog"><div class="dialog-summary"><div><small>선장 정보</small><b>로그인이 필요합니다.</b></div><span>🪪</span></div></div>`);
    const visual=pvpProfileVisual(profileCosmetics),bossClears=Object.values(bossProgress?.difficultyClears||{}).reduce((sum,entry)=>sum+Object.values(entry||{}).filter(Boolean).length,0),achievementCount=getCurrentCompletedAchievements().length,collectionCount=Object.keys(collection||{}).length,collectionTotal=allFishCount();
    const fishPower=fish=>{const c=ensureCombatStats(fish);return Math.floor(c.attack*(1+Number(c.critRate||0)/100*Math.max(0,Number(c.critDamage||150)/100-1))+c.maxHp*.2);},combatTeam=bucket.filter(f=>f&&f.grade!=="쓰레기").sort((a,b)=>fishPower(b)-fishPower(a)).slice(0,3),combatPower=combatTeam.reduce((sum,fish)=>sum+fishPower(fish),0),teamHtml=combatTeam.map(f=>`<article class="my-info-team-fish ${gradeClass(f.grade)}"><span>${fishIcon(f)}</span><div><small>${safe(f.grade)}</small><b>${safe(f.name)}</b><em>전투력 ${compactNumber(fishPower(f))}</em></div></article>`).join("");
    const chances=getCurrentGradeChances(),chanceHtml=chances.map(item=>`<article class="my-info-chance ${gradeClass(item.name)}"><div><span>${safe(item.name)}</span><b>${item.chance.toFixed(["영원","공허"].includes(item.name)?2:1)}%</b></div><i><em style="width:${Math.max(item.chance>0?2:0,Math.min(100,item.chance))}%"></em></i></article>`).join("");
    const maxRod=getCurrentPlayableMaxRod(),atRodCap=rodLevel>=maxRod,upgradeLabel=rodLevel>=MAX_ROD?"최대 레벨":atRodCap?"보스를 처치하면 열림":`${getUpgradeSuccessRate(rodLevel).toFixed(1)}% · ${formatMoney(getUpgradeCost(rodLevel))}`;
    openUiModal("내정보",`<div class="game-dialog my-info-dialog"><section class="my-info-profile"><div class="${visual.classes}" style="${visual.style}" data-aura-symbol="${safe(visual.aura)}"><span>${visual.avatar}</span></div><div><small>나의 선장</small><h2>${safe(currentUser)}</h2><p>${safe(getCurrentTitle()?`[${getCurrentTitle()}] 장착 중`:"장착 칭호 없음")}</p></div><strong>${formatMoney(money)}</strong></section><div class="my-info-grid"><article><small>낚싯대</small><b>Lv.${Number(rodLevel||1).toLocaleString()} / ${MAX_ROD.toLocaleString()}</b></article><article><small>총 수익</small><b>${formatMoney(totalEarned)}</b></article><article><small>총 낚시</small><b>${Number(totalFishingCount||0).toLocaleString()}회</b></article><article><small>보유 물고기</small><b>${bucket.length.toLocaleString()}마리</b></article><article><small>도감</small><b>${collectionCount.toLocaleString()} / ${collectionTotal.toLocaleString()}</b></article><article><small>보스·업적</small><b>${bossClears.toLocaleString()}회 · ${achievementCount.toLocaleString()}개</b></article></div><section class="my-info-dashboard"><article class="my-info-panel"><header><div><small>PVP 전투력</small><h3>최강 물고기 3마리</h3></div><strong>${compactNumber(combatPower)}</strong></header><div class="my-info-team">${teamHtml||'<div class="fusion-empty">전투 가능한 물고기가 없습니다.</div>'}</div></article><article class="my-info-panel"><header><div><small>낚싯대 강화</small><h3>다음 강화</h3></div><strong>Lv.${Math.min(MAX_ROD,rodLevel+1).toLocaleString()}</strong></header><div class="my-info-upgrade"><i><em style="width:${Math.min(100,rodLevel/MAX_ROD*100)}%"></em></i><b>${upgradeLabel}</b><small>현재 강화 가능 Lv.${maxRod.toLocaleString()}</small></div></article></section><section class="my-info-growth"><h3>연구·훈련 현황</h3><div><span>🎣 낚시 연구 Lv.${Number(researchLevels?.fishing||0)} · 시간 -${getFishingTimeReduction()}%</span><span>💰 감정 연구 Lv.${Number(researchLevels?.appraisal||0)} · 판매 +${getAppraisalBonus()}%</span><span>⚔ 공격 훈련 Lv.${Number(trainingLevels?.attack||0)} · +${getTrainingAttackBonus()}%</span><span>❤️ 체력 훈련 Lv.${Number(trainingLevels?.hp||0)} · +${getTrainingHpBonus()}%</span><span>💥 치명타 피해 Lv.${Number(trainingLevels?.critDamage||0)} · +${getTrainingCritDamageBonus()}%</span><span>💨 일반~신화 도주 ${getEscapeChance().toFixed(1)}%</span></div></section><section class="my-info-panel my-info-chances"><header><div><small>등급 등장 확률</small><h3>현재 등급 등장 확률</h3></div><strong>Lv.${rodLevel.toLocaleString()}</strong></header><div>${chanceHtml}</div></section><div class="dialog-actions my-info-actions"><button data-ui-action="aquarium">나만의 수족관</button><button data-ui-action="cosmetics">프로필 꾸미기</button><button data-ui-action="titles">칭호 설정</button><button data-ui-action="settings">환경 설정</button></div></div>`);
  }
  globalThis.openFishingLifeMyInfo=openMyInfo;

  function openBattleHistory(type="boss"){
    type=type==="pvp"?"pvp":"boss";battleHistory=normalizeBattleHistory(battleHistory);
    const records=battleHistory[type]||[],tabs=`<div class="history-tabs"><button data-history-tab="boss" class="${type==="boss"?"active":""}">🐲 보스 최근 ${battleHistory.boss.length}/5</button><button data-history-tab="pvp" class="${type==="pvp"?"active":""}">⚔️ 1대1 최근 ${battleHistory.pvp.length}/5</button></div>`;
    const cards=records.map((record,index)=>{const replayInfo=`장면 ${Number(record.frames?.length||0).toLocaleString()}개${record.replayComplete===false?" · 일부 장면 불러오기 실패":record.cloudReplayTrimmed?" · 구버전 축약 기록":""}`;if(type==="boss"){const success=record.result==="처치 성공";return `<article class="history-card ${gradeClass(record.boss?.grade)}"><span>${bossSymbols[record.boss?.id]||"🐲"}</span><div><small>${safe(formatDateTime(record.createdAtMillis))} · ${safe(record.boss?.difficulty||"일반")} · ${safe(replayInfo)}</small><b>${safe(record.boss?.name||"보스")} · ${success?"승리":"패배"}</b><p>총 피해 ${Number(record.totalDamage||0).toLocaleString()} · ${safe(record.rewardDrop||"보상 없음")} × ${Number(record.rewardDropCount||0).toLocaleString()}</p></div><button data-battle-history-index="${index}" data-battle-history-type="boss" ${record.frames?.length?"":"disabled"}>다시 보기</button></article>`;}const opponent=record.left?.name===currentUser?record.right:record.left,won=record.winnerName===currentUser,draw=!record.winnerName;return `<article class="history-card pvp"><span>⚔️</span><div><small>${safe(formatDateTime(record.createdAtMillis))} · ${Number(record.totalTurns||0)}턴 · ${safe(replayInfo)}</small><b>VS ${safe(opponent?.name||"상대")} · ${draw?"무승부":won?"승리":"패배"}</b><p>${safe(record.summary||"1대1 전투 결과")}</p></div><button data-battle-history-index="${index}" data-battle-history-type="pvp" ${record.frames?.length?"":"disabled"}>다시 보기</button></article>`;}).join("");
    openUiModal("전투 기록",`<div class="game-dialog battle-history-dialog"><div class="dialog-summary"><div><small>최근 전투 기록</small><b>최근 전투를 다시 확인하세요</b><p>보스와 1대1 기록은 각각 최신 5회까지 저장됩니다.</p></div><span>📼</span></div>${tabs}<div class="history-list">${cards||`<div class="fusion-empty">아직 저장된 ${type==="boss"?"보스":"1대1"} 전투 기록이 없습니다.</div>`}</div></div>`);
  }

  function hidePvpRequestAlert(){const host=$("#pvpRequestAlert");if(host){host.classList.remove("show");host.hidden=true;host.replaceChildren();}state.pendingPvpRequest=null;}
  function showPvpRequestAlert(data){
    const host=$("#pvpRequestAlert");if(!host)return;
    state.pendingPvpRequest=data;host.hidden=false;host.innerHTML=`<div><small>실시간 대전 신청</small><b>${safe(data.sender||data.from||"다른 선장")} 님의 대전 신청</b><p>낚시를 계속하면서 바로 수락하거나 거절할 수 있습니다.</p></div><div><button data-pvp-alert-accept>수락</button><button data-pvp-alert-reject>거절</button></div>`;requestAnimationFrame(()=>host.classList.add("show"));playGameSound("timing","GREAT");gameVibrate("bite");
  }
  globalThis.showPvpRequestAlert=showPvpRequestAlert;
  globalThis.hidePvpRequestAlert=hidePvpRequestAlert;

  function renderRankingView(type="menu"){
    const sections=state.rankingSections;if(!sections)return openRanking();
    const choices=[
      {id:"money",icon:"💰",eyebrow:"WEALTH",title:"보유 골드",detail:"현재 보유 자산 TOP 20"},
      {id:"level",icon:"🎣",eyebrow:"낚싯대 레벨",title:"낚싯대 레벨",detail:"낚싯대 성장 TOP 20"},
      {id:"pvp",icon:"⚔️",eyebrow:"PVP 전투력",title:"PVP 전투력",detail:"출전 물고기 3마리 합산"}
    ];
    const menu=`<div class="ranking-choice-grid">${choices.map(choice=>`<button class="ranking-choice ${type===choice.id?"active":""}" data-ranking-type="${choice.id}"><span>${choice.icon}</span><div><small>${choice.eyebrow}</small><b>${choice.title}</b><p>${choice.detail}</p></div><em>보기</em></button>`).join("")}</div>`;
    if(type==="menu")return openUiModal("랭킹",`<div class="game-dialog ranking-dialog"><div class="dialog-summary"><div><small>온라인 랭킹</small><b>확인할 랭킹을 선택하세요</b><p>세 순위를 나눠서 필요한 목록만 불러옵니다.</p></div><span>🏆</span></div>${menu}</div>`);
    const selected=sections[type]||sections.pvp,title=type==="money"?"보유 골드 랭킹":type==="level"?"낚싯대 레벨 랭킹":"PVP 총합 전투력 랭킹";
    return openUiModal("랭킹",`<div class="game-dialog ranking-dialog"><div class="dialog-summary"><div><small>${selected.eyebrow}</small><b>${title}</b><p>${selected.detail}</p></div><span>${selected.icon}</span></div>${menu}<div class="ranking-list ${type==="pvp"?"ranking-pvp-list":""}">${selected.rows||'<div class="fusion-empty">등록된 순위가 없습니다.</div>'}</div></div>`);
  }

  async function openRanking() {
    if(location.hostname==="127.0.0.1"&&new URLSearchParams(location.search).has("rankingDemo")){
      const demoRows=(label,value)=>["바다왕","심해선장","로컬테스터"].map((name,index)=>`<article class="ranking-row ${name==="로컬테스터"?"is-me":""}"><strong class="ranking-position">${["🥇","🥈","🥉"][index]}</strong><div class="profile-preview ranking-avatar"><span>⚓</span></div><div class="ranking-user"><small>[테스트 선장]</small><b>${name}${name==="로컬테스터"?" · 나":""}</b><em>${label}</em></div><strong class="ranking-value">${index?value.replace(/0(?=\D*$)/,String(9-index)):value}</strong></article>`).join("");
      state.rankingSections={money:{icon:"💰",eyebrow:"보유 골드 순위",detail:"현재 보유 골드를 기준으로 정렬합니다.",rows:demoRows("누적 자산 순위","10조")},level:{icon:"🎣",eyebrow:"낚싯대 순위",detail:"현재 낚싯대 레벨을 기준으로 정렬합니다.",rows:demoRows("낚싯대 성장 순위","Lv.2000")},pvp:{icon:"⚔️",eyebrow:"PVP 전투력 순위",detail:"출전 물고기 3마리의 전투력을 합산합니다.",rows:demoRows("PVP 총합 전투력","9.8억")}};
      return renderRankingView("menu");
    }
    openUiModal("랭킹", `<div class="game-dialog"><div class="dialog-summary"><div><small>온라인 랭킹</small><b>순위를 불러오는 중...</b></div><span>🏆</span></div></div>`);
    try {
      if (currentUser) await saveCloudData();
      const [moneySnap, levelSnap,usersSnap] = await Promise.all([db.collection("users").orderBy("money","desc").limit(20).get(), db.collection("users").orderBy("rodLevel","desc").limit(20).get(),db.collection("users").limit(100).get()]);
      const section = (docs,type) => docs.map((doc,index) => {
        const u=doc.data(),cosmetics=normalizeProfileCosmetics(u.gameState?.profileCosmetics),borderBoss=bossList.find(boss=>boss.id===cosmetics.border),auraBoss=bossList.find(boss=>boss.id===cosmetics.aura),background=cosmeticGrades[cosmetics.background];
        const value=type==="money"?formatMoney(u.money||0):`Lv.${u.rodLevel||1}`,avatar=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓",medal=index===0?"🥇":index===1?"🥈":index===2?"🥉":"";
        const avatarClass=`profile-preview ranking-avatar ${borderBoss?"has-profile-border":""} ${auraBoss?"has-profile-aura":""} ${getProfileAuraClass(auraBoss?.id)}`;
        const avatarStyle=`--profile-border-color:${borderBoss?.color||"#4ee4ce"};--profile-aura-color:${auraBoss?.color||"#4ee4ce"}`;
        const rowStyle=background?`--ranking-profile-color:${background.primary};--ranking-profile-secondary:${background.secondary}`:"";
        return `<article class="ranking-row ${background?"has-profile-background":""} ${u.nickname===currentUser?"is-me":""}" style="${rowStyle}"><strong class="ranking-position">${medal||`#${index+1}`}</strong><div class="${avatarClass}" style="${avatarStyle}" data-aura-symbol="${safe(auraBoss?bossSymbols[auraBoss.id]||"✦":"")}"><span>${avatar}</span></div><div class="ranking-user"><small>${safe(u.title?`[${u.title}]`:"칭호 없음")}</small><b>${safe(u.nickname||"낚시꾼")}${u.nickname===currentUser?" · 나":""}</b><em>${type==="money"?"누적 자산 순위":"낚싯대 성장 순위"}</em></div><strong class="ranking-value">${value}</strong></article>`;
      }).join("");
      const fishPower=fish=>{const c=fish?.combat||{},attack=Math.max(0,Number(c.attack||0)),maxHp=Math.max(0,Number(c.maxHp||c.hp||0)),critRate=Math.max(0,Number(c.critRate||0)),critDamage=Math.max(100,Number(c.critDamage||150));return Math.floor(attack*(1+critRate/100*Math.max(0,critDamage/100-1))+maxHp*.2);};
      const pvpEntries=usersSnap.docs.map(doc=>{const u=doc.data(),game=u.gameState||{},summaryTeam=Array.isArray(game.bucketSummary?.pvp)?game.bucketSummary.pvp.filter(Boolean):[],fishes=Array.isArray(game.bucket)?game.bucket.filter(f=>f&&f.grade!=="쓰레기"&&f.combat):[],ids=Array.isArray(game.partyPresets?.pvp)?game.partyPresets.pvp.map(String):[];let team=summaryTeam.length?summaryTeam.slice(0,3):ids.map(id=>fishes.find(f=>String(f.id||"")===id)).filter(Boolean).slice(0,3);if(team.length<3)team=[...fishes].sort((a,b)=>fishPower(b)-fishPower(a)).slice(0,3);return {u,team,power:team.reduce((sum,fish)=>sum+fishPower(fish),0)};}).filter(entry=>entry.team.length).sort((a,b)=>b.power-a.power).slice(0,20);
      const pvpRows=pvpEntries.map((entry,index)=>{const {u,team,power}=entry,cosmetics=normalizeProfileCosmetics(u.gameState?.profileCosmetics),borderBoss=bossList.find(boss=>boss.id===cosmetics.border),auraBoss=bossList.find(boss=>boss.id===cosmetics.aura),background=cosmeticGrades[cosmetics.background],avatar=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓",medal=index===0?"🥇":index===1?"🥈":index===2?"🥉":"",avatarClass=`profile-preview ranking-avatar ${borderBoss?"has-profile-border":""} ${auraBoss?"has-profile-aura":""} ${getProfileAuraClass(auraBoss?.id)}`,avatarStyle=`--profile-border-color:${borderBoss?.color||"#4ee4ce"};--profile-aura-color:${auraBoss?.color||"#4ee4ce"}`,rowStyle=background?`--ranking-profile-color:${background.primary};--ranking-profile-secondary:${background.secondary}`:"";const fishCards=team.map(f=>`<span class="ranking-pvp-fish ${gradeClass(f.grade)}"><i>${fishIcon(f)}</i><em>${safe(f.name)}</em></span>`).join("");return `<article class="ranking-row ranking-pvp-row ${background?"has-profile-background":""} ${u.nickname===currentUser?"is-me":""}" style="${rowStyle}"><strong class="ranking-position">${medal||`#${index+1}`}</strong><div class="${avatarClass}" style="${avatarStyle}" data-aura-symbol="${safe(auraBoss?bossSymbols[auraBoss.id]||"✦":"")}"><span>${avatar}</span></div><div class="ranking-user"><small>${safe(u.title?`[${u.title}]`:"칭호 없음")}</small><b>${safe(u.nickname||"낚시꾼")}${u.nickname===currentUser?" · 나":""}</b><div class="ranking-pvp-team">${fishCards}</div></div><strong class="ranking-value"><small>총합 전투력</small>${compactNumber(power)}</strong></article>`;}).join("");
      state.rankingSections={money:{icon:"💰",eyebrow:"보유 골드 순위",detail:"현재 보유 골드를 기준으로 정렬합니다.",rows:section(moneySnap.docs,"money")},level:{icon:"🎣",eyebrow:"낚싯대 순위",detail:"현재 낚싯대 레벨을 기준으로 정렬합니다.",rows:section(levelSnap.docs,"level")},pvp:{icon:"⚔️",eyebrow:"PVP 전투력 순위",detail:"저장 파티 3마리, 저장 파티가 없으면 전투력 상위 3마리를 합산합니다.",rows:pvpRows}};
      renderRankingView("menu");
    } catch (error) { console.error(error); showToast("랭킹을 불러오지 못했습니다."); closeModal(); }
  }

  async function openPvpPanel() {
    if (!currentUser) return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>1대1 대전</small><b>로그인이 필요합니다.</b></div><span>⚔️</span></div></div>`);
    recoverStunnedFish();
    const localPvpDemo=location.hostname==="127.0.0.1"&&new URLSearchParams(location.search).has("pvpPartyDemo");
    const active = localPvpDemo?{opponent:"로컬 상대",status:"accepted"}:await getMyActivePvp();
    if (!active) return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>1대1 대전</small><b>새로운 상대에게 도전하세요</b></div><span>⚔️</span></div><div class="dialog-form"><label for="pvpNickname">상대 닉네임</label><input id="pvpNickname" maxlength="16" placeholder="닉네임"><button data-pvp-request>대전 신청</button></div></div>`);
    if (active.status === "requested") {
      const incoming = active.requester !== currentUser;
      return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>대전 신청 ${incoming ? "도착" : "전송 완료"}</small><b>VS ${safe(active.opponent || "상대")}</b></div><span>⚔️</span></div><div class="dialog-actions">${incoming ? `<button class="primary" data-pvp-accept>수락</button><button data-pvp-reject>거절</button>` : ""}<button data-pvp-cancel>대전 취소</button></div></div>`);
    }
    if(active.status==="accepted"&&active.ready){
      return openUiModal("대전 준비 완료",`<div class="game-dialog pvp-ready-dialog"><div class="dialog-summary"><div><small>대전 준비 완료</small><b>VS ${safe(active.opponent||"상대")}</b><p>내 출전 파티 준비가 끝났습니다. 상대가 준비를 마치면 자동으로 전투가 시작됩니다.</p></div><span>✅</span></div><div class="pvp-ready-pulse"><i></i><b>상대 준비 대기 중</b><small>이 화면을 닫지 않아도 결과가 자동으로 표시됩니다.</small></div><div class="dialog-actions"><button data-pvp-cancel>대전 취소</button></div></div>`);
    }
    const sortedPvpBucket=sortedBucketList(),pvpDisplayNumberMap=new Map(sortedPvpBucket.map((entry,index)=>[entry.originalIndex,index+1])),gradeRank=Object.fromEntries(grades.map((grade,index)=>[grade.name,index]));
    const list=bucket.map((fish,originalIndex)=>{if(!fish||fish.grade==="쓰레기")return null;const combat=ensureCombatStats(fish),power=combat.attack*(1+combat.critRate/100*Math.max(0,combat.critDamage/100-1))+combat.maxHp*.2;return {fish,originalIndex,combat,power};}).filter(Boolean).sort((a,b)=>{
      if(state.pvpPartySortOrder==="공격력")return b.combat.attack-a.combat.attack||b.originalIndex-a.originalIndex;
      if(state.pvpPartySortOrder==="체력")return b.combat.maxHp-a.combat.maxHp||b.originalIndex-a.originalIndex;
      if(state.pvpPartySortOrder==="등급")return (gradeRank[b.fish.grade]??-1)-(gradeRank[a.fish.grade]??-1)||b.power-a.power;
      if(state.pvpPartySortOrder==="최근 획득")return b.originalIndex-a.originalIndex;
      return b.power-a.power||b.originalIndex-a.originalIndex;
    });
    const visibleEntries=list.slice(0,state.pvpVisibleCount),visibleIds=new Set(visibleEntries.map(entry=>entry.fish.id));
    list.forEach(entry=>{if(pvpPrepIndexes.includes(entry.originalIndex)&&!visibleIds.has(entry.fish.id)){visibleEntries.push(entry);visibleIds.add(entry.fish.id);}});
    const fishCards=visibleEntries.map(entry=>{const selected=pvpPrepIndexes.includes(entry.originalIndex),f=entry.fish,c=entry.combat,no=pvpDisplayNumberMap.get(entry.originalIndex),knockedOut=!!c.knockedOut||c.status==="기절"||c.hp<=0;return `<article class="boss-party-fish ${gradeClass(f.grade)} ${fishEvolutionClass(f)} ${selected?"selected":""} ${knockedOut?"knocked-out":""}"><span>${fishIcon(f)}</span><div><b>${safe(f.name)} ${fishEvolutionBadge(f)}</b><small>⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.hp)} / ${compactNumber(c.maxHp)}${knockedOut?" · 기절":""}</small></div><button data-pvp-fish="${no}" data-selected="${selected?1:0}" ${knockedOut?"disabled":""}>${knockedOut?"기절":selected?"해제":"참가"}</button></article>`;}).join("");
    const sortButtons=["전투력","공격력","체력","등급","최근 획득"].map(order=>`<button data-pvp-party-sort="${order}" class="${state.pvpPartySortOrder===order?"active":""}">${order}</button>`).join(""),more=list.length>visibleIds.size?`<button class="boss-party-more" data-pvp-party-more>물고기 더 보기 · ${visibleIds.size.toLocaleString()} / ${list.length.toLocaleString()}</button>`:"";
    openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>VS ${safe(active.opponent || "상대")}</small><b>출전 파티 ${pvpPrepIndexes.length} / 3</b></div><span>⚔️</span></div><div class="party-preset-quick"><div><small>저장 파티</small><b>PVP 파티 ${partyPresets.pvp.length} / 3</b></div><button data-party-preset-load="pvp" ${partyPresets.pvp.length?"":"disabled"}>${partyPresets.pvp.length?"PVP 파티 불러오기":"저장된 파티 없음"}</button></div><div class="boss-party-sort"><small>출전 물고기 정렬</small><div>${sortButtons}</div></div><div class="boss-party-list">${fishCards}</div>${more}<div class="dialog-actions"><button class="primary" data-pvp-ready>준비 완료</button><button data-pvp-cancel>대전 취소</button></div></div>`);
  }
  globalThis.openPvpPanel=openPvpPanel;

  function fusionProgressHtml(fish){
    const count=getFishFusionCount(fish),stage=getFishEvolutionStage(fish),progress=Math.min(100,count/15*100);
    return `<div class="fusion-progress"><div class="fusion-progress-head"><span>합성 진행도</span><b>${count.toLocaleString()}회${stage===3?" · 최종 진화 완료":""}</b></div><div class="fusion-progress-track"><i style="width:${progress}%"></i><span style="left:20%" class="${count>=3?"reached":""}">3</span><span style="left:46.666%" class="${count>=7?"reached":""}">7</span><span style="left:100%" class="${count>=15?"reached":""}">15</span></div><div class="fusion-stage-row"><small class="${stage>=1?"done":""}">1차 진화</small><small class="${stage>=2?"done":""}">2차 진화</small><small class="${stage>=3?"done":""}">최종 진화</small></div></div>`;
  }

  function openFusionMainPicker(filterName=""){
    ensureAllFishIds();
    const fishes=sortedBucketList().filter(entry=>entry.fish.grade!=="쓰레기"&&(!filterName||entry.fish.name===filterName));
    const cards=fishes.map(entry=>{const f=entry.fish,c=ensureCombatStats(f),designated=isFusionMainFish(f),active=f.id===fusionMainFishId;return `<article class="selection-fish ${gradeClass(f.grade)} ${fishEvolutionClass(f)} ${designated?"selected":""} ${active?"active-main":""}"><span>${fishIcon(f)}</span><div><b>${safe(f.name)} ${fishEvolutionBadge(f)}</b><small>${safe(f.grade)} · ⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.maxHp)} · 합성 ${getFishFusionCount(f)}회${designated?" · 이 어종의 본체":""}</small></div><button data-fusion-main-id="${safe(f.id)}">${designated?"본체 열기":"본체 설정"}</button></article>`;}).join("");
    openUiModal(filterName?`${filterName} 본체 선택`:"합성 본체 선택",`<div class="game-dialog fusion-dialog"><div class="dialog-summary"><div><small>어종별 본체 선택</small><b>${filterName?`${safe(filterName)} 본체를 선택하세요`:"어종마다 본체를 1마리씩 설정하세요"}</b><p>같은 이름 안에서는 본체가 하나이며, 다른 어종 본체는 그대로 유지됩니다.</p></div><span>🧬</span></div><div class="selection-fish-list">${cards||`<div class="fusion-empty">전투 가능한 물고기가 없습니다.</div>`}</div></div>`);
  }

  function openFusionLab(){
    const main=getFusionMainFish();
    if(!main)return openFusionMainPicker();
    const stateData=ensureFishFusionState(main),combat=ensureCombatStats(main),evolution=getFishEvolutionDetails(main);
    const candidates=getFusionMaterialCandidates(main);
    const validIds=new Set(candidates.filter(entry=>!entry.reason).map(entry=>entry.fish.id));
    state.fusionMaterialIds=state.fusionMaterialIds.filter(id=>validIds.has(id)).slice(0,FUSION_BATCH_LIMIT);
    const cards=candidates.map(entry=>{const f=entry.fish,c=ensureCombatStats(f),selected=state.fusionMaterialIds.includes(f.id),disabled=!!entry.reason;return `<article class="selection-fish fusion-material ${gradeClass(f.grade)} ${fishEvolutionClass(f)} ${selected?"selected":""} ${disabled?"disabled":""}"><span>${fishIcon(f)}</span><div><b>${safe(f.name)} ${fishEvolutionBadge(f)}</b><small>⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.maxHp)}${entry.reason?` · ${safe(entry.reason)}`:` · 전이 ⚔ ${compactNumber(Math.max(1,Math.floor(getFishPermanentStats(f).attack*.2)))} / ❤️ ${compactNumber(Math.max(1,Math.floor(getFishPermanentStats(f).maxHp*.2)))}`}</small></div><button data-fusion-material-id="${safe(f.id)}" ${disabled?"disabled":""}>${disabled?"사용 불가":selected?"선택 해제":"재료 선택"}</button></article>`;}).join("");
    const preview=state.fusionMaterialIds.length?calculateFishFusionPreview(main.id,state.fusionMaterialIds):null;
    const nextLabel=evolution.complete?"최종 진화 완료":`${evolution.nextStage===1?"1차":evolution.nextStage===2?"2차":"최종"} 진화`;
    const previewHtml=preview?.ok?`<div class="fusion-preview-stats"><article><small>공격력</small><b>${compactNumber(preview.beforeAttack)} → ${compactNumber(preview.afterAttack)}</b><em>+${compactNumber(preview.afterAttack-preview.beforeAttack)}</em></article><article><small>최대 체력</small><b>${compactNumber(preview.beforeMaxHp)} → ${compactNumber(preview.afterMaxHp)}</b><em>+${compactNumber(preview.afterMaxHp-preview.beforeMaxHp)}</em></article><article><small>합성 횟수</small><b>${preview.countBefore} → ${preview.countAfter}</b><em>전이율 20%</em></article><article><small>합성 비용</small><b>${formatMoney(preview.cost)}</b><em>${preview.canAfford?"합성 가능":`${formatMoney(preview.cost-money)} 부족`}</em></article></div>`:`<div class="fusion-preview-empty">같은 이름의 재료를 최대 5마리 선택하면 증가량이 표시됩니다.</div>`;
    const evolutionPreviewHtml=evolution.complete?`<div class="evolution-complete-note">최종 진화 적용 완료 · 본체 최초 기준 공격력·최대 체력 5배 + 합성 누적 전이</div>`:`<div class="fusion-preview-stats evolution-preview-stats"><article><small>진화 공격력</small><b>${compactNumber(evolution.beforeAttack)} → ${compactNumber(evolution.afterAttack)}</b><em>+${compactNumber(evolution.attackGain)} · 본체 기준 ${evolution.currentMultiplier}배 → ${evolution.nextMultiplier}배</em></article><article><small>진화 최대 체력</small><b>${compactNumber(evolution.beforeMaxHp)} → ${compactNumber(evolution.afterMaxHp)}</b><em>+${compactNumber(evolution.hpGain)} · 합성 누적 전이량과 별도 계산</em></article><article class="evolution-base-stat"><small>고정된 본체 기준 수치</small><b>⚔ ${compactNumber(evolution.mainBaseAttack)} · ❤️ ${compactNumber(evolution.mainBaseMaxHp)}</b><em>본체를 해제·재설정해도 바뀌지 않음</em></article></div>`;
    openUiModal("합성·진화",`<div class="game-dialog fusion-dialog"><div class="fusion-lab-grid"><section class="fusion-main-panel ${gradeClass(main.grade)} ${fishEvolutionClass(main)}"><small>합성 본체 · ${safe(getFishEvolutionLabel(main))}</small><div class="fusion-main-icon">${fishIcon(main)}</div><h2>${safe(main.name)} ${fishEvolutionBadge(main)}</h2><p>${safe(main.grade)} · 이 어종의 본체 · 합성 ${stateData.count}회 · 전이율 20% 고정</p><div class="fusion-main-stats"><span>⚔ ${compactNumber(combat.attack)}</span><span>❤️ ${compactNumber(combat.maxHp)}</span></div>${fusionProgressHtml(main)}<div class="fusion-main-actions"><button data-fusion-change-main>같은 어종 본체 변경</button><button data-fusion-clear-main="${safe(main.id)}">본체 해제</button></div></section><section class="fusion-material-panel"><header><div><small>같은 물고기만 선택</small><h3>같은 물고기 재료</h3></div><b>${state.fusionMaterialIds.length} / ${FUSION_BATCH_LIMIT}</b></header><div class="selection-fish-list">${cards||`<div class="fusion-empty">합성할 수 있는 같은 물고기가 없습니다.</div>`}</div></section><section class="fusion-result-panel"><small>합성 결과 미리보기</small><h3>합성 결과</h3>${previewHtml}<div class="fusion-rule-note">재료의 영구 공격력·체력 20%만 전이 · 회피·치명타·별·특성은 전이되지 않음</div><button class="dialog-primary" data-fusion-submit ${!preview?.ok||!preview.canAfford?"disabled":""}>${preview?.ok&&!preview.canAfford?"골드 부족":"합성하기"}</button><div class="evolution-ready ${evolution.unlocked&&!evolution.complete?"ready":""}"><small>진화</small><b>${nextLabel}</b><p>${evolution.complete?"합성은 계속할 수 있습니다.":`조건 ${evolution.count} / ${evolution.threshold}회 · 비용 ${formatMoney(evolution.cost)}`}</p>${evolutionPreviewHtml}<button data-evolution-submit ${evolution.complete||!evolution.unlocked||!evolution.canAfford?"disabled":""}>${evolution.complete?"진화 완료":!evolution.unlocked?"합성 횟수 부족":!evolution.canAfford?"진화 비용 부족":"진화하기"}</button></div></section></div></div>`);
  }

  function finishFusionAnimation(){
    document.querySelector(".fusion-cinematic")?.remove();
    if(state.fusionAnimationResolve){const resolve=state.fusionAnimationResolve;state.fusionAnimationResolve=null;resolve();}
  }

  function playFusionAnimation(kind,result){
    finishFusionAnimation();
    const isEvolution=kind==="evolution",stage=Number(result.stage||0),duration=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?80:isEvolution?[0,2100,2800,3800][stage]:1750;
    const overlay=document.createElement("div");
    overlay.className=`fusion-cinematic ${isEvolution?`evolution evolution-${stage}`:"fusion"} ${gradeClass(result.main?.grade||result.fish?.grade)}`;
    const fish=result.main||result.fish,materials=isEvolution?"":Array.from({length:Math.min(5,result.materialNames?.length||0)},()=>`<i>${fishIcon(fish)}</i>`).join("");
    overlay.innerHTML=`<div class="fusion-cinematic-bg"></div><button data-fusion-animation-skip>건너뛰기</button><div class="fusion-cinematic-content"><small>${isEvolution?stage===3?"최종 진화":`진화 단계 ${stage}`:"물고기 합성"}</small><div class="fusion-orbit">${materials}<strong>${fishIcon(fish)}</strong></div><h2>${safe(fish.name)}</h2><p>${isEvolution?`${safe(getFishEvolutionLabel(fish))} 성공<br><b>공격력 +${compactNumber(result.attackGain??result.afterAttack-result.beforeAttack)} · 최대 체력 +${compactNumber(result.hpGain??result.afterMaxHp-result.beforeMaxHp)}</b>`:`공격력 +${compactNumber(result.afterAttack-result.beforeAttack)} · 체력 +${compactNumber(result.afterMaxHp-result.beforeMaxHp)}`}</p></div>`;
    document.body.appendChild(overlay);
    if(isEvolution){playGameSound("evolution",stage);gameVibrate("evolution");}else{playGameSound("fusion");gameVibrate("fusion");}
    return new Promise(resolve=>{state.fusionAnimationResolve=resolve;setTimeout(finishFusionAnimation,duration);});
  }

  async function submitFusion(){
    const result=performFishFusion(fusionMainFishId,state.fusionMaterialIds);
    if(!result.ok)return showToast(result.shortage?`${formatMoney(result.shortage)}이 부족합니다.`:result.message);
    state.fusionMaterialIds=[];state.bucketKey="";renderAll(true);
    await playFusionAnimation("fusion",result);
    openFusionLab();
  }

  async function submitEvolution(){
    const result=performFishEvolution(fusionMainFishId);
    if(!result.ok)return showToast(result.shortage?`${formatMoney(result.shortage)}이 부족합니다.`:result.message);
    state.bucketKey="";renderAll(true);
    await playFusionAnimation("evolution",result);
    openFusionLab();
  }

  function openPresetEditor(type="boss",reset=true){
    type=type==="pvp"?"pvp":"boss";state.presetEditorType=type;
    const max=type==="boss"?5:3;
    if(reset)state.presetEditorIds=[...(partyPresets[type]||[])].filter(id=>bucket.some(f=>f&&f.id===id)).slice(0,max);
    const cards=sortedBucketList().filter(entry=>entry.fish.grade!=="쓰레기").map(entry=>{const f=entry.fish,c=ensureCombatStats(f),selected=state.presetEditorIds.includes(f.id),knockedOut=!!c.knockedOut||c.status==="기절"||c.hp<=0;return `<article class="selection-fish preset-fish ${gradeClass(f.grade)} ${fishEvolutionClass(f)} ${selected?"selected":""}"><span>${fishIcon(f)}</span><div><b>${safe(f.name)} ${fishEvolutionBadge(f)}</b><small>${safe(f.grade)} · ⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.hp)} / ${compactNumber(c.maxHp)}${knockedOut?" · 현재 기절":""}</small></div><button data-preset-fish-id="${safe(f.id)}">${selected?"선택 해제":"선택"}</button></article>`;}).join("");
    openUiModal("저장 파티",`<div class="game-dialog preset-editor"><div class="dialog-summary"><div><small>저장 파티</small><b>양동이에서 직접 골라 저장하세요</b><p>저장된 물고기는 판매할 때 경고가 표시됩니다.</p></div><span>🧭</span></div><div class="preset-type-tabs"><button data-preset-type="boss" class="${type==="boss"?"active":""}">보스전 파티 ${partyPresets.boss.length}/5</button><button data-preset-type="pvp" class="${type==="pvp"?"active":""}">PVP 파티 ${partyPresets.pvp.length}/3</button></div><div class="preset-editor-head"><div><small>${type==="boss"?"보스전 파티":"PVP 파티"}</small><h3>${type==="boss"?"보스전 최대 5마리":"PVP 최대 3마리"}</h3></div><b>${state.presetEditorIds.length} / ${max}</b></div><div class="selection-fish-list preset-bucket-list">${cards||`<div class="fusion-empty">양동이에 전투 가능한 물고기가 없습니다.</div>`}</div><div class="dialog-actions preset-editor-actions"><button class="primary" data-preset-save ${state.presetEditorIds.length?"":"disabled"}>선택한 파티 저장</button><button data-preset-load="${type}" ${(partyPresets[type]||[]).length?"":"disabled"}>저장 파티 불러오기</button><button class="danger" data-preset-clear="${type}" ${(partyPresets[type]||[]).length?"":"disabled"}>저장 삭제</button></div></div>`);
  }

  function openPresets(){
    openPresetEditor(state.presetEditorType||"boss",true);
  }
  function openTransferHub(type="money"){
    type=type==="fish"?"fish":"money";
    if(!currentUser)return openUiModal("송금·물고기 전송",`<div class="game-dialog"><div class="dialog-summary"><div><small>안전한 선물</small><b>로그인이 필요합니다.</b><p>로그인 후 다른 선장에게 골드나 물고기를 보낼 수 있습니다.</p></div><span>🎁</span></div></div>`);
    const tabs=`<div class="transfer-tabs"><button data-transfer-tab="money" class="${type==="money"?"active":""}">💰 송금</button><button data-transfer-tab="fish" class="${type==="fish"?"active":""}">🐟 물고기 전송</button></div>`;
    if(type==="money")return openUiModal("송금·물고기 전송",`<div class="game-dialog transfer-dialog"><div class="dialog-summary"><div><small>골드 보내기</small><b>보유 골드 ${safe(formatMoney(money))}</b><p>받는 사람과 보유 골드를 확인한 뒤 송금합니다.</p></div><span>💸</span></div>${tabs}<div class="dialog-form transfer-form"><label for="transferNickname">받는 사람 닉네임</label><input id="transferNickname" maxlength="16" autocomplete="off" placeholder="닉네임"><label for="transferAmount">송금할 금액</label><input id="transferAmount" inputmode="numeric" autocomplete="off" placeholder="1 이상의 정수"><p class="transfer-warning">거래가 완료되면 직접 되돌릴 수 없습니다. 닉네임과 금액을 확인해주세요.</p><button data-money-transfer>송금하기</button></div></div>`);
    const eligible=sortedBucketList().filter(entry=>!entry.fish.locked&&!isFusionMainFish(entry.fish)&&!isAquariumFish(entry.fish)),eligibleIds=new Set(eligible.map(entry=>String(entry.fish.id)));state.transferFishIds=state.transferFishIds.filter(id=>eligibleIds.has(String(id)));
    const visible=eligible.slice(0,state.transferVisibleCount),cards=visible.map(entry=>{const fish=entry.fish,selected=state.transferFishIds.includes(String(fish.id)),c=ensureCombatStats(fish);return `<button type="button" class="transfer-fish-choice ${gradeClass(fish.grade)} ${selected?"selected":""}" data-transfer-fish-id="${safe(fish.id)}" aria-pressed="${selected}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>${safe(fish.grade)} · ⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.maxHp)}</small></div><em>${selected?"✓ 선택됨":"선택"}</em></button>`;}).join(""),more=visible.length<eligible.length?`<button type="button" class="boss-party-more" data-transfer-fish-more>물고기 더 보기 · ${visible.length.toLocaleString()} / ${eligible.length.toLocaleString()}</button>`:"";
    const opened=openUiModal("송금·물고기 전송",`<div class="game-dialog transfer-dialog"><div class="dialog-summary"><div><small>물고기 보내기</small><b>다중 선택 ${state.transferFishIds.length.toLocaleString()}마리</b><p>잠금·합성 본체·수족관 전시 물고기는 보호를 위해 목록에서 제외됩니다.</p></div><span>🐟</span></div>${tabs}<div class="dialog-form transfer-form"><label for="fishTransferNickname">받는 사람 닉네임</label><input id="fishTransferNickname" maxlength="16" autocomplete="off" placeholder="닉네임" value="${safe(state.transferTarget)}"><div class="transfer-fish-heading"><label>전송할 물고기</label><b>${state.transferFishIds.length.toLocaleString()}마리 선택</b></div><div class="transfer-fish-list">${cards||`<div class="fusion-empty">전송 가능한 물고기가 없습니다.</div>`}</div>${more}<p class="transfer-warning">능력치·진화·합성·현재 체력은 유지됩니다. 선물받은 물고기는 양동이에만 들어오며 도감에는 등록되지 않습니다.</p><button data-fish-transfer ${state.transferFishIds.length?"":"disabled"}>선택한 ${state.transferFishIds.length.toLocaleString()}마리 전송하기</button></div></div>`);
    requestAnimationFrame(()=>{const list=$(".transfer-fish-list");if(list)list.scrollTop=Math.max(0,Number(state.transferScrollTop||0));});
    return opened;
  }
  async function submitMoneyTransfer(button){
    if(button.disabled)return;
    button.disabled=true;button.textContent="송금 처리 중…";
    const result=await sendMoney($("#transferNickname")?.value,$("#transferAmount")?.value);
    if(result?.ok){state.bucketKey="";renderAll(true);showToast(result.message);return openTransferHub("money");}
    if(document.body.contains(button)){button.disabled=false;button.textContent="송금하기";}
  }
  async function submitFishTransfer(button){
    if(button.disabled)return;
    button.disabled=true;button.textContent="전송 처리 중…";
    state.transferTarget=$("#fishTransferNickname")?.value||state.transferTarget;
    const result=await sendFishBatch(state.transferTarget,state.transferFishIds);
    if(result?.ok){state.bucketKey="";state.transferFishIds=[];renderAll(true);showToast(result.message);return openTransferHub("fish");}
    if(document.body.contains(button)){button.disabled=false;button.textContent="물고기 전송하기";}
  }
  function openMessageForm() {
    openUiModal("메시지 보내기", `<div class="game-dialog"><div class="dialog-summary"><div><small>메시지 보내기</small><b>친구에게 메시지를 보냅니다</b></div><span>💌</span></div><div class="dialog-form"><label for="messageNickname">받는 사람 닉네임</label><input id="messageNickname" maxlength="12" placeholder="닉네임"><label for="messageText">메시지</label><input id="messageText" maxlength="300" placeholder="보낼 내용을 입력하세요"><button data-message-send>메시지 보내기</button></div></div>`);
  }
  function inboxMessageText(item){
    if(item.type==="money")return `${Number(item.amount||0).toLocaleString()}원을 송금했습니다.`;
    if(item.type==="fish"){const names=(item.fishNames||[]).slice(0,3).map(displayFishName),more=Math.max(0,Number(item.count||names.length)-names.length);return `물고기 ${Number(item.count||names.length).toLocaleString()}마리를 보냈습니다.${names.length?`\n${names.join(", ")}${more?` 외 ${more}마리`:""}`:""}`;}
    return safeMessageText(item.text||"내용이 없는 메시지입니다.");
  }
  function renderInboxBadge(){const badge=$("#inboxUnreadBadge"),count=(messages||[]).filter(item=>item&&item.read!==true).length;if(!badge)return;badge.hidden=count<=0;badge.textContent=count>99?"99+":String(count);}
  function openInbox(){
    if(!currentUser)return openUiModal("받은 소식",`<div class="game-dialog"><div class="dialog-summary"><div><small>INBOX</small><b>로그인이 필요합니다.</b></div><span>📬</span></div></div>`);
    const list=[...(messages||[])].sort((a,b)=>Number(b.createdAtMillis||0)-Number(a.createdAtMillis||0)),unread=list.filter(item=>item.read!==true).length;
    const cards=list.map(item=>{const sender=formatUserName(item.from||"알 수 없음",item.fromTitle||""),icon=item.type==="money"?"💰":item.type==="fish"?"🐟":"💌",fishButton=item.type==="fish"?`<button data-inbox-fish-details="${safe(item.id||"")}">능력치 보기</button>`:"";return `<article class="inbox-message ${item.read===true?"read":"unread"}"><span>${icon}</span><div><small>${safe(formatDateTime(item.createdAtMillis||Date.now()))}</small><h3>${safe(sender)}</h3><p>${safe(inboxMessageText(item)).replace(/\n/g,"<br>")}</p></div><div class="inbox-message-actions">${fishButton}<button data-inbox-read="${safe(item.id||"")}" ${item.read===true?"disabled":""}>${item.read===true?"확인함":"확인"}</button></div></article>`;}).join("");
    openUiModal("받은 소식",`<div class="game-dialog inbox-dialog"><div class="dialog-summary"><div><small>받은 소식</small><b>읽지 않은 소식 ${unread.toLocaleString()}개</b><p>메시지·송금·물고기 선물 기록은 직접 확인할 때까지 남아 있습니다.</p></div><span>📬</span></div><div class="inbox-actions"><button data-inbox-read-all ${unread?"":"disabled"}>모두 확인</button></div><div class="inbox-list">${cards||`<div class="fusion-empty">도착한 소식이 없습니다.</div>`}</div></div>`);
  }
  function markInboxRead(id=""){
    let changed=false;(messages||[]).forEach(item=>{if(item&&item.read!==true&&(!id||String(item.id||"")===String(id))){item.read=true;changed=true;}});if(changed){saveGame();if(currentUser)saveCloudData().catch(console.error);}renderInboxBadge();openInbox();
  }
  globalThis.showFishingLifeInboxNotice=count=>{renderInboxBadge();showGameNotice({icon:"📬",eyebrow:"받은 소식",title:"받은 소식 도착",detail:`읽지 않은 메시지·송금·선물 ${Number(count||0).toLocaleString()}개를 광장에서 확인할 수 있습니다.`,kind:"info",duration:4800});};
  async function sendDirectMessage(targetNickname, messageText) {
    if (!currentUser) return showToast("로그인 후 사용할 수 있습니다.");
    targetNickname = cleanNickname(targetNickname); messageText = safeMessageText(messageText);
    if (!targetNickname || !messageText) return showToast("닉네임과 메시지를 모두 입력해주세요.");
    if (targetNickname === currentUser) return showToast("자기 자신에게는 보낼 수 없습니다.");
    if (isOnlineActionRunning) return showToast("처리 중입니다.");
    isOnlineActionRunning = true;
    try {
      if(!(await checkGameVersion()))throw new Error("UPDATE_REQUIRED");
      const senderName=currentUser,senderTitle=getCurrentTitle();
      const targetRef = db.collection("users").doc(targetNickname), targetSnap = await targetRef.get();
      if (!targetSnap.exists) throw new Error("TARGET_NOT_FOUND");
      const payload = {id:`msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,type:"message",read:false,from:senderName,fromTitle:senderTitle,text:messageText,createdAtMillis:Date.now()};
      await db.runTransaction(async tx => { const snap=await tx.get(targetRef); if(!snap.exists) throw new Error("TARGET_NOT_FOUND"); const data=snap.data(),targetMessages=[...(data.gameState?.messages || [])].slice(-99);targetMessages.push(payload);txSetProtectedUser(tx,targetRef,data,{cloudRevision:Number(data.cloudRevision||0)+1,gameState:{...(data.gameState||{}),messages:targetMessages}},"message_receive"); });
      await db.collection("serverAlerts").add({type:"userMessage",from:senderName,fromTitle:senderTitle,to:targetNickname,text:messageText,messageId:payload.id,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtMillis:payload.createdAtMillis});
      closeModal(); showToast(`${targetNickname} 님에게 메시지를 보냈습니다.`);
    } catch (error) { console.error(error); if(error.message==="USER_STATE_TOO_LARGE")showToast("상대 계정의 저장할 기록이 너무 많아 메시지를 보내지 못했습니다.");else if(await handleOnlineActionWriteError(error,currentUser,getGameState(),lastCloudSyncedState))showToast(error.message==="UPDATE_REQUIRED"?"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.":"상대가 이전 버전을 사용 중입니다.");else showToast(error.message === "TARGET_NOT_FOUND" ? "존재하지 않는 닉네임입니다." : "메시지를 보내지 못했습니다."); }
    finally { isOnlineActionRunning = false; }
  }

  function renderGrowth() {
    $("#growthRodLevel").textContent = `Lv.${Number(rodLevel || 1).toLocaleString()}`;
    $("#researchFishingLevel").textContent = `Lv.${Number(researchLevels?.fishing || 0)}`;
    $("#researchAppraisalLevel").textContent = `Lv.${Number(researchLevels?.appraisal || 0)}`;
    $("#trainingAttackLevel").textContent = `Lv.${Number(trainingLevels?.attack || 0)} · +${getTrainingAttackBonus()}%`;
    $("#trainingHpLevel").textContent = `Lv.${Number(trainingLevels?.hp || 0)} · +${getTrainingHpBonus()}%`;
    $("#trainingCritLevel").textContent = `Lv.${Number(trainingLevels?.critDamage || 0)} · +${getTrainingCritDamageBonus()}%`;
  }
  function syncOwnedFishTrainingBonuses() {
    if(isLoginPostProcessing)return;
    const key = `${currentUser || "local"}|${bucket.length}|${trainingLevels?.attack || 0}|${trainingLevels?.hp || 0}|${trainingLevels?.critDamage || 0}`;
    if (key === state.trainingSyncKey && state.trainingBucketRef === bucket) return;
    state.trainingSyncKey = key;
    state.trainingBucketRef = bucket;
    bucket.forEach(fish => { if (fish?.combat) applyTrainingBonusesToCombat(fish.combat); });
  }
  function renderAll(force = false) {
    try {
      syncOwnedFishTrainingBonuses();
      renderHeader();
      renderInboxBadge();
      if(state.activeView==="fishingView")renderFishing();
      else if(state.activeView==="bucketView")renderBucket(force);
      else if(state.activeView==="collectionView")renderCollection(force);
      else if(state.activeView==="bossView")renderBosses(force);
      else if(state.activeView==="growthView")renderGrowth();
      state.initialized=true;
    }
    catch (error) { console.error("FishingLife UI 갱신 오류", error); }
  }
  function queueUiRender(force=false){
    state.renderForce=state.renderForce||force;
    if(state.renderQueued)return;
    state.renderQueued=true;
    const run=()=>{const nextForce=state.renderForce;state.renderQueued=false;state.renderForce=false;renderAll(nextForce);};
    if(typeof requestAnimationFrame==="function"&&!document.hidden)requestAnimationFrame(run);else setTimeout(run,16);
  }
  globalThis.requestFishingLifeRender=force=>queueUiRender(!!force);

  function handleUiAction(action) {
    if(!currentUser){openLoginGate("로그인해야 게임 메뉴를 이용할 수 있습니다.");return;}
    const map = {market:openMarket,fishCollection:openFishCollection,coreCollection:openCoreCollection,bossParty:()=>openBossParty(),ranking:openRanking,myInfo:openMyInfo,aquarium:()=>openAquarium(false),battleHistory:()=>openBattleHistory(),wallet:openWallet,achievements:openAchievements,titles:openTitles,cosmetics:openCosmetics,settings:openSettings,pvp:openPvpPanel,presets:openPresets,fusion:openFusionLab,transfer:()=>openTransferHub(),inbox:openInbox,message:openMessageForm,deleteAccount:openDeleteAccountWarning};
    map[action]?.();
  }

  document.addEventListener("click", async event => {
    const authSwitch=event.target.closest("[data-auth-switch]");
    if(authSwitch){openLoginGate("",false,authSwitch.dataset.authSwitch);return;}
    if(event.target.closest("[data-delete-account-next]")){openDeleteAccountFinal();return;}
    if(event.target.closest("[data-delete-account-cancel]")){closeModal(true);return;}
    if(!currentUser&&event.target.closest("button,a,input")&&!event.target.closest("#loginGateForm,[data-auth-switch],[data-version-gate-retry]")){
      event.preventDefault();
      openLoginGate("로그인해야 게임을 시작할 수 있습니다.");
      return;
    }
    const versionRetryButton=event.target.closest("[data-version-gate-retry]");
    if(versionRetryButton){
      const status=$("#versionGateRetryStatus");versionRetryButton.disabled=true;
      if(status){status.className="login-gate-status loading";status.textContent="최신 버전을 확인하고 있습니다...";}
      const ok=await checkGameVersion(true);
      if(ok){
        if(status){status.className="login-gate-status success";status.textContent="확인 완료. 게임을 새로고침합니다.";}
        if(currentUser)location.reload();
        else{closeModal(true);openLoginGate();}
      }else{
        versionRetryButton.disabled=false;
        if(status){status.className="login-gate-status error";status.textContent=cloudVersionGateMessage||"업데이트를 확인하지 못했습니다. 새로고침해주세요.";}
      }
      return;
    }
    const emergencyRestoreButton=event.target.closest("[data-emergency-restore]");
    if(emergencyRestoreButton){
      const status=$("#emergencyRecoveryStatus"),buttons=$$("[data-emergency-restore],[data-emergency-keep]");
      buttons.forEach(button=>button.disabled=true);
      emergencyRestoreButton.classList.add("loading");
      if(status){status.className="emergency-recovery-status loading";status.textContent="이 기기 기록을 저장하고 있습니다...";}
      const result=await restoreStartupEmergencySnapshot(emergencyRestoreButton.dataset.emergencyRestore||"");
      if(result?.ok){
        $("#modalOverlay")?.classList.remove("emergency-recovery-mode");
        closeModal(true);
        startServerAlertListener();
        showGameNotice({icon:"🛟",eyebrow:"계정 기록 복구 완료",title:`${currentUser||"현재"} 계정 복구 완료`,detail:`Lv.${Number(result.summary?.rodLevel||1).toLocaleString()} · ${formatMoney(result.summary?.money||0)} · 물고기 ${Number(result.summary?.fishCount||0).toLocaleString()}마리`,kind:"success",duration:6500});
        return;
      }
      emergencyRestoreButton.classList.remove("loading");
      buttons.forEach(button=>button.disabled=false);
      if(result?.error==="SERVER_CHANGED"){openEmergencyAccountRecovery();showGameNotice({icon:"↻",title:"클라우드 기록이 새로 바뀌었습니다",detail:"새로 도착한 송금·물고기를 잃지 않도록 최신값으로 다시 비교합니다.",kind:"info",duration:5000});return;}
      if(status){status.className="emergency-recovery-status error";status.textContent=result?.message||"복구 저장을 완료하지 못했습니다. 기존 기록은 그대로 보관되어 있습니다.";}
      return;
    }
    const emergencyKeepButton=event.target.closest("[data-emergency-keep]");
    if(emergencyKeepButton){
      const status=$("#emergencyRecoveryStatus");
      if(emergencyKeepButton.dataset.confirmed!=="1"){
        emergencyKeepButton.dataset.confirmed="1";
        emergencyKeepButton.querySelector("b").textContent="클라우드 기록으로 계속";
        emergencyKeepButton.querySelector("small").textContent="한 번 더 누르면 확정";
        if(status){status.className="emergency-recovery-status error";status.textContent="클라우드 기록을 사용할까요? 한 번 더 눌러주세요.";}
        return;
      }
      const result=keepCurrentFirebaseEmergencyState(emergencyKeepButton.dataset.emergencyKeep||"");
      if(!result?.ok){if(status){status.className="emergency-recovery-status error";status.textContent=result?.message||"클라우드 기록을 선택하지 못했습니다.";}return;}
      $("#modalOverlay")?.classList.remove("emergency-recovery-mode");
      closeModal(true);
      showGameNotice({icon:"☁️",title:"클라우드 기록을 사용합니다",detail:"클라우드에 저장된 기록으로 게임을 계속합니다.",kind:"info",duration:4500});
      return;
    }
    if(event.target.closest("[data-fusion-animation-skip]")){finishFusionAnimation();return;}
    const fusionMainButton=event.target.closest("[data-fusion-main-id]");
    if(fusionMainButton){const result=setFusionMainFish(fusionMainButton.dataset.fusionMainId);if(!result.ok)return showToast(result.message);state.fusionMaterialIds=[];state.bucketKey="";renderAll(true);showToast(`${result.fish.name}을 합성 본체로 설정했습니다.`);return openFusionLab();}
    const fusionOpenButton=event.target.closest("[data-fusion-open-name]");
    if(fusionOpenButton){const name=fusionOpenButton.dataset.fusionOpenName,main=getFusionMainFishForName(name);if(main){setFusionMainFish(main.id);return openFusionLab();}return openFusionMainPicker(name);}
    const fusionClearButton=event.target.closest("[data-fusion-clear-main]");
    if(fusionClearButton){const result=clearFusionMainFish(fusionClearButton.dataset.fusionClearMain||fusionMainFishId);state.fusionMaterialIds=[];state.bucketKey="";renderAll(true);showToast("합성 본체를 해제했습니다.");return openFusionMainPicker(result.fish?.name||"");}
    if(event.target.closest("[data-fusion-change-main]")){const main=getFusionMainFish();state.fusionMaterialIds=[];return openFusionMainPicker(main?.name||"");}
    const fusionMaterialButton=event.target.closest("[data-fusion-material-id]");
    if(fusionMaterialButton&&!fusionMaterialButton.disabled){const id=fusionMaterialButton.dataset.fusionMaterialId,pos=state.fusionMaterialIds.indexOf(id);if(pos>=0)state.fusionMaterialIds.splice(pos,1);else if(state.fusionMaterialIds.length>=FUSION_BATCH_LIMIT)return showToast("재료는 한 번에 최대 5마리까지 선택할 수 있습니다.");else state.fusionMaterialIds.push(id);return openFusionLab();}
    if(event.target.closest("[data-fusion-submit]"))return submitFusion();
    if(event.target.closest("[data-evolution-submit]"))return submitEvolution();
    const presetTypeButton=event.target.closest("[data-preset-type]");if(presetTypeButton)return openPresetEditor(presetTypeButton.dataset.presetType,true);
    const presetFishButton=event.target.closest("[data-preset-fish-id]");
    if(presetFishButton){const id=presetFishButton.dataset.presetFishId,max=state.presetEditorType==="boss"?5:3,pos=state.presetEditorIds.indexOf(id);if(pos>=0)state.presetEditorIds.splice(pos,1);else if(state.presetEditorIds.length>=max)return showToast(`${state.presetEditorType==="boss"?"보스":"PVP"} 저장 파티는 최대 ${max}마리입니다.`);else state.presetEditorIds.push(id);return openPresetEditor(state.presetEditorType,false);}
    if(event.target.closest("[data-preset-save]")){const result=savePartyPresetIds(state.presetEditorType,state.presetEditorIds);if(!result.ok)return showToast(result.message);showToast(`${result.type==="boss"?"보스":"PVP"} 파티 ${result.count}마리를 저장했습니다.`);return openPresetEditor(result.type,true);}
    const presetLoadButton=event.target.closest("[data-preset-load]");if(presetLoadButton&&!presetLoadButton.disabled){loadPartyPreset(presetLoadButton.dataset.presetLoad);showToast("저장한 파티를 불러왔습니다.");return openPresetEditor(presetLoadButton.dataset.presetLoad,true);}
    const presetClearButton=event.target.closest("[data-preset-clear]");if(presetClearButton&&!presetClearButton.disabled){clearPartyPreset(presetClearButton.dataset.presetClear);state.presetEditorIds=[];showToast("저장한 파티을 삭제했습니다.");return openPresetEditor(presetClearButton.dataset.presetClear,true);}
    const quickPresetButton=event.target.closest("[data-party-preset-load]");
    if(quickPresetButton&&!quickPresetButton.disabled){const type=quickPresetButton.dataset.partyPresetLoad,result=applyPartyPreset(type);if(!result.ok)return showToast(result.message);showToast(`${type==="boss"?"보스":"PVP"} 파티 ${result.count}마리를 불러왔습니다.${result.skipped?` 기절·HP 0 ${result.skipped}마리 제외`:""}`);return type==="boss"?openBossParty():openPvpPanel();}
    const transferTab=event.target.closest("[data-transfer-tab]");if(transferTab)return openTransferHub(transferTab.dataset.transferTab);
    const transferFishChoice=event.target.closest("[data-transfer-fish-id]");if(transferFishChoice){state.transferTarget=$("#fishTransferNickname")?.value||state.transferTarget;state.transferScrollTop=$(".transfer-fish-list")?.scrollTop||0;const id=String(transferFishChoice.dataset.transferFishId),pos=state.transferFishIds.indexOf(id);if(pos>=0)state.transferFishIds.splice(pos,1);else state.transferFishIds.push(id);return openTransferHub("fish");}
    if(event.target.closest("[data-transfer-fish-more]")){state.transferTarget=$("#fishTransferNickname")?.value||state.transferTarget;state.transferScrollTop=$(".transfer-fish-list")?.scrollTop||0;state.transferVisibleCount+=30;return openTransferHub("fish");}
    const moneyTransferButton=event.target.closest("[data-money-transfer]");if(moneyTransferButton)return submitMoneyTransfer(moneyTransferButton);
    const fishTransferButton=event.target.closest("[data-fish-transfer]");if(fishTransferButton)return submitFishTransfer(fishTransferButton);
    const aquariumDetail=event.target.closest("[data-aquarium-detail-id]");
    if(aquariumDetail){const index=bucket.findIndex(f=>f&&String(f.id)===String(aquariumDetail.dataset.aquariumDetailId));return openFishDetailByBucketIndex(index);}
    const publicAquariumFish=event.target.closest("[data-public-aquarium-fish-id]");
    if(publicAquariumFish)return openPublicAquariumFishDetail(publicAquariumFish.dataset.publicAquariumOwner,publicAquariumFish.dataset.publicAquariumFishId);
    const publicAquariumOwner=event.target.closest("[data-public-aquarium-owner]");
    if(publicAquariumOwner)return openPublicAquarium(publicAquariumOwner.dataset.publicAquariumOwner);
    if(event.target.closest("[data-aquarium-gallery-refresh]"))return openAquariumGallery(true);
    if(event.target.closest("[data-aquarium-gallery]"))return openAquariumGallery(false);
    if(event.target.closest("[data-aquarium-edit]")){state.aquariumVisibleCount=30;return openAquarium(true);}
    if(event.target.closest("[data-aquarium-finish]"))return openAquarium(false);
    if(event.target.closest("[data-aquarium-clear]")){clearAquarium();state.bucketKey="";showToast("수족관 전시를 모두 해제했습니다.");return openAquarium(true);}
    if(event.target.closest("[data-aquarium-more]")){state.aquariumVisibleCount+=30;return openAquarium(true);}
    const aquariumSelect=event.target.closest("[data-aquarium-select-id]");
    if(aquariumSelect&&!aquariumSelect.disabled){const id=String(aquariumSelect.dataset.aquariumSelectId),ids=normalizeAquariumFishIds(aquariumFishIds),position=ids.indexOf(id);if(position>=0)ids.splice(position,1);else if(ids.length>=5)return showToast("수족관에는 최대 5마리까지 전시할 수 있습니다.");else ids.push(id);saveAquariumFishIds(ids);state.bucketKey="";return openAquarium(true);}
    const feedbackToggle=event.target.closest("[data-feedback-toggle]");
    if(feedbackToggle){const key=feedbackToggle.dataset.feedbackToggle;if(["sound","vibration","timeBackground"].includes(key)){feedbackSettings[key]=!feedbackSettings[key];saveFeedbackSettings();if(key==="sound"&&feedbackSettings.sound)playGameSound("timing","PERFECT");if(key==="timeBackground"){state.fishingTimeKey="";applyFishingTimeTheme(true);}openSettings();}return;}
    const cosmeticButton=event.target.closest("[data-cosmetic-type]");
    if(cosmeticButton&&!cosmeticButton.disabled){const type=cosmeticButton.dataset.cosmeticType,id=cosmeticButton.dataset.cosmeticId||"";if(equipProfileCosmetic(type,id)){renderProfileCosmetics();showToast("꾸미기 설정이 변경되었습니다.");openCosmetics();}return;}
    const rankingTypeButton=event.target.closest("[data-ranking-type]");
    if(rankingTypeButton)return renderRankingView(rankingTypeButton.dataset.rankingType);
    const historyTab=event.target.closest("[data-history-tab]");
    if(historyTab)return openBattleHistory(historyTab.dataset.historyTab);
    const historyButton=event.target.closest("[data-battle-history-index]");
    if(historyButton&&!historyButton.disabled){const type=historyButton.dataset.battleHistoryType,index=Number(historyButton.dataset.battleHistoryIndex),record=battleHistory?.[type]?.[index];if(!record)return showToast("저장된 전투 기록을 찾을 수 없습니다.");return type==="pvp"?openPvpBattleReplay(record):openBossBattleReplay(record);}
    const battleSpeed=event.target.closest("[data-battle-speed]");
    if(battleSpeed){state.battleReplaySpeed=Number(battleSpeed.dataset.battleSpeed)||1;$$('[data-battle-speed]').forEach(button=>button.classList.toggle("active",button===battleSpeed));return;}
    if(event.target.closest("[data-battle-skip]")){state.battleReplaySkip=true;return;}
    if(event.target.closest("[data-battle-replay]")){if(state.lastBattleReplay)openBossBattleReplay(state.lastBattleReplay);return;}
    if(event.target.closest("[data-battle-close]")){state.battleReplayToken++;closeModal();return;}
    const pvpBattleSpeed=event.target.closest("[data-pvp-battle-speed]");
    if(pvpBattleSpeed){state.pvpReplaySpeed=Number(pvpBattleSpeed.dataset.pvpBattleSpeed)||1;$$('[data-pvp-battle-speed]').forEach(button=>button.classList.toggle("active",button===pvpBattleSpeed));return;}
    if(event.target.closest("[data-pvp-battle-skip]")){state.pvpReplaySkip=true;return;}
    if(event.target.closest("[data-pvp-replay]")){if(state.lastPvpReplay)openPvpBattleReplay(state.lastPvpReplay);return;}
    if(event.target.closest("[data-pvp-replay-close]")){state.pvpReplayToken++;closeModal();return;}
    if(event.target.closest("[data-pvp-alert-accept]")){hidePvpRequestAlert();await acceptLatestPvpRequest();state.pvpVisibleCount=30;return openPvpPanel();}
    if(event.target.closest("[data-pvp-alert-reject]")){hidePvpRequestAlert();await rejectLatestPvpRequest();return showToast("대전 신청을 거절했습니다.");}
    const viewButton = event.target.closest("[data-view-target]"); if (viewButton) return switchView(viewButton.dataset.viewTarget);
    const uiButton = event.target.closest("[data-ui-action]"); if (uiButton) return handleUiAction(uiButton.dataset.uiAction);
    const commandButton = event.target.closest("[data-game-command]"); if (commandButton) { if(commandButton.dataset.gameCommand==="로그인"&&!currentUser)return openLoginGate();await runGameCommand(commandButton.dataset.gameCommand); if ($("#modalOverlay").style.display === "block" && commandButton.closest(".modalBody") && ($("#modalTitle")?.textContent!=="FishingLife 로그인"||currentUser)) closeModal(); return; }
    const sortButton = event.target.closest("[data-sort]"); if (sortButton) return runGameCommand(`정렬 ${sortButton.dataset.sort}`);
    const recentFishButton = event.target.closest("[data-recent-bucket-index]"); if (recentFishButton) return openFishDetailByBucketIndex(Number(recentFishButton.dataset.recentBucketIndex));
    if(event.target.closest("[data-recent-catches-all]"))return openRecentCatches();
    if(event.target.closest("[data-bulk-sell]"))return openBulkSaleConfirmation();
    const confirmSell=event.target.closest("[data-confirm-sell]");if(confirmSell){sellOne(Number(confirmSell.dataset.confirmSell),true);return;}
    if(event.target.closest("[data-confirm-bulk-sell]")){sellAll(true);return;}
    const fishButton = event.target.closest("[data-fish-action]");
    if (fishButton) {
      const no=fishButton.dataset.number, action=fishButton.dataset.fishAction;
      if(action==="info") return openFishDetail(no);
      if(action==="fusion"){const idx=getBucketIndexByDisplayNumber(Number(no)),fish=bucket[idx],main=getFusionMainFishForName(fish?.name);if(main){setFusionMainFish(main.id);return openFusionLab();}return openFusionMainPicker(fish?.name||"");}
      if(action==="fusionMain"){const idx=getBucketIndexByDisplayNumber(Number(no)),fish=bucket[idx],result=setFusionMainFish(fish?.id);if(!result.ok)return showToast(result.message);state.fusionMaterialIds=[];state.bucketKey="";renderAll(true);showToast(`${result.fish.name}을 합성 본체로 설정했습니다.`);return openFusionLab();}
      if(action==="sell")return openSaleConfirmation(no);
      return runGameCommand(`${fishButton.textContent.includes("해제") ? "잠금해제" : "잠금"} ${no}`);
    }
    const bossButton = event.target.closest("[data-boss-index]"); if (bossButton && !bossButton.disabled) return openBossParty(bossButton.dataset.bossIndex);
    const difficultyButton=event.target.closest("[data-boss-difficulty]"); if(difficultyButton&&!difficultyButton.disabled){selectBossDifficulty(difficultyButton.dataset.bossDifficulty,true);return openBossParty();}
    const bossPartySort=event.target.closest("[data-boss-party-sort]"); if(bossPartySort){state.bossPartySortOrder=bossPartySort.dataset.bossPartySort;state.bossPartyVisibleCount=30;return openBossParty();}
    if(event.target.closest("[data-boss-party-more]")){state.bossPartyVisibleCount+=30;return openBossParty();}
    const prepButton = event.target.closest("[data-boss-prep-number]");
    if(prepButton){ prepButton.dataset.selected==="1" ? unprepareBossFish(Number(prepButton.dataset.bossPrepNumber)) : prepareBossFish(Number(prepButton.dataset.bossPrepNumber)); return openBossParty(); }
    if(event.target.closest("[data-boss-start]")){
      runBossBattle();
      return;
    }
    if(event.target.closest("[data-boss-confirm]")){ runBossBattle(); return; }
    const titleButton=event.target.closest("[data-title-index]"); if(titleButton){ equipTitle(titleButton.dataset.titleIndex); return openTitles(); }
    if(event.target.closest("[data-message-send]")) return sendDirectMessage($("#messageNickname").value,$("#messageText").value);
    const receivedFish=event.target.closest("[data-received-fish-id]");if(receivedFish){const index=bucket.findIndex(fish=>fish&&String(fish.id||"")===String(receivedFish.dataset.receivedFishId||""));return openFishDetailByBucketIndex(index);}
    const inboxFishDetails=event.target.closest("[data-inbox-fish-details]");if(inboxFishDetails){const message=messages.find(item=>item&&String(item.id||"")===String(inboxFishDetails.dataset.inboxFishDetails||""));return openReceivedFishDetails(message?.fishIds||[],message||null);}
    const inboxRead=event.target.closest("[data-inbox-read]");if(inboxRead)return markInboxRead(inboxRead.dataset.inboxRead);
    if(event.target.closest("[data-inbox-read-all]"))return markInboxRead("");
    const pvpPartySort=event.target.closest("[data-pvp-party-sort]");if(pvpPartySort){state.pvpPartySortOrder=pvpPartySort.dataset.pvpPartySort;state.pvpVisibleCount=30;return openPvpPanel();}
    if(event.target.closest("[data-pvp-party-more]")){state.pvpVisibleCount+=30;return openPvpPanel();}
    if(event.target.closest("[data-pvp-request]")){state.pvpVisibleCount=30;await requestPvp($("#pvpNickname").value);return openPvpPanel();}
    if(event.target.closest("[data-pvp-accept]")){hidePvpRequestAlert();state.pvpVisibleCount=30;await acceptLatestPvpRequest();return openPvpPanel();}
    if(event.target.closest("[data-pvp-reject]")){hidePvpRequestAlert();await rejectLatestPvpRequest();return openPvpPanel();}
    if(event.target.closest("[data-pvp-cancel]")){ await cancelPvpRequest(); return openPvpPanel(); }
    const pvpFish=event.target.closest("[data-pvp-fish]"); if(pvpFish){ pvpFish.dataset.selected==="1" ? await unpreparePvpFish(pvpFish.dataset.pvpFish) : await preparePvpFish(pvpFish.dataset.pvpFish); return openPvpPanel(); }
    if(event.target.closest("[data-pvp-ready]")){const before=state.lastPvpReplay?.id;await finishPvpReady();if(state.lastPvpReplay?.id!==before)return;return openPvpPanel();}
  });

  document.addEventListener("submit",event=>{
    if(event.target?.id==="loginGateForm"){event.preventDefault();submitLoginGate();return;}
    if(event.target?.id==="aquariumSearchForm"){event.preventDefault();openPublicAquarium($("#aquariumSearchNickname")?.value||"");return;}
    if(event.target?.id==="deleteAccountForm"){event.preventDefault();submitDeleteAccount();}
  });

  $("#castButton")?.addEventListener("click", startTimingGame);
  $("#hookButton")?.addEventListener("click", () => resolveTimingGame());
  document.addEventListener("keydown", event => { if(state.timingActive && (event.code === "Space" || event.key === "Enter")){ event.preventDefault(); resolveTimingGame(); } });

  function installTooltips() {
    $$(`button[data-ui-action],button[data-game-command],.quick-grid button,.community-card,.boss-card button`).forEach(button => {
      if(button.dataset.tooltip) return;
      const hint=button.querySelector("small, p")?.textContent || button.getAttribute("aria-label") || button.title;
      if(hint) button.dataset.tooltip=hint.trim();
    });
  }

  installOutputBridge();
  applyLocalCosmeticDemo();
  applyLocalFusionDemo();
  state.previousBucketCount = bucket.length;
  renderAll(true);
  installTooltips();
  if(!currentUser)setTimeout(()=>openLoginGate(),50);
  maybeOpenLocalBattleReplayDemo();
  maybeOpenLocalPvpReplayDemo();
  maybeOpenLocalNoticeDemo();
  maybeOpenLocalRankingDemo();
  setInterval(() => {
    if(document.hidden)return;
    if(state.activeView==="fishingView")renderFishing();
    updateOpenBossCooldown();
    if(state.activeView==="bucketView")updateBucketRecoveryCountdowns();
    if($("#log").textContent.length>80000)$("#log").replaceChildren();
  },1000);
})();
