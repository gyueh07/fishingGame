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
    "영웅":{slug:"hero",icon:"🔵",name:"영웅의 심해",primary:"#6f9dff",secondary:"#2858d9"},
    "전설":{slug:"legend",icon:"🟠",name:"전설의 해역",primary:"#ffac55",secondary:"#ff6238"},
    "신화":{slug:"myth",icon:"🔴",name:"신화의 화염천",primary:"#ff6279",secondary:"#ff263f"},
    "초월":{slug:"transcend",icon:"🟡",name:"초월의 황금해",primary:"#ffe25b",secondary:"#ff9f1c"},
    "영원":{slug:"eternal",icon:"🟢",name:"영원의 성해",primary:"#45f1d0",secondary:"#00a98e"},
    "공허":{slug:"void",icon:"🟣",name:"공허의 우주",primary:"#d053ff",secondary:"#4b006e"}
  };
  const feedbackSettings=(()=>{try{const saved=JSON.parse(localStorage.getItem("fishingLifeFeedbackSettings")||"{}");return {sound:saved.sound!==false,vibration:saved.vibration!==false};}catch{return {sound:true,vibration:true};}})();
  let gameAudioContext=null;

  const state = {
    activeView:"fishingView", bucketKey:"", bossKey:"", collectionKey:"", previousBucketCount:0,
    initialized:false, toastTimer:null, trainingSyncKey:"", trainingBucketRef:null, timingActive:false, timingStartedAt:0, timingDuration:1900,
    timingTarget:.5, timingPosition:0, timingRaf:0, timingTimeout:0,
    battleReplayToken:0, battleReplaySpeed:2, battleReplaySkip:false, lastBattleReplay:null, bossPartySortOrder:"전투력", catchCelebrationTimer:0
  };

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
    else if(type==="victory")tones.push({frequency:523,duration:.18,gain:.035},{frequency:659,duration:.2,delay:.12,gain:.04},{frequency:784,duration:.22,delay:.24,gain:.04},{frequency:1046,duration:.36,delay:.38,gain:.035});
    tones.forEach(tone=>scheduleTone(ctx,tone));
  }

  function gameVibrate(kind){
    if(!feedbackSettings.vibration||typeof navigator.vibrate!=="function")return;
    const patterns={bite:[35,35,55],crit:[30,20,85],victory:[45,35,45,35,110]};
    navigator.vibrate(patterns[kind]||35);
  }

  function safe(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
  }
  function plain(value) {
    const div = document.createElement("div");
    div.innerHTML = sanitizeGameHtml(String(value ?? ""));
    return div.textContent.replace(/─+/g, " ").replace(/\s+/g, " ").trim();
  }
  function gradeClass(grade) { return "grade-" + (gradeClasses[grade] || "normal"); }
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
  function showToast(message) {
    const toast = $("#gameToast");
    if (!toast || !message) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }
  function openUiModal(title, html) {
    state.battleReplayToken++;
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modalOverlay").style.display = "block";
  }
  function legacyTextHtml(value) {
    return sanitizeGameHtml(String(value ?? "")).replace(/\n/g, "<br>");
  }

  function hpPercent(current,max){
    return Math.max(0,Math.min(100,Number(current||0)/Math.max(1,Number(max||1))*100));
  }

  function replayDelay(entry){
    const text=String(entry||"");
    if(text.includes("battle-event--crazy"))return 5100;
    if(text.includes("battle-event--passive"))return 3450;
    if(text.includes("battle-event--skill"))return 2700;
    if(/턴 \d+|내 턴|보스 턴/.test(plain(text)))return 1560;
    return 1140;
  }

  function replayEventKind(entry){
    const text=String(entry||"");
    if(text.includes("battle-event--crazy"))return "crazy";
    if(text.includes("battle-event--passive"))return "passive";
    if(text.includes("battle-event--skill"))return "skill";
    return "normal";
  }

  function updateReplayFrame(frame){
    const arena=$("#bossBattleArena"),action=$("#battleActionCard");
    if(!arena||!action||!frame)return;
    const kind=replayEventKind(frame.entry),text=plain(frame.entry);
    arena.classList.remove("hit-player","hit-boss","event-skill","event-crazy","event-passive",...Object.values(cosmeticGrades).map(config=>"grade-attack-"+config.slug));
    void arena.offsetWidth;
    const bossName=arena.dataset.bossName||"";
    const bossAttack=/보스 턴/.test(text)||(bossName&&text.includes(bossName+"의"));
    const playerAttack=!bossAttack&&(/ 공격|피해/.test(text));
    const attackerIndex=playerAttack?(frame.fish||[]).findIndex(fish=>text.includes(fish.displayName||fish.name)||text.includes(fish.name)):-1;
    const attacker=attackerIndex>=0?frame.fish[attackerIndex]:null;
    if(kind!=="normal")arena.classList.add("event-"+kind);
    else if(bossAttack)arena.classList.add("hit-player");
    else if(playerAttack)arena.classList.add("hit-boss");
    const attackGrade=isProfileCosmeticUnlocked("attackEffect",profileCosmetics.attackEffect)?profileCosmetics.attackEffect:"";
    const attackConfig=cosmeticGrades[attackGrade];
    if(playerAttack&&attackConfig&&(text.includes("치명타")||frame.turn%3===0))arena.classList.add("grade-attack-"+attackConfig.slug);

    if(kind==="crazy")playGameSound("crazy");
    else if(kind==="skill")playGameSound("bossAttack");
    else if(bossAttack&&/공격|피해|치명타/.test(text))playGameSound("bossAttack");
    if(text.includes("치명타")){playGameSound("crit");gameVibrate("crit");}

    const turnLabel=$("#battleTurnLabel");
    if(turnLabel&&frame.turn)turnLabel.textContent="TURN "+frame.turn;
    const bossBar=$("#replayBossHpBar"),bossHp=$("#replayBossHpText");
    if(bossBar)bossBar.style.width=hpPercent(frame.bossHp,frame.bossMaxHp)+"%";
    if(bossHp)bossHp.textContent=compactNumber(frame.bossHp)+" / "+compactNumber(frame.bossMaxHp);
    (frame.fish||[]).forEach((fish,index)=>{
      const card=$(`[data-replay-fish-index="${index}"]`),bar=$(`[data-replay-fish-bar="${index}"]`),hp=$(`[data-replay-fish-hp="${index}"]`);
      if(card)card.classList.toggle("down",Number(fish.hp)<=0);
      if(card)card.classList.toggle("attacking",index===attackerIndex);
      if(bar)bar.style.width=hpPercent(fish.hp,fish.maxHp)+"%";
      if(hp)hp.textContent=compactNumber(fish.hp)+" / "+compactNumber(fish.maxHp);
    });

    action.className="battle-action-card "+(kind!=="normal"?"is-"+kind:"");
    const actorBanner=attacker?`<div class="battle-attacker-banner"><span>${fishIcon(attacker)}</span><div><small>PLAYER ATTACK</small><b>${safe(attacker.name)}</b></div></div>`:bossAttack&&kind==="normal"?`<div class="battle-attacker-banner boss"><span>🐲</span><div><small>BOSS ATTACK</small><b>${safe(bossName)}</b></div></div>`:"";
    action.innerHTML=actorBanner+`<div class="battle-action-text">${legacyTextHtml(frame.entry)}</div>`;
  }

  function finishBossBattleReplay(replay){
    const success=replay.result==="처치 성공",action=$("#battleActionCard"),arena=$("#bossBattleArena");
    if(arena){arena.classList.remove("event-skill","event-crazy","event-passive","hit-player","hit-boss");arena.classList.add(success?"battle-win":"battle-lose");}
    if(action)action.innerHTML=`<div class="battle-finish-card ${success?"win":"lose"}"><small>${success?"RAID CLEAR":"RAID FAILED"}</small><strong>${success?"처치 성공":"처치 실패"}</strong><p>총 피해 ${Number(replay.totalDamage||0).toLocaleString()}</p>${success?`<p>${safe(replay.rewardDrop)} × ${Number(replay.rewardDropCount||0).toLocaleString()}${replay.rewardMoney>0?` · ${safe(formatMoney(replay.rewardMoney))}`:""}</p>`:""}<div class="battle-finish-actions"><button data-battle-replay>다시 보기</button><button data-battle-close>닫기</button></div></div>`;
    const title=$("#modalTitle");if(title)title.textContent=success?"보스 레이드 승리":"보스 레이드 패배";
    const turnLabel=$("#battleTurnLabel");if(turnLabel)turnLabel.textContent="BATTLE END";
    if(success){playGameSound("victory");gameVibrate("victory");}
  }

  async function playBossBattleReplay(replay){
    const token=++state.battleReplayToken;
    state.battleReplaySkip=false;
    const frames=Array.isArray(replay.frames)?replay.frames:[];
    for(let i=0;i<frames.length;i++){
      if(token!==state.battleReplayToken||$("#modalOverlay")?.style.display==="none")return;
      if(state.battleReplaySkip){updateReplayFrame(frames[frames.length-1]);break;}
      updateReplayFrame(frames[i]);
      await sleep(Math.max(45,replayDelay(frames[i].entry)/Math.max(1,state.battleReplaySpeed)));
    }
    if(token===state.battleReplayToken)finishBossBattleReplay(replay);
  }

  function openBossBattleReplay(replay){
    state.lastBattleReplay=replay;
    state.battleReplaySpeed=2;
    const first=replay.frames?.[0]||{bossHp:replay.boss.maxHp,bossMaxHp:replay.boss.maxHp,fish:[]};
    const party=(first.fish||[]).map((fish,index)=>`<article class="replay-fish ${gradeClass(fish.grade)}" data-replay-fish-index="${index}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><div class="replay-hp"><i data-replay-fish-bar="${index}" style="width:${hpPercent(fish.hp,fish.maxHp)}%"></i></div><small data-replay-fish-hp="${index}">${compactNumber(fish.hp)} / ${compactNumber(fish.maxHp)}</small></div></article>`).join("");
    openUiModal(`${replay.boss.name} · ${replay.boss.difficulty}`,`<div class="boss-battle-replay"><header class="battle-replay-head"><div><small>LIVE BOSS RAID</small><b id="battleTurnLabel">BATTLE START</b></div><div class="battle-speed"><button data-battle-speed="1">×1</button><button class="active" data-battle-speed="2">×2</button><button data-battle-speed="4">×4</button><button data-battle-skip>건너뛰기</button></div></header><section id="bossBattleArena" class="boss-battle-arena" data-boss-name="${safe(replay.boss.name)}"><div class="grade-attack-layer" aria-hidden="true"></div><div class="replay-boss ${gradeClass(replay.boss.grade)}"><div class="replay-boss-symbol">${bossSymbols[replay.boss.id]||"🐲"}</div><div><small>${safe(replay.boss.grade)} · ${safe(replay.boss.difficulty)}</small><h2>${safe(replay.boss.name)}</h2><div class="replay-hp boss-hp"><i id="replayBossHpBar" style="width:${hpPercent(first.bossHp,first.bossMaxHp)}%"></i></div><b id="replayBossHpText">${compactNumber(first.bossHp)} / ${compactNumber(first.bossMaxHp)}</b></div></div><div class="battle-versus">VS</div><div class="replay-party">${party}</div><div id="battleActionCard" class="battle-action-card">전투가 시작됩니다.</div></section></div>`);
    playBossBattleReplay(replay);
  }

  function maybeOpenLocalBattleReplayDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("battleDemo"))return;
    const boss={id:"azathoth",name:"아자토스",grade:"공허",color:"#d053ff",difficulty:"크레이지",maxHp:70000000000};
    const fish=[
      {key:"1",name:"바다를 삼킨 태양",grade:"공허",hp:4200000000,maxHp:4200000000,status:"정상"},
      {key:"2",name:"해신룡",grade:"영원",hp:3600000000,maxHp:3600000000,status:"정상"},
      {key:"3",name:"휘몰아치는 마음",grade:"초월",hp:2900000000,maxHp:2900000000,status:"정상"}
    ];
    const frame=(entry,turn,bossHp,damageIndex=-1)=>({entry,turn,bossHp,bossMaxHp:boss.maxHp,fish:fish.map((item,index)=>({...item,hp:index===damageIndex?Math.floor(item.hp*.55):item.hp}))});
    const frames=[
      frame("전투 시작",0,boss.maxHp),frame("턴 1",1,boss.maxHp),frame('<span class="battle-event battle-event--skill"><span class="battle-event__eyebrow">BOSS SKILL</span><b><span style="color:#d053ff">아자토스</span> · 맹목의 핵동</b><span class="battle-event__body">회피 불가 전체 공격이 발동했습니다.</span></span>',1,62000000000),
      frame("아자토스의 맹목의 핵동\n파티 전체가 피해를 받았습니다.",1,62000000000,1),frame('<span class="battle-event battle-event--passive"><span class="battle-event__eyebrow">PASSIVE SHIFT</span><b><span style="color:#d053ff">아자토스</span> · 두 번째 각성</b><span class="battle-event__body">회피를 무시하고 치명타율을 감소시킵니다.</span></span>',2,34000000000),frame("바다를 삼킨 태양 공격\n치명타!\n16,000,000,000 피해",3,18000000000),
      frame('<span class="battle-event battle-event--crazy"><span class="battle-event__eyebrow">CRAZY ULTIMATE</span><b><span style="color:#d053ff">아자토스</span> · 잠든 신의 개안</b><span class="battle-event__body">전투당 한 번만 사용하는 궁극기가 발동했습니다.</span></span>',3,18000000000),frame("아자토스를 쓰러뜨렸습니다.",4,0)
    ];
    setTimeout(()=>openBossBattleReplay({boss,frames,result:"처치 성공",totalDamage:70000000000,rewardMoney:3000000000000000,rewardDrop:"혼돈의 핵",rewardDropCount:8}),80);
  }

  function applyLocalCosmeticDemo(){
    if(location.hostname!=="127.0.0.1"||!new URLSearchParams(location.search).has("cosmeticDemo"))return;
    ["kraken","hydra"].forEach(id=>{bossProgress.defeated[id]=true;bossProgress.difficultyClears[id]={normal:true,hard:true,crazy:true};});
    profileCosmetics={border:"kraken",aura:"hydra",background:"영웅",attackEffect:"영웅"};
  }

  function installOutputBridge() {
    const basePrint = print;
    print = function(value) {
      basePrint(value);
      const message = plain(value);
      if (message && !message.startsWith(">")) showToast(message.slice(0, 105));
      if(globalThis.pendingFishingEscape){const escaped=globalThis.pendingFishingEscape;delete globalThis.pendingFishingEscape;showEscapeCelebration(escaped);}
      state.bucketKey = state.bossKey = state.collectionKey = "";
      setTimeout(() => renderAll(true), 0);
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
            <div class="dialog-summary"><div><small>${isPvp ? "ONLINE PVP" : "BOSS RAID"}</small><b>${legacyTextHtml(summary)}</b></div><span>${isPvp ? "⚔️" : "🐲"}</span></div>
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
    renderAll(true);
  }

  function switchView(viewId) {
    if (!document.getElementById(viewId)) return;
    if (viewId !== "bossView" && isBossMenu && typeof leaveBossMenu === "function") leaveBossMenu();
    state.activeView = viewId;
    $$(".game-view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(`[data-view-target]`).forEach(button => button.classList.toggle("active", button.dataset.viewTarget === viewId));
    const view = document.getElementById(viewId);
    $("#pageTitle").textContent = view.dataset.title || "낚시터";
    $("#pageEyebrow").textContent = view.dataset.eyebrow || "";
    window.scrollTo({top:0,behavior:"smooth"});
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
      const avatar=target.querySelector("span");
      if(avatar)avatar.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
      else if(target.classList.contains("captain-avatar"))target.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
    });
    document.body.dataset.profileBackground=cosmeticGrades[backgroundGrade]?.slug||"";
  }

  function showCatchCelebration(fish) {
    const layer = $("#catchCelebration");
    layer.classList.remove("escaped");
    $("#celebrationIcon").textContent = fishIcon(fish);
    $("#celebrationName").textContent = fish.name;
    $("#celebrationMeta").textContent = `[${fish.grade}] ${fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`} · ${formatMoney(fish.price || 0)}`;
    layer.classList.remove("show");
    void layer.offsetWidth;
    layer.classList.add("show");
    clearTimeout(state.catchCelebrationTimer);
    state.catchCelebrationTimer=setTimeout(()=>layer.classList.remove("show"),2450);
    playGameSound("catch",fish.grade);
  }

  function showEscapeCelebration(result){
    const layer=$("#catchCelebration");
    layer.classList.remove("show");
    layer.classList.add("escaped");
    $("#celebrationIcon").textContent="💨";
    $("#celebrationName").textContent=`${result.name} 도주!`;
    $("#celebrationMeta").textContent=`[${result.grade}] ${result.timingResult} 판정 · 도주 확률 ${Number(result.escapeChance||0).toFixed(1)}%`;
    void layer.offsetWidth;
    layer.classList.add("show");
    clearTimeout(state.catchCelebrationTimer);
    state.catchCelebrationTimer=setTimeout(()=>layer.classList.remove("show","escaped"),2450);
  }

  function renderFishing() {
    const scene = $("#fishingScene");
    const castButton = $("#castButton");
    scene.classList.toggle("is-fishing", Boolean(isFishing));
    castButton.disabled = Boolean(isFishing || state.timingActive);
    $("#fishingStateTag").textContent = isFishing ? "입질을 기다리는 중" : state.timingActive ? "타이밍 도전" : "잔잔한 물결";
    $("#fishingHeadline").textContent = isFishing ? "수면 아래 움직임이 느껴져요" : state.timingActive ? "정확한 순간에 낚아채세요!" : "오늘은 어떤 물고기를 만날까요?";
    $("#fishingHint").textContent = isFishing ? "낚싯대를 거두지 말고 조금만 기다려주세요." : state.timingActive ? "가운데 노란 구간은 PERFECT 확률입니다." : "낚싯대를 던지고 타이밍에 맞춰 낚아채세요.";
    castButton.querySelector("b").textContent = isFishing ? "낚시 중..." : "낚싯대 던지기";
    $("#castSubText").textContent = isFishing ? "물고기가 다가오고 있어요" : "";
    $("#castSubText").hidden = !isFishing;
    $("#totalFishingStat").textContent = `${Number(totalFishingCount || 0).toLocaleString()}회`;
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
    const recent = bucket.map((fish, originalIndex) => ({fish, originalIndex})).slice(-10).reverse();
    $("#recentCatchCount").textContent = `${recent.length} / 10`;
    $("#recentCatchEmpty").hidden = recent.length > 0;
    $("#recentCatchGrid").hidden = recent.length === 0;
    $("#recentCatchGrid").innerHTML = recent.map(({fish, originalIndex}, index) => `
      <button type="button" class="recent-catch-item ${gradeClass(fish.grade)}" data-recent-bucket-index="${originalIndex}" data-tooltip="${safe(fish.time || "최근 획득")}" aria-label="${safe(fish.name)} 상세정보 보기">
        <span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>${safe(fish.grade)} · 상세정보 보기</small></div><em>${index + 1}회 전</em>
      </button>`).join("");
  }

  function bucketRenderKey() {
    return `${bucket.length}|${bucketSortOrder}|${bucket.slice(-180).map(f => `${f.id}:${f.locked ? 1 : 0}:${f.combat?.status || ""}`).join("|")}`;
  }
  function renderBucket(force = false) {
    const key = bucketRenderKey();
    if (!force && key === state.bucketKey) return;
    state.bucketKey = key;
    renderRecentCatches();
    const grid = $("#bucketGrid"), empty = $("#bucketEmpty");
    $("#bucketSummary").textContent = bucket.length ? `${bucket.length.toLocaleString()}마리 보유 · 원하는 물고기를 선택해 관리하세요.` : "보유 중인 물고기가 없습니다.";
    empty.classList.toggle("visible", bucket.length === 0);
    grid.hidden = bucket.length === 0;
    $$("[data-sort]").forEach(button => button.classList.toggle("active", button.dataset.sort === bucketSortOrder));
    if (!bucket.length) { grid.replaceChildren(); return; }
    const list = sortedBucketList();
    grid.innerHTML = list.map((entry, index) => {
      const fish = entry.fish, combat = ensureCombatStats(fish), no = index + 1;
      return `<article class="fish-card ${gradeClass(fish.grade)}">
        <div class="fish-card-top"><span class="fish-card-icon">${fishIcon(fish)}</span><span class="fish-card-index">NO.${no}${fish.locked ? " · 🔒" : ""}</span></div>
        <span class="fish-card-grade">${safe(fish.grade)}</span><h3>${safe(fish.name)}</h3><p>${fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`}</p>
        <div class="fish-stats"><div><small>공격력 ${combatStars(combat,"attack")}</small><b>${compactNumber(combat.attack)}</b></div><div><small>체력 ${combatStars(combat,"hp")}</small><b>${compactNumber(combat.maxHp)}</b></div></div>
        <div class="fish-actions"><button data-fish-action="info" data-number="${no}" data-tooltip="능력치와 특성을 확인합니다">상세</button><button data-fish-action="lock" data-number="${no}" data-tooltip="${fish.locked ? "잠금을 해제합니다" : "판매되지 않도록 잠급니다"}">${fish.locked ? "잠금 해제" : "잠금"}</button><button class="sell" data-fish-action="sell" data-number="${no}" data-tooltip="현재 시세로 판매합니다" ${fish.locked ? "disabled" : ""}>판매</button></div>
      </article>`;
    }).join("");
  }

  function openFishDetailByBucketIndex(idx) {
    const fish = bucket[idx];
    if (!fish) return showToast("존재하지 않는 물고기입니다.");
    const displayNumber = getDisplayNumberByBucketIndex(idx);
    const c = ensureCombatStats(fish), trait = getFishTrait(fish);
    openUiModal(fish.name, `<div class="game-dialog"><div class="dialog-summary ${gradeClass(fish.grade)}"><div><small>${safe(fish.grade)} · 양동이 ${displayNumber}번</small><b>${safe(fish.name)}</b></div><span>${fishIcon(fish)}</span></div>
      <div class="dialog-card-grid"><article class="dialog-card"><small>공격력 ${combatStars(c,"attack")}</small><strong>${Number(c.attack).toLocaleString()}</strong></article><article class="dialog-card"><small>체력 ${combatStars(c,"hp")}</small><strong>${Number(c.hp).toLocaleString()} / ${Number(c.maxHp).toLocaleString()}</strong></article><article class="dialog-card"><small>회피율 ${combatStars(c,"dodge")}</small><strong>${Number(c.dodge).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 확률 ${combatStars(c,"critRate")}</small><strong>${Number(c.critRate).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타 피해 ${combatStars(c,"critDamage")}</small><strong>${Number(c.critDamage).toFixed(0)}%</strong></article></div>
      ${trait ? `<article class="dialog-card ${gradeClass(fish.grade)}"><small>고유 특성</small><h3>${safe(trait.name)}</h3><p>${safe(trait.desc)}</p></article>` : ""}</div>`);
  }
  function openFishDetail(displayNumber) {
    openFishDetailByBucketIndex(getBucketIndexByDisplayNumber(Number(displayNumber)));
  }

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
    openUiModal("물고기 도감", `<div class="game-dialog"><div class="dialog-summary"><div><small>FISH COLLECTION</small><b>${Object.keys(collection || {}).length} / ${allFishCount()}종</b></div><span>📖</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }
  function openCoreCollection() {
    const cards = bossList.map(boss => {
      const owned = Number(bossProgress?.materials?.[boss.drop] || 0), discovered = owned > 0 || isBossDifficultyCleared(boss,"normal");
      return `<article class="dialog-card ${gradeClass(boss.grade)}"><small>${safe(boss.name)}</small><h3>${discovered ? `💎 ${safe(boss.drop)}` : "❔ 미발견 코어"}</h3><strong>x${owned.toLocaleString()}</strong></article>`;
    }).join("");
    openUiModal("코어 도감", `<div class="game-dialog"><div class="dialog-summary"><div><small>BOSS CORE</small><b>일반 1~3 · 어려움 3~5 · 크레이지 5~10</b></div><span>💎</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function renderBosses(force = false) {
    const key = `${bossProgress?.selectedDifficulty||"normal"}|${bossList.map(b => bossProgress?.materials?.[b.drop] || 0).join("|")}|${bossList.map(b => BOSS_DIFFICULTY_ORDER.map(d=>isBossDifficultyCleared(b,d)?1:0).join("")).join("|")}`;
    if (!force && key === state.bossKey) return;
    state.bossKey = key;
    $("#bossGrid").innerHTML = bossList.map((boss, index) => {
      const unlocked = isBossUnlocked(boss), cleared = isBossDifficultyCleared(boss,"normal"), owned = Number(bossProgress?.materials?.[boss.drop] || 0);
      const difficultyBadges=BOSS_DIFFICULTY_ORDER.map(id=>{const config=getBossDifficultyConfig(id),done=isBossDifficultyCleared(boss,id),open=isBossDifficultyUnlocked(boss,id);return `<span class="difficulty-badge ${done?"cleared":open?"open":"locked"}">${config.name}${done?" ✓":open?"":" 🔒"}</span>`;}).join("");
      return `<article class="boss-card ${gradeClass(boss.grade)} ${unlocked ? "" : "locked"}" data-tooltip="${safe(boss.skillName)}"><div class="boss-card-head"><div><small>${safe(boss.grade)} · ${cleared ? "일반 처치 완료" : unlocked ? "도전 가능" : "잠김"}</small><h3>${safe(boss.name)}</h3><p>${safe(boss.skillName)}</p></div><span class="boss-card-symbol">${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-difficulty-status">${difficultyBadges}</div><div class="boss-stats"><span>❤️ ${compactNumber(boss.hp)}</span><span>⚔️ ${compactNumber(boss.attack)}</span><span>💨 ${boss.dodge}%</span></div><div class="boss-reward"><span>💎 ${safe(boss.drop)}</span><b>x${owned.toLocaleString()}</b></div><button data-boss-index="${index + 1}" ${unlocked ? "" : "disabled"}>${unlocked ? "난이도 선택 · 도전" : "이전 보스 일반 처치 필요"}</button></article>`;
    }).join("");
  }

  function openBossParty(bossNumber = 0) {
    if (!currentUser) { showToast("보스전에 도전하려면 먼저 로그인해주세요."); switchView("communityView"); return; }
    recoverStunnedFish();
    isBossMenu = true;
    if (bossNumber) {
      const boss = bossList[Number(bossNumber) - 1];
      if (boss && isBossUnlocked(boss)) { bossProgress.selectedBossId = boss.id; bossProgress.selectedDifficulty=getSelectedBossDifficulty(boss); saveGame(); }
    }
    const baseBoss = getCurrentBoss(), difficultyId=getSelectedBossDifficulty(baseBoss), difficulty=getBossDifficultyConfig(difficultyId), boss=getBossForDifficulty(baseBoss,difficultyId);
    const gradeRank=Object.fromEntries(grades.map((grade,index)=>[grade.name,index]));
    const combatPower=fish=>{const c=ensureCombatStats(fish);return c.attack*(1+c.critRate/100*Math.max(0,c.critDamage/100-1))+c.maxHp*.2;};
    const list=bucket.map((fish,originalIndex)=>({fish,originalIndex})).filter(entry=>entry.fish.grade!=="쓰레기").sort((a,b)=>{
      if(state.bossPartySortOrder==="공격력")return ensureCombatStats(b.fish).attack-ensureCombatStats(a.fish).attack||b.originalIndex-a.originalIndex;
      if(state.bossPartySortOrder==="체력")return ensureCombatStats(b.fish).maxHp-ensureCombatStats(a.fish).maxHp||b.originalIndex-a.originalIndex;
      if(state.bossPartySortOrder==="등급")return (gradeRank[b.fish.grade]??-1)-(gradeRank[a.fish.grade]??-1)||combatPower(b.fish)-combatPower(a.fish);
      if(state.bossPartySortOrder==="최근 획득")return b.originalIndex-a.originalIndex;
      return combatPower(b.fish)-combatPower(a.fish)||b.originalIndex-a.originalIndex;
    }).slice(0,60);
    const fishCards = list.map(entry => {
      const fish = entry.fish, no = getDisplayNumberByBucketIndex(entry.originalIndex), selected = bossPrepIndexes.includes(entry.originalIndex), c = ensureCombatStats(fish);
      return `<article class="boss-party-fish ${gradeClass(fish.grade)} ${selected ? "selected" : ""}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>⚔ ${compactNumber(c.attack)} ${combatStars(c,"attack")} · ❤️ ${compactNumber(c.maxHp)} ${combatStars(c,"hp")}</small></div><button data-boss-prep-number="${no}" data-selected="${selected ? 1 : 0}">${selected ? "해제" : "참가"}</button></article>`;
    }).join("");
    const cooldown = getBossCooldownLeft(boss.id,difficultyId);
    const difficultyButtons=BOSS_DIFFICULTY_ORDER.map(id=>{const config=getBossDifficultyConfig(id),open=isBossDifficultyUnlocked(baseBoss,id),done=isBossDifficultyCleared(baseBoss,id);return `<button data-boss-difficulty="${id}" class="${id===difficultyId?"active":""}" ${open?"":"disabled"}>${config.name}${done?" ✓":open?"":" 🔒"}</button>`;}).join("");
    const sortButtons=["전투력","공격력","체력","등급","최근 획득"].map(order=>`<button data-boss-party-sort="${order}" class="${state.bossPartySortOrder===order?"active":""}">${order}</button>`).join("");
    const firstReward=getBossDifficultyReward(baseBoss,difficultyId),coreRange=getBossCoreRange(difficultyId);
    openUiModal(`${boss.name} · ${difficulty.name}`, `<div class="game-dialog"><div class="dialog-summary ${gradeClass(boss.grade)}"><div><small>${safe(boss.grade)} BOSS · ${safe(difficulty.name)} · 파티 ${bossPrepIndexes.length} / 5</small><b>${safe(boss.name)}</b><p>❤️ ${boss.hp.toLocaleString()} · ⚔️ ${boss.attack.toLocaleString()} · 💨 ${boss.dodge}%</p><p>최초 상금 ${formatMoney(firstReward)} · 💎 ${safe(boss.drop)} ${coreRange.min}~${coreRange.max}개</p></div><span>${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-difficulty-selector">${difficultyButtons}</div>${difficultyId==="crazy"?`<div class="crazy-warning">💀 10% 확률 · 전투당 1회 · 체력 35% 이하 미사용 시 확정<br>${safe(baseBoss.crazySkillName||CRAZY_BOSS_SKILL_NAMES[baseBoss.id]||"크레이지 궁극기")}</div>`:""}<div class="boss-party-sort"><small>출전 물고기 정렬</small><div>${sortButtons}</div></div><div class="boss-party-list">${fishCards || "출전 가능한 물고기가 없습니다."}</div><div class="dialog-actions"><button class="primary" data-boss-start data-boss-id="${boss.id}" data-start-boss-difficulty="${difficultyId}" data-boss-difficulty-name="${safe(difficulty.name)}" ${cooldown > 0 ? "disabled" : ""}>${cooldown > 0 ? `쿨타임 ${formatRemain(cooldown)}` : `${safe(difficulty.name)} 레이드 시작`}</button><button data-ui-action="coreCollection">보유 코어 확인</button></div></div>`);
  }

  function updateOpenBossCooldown(){
    const button=$("#modalBody [data-boss-start]");
    if(!button)return;
    const left=getBossCooldownLeft(button.dataset.bossId,button.dataset.startBossDifficulty);
    button.disabled=left>0;
    button.textContent=left>0?`쿨타임 ${formatRemain(left)}`:`${button.dataset.bossDifficultyName||"선택한 난이도"} 레이드 시작`;
  }

  function openMarket() {
    refreshMarketIfNeeded();
    const order = {"영원":0,"초월":1,"신화":2,"전설":3};
    const cards = Object.entries(marketRates).sort((a,b) => (order[getFishGradeByName(a[0])] ?? 9) - (order[getFishGradeByName(b[0])] ?? 9) || b[1]-a[1]).map(([name, bonus]) => {
      const grade = getFishGradeByName(name), discovered = Boolean(collection?.[name]);
      return `<article class="dialog-card market-card ${gradeClass(grade)}"><span>${discovered ? fishIcon({name,grade}) : "❔"}</span><div><small>${discovered ? safe(grade) : "미발견"}</small><h3>${discovered ? safe(displayFishName(name)) : "???"}</h3></div><strong>+${bonus}%</strong></article>`;
    }).join("");
    openUiModal("현재 시세", `<div class="game-dialog"><div class="dialog-summary"><div><small>MARKET BONUS</small><b>${Object.keys(marketRates).length}종 가격 상승</b><p>다음 갱신까지 약 ${getNextMarketMinutes()}분</p></div><span>📈</span></div><div class="dialog-card-grid">${cards}</div></div>`);
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
    openUiModal("칭호", `<div class="game-dialog"><div class="dialog-summary"><div><small>CURRENT TITLE</small><b>${safe(getCurrentTitle() || "없음")}</b></div><span>🎖️</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function cosmeticChoiceCard({type,id,name,desc,icon,color,unlocked,selected}){
    const status=selected?"장착 중":unlocked?"해금 완료":"잠김";
    return `<article class="cosmetic-card ${selected?"selected":""} ${unlocked?"":"locked"}" style="--cosmetic-color:${safe(color||"#4ee4ce")}"><span class="cosmetic-icon">${icon||"✦"}</span><div><small>${status}</small><h3>${safe(name)}</h3><p>${safe(desc)}</p></div><button data-cosmetic-type="${type}" data-cosmetic-id="${safe(id)}" ${unlocked&&!selected?"":"disabled"}>${selected?"현재 장착":unlocked?"장착":"조건 미달"}</button></article>`;
  }

  function openCosmetics(){
    const defaultCards=[
      cosmeticChoiceCard({type:"border",id:"",name:"기본 테두리",desc:"프로필 테두리를 해제합니다.",icon:"⚓",unlocked:true,selected:!profileCosmetics.border}),
      cosmeticChoiceCard({type:"aura",id:"",name:"오라 없음",desc:"프로필 오라를 해제합니다.",icon:"○",unlocked:true,selected:!profileCosmetics.aura})
    ].join("");
    const borders=bossList.map(boss=>cosmeticChoiceCard({type:"border",id:boss.id,name:boss.name+" 테두리",desc:boss.name+" 어려움 최초 클리어",icon:bossSymbols[boss.id],color:boss.color,unlocked:isProfileCosmeticUnlocked("border",boss.id),selected:profileCosmetics.border===boss.id})).join("");
    const auras=bossList.map(boss=>cosmeticChoiceCard({type:"aura",id:boss.id,name:boss.name+" 오라",desc:boss.name+" 크레이지 최초 클리어",icon:bossSymbols[boss.id],color:boss.color,unlocked:isProfileCosmeticUnlocked("aura",boss.id),selected:profileCosmetics.aura===boss.id})).join("");
    const gradeRewards=Object.entries(cosmeticGrades).map(([grade,config])=>{
      const gradeBosses=bossList.filter(boss=>boss.grade===grade),cleared=gradeBosses.filter(boss=>isBossDifficultyCleared(boss,"crazy")).length,unlocked=isBossGradeCrazyCleared(grade);
      return `<article class="grade-cosmetic-card ${unlocked?"unlocked":"locked"}" style="--cosmetic-color:${config.primary};--cosmetic-secondary:${config.secondary}"><span>${config.icon}</span><div><small>${unlocked?"등급 정복 완료":`${cleared} / ${gradeBosses.length} 크레이지`}</small><h3>${safe(config.name)}</h3><p>${safe(grade)} 보스 전원의 크레이지를 클리어하면 배경과 한정 공격 연출을 함께 획득합니다.</p><div class="cosmetic-actions"><button data-cosmetic-type="background" data-cosmetic-id="${grade}" ${unlocked&&profileCosmetics.background!==grade?"":"disabled"}>${profileCosmetics.background===grade?"배경 장착 중":"배경 장착"}</button><button data-cosmetic-type="attackEffect" data-cosmetic-id="${grade}" ${unlocked&&profileCosmetics.attackEffect!==grade?"":"disabled"}>${profileCosmetics.attackEffect===grade?"공격 연출 장착 중":"공격 연출 장착"}</button></div></div></article>`;
    }).join("");
    openUiModal("프로필 꾸미기",`<div class="game-dialog cosmetics-dialog"><div class="dialog-summary"><div><small>BOSS CLEAR COSMETICS</small><b>보스 정복 보상</b><p>어려움 테두리 · 크레이지 오라 · 등급 정복 배경과 공격 연출</p></div><div id="cosmeticProfilePreview" class="profile-preview"><i class="profile-aura-layer"></i><span>⚓</span></div></div><section class="cosmetic-section"><h3>기본 설정</h3><div class="cosmetic-grid">${defaultCards}</div></section><section class="cosmetic-section"><h3>프로필 테두리</h3><div class="cosmetic-grid">${borders}</div></section><section class="cosmetic-section"><h3>개별 보스 오라</h3><div class="cosmetic-grid">${auras}</div></section><section class="cosmetic-section"><h3>등급 정복 보상</h3><div class="grade-cosmetic-grid">${gradeRewards}</div></section></div>`);
    const preview=$("#cosmeticProfilePreview");
    if(preview){
      const borderBoss=bossList.find(boss=>boss.id===profileCosmetics.border),auraBoss=bossList.find(boss=>boss.id===profileCosmetics.aura);
      preview.classList.toggle("has-profile-border",!!borderBoss);preview.classList.toggle("has-profile-aura",!!auraBoss);
      preview.style.setProperty("--profile-border-color",borderBoss?.color||"#4ee4ce");preview.style.setProperty("--profile-aura-color",auraBoss?.color||"#4ee4ce");preview.dataset.auraSymbol=auraBoss?bossSymbols[auraBoss.id]||"✦":"";preview.dataset.borderSymbol=borderBoss?bossSymbols[borderBoss.id]||"✦":"";
      const previewAvatar=preview.querySelector("span");if(previewAvatar)previewAvatar.textContent=borderBoss?bossSymbols[borderBoss.id]||"✦":"⚓";
    }
  }

  function openSettings(){
    openUiModal("설정",`<div class="game-dialog settings-dialog"><div class="dialog-summary"><div><small>GAME SETTINGS</small><b>효과음과 진동</b><p>설정은 이 기기에 저장됩니다.</p></div><span>⚙️</span></div><article class="setting-row"><div><span>🔊</span><div><h3>효과음</h3><p>캐스팅·판정·획득·보스 공격·치명타·승리 효과음</p></div></div><button data-feedback-toggle="sound" class="${feedbackSettings.sound?"on":"off"}">${feedbackSettings.sound?"켜짐":"꺼짐"}</button></article><article class="setting-row"><div><span>📳</span><div><h3>모바일 진동</h3><p>입질과 치명타 순간의 진동 피드백</p></div></div><button data-feedback-toggle="vibration" class="${feedbackSettings.vibration?"on":"off"}">${feedbackSettings.vibration?"켜짐":"꺼짐"}</button></article></div>`);
  }

  async function openRanking() {
    openUiModal("랭킹", `<div class="game-dialog"><div class="dialog-summary"><div><small>ONLINE RANKING</small><b>순위를 불러오는 중...</b></div><span>🏆</span></div></div>`);
    try {
      if (currentUser) await saveCloudData();
      const [moneySnap, levelSnap] = await Promise.all([db.collection("users").orderBy("money","desc").limit(20).get(), db.collection("users").orderBy("rodLevel","desc").limit(20).get()]);
      const section = (docs,type) => docs.map((doc,index) => { const u=doc.data(); const value=type==="money"?formatMoney(u.money||0):`Lv.${u.rodLevel||1}`; return `<article class="dialog-card"><small>RANK ${index+1}</small><h3>${safe(formatUserName(u.nickname||"낚시꾼",u.title||""))}</h3><strong>${value}</strong></article>`; }).join("");
      openUiModal("랭킹", `<div class="game-dialog"><div class="dialog-summary"><div><small>ONLINE RANKING</small><b>FishingLife TOP 20</b></div><span>🏆</span></div><h3>지갑 랭킹</h3><div class="dialog-card-grid">${section(moneySnap.docs,"money")}</div><h3>낚싯대 랭킹</h3><div class="dialog-card-grid">${section(levelSnap.docs,"level")}</div></div>`);
    } catch (error) { console.error(error); showToast("랭킹을 불러오지 못했습니다."); closeModal(); }
  }

  async function openPvpPanel() {
    if (!currentUser) return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>ONLINE PVP</small><b>로그인이 필요합니다.</b></div><span>⚔️</span></div></div>`);
    const active = await getMyActivePvp();
    if (!active) return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>ONLINE PVP</small><b>새로운 상대에게 도전하세요</b></div><span>⚔️</span></div><div class="dialog-form"><label for="pvpNickname">상대 닉네임</label><input id="pvpNickname" maxlength="12" placeholder="닉네임"><button data-pvp-request>대전 신청</button></div></div>`);
    if (active.status === "requested") {
      const incoming = active.requester !== currentUser;
      return openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>대전 신청 ${incoming ? "도착" : "전송 완료"}</small><b>VS ${safe(active.opponent || "상대")}</b></div><span>⚔️</span></div><div class="dialog-actions">${incoming ? `<button class="primary" data-pvp-accept>수락</button><button data-pvp-reject>거절</button>` : ""}<button data-pvp-cancel>대전 취소</button></div></div>`);
    }
    const list = sortedBucketList().filter(entry => entry.fish.grade !== "쓰레기").slice(0,40);
    const fishCards = list.map(entry => { const selected=pvpPrepIndexes.includes(entry.originalIndex),f=entry.fish,c=ensureCombatStats(f),no=getDisplayNumberByBucketIndex(entry.originalIndex); return `<article class="boss-party-fish ${gradeClass(f.grade)} ${selected ? "selected" : ""}"><span>${fishIcon(f)}</span><div><b>${safe(f.name)}</b><small>⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.maxHp)}</small></div><button data-pvp-fish="${no}" data-selected="${selected?1:0}">${selected?"해제":"참가"}</button></article>`; }).join("");
    openUiModal("1대1 대전", `<div class="game-dialog"><div class="dialog-summary"><div><small>VS ${safe(active.opponent || "상대")}</small><b>출전 파티 ${pvpPrepIndexes.length} / 3</b></div><span>⚔️</span></div><div class="boss-party-list">${fishCards}</div><div class="dialog-actions"><button class="primary" data-pvp-ready>준비 완료</button><button data-pvp-cancel>대전 취소</button></div></div>`);
  }

  function openPresets() {
    openUiModal("파티 프리셋", `<div class="game-dialog"><div class="dialog-summary"><div><small>PARTY PRESET</small><b>보스 ${partyPresets.boss.length}마리 · PVP ${partyPresets.pvp.length}마리</b></div><span>🧭</span></div><div class="dialog-card-grid"><article class="dialog-card"><small>BOSS PARTY</small><h3>보스전 프리셋</h3><p>현재 준비한 보스 파티를 저장하거나 불러옵니다.</p><div class="dialog-actions"><button data-game-command="파티저장 보스">저장</button><button data-game-command="파티불러오기 보스">불러오기</button><button data-game-command="파티해제 보스">삭제</button></div></article><article class="dialog-card"><small>PVP PARTY</small><h3>대전 프리셋</h3><p>현재 준비한 PVP 파티를 저장하거나 불러옵니다.</p><div class="dialog-actions"><button data-game-command="파티저장 pvp">저장</button><button data-game-command="파티불러오기 pvp">불러오기</button><button data-game-command="파티해제 pvp">삭제</button></div></article></div></div>`);
  }
  function openMessageForm() {
    openUiModal("메시지 보내기", `<div class="game-dialog"><div class="dialog-summary"><div><small>DIRECT MESSAGE</small><b>친구에게 메시지를 보냅니다</b></div><span>💌</span></div><div class="dialog-form"><label for="messageNickname">받는 사람 닉네임</label><input id="messageNickname" maxlength="12" placeholder="닉네임"><label for="messageText">메시지</label><input id="messageText" maxlength="300" placeholder="보낼 내용을 입력하세요"><button data-message-send>메시지 보내기</button></div></div>`);
  }
  async function sendDirectMessage(targetNickname, messageText) {
    if (!currentUser) return showToast("로그인 후 사용할 수 있습니다.");
    targetNickname = cleanNickname(targetNickname); messageText = safeMessageText(messageText);
    if (!targetNickname || !messageText) return showToast("닉네임과 메시지를 모두 입력해주세요.");
    if (targetNickname === currentUser) return showToast("자기 자신에게는 보낼 수 없습니다.");
    if (isOnlineActionRunning) return showToast("처리 중입니다.");
    isOnlineActionRunning = true;
    try {
      const targetRef = db.collection("users").doc(targetNickname), targetSnap = await targetRef.get();
      if (!targetSnap.exists) throw new Error("TARGET_NOT_FOUND");
      const payload = {id:`msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,from:currentUser,fromTitle:getCurrentTitle(),text:messageText,createdAtMillis:Date.now()};
      await db.runTransaction(async tx => { const snap=await tx.get(targetRef); if(!snap.exists) throw new Error("TARGET_NOT_FOUND"); const data=snap.data(),targetMessages=[...(data.gameState?.messages || []),payload]; tx.set(targetRef,{cloudRevision:Number(data.cloudRevision||0)+1,gameState:{...(data.gameState||{}),messages:targetMessages},updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); });
      await db.collection("serverAlerts").add({type:"userMessage",from:currentUser,fromTitle:getCurrentTitle(),to:targetNickname,text:messageText,messageId:payload.id,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtMillis:payload.createdAtMillis});
      closeModal(); showToast(`${targetNickname} 님에게 메시지를 보냈습니다.`);
    } catch (error) { console.error(error); showToast(error.message === "TARGET_NOT_FOUND" ? "존재하지 않는 닉네임입니다." : "메시지를 보내지 못했습니다."); }
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
    const key = `${currentUser || "local"}|${bucket.length}|${trainingLevels?.attack || 0}|${trainingLevels?.hp || 0}|${trainingLevels?.critDamage || 0}`;
    if (key === state.trainingSyncKey && state.trainingBucketRef === bucket) return;
    state.trainingSyncKey = key;
    state.trainingBucketRef = bucket;
    bucket.forEach(fish => { if (fish?.combat) applyTrainingBonusesToCombat(fish.combat); });
  }
  function renderAll(force = false) {
    try { syncOwnedFishTrainingBonuses(); renderHeader(); renderFishing(); renderBucket(force); renderCollection(force); renderBosses(force); renderGrowth(); state.initialized = true; }
    catch (error) { console.error("FishingLife UI 갱신 오류", error); }
  }

  function handleUiAction(action) {
    const map = {market:openMarket,fishCollection:openFishCollection,coreCollection:openCoreCollection,bossParty:()=>openBossParty(),ranking:openRanking,wallet:openWallet,achievements:openAchievements,titles:openTitles,cosmetics:openCosmetics,settings:openSettings,pvp:openPvpPanel,presets:openPresets,message:openMessageForm};
    map[action]?.();
  }

  document.addEventListener("click", async event => {
    const feedbackToggle=event.target.closest("[data-feedback-toggle]");
    if(feedbackToggle){const key=feedbackToggle.dataset.feedbackToggle;if(key==="sound"||key==="vibration"){feedbackSettings[key]=!feedbackSettings[key];saveFeedbackSettings();if(key==="sound"&&feedbackSettings.sound)playGameSound("timing","PERFECT");openSettings();}return;}
    const cosmeticButton=event.target.closest("[data-cosmetic-type]");
    if(cosmeticButton&&!cosmeticButton.disabled){const type=cosmeticButton.dataset.cosmeticType,id=cosmeticButton.dataset.cosmeticId||"";if(equipProfileCosmetic(type,id)){renderProfileCosmetics();showToast("꾸미기 설정이 변경되었습니다.");openCosmetics();}return;}
    const battleSpeed=event.target.closest("[data-battle-speed]");
    if(battleSpeed){state.battleReplaySpeed=Number(battleSpeed.dataset.battleSpeed)||1;$$('[data-battle-speed]').forEach(button=>button.classList.toggle("active",button===battleSpeed));return;}
    if(event.target.closest("[data-battle-skip]")){state.battleReplaySkip=true;return;}
    if(event.target.closest("[data-battle-replay]")){if(state.lastBattleReplay)openBossBattleReplay(state.lastBattleReplay);return;}
    if(event.target.closest("[data-battle-close]")){state.battleReplayToken++;closeModal();return;}
    const viewButton = event.target.closest("[data-view-target]"); if (viewButton) return switchView(viewButton.dataset.viewTarget);
    const uiButton = event.target.closest("[data-ui-action]"); if (uiButton) return handleUiAction(uiButton.dataset.uiAction);
    const commandButton = event.target.closest("[data-game-command]"); if (commandButton) { await runGameCommand(commandButton.dataset.gameCommand); if ($("#modalOverlay").style.display === "block" && commandButton.closest(".modalBody")) closeModal(); return; }
    const sortButton = event.target.closest("[data-sort]"); if (sortButton) return runGameCommand(`정렬 ${sortButton.dataset.sort}`);
    const recentFishButton = event.target.closest("[data-recent-bucket-index]"); if (recentFishButton) return openFishDetailByBucketIndex(Number(recentFishButton.dataset.recentBucketIndex));
    const fishButton = event.target.closest("[data-fish-action]");
    if (fishButton) {
      const no=fishButton.dataset.number, action=fishButton.dataset.fishAction;
      if(action==="info") return openFishDetail(no);
      return runGameCommand(`${action==="lock" ? (fishButton.textContent.includes("해제") ? "잠금해제" : "잠금") : "판매"} ${no}`);
    }
    const bossButton = event.target.closest("[data-boss-index]"); if (bossButton && !bossButton.disabled) return openBossParty(bossButton.dataset.bossIndex);
    const difficultyButton=event.target.closest("[data-boss-difficulty]"); if(difficultyButton&&!difficultyButton.disabled){selectBossDifficulty(difficultyButton.dataset.bossDifficulty,true);return openBossParty();}
    const bossPartySort=event.target.closest("[data-boss-party-sort]"); if(bossPartySort){state.bossPartySortOrder=bossPartySort.dataset.bossPartySort;return openBossParty();}
    const prepButton = event.target.closest("[data-boss-prep-number]");
    if(prepButton){ prepButton.dataset.selected==="1" ? unprepareBossFish(Number(prepButton.dataset.bossPrepNumber)) : prepareBossFish(Number(prepButton.dataset.bossPrepNumber)); return openBossParty(); }
    if(event.target.closest("[data-boss-start]")){
      runBossBattle();
      if(pendingRecoveryBattleConfirm) openUiModal("회복 중인 물고기", `<div class="game-dialog"><div class="dialog-summary"><div><small>주의</small><b>회복 중인 물고기가 포함되어 있습니다.</b></div><span>❤️‍🩹</span></div><button class="dialog-primary" data-boss-confirm>그래도 전투 시작</button></div>`);
      return;
    }
    if(event.target.closest("[data-boss-confirm]")){ runBossBattle(); return; }
    const titleButton=event.target.closest("[data-title-index]"); if(titleButton){ equipTitle(titleButton.dataset.titleIndex); return openTitles(); }
    if(event.target.closest("[data-message-send]")) return sendDirectMessage($("#messageNickname").value,$("#messageText").value);
    if(event.target.closest("[data-pvp-request]")){ await requestPvp($("#pvpNickname").value); return openPvpPanel(); }
    if(event.target.closest("[data-pvp-accept]")){ await acceptLatestPvpRequest(); return openPvpPanel(); }
    if(event.target.closest("[data-pvp-reject]")){ await rejectLatestPvpRequest(); return openPvpPanel(); }
    if(event.target.closest("[data-pvp-cancel]")){ await cancelPvpRequest(); return openPvpPanel(); }
    const pvpFish=event.target.closest("[data-pvp-fish]"); if(pvpFish){ pvpFish.dataset.selected==="1" ? await unpreparePvpFish(pvpFish.dataset.pvpFish) : await preparePvpFish(pvpFish.dataset.pvpFish); return openPvpPanel(); }
    if(event.target.closest("[data-pvp-ready]")){ await finishPvpReady(); return openPvpPanel(); }
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
  state.previousBucketCount = bucket.length;
  renderAll(true);
  installTooltips();
  maybeOpenLocalBattleReplayDemo();
  setInterval(() => { renderAll(false); updateOpenBossCooldown(); if($("#log").textContent.length > 80000) $("#log").replaceChildren(); }, 800);
})();
