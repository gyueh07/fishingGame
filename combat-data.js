function updateWallet(){
  const shownMoney = currentUser ? money : 0;
  const wallet = document.getElementById("wallet");
  wallet.replaceChildren();
  const moneyBold = document.createElement("b");
  const userBold = document.createElement("b");
  moneyBold.textContent = formatMoney(shownMoney);
  userBold.textContent = currentUser ? currentUser : "로그인 안 됨";
  wallet.append("현재 돈 : ", moneyBold, document.createElement("br"), "계정 : ", userBold);
}

function getUpgradeCost(level){
  const points = [
    [1, 1000],[100, 7500],[200, 30000],[300, 150000],[400, 750000],
    [500, 3500000],[600, 15000000],[700, 75000000],[800, 300000000],
    [900, 1500000000],[950, 4000000000],[1000, 50000000000],
    [1100, 100000000000],[1200, 200000000000],[1300, 400000000000],
    [1400, 700000000000],[1500, 1000000000000],[1550, 1500000000000],
    [1600, 2000000000000],[1650, 3000000000000],[1700, 4000000000000],
    [1750, 5000000000000],[1800, 6500000000000],[1850, 8500000000000],
    [1900, 11000000000000],[1950, 14500000000000],[2000, 20000000000000]
  ];

  if(level <= 1) return points[0][1];
  if(level >= MAX_ROD) return points[points.length - 1][1];

  for(let i = 0; i < points.length - 1; i++){
    const [l1, c1] = points[i];
    const [l2, c2] = points[i + 1];

    if(level >= l1 && level <= l2){
      const t = (level - l1) / (l2 - l1);
      return Math.floor(c1 * Math.pow(c2 / c1, t));
    }
  }

  return 1000;
}

function getUpgradeSuccessRate(level){
  if(level >= MAX_ROD) return 0;
  if(level < 1000){
    const t = (level - 1) / (999 - 1);
    return 100 - (90 * t);
  }
  return 100;
}

function getCurrentPlayableMaxRod(){
  return MAX_ROD;
}

function getBossMaterialRequirement(level){
  if(level < 1000) return null;
  if(level >= getCurrentPlayableMaxRod()) return "LOCKED";

  let item = "";
  let start = 1000;

  if(level < 1050){ item = "심연의 촉수"; start = 1000; }
  else if(level < 1100){ item = "히드라의 독니"; start = 1050; }
  else if(level < 1150){ item = "리바이어던의 코어"; start = 1100; }
  else if(level < 1200){ item = "고대의 비늘"; start = 1150; }
  else if(level < 1250){ item = "불멸의 깃털"; start = 1200; }
  else if(level < 1300){ item = "용왕의 심장"; start = 1250; }
  else if(level < 1350){ item = "혼돈의 파편"; start = 1300; }
  else if(level < 1400){ item = "세계뱀의 비늘"; start = 1350; }
  else if(level < 1450){ item = "글레이프니르의 파편"; start = 1400; }
  else if(level < 1500){ item = "무스펠의 불꽃"; start = 1450; }
  else if(level < 1550){ item = "명계의 송곳니"; start = 1500; }
  else if(level < 1600){ item = "세계수의 썩은 뿌리"; start = 1550; }
  else if(level < 1650){ item = "다마반드의 사슬"; start = 1600; }
  else if(level < 1700){ item = "폭풍의 심장"; start = 1650; }
  else if(level < 1750){ item = "파멸의 근원"; start = 1700; }
  else if(level < 1800){ item = "원초의 어둠"; start = 1750; }
  else if(level < 1850){ item = "시간의 파편"; start = 1800; }
  else if(level < 1900){ item = "천 번째 가면"; start = 1850; }
  else if(level < 1950){ item = "은빛 열쇠"; start = 1900; }
  else if(level < 2000){ item = "혼돈의 핵"; start = 1950; }
  else return "LOCKED";

  const amount = Math.floor((level - start) / 25) + 1;
  return {item, amount};
}

function getRequiredBossMaterials(level){
  const req = getBossMaterialRequirement(level);
  if(!req || req === "LOCKED") return [];
  return [{name:req.item, count:req.amount}];
}

function hasRequiredBossMaterials(level){
  return getRequiredBossMaterials(level).every(m => (bossProgress.materials[m.name] || 0) >= m.count);
}

function formatRequiredBossMaterials(level){
  const req = getRequiredBossMaterials(level);
  if(req.length === 0) return "";
  return req.map(m => m.name + " x" + m.count).join("\n");
}

function consumeRequiredBossMaterials(level){
  getRequiredBossMaterials(level).forEach(m => {
    bossProgress.materials[m.name] = Math.max(0, (bossProgress.materials[m.name] || 0) - m.count);
  });
}

function getLockedUpgradeMessage(){
  return "낚싯대가 최대 강화 레벨인 " + MAX_ROD + "레벨에 도달했습니다.";
}

function tryUpgradeSuccess(level){
  return Math.random() * 100 < getUpgradeSuccessRate(level);
}

function getRawGradeChances(){
  if(rodLevel <= 1000){
    const t = (rodLevel - 1) / (1000 - 1);
    return [
      {name:"쓰레기", chance: 18 - 17.5 * t},
      {name:"일반", chance: 55 - 43 * t},
      {name:"희귀", chance: 25 - 1 * t},
      {name:"영웅", chance: 8 + 27 * t},
      {name:"전설", chance: 2.2 + 27.8 * t},
      {name:"신화", chance: 0.7 + 13.3 * t},
      {name:"초월", chance: 0.1 + 6.9 * t},
      {name:"영원", chance: rodLevel >= 400 ? 0.1 + ((rodLevel - 400) / (1000 - 400)) * 1.4 : 0},
      {name:"공허", chance:0}
    ];
  }

  const base = {"쓰레기":0.40,"일반":9.68,"희귀":19.35,"영웅":28.23,"전설":24.19,"신화":11.29,"초월":5.65,"영원":1.21,"공허":0};
  const legacyTarget = {"쓰레기":0,"일반":3,"희귀":12,"영웅":20,"전설":25,"신화":23,"초월":11,"영원":4.5,"공허":1.5};
  if(rodLevel <= LEGACY_MAX_ROD){
    const t = Math.min(1, (rodLevel - 1000) / (LEGACY_MAX_ROD - 1000));
    return Object.keys(legacyTarget).map(name => ({name, chance: base[name] + (legacyTarget[name] - base[name]) * t}));
  }

  const finalTarget = {"쓰레기":0,"일반":2,"희귀":8,"영웅":16,"전설":24,"신화":26,"초월":14,"영원":7,"공허":3};
  const t = Math.min(1, (rodLevel - LEGACY_MAX_ROD) / (MAX_ROD - LEGACY_MAX_ROD));
  return Object.keys(finalTarget).map(name => ({name, chance: legacyTarget[name] + (finalTarget[name] - legacyTarget[name]) * t}));
}

const fishingTimingWeights = {
  PERFECT:{"쓰레기":0.85,"일반":0.90,"희귀":0.95,"영웅":1.00,"전설":1.12,"신화":1.15,"초월":1.20,"영원":1.25,"공허":1.30},
  GREAT:{"쓰레기":1,"일반":1,"희귀":1,"영웅":1,"전설":1,"신화":1,"초월":1,"영원":1,"공허":1},
  GOOD:{"쓰레기":1.05,"일반":1.03,"희귀":1.02,"영웅":1.00,"전설":0.98,"신화":0.95,"초월":0.92,"영원":0.90,"공허":0.85},
  BAD:{"쓰레기":2.00,"일반":1.80,"희귀":1.25,"영웅":0.90,"전설":0.60,"신화":0.50,"초월":0.30,"영원":0.15,"공허":0.05}
};
const fishingTimingEscapeMultipliers = {PERFECT:0.85,GREAT:1,GOOD:1.10,BAD:1.50};
let pendingFishingTimingResult = "GREAT";

function setFishingTimingResult(result){
  pendingFishingTimingResult = fishingTimingWeights[result] ? result : "GREAT";
}

function takeFishingTimingResult(){
  const result = fishingTimingWeights[pendingFishingTimingResult] ? pendingFishingTimingResult : "GREAT";
  pendingFishingTimingResult = "GREAT";
  return result;
}

function getTimingGradeChances(timingResult="GREAT"){
  let chances = getRawGradeChances();
  const timingWeights = fishingTimingWeights[timingResult] || fishingTimingWeights.GREAT;
  chances = chances.map(x => ({...x, chance: Math.max(0, x.chance) * (timingWeights[x.name] || 1)}));

  // BAD 판정에서는 만렙에서도 쓰레기가 최종 확률 10% 이상 나오게 한다.
  if(timingResult === "BAD"){
    const trash = chances.find(x => x.name === "쓰레기");
    const nonTrashTotal = chances.filter(x => x.name !== "쓰레기").reduce((sum, x) => sum + x.chance, 0);
    const minimumTrashWeight = nonTrashTotal / 9;
    if(trash && trash.chance < minimumTrashWeight) trash.chance = minimumTrashWeight;
  }

  const total = chances.reduce((s,g)=>s+g.chance,0);
  if(total<=0)return grades.map(grade=>({name:grade.name,chance:grade.name==="일반"?100:0}));
  return chances.map(item=>({...item,chance:item.chance/total*100}));
}

function pickGrade(timingResult="GREAT"){
  const chances=getTimingGradeChances(timingResult);
  let total = chances.reduce((s,g)=>s+g.chance,0);
  let r = Math.random()*total;
  for(const c of chances){
    if(r < c.chance) return grades.find(g=>g.name===c.name);
    r -= c.chance;
  }
  return grades[1];
}

function pickName(grade){
  const list=fishByGrade[grade];
  return list[Math.floor(Math.random()*list.length)];
}

function makeSizeByName(name){
  const range = sizeData[name];
  if(range === null) return null;
  if(Array.isArray(range)){
    const base = Math.random() * (range[1] - range[0]) + range[0];
    return Math.round((base + rodLevel * 0.02) * 10) / 10;
  }
  return Math.round((Math.random()*100 + 10) * 10) / 10;
}

function getEscapeChance(){
  if(rodLevel <= LEGACY_MAX_ROD){
    const t = Math.min(1, (rodLevel - 1) / (LEGACY_MAX_ROD - 1));
    return 35 - (34 * t); // 기존 Lv.1~1750 수치를 그대로 유지
  }
  const extension = Math.min(1, (rodLevel - LEGACY_MAX_ROD) / (MAX_ROD - LEGACY_MAX_ROD));
  return 1 - (0.5 * extension); // Lv.1750 = 1%, Lv.2000 = 0.5%
}

function getCurrentGradeChances(){
  return getTimingGradeChances("GREAT");
}

function makePrice(g,size){
  if(g.name==="쓰레기") return Math.floor(Math.random()*30)+1;
  const s = size === null ? 7777 : size;
  return Math.floor(g.basePrice + s*gradePower[g.name]*1000 + Math.random()*g.basePrice*0.4);
}

function addCollection(f){
  if(!collection[f.name]) collection[f.name]={count:0,bestSize:null,bestGrade:f.grade};
  collection[f.name].count++;
  if(f.size !== null){
    if(collection[f.name].bestSize === null || f.size > collection[f.name].bestSize){
      collection[f.name].bestSize=f.size;
      collection[f.name].bestGrade=f.grade;
    }
  }
}

function fish(){
  if(!currentUser){if(typeof globalThis.openFishingLifeLogin==="function")globalThis.openFishingLifeLogin("로그인해야 낚시할 수 있습니다.");return;}
  if(isFishing) return print("이미 낚시 중입니다.");
  isFishing=true;
  const castTimingResult = takeFishingTimingResult();
  const castUser = currentUser;
  const castSessionId = ++fishingSessionId;
  const legacyT=Math.min(1,(rodLevel-1)/(LEGACY_MAX_ROD-1));
  const extensionT=Math.max(0,Math.min(1,(rodLevel-LEGACY_MAX_ROD)/(MAX_ROD-LEGACY_MAX_ROD)));
  const timeMultiplier = getFishingTimeMultiplier();
  const minTime=Math.floor((15000-(7000*legacyT)-(1000*extensionT)) * timeMultiplier); // Lv1750 8초, Lv2000 7초
  const maxTime=Math.floor((30000-(15000*legacyT)-(2000*extensionT)) * timeMultiplier); // Lv1750 15초, Lv2000 13초
  const wait=Math.floor(Math.random()*(maxTime-minTime))+minTime;
  print("낚싯대를 던졌습니다.");
  fishingTimer = setTimeout(()=>{
    fishingTimer = null;
    if(castSessionId !== fishingSessionId || currentUser !== castUser){
      isFishing = false;
      return;
    }
    const g=pickGrade(castTimingResult);
    const name=pickName(g.name);
    const size=makeSizeByName(name);
    const price=makePrice(g,size);
    const caught={id:makeFishId(),grade:g.name,name,size,price,locked:false,time:new Date().toLocaleString(),timingResult:castTimingResult,isNewCatch:!collection[name]};
    caught.combat = makeCombatStats(caught);

    const escapeGrades = ["일반","희귀","영웅","전설","신화"];
    if(escapeGrades.includes(g.name)){
      const escapeChance = Math.min(100,Math.max(0,getEscapeChance() * (fishingTimingEscapeMultipliers[castTimingResult] || 1)));
      if(Math.random() * 100 < escapeChance){
        totalFishingCount++;
        recordDailyFishing();
        const newAchievements = updateAchievements();
        checkSpecialTitles();
        saveGame();
        isFishing=false;
        fishingSessionId++;
        globalThis.pendingFishingEscape={grade:g.name,name,timingResult:castTimingResult,escapeChance};
        print(color("[" + g.name + "] " + name, g.name) + "\n낚싯줄을 끊고 도주했습니다!\n" + castTimingResult + " 판정 · 도주 확률 " + escapeChance.toFixed(1) + "%");
        printAchievementRewards(newAchievements);
        return;
      }
    }

    bucket.push(caught);
    addCollection(caught);

    totalFishingCount++;
    recordDailyFishing();
    gradeCounts[g.name] = (gradeCounts[g.name] || 0) + 1;

    const newAchievements = updateAchievements();

    checkSpecialTitles();
    saveGame();
    if(currentUser) saveCloudData();
    print(color(lineFish(caught), caught.grade)+objParticle(caught.name)+" 낚았습니다.");
    announceEternalCatch(caught);
    printAchievementRewards(newAchievements);
    isFishing=false;
    fishingSessionId++;
  }, wait);
}


let bucketSortOrder = localStorage.getItem("textFishingBucketSortOrder") || "등급";
if(["오름차순", "내림차순", "공격력 오름차순", "공격력 내림차순", "체력 오름차순", "체력 내림차순"].includes(bucketSortOrder)){
  if(bucketSortOrder.startsWith("공격력")) bucketSortOrder = "공격력";
  else if(bucketSortOrder.startsWith("체력")) bucketSortOrder = "체력";
  else bucketSortOrder = "등급";
  localStorage.setItem("textFishingBucketSortOrder", bucketSortOrder);
}

function sortBucketEntries(source, order=bucketSortOrder){
  return (source || []).map((fish, originalIndex) => ({fish, originalIndex})).sort((a,b)=>{
    const gradeCompare = gradePower[b.fish.grade] - gradePower[a.fish.grade];
    const nameCompare = a.fish.name.localeCompare(b.fish.name, "ko");
    const attackA = Number(a.fish.combat && a.fish.combat.attack || 0);
    const attackB = Number(b.fish.combat && b.fish.combat.attack || 0);
    const hpA = Number(a.fish.combat && (a.fish.combat.maxHp ?? a.fish.combat.hp) || 0);
    const hpB = Number(b.fish.combat && (b.fish.combat.maxHp ?? b.fish.combat.hp) || 0);

    if(order === "공격력"){
      return (attackB - attackA) || (hpB - hpA) || gradeCompare || nameCompare;
    }

    if(order === "체력"){
      return (hpB - hpA) || (attackB - attackA) || gradeCompare || nameCompare;
    }

    return gradeCompare || nameCompare;
  });
}

function sortedBucketList(){
  return sortBucketEntries(bucket, bucketSortOrder);
}

function getBucketIndexByDisplayNumber(n){
  const list = sortedBucketList();
  const item = list[n-1];
  return item ? item.originalIndex : -1;
}

function getDisplayNumberByBucketIndex(originalIndex){
  const list = sortedBucketList();
  const pos = list.findIndex(item => item.originalIndex === originalIndex);
  return pos >= 0 ? pos + 1 : -1;
}

function buildBucketText(){
  if(bucket.length===0) return "양동이가 비어있습니다.";
  let s=(currentUser ? formatCurrentUserName() + " 님의 양동이" : "내 양동이") + "\n\n────┬────────────────────\n";
  const list = sortedBucketList();
  list.forEach((item,i)=>{
    const f = item.fish;
    const combat = f.combat || {};
    const status = getCombatStatusText(f);
    let statText = "";
    if(bucketSortOrder.startsWith("공격력")) statText = " [공격력 " + Number(combat.attack || 0).toLocaleString() + "]";
    if(bucketSortOrder.startsWith("체력")) statText = " [체력 " + Number(combat.maxHp ?? combat.hp ?? 0).toLocaleString() + "]";
    const statusText = status !== "정상" ? " [상태 " + status + "]" : "";
    s+=fullWidthNumber(i+1)+"│"+color(lineFish(f), f.grade)+statText+statusText+(f.locked?" [잠금]":"")+"\n";
    if(i!==list.length-1) s+="────┼────────────────────\n";
  });
  s+="────┴────────────────────";
  return s;
}

function buildOtherBucketText(nickname, otherBucket){
  if(!otherBucket || otherBucket.length===0) return nickname + " 님의 양동이가 비어있습니다.";

  let s=nickname + " 님의 양동이\n\n────┬────────────────────\n";
  const list = [...otherBucket].sort((a,b)=>{
    const gradeCompare = gradePower[b.grade] - gradePower[a.grade];
    const nameCompare = a.name.localeCompare(b.name, "ko");
    return gradeCompare || nameCompare;
  });

  list.forEach((f,i)=>{
    s+=rankNumber(i+1)+"│"+color(lineFish(f), f.grade)+"\n";
    if(i!==list.length-1) s+="────┼────────────────────\n";
  });

  s+="────┴────────────────────";
  return s;
}

async function showOtherBucket(nickname){
  nickname = cleanNickname(nickname);
  if(!nickname) return print("사용법 : 양동이 닉네임");

  try{
    const snap = await db.collection("users").doc(nickname).get();
    if(!snap.exists) return print("존재하지 않는 닉네임입니다.");

    const data = snap.data();
    const fullState=await loadSplitGameState(nickname,data);
    const otherBucket = Array.isArray(fullState.bucket)?fullState.bucket:[];
    const totalValue = otherBucket.reduce((s,f)=>s+(f.price||0),0);

    const displayName = formatUserName(nickname, data.title);
    const summary =
      "보유 물고기 : " + otherBucket.length + "마리\n" +
      "총 기본 판매가 : " + formatMoney(totalValue) + "\n" +
      "시세·감정 연구 보너스 제외";

    printPreview(displayName + " 님의 양동이", summary, "양동이 전체보기", buildOtherBucketText(displayName, otherBucket));
  }catch(e){
    console.error(e);
    print("양동이를 불러오는 중 오류가 발생했습니다.");
  }
}

async function showBucket(){
  if(currentUser) await refreshMyCloudData();
  recoverStunnedFish();

  if(bucket.length===0) return print("양동이가 비어있습니다.");
  const lockedCount = bucket.filter(f=>f.locked).length;
  const totalValue = bucket.reduce((s,f)=>s+applyMarketPrice(f),0);
  const summary =
    "보유 물고기 : " + bucket.length + "마리\n" +
    "잠금 : " + lockedCount + "마리\n" +
    "총 판매가 : " + formatMoney(totalValue);
  const bucketTitle = formatCurrentUserName() + " 님의 양동이";
  printPreview(bucketTitle, summary, "양동이 전체보기", buildBucketText());
}

function sortBucket(type){
  const allowed = ["등급", "공격력", "체력"];
  if(!allowed.includes(type)){
    return print("정렬 명령어\n\n정렬 등급\n정렬 공격력\n정렬 체력");
  }

  bucketSortOrder = type;
  localStorage.setItem("textFishingBucketSortOrder", bucketSortOrder);

  const basis = type.startsWith("공격력") ? "공격력 1순위, 체력 2순위" :
    type.startsWith("체력") ? "최대 체력 1순위, 공격력 2순위" : "등급 1순위, 가나다 2순위";
  print("양동이 정렬을 " + type + "으로 설정했습니다.\n기준 : " + basis);
  showBucket();
}

const FUSION_TRANSFER_RATE = 0.20;
const FUSION_BATCH_LIMIT = 5;
const EVOLUTION_THRESHOLDS = [3,7,15];
const EVOLUTION_COST_MULTIPLIERS = [20,50,100];
const LEGACY_EVOLUTION_TOTAL_MULTIPLIERS = [1,1.10,1.25,1.50];
const PERCENT_EVOLUTION_TOTAL_MULTIPLIERS = [1,1.25,1.60,2.20];
const EVOLUTION_MAIN_MULTIPLIERS = [1,2,3,5];
const EVOLUTION_SCALE_VERSION = 3;
let fusionEvolutionMigrationSavePending=false;

function scheduleFusionEvolutionMigrationSave(){
  if(fusionEvolutionMigrationSavePending)return;
  fusionEvolutionMigrationSavePending=true;
  setTimeout(()=>{fusionEvolutionMigrationSavePending=false;saveGame();},0);
}

function getFusionMainFish(){
  ensureAllFishIds();
  return bucket.find(f=>f&&f.id===fusionMainFishId)||null;
}

function getFusionMainFishForName(name){
  ensureAllFishIds();
  const id=fusionMainFishIds[String(name||"")];
  return bucket.find(f=>f&&f.id===id&&f.name===name)||null;
}

function getFusionMainFishes(){
  ensureAllFishIds();
  return Object.values(fusionMainFishIds).map(id=>bucket.find(f=>f&&f.id===id)).filter(Boolean);
}

function isFusionMainFish(f){
  return !!(f&&f.id&&fusionMainFishIds&&fusionMainFishIds[f.name]===f.id);
}

function getAquariumFishes(){
  ensureAllFishIds();
  return normalizeAquariumFishIds(aquariumFishIds).map(id=>bucket.find(f=>f&&String(f.id)===id)).filter(Boolean).slice(0,5);
}

function isAquariumFish(f){
  return !!(f?.id&&normalizeAquariumFishIds(aquariumFishIds).includes(String(f.id)));
}

function saveAquariumFishIds(ids){
  ensureAllFishIds();
  const owned=new Set(bucket.filter(Boolean).map(f=>String(f.id||"")));
  aquariumFishIds=normalizeAquariumFishIds(ids).filter(id=>owned.has(id)).slice(0,5);
  saveGame();
  return {ok:true,ids:[...aquariumFishIds],fishes:getAquariumFishes()};
}

function clearAquarium(){return saveAquariumFishIds([]);}

function getFishEvolutionStage(f){
  const stage=Math.max(0,Math.min(3,Math.floor(Number(f?.fusion?.evolutionStage||0))));
  if(stage>0&&Number(f?.fusion?.evolutionScaleVersion||0)<EVOLUTION_SCALE_VERSION)ensureFishFusionState(f);
  return stage;
}

function getFishFusionCount(f){
  return Math.max(0,Math.floor(Number(f?.fusion?.count||0)));
}

function getFishEvolutionLabel(f){
  return ["미진화","1차 진화","2차 진화","최종 진화"][getFishEvolutionStage(f)];
}

function getHistoricalEvolutionMultipliers(version){
  return Number(version||0)>=2?PERCENT_EVOLUTION_TOTAL_MULTIPLIERS:LEGACY_EVOLUTION_TOTAL_MULTIPLIERS;
}

function estimateMainBaseStat(permanent,totalGain,count,evolutionStage,version){
  permanent=Math.max(1,Number(permanent||1));totalGain=Math.max(0,Number(totalGain||0));count=Math.max(0,Math.floor(Number(count||0)));
  if(evolutionStage<=0)return Math.max(1,Math.round(permanent-totalGain));
  const historical=getHistoricalEvolutionMultipliers(version),currentMultiplier=historical[evolutionStage]||1;
  if(totalGain<=0||count<=0)return Math.max(1,Math.round(permanent/currentMultiplier));
  const averageGain=totalGain/count;
  let weightedGain=0;
  for(let index=0;index<count;index++){
    const addedStage=index<3?0:index<7?1:index<15?2:3;
    const gainMultiplier=addedStage<evolutionStage?currentMultiplier/(historical[addedStage]||1):1;
    weightedGain+=averageGain*gainMultiplier;
  }
  return Math.max(1,Math.ceil((permanent-weightedGain)/currentMultiplier));
}

function ensureFishFusionState(f){
  if(!f||f.grade==="쓰레기")return null;
  const c=ensureCombatStats(f),hadSavedState=!!(f.fusion&&typeof f.fusion==="object"),saved=hadSavedState?f.fusion:{};
  const evolutionStage=Math.max(0,Math.min(3,Math.floor(Number(saved.evolutionStage||0))));
  const savedVersion=Math.max(0,Math.floor(Number(saved.evolutionScaleVersion||0))),needsScaleMigration=hadSavedState&&savedVersion<EVOLUTION_SCALE_VERSION;
  const needsHpMigration=hadSavedState&&Number(saved.hpBalanceVersion||0)<FISH_HP_BALANCE_VERSION,hpScale=needsHpMigration?FISH_HP_BALANCE_MULTIPLIER:1;
  const count=Math.max(0,Math.floor(Number(saved.count||0))),totalAttackGain=Math.max(0,Math.floor(Number(saved.totalAttackGain||0))),totalHpGain=Math.max(0,Math.floor(Number(saved.totalHpGain||0)*hpScale));
  const savedPermanentAttack=Math.max(1,Math.floor(Number(saved.permanentAttack??c._baseAttack??c.attack??1))),savedPermanentMaxHp=saved.permanentMaxHp!==undefined?Math.max(1,Math.floor(Number(saved.permanentMaxHp)*hpScale)):Math.max(1,Math.floor(Number(c._baseMaxHp??c.maxHp??c.hp??1)));
  const resolvedMainBaseAttack=Number(saved.mainBaseAttack)>0?Math.max(1,Math.floor(Number(saved.mainBaseAttack))):estimateMainBaseStat(savedPermanentAttack,totalAttackGain,count,evolutionStage,savedVersion);
  const resolvedMainBaseMaxHp=Number(saved.mainBaseMaxHp)>0?Math.max(1,Math.floor(Number(saved.mainBaseMaxHp)*hpScale)):estimateMainBaseStat(savedPermanentMaxHp,totalHpGain,count,evolutionStage,savedVersion);
  const permanentAttack=Math.max(1,resolvedMainBaseAttack*EVOLUTION_MAIN_MULTIPLIERS[evolutionStage]+totalAttackGain);
  const permanentMaxHp=Math.max(1,resolvedMainBaseMaxHp*EVOLUTION_MAIN_MULTIPLIERS[evolutionStage]+totalHpGain);
  const needsCombatSync=savedPermanentAttack!==permanentAttack||savedPermanentMaxHp!==permanentMaxHp;
  f.fusion={
    count,
    evolutionStage,
    evolutionScaleVersion:EVOLUTION_SCALE_VERSION,
    hpBalanceVersion:FISH_HP_BALANCE_VERSION,
    mainBaseAttack:resolvedMainBaseAttack,
    mainBaseMaxHp:resolvedMainBaseMaxHp,
    permanentAttack,
    permanentMaxHp,
    totalAttackGain,
    totalHpGain,
    totalGoldSpent:normalizeMoney(saved.totalGoldSpent||0)
  };
  if(needsCombatSync)syncFishFusionCombat(f);
  if(needsScaleMigration||needsHpMigration)scheduleFusionEvolutionMigrationSave();
  return f.fusion;
}

function getFishPermanentStats(f){
  const state=ensureFishFusionState(f);
  if(!state)return {attack:0,maxHp:0};
  return {attack:state.permanentAttack,maxHp:state.permanentMaxHp};
}

function syncFishFusionCombat(f){
  const state=ensureFishFusionState(f);if(!state)return null;
  const c=ensureCombatStats(f),oldMax=Math.max(1,Number(c.maxHp||1)),oldHp=Math.max(0,Number(c.hp||0));
  const hpRatio=Math.max(0,Math.min(1,oldHp/oldMax)),recoveryRatio=c.recoveryStartHp===undefined?null:Math.max(0,Math.min(1,Number(c.recoveryStartHp||0)/oldMax));
  const wasDown=!!c.knockedOut||c.status==="기절"||oldHp<=0,wasHealthy=c.status==="정상"&&oldHp>=oldMax;
  c._baseAttack=state.permanentAttack;c._baseMaxHp=state.permanentMaxHp;
  delete c._trainingHpLevel;
  applyTrainingBonusesToCombat(c);
  if(wasDown)c.hp=0;
  else if(wasHealthy)c.hp=c.maxHp;
  else c.hp=Math.max(1,Math.min(c.maxHp,Math.floor(c.maxHp*hpRatio)));
  if(recoveryRatio!==null)c.recoveryStartHp=Math.max(wasDown?0:1,Math.floor(c.maxHp*recoveryRatio));
  return c;
}

function setFusionMainFish(id){
  ensureAllFishIds();
  const fish=bucket.find(f=>f&&f.id===String(id));
  if(!fish||fish.grade==="쓰레기")return {ok:false,message:"전투 가능한 물고기만 본체로 설정할 수 있습니다."};
  fusionMainFishIds[fish.name]=fish.id;
  fusionMainFishId=fish.id;
  ensureFishFusionState(fish);
  saveGame();
  return {ok:true,fish};
}

function clearFusionMainFish(id=fusionMainFishId){
  ensureAllFishIds();
  const targetId=String(id||"");
  const fish=bucket.find(f=>f&&f.id===targetId)||null;
  if(fish&&fusionMainFishIds[fish.name]===targetId)delete fusionMainFishIds[fish.name];
  else Object.keys(fusionMainFishIds).forEach(name=>{if(fusionMainFishIds[name]===targetId)delete fusionMainFishIds[name];});
  if(fusionMainFishId===targetId)fusionMainFishId="";
  saveGame();
  return {ok:true,fish};
}

function getFusionMaterialBlockReason(main,fish){
  if(!main||!fish)return "물고기를 찾을 수 없습니다.";
  if(fish.id===main.id)return "본체는 재료로 사용할 수 없습니다.";
  if(fish.name!==main.name)return "이름이 같은 물고기만 합성할 수 있습니다.";
  if(fish.grade==="쓰레기")return "쓰레기 등급은 합성할 수 없습니다.";
  if(fish.locked)return "잠금된 물고기입니다.";
  if(isAquariumFish(fish))return "수족관에 전시 중인 물고기는 합성 재료로 사용할 수 없습니다.";
  if(isFishInPartyPreset(fish))return "저장 파티에 포함된 물고기입니다.";
  const idx=bucket.indexOf(fish);
  if(bossPrepIndexes.includes(idx)||pvpPrepIndexes.includes(idx))return "현재 전투 파티에 편성된 물고기입니다.";
  return "";
}

function getFusionMaterialCandidates(main=getFusionMainFish()){
  if(!main)return [];
  return bucket.map((fish,originalIndex)=>({fish,originalIndex,reason:fish?.name===main.name?getFusionMaterialBlockReason(main,fish):"다른 물고기"}))
    .filter(entry=>entry.fish&&entry.fish.id!==main.id&&entry.fish.name===main.name);
}

function getFusionBatchCost(materials,currentCount){
  return (materials||[]).reduce((total,fish,index)=>{
    const base=Math.max(1,Number(fish?.price||0));
    const multiplier=1+(Math.max(0,Number(currentCount||0))+index)*0.05;
    return normalizeMoney(total+base*2*multiplier);
  },0);
}

function calculateFishFusionPreview(mainId,materialIds){
  ensureAllFishIds();
  const main=bucket.find(f=>f&&f.id===String(mainId||fusionMainFishId));
  if(!main)return {ok:false,message:"합성 본체를 먼저 설정해주세요."};
  const ids=[...new Set((materialIds||[]).map(String))].slice(0,FUSION_BATCH_LIMIT);
  if(ids.length===0)return {ok:false,message:"재료 물고기를 선택해주세요.",main};
  const materials=ids.map(id=>bucket.find(f=>f&&f.id===id));
  if(materials.some(f=>!f))return {ok:false,message:"선택한 재료를 찾을 수 없습니다.",main};
  const blocked=materials.map(f=>getFusionMaterialBlockReason(main,f)).find(Boolean);
  if(blocked)return {ok:false,message:blocked,main};
  const mainState=ensureFishFusionState(main),beforeCombat=ensureCombatStats(main);
  const attackGain=materials.reduce((sum,f)=>sum+Math.max(1,Math.floor(getFishPermanentStats(f).attack*FUSION_TRANSFER_RATE)),0);
  const hpGain=materials.reduce((sum,f)=>sum+Math.max(1,Math.floor(getFishPermanentStats(f).maxHp*FUSION_TRANSFER_RATE)),0);
  const cost=getFusionBatchCost(materials,mainState.count),countAfter=mainState.count+materials.length;
  const attackTraining=1+getTrainingAttackBonus()/100,hpTraining=1+getTrainingHpBonus()/100;
  const nextStage=Math.min(3,mainState.evolutionStage+1),threshold=EVOLUTION_THRESHOLDS[nextStage-1]||15;
  return {ok:true,main,materials,attackGain,hpGain,cost,countBefore:mainState.count,countAfter,stage:mainState.evolutionStage,nextStage,threshold,
    beforeAttack:Number(beforeCombat.attack||0),beforeMaxHp:Number(beforeCombat.maxHp||0),
    afterAttack:Math.floor((mainState.permanentAttack+attackGain)*attackTraining),afterMaxHp:Math.floor((mainState.permanentMaxHp+hpGain)*hpTraining),
    evolutionUnlocked:nextStage>mainState.evolutionStage&&countAfter>=threshold,canAfford:money>=cost};
}

function getFishEvolutionDetails(f=getFusionMainFish()){
  if(!f)return {ok:false,message:"합성 본체를 먼저 설정해주세요."};
  const state=ensureFishFusionState(f),nextStage=state.evolutionStage+1;
  if(nextStage>3)return {ok:true,fish:f,stage:3,complete:true,count:state.count,cost:0,threshold:15,canAfford:true,unlocked:true};
  const threshold=EVOLUTION_THRESHOLDS[nextStage-1],cost=normalizeMoney(Math.max(1,Number(f.price||0))*EVOLUTION_COST_MULTIPLIERS[nextStage-1]);
  const combat=ensureCombatStats(f),currentMultiplier=EVOLUTION_MAIN_MULTIPLIERS[state.evolutionStage],nextMultiplier=EVOLUTION_MAIN_MULTIPLIERS[nextStage];
  const afterPermanentAttack=Math.max(1,state.mainBaseAttack*nextMultiplier+state.totalAttackGain),afterPermanentMaxHp=Math.max(1,state.mainBaseMaxHp*nextMultiplier+state.totalHpGain);
  const afterAttack=Math.floor(afterPermanentAttack*(1+getTrainingAttackBonus()/100)),afterMaxHp=Math.floor(afterPermanentMaxHp*(1+getTrainingHpBonus()/100));
  return {ok:true,fish:f,stage:state.evolutionStage,nextStage,count:state.count,threshold,cost,unlocked:state.count>=threshold,canAfford:money>=cost,complete:false,
    beforeAttack:Number(combat.attack||0),beforeMaxHp:Number(combat.maxHp||0),afterAttack,afterMaxHp,
    attackGain:afterAttack-Number(combat.attack||0),hpGain:afterMaxHp-Number(combat.maxHp||0),
    mainBaseAttack:state.mainBaseAttack,mainBaseMaxHp:state.mainBaseMaxHp,currentMultiplier,nextMultiplier};
}

function rebuildPreparedIndexesFromIds(bossIds,pvpIds){
  bossPrepIndexes=(bossIds||[]).map(id=>bucket.findIndex(f=>f&&f.id===id)).filter(i=>i>=0).slice(0,5);
  pvpPrepIndexes=(pvpIds||[]).map(id=>bucket.findIndex(f=>f&&f.id===id)).filter(i=>i>=0).slice(0,3);
}

function performFishFusion(mainId,materialIds){
  const preview=calculateFishFusionPreview(mainId,materialIds);
  if(!preview.ok)return preview;
  if(money<preview.cost)return {ok:false,message:"골드가 부족합니다.",shortage:normalizeMoney(preview.cost-money),preview};
  const main=preview.main,state=ensureFishFusionState(main),materialIdsSet=new Set(preview.materials.map(f=>f.id));
  const bossIds=bossPrepIndexes.map(i=>bucket[i]?.id).filter(Boolean),pvpIds=pvpPrepIndexes.map(i=>bucket[i]?.id).filter(Boolean);
  state.permanentAttack=Math.max(1,state.permanentAttack+preview.attackGain);
  state.permanentMaxHp=Math.max(1,state.permanentMaxHp+preview.hpGain);
  state.totalAttackGain+=preview.attackGain;state.totalHpGain+=preview.hpGain;state.count=preview.countAfter;state.totalGoldSpent=normalizeMoney(state.totalGoldSpent+preview.cost);
  money=normalizeMoney(money-preview.cost);main.locked=true;
  removeFishIdsFromPresets([...materialIdsSet]);
  bucket=bucket.filter(f=>!f||!materialIdsSet.has(f.id));
  aquariumFishIds=normalizeAquariumFishIds(aquariumFishIds).filter(id=>!materialIdsSet.has(id));
  rebuildPreparedIndexesFromIds(bossIds,pvpIds);
  syncFishFusionCombat(main);
  fusionMainFishIds[main.name]=main.id;
  fusionMainFishId=main.id;
  saveGame();
  return {...preview,ok:true,main,materialNames:preview.materials.map(f=>f.name),stageAvailable:getFishEvolutionDetails(main).unlocked};
}

function performFishEvolution(mainId=fusionMainFishId){
  const fish=bucket.find(f=>f&&f.id===String(mainId));
  const details=getFishEvolutionDetails(fish);
  if(!details.ok)return details;
  if(details.complete)return {ok:false,message:"이미 최종 진화를 완료했습니다."};
  if(!details.unlocked)return {ok:false,message:"합성 횟수가 부족합니다.",details};
  if(money<details.cost)return {ok:false,message:"골드가 부족합니다.",shortage:normalizeMoney(details.cost-money),details};
  const state=ensureFishFusionState(fish),beforeCombat=ensureCombatStats(fish),beforeAttack=Number(beforeCombat.attack||0),beforeMaxHp=Number(beforeCombat.maxHp||0);
  state.permanentAttack=Math.max(1,state.mainBaseAttack*details.nextMultiplier+state.totalAttackGain);
  state.permanentMaxHp=Math.max(1,state.mainBaseMaxHp*details.nextMultiplier+state.totalHpGain);
  state.evolutionStage=details.nextStage;state.totalGoldSpent=normalizeMoney(state.totalGoldSpent+details.cost);
  money=normalizeMoney(money-details.cost);fish.locked=true;
  const combat=syncFishFusionCombat(fish);
  saveGame();
  return {ok:true,fish,stage:state.evolutionStage,cost:details.cost,beforeAttack,beforeMaxHp,afterAttack:combat.attack,afterMaxHp:combat.maxHp,attackGain:combat.attack-beforeAttack,hpGain:combat.maxHp-beforeMaxHp};
}

function getPresetFishList(type){
  const ids = partyPresets[type] || [];
  return ids.map(id => bucket.find(f => f && f.id === id)).filter(Boolean);
}

function cleanPartyPresets(){
  const owned = new Set(bucket.filter(Boolean).map(f => f.id));
  partyPresets.boss = (partyPresets.boss || []).filter(id => owned.has(id)).slice(0,5);
  partyPresets.pvp = (partyPresets.pvp || []).filter(id => owned.has(id)).slice(0,3);
}

function removeFishIdsFromPresets(ids){
  const removed = new Set(ids || []);
  partyPresets.boss = (partyPresets.boss || []).filter(id => !removed.has(id));
  partyPresets.pvp = (partyPresets.pvp || []).filter(id => !removed.has(id));
}

function isFishInPartyPreset(f){
  if(!f || !f.id) return false;
  return (partyPresets.boss || []).includes(f.id) || (partyPresets.pvp || []).includes(f.id);
}

function buildPartyPresetFullText(){
  cleanPartyPresets();
  let s = "저장 파티\n\n";
  const sections = [
    ["보스전 파티", "boss", 5],
    ["PVP 파티", "pvp", 3]
  ];
  sections.forEach(([title,type,max],sectionIndex) => {
    const fishes = getPresetFishList(type);
    s += "[" + title + "] " + fishes.length + " / " + max + "\n";
    if(fishes.length === 0){
      s += "비어 있음\n";
    }else{
      fishes.forEach((f,i) => {
        s += fullWidthNumber(i+1) + "│" + color(lineFish(f),f.grade) + "\n";
      });
    }
    if(sectionIndex === 0) s += "\n" + line() + "\n\n";
  });
  s += "\n명령어\n";
  s += "파티저장 보스 / 파티불러오기 보스 / 파티해제 보스\n";
  s += "파티저장 pvp / 파티불러오기 pvp / 파티해제 pvp";
  return s;
}

function showPartyPresets(){
  cleanPartyPresets();
  const bossCount = getPresetFishList("boss").length;
  const pvpCount = getPresetFishList("pvp").length;
  printPreview("저장 파티", "보스전 파티 : " + bossCount + " / 5\nPVP 파티 : " + pvpCount + " / 3", "저장 파티 전체보기", buildPartyPresetFullText());
}

function normalizePresetType(raw){
  const value = String(raw || "").trim().toLowerCase();
  if(value === "보스" || value === "boss") return "boss";
  if(value === "pvp" || value === "피브이피") return "pvp";
  return "";
}

function savePartyPreset(rawType){
  ensureAllFishIds();
  const type = normalizePresetType(rawType);
  if(!type) return print("사용법 : 파티저장 보스 / 파티저장 pvp");
  const indexes = type === "boss" ? bossPrepIndexes : pvpPrepIndexes;
  const max = type === "boss" ? 5 : 3;
  const fishes = indexes.map(i => bucket[i]).filter(f => f && f.grade !== "쓰레기").slice(0,max);
  if(fishes.length === 0) return print((type === "boss" ? "보스" : "PVP") + " 준비 목록에 저장할 물고기가 없습니다.");
  partyPresets[type] = fishes.map(f => f.id);
  saveGame();
  print((type === "boss" ? "보스전" : "PVP") + " 파티 저장 완료\n\n" + fishes.length + " / " + max + "마리");
}

function savePartyPresetIds(rawType,ids){
  ensureAllFishIds();
  const type=normalizePresetType(rawType),max=type==="boss"?5:type==="pvp"?3:0;
  if(!type)return {ok:false,message:"저장할 파티 종류를 확인해주세요."};
  const owned=new Map(bucket.filter(f=>f&&f.grade!=="쓰레기").map(f=>[String(f.id),f]));
  const selected=[...new Set((ids||[]).map(String))].filter(id=>owned.has(id)).slice(0,max);
  if(selected.length===0)return {ok:false,message:"양동이에서 물고기를 한 마리 이상 선택해주세요."};
  partyPresets[type]=selected;
  saveGame();
  return {ok:true,type,count:selected.length,max,fishes:selected.map(id=>owned.get(id))};
}

function applyPartyPreset(rawType){
  const type = normalizePresetType(rawType);
  if(!type)return {ok:false,message:"불러올 파티 종류를 확인해주세요."};
  cleanPartyPresets();
  const fishes = getPresetFishList(type);
  if(fishes.length===0)return {ok:false,message:"저장된 "+(type==="boss"?"보스전":"PVP")+" 파티가 없습니다."};
  const available=fishes.filter(f=>{
    updateRecoveringFishHp(f);
    const c=ensureCombatStats(f);
    return !c.knockedOut&&c.status!=="기절"&&c.hp>0;
  });
  const skipped=fishes.length-available.length;
  if(available.length===0)return {ok:false,message:"저장한 물고기가 모두 기절했거나 체력이 0입니다.",skipped};
  const indexes=available.map(f=>bucket.indexOf(f)).filter(i=>i>=0);
  if(type === "boss"){
    bossPrepIndexes = indexes.slice(0,5);
    pendingRecoveryBattleConfirm = false;
  }else{
    pvpPrepIndexes = indexes.slice(0,3);
  }
  saveGame();
  return {ok:true,type,count:indexes.length,skipped,fishes:available};
}

function loadPartyPreset(rawType){
  const result=applyPartyPreset(rawType);
  if(!result.ok)return print(result.message||"저장 파티를 불러오지 못했습니다.");
  print((result.type==="boss"?"보스전":"PVP")+" 파티를 불러왔습니다.\n\n편성 : "+result.count+"마리"+(result.skipped?"\n기절·체력 0 제외 : "+result.skipped+"마리":""));
}

function clearPartyPreset(rawType){
  const type = normalizePresetType(rawType);
  if(!type) return print("사용법 : 파티해제 보스 / 파티해제 pvp");
  partyPresets[type] = [];
  saveGame();
  print((type === "boss" ? "보스전" : "PVP") + " 저장 파티를 삭제했습니다.");
}

function lockOne(n,lockState){
  const idx=getBucketIndexByDisplayNumber(n);
  if(idx < 0 || !bucket[idx]) return print("존재하지 않는 번호입니다.");
  bucket[idx].locked=lockState;
  saveGame();
  let s="────┬────────────────────\n";
  s+=fullWidthNumber(n)+"│"+color(lineFish(bucket[idx]), bucket[idx].grade)+(bucket[idx].locked?" [잠금]":"")+"\n";
  s+="────┴────────────────────\n\n";
  s+=lockState?"잠금되었습니다.":"잠금이 해제되었습니다.";
  print(s);
}

function sellOne(n,confirmed=false){
  const idx=getBucketIndexByDisplayNumber(n);
  if(idx < 0 || !bucket[idx]) return print("존재하지 않는 번호입니다.");
  if(bucket[idx].locked) return print("잠금된 물고기는 판매할 수 없습니다.");
  if(isAquariumFish(bucket[idx])) return print("수족관에 전시 중인 물고기는 전시 해제 후 판매할 수 있습니다.");
  if(!confirmed){
    pendingPresetSaleId = bucket[idx].id;
    pendingPresetSellAll = false;
    return print((isFishInPartyPreset(bucket[idx])?"저장 파티에 포함된 물고기입니다.\n\n":"") + color(lineFish(bucket[idx]),bucket[idx].grade) + "\n\n정말 판매할까요?\n계속하려면 확인 을 입력하세요.");
  }
  const f=bucket.splice(idx,1)[0];
  ensureAllFishIds();
  pendingPresetSaleId = "";
  removeFishIdsFromPresets([f.id]);
  pvpPrepIndexes=[];
  const finalPrice = applyMarketPrice(f);
  const bonus = getMarketBonus(f.name);

  money=normalizeMoney(money + finalPrice);
  totalEarned=normalizeMoney(totalEarned + finalPrice);
  const newTitles = checkSpecialTitles();
  saveGame();

  if(typeof globalThis.showFishingLifeSaleResult==="function")globalThis.showFishingLifeSaleResult({count:1,total:finalPrice,fish:f,bonus});
  else print(lineFish(f)+" 판매 완료 · +"+formatMoney(finalPrice));
  if(newTitles.length > 0) print("칭호 획득!\n\n" + newTitles.map(x => "[" + x + "]").join("\n"));
  return {ok:true,count:1,total:finalPrice,fish:f};
}

function confirmPresetSale(){
  const id = pendingPresetSaleId;
  pendingPresetSaleId = "";
  if(!id) return print("확인 대기 중인 판매가 없습니다.");
  const idx = bucket.findIndex(f => f && f.id === id);
  if(idx < 0) return print("판매할 물고기를 찾을 수 없습니다.");
  const displayNumber = getDisplayNumberByBucketIndex(idx);
  sellOne(displayNumber,true);
}

function sellAll(confirmed=false){
  if(bucket.length===0) return print("팔 물고기가 없습니다.");
  const sell=bucket.filter(f=>!f.locked&&!isAquariumFish(f));
  const keep=bucket.filter(f=>f.locked||isAquariumFish(f));
  if(sell.length===0) return print("판매할 수 있는 물고기가 없습니다. 잠금 또는 수족관 전시 상태입니다.");
  const presetFishes = sell.filter(isFishInPartyPreset);
  if(!confirmed){
    pendingPresetSellAll = true;
    pendingPresetSaleId = "";
    return print((presetFishes.length?"일괄판매 대상에 저장 파티 물고기 " + presetFishes.length + "마리가 포함되어 있습니다.\n\n":"")+"잠금되지 않은 물고기 "+sell.length+"마리를 정말 판매할까요?\n계속하려면 확인 을 입력하세요.");
  }
  const baseTotal=sell.reduce((s,f)=>s+f.price,0);
  const total=sell.reduce((s,f)=>s+applyMarketPrice(f),0);
  const bonusTotal=total-baseTotal;

  bucket=keep;
  ensureAllFishIds();
  pendingPresetSellAll = false;
  removeFishIdsFromPresets(sell.map(f => f.id));
  pvpPrepIndexes=[];
  money=normalizeMoney(money + total);
  totalEarned=normalizeMoney(totalEarned + total);
  const newTitles = checkSpecialTitles();
  saveGame();

  if(typeof globalThis.showFishingLifeSaleResult==="function")globalThis.showFishingLifeSaleResult({count:sell.length,total,bonus:bonusTotal});
  else print(sell.length+"마리 판매 완료 · +"+formatMoney(total));
  if(newTitles.length > 0) print("칭호 획득!\n\n" + newTitles.map(x => "[" + x + "]").join("\n"));
  return {ok:true,count:sell.length,total};
}

function confirmPresetSellAll(){
  if(!pendingPresetSellAll) return print("확인 대기 중인 일괄판매가 없습니다.");
  pendingPresetSellAll = false;
  sellAll(true);
}

function confirmPendingPresetSale(){
  if(pendingPresetSellAll) return confirmPresetSellAll();
  if(pendingPresetSaleId) return confirmPresetSale();
  print("확인 대기 중인 판매가 없습니다.");
}

function buildFishCollectionText(){
  let s="물고기도감\n\n";
  let index=1;
  for(const grade of Object.keys(fishByGrade)){
    s+=color("["+grade+"]", grade)+"\n";
    s+="────┬────────────────────\n";
    const names = [...fishByGrade[grade]].sort((a,b)=>a.localeCompare(b,"ko"));
    names.forEach((name,i)=>{
      const c=collection[name];
      const shown = c ? color("["+grade+"] "+displayFishName(name), grade) : color("???", grade);
      s+=fullWidthNumber(index)+"│"+shown+"\n";
      if(i!==names.length-1) s+="────┼────────────────────\n";
      index++;
    });
    s+="────┴────────────────────\n\n";
  }
  s+="도감 진행률 : "+Object.keys(collection).length+"/"+allFishCount();
  return s;
}

function showFishCollection(){
  const got = Object.keys(collection).length;
  const total = allFishCount();
  const percent = total === 0 ? 0 : (got / total * 100).toFixed(1);
  printPreview("물고기도감", "물고기도감 진행률\n\n" + got + " / " + total + "\n" + percent + "%", "물고기도감 전체보기", buildFishCollectionText());
}

function buildCoreCollectionText(){
  let s="코어도감\n\n";
  s+="────┬────────────────────\n";
  bossList.forEach((boss,i)=>{
    const owned = (bossProgress.materials && bossProgress.materials[boss.drop]) || 0;
    const shown = owned > 0 || bossProgress.defeated[boss.id] ? boss.drop + " x" + owned.toLocaleString() : "???";
    s+=fullWidthNumber(i+1)+"│"+shown+"\n";
    if(i!==bossList.length-1) s+="────┼────────────────────\n";
  });
  s+="────┴────────────────────";
  return s;
}

function showCoreCollection(){
  const got = bossList.filter(b => ((bossProgress.materials && bossProgress.materials[b.drop]) || 0) > 0 || bossProgress.defeated[b.id]).length;
  const total = bossList.length;
  printPreview("코어도감", "코어도감 진행률\n\n" + got + " / " + total, "코어도감 전체보기", buildCoreCollectionText());
}

function buildCollectionText(){
  return "도감\n\n물고기도감\n코어도감\n\n명령어 : 물고기도감 / 코어도감";
}

function showCollection(){
  print(buildCollectionText());
}

async function showWallet(){
  if(currentUser) await refreshMyCloudData();

  const title = formatCurrentUserName() + " 님의 지갑";
  const content = title + "\n\n현재 돈 : " + formatMoney(money);

  printWalletPreview(title, "지갑 전체보기", content);
}

async function showOtherWallet(nickname){
  nickname = cleanNickname(nickname);
  if(!nickname) return print("사용법 : 지갑 닉네임");

  try{
    const snap = await db.collection("users").doc(nickname).get();
    if(!snap.exists) return print("존재하지 않는 닉네임입니다.");

    const data = snap.data();
    const title = formatUserName(nickname, data.title) + " 님의 지갑";
    const content = title + "\n\n현재 돈 : " + formatMoney(data.money || 0);

    printWalletPreview(title, "지갑 전체보기", content);
  }catch(e){
    console.error(e);
    print("지갑을 불러오는 중 오류가 발생했습니다.");
  }
}

function upgradeOne(){
  if(rodLevel>=getCurrentPlayableMaxRod()) return print(getLockedUpgradeMessage());

  const materialReq = getBossMaterialRequirement(rodLevel);
  if(materialReq === "LOCKED") return print(getLockedUpgradeMessage());

  const cost=getUpgradeCost(rodLevel);
  const rate=getUpgradeSuccessRate(rodLevel);

  if(money<cost) return print("돈이 부족합니다.\n강화 비용 : "+formatMoney(cost));

  if(!hasRequiredBossMaterials(rodLevel)){
    const need = getRequiredBossMaterials(rodLevel)[0];
    const owned = need ? (bossProgress.materials[need.name] || 0) : 0;
    return print("강화 재료가 부족합니다.\n\n필요 : " + need.name + " x" + need.count + "\n보유 : " + owned.toLocaleString() + "개");
  }

  const before=rodLevel;
  const usedMaterials = formatRequiredBossMaterials(before);
  money=normalizeMoney(money - cost);
  consumeRequiredBossMaterials(before);

  if(tryUpgradeSuccess(before)){
    rodLevel++;
    saveGame();
    print("강화 성공\n\nLv."+before+" → Lv."+rodLevel+"\n성공 확률 : "+rate.toFixed(1)+"%\n사용 금액 : "+formatMoney(cost)+(usedMaterials ? "\n사용 재료\n"+usedMaterials : ""));
  } else {
    saveGame();
    print("강화 실패\n\nLv."+before+" → Lv."+rodLevel+"\n성공 확률 : "+rate.toFixed(1)+"%\n사용 금액 : "+formatMoney(cost)+(usedMaterials ? "\n사용 재료\n"+usedMaterials : ""));
  }
}

function upgradeMax(){
  if(rodLevel>=getCurrentPlayableMaxRod()) return print(getLockedUpgradeMessage());

  const before=rodLevel;
  let spent=0;
  let success=0;
  let fail=0;
  let attempts=0;
  let usedMaterials = {};

  while(rodLevel<getCurrentPlayableMaxRod()){
    const cost=getUpgradeCost(rodLevel);
    if(money<cost) break;
    if(!hasRequiredBossMaterials(rodLevel)) break;

    const levelBefore=rodLevel;
    const req = getRequiredBossMaterials(levelBefore);
    req.forEach(m => {
      usedMaterials[m.name] = (usedMaterials[m.name] || 0) + m.count;
    });

    money=normalizeMoney(money - cost);
    consumeRequiredBossMaterials(levelBefore);
    spent+=cost;
    attempts++;

    if(tryUpgradeSuccess(levelBefore)){
      rodLevel++;
      success++;
    } else {
      fail++;
    }

    if(before < 1000 && rodLevel >= 1000) break;

    if(attempts >= 10000) break;
  }

  if(spent===0){
    if(rodLevel>=1000 && !hasRequiredBossMaterials(rodLevel)){
      const need = getRequiredBossMaterials(rodLevel)[0];
      const owned = need ? (bossProgress.materials[need.name] || 0) : 0;
      return print("강화 재료가 부족합니다.\n\n필요 : " + need.name + " x" + need.count + "\n보유 : " + owned.toLocaleString() + "개");
    }

    return print("돈이 부족합니다.\n강화 비용 : "+formatMoney(getUpgradeCost(rodLevel)));
  }

  saveGame();

  let msg = "일괄강화 결과\n\n";
  msg += "Lv."+before+" → Lv."+rodLevel+"\n\n";
  msg += "시도 : "+attempts.toLocaleString()+"회\n";
  msg += "성공 : "+success.toLocaleString()+"회\n";
  msg += "실패 : "+fail.toLocaleString()+"회\n\n";
  msg += "사용 금액 : "+formatMoney(spent)+"\n";

  const materialEntries = Object.entries(usedMaterials);
  if(materialEntries.length > 0){
    msg += "사용 재료\n";
    materialEntries.forEach(([name,count]) => {
      msg += name + " x" + count.toLocaleString() + "\n";
    });
  }

  msg += "남은 돈 : "+formatMoney(money);

  if(rodLevel>=getCurrentPlayableMaxRod()){
    msg += "\n\n" + getLockedUpgradeMessage();
  } else if(before < 1000 && rodLevel === 1000){
    msg += "\n\n1000레벨에 도달하여 일괄강화를 멈췄습니다.\n계속 강화하려면 일괄강화를 다시 입력해주세요.";
  } else if(rodLevel<MAX_ROD && attempts>=10000){
    msg += "\n\n시도 횟수가 너무 많아 자동 중단되었습니다.";
  } else if(rodLevel>=1000 && !hasRequiredBossMaterials(rodLevel)){
    msg += "\n\n강화 재료가 부족하여 중단되었습니다.\n필요 재료\n" + formatRequiredBossMaterials(rodLevel);
  }

  print(msg.trim());
}



function getPvpDocId(a,b){
  const x = cleanNickname(a);
  const y = cleanNickname(b);
  return [x,y].sort().join("__");
}

function getMyActivePvpRef(){
  if(!currentUser) return null;
  return db.collection("pvpActive").doc(currentUser);
}

async function getMyActivePvp(){
  if(!currentUser) return null;
  const snap = await getMyActivePvpRef().get();
  if(!snap.exists) return null;
  const data = snap.data() || {};
  if(data.status === "cancelled" || data.status === "finished" || data.status === "rejected") return null;
  return data;
}

async function setBothActivePvp(roomId, a, b, data){
  const batch = db.batch();
  batch.set(db.collection("pvpActive").doc(a), {roomId, opponent:b, ...data}, {merge:true});
  batch.set(db.collection("pvpActive").doc(b), {roomId, opponent:a, ...data}, {merge:true});
  await batch.commit();
}

async function clearBothActivePvp(a,b){
  const batch = db.batch();
  if(a) batch.delete(db.collection("pvpActive").doc(a));
  if(b) batch.delete(db.collection("pvpActive").doc(b));
  await batch.commit();
}

async function updateOnlinePresence(){
  if(!currentUser) return;
  try{
    const ref = db.collection("onlineUsers").doc(currentUser);
    await ref.set({
      nickname: currentUser,
      title: getCurrentTitle(),
      updatedAtMillis: Date.now(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
    const snap = await ref.get();
    const serverStamp = snap.exists && snap.data().updatedAt;
    if(serverStamp && typeof serverStamp.toMillis === "function"){
      serverTimeOffsetMs = serverStamp.toMillis() - Date.now();
      serverTimeAtSync = serverStamp.toMillis();
      monotonicAtSync = typeof performance !== "undefined" ? performance.now() : 0;
      hasServerTime = true;
    }
  }catch(e){
    console.error(e);
  }
}

function startOnlinePresence(){
  if(!currentUser) return;
  updateOnlinePresence();
  if(onlinePresenceTimer) clearInterval(onlinePresenceTimer);
  onlinePresenceTimer = setInterval(updateOnlinePresence, 20000);
}

function stopOnlinePresence(){
  if(onlinePresenceTimer){
    clearInterval(onlinePresenceTimer);
    onlinePresenceTimer = null;
  }
  if(currentUser){
    db.collection("onlineUsers").doc(currentUser).delete().catch(e=>console.error(e));
  }
}

async function isUserOnline(nickname){
  nickname = cleanNickname(nickname);
  if(!nickname) return false;
  try{
    const snap = await db.collection("onlineUsers").doc(nickname).get();
    if(!snap.exists) return false;
    const data = snap.data() || {};
    const stamp = data.updatedAt;
    const updated = stamp && typeof stamp.toMillis === "function" ? stamp.toMillis() : Number(data.updatedAtMillis || 0);
    const age = getTrustedNowMs() - updated;
    return age >= 0 && age <= 45000;
  }catch(e){
    console.error(e);
    return false;
  }
}

function getPvpPreparedFishes(){
  return pvpPrepIndexes
    .map(i => bucket[i])
    .filter(f => {
      if(!f || f.grade === "쓰레기") return false;
      updateRecoveringFishHp(f);
      const c=ensureCombatStats(f);
      return c.hp>0&&!c.knockedOut&&c.status!=="기절";
    });
}

function repairPvpCombatStats(f){
  if(!f||f.grade==="쓰레기")return f;
  const c=f.combat||(f.combat={}),stars=c.stars||{},tier=key=>Math.max(0,Math.min(3,Math.floor(Number(stars[key]||0))));
  const dodgeMid=[5.5,12.5,20,35],critMid=[15,25,35,45],critDamageMid=[200,300,400,475];
  if(!Number.isFinite(Number(c.dodge))||Number(c.dodge)<=0)c.dodge=dodgeMid[tier("dodge")];
  if(!Number.isFinite(Number(c.critRate))||Number(c.critRate)<=0)c.critRate=critMid[tier("critRate")];
  if(!Number.isFinite(Number(c.critDamage))||Number(c.critDamage)<=0)c.critDamage=critDamageMid[tier("critDamage")];
  if(!Number.isFinite(Number(c.attack))||Number(c.attack)<0)c.attack=Math.max(0,Number(c._baseAttack||1));
  if(!Number.isFinite(Number(c.maxHp))||Number(c.maxHp)<=0)c.maxHp=Math.max(1,Number(c._baseMaxHp||c.hp||1));
  if(!Number.isFinite(Number(c.hp)))c.hp=c.maxHp;
  return f;
}

function cloneForPvp(f, levels){
  const c = JSON.parse(JSON.stringify(f || {}));
  const raw = JSON.parse(JSON.stringify(ensureCombatStats(f)));
  const lv = levels || trainingLevels || {attack:0,hp:0,critDamage:0};

  const baseAttack = Number(raw._baseAttack ?? raw.attack ?? 0);
  const baseMaxHp = Number(raw._baseMaxHp ?? raw.maxHp ?? raw.hp ?? 1);
  const baseCritDamage = Number(raw._baseCritDamage ?? raw.critDamage ?? 0);

  raw.attack = Math.max(0, Math.floor(baseAttack * (1 + getProgressiveTrainingBonus(Number(lv.attack || 0)) / 100)));
  raw.maxHp = Math.max(1, Math.floor(baseMaxHp * (1 + getProgressiveTrainingBonus(Number(lv.hp || 0)) / 100)));
  raw.hp = raw.maxHp;
  raw.critDamage = Math.floor(baseCritDamage + getProgressiveTrainingBonus(Number(lv.critDamage || 0)));
  raw.status = "정상";
  delete raw.knockedOut;
  delete raw.battleDown;
  delete raw.stunUntil;
  delete raw.recoveryStartAt;
  delete raw.recoveryStartHp;

  c.combat = raw;
  repairPvpCombatStats(c);
  return c;
}

function buildPvpTeamFromIndexes(indexes, sourceBucket, levels){
  const team = [];

  (indexes || []).forEach(rawIndex => {
    const idx = Number(rawIndex);
    const f = sourceBucket[idx];

    if(f && f.grade !== "쓰레기"){
      updateRecoveringFishHp(f);
      const combat=ensureCombatStats(f);
      if(combat.hp<=0||combat.knockedOut||combat.status==="기절") return;
      team.push(cloneForPvp(f, levels));
    }
  });

  return team.slice(0,3);
}

function pvpDisplayName(name,title){
  return title ? "[" + title + "] " + name : name;
}

function pvpTeamLine(team){
  return team.map((f,i)=>(i+1)+". "+pvpFishLabel(f)).join("\n");
}

function pvpAlive(team){
  return team.find(f => f && f.combat && f.combat.hp > 0 && !f.combat._pvp?.gone);
}

function pvpFishLabel(f){
  return activePvpFishLabeler ? activePvpFishLabeler(f) : color(lineFish(f), f.grade);
}

function pvpSubjectLabel(f){
  return pvpFishLabel(f) + subjectParticle(lineFish(f));
}

function pvpHpBar(cur,max){
  cur = Math.max(0, Math.floor(cur));
  max = Math.max(1, Math.floor(max));
  const ratio = Math.max(0, Math.min(1, cur / max));
  const filled = Math.round(ratio * 10);
  return "HP " + cur.toLocaleString() + " / " + max.toLocaleString() + "\n" +
    "█".repeat(filled) + "░".repeat(10-filled) + " " + Math.floor(ratio*100) + "%";
}

function simulatePvpBattle({leftName,leftTitle,leftProfile,leftTeam,rightName,rightTitle,rightProfile,rightTeam}){
  const left = (leftTeam || []).map(f => repairPvpCombatStats(JSON.parse(JSON.stringify(f)))).slice(0,3);
  const right = (rightTeam || []).map(f => repairPvpCombatStats(JSON.parse(JSON.stringify(f)))).slice(0,3);
  const allPvpFishes = left.concat(right);
  setBattleDisplayNumbers(left);
  setBattleDisplayNumbers(right);
  const pvpSideByFish = new WeakMap();
  left.forEach(f => pvpSideByFish.set(f, "left"));
  right.forEach(f => pvpSideByFish.set(f, "right"));
  const viewerSide = currentUser === rightName ? "right" : "left";
  activePvpFishLabeler = f => {
    if(!f) return "";
    const side = pvpSideByFish.get(f);
    const marker = side ? " [[PVP_SIDE:"+side+"]]" : "";
    return color(lineFish(f) + marker, f.grade);
  };
  const state = {
    left:{team:left,damage:0,lightPool:0,rewriteUsed:false,deletedAttackerId:"",deletedAttackerUntil:0,deletedAttackerUsed:false,sealNext:false,timePending:false,timeUsed:false,period:false,periodSentences:0,observedId:"",observedUntil:0,observedResolvedTurn:0,history:[],lastPair:""},
    right:{team:right,damage:0,lightPool:0,rewriteUsed:false,deletedAttackerId:"",deletedAttackerUntil:0,deletedAttackerUsed:false,sealNext:false,timePending:false,timeUsed:false,period:false,periodSentences:0,observedId:"",observedUntil:0,observedResolvedTurn:0,history:[],lastPair:""}
  };

  allPvpFishes.forEach((f,i)=>{
    if(!f.id) f.id = "pvp_" + i + "_" + Math.random().toString(36).slice(2);
    const c=f.combat;
    c._pvp={originalMaxHp:c.maxHp,originalCritDamage:c.critDamage};
  });

  const replayFrames=[];
  const snapshotPvpFish=f=>({id:String(f.id||""),name:f.name,grade:f.grade,size:f.size??null,evolutionStage:Number(f.fusion?.evolutionStage||0),hp:Math.max(0,Number(f.combat?.hp||0)),maxHp:Math.max(1,Number(f.combat?.maxHp||1)),attack:Math.max(0,Number(f.combat?.attack||0)),dodge:Math.max(0,Number(f.combat?.dodge||0)),critRate:Math.max(0,Number(f.combat?.critRate||0)),critDamage:Math.max(0,Number(f.combat?.critDamage||0)),status:f.combat?._pvp?.gone?"전투 불가":Number(f.combat?.hp||0)<=0?"쓰러짐":"정상"});
  function capturePvpFrame(entry,frameTurn=turn,actorSide="",actorId=""){
    const text=String(entry||"").trim();
    if(!text)return;
    replayFrames.push({entry:renderPvpPerspectiveLog(text,viewerSide),turn:Number(frameTurn||0),actorSide,actorId:String(actorId||""),left:left.map(snapshotPvpFish),right:right.map(snapshotPvpFish)});
  }

  let logText = "";
  logText += "다중 대전 시작\n\n";
  logText += pvpDisplayName(leftName,leftTitle) + "\n" + pvpTeamLine(left) + "\n\n";
  logText += "VS\n\n";
  logText += pvpDisplayName(rightName,rightTitle) + "\n" + pvpTeamLine(right) + "\n\n";
  logText += "━━━━━━━━━━━━━━\n\n";

  let turn = 1;
  const firstSide = Math.random() < 0.5 ? "left" : "right";
  logText += "선공 : " + (firstSide === "left" ? pvpDisplayName(leftName,leftTitle) : pvpDisplayName(rightName,rightTitle)) + "\n\n";
  logText += "━━━━━━━━━━━━━━\n\n";
  capturePvpFrame("대전 시작\n선공 : "+(firstSide==="left"?pvpDisplayName(leftName,leftTitle):pvpDisplayName(rightName,rightTitle)),0,firstSide,"");

  function sideTitle(side){ return side === "left" ? pvpDisplayName(leftName,leftTitle) : pvpDisplayName(rightName,rightTitle); }
  function otherSide(side){ return side === "left" ? "right" : "left"; }
  function teamOf(side){ return state[side].team; }
  function alive(team){ return team.filter(f=>f&&f.combat&&f.combat.hp>0&&!f.combat._pvp?.gone); }
  function livingSide(side){ return alive(teamOf(side)); }
  function hasFish(side,name){ return livingSide(side).some(f=>f.name===name); }
  function pvpState(f){ if(!f.combat._pvp) f.combat._pvp={originalMaxHp:f.combat.maxHp,originalCritDamage:f.combat.critDamage}; return f.combat._pvp; }
  function pvpPreAttackText(f){
    const stateText=getCyclingTraitStateText(f,pvpState(f));
    return stateText ? stateText + "\n" : "";
  }
  function teamHpRate(side){
    const max=teamOf(side).reduce((s,f)=>s+Number(f.combat?.maxHp||0),0);
    const hp=teamOf(side).reduce((s,f)=>s+Math.max(0,Number(f.combat?.hp||0)),0);
    return max>0?hp/max:0;
  }
  function snapshotSide(side){
    return new Map(teamOf(side).map(f=>[f.id,{combat:JSON.parse(JSON.stringify(f.combat))}]));
  }
  function restoreSide(side,snap){
    teamOf(side).forEach(f=>{
      const s=snap&&snap.get(f.id); if(!s)return;
      f.combat=JSON.parse(JSON.stringify(s.combat));
    });
  }
  function restorePvpHealthAndStatuses(f,snap){
    if(!f||!snap||!snap.combat)return;
    const past=snap.combat,c=f.combat;
    c.hp=Math.max(0,Math.min(c.maxHp,Number(past.hp||0)));
    c.status=past.status||"정상";
    ["whiteFlame","burnStacks","poisonStacks","azhiCurses","ratatoskrRedirect"].forEach(key=>{
      if(past[key]!==undefined)c[key]=JSON.parse(JSON.stringify(past[key]));
      else delete c[key];
    });
  }
  function clearOnePvpStatus(f){
    const c=f&&f.combat;if(!c)return "";
    if(c.whiteFlame){delete c.whiteFlame;return "백염";}
    if(c.burnStacks){delete c.burnStacks;return "화상";}
    if(c.poisonStacks){delete c.poisonStacks;return "독";}
    const curse=Object.keys(c.azhiCurses||{}).find(k=>c.azhiCurses[k]);
    if(curse){delete c.azhiCurses[curse];return "재앙";}
    if(c.ratatoskrRedirect){delete c.ratatoskrRedirect;return "이간질";}
    if(c.status&&c.status!=="정상"){const removed=c.status;c.status="정상";return removed;}
    return "";
  }
  function getStormEye(side){
    if(!hasFish(side,"휘몰아치는 마음")) return null;
    return livingSide(side).sort((a,b)=>Number(a.combat.attack||0)-Number(b.combat.attack||0))[0]||null;
  }
  function chooseTarget(defSide){
    let candidates=livingSide(defSide).filter(f=>!pvpState(f).ashRemnant);
    const eye=getStormEye(defSide);
    if(eye&&candidates.length>1)candidates=candidates.filter(f=>f!==eye);
    if(candidates.length===0)return null;
    return candidates[Math.floor(Math.random()*candidates.length)];
  }
  function registerPvpStatus(side){
    const dragon=livingSide(side).find(f=>f.name==="청룡"); if(!dragon)return "";
    const st=pvpState(dragon); st.raindrops=Number(st.raindrops||0)+1;
    if(st.raindrops<3)return "";
    st.raindrops=0;
    const logs=[];
    livingSide(side).forEach(f=>{
      const c=f.combat,heal=Math.floor(c.maxHp*0.1);
      const removed=clearOnePvpStatus(f);
      c.hp=Math.min(c.maxHp,c.hp+heal);
      logs.push(pvpFishLabel(f)+(removed?" · "+removed+" 해제":"")+" · "+heal.toLocaleString()+" 회복");
    });
    return traitUseByFish(dragon, logs.join("\n"))+"\n\n";
  }
  function pvpIncoming(defSide,target,raw,attacker,atkSide){
    const c=target.combat, st=pvpState(target);
    let dmg=Math.max(0,Math.floor(raw)), extraLog="";
    if(target.name==="금빛 보름달 드래곤"&&st.moonPhase===0)dmg=Math.floor(dmg*0.8);
    if(target.name==="불타는 마음"&&getBurningHeartStageByCombat(c)>=3)dmg=Math.floor(dmg*1.2);
    if(target.name==="기묘한 기운 🌀"&&dmg>Number(c.attack||0)&&Math.random()<0.25){
      st.numericStored=Math.max(1,Math.floor(dmg*1.1)); dmg=Math.max(0,Math.floor(c.attack||0));
      extraLog+=traitUseByFish(target, "받을 피해와 공격 수치가 뒤바뀌었습니다.")+"\n\n";
    }
    const letters=hasFish(defSide,"잃어버린 첫 번째 편지 조각 ✉️")&&hasFish(defSide,"잃어버린 두 번째 편지 조각 ✉️")&&hasFish(defSide,"잃어버린 세 번째 편지 조각 ✉️");
    if(dmg>=c.hp&&letters&&!state[defSide].rewriteUsed){
      state[defSide].rewriteUsed=true; dmg=0;
      extraLog+=traitUseByFish(livingSide(defSide).find(f=>f.name==="잃어버린 첫 번째 편지 조각 ✉️"), pvpSubjectLabel(target)+" 쓰러지는 사건이 삭제되었습니다.", "다시 쓰인 편지")+"\n\n";
    }else if(dmg>=c.hp&&target.name==="잿빛 밤하늘 드래곤"&&!st.ashUsed){
      st.ashUsed=true; st.ashRemnant=true; st.ashTurns=3; dmg=Math.max(0,c.hp-1);
      extraLog+=traitUseByFish(target, pvpFishLabel(target)+"\n3턴 동안 재의 잔영으로 남습니다.")+"\n\n";
    }else if(dmg>=c.hp&&hasFish(defSide,"빛나는 마음")){
      const required=Math.max(1,Math.floor(c.maxHp*0.3));
      if(state[defSide].lightPool>=required){
        state[defSide].lightPool-=required; dmg=Math.max(0,c.hp-1);st.afterHeal=required;st.skipLightGain=true;
        extraLog+=traitUseByFish(livingSide(defSide).find(f=>f.name==="빛나는 마음"), pvpFishLabel(target)+"의 죽음을 막고 "+required.toLocaleString()+" 회복합니다.")+"\n\n";
      }
    }
    return {dmg,extraLog};
  }
  function applyPvpDamage(defSide,target,raw,attacker,atkSide,reason){
    if(!target||!target.combat||target.combat.hp<=0)return "";
    const before=target.combat.hp;
    const inc=pvpIncoming(defSide,target,raw,attacker,atkSide);
    target.combat.hp=Math.max(0,target.combat.hp-inc.dmg);
    if(pvpState(target).afterHeal){target.combat.hp=Math.min(target.combat.maxHp,target.combat.hp+pvpState(target).afterHeal);delete pvpState(target).afterHeal;}
    const actual=Math.min(before,inc.dmg);
    if(actual>0)state[atkSide].damage+=actual;
    if(actual>0&&!pvpState(target).skipLightGain&&hasFish(defSide,"빛나는 마음"))state[defSide].lightPool+=Math.floor(actual*0.25);
    delete pvpState(target).skipLightGain;
    if(target.name==="무한한 시간"&&target.combat.hp<=0&&!state[defSide].timeUsed)state[defSide].timePending=true;
    const reasonLine = reason === "" ? "" : (reason || "피해") + "\n";
    let s=inc.extraLog+reasonLine+inc.dmg.toLocaleString()+" 피해\n\n"+pvpFishLabel(target)+"\n"+pvpHpBar(target.combat.hp,target.combat.maxHp)+"\n\n";
    if(attacker&&actual>0){
      const st=pvpState(target);
      if(st.lastAttackerId===attacker.id&&target.name==="흑룡"){
        const reflect=Math.floor(actual*0.3);
        st.scaleEmpowered=true;
        if(reflect>0){
          s+=applyPvpDamage(atkSide,attacker,reflect,null,defSide,traitUseByFish(target, "역린이 피해를 반사했습니다."));
        }
        s+=traitUseByFish(target, "다음 공격이 강화됩니다.")+"\n\n";
      }
      st.lastAttackerId=attacker.id;
    }
    if(target.combat.hp<=0)s+=pvpFishLabel(target)+" 쓰러짐\n\n";
    return s;
  }
  function attackValue(side,f){
    const c=f.combat,st=pvpState(f);
    let atk=Number(c.attack||1),critDmg=Number(c.critDamage||150),mult=1,extra=0,replaced=false,preLog="";
    if(st.ashRemnant)mult*=0.5;
    if(f.name==="핏빛 초승달 드래곤"){
      const cost=Math.min(Math.max(0,c.hp-1),Math.floor(c.hp*0.05)); c.hp-=cost; extra+=Math.floor(cost*1.5/FISH_HP_BALANCE_MULTIPLIER);
      if(cost>0)preLog+=traitUseByFish(f, "체력 "+cost.toLocaleString()+" 소모")+"\n\n";
    }
    if(f.name==="금빛 보름달 드래곤"&&st.moonPhase===2)mult*=1.5;
    if(st.ascended)mult*=1.3;
    if(st.scaleEmpowered){mult*=1.5;delete st.scaleEmpowered;}
    if(f.name==="해신룡"&&st.tideHigh)mult*=st.tideStored?1.7:1.4;
    if(f.name==="불타는 마음"){
      st.heartbeatCost=consumeBurningHeartHp(c);
      const stage=getBurningHeartStageByCombat(c);
      st.heartbeatStage=stage;
      if(stage===1){mult*=1.15;critDmg+=30;}
      else if(stage===2){mult*=1.25;critDmg+=60;}
      else if(stage>=3){mult*=1.35;critDmg+=100;}
    }
    if(f.name==="바다를 삼킨 태양")mult*=[1.1,1.2,1.35,1.5,1.8][Math.max(0,Number(st.sunStage||1)-1)];
    if(Number(st.observedWeakUntil||0)>=turn)mult*=0.75;
    const eye=getStormEye(side); if(eye&&eye!==f){extra+=Math.floor(Number(eye.combat.attack||0)*0.2);preLog+=traitUseByFish(livingSide(side).find(x=>x.name==="휘몰아치는 마음"), pvpFishLabel(eye)+"가 폭풍의 중심이 되어 이번 공격에 힘을 보탰습니다.")+"\n\n";}
    if(st.numericStored){atk=st.numericStored;mult=1;extra=0;replaced=true;delete st.numericStored;}
    return {atk,critDmg,mult,extra,replaced,preLog};
  }
  function recordOutcome(side,outcome,enemySide,logParts){
    const galaxy=livingSide(side).find(f=>f.name==="호수에 비친 은하수");
    if(galaxy){
      const st=pvpState(galaxy); if(!st.constellation)st.constellation={hit:false,crit:false,miss:false}; st.constellation[outcome]=true;
      if(st.constellation.hit&&st.constellation.crit&&st.constellation.miss){
        st.constellation={hit:false,crit:false,miss:false};
        const raw=livingSide(side).reduce((sum,f)=>sum+Math.floor(Number(f.combat.attack||0)*0.3),0);
        const target=chooseTarget(enemySide);
        if(target)logParts.push(applyPvpDamage(enemySide,target,raw,null,side,traitUseByFish(galaxy, "일반 적중, 치명타, 빗나감을 모두 기록해 별자리가 완성되었습니다.\n살아 있는 아군의 힘이 별빛으로 이어집니다.")));
      }
    }
    const wish=livingSide(side).find(f=>f.name==="호수에 비친 별");
    if(wish){
      const st=pvpState(wish);
      if(st.wish===outcome){st.wishCount++;const need=outcome==="crit"?3:outcome==="dodge"?2:1;if(st.wishCount>=need){state[enemySide].sealNext=true;st.wish="";st.wishCount=0;logParts.push(traitUseByFish(wish, "소원 성취\n상대의 다음 공격 1회를 봉인합니다.")+"\n\n");}}
    }
    if(state[side].period&&(outcome==="hit"||outcome==="crit")&&pvpAlive(teamOf(enemySide))){
      state[side].periodSentences=Math.min(5,Number(state[side].periodSentences||0)+(outcome==="crit"?2:1));
      logParts.push(traitUseByFish(teamOf(side).find(f=>f.name==="잃어버린 세 번째 편지 조각 ✉️"), "문장 "+state[side].periodSentences+" / 5")+"\n\n");
      if(state[side].periodSentences>=5){
        teamOf(enemySide).forEach(f=>f.combat.hp=0);
        logParts.push("마지막 문장에 마침표가 찍혔습니다.\n"+sideTitle(enemySide)+subjectParticle(sideTitle(enemySide))+" 전투에서 사라졌습니다.\n\n");
      }
    }
  }
  function afterHit(side,f,enemySide,target,logParts){
    if(!f||!f.combat||f.combat.hp<=0)return;
    if(f.name==="푸른 눈의 백염룡"&&target&&target.combat.hp>0){
      target.combat.whiteFlame=Number(target.combat.whiteFlame||0)+1;
      logParts.push(registerPvpStatus(enemySide));
      if(target.combat.whiteFlame>=3){target.combat.whiteFlame=0;logParts.push(applyPvpDamage(enemySide,target,Number(f.combat.attack||0)*1.5,null,side,traitUseByFish(f, "백염이 3중첩이 되어 폭발했습니다.")));}
      else logParts.push(traitUseByFish(f, "백염 "+target.combat.whiteFlame+" / 3")+"\n\n");
    }
    if(f.name==="해신룡"){
      const st=pvpState(f);
      if(st.tideHigh&&target&&target.combat.hp>0){logParts.push(applyPvpDamage(enemySide,target,Number(f.combat.attack||0)*0.4,null,side,traitUseByFish(f, "밀물의 파도가 이어져 추가 피해가 들어갑니다.")));st.tideStored=false;}
      else if(!st.tideHigh)st.tideStored=true;
    }
    if(f.name==="바다를 삼킨 태양"&&pvpState(f).sunStage===5){const t=chooseTarget(enemySide);if(t)logParts.push(applyPvpDamage(enemySide,t,Number(f.combat.attack||0)*2,null,side,traitUseByFish(f, "태양 주기가 태양 폭발 단계에 도달했습니다.")));}
    if(f.name==="불타는 마음"&&Number(pvpState(f).heartbeatStage||0)>=2){
      const stage=Number(pvpState(f).heartbeatStage||0), t=chooseTarget(enemySide);
      const chance=stage>=3?0.5:0.3, ratio=stage>=3?0.5:0.4;
      if(t&&Math.random()<chance)logParts.push(applyPvpDamage(enemySide,t,Number(f.combat.attack||0)*ratio,null,side,traitUseByFish(f, "심장이 한 번 더 뛰었습니다.")));
    }
    if(f.name==="불타는 마음"&&Number(pvpState(f).heartbeatStage||0)>=3){
      const c=f.combat,cap=Math.floor(c.maxHp*0.3);
      if(c.hp>0&&c.hp<cap&&Math.random()<0.25){
        const heal=Math.min(Math.floor(c.hp*0.3),cap-c.hp);
        if(heal>0){c.hp=Math.min(cap,c.hp+heal);logParts.push(traitUseByFish(f, "꺼져가던 심장이 다시 불붙었습니다.\n체력 "+heal.toLocaleString()+" 회복")+"\n\n");}
      }
    }
  }
  function startPvpTurn(side){
    const stSide=state[side];
    const turnLogs=[];
    stSide.history.push({turn,states:snapshotSide(side)}); if(stSide.history.length>7)stSide.history.shift();
    const wish=livingSide(side).find(f=>f.name==="호수에 비친 별");
    if(wish&&!pvpState(wish).wish){
      const st=pvpState(wish),kinds=["crit","dodge","low"];
      st.wish=kinds[Math.floor(Math.random()*kinds.length)];st.wishCount=0;
      const label=st.wish==="crit"?"아군 치명타 3회":st.wish==="dodge"?"아군 회피 2회":"빈사 상태로 1턴 생존";
      turnLogs.push(traitUseByFish(wish, "목표 : "+label)+"\n\n");
    }
    if(turn%4===0&&hasFish(side,"호수에 비친 달")){
      const past=stSide.history.find(x=>x.turn===turn-2);
      const target=livingSide(side).sort((a,b)=>a.combat.hp/a.combat.maxHp-b.combat.hp/b.combat.maxHp)[0];
      if(past&&target&&past.states.get(target.id)){
        restorePvpHealthAndStatuses(target,past.states.get(target.id));
        turnLogs.push(traitUseByFish(livingSide(side).find(f=>f.name==="호수에 비친 달"), pvpFishLabel(target)+"\n2턴 전 상태를 되찾았습니다.")+"\n\n");
      }
    }
    livingSide(side).forEach(f=>{
      const c=f.combat,st=pvpState(f);
      if(f.name==="이무기"&&turn>=7&&!st.ascended){
        st.ascended=true;const oldMax=c.maxHp;c.maxHp=Math.floor(oldMax*1.2);c.hp=Math.min(c.maxHp,c.hp+Math.floor(oldMax*0.3));
        turnLogs.push(traitUseByFish(f, pvpFishLabel(f)+"\n최대 체력 20% 증가, 체력 30% 회복, 공격력과 회피율이 상승했습니다.")+"\n\n");
      }
      if(f.name==="금빛 보름달 드래곤"){
        st.moonPhase=(turn-1)%3;
        if(st.moonPhase===1){
          const t=livingSide(side).sort((a,b)=>a.combat.hp/a.combat.maxHp-b.combat.hp/b.combat.maxHp)[0];
          if(t){const heal=Math.floor(t.combat.maxHp*0.1);t.combat.hp=Math.min(t.combat.maxHp,t.combat.hp+heal);turnLogs.push(traitUseByFish(f,"반달\n"+pvpFishLabel(t)+" "+heal.toLocaleString()+" 회복")+"\n\n");}
        }else if(st.moonPhase===2){
          const t=livingSide(side).find(x=>clearOnePvpStatus(x));
          if(t)turnLogs.push(traitUseByFish(f,"보름달\n"+pvpFishLabel(t)+"의 상태이상을 해제했습니다.")+"\n\n");
        }
      }
      if(f.name==="바다를 삼킨 태양")st.sunStage=((turn-1)%5)+1;
      if(f.name==="해신룡")st.tideHigh=turn%2===1;
    });
    return turnLogs.join("");
  }
  function getPvpSideTurnBlock(side){
    const enemySide=otherSide(side);
    if(turn%4!==0||!hasFish(enemySide,"잃어버린 두 번째 편지 조각 ✉️"))return "";
    return traitUseByFish(livingSide(enemySide).find(f=>f.name==="잃어버린 두 번째 편지 조각 ✉️"), sideTitle(side)+"의 이번 페이지에는 아무 내용도 적혀 있지 않습니다.\n이번 턴에 행동하지 못합니다.")+"\n\n";
  }
  function sideAttack(side,onlyAttacker=null){
    const enemySide=otherSide(side);
    const sideLog=[];
    sideLog.push('<span style="font-weight:700">' + sideTitle(side) + (onlyAttacker?" · "+pvpFishLabel(onlyAttacker)+" 행동":"의 턴") + '</span>\n\n');
    const attackers=onlyAttacker?[onlyAttacker]:livingSide(side).slice();
    for(const attacker of attackers){
      const frameLogStart=sideLog.length;
      try{
      if(!attacker.combat||attacker.combat.hp<=0||pvpState(attacker).ashRemnant&&pvpState(attacker).ashTurns<=0)continue;
      const firstLetter=livingSide(enemySide).find(f=>f.name==="잃어버린 첫 번째 편지 조각 ✉️");
      if(state[enemySide].deletedAttackerId===attacker.id&&turn<=state[enemySide].deletedAttackerUntil){
        sideLog.push(traitUseByFish(teamOf(enemySide).find(f=>f.name==="잃어버린 첫 번째 편지 조각 ✉️"), pvpFishLabel(attacker)+"의 공격이 이야기에서 삭제되어 사용할 수 없습니다.")+"\n\n");continue;
      }
      if(firstLetter&&!state[enemySide].deletedAttackerUsed){
        state[enemySide].deletedAttackerUsed=true;state[enemySide].deletedAttackerId=attacker.id;state[enemySide].deletedAttackerUntil=turn+3;
        sideLog.push(traitUseByFish(firstLetter, pvpFishLabel(attacker)+"의 공격이 이야기에서 삭제되어 3턴 동안 사용할 수 없습니다.")+"\n\n");continue;
      }
      if(state[side].sealNext){state[side].sealNext=false;sideLog.push(traitUseByFish(livingSide(enemySide).find(f=>f.name==="호수에 비친 별"), pvpFishLabel(attacker)+"의 공격이 봉인되었습니다.")+"\n\n");continue;}
      if(state[enemySide].observedId===attacker.id&&turn<=state[enemySide].observedUntil&&hasFish(enemySide,"수상한 기운 👁️")){
        const observer=livingSide(enemySide).find(f=>f.name==="수상한 기운 👁️"),healLogs=[];
        livingSide(enemySide).forEach(ally=>{const heal=Math.max(1,Math.floor(ally.combat.maxHp*0.18)),removed=clearOnePvpStatus(ally);ally.combat.hp=Math.min(ally.combat.maxHp,ally.combat.hp+heal);healLogs.push(pvpFishLabel(ally)+(removed?" · "+removed+" 해제":"")+" · "+heal.toLocaleString()+" 회복");});
        pvpState(attacker).observedWeakUntil=turn+3;state[enemySide].observedId="";state[enemySide].observedUntil=0;state[enemySide].observedResolvedTurn=turn;
        sideLog.push(traitUseByFish(observer, pvpFishLabel(attacker)+"의 공격 효과가 뒤집혔습니다.\n"+healLogs.join("\n")+"\n"+pvpFishLabel(attacker)+"의 공격력이 3턴 동안 25% 감소합니다.")+"\n\n");continue;
      }
      const target=chooseTarget(enemySide); if(!target)break;
      const pair=attacker.id+":"+target.id;
      if(hasFish(enemySide,"얼어붙은 마음")&&state[enemySide].lastPair===pair){state[enemySide].lastPair="";sideLog.push(traitUseByFish(livingSide(enemySide).find(f=>f.name==="얼어붙은 마음"), "같은 공격 흐름이 얼어붙어 "+pvpFishLabel(attacker)+"의 공격이 취소되었습니다.")+"\n\n");continue;}
      state[enemySide].lastPair=pair;
      const av=attackValue(side,attacker); sideLog.push(av.preLog); sideLog.push(pvpPreAttackText(attacker));
      let dodge=Number(target.combat.dodge||0);
      if(livingSide(side).some(f=>f.name==="바다를 삼킨 태양"&&pvpState(f).sunStage===3))dodge=0;
      if(livingSide(side).some(f=>f.name==="해신룡"&&pvpState(f).tideHigh))dodge=Math.max(0,dodge-10);
      if(target.name==="해신룡"&&!pvpState(target).tideHigh)dodge+=15;
      if(Math.random()*100<dodge){sideLog.push(pvpFishLabel(attacker)+" 공격\n"+pvpFishLabel(target)+" 회피!\n\n");recordOutcome(side,"miss",enemySide,sideLog);recordOutcome(enemySide,"dodge",side,sideLog);continue;}
      let dmg=av.replaced?av.atk:av.atk;
      const crit=!av.replaced&&Math.random()*100<Number(attacker.combat.critRate||0);
      if(crit)dmg=Math.floor(dmg*av.critDmg/100);
      dmg=Math.max(1,Math.floor(dmg*av.mult+av.extra));
      if(state[enemySide].period)dmg=Math.floor(dmg*1.3);
      sideLog.push(pvpFishLabel(attacker)+" 공격!\n"+(crit?"치명타!\n\n":"\n"));
      if(hasFish(enemySide,"영롱한 다이아몬드")&&!state[enemySide].diamondUsed){
        state[enemySide].diamondUsed=true;
        const targets=livingSide(enemySide);
        const split=Math.max(1,Math.floor(dmg*0.7/targets.length));
        sideLog.push(traitUseByFish(livingSide(enemySide).find(f=>f.name==="영롱한 다이아몬드"), "피해를 30% 줄이고 분산합니다.")+"\n\n");
        targets.forEach(t=>sideLog.push(applyPvpDamage(enemySide,t,split,attacker,side,pvpFishLabel(attacker)+"의 굴절 공격")));
      }else sideLog.push(applyPvpDamage(enemySide,target,dmg,attacker,side,""));
      recordOutcome(side,crit?"crit":"hit",enemySide,sideLog);
      if(attacker.combat&&attacker.combat.hp>0) afterHit(side,attacker,enemySide,target,sideLog);
      if(hasFish(enemySide,"수상한 기운 👁️")&&state[enemySide].observedResolvedTurn!==turn&&(!state[enemySide].observedId||turn>state[enemySide].observedUntil)){
        state[enemySide].observedId=attacker.id;state[enemySide].observedUntil=turn+3;
        sideLog.push(traitUseByFish(livingSide(enemySide).find(f=>f.name==="수상한 기운 👁️"), pvpFishLabel(attacker)+"의 공격을 3턴 동안 관측합니다.")+"\n\n");
      }
      if(!pvpAlive(teamOf(enemySide)))break;
      }finally{
        const frameEntry=sideLog.slice(frameLogStart).join("");
        if(frameEntry.trim())capturePvpFrame(frameEntry,turn,side,attacker.id);
      }
    }
    return sideLog.join("");
  }
  function finishPvpSideActions(side){
    const sideLog=[];
    if(hasFish(side,"황룡")){
      const al=livingSide(side).filter(f=>!pvpState(f).ashRemnant),total=al.reduce((s,f)=>s+f.combat.hp,0),maxTotal=al.reduce((s,f)=>s+f.combat.maxHp,0);
      if(al.length&&maxTotal>0){let leftHp=total;al.forEach((f,i)=>{const v=i===al.length-1?leftHp:Math.floor(total*f.combat.maxHp/maxTotal);f.combat.hp=Math.max(1,Math.min(f.combat.maxHp,v));leftHp-=f.combat.hp;});sideLog.push(traitUseByFish(livingSide(side).find(f=>f.name==="황룡"), "아군 체력을 재분배했습니다.")+"\n\n");}
    }
    return sideLog.join("");
  }
  function finishPvpTurn(){
    ["left","right"].forEach(side=>{
      state[side].diamondUsed=false;
      const lowLogs=[];
      livingSide(side).forEach(f=>{
        const st=pvpState(f);
        if(st.ashRemnant){st.ashTurns--;if(st.ashTurns<=0){f.combat.hp=0;st.gone=true;}}
        if(f.combat.hp>0&&f.combat.hp/f.combat.maxHp<=0.15)recordOutcome(side,"low",otherSide(side),lowLogs);
      });
      if(lowLogs.length)logText+=lowLogs.join("");
      const enemy=otherSide(side);
      if(!state[side].period&&hasFish(side,"잃어버린 세 번째 편지 조각 ✉️")&&teamHpRate(enemy)<=0.18&&pvpAlive(teamOf(enemy))){
        state[side].period=true;state[side].periodSentences=0;
        logText+=traitUseByFish(livingSide(side).find(f=>f.name==="잃어버린 세 번째 편지 조각 ✉️"), sideTitle(enemy)+"의 마지막 문장이 시작되었습니다.\n문장 0 / 5\n상대의 공격력이 25% 증가합니다.")+"\n\n";
      }
    });
    ["left","right"].forEach(side=>{
      const timeFish=teamOf(side).find(f=>f.name==="무한한 시간");
      if(timeFish&&timeFish.combat.hp<=0&&!state[side].timeUsed)state[side].timePending=true;
      if(state[side].timePending&&!state[side].timeUsed&&state[side].history.length){
        const target=state[side].history.find(x=>x.turn===turn-5)||state[side].history[0];
        if(target&&timeFish){state[side].timeUsed=true;state[side].timePending=false;restoreSide(side,target.states);const rewound=Math.max(0,turn-target.turn);logText+=traitUseByFish(timeFish, "무한한 시간의 죽음과 함께 시간이 되감겼습니다.\n파티가 "+rewound+"턴 전 상태로 돌아왔습니다.")+"\n\n";}
      }
    });
  }

  while(pvpAlive(left) && pvpAlive(right) && turn <= 200){
    logText += "턴 " + turn + "\n\n";
    capturePvpFrame("턴 "+turn,turn,"","");
    const leftStartLog=startPvpTurn("left"),rightStartLog=startPvpTurn("right");
    logText += leftStartLog;logText += rightStartLog;
    if(leftStartLog.trim())capturePvpFrame(leftStartLog,turn,"left","");
    if(rightStartLog.trim())capturePvpFrame(rightStartLog,turn,"right","");
    const roundFirst=turn===1?firstSide:(Math.random()<0.5?"left":"right"),order=[roundFirst,otherSide(roundFirst)],queues={left:livingSide("left").slice(),right:livingSide("right").slice()},blocked={left:getPvpSideTurnBlock("left"),right:getPvpSideTurnBlock("right")};
    order.forEach(side=>{if(blocked[side]){logText+=blocked[side];capturePvpFrame(blocked[side],turn,side,"");queues[side]=[];}});
    let battleEnded=false;
    while((queues.left.length||queues.right.length)&&!battleEnded){
      let acted=false;
      for(const side of order){
        let attacker=null;
        while(queues[side].length&&!attacker){const candidate=queues[side].shift();if(candidate?.combat?.hp>0&&!pvpState(candidate).gone)attacker=candidate;}
        if(!attacker)continue;
        acted=true;logText+=sideAttack(side,attacker);
        if(!pvpAlive(teamOf(side))||!pvpAlive(teamOf(otherSide(side)))){battleEnded=true;break;}
      }
      if(!acted)break;
    }
    if(!battleEnded){
      order.forEach(side=>{const sideFinishLog=finishPvpSideActions(side);if(sideFinishLog){logText+=sideFinishLog;capturePvpFrame(sideFinishLog,turn,side,"");}});
    }
    const finishLogStart=logText.length;
    finishPvpTurn();
    const finishLog=logText.slice(finishLogStart);
    if(finishLog.trim())capturePvpFrame(finishLog,turn,"","");
    logText += "━━━━━━━━━━━━━━\n\n";
    turn++;
  }

  const leftWin = !!pvpAlive(left) && !pvpAlive(right);
  const rightWin = !!pvpAlive(right) && !pvpAlive(left);
  let winner = "무승부";
  if(leftWin) winner = pvpDisplayName(leftName,leftTitle);
  if(rightWin) winner = pvpDisplayName(rightName,rightTitle);

  const summary =
    "대전 결과\n\n" +
    "승자 : " + winner + "\n" +
    "전투 방식 : 다중 전투\n" +
    "총 턴 : " + Math.min(Math.max(0,turn-1),200) + "\n" +
    pvpDisplayName(leftName,leftTitle) + " 피해량 : " + state.left.damage.toLocaleString() + "\n" +
    pvpDisplayName(rightName,rightTitle) + " 피해량 : " + state.right.damage.toLocaleString();

  logText += "전투 종료\n\n" + summary;
  capturePvpFrame("전투 종료\n"+summary,Math.min(Math.max(0,turn-1),200),"","");
  clearBattleDisplayNumbers(allPvpFishes);
  activePvpFishLabeler = null;
  const winnerName=leftWin?leftName:rightWin?rightName:"";
  const fullLog=renderPvpPerspectiveLog(logText,viewerSide);
  return {summary,fullLog,neutralFullLog:logText,replay:{id:`pvp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,createdAtMillis:Date.now(),perspectiveName:currentUser||"",left:{name:leftName,title:leftTitle||"",profile:normalizeProfileCosmetics(leftProfile)},right:{name:rightName,title:rightTitle||"",profile:normalizeProfileCosmetics(rightProfile)},winnerName,totalTurns:Math.min(Math.max(0,turn-1),200),summary,fullLog,frames:replayFrames}};
}

function printPvpResultPreview(summary, fullLog){
  printPreview("대전 결과", summary, "대전 전체보기", fullLog);
}

function swapPvpPerspectiveLog(fullLog){
  return String(fullLog || "")
    .replaceAll("(아군)", "__PVP_ALLY__")
    .replaceAll("(적)", "(아군)")
    .replaceAll("__PVP_ALLY__", "(적)");
}

function renderPvpPerspectiveLog(fullLog,viewerSide){
  const mine=viewerSide==="right"?"right":"left",enemy=mine==="left"?"right":"left";
  return String(fullLog||"")
    .replace(/\[\[\s*PVP[\s_-]*SIDE\s*:\s*(left|right)\s*\]\]|\bPVP[\s_-]*SIDE\s*:?\s*(left|right)\b/gi,(_,wrappedSide,plainSide)=>String(wrappedSide||plainSide).toLowerCase()===mine?"(아군)":"(적)")
    .replace(/\[?\[?\s*PVP[\s_-]*SIDE\s*:?\s*(?:left|right)\s*\]?\]?/gi,"");
}

async function requestPvp(nickname){
  if(!currentUser) return print("로그인 후 사용 가능합니다.");

  nickname = cleanNickname(nickname);
  if(!nickname) return print("사용법 : 대전 닉네임");
  if(nickname === currentUser) return print("자기 자신에게는 대전을 신청할 수 없습니다.");

  try{
    const userSnap = await db.collection("users").doc(nickname).get();
    if(!userSnap.exists) return print("존재하지 않는 닉네임입니다.");

    const online = await isUserOnline(nickname);
    if(!online) return print("현재 접속 중인 유저가 아닙니다.");

    const myActive = await getMyActivePvp();
    if(myActive) return print("이미 진행 중인 대전이 있습니다.\n\n대전취소 로 취소할 수 있습니다.");

    const targetActiveSnap = await db.collection("pvpActive").doc(nickname).get();
    if(targetActiveSnap.exists){
      const targetActive = targetActiveSnap.data() || {};
      if(!["cancelled","finished","rejected"].includes(targetActive.status)){
        return print("상대가 대전중인 상태입니다.");
      }
    }

    const roomId = getPvpDocId(currentUser, nickname);
    const roomRef = db.collection("pvpRooms").doc(roomId);
    const oldRoomSnap = await roomRef.get();
    if(oldRoomSnap.exists && (oldRoomSnap.data() || {}).status === "requested"){
      return print("이미 대전 신청을 보냈습니다.");
    }

    await roomRef.set({
      roomId,
      from: currentUser,
      fromTitle: getCurrentTitle(),
      fromProfile: normalizeProfileCosmetics(profileCosmetics),
      to: nickname,
      toTitle: "",
      users: [currentUser, nickname],
      status: "requested",
      createdAtMillis: Date.now(),
      updatedAtMillis: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await setBothActivePvp(roomId, currentUser, nickname, {
      status:"requested",
      requester:currentUser,
      accepted:false,
      ready:false,
      prepIndexes:[],
      updatedAtMillis:Date.now()
    });

    await db.collection("serverAlerts").add({
      type:"pvpRequest",
      roomId,
      from:currentUser,
      fromTitle:getCurrentTitle(),
      to:nickname,
      createdAtMillis:Date.now(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    pvpPrepIndexes = [];
    saveGame();
    print(nickname + " 님에게 대전 신청을 보냈습니다.\n\n상대가 대전수락 하면 대전준비를 할 수 있습니다.");
  }catch(e){
    console.error(e);
    print("대전 신청 중 오류가 발생했습니다.");
  }
}

async function acceptLatestPvpRequest(){
  if(!currentUser) return print("로그인 후 사용 가능합니다.");
  try{
    const active = await getMyActivePvp();
    if(!active || active.status !== "requested" || active.requester === currentUser){
      return print("수락할 대전 신청이 없습니다.");
    }

    const roomRef = db.collection("pvpRooms").doc(active.roomId);
    const roomSnap = await roomRef.get();
    if(!roomSnap.exists) return print("대전 신청을 찾을 수 없습니다.");
    const room = roomSnap.data() || {};
    if(room.status !== "requested") return print("이미 처리된 대전 신청입니다.");

    await roomRef.set({
      status:"accepted",
      acceptedAtMillis:Date.now(),
      updatedAtMillis:Date.now(),
      toTitle:getCurrentTitle(),
      toProfile:normalizeProfileCosmetics(profileCosmetics),
      [currentUser + "_ready"]: false,
      [room.from + "_ready"]: false,
      [currentUser + "_team"]: [],
      [room.from + "_team"]: []
    }, {merge:true});

    await setBothActivePvp(active.roomId, room.from, room.to, {
      status:"accepted",
      requester:room.from,
      accepted:true,
      ready:false,
      prepIndexes:[],
      updatedAtMillis:Date.now()
    });

    await db.collection("serverAlerts").add({
      type:"pvpAccepted",
      roomId:active.roomId,
      from:currentUser,
      fromTitle:getCurrentTitle(),
      to:room.from,
      createdAtMillis:Date.now(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    pvpPrepIndexes = [];
    saveGame();
    if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
    print("대전을 수락했습니다.\n\n이제 대전준비 번호 로 물고기를 고르고 대전준비완료 를 입력하세요.");
  }catch(e){
    console.error(e);
    print("대전 수락 중 오류가 발생했습니다.");
  }
}

async function rejectLatestPvpRequest(){
  if(!currentUser) return print("로그인 후 사용 가능합니다.");
  try{
    const active = await getMyActivePvp();
    if(!active || active.status !== "requested" || active.requester === currentUser){
      return print("거절할 대전 신청이 없습니다.");
    }

    const roomRef = db.collection("pvpRooms").doc(active.roomId);
    const roomSnap = await roomRef.get();
    if(roomSnap.exists){
      const room = roomSnap.data() || {};
      await roomRef.set({status:"rejected", rejectedAtMillis:Date.now(), updatedAtMillis:Date.now()}, {merge:true});
      await clearBothActivePvp(room.from, room.to);
      await db.collection("serverAlerts").add({
        type:"pvpRejected",
        from:currentUser,
        fromTitle:getCurrentTitle(),
        to:room.from,
        createdAtMillis:Date.now(),
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      });
    }else{
      await getMyActivePvpRef().delete();
    }

    if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
    print("대전 신청을 거절했습니다.");
  }catch(e){
    console.error(e);
    print("대전 거절 중 오류가 발생했습니다.");
  }
}

async function cancelPvpRequest(){
  if(!currentUser) return print("로그인 후 사용 가능합니다.");
  try{
    const active = await getMyActivePvp();
    if(!active) return print("취소할 대전이 없습니다.");

    const roomRef = db.collection("pvpRooms").doc(active.roomId);
    const roomSnap = await roomRef.get();
    if(!roomSnap.exists){
      await getMyActivePvpRef().delete();
      return print("대전 상태를 정리했습니다.");
    }

    const room = roomSnap.data() || {};
    const opponent = currentUser === room.from ? room.to : room.from;

    await roomRef.set({status:"cancelled", cancelledBy:currentUser, cancelledAtMillis:Date.now(), updatedAtMillis:Date.now()}, {merge:true});
    await clearBothActivePvp(room.from, room.to);

    await db.collection("serverAlerts").add({
      type:"pvpCancelled",
      from:currentUser,
      fromTitle:getCurrentTitle(),
      to:opponent,
      createdAtMillis:Date.now(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    pvpPrepIndexes = [];
    saveGame();
    if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
    print("대전을 취소했습니다.");
  }catch(e){
    console.error(e);
    print("대전 취소 중 오류가 발생했습니다.");
  }
}

async function preparePvpFish(n){
  const active = await getMyActivePvp();
  if(!active || active.status !== "accepted"){
    return print("대전이 성립된 후에 준비할 수 있습니다.\\n\\n먼저 대전 닉네임 또는 대전수락 을 진행하세요.");
  }

  const displayNo = Number(n);
  if(!Number.isInteger(displayNo) || displayNo < 1){
    return print("사용법 : 대전준비 양동이번호");
  }

  const idx = getBucketIndexByDisplayNumber(displayNo);
  const f = bucket[idx];

  if(idx < 0 || !f) return print("존재하지 않는 양동이 번호입니다.");
  if(f.grade === "쓰레기") return print("쓰레기는 대전에 참가할 수 없습니다.");
  updateRecoveringFishHp(f);
  const combat=ensureCombatStats(f);
  if(combat.knockedOut||combat.status==="기절"||combat.hp<=0){
    const left=Math.max(0,Number(combat.stunUntil||0)-Date.now());
    return print("기절한 물고기는 대전에 참가할 수 없습니다."+(left>0?"\n\n남은 시간 : "+formatRemain(left):""));
  }

  if(pvpPrepIndexes.includes(idx)){
    return print("이미 대전 준비된 물고기입니다.\\n\\n양동이 " + displayNo + "번\\n" + color(lineFish(f), f.grade));
  }

  if(pvpPrepIndexes.length >= 3){
    return print("대전에는 최대 3마리까지만 출전할 수 있습니다.");
  }

  pvpPrepIndexes.push(idx);
  saveGame();

  await getMyActivePvpRef().set({
    prepIndexes:pvpPrepIndexes,
    ready:false,
    updatedAtMillis:Date.now()
  }, {merge:true});

  print("대전 준비 완료\n\n" + color(lineFish(f), f.grade));
}

async function unpreparePvpFish(n){
  const active = await getMyActivePvp();
  if(!active || active.status !== "accepted"){
    return print("대전이 성립된 후에 해제할 수 있습니다.");
  }

  const displayNo = Number(n);
  if(!Number.isInteger(displayNo) || displayNo < 1) return print("사용법 : 대전해제 양동이번호");

  const idx = getBucketIndexByDisplayNumber(displayNo);
  const pos = pvpPrepIndexes.indexOf(idx);

  if(idx < 0 || pos === -1) return print("해당 양동이 번호는 대전 준비 목록에 없습니다.");

  const f = bucket[idx];
  pvpPrepIndexes.splice(pos,1);
  saveGame();

  await getMyActivePvpRef().set({
    prepIndexes:pvpPrepIndexes,
    ready:false,
    updatedAtMillis:Date.now()
  }, {merge:true});

  print("대전 준비가 해제되었습니다.\n\n" + (f ? color(lineFish(f), f.grade) : ""));
}

async function showPvpPrepList(){
  const active = await getMyActivePvp();
  if(!active) return print("진행 중인 대전이 없습니다.");

  let s = "대전목록\\n\\n";
  s += "상대 : " + active.opponent + "\\n";
  s += "상태 : " + (active.status === "requested" ? "수락 대기중" : active.status === "accepted" ? "준비중" : active.status) + "\\n\\n";

  if(active.status !== "accepted"){
    s += "상대가 대전수락을 하면 준비할 수 있습니다.";
    return print(s);
  }

  if(pvpPrepIndexes.length === 0){
    s += "준비한 물고기가 없습니다.\\n\\n대전준비 양동이번호";
    return print(s);
  }

  s += "출전 물고기\\n\\n";
  pvpPrepIndexes.forEach((bucketIndex,i)=>{
    const f = bucket[bucketIndex];
    const displayNo = getDisplayNumberByBucketIndex(bucketIndex);
    if(f){
      s += (i+1) + ". 양동이 " + (displayNo > 0 ? displayNo : bucketIndex+1) + "번 " + color(lineFish(f), f.grade) + "\\n";
    }
  });
  s += "\\n대전준비완료 를 입력하면 준비 완료됩니다.";
  print(s.trim());
}

async function finishPvpReady(){
  const active = await getMyActivePvp();
  if(!active || active.status !== "accepted"){
    return print("대전이 성립된 후에 준비완료할 수 있습니다.");
  }

  if(pvpPrepIndexes.length === 0){
    return print("대전 준비 물고기가 없습니다.\n\n대전준비 양동이번호 를 먼저 입력하세요.");
  }

  const team = buildPvpTeamFromIndexes(pvpPrepIndexes, bucket, trainingLevels);
  if(team.length === 0) return print("대전에 참가할 수 있는 물고기가 없습니다.");

  try{
    const roomRef = db.collection("pvpRooms").doc(active.roomId);
    const roomSnap = await roomRef.get();
    if(!roomSnap.exists) return print("대전방을 찾을 수 없습니다.");

    const room = roomSnap.data() || {};
    const staleResolution = room.status === "resolving" && Number(room.resolvingAtMillis || 0) < Date.now() - 30000;
    if(room.status !== "accepted" && !staleResolution) return print("현재 준비할 수 없는 대전 상태입니다.");

    const myKey = currentUser + "_ready";
    const myTeamKey = currentUser + "_team";
    const opp = currentUser === room.from ? room.to : room.from;
    const oppKey = opp + "_ready";
    const oppTeamKey = opp + "_team";

    await roomRef.set({
      [myKey]: true,
      [myTeamKey]: team,
      updatedAtMillis:Date.now()
    }, {merge:true});

    await getMyActivePvpRef().set({
      ready:true,
      prepIndexes:pvpPrepIndexes,
      updatedAtMillis:Date.now()
    }, {merge:true});

    const afterSnap = await roomRef.get();
    const after = afterSnap.data() || {};
    const bothReady = !!after[myKey] && !!after[oppKey];

    await db.collection("serverAlerts").add({
      type:"pvpReady",
      from:currentUser,
      fromTitle:getCurrentTitle(),
      to:opp,
      createdAtMillis:Date.now(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    if(!bothReady){
      return print("대전 준비완료\n\n상대 대기중...");
    }

    let claimedRoom = null;
    await db.runTransaction(async tx => {
      claimedRoom = null;
      const latestSnap = await tx.get(roomRef);
      if(!latestSnap.exists) return;

      const latest = latestSnap.data() || {};
      const leftReady = !!latest[(latest.from || room.from) + "_ready"];
      const rightReady = !!latest[(latest.to || room.to) + "_ready"];
      const canClaim = latest.status === "accepted" ||
        (latest.status === "resolving" && Number(latest.resolvingAtMillis || 0) < Date.now() - 30000);
      if(!canClaim || !leftReady || !rightReady) return;

      claimedRoom = latest;
      tx.set(roomRef, {
        status:"resolving",
        resolvedBy:currentUser,
        resolvingAtMillis:Date.now(),
        updatedAtMillis:Date.now()
      }, {merge:true});
    });

    if(!claimedRoom){
      return print("상대 브라우저에서 대전 결과를 계산 중입니다.");
    }

    const leftName = claimedRoom.from;
    const rightName = claimedRoom.to;
    const result = simulatePvpBattle({
      leftName,
      leftTitle: claimedRoom.fromTitle || "",
      leftProfile:claimedRoom.fromProfile,
      leftTeam: claimedRoom[leftName + "_team"] || [],
      rightName,
      rightTitle: claimedRoom.toTitle || "",
      rightProfile:claimedRoom.toProfile,
      rightTeam: claimedRoom[rightName + "_team"] || []
    });
    const opponentSide=currentUser===leftName?"right":"left";
    const opponentLog = renderPvpPerspectiveLog(result.neutralFullLog||result.fullLog,opponentSide);
    const compactReplay=addBattleHistory("pvp",result.replay);

    await roomRef.set({
      status:"finished",
      finishedAtMillis:Date.now(),
      resultSummary:result.summary,
      resultLog:result.fullLog,
      resultLogByResolver:result.fullLog,
      resultLogByOpponent:opponentLog,
      replay:compactReplay,
      updatedAtMillis:Date.now()
    }, {merge:true});

    await clearBothActivePvp(room.from, room.to);

    pvpPrepIndexes = [];
    saveGame();

    await db.collection("serverAlerts").add({
      type:"pvpResult",
      to:opp,
      summary:result.summary,
      fullLog:opponentLog,
      replay:compactReplay,
      createdAtMillis:Date.now(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    if(typeof globalThis.openPvpBattleReplay==="function")globalThis.openPvpBattleReplay(compactReplay);
    else printPvpResultPreview(result.summary,result.fullLog);
  }catch(e){
    console.error(e);
    print("대전 준비완료 중 오류가 발생했습니다.");
  }
}



function showCommands(){
  if(!currentUser){
    return print(`명령어 목록

[계정]
회원가입
로그인`);
  }

  print(`명령어 목록

[낚시]
낚시

[정보]
양동이
양동이 닉네임
도감
물고기도감
코어도감
물고기특성
내정보
정보 번호
보스전
보스정보
보스정보 번호
보스목록
보스선택 번호
인벤토리
준비 번호
준비해제 번호
전투
전투 확인
나가기
지갑
지갑 닉네임
메세지 닉네임
연구소
연구소1 강화
연구소2 강화
훈련소
훈련소1 강화
훈련소2 강화
훈련소3 강화
업적
칭호
칭호 장착 번호
칭호 장착해제
시세
랭킹

[계정]
회원가입
로그인
로그아웃
탈퇴

[온라인]
송금 닉네임 금액
전송 닉네임 번호
대전 닉네임
대전준비 번호
대전해제 번호
대전목록
대전수락
대전거절

[강화]
강화
일괄강화

[정렬]
정렬 등급
정렬 공격력
정렬 체력

[잠금]
잠금 1
잠금해제 1

[판매]
판매 1
확인
일괄판매

[저장 파티]
파티프리셋
파티저장 보스
파티불러오기 보스
파티해제 보스
파티저장 pvp
파티불러오기 pvp
파티해제 pvp`);
}

function buildGameInfoText(){
  const chanceLines = getCurrentGradeChances()
    .map(x => x.name + " : " + x.chance.toFixed(["영원","공허"].includes(x.name) ? 2 : 1) + "%")
    .join("\n");

  return `내정보

[기본 정보]

현재 돈 : ${formatMoney(money)}
총 수익 : ${formatMoney(totalEarned)}
낚싯대 레벨 : ${rodLevel}/${MAX_ROD}
현재 강화 가능 레벨 : ${getCurrentPlayableMaxRod()}
낚시 횟수 : ${totalFishingCount.toLocaleString()}회
현재 칭호 : ${getCurrentTitle() || "없음"}
업적 달성률 : ${getCurrentCompletedAchievements().length}/${achievementList.length}

[강화]

강화 성공률 : ${rodLevel>=getCurrentPlayableMaxRod() ? (rodLevel>=MAX_ROD ? "최대 레벨" : "보스 처치 필요") : getUpgradeSuccessRate(rodLevel).toFixed(1)+"%"}
다음 강화 비용 : ${rodLevel>=getCurrentPlayableMaxRod() ? (rodLevel>=MAX_ROD ? "최대 레벨" : "보스를 처치하면 열림") : formatMoney(getUpgradeCost(rodLevel))}

[연구소]

낚시 기술 연구 : Lv.${getFishingResearchLevel()}/${MAX_RESEARCH}
효과 : 낚시시간 -${getFishingTimeReduction()}%
다음 비용 : ${getFishingResearchLevel()>=MAX_RESEARCH ? "최대 레벨" : formatMoney(getResearchCost(getFishingResearchLevel()))}

감정 연구 : Lv.${getAppraisalResearchLevel()}/${MAX_RESEARCH}
효과 : 판매가 +${getAppraisalBonus()}%
다음 비용 : ${getAppraisalResearchLevel()>=MAX_RESEARCH ? "최대 레벨" : formatMoney(getResearchCost(getAppraisalResearchLevel()))}

[훈련소]

공격 훈련 : Lv.${getTrainingLevel("attack")}/${MAX_TRAINING}
효과 : 공격력 +${getTrainingAttackBonus()}%
다음 비용 : ${getTrainingLevel("attack")>=MAX_TRAINING ? "최대 레벨" : formatMoney(getTrainingCost(getTrainingLevel("attack")))}

체력 훈련 : Lv.${getTrainingLevel("hp")}/${MAX_TRAINING}
효과 : 체력 +${getTrainingHpBonus()}%
다음 비용 : ${getTrainingLevel("hp")>=MAX_TRAINING ? "최대 레벨" : formatMoney(getTrainingCost(getTrainingLevel("hp")))}

치명타 피해 훈련 : Lv.${getTrainingLevel("critDamage")}/${MAX_TRAINING}
효과 : 치명타 피해 +${getTrainingCritDamageBonus()}%
다음 비용 : ${getTrainingLevel("critDamage")>=MAX_TRAINING ? "최대 레벨" : formatMoney(getTrainingCost(getTrainingLevel("critDamage")))}

[현재 등장 확률]

${chanceLines}

[도주 확률]

일반~신화 : ${getEscapeChance().toFixed(1)}%
쓰레기/초월/영원/공허 : 0%

[시세]

전설~영원 물고기 중 10종
10분마다 갱신
+보너스만 적용`;
}

function showGameInfo(){
  if(typeof globalThis.openFishingLifeMyInfo==="function")return globalThis.openFishingLifeMyInfo();
  print("내정보 화면을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
}

function finishOnlineTransferState(nextState,nextRevision,context={}){
  const account=String(context.account||currentUser||"");
  if(!account||currentUser!==account)return false;
  const transferSaveSeq=Math.max(0,Number(context.saveSeq??localSaveSeq));
  const baseState=cloneCloudState(context.baseState||nextState)||{};
  const concurrentChanges=localSaveSeq>transferSaveSeq;
  const finalState=concurrentChanges?mergeCloudGameStates(getGameState(),nextState,baseState):cloneCloudState(nextState);
  const removedFishIds=new Set((context.removedFishIds||[]).map(String).filter(Boolean));
  if(removedFishIds.size){
    finalState.bucket=(Array.isArray(finalState.bucket)?finalState.bucket:[]).filter(fish=>!removedFishIds.has(String(fish?.id||"")));
    const presets=normalizePartyPresets(finalState.partyPresets);
    presets.boss=presets.boss.filter(id=>!removedFishIds.has(String(id)));
    presets.pvp=presets.pvp.filter(id=>!removedFishIds.has(String(id)));
    finalState.partyPresets=presets;
    if(removedFishIds.has(String(finalState.fusionMainFishId||"")))finalState.fusionMainFishId="";
    if(finalState.fusionMainFishIds&&typeof finalState.fusionMainFishIds==="object")Object.keys(finalState.fusionMainFishIds).forEach(key=>{if(removedFishIds.has(String(finalState.fusionMainFishIds[key]||"")))delete finalState.fusionMainFishIds[key];});
    finalState.aquariumFishIds=normalizeAquariumFishIds(finalState.aquariumFishIds).filter(id=>!removedFishIds.has(String(id)));
  }
  applyGameState(finalState);
  cloudRevision=Number(nextRevision||cloudRevision);
  cloudSyncedSeq=Math.max(cloudSyncedSeq,transferSaveSeq);
  lastCloudSyncedState=cloneCloudState(nextState);
  persistCloudSyncBase(account,nextState,cloudRevision);
  if(concurrentChanges)markPersistentCloudDirty(account);
  else clearPersistentCloudDirty(account);
  bossPrepIndexes=[];
  if(typeof shouldProtectEmergencyOriginalLocalSave!=="function"||!shouldProtectEmergencyOriginalLocalSave())persistLocalGameSnapshot(getGameState());
  updateWallet();
  setCloudSyncStatus(concurrentChanges?"saving":"saved",concurrentChanges?"전송 중 생긴 새 변경 내용을 이어서 저장합니다.":"전송 결과까지 클라우드에 저장했습니다.");
  return true;
}

function transferFailure(message){
  print(message);
  return {ok:false,message};
}

async function sendMoney(targetNickname, amount){
  if(isOnlineActionRunning)return transferFailure("처리 중입니다. 잠시만 기다려주세요.");
  if(!currentUser)return transferFailure("로그인 후 사용 가능합니다.");
  targetNickname=cleanNickname(targetNickname);
  amount=Number(amount);
  if(!targetNickname||!Number.isSafeInteger(amount)||amount<=0)return transferFailure("송금 금액은 1 이상의 안전한 정수로 입력해주세요.");
  if(targetNickname===currentUser)return transferFailure("자기 자신에게는 송금할 수 없습니다.");
  isOnlineActionRunning=true;
  let committed=null;
  try{
    if(!(await checkGameVersion()))throw new Error("UPDATE_REQUIRED");
    await saveCloudData();
    if(hasPendingLocalCloudChanges())throw new Error("SYNC_REQUIRED");
    const sessionHash=await getCurrentSessionHash();
    if(!sessionHash)throw new Error("SESSION_INVALID");
    const senderName=currentUser,senderTitle=getCurrentTitle();
    const transferContext={account:senderName,saveSeq:localSaveSeq,baseState:cloneCloudState(getGameState())};
    const myRef=db.collection("users").doc(senderName),targetRef=db.collection("users").doc(targetNickname);
    await queueProtectedCloudAction(()=>db.runTransaction(async tx=>{
      const mySnap=await tx.get(myRef),targetSnap=await tx.get(targetRef);
      if(!mySnap.exists)throw new Error("MY_ACCOUNT_NOT_FOUND");
      if(!targetSnap.exists)throw new Error("TARGET_NOT_FOUND");
      const myData=mySnap.data()||{},targetData=targetSnap.data()||{};
      if(!isSessionHashValid(myData,sessionHash))throw new Error("SESSION_INVALID");
      const myState=cloneCloudState(transferContext.baseState)||{},targetState={...(targetData.gameState||{})};
      const currentMoney=normalizeMoney(myData.money??myState.money??0);
      if(currentMoney<amount)throw new Error("NOT_ENOUGH_MONEY");
      const senderMoneyAfter=normalizeMoney(currentMoney-amount),targetMoneyAfter=normalizeMoney((targetData.money??targetState.money??0)+amount);
      const targetNotifications=(Array.isArray(targetState.notifications)?targetState.notifications:[]).slice(-49);
      targetNotifications.push(`📢 알림\n\n${formatUserName(senderName,senderTitle)} 님이 ${amount.toLocaleString()}원을 송금했습니다.`);
      const targetMessages=(Array.isArray(targetState.messages)?targetState.messages:[]).slice(-99);
      targetMessages.push({id:`money_${Date.now()}_${Math.random().toString(36).slice(2)}`,type:"money",read:false,from:senderName,fromTitle:senderTitle,amount,createdAtMillis:Date.now()});
      const myRevision=Number(myData.cloudRevision||0)+1,targetRevision=Number(targetData.cloudRevision||0)+1;
      const nextMyState={...myState,money:senderMoneyAfter};
      const myWrite=txSetProtectedUser(tx,myRef,myData,{money:senderMoneyAfter,cloudRevision:myRevision,gameState:nextMyState},"money_transfer_send",{forceBackup:true,fullStateIncludesSplitData:true,previousState:transferContext.baseState});
      txSetProtectedUser(tx,targetRef,targetData,{money:targetMoneyAfter,cloudRevision:targetRevision,gameState:{...targetState,money:targetMoneyAfter,notifications:targetNotifications,messages:targetMessages}},"money_transfer_receive",{forceBackup:true});
      committed={state:myWrite.fullGameState||nextMyState,revision:myWrite.cloudRevision};
    }));
    if(!committed)throw new Error("TRANSFER_NOT_COMMITTED");
    const appliedLocally=finishOnlineTransferState(committed.state,committed.revision,transferContext);
    db.collection("serverAlerts").add({type:"moneyTransfer",from:senderName,fromTitle:senderTitle,to:targetNickname,amount,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtMillis:Date.now()}).catch(console.error);
    const message=`${targetNickname} 님에게 ${amount.toLocaleString()}원을 송금하였습니다.`;
    if(appliedLocally)print(message);
    return {ok:true,targetNickname,amount,message};
  }catch(e){
    console.error(e);
    if(e.message==="TARGET_NOT_FOUND")return transferFailure("존재하지 않는 닉네임입니다.");
    if(e.message==="NOT_ENOUGH_MONEY")return transferFailure("돈이 부족합니다.");
    if(e.message==="MY_ACCOUNT_NOT_FOUND")return transferFailure("현재 계정을 찾을 수 없습니다. 다시 로그인해주세요.");
    if(e.message==="SYNC_REQUIRED")return transferFailure("최신 기록을 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.");
    if(e.message==="PROGRESS_REGRESSION_BLOCKED")return transferFailure("진행도가 낮아지는 계정 저장을 차단했습니다. 관리자 확인이 필요합니다.");
    if(e.message==="USER_STATE_TOO_LARGE")return transferFailure("저장할 게임 기록이 너무 많아 송금을 완료하지 못했습니다.");
    if(await handleOnlineActionWriteError(e,currentUser,getGameState(),lastCloudSyncedState))return transferFailure(e.message==="UPDATE_REQUIRED"?"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.":"상대가 이전 버전을 사용 중이어서 송금을 완료하지 못했습니다.");
    return transferFailure("송금 중 오류가 발생했습니다.");
  }finally{isOnlineActionRunning=false;}
}

async function sendFish(targetNickname,displayNumber){
  if(isOnlineActionRunning)return transferFailure("처리 중입니다. 잠시만 기다려주세요.");
  if(!currentUser)return transferFailure("로그인 후 사용 가능합니다.");
  targetNickname=cleanNickname(targetNickname);
  displayNumber=Number(displayNumber);
  if(!targetNickname||!Number.isInteger(displayNumber)||displayNumber<=0)return transferFailure("받는 사람과 전송할 물고기를 선택해주세요.");
  if(targetNickname===currentUser)return transferFailure("자기 자신에게는 전송할 수 없습니다.");
  isOnlineActionRunning=true;
  let committed=null,transferredFish=null;
  try{
    if(!(await checkGameVersion()))throw new Error("UPDATE_REQUIRED");
    await saveCloudData();
    if(hasPendingLocalCloudChanges())throw new Error("SYNC_REQUIRED");
    const sessionHash=await getCurrentSessionHash();
    if(!sessionHash)throw new Error("SESSION_INVALID");
    const senderName=currentUser,senderTitle=getCurrentTitle();
    const transferContext={account:senderName,saveSeq:localSaveSeq,baseState:cloneCloudState(getGameState())};
    const myRef=db.collection("users").doc(senderName),targetRef=db.collection("users").doc(targetNickname);
    const [myCloudSnap,targetCloudSnap]=await Promise.all([myRef.get(),targetRef.get()]);
    if(!myCloudSnap.exists)throw new Error("MY_ACCOUNT_NOT_FOUND");
    if(!targetCloudSnap.exists)throw new Error("TARGET_NOT_FOUND");
    const myDataAtRead=myCloudSnap.data()||{},targetDataAtRead=targetCloudSnap.data()||{};
    const myRevisionAtRead=Number(myDataAtRead.cloudRevision||0),targetRevisionAtRead=Number(targetDataAtRead.cloudRevision||0);
    const [myFullState,targetFullState]=await Promise.all([loadSplitGameState(senderName,myDataAtRead),loadSplitGameState(targetNickname,targetDataAtRead)]);
    await queueProtectedCloudAction(()=>db.runTransaction(async tx=>{
      const mySnap=await tx.get(myRef),targetSnap=await tx.get(targetRef);
      if(!mySnap.exists)throw new Error("MY_ACCOUNT_NOT_FOUND");
      if(!targetSnap.exists)throw new Error("TARGET_NOT_FOUND");
      const myData=mySnap.data()||{},targetData=targetSnap.data()||{};
      if(!isSessionHashValid(myData,sessionHash))throw new Error("SESSION_INVALID");
      if(Number(myData.cloudRevision||0)!==myRevisionAtRead||Number(targetData.cloudRevision||0)!==targetRevisionAtRead)throw new Error("TRANSFER_RETRY");
      const myState=cloneCloudState(myFullState)||{},targetState=cloneCloudState(targetFullState)||{};
      const myBucket=Array.isArray(myState.bucket)?[...myState.bucket]:[],targetBucket=Array.isArray(targetState.bucket)?[...targetState.bucket]:[];
      const currentList=sortBucketEntries(myBucket,bucketSortOrder),displayItem=currentList[displayNumber-1];
      if(!displayItem||!myBucket[displayItem.originalIndex])throw new Error("FISH_NOT_FOUND");
      const sourceFish=myBucket[displayItem.originalIndex];
      if(sourceFish.locked)throw new Error("FISH_LOCKED");
      if(normalizeAquariumFishIds(myState.aquariumFishIds).includes(String(sourceFish.id||"")))throw new Error("FISH_IN_AQUARIUM");
      const mainIds=new Set([String(myState.fusionMainFishId||""),...Object.values(myState.fusionMainFishIds&&typeof myState.fusionMainFishIds==="object"?myState.fusionMainFishIds:{}).map(String)]);
      if(mainIds.has(String(sourceFish.id||"")))throw new Error("FISH_IS_MAIN");
      myBucket.splice(displayItem.originalIndex,1);
      const targetIds=new Set(targetBucket.map(f=>String(f?.id||""))),newId=targetIds.has(String(sourceFish.id||""))?makeFishId():String(sourceFish.id||makeFishId());
      const movedFish={...sourceFish,id:newId,locked:false,isNewCatch:false,time:`${new Date().toLocaleString()} · ${senderName}에게 받은 선물`,transferredFrom:senderName,transferredAtMillis:Date.now()};
      transferredFish=movedFish;
      transferContext.removedFishIds=[String(sourceFish.id||"")];
      targetBucket.push(movedFish);
      const myPresets=normalizePartyPresets(myState.partyPresets);
      myPresets.boss=myPresets.boss.filter(id=>String(id)!==String(sourceFish.id));
      myPresets.pvp=myPresets.pvp.filter(id=>String(id)!==String(sourceFish.id));
      const targetNotifications=(Array.isArray(targetState.notifications)?targetState.notifications:[]).slice(-49);
      targetNotifications.push(`📢 알림\n\n${formatUserName(senderName,senderTitle)} 님이 ${lineFish(movedFish)}${objParticle(movedFish.name)} 전송했습니다.`);
      const targetMessages=(Array.isArray(targetState.messages)?targetState.messages:[]).slice(-99);
      targetMessages.push({id:`fish_${Date.now()}_${Math.random().toString(36).slice(2)}`,type:"fish",read:false,from:senderName,fromTitle:senderTitle,fishNames:[movedFish.name],fishGrades:[movedFish.grade],count:1,createdAtMillis:Date.now()});
      const nextMyState={...myState,bucket:myBucket,pvpPrepIndexes:[],partyPresets:myPresets};
      const myRevision=Number(myData.cloudRevision||0)+1,targetRevision=Number(targetData.cloudRevision||0)+1;
      const myWrite=txSetProtectedUser(tx,myRef,myData,{cloudRevision:myRevision,gameState:nextMyState},"fish_transfer_send",{forceBackup:true,fullStateIncludesSplitData:true,previousState:myFullState});
      txSetProtectedUser(tx,targetRef,targetData,{cloudRevision:targetRevision,gameState:{...targetState,bucket:targetBucket,notifications:targetNotifications,messages:targetMessages}},"fish_transfer_receive",{forceBackup:true,fullStateIncludesSplitData:true,previousState:targetFullState});
      committed={state:myWrite.fullGameState||nextMyState,revision:myWrite.cloudRevision};
    }));
    if(!committed||!transferredFish)throw new Error("TRANSFER_NOT_COMMITTED");
    const appliedLocally=finishOnlineTransferState(committed.state,committed.revision,transferContext);
    db.collection("serverAlerts").add({type:"fishTransfer",from:senderName,fromTitle:senderTitle,to:targetNickname,fishName:transferredFish.name,fishGrade:transferredFish.grade,fishSize:transferredFish.size,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtMillis:Date.now()}).catch(console.error);
    const message=`${targetNickname} 님에게 ${lineFish(transferredFish)}${objParticle(transferredFish.name)} 전송하였습니다.`;
    if(appliedLocally)print(message);
    return {ok:true,targetNickname,fish:transferredFish,message};
  }catch(e){
    console.error(e);
    if(e.message==="TARGET_NOT_FOUND")return transferFailure("존재하지 않는 닉네임입니다.");
    if(e.message==="FISH_NOT_FOUND")return transferFailure("존재하지 않는 번호입니다.");
    if(e.message==="FISH_LOCKED")return transferFailure("잠금된 물고기는 전송할 수 없습니다.");
    if(e.message==="FISH_IN_AQUARIUM")return transferFailure("수족관에 전시 중인 물고기는 전시 해제 후 전송할 수 있습니다.");
    if(e.message==="FISH_IS_MAIN")return transferFailure("합성 본체는 해제한 뒤 전송할 수 있습니다.");
    if(e.message==="TRANSFER_RETRY")return transferFailure("계정 기록이 방금 변경되었습니다. 다시 시도해주세요.");
    if(e.message==="MY_ACCOUNT_NOT_FOUND")return transferFailure("현재 계정을 찾을 수 없습니다. 다시 로그인해주세요.");
    if(e.message==="SYNC_REQUIRED")return transferFailure("최신 기록을 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.");
    if(e.message==="PROGRESS_REGRESSION_BLOCKED")return transferFailure("진행도가 낮아지는 계정 저장을 차단했습니다. 관리자 확인이 필요합니다.");
    if(e.message==="USER_STATE_TOO_LARGE")return transferFailure("저장할 게임 기록이 너무 많아 물고기를 보내지 못했습니다.");
    if(await handleOnlineActionWriteError(e,currentUser,getGameState(),lastCloudSyncedState))return transferFailure(e.message==="UPDATE_REQUIRED"?"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.":"상대가 이전 버전을 사용 중이어서 물고기를 보내지 못했습니다.");
    return transferFailure("전송 중 오류가 발생했습니다.");
  }finally{isOnlineActionRunning=false;}
}

async function sendFishBatch(targetNickname,fishIds){
  if(isOnlineActionRunning)return transferFailure("처리 중입니다. 잠시만 기다려주세요.");
  if(!currentUser)return transferFailure("로그인 후 사용 가능합니다.");
  targetNickname=cleanNickname(targetNickname);fishIds=[...new Set((fishIds||[]).map(String).filter(Boolean))];
  if(!targetNickname||!fishIds.length)return transferFailure("받는 사람과 전송할 물고기를 선택해주세요.");
  if(targetNickname===currentUser)return transferFailure("자기 자신에게는 전송할 수 없습니다.");
  isOnlineActionRunning=true;let committed=null,moved=[];
  try{
    if(!(await checkGameVersion()))throw new Error("UPDATE_REQUIRED");
    await saveCloudData();if(hasPendingLocalCloudChanges())throw new Error("SYNC_REQUIRED");
    const sessionHash=await getCurrentSessionHash();if(!sessionHash)throw new Error("SESSION_INVALID");
    const senderName=currentUser,senderTitle=getCurrentTitle(),myRef=db.collection("users").doc(senderName),targetRef=db.collection("users").doc(targetNickname);
    const transferContext={account:senderName,saveSeq:localSaveSeq,baseState:cloneCloudState(getGameState())};
    const [myCloudSnap,targetCloudSnap]=await Promise.all([myRef.get(),targetRef.get()]);if(!myCloudSnap.exists)throw new Error("MY_ACCOUNT_NOT_FOUND");if(!targetCloudSnap.exists)throw new Error("TARGET_NOT_FOUND");
    const myDataAtRead=myCloudSnap.data()||{},targetDataAtRead=targetCloudSnap.data()||{},myRevisionAtRead=Number(myDataAtRead.cloudRevision||0),targetRevisionAtRead=Number(targetDataAtRead.cloudRevision||0);
    const [myFullState,targetFullState]=await Promise.all([loadSplitGameState(senderName,myDataAtRead),loadSplitGameState(targetNickname,targetDataAtRead)]);
    await queueProtectedCloudAction(()=>db.runTransaction(async tx=>{
      const mySnap=await tx.get(myRef),targetSnap=await tx.get(targetRef);if(!mySnap.exists)throw new Error("MY_ACCOUNT_NOT_FOUND");if(!targetSnap.exists)throw new Error("TARGET_NOT_FOUND");
      const myData=mySnap.data()||{},targetData=targetSnap.data()||{};if(!isSessionHashValid(myData,sessionHash))throw new Error("SESSION_INVALID");
      if(Number(myData.cloudRevision||0)!==myRevisionAtRead||Number(targetData.cloudRevision||0)!==targetRevisionAtRead)throw new Error("TRANSFER_RETRY");
      const myState=cloneCloudState(myFullState)||{},targetState=cloneCloudState(targetFullState)||{},myBucket=Array.isArray(myState.bucket)?[...myState.bucket]:[],targetBucket=Array.isArray(targetState.bucket)?[...targetState.bucket]:[];
      const selected=myBucket.filter(f=>f&&fishIds.includes(String(f.id||"")));if(selected.length!==fishIds.length)throw new Error("FISH_NOT_FOUND");
      transferContext.removedFishIds=selected.map(f=>String(f.id||""));
      const mainIds=new Set([String(myState.fusionMainFishId||""),...Object.values(myState.fusionMainFishIds&&typeof myState.fusionMainFishIds==="object"?myState.fusionMainFishIds:{}).map(String)]);
      const aquariumIds=new Set(normalizeAquariumFishIds(myState.aquariumFishIds));
      if(selected.some(f=>f.locked))throw new Error("FISH_LOCKED");if(selected.some(f=>aquariumIds.has(String(f.id||""))))throw new Error("FISH_IN_AQUARIUM");if(selected.some(f=>mainIds.has(String(f.id||""))))throw new Error("FISH_IS_MAIN");
      const selectedIds=new Set(selected.map(f=>String(f.id||""))),targetIds=new Set(targetBucket.map(f=>String(f?.id||"")));moved=selected.map(source=>{let id=String(source.id||makeFishId());if(targetIds.has(id))id=makeFishId();targetIds.add(id);return {...source,id,locked:false,isNewCatch:false,time:`${new Date().toLocaleString()} · ${senderName}에게 받은 선물`,transferredFrom:senderName,transferredAtMillis:Date.now()};});
      const nextBucket=myBucket.filter(f=>!selectedIds.has(String(f?.id||"")));targetBucket.push(...moved);
      const myPresets=normalizePartyPresets(myState.partyPresets);myPresets.boss=myPresets.boss.filter(id=>!selectedIds.has(String(id)));myPresets.pvp=myPresets.pvp.filter(id=>!selectedIds.has(String(id)));
      const targetNotifications=(Array.isArray(targetState.notifications)?targetState.notifications:[]).slice(-49);targetNotifications.push(`📢 알림\n\n${formatUserName(senderName,senderTitle)} 님이 물고기 ${moved.length}마리를 전송했습니다.`);
      const targetMessages=(Array.isArray(targetState.messages)?targetState.messages:[]).slice(-99);targetMessages.push({id:`fish_batch_${Date.now()}_${Math.random().toString(36).slice(2)}`,type:"fish",read:false,from:senderName,fromTitle:senderTitle,fishNames:moved.map(f=>f.name),fishGrades:moved.map(f=>f.grade),count:moved.length,createdAtMillis:Date.now()});
      const nextMyState={...myState,bucket:nextBucket,pvpPrepIndexes:[],partyPresets:myPresets},myRevision=Number(myData.cloudRevision||0)+1,targetRevision=Number(targetData.cloudRevision||0)+1;
      const myWrite=txSetProtectedUser(tx,myRef,myData,{cloudRevision:myRevision,gameState:nextMyState},"fish_batch_transfer_send",{forceBackup:true,fullStateIncludesSplitData:true,previousState:myFullState});
      txSetProtectedUser(tx,targetRef,targetData,{cloudRevision:targetRevision,gameState:{...targetState,bucket:targetBucket,notifications:targetNotifications,messages:targetMessages}},"fish_batch_transfer_receive",{forceBackup:true,fullStateIncludesSplitData:true,previousState:targetFullState});committed={state:myWrite.fullGameState||nextMyState,revision:myWrite.cloudRevision};
    }));
    if(!committed||!moved.length)throw new Error("TRANSFER_NOT_COMMITTED");finishOnlineTransferState(committed.state,committed.revision,transferContext);
    db.collection("serverAlerts").add({type:"fishTransfer",from:senderName,fromTitle:senderTitle,to:targetNickname,fishName:moved[0].name,fishGrade:moved[0].grade,fishSize:moved[0].size,fishCount:moved.length,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdAtMillis:Date.now()}).catch(console.error);
    return {ok:true,targetNickname,fishes:moved,count:moved.length,message:`${targetNickname} 님에게 물고기 ${moved.length}마리를 전송했습니다.`};
  }catch(e){console.error(e);if(e.message==="TARGET_NOT_FOUND")return transferFailure("존재하지 않는 닉네임입니다.");if(e.message==="FISH_NOT_FOUND")return transferFailure("선택한 물고기를 찾을 수 없습니다.");if(e.message==="FISH_LOCKED")return transferFailure("잠금된 물고기는 전송할 수 없습니다.");if(e.message==="FISH_IN_AQUARIUM")return transferFailure("수족관에 전시 중인 물고기는 전시 해제 후 전송할 수 있습니다.");if(e.message==="FISH_IS_MAIN")return transferFailure("합성 본체는 해제한 뒤 전송할 수 있습니다.");if(e.message==="TRANSFER_RETRY")return transferFailure("계정 기록이 방금 변경되었습니다. 다시 시도해주세요.");if(e.message==="SYNC_REQUIRED")return transferFailure("최신 기록을 저장하지 못했습니다. 인터넷 연결을 확인해주세요.");if(e.message==="PROGRESS_REGRESSION_BLOCKED")return transferFailure("이 기기의 기록이 클라우드 기록보다 오래되어 전송을 중단했습니다.");if(e.message==="USER_STATE_TOO_LARGE")return transferFailure("저장할 게임 기록이 너무 많아 물고기를 보내지 못했습니다.");if(await handleOnlineActionWriteError(e,currentUser,getGameState(),lastCloudSyncedState))return transferFailure(e.message==="UPDATE_REQUIRED"?"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.":"상대가 이전 버전을 사용 중이어서 물고기를 보내지 못했습니다.");return transferFailure("물고기 전송 중 오류가 발생했습니다.");}
  finally{isOnlineActionRunning=false;}
}

async function showNewMessages(){
  if(!messages || messages.length === 0) return;
  const unread=messages.filter(message=>message&&message.read!==true).length;
  if(unread<=0)return;
  if(typeof globalThis.showFishingLifeInboxNotice==="function")globalThis.showFishingLifeInboxNotice(unread);
  else print("읽지 않은 소식이 "+unread+"개 있습니다.\n\n광장의 받은 소식에서 확인할 수 있습니다.");
}

async function sendMessage(targetNickname){
  if(isOnlineActionRunning) return print("처리 중입니다. 잠시만 기다려주세요.");
  if(!currentUser) return print("로그인 후 사용 가능합니다.");

  targetNickname = cleanNickname(targetNickname);
  if(!targetNickname) return print("사용법 : 메세지 닉네임");
  if(targetNickname === currentUser) return print("자기 자신에게는 메세지를 보낼 수 없습니다.");

  const text = safeMessageText(prompt("보낼 메세지를 입력하세요."));
  if(!text) return print("메세지 전송이 취소되었습니다.");
  if(text.length > 300) return print("메세지는 300자 이하로 입력해주세요.");

  isOnlineActionRunning = true;

  try{
    if(!(await checkGameVersion()))throw new Error("UPDATE_REQUIRED");
    const senderName=currentUser,senderTitle=getCurrentTitle();
    const targetRef = db.collection("users").doc(targetNickname);
    const targetSnap = await targetRef.get();

    if(!targetSnap.exists){
      isOnlineActionRunning = false;
      return print("존재하지 않는 닉네임입니다.");
    }

    const messageId = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const payload = {
      id: messageId,
      type:"message",
      read:false,
      from: senderName,
      fromTitle: senderTitle,
      text: text,
      createdAtMillis: Date.now()
    };

    await db.runTransaction(async (tx)=>{
      const snap = await tx.get(targetRef);
      if(!snap.exists) throw new Error("TARGET_NOT_FOUND");

      const data = snap.data();
      const state = data.gameState || {};
      const targetMessages = (Array.isArray(state.messages) ? state.messages : []).slice(-99);

      targetMessages.push(payload);

      txSetProtectedUser(tx,targetRef,data,{
        cloudRevision: Number(data.cloudRevision || 0) + 1,
        gameState: {
          ...state,
          messages: targetMessages
        }
      },"message_receive");
    });

    await db.collection("serverAlerts").add({
      type: "userMessage",
      from: senderName,
      fromTitle: senderTitle,
      to: targetNickname,
      text: text,
      messageId: messageId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAtMillis: payload.createdAtMillis
    });

    print(targetNickname + " 님에게 메시지를 보냈습니다.\n\n" + text);
  }catch(e){
    console.error(e);
    if(e.message==="USER_STATE_TOO_LARGE")return print("상대 계정의 저장할 기록이 너무 많아 메시지를 보내지 못했습니다.");
    if(await handleOnlineActionWriteError(e,currentUser,getGameState(),lastCloudSyncedState))return print(e.message==="UPDATE_REQUIRED"?"게임이 업데이트되었습니다. 페이지를 새로고침해주세요.":"상대가 이전 버전을 사용 중이어서 메시지를 보내지 못했습니다.");
    if(e.message === "TARGET_NOT_FOUND") print("존재하지 않는 닉네임입니다.");
    else print("메시지를 보내는 중 오류가 발생했습니다.");
  }finally{
    isOnlineActionRunning = false;
  }
}

function requireLoginForCommand(cmd){
  const allowed = ["명령어", "회원가입", "로그인"];

  if(allowed.includes(cmd)) return true;

  // 다른 사람 정보 조회/랭킹도 로그인 없이 막음
  return false;
}


