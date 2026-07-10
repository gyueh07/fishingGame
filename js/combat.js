function line(){
  return "────────────────────";
}

function bossColor(text,boss){
  return `<span style="color:${boss.color || '#e6edf3'}">${text}</span>`;
}

function hpBar(current,max,size=10){
  current = Math.max(0, Number(current || 0));
  max = Math.max(1, Number(max || 1));
  const ratio = Math.max(0, Math.min(1, current / max));
  const filled = Math.round(ratio * size);
  return "HP " + Math.floor(current).toLocaleString() + " / " + Math.floor(max).toLocaleString() + "\n" +
    "█".repeat(filled) + "░".repeat(size - filled) + " " + Math.floor(ratio * 100) + "%";
}

function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

function getSizeRatio(f){
  const range = sizeData[f.name];
  if(f.size === null || !Array.isArray(range)) return 0.5;
  const min = range[0], max = range[1];
  if(max <= min) return 0.5;
  return clamp((Number(f.size) - min) / (max - min), 0, 1);
}

function weightedRandomBySize(min,max,ratio){
  const roll = (Math.random() + Math.random() + ratio) / 3;
  return Math.floor(min + (max - min) * clamp(roll,0,1));
}

function randomInt(min,max){
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomDodgeBySize(f){
  if(["영원","공허"].includes(f.grade)) return Math.round((10 + Math.random() * 20) * 10) / 10;
  const ratio = getSizeRatio(f);
  const base = 20 - ratio * 18;
  const noise = (Math.random() * 6) - 3;
  return Math.round(clamp(base + noise, 1, 20) * 10) / 10;
}

function rollDodgeByStar(tier, ratio=0.5){
  let min = 1;
  let max = 10;

  if(tier === 1){
    min = 10;
    max = 15;
  } else if(tier === 2){
    min = 15;
    max = 25;
  } else if(tier === 3){
    min = 25;
    max = 45;
  }

  const value = min + (max - min) * clamp((Math.random() + Math.random() + ratio) / 3, 0, 1);
  return Math.round(value * 10) / 10;
}

function rollStarTier(){
  const r = Math.random() * 100;
  if(r < 2) return 3;
  if(r < 10) return 2;
  if(r < 30) return 1;
  return 0;
}

function starText(tier){
  if(tier === 3) return " ★★★";
  if(tier === 2) return " ★★";
  if(tier === 1) return " ★";
  return "";
}

function rollByStarRange(min,max,tier,ratio=0.5){
  if(tier === 0){
    return weightedRandomBySize(min, max, ratio);
  }

  // 별 단계의 범위가 절대 겹치지 않도록 이전 단계 최대값 다음부터 시작한다.
  const previousMultiplier = tier === 3 ? 7 : tier === 2 ? 3 : 1;
  const currentMultiplier = tier === 3 ? 20 : tier === 2 ? 7 : 3;
  const scaledMin = Math.floor(max * previousMultiplier) + 1;
  const scaledMax = Math.floor(max * currentMultiplier);

  return randomInt(scaledMin, scaledMax);
}
function rollCritRateByStar(tier){
  if(tier === 3) return Math.round((40 + Math.random() * 10) * 10) / 10;
  if(tier === 2) return Math.round((30 + Math.random() * 10) * 10) / 10;
  if(tier === 1) return Math.round((20 + Math.random() * 10) * 10) / 10;
  return Math.round((10 + Math.random() * 10) * 10) / 10;
}

function rollCritDamageByStar(tier){
  if(tier === 3) return randomInt(450, 500);
  if(tier === 2) return randomInt(350, 450);
  if(tier === 1) return randomInt(250, 350);
  return randomInt(150, 250);
}

function rerollCritStats(f){
  const c = ensureCombatStats(f);
  if(f.grade === "쓰레기") return c;

  if(!c.stars) c.stars = {attack:0,hp:0,dodge:0,critRate:0,critDamage:0};

  c.stars.critRate = rollStarTier();
  c.stars.critDamage = rollStarTier();
  c.critRate = rollCritRateByStar(c.stars.critRate);
  c.critDamage = rollCritDamageByStar(c.stars.critDamage);

  return c;
}


function makeCombatStats(f, fixedStars=null){
  if(!f || f.grade === "쓰레기"){
    return {attack:0, hp:0, maxHp:0, dodge:0, critRate:0, critDamage:0, status:"전투 불가", combatVersion:COMBAT_VERSION, stars:{attack:0,hp:0,dodge:0,critRate:0,critDamage:0}};
  }

  const atkRange = combatAttackRanges[f.grade] || [10,50];
  const hpRange = combatHpRanges[f.grade] || [50,200];
  const ratio = getSizeRatio(f);

  const stars = fixedStars ? {
    attack:clamp(Math.floor(Number(fixedStars.attack || 0)), 0, 3),
    hp:clamp(Math.floor(Number(fixedStars.hp || 0)), 0, 3),
    dodge:clamp(Math.floor(Number(fixedStars.dodge || 0)), 0, 3),
    critRate:clamp(Math.floor(Number(fixedStars.critRate || 0)), 0, 3),
    critDamage:clamp(Math.floor(Number(fixedStars.critDamage || 0)), 0, 3)
  } : {
    attack:rollStarTier(),
    hp:rollStarTier(),
    dodge:rollStarTier(),
    critRate:rollStarTier(),
    critDamage:rollStarTier()
  };

  const attack = rollByStarRange(atkRange[0], atkRange[1], stars.attack, ratio);
  const hp = rollByStarRange(hpRange[0], hpRange[1], stars.hp, 0.5);

  const dodge = rollDodgeByStar(stars.dodge, ratio);

  const critRate = rollCritRateByStar(stars.critRate);
  const critDamage = rollCritDamageByStar(stars.critDamage);

  return {
    attack:attack,
    hp:hp,
    maxHp:hp,
    dodge:dodge,
    critRate:critRate,
    critDamage:critDamage,
    _baseAttack:attack,
    _baseMaxHp:hp,
    _baseCritDamage:critDamage,
    status:"정상",
    combatVersion:COMBAT_VERSION,
    stars:stars
  };
}

function getStunMinutes(grade){
  return 10;
}

function formatRemain(ms){
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if(m <= 0) return s + "초";
  return m + "분 " + String(s).padStart(2, "0") + "초";
}

function hasMissingCombatHp(f){
  if(!f || f.grade === "쓰레기") return false;
  const c = ensureCombatStats(f);
  return c.hp > 0 && c.maxHp > 0 && c.hp < c.maxHp;
}

function markRecoveringIfDamaged(f){
  if(!hasMissingCombatHp(f)) return false;
  const c = ensureCombatStats(f);
  if(c.status === "회복 중" && c.stunUntil) return false;

  const now = Date.now();
  const maxHp = Math.max(1, Number(c.maxHp || 1));
  const hpRate = clamp(Number(c.hp || 0) / maxHp, 0, 1);
  const fullDuration = getStunMinutes(f.grade) * 60 * 1000;
  const duration = Math.max(1000, Math.ceil(fullDuration * (1 - hpRate)));

  c.status = "회복 중";
  c.recoveryStartAt = now;
  c.recoveryStartHp = Math.max(1, Math.floor(c.hp));
  c.stunUntil = now + duration;
  return true;
}

function updateRecoveringFishHp(f){
  const c = ensureCombatStats(f);
  let changed = false;

  if(c.status === "기절"){
    c.status = "회복 중";
    changed = true;
  }
  if(c.status !== "회복 중" && hasMissingCombatHp(f)){
    if(markRecoveringIfDamaged(f)) changed = true;
  }

  if(c.status !== "회복 중") return false;

  const now = Date.now();
  const maxHp = Math.max(1, c.maxHp || 1);

  if(c.hp >= maxHp){
    c.hp = maxHp;
    c.status = "정상";
    delete c.stunUntil;
    delete c.recoveryStartAt;
    delete c.recoveryStartHp;
    return true;
  }

  if(!c.stunUntil && c.hp > 0 && c.hp < maxHp){
    c.status = "정상";
    if(markRecoveringIfDamaged(f)) changed = true;
  }

  if(!c.stunUntil){
    c.status = "정상";
    c.hp = maxHp;
    delete c.recoveryStartAt;
    delete c.recoveryStartHp;
    return true;
  }

  const recoveryStartAt = Number(c.recoveryStartAt || (c.stunUntil - getStunMinutes(f.grade) * 60 * 1000));
  const recoveryStartHp = Number(c.recoveryStartHp || 0);
  const duration = Math.max(1, c.stunUntil - recoveryStartAt);
  const ratio = clamp((now - recoveryStartAt) / duration, 0, 1);

  if(ratio >= 1){
    c.status = "정상";
    c.hp = maxHp;
    delete c.stunUntil;
    delete c.recoveryStartAt;
    delete c.recoveryStartHp;
    return true;
  }

  const newHp = Math.max(1, Math.floor(recoveryStartHp + (maxHp - recoveryStartHp) * ratio));
  if(newHp !== c.hp){
    c.hp = Math.min(maxHp, newHp);
    return true;
  }

  return changed;
}

function recoverStunnedFish(){
  let changed = false;

  bucket.forEach(f => {
    if(updateRecoveringFishHp(f)) changed = true;
  });

  if(changed) saveGame();
}


function ensureCombatStats(f){
  if(!f.combat) f.combat = makeCombatStats(f);

  if(f.grade === "쓰레기"){
    f.combat.status = "전투 불가";
    f.combat.attack = 0;
    f.combat.hp = 0;
    f.combat.maxHp = 0;
    f.combat.dodge = 0;
    f.combat.critRate = 0;
    f.combat.critDamage = 0;
    f.combat.combatVersion = COMBAT_VERSION;
    f.combat.stars = {attack:0,hp:0,dodge:0,critRate:0,critDamage:0};
    return f.combat;
  }

  if(!f.combat.stars) f.combat.stars = {attack:0,hp:0,dodge:0,critRate:0,critDamage:0};
  if(!f.combat.maxHp) f.combat.maxHp = f.combat.hp || 1;
  if(f.combat.hp === undefined || f.combat.hp === null) f.combat.hp = f.combat.maxHp;
  if(f.combat.critRate === undefined || f.combat.critDamage === undefined){
    rerollCritStats(f);
  }
  if(!f.combat.status) f.combat.status = "정상";

  applyTrainingBonusesToCombat(f.combat);

  return f.combat;
}
function resetAllCombatStats(){
  let changed = false;

  bucket.forEach(f => {
    f.combat = makeCombatStats(f);
    changed = true;
  });

  if(changed) saveGame();
}

function migrateCombatStatsToCurrentVersion(){
  const targetVersion = COMBAT_VERSION;
  let changed = false;

  bucket.forEach(f => {
    if(!f) return;

    const currentVersion = Number((f.combat && f.combat.combatVersion) || 0);

    if(currentVersion < targetVersion){
      const existingStars = f.combat && f.combat.stars ? {...f.combat.stars} : null;
      f.combat = makeCombatStats(f, existingStars);
      f.combat.combatVersion = targetVersion;
      changed = true;
    }
  });

  if(changed) saveGame();
}


function getStatRange(grade, stat){
  if(stat === "attack") return combatAttackRanges[grade] || [0,1];
  if(stat === "hp") return combatHpRanges[grade] || [0,1];
  if(stat === "dodge") return [1,45];
  if(stat === "critRate") return [1,30];
  if(stat === "critDamage") return [150,300];
  return [0,1];
}

function statStars(value, grade, stat, combat=null){
  if(grade === "쓰레기") return "";
  if(combat && combat.stars) return starText(combat.stars[stat] || 0);
  return "";
}

function getCombatStatusText(f){
  const c = ensureCombatStats(f);
  updateRecoveringFishHp(f);

  if(c.status === "회복 중" && c.stunUntil){
    const left = c.stunUntil - Date.now();
    if(left > 0) return "회복 중 (" + formatRemain(left) + ")";
  }

  if(hasMissingCombatHp(f)) return "회복 중";

  return c.status && c.status !== "" ? c.status : "정상";
}


function buildFishDetailText(displayNumber){
  recoverStunnedFish();

  const idx = getBucketIndexByDisplayNumber(displayNumber);
  if(idx < 0 || !bucket[idx]) return "존재하지 않는 번호입니다.";
  const f = bucket[idx];
  const c = ensureCombatStats(f);
  saveGame();

  let s = color(lineFish(f), f.grade) + "\n\n";
  s += "크기\n" + (f.size === null ? "측정 불가" : formatSize(f.size) + "cm") + "\n\n";
  s += "판매가\n" + formatMoney(applyMarketPrice(f)) + "\n\n";

  if(f.grade === "쓰레기"){
    s += "전투\n쓰레기 등급은 전투에 참가할 수 없습니다.\n\n";
    s += "상태\n전투 불가";
    return s;
  }

  s += "공격력" + statStars(c.attack, f.grade, "attack", c) + "\n" + Number(c.attack).toLocaleString() + "\n\n";
  s += "체력" + statStars(c.maxHp, f.grade, "hp", c) + "\n" + Number(c.hp).toLocaleString() + " / " + Number(c.maxHp).toLocaleString() + "\n\n";
  s += "회피율" + statStars(c.dodge, f.grade, "dodge", c) + "\n" + Number(c.dodge).toFixed(1) + "%\n\n";
  s += "치명타 확률" + statStars(c.critRate, f.grade, "critRate", c) + "\n" + Number(c.critRate).toFixed(1) + "%\n\n";
  s += "치명타 피해" + statStars(c.critDamage, f.grade, "critDamage", c) + "\n" + Number(c.critDamage).toFixed(0) + "%\n\n";
  const trait = getFishTrait(f);
  if(trait) s += "고유 특성\n" + trait.name + "\n" + trait.desc + "\n\n";
  s += "상태\n" + getCombatStatusText(f);
  return s;
}

function showFishInfo(displayNumber){
  recoverStunnedFish();

  const idx = getBucketIndexByDisplayNumber(displayNumber);
  if(idx < 0 || !bucket[idx]) return print("존재하지 않는 번호입니다.");
  const f = bucket[idx];
  printPreview("정보 " + displayNumber, color(lineFish(f), f.grade), "상세정보 전체보기", buildFishDetailText(displayNumber));
}

function showFishTraits(){
  let s="물고기 고유 특성\n\n";
  ["신화","초월","영원","공허"].forEach(grade=>{
    s+=color("["+grade+"]",grade)+"\n\n";
    fishByGrade[grade].forEach(name=>{
      const trait=fishTraits[name];
      if(trait)s+=color(displayFishName(name),grade)+"\n"+trait.name+"\n"+trait.desc+"\n\n";
    });
  });
  printPreview("물고기 특성","신화 이상 물고기의 고유 패시브", "전체 특성 보기",s.trim());
}

function buildInventoryText(){
  const materials = bossProgress.materials || {};
  const entries = Object.entries(materials).filter(([name,count]) => count > 0);

  if(entries.length === 0) return "인벤토리가 비어있습니다.";

  let s = "인벤토리\n\n";
  s += "────┬────────────────────\n";

  entries.forEach(([name,count],i)=>{
    s += fullWidthNumber(i+1) + "│" + name + " x" + count.toLocaleString() + "\n";
    if(i !== entries.length - 1) s += "────┼────────────────────\n";
  });

  s += "────┴────────────────────";
  return s;
}

function showInventory(){
  const materials = bossProgress.materials || {};
  const count = Object.values(materials).filter(v => v > 0).length;

  if(count === 0) return print("인벤토리가 비어있습니다.");

  printPreview(
    "인벤토리",
    "보유 재료 : " + count + "종",
    "인벤토리 전체보기",
    buildInventoryText()
  );
}

function getBossById(id){
  return bossList.find(b => b.id === id) || bossList[0];
}

function isBossUnlocked(boss){
  const idx = bossList.findIndex(b => b.id === boss.id);
  if(idx <= 0) return true;
  const prev = bossList[idx - 1];
  return !!bossProgress.defeated[prev.id];
}

function getSelectedBossId(){
  const selected = getBossById(bossProgress.selectedBossId);

  if(bossProgress.selectedBossId && selected && isBossUnlocked(selected)){
    return selected.id;
  }

  return getCurrentBoss().id;
}

function getCurrentBoss(){
  const selected = getBossById(bossProgress.selectedBossId);

  if(bossProgress.selectedBossId && selected && isBossUnlocked(selected)){
    return selected;
  }

  for(const boss of bossList){
    if(isBossUnlocked(boss) && !bossProgress.defeated[boss.id]){
      bossProgress.selectedBossId = boss.id;
      if(!bossProgress.hp[boss.id]) bossProgress.hp[boss.id] = boss.hp;
      return boss;
    }
  }

  const first = bossList[0];
  bossProgress.selectedBossId = first.id;
  if(!bossProgress.hp[first.id]) bossProgress.hp[first.id] = first.hp;
  return first;
}

function selectBoss(n){
  const boss = bossList[Number(n)-1];

  if(!boss) return print("존재하지 않는 보스 번호입니다.");
  if(!isBossUnlocked(boss)) return print("아직 해금되지 않은 보스입니다.");

  bossProgress.selectedBossId = boss.id;
  if(!bossProgress.hp[boss.id]) bossProgress.hp[boss.id] = boss.hp;
  saveGame();

  print(bossColor(boss.name, boss) + "을 선택했습니다.");
}

function getBossHp(boss){
  if(!bossProgress.hp[boss.id]) bossProgress.hp[boss.id] = boss.hp;
  return Math.max(0, bossProgress.hp[boss.id]);
}

function getBossStatus(boss){
  if(!isBossUnlocked(boss)) return "잠김";
  const left = getBossCooldownLeft(boss.id);
  if(left > 0) return "쿨타임 " + formatRemain(left);
  return bossProgress.defeated[boss.id] ? "처치 완료 / 재도전 가능" : "도전 가능";
}

function addMaterial(name,count){
  bossProgress.materials[name] = (bossProgress.materials[name] || 0) + count;
}
function isBossFirstClear(boss){
  return !(bossProgress.defeated && bossProgress.defeated[boss.id]);
}

function getBossClearReward(boss){
  return isBossFirstClear(boss) ? (boss.reward || 0) : 0;
}


function buildBossBattleText(){
  const boss = getCurrentBoss();
  const hp = getBossHp(boss);
  let s = "보스전\n\n";
  s += line() + "\n\n";
  s += "현재 보스\n" + bossColor(boss.name, boss) + "\n\n";
  s += "등급\n" + boss.grade + "\n\n";
  s += "체력\n" + hpBar(hp, boss.hp) + "\n\n";
  const cooldownLeft = getBossCooldownLeft();
  s += "쿨타임\n" + (cooldownLeft > 0 ? formatRemain(cooldownLeft) : "도전 가능") + "\n\n";
  s += "준비된 물고기\n" + bossPrepIndexes.length + " / 5\n\n";
  if(bossPrepIndexes.length > 0){
    bossPrepIndexes.forEach((idx,i)=>{
      if(bucket[idx]) s += lineFish(bucket[idx]) + "\n";
    });
    s += "\n";
  }
  s += "드랍\n" + boss.drop + "\n\n";
  s += "명령어\n준비 번호\n준비해제 번호\n정보 번호\n전투\n보스정보\n보스정보 번호\n보스목록\n보스선택 번호\n인벤토리\n파티프리셋\n파티저장 보스\n파티불러오기 보스\n파티해제 보스\n나가기\n\n";
  s += line();
  return s;
}

function showBossBattle(){
  recoverStunnedFish();
  isBossMenu = true;
  print(buildBossBattleText());
}

function buildBossInfoText(boss = getCurrentBoss()){
  const hp = getBossHp(boss);
  let s = bossColor(boss.name, boss) + " [" + boss.grade + "]\n\n";
  s += line() + "\n\n";
  s += "설명\n" + boss.desc + "\n\n";
  s += line() + "\n\n";
  s += "체력\n" + hpBar(hp, boss.hp) + "\n\n";
  s += "공격력\n" + boss.attack.toLocaleString() + "\n\n";
  s += "상금\n" + formatMoney(boss.reward || 0) + "\n\n";
  s += "드랍\n" + boss.drop + "\n\n";
  s += line() + "\n\n";

  if(boss.id === "phoenix"){
    s += "패시브 - 불사\n사망 시 체력 50%로 1회 부활\n\n";
    s += "재의 낙인 (25%)\n공격력 1배\n화상 1중첩 부여\n\n";
    s += "윤회의 불꽃 (15%)\n전체 공격\n공격력 1.5배\n화상 1중첩 대상 추가 피해\n화상 2중첩 대상 대폭 추가 피해\n\n";
    } else if(boss.id === "bahamut"){
    s += "패시브 - 드래곤 스케일\n전투 중 가장 큰 피해 기록 저장\n기록보다 크거나 같은 피해를 받으면 50% 감소\n감소 적용 후 새 기록으로 갱신\n\n";
    s += "메가 플레어 (15%)\n공격력 3배\n다음 턴 참가 물고기 전체 행동 불가\n\n";
    s += "용왕의 포효 (25%)\n공격력 1.5배\n사용할 때마다 공격력 30,000 누적 증가\n\n";
    } else if(boss.id === "tiamat"){
    s += "패시브 - 태초의 바다\n매 턴 최대 체력의 2% 회복\n\n";
    s += "창세의 바다 (25%)\n공격력 2배\n\n";
    s += "괴수 탄생 (15%)\n새끼 용 3마리 소환\n\n";
    s += "새끼 용\nHP 100,000~300,000 랜덤\n공격력 10,000~30,000 랜덤\n\n";
    } else if(boss.id === "jormungandr"){
    s += "패시브 - 세계를 감은 자\n매 턴 공격력 5% 증가\n기본 최대 50% 증가\n세계의 고리 완성 시 최대 100% 증가\n\n";
    s += "미드가르드 감기 (25%)\n공격력 2배\n세계의 고리 1단계 진행\n\n";
    s += "세계의 고리\n3단계 완성 시 공격력 증가 한도가 100%로 확장\n완성 즉시 공격력이 더 강해짐\n\n";
    s += "종말의 독 (15%)\n공격력 1.2배\n독 1중첩 부여\n\n";
    s += "독\n턴 시작 시 최대 체력의 2% 피해\n최대 3중첩\n\n";
    } else if(boss.id === "fenrir"){
    s += "패시브 - 글레이프니르\n매듭 6개로 시작\n매듭이 남아 있으면 회피율 0%, 공격력 25% 감소\n치명타를 받을 때 매듭 1개 해제\n한 턴에 최대 2개 해제\n\n";
    s += "티르의 오른손 (20%)\n공격력이 가장 높은 물고기에게 공격력 1.3배\n대상 공격력의 40%를 다음 공격에 추가\n\n";
    s += "신을 삼키는 자 (15%)\n매듭이 모두 풀린 뒤 사용 가능\n공격력이 가장 높은 물고기는 다음 턴 행동 불가\n남은 물고기가 치명타 피해를 주면 구출 성공\n구출 실패 시 최대 체력의 50% 피해\n이후 전투에 복귀\n\n";
    } else if(boss.id === "surtr"){
    s += "패시브 - 불꽃의 검\n불꽃의 검 내구도 30,000,000\n받는 피해를 수르트와 불꽃의 검이 절반씩 나눠 받음\n검 파괴 후 받는 피해 30% 증가\n파괴된 검은 재점화되지 않음\n\n";
    s += "프레이르와의 결투 (20%)\n해당 턴은 공격력이 가장 높은 물고기와 수르트만 행동\n서로 동시에 1회 공격\n물고기는 공격력 1배, 수르트는 공격력 1.8배\n양쪽 모두 회피 불가, 치명타 발동 가능\n\n";
    s += "무스펠의 진군 (15%)\n발동한 턴에는 수르트가 공격하지 않음\n다음 턴 시작 시 모든 물고기에게 공격력 0.8배\n해당 전체 공격이 그 턴의 수르트 행동을 대신함\n\n";
    } else if(boss.id === "cerberus"){
    s += "패시브 - 세 개의 머리\n체력 66%와 33%에서 머리를 하나씩 잃음\n남은 머리 수만큼 세 머리의 판결 공격 횟수 적용\n\n";
    s += "세 머리의 판결 (20%)\n공격력·최대 체력·치명타율이 가장 높은 물고기를 각 머리가 선택\n머리 하나당 공격력 0.6배\n한 물고기가 여러 조건을 만족하면 연속 공격을 받을 수 있음\n\n";
    s += "망자의 무게 (15%)\n현재 체력이 가장 낮은 물고기를 공격\n잃은 체력에 비례해 공격력 1.2~2.2배\n\n";
    } else if(boss.id === "nidhogg"){
    s += "패시브 - 세계수 침식\n4턴마다 모든 물고기의 최대 체력 5% 감소\n최대 5회, 전투 종료 후 복구\n\n";
    s += "뿌리의 연결 (20%)\n처음에는 무작위 2마리를 2턴간 연결\n다시 발동하면 최대 3마리까지 추가하고 지속 시간 초기화\n한 마리가 받은 실제 피해의 50%를 나머지가 나눠 받음\n연결 피해는 다시 전파되지 않음\n\n";
    s += "라타토스크의 이간질 (15%)\n공격력이 가장 높은 물고기의 다음 공격을 현재 체력이 가장 높은 아군에게 유도\n자신의 공격력과 치명타율을 사용하며 대상은 회피 가능\n\n";
    } else if(boss.id === "azhi_dahaka"){
    s += "패시브 - 세 가지 재앙\n쇠약: 공격력 15% 감소\n공포: 회피율 50% 감소\n불신: 치명타율 15% 감소\n한 물고기에 세 재앙이 모이면 최대 체력 20% 피해 후 재앙 제거\n\n";
    s += "세 머리의 선택 (25%)\n공격력이 가장 높은 대상에게 쇠약\n회피율이 가장 높은 대상에게 공포\n치명타율이 가장 높은 대상에게 불신\n각 대상에게 공격력 0.65배\n\n";
    s += "재앙 집중 (15%)\n재앙이 가장 많은 대상에게 다른 물고기의 재앙을 하나씩 이동\n세 재앙이 완성되면 즉시 폭발\n옮길 재앙이 없으면 공격력 1.6배\n\n";
    } else if(boss.id === "typhon"){
    s += "패시브 - 폭풍의 지배자\n매 턴 역풍·난기류·폭풍의 눈 중 하나가 발생\n역풍: 물고기 공격력 20% 감소, 타이폰 공격력 10% 증가\n난기류: 물고기 회피율 10% 감소, 타이폰 회피율 10% 증가\n폭풍의 눈: 물고기 회피 불가, 타이폰 치명타율 15%·치명타 피해 50% 증가\n\n";
    s += "폭풍의 반향 (20%)\n지난 턴 가장 큰 피해를 준 물고기에게 그 피해의 30%를 회피 불가로 반환\n대상 최대 체력의 25%가 상한\n기록이 없으면 공격력 1.3배\n\n";
    s += "대지와 하늘의 추락 (15%)\n공격력이 가장 높은 물고기와 최대 체력이 가장 높은 물고기의 체력 비율을 더 낮은 쪽으로 통일\n회복은 발생하지 않음\n두 조건의 대상이 같으면 공격력 1.7배\n\n";
    } else if(boss.id === "angra_mainyu"){
    s += "패시브 - 절대악\n모든 물고기는 체력과 별개인 존재 3으로 시작\n존재가 0이 되면 체력과 관계없이 즉시 회복 중 상태\n체력 75%·50%·25% 진입 시 무작위 물고기의 존재 1 감소\n\n";
    s += "존재 말살 (20%)\n공격력이 가장 높은 물고기에게 공격력 1.8배와 존재 1 감소\n공격을 회피해도 존재는 감소\n공격 피해로 쓰러지면 존재 감소는 다른 무작위 물고기에게 이동\n\n";
    s += "창조의 붕괴 (15%)\n모든 물고기에게 최대 체력 15%의 회피 불가 피해\n체력이 40% 이하가 된 물고기는 존재 1 감소\n이 체력 피해만으로는 쓰러지지 않음\n\n";
    s += "패시브 - 영겁의 밤\n체력 25% 이하에서 공격력 30% 증가, 회피율 0%\n존재 말살 공격력 2.2배, 창조의 붕괴 피해 20%로 강화\n\n";
    } else {
    s += "스킬\n\n";
    s += boss.skillName + (boss.skillRate ? " (" + boss.skillRate + "%)" : "") + "\n" + boss.skillDesc + "\n\n";
    s += "패시브\n\n";
    if(boss.id === "kraken") s += "먹물 난사\n회피 시도 시 회피 실패 처리\n\n";
    else if(boss.id === "hydra") s += "재생\n매 턴 최대 체력의 5% 회복\n\n";
    else if(boss.id === "leviathan") s += "심연의 분노\n체력 50% 이하 시 공격력 30% 증가\n\n";
    else if(boss.id === "behemoth") s += "고대의 육체\n받는 피해 20% 감소\n\n";
    else s += "없음\n\n";
  }

  s += line();
  return s;
}

function showBossInfo(number){
  if(number === undefined || number === null || number === ""){
    return print(buildBossInfoText());
  }

  const index = Number(number) - 1;
  if(!Number.isInteger(index) || index < 0 || index >= bossList.length){
    return print("사용법 : 보스정보 번호\n\n보스목록에서 번호를 확인해주세요.");
  }

  print(buildBossInfoText(bossList[index]));
}

function buildBossListText(){
  let s = "보스목록\n\n────┬────────────────────\n";
  bossList.forEach((boss,i)=>{
    const selected = getCurrentBoss().id === boss.id ? " [선택됨]" : "";
    s += fullWidthNumber(i+1) + "│" + bossColor("[" + boss.grade + "] " + boss.name + " [" + getBossStatus(boss) + "]" + selected, boss) + "\n";
    if(i !== bossList.length - 1) s += "────┼────────────────────\n";
  });
  s += "────┴────────────────────\n\n";
  s += "명령어 : 보스정보 번호 / 보스선택 번호";
  return s;
}

function showBossList(){ print(buildBossListText()); }

function prepareBossFish(displayNumber){
  if(!isBossMenu) return print("보스전에서만 사용할 수 있습니다.");
  recoverStunnedFish();

  const idx = getBucketIndexByDisplayNumber(displayNumber);
  if(idx < 0 || !bucket[idx]) return print("존재하지 않는 번호입니다.");
  if(bossPrepIndexes.includes(idx)) return print("이미 준비된 물고기입니다.");
  if(bossPrepIndexes.length >= 5) return print("전투 준비는 최대 5마리까지 가능합니다.");

  const f = bucket[idx];
  const c = ensureCombatStats(f);

  if(f.grade === "쓰레기") return print("쓰레기 등급은 전투에 참가할 수 없습니다.");
  if(c.status === "기절") c.status = "회복 중";

  bossPrepIndexes.push(idx);
  pendingRecoveryBattleConfirm = false;

  let msg = color(lineFish(f), f.grade) + "\n\n전투 준비 완료\n\n" + bossPrepIndexes.length + " / 5";
  const statusText = getCombatStatusText(f);
  if(statusText !== "정상"){
    msg += "\n\n주의 : 이 물고기는 " + statusText + "입니다.";
  }
  saveGame();
  print(msg);
}

function unprepareBossFish(displayNumber){
  if(!isBossMenu) return print("보스전에서만 사용할 수 있습니다.");

  const idx = getBucketIndexByDisplayNumber(displayNumber);
  const pos = bossPrepIndexes.indexOf(idx);

  if(pos < 0) return print("준비 목록에 없는 물고기입니다.");

  const f = bucket[idx];
  bossPrepIndexes.splice(pos,1);
  saveGame();

  print(color(lineFish(f), f.grade) + "\n\n전투 준비 해제");
}

function calcDamage(attackerAttack, critRate, critDamage){
  let damage = attackerAttack;
  const crit = Math.random() * 100 < critRate;
  if(crit) damage = Math.floor(damage * (critDamage / 100));
  return {damage, crit};
}

function stunFish(f){
  const c = ensureCombatStats(f);
  c.hp = 0;
  c.status = "회복 중";
  if(activeTraitBattle && activeTraitBattle.participants && activeTraitBattle.participants.includes(f)){
    c.battleDown = true;
    delete c.rootLinkedPeers;
    const boss = activeTraitBattle.boss;
    if(boss && Array.isArray(boss._rootLinks)){
      boss._rootLinks = boss._rootLinks.filter(x => x !== f);
      boss._rootLinks.forEach(linked => {
        const lc = ensureCombatStats(linked);
        if(Array.isArray(lc.rootLinkedPeers)) lc.rootLinkedPeers = lc.rootLinkedPeers.filter(x => x !== f);
      });
    }
  }
  c.recoveryStartAt = Date.now();
  c.recoveryStartHp = 0;
  c.stunUntil = Date.now() + getStunMinutes(f.grade) * 60 * 1000;
}


function pickBossPattern(boss){
  const r = Math.random() * 100;

  if(boss.id === "kraken"){
    if(r < 25) return "tentacle";
    if(r < 40) return "ink";
  }

  if(boss.id === "leviathan"){
    if(r < 25) return "pressure";
    if(r < 40) return "slash";
  }

  return "normal";
}

function getBossCooldownLeft(bossId=null){
  const id = bossId || getCurrentBoss().id;
  const cooldowns = bossProgress.cooldowns || {};
  return Math.max(0, (cooldowns[id] || 0) - Date.now());
}

function isBossCooldownActive(bossId=null){
  return getBossCooldownLeft(bossId) > 0;
}

function setBossCooldown(bossId=null){
  const id = bossId || getCurrentBoss().id;
  if(!bossProgress.cooldowns) bossProgress.cooldowns = {};
  bossProgress.cooldowns[id] = Date.now() + 5 * 60 * 1000;
}


function getAlivePreparedFishes(){
  return bossPrepIndexes
    .map(idx => bucket[idx])
    .filter(f => {
      if(!f || f.grade === "쓰레기") return false;
      updateRecoveringFishHp(f);
      const c = ensureCombatStats(f);
      if(c.status === "회복 중" && c.hp <= 0) c.hp = 1;
      return c.hp > 0;
    });
}

let activeTraitBattle = null;

function traitState(f){
  const c = ensureCombatStats(f);
  if(!c._traitBattle){
    if(!activeTraitBattle) return {};
    c._traitBattle = {};
  }
  return c._traitBattle;
}

function isBattleActionableFish(f){
  if(!f) return false;
  const c = ensureCombatStats(f);
  return c.hp > 0 && c.status !== "기절" && !c.battleDown && !c.devouredByFenrir && !(c._traitBattle && c._traitBattle.ashRemnant);
}

function traitFish(participants, name, aliveOnly=true){
  return (participants || []).find(f => f && f.name === name && (!aliveOnly || isBattleActionableFish(f))) || null;
}

function traitFishes(participants, name, aliveOnly=true){
  return (participants || []).filter(f => f && f.name === name && (!aliveOnly || isBattleActionableFish(f)));
}

function getBurningHeartStageByCombat(c){
  if(!c || Number(c.maxHp || 0) <= 0) return 0;
  const rate = Number(c.hp || 0) / Number(c.maxHp || 1);
  if(rate <= 0.3) return 3;
  if(rate <= 0.5) return 2;
  if(rate <= 0.7) return 1;
  return 0;
}

function consumeBurningHeartHp(c){
  if(!c || Number(c.hp || 0) <= 1) return 0;
  let cost = Math.floor(Number(c.hp || 0) * 0.03);
  if(cost <= 0) cost = 1;
  cost = Math.min(cost, Math.max(0, Number(c.hp || 0) - 1));
  c.hp = Math.max(1, Number(c.hp || 0) - cost);
  return cost;
}

function snapshotFishTraitState(f){
  const c = ensureCombatStats(f);
  return {
    hp:Number(c.hp || 0), maxHp:Number(c.maxHp || 1), status:c.status,
    stunUntil:c.stunUntil, battleDown:!!c.battleDown,
    burnStacks:Number(c.burnStacks || 0), poisonStacks:Number(c.poisonStacks || 0),
    azhiCurses:c.azhiCurses ? {...c.azhiCurses} : null,
    ratatoskrRedirect:c.ratatoskrRedirect,
    existence:c.existence,
    traitState:c._traitBattle ? JSON.parse(JSON.stringify(c._traitBattle)) : null
  };
}

function restoreFishTraitState(f, snap){
  if(!f || !snap) return;
  const c = ensureCombatStats(f);
  c.maxHp = Math.max(1, Number(snap.maxHp || c.maxHp));
  c.hp = Math.max(0, Math.min(c.maxHp, Number(snap.hp ?? 0)));
  c.status = snap.status || "정상";
  if(snap.battleDown) c.battleDown=true; else delete c.battleDown;
  if(snap.stunUntil !== undefined) c.stunUntil=snap.stunUntil; else delete c.stunUntil;
  if(snap.burnStacks) c.burnStacks=snap.burnStacks; else delete c.burnStacks;
  if(snap.poisonStacks) c.poisonStacks=snap.poisonStacks; else delete c.poisonStacks;
  if(snap.azhiCurses) c.azhiCurses={...snap.azhiCurses}; else delete c.azhiCurses;
  if(snap.ratatoskrRedirect !== undefined) c.ratatoskrRedirect=snap.ratatoskrRedirect; else delete c.ratatoskrRedirect;
  if(snap.existence !== undefined) c.existence=snap.existence;
  if(snap.traitState) c._traitBattle=JSON.parse(JSON.stringify(snap.traitState));
}

function clearOneFishStatus(f){
  const c=ensureCombatStats(f);
  if(c.burnStacks){ delete c.burnStacks; return "화상"; }
  if(c.poisonStacks){ delete c.poisonStacks; return "독"; }
  const curse=Object.keys(c.azhiCurses||{}).find(k=>c.azhiCurses[k]);
  if(curse){ delete c.azhiCurses[curse]; return "재앙"; }
  if(c.ratatoskrRedirect){ delete c.ratatoskrRedirect; return "이간질"; }
  return "";
}

function traitUseText(name, body=""){
  const title = "\n" + name;
  return body ? title + "\n" + body : title;
}

function traitUseByFish(f, body="", titleOverride=""){
  const trait = getFishTrait(f);
  const title = titleOverride || (trait ? trait.name : "특성");
  if(f){
    const fishLabel = activePvpFishLabeler ? activePvpFishLabeler(f) : color(lineFish(f), f.grade);
    return traitUseText(fishLabel + "의 " + title, body);
  }
  return traitUseText(title, body);
}

function registerTraitStatus(f, battleLog){
  const ctx=activeTraitBattle;
  if(!ctx || !f || ensureCombatStats(f).hp<=0) return;
  const dragons=traitFishes(ctx.participants,"청룡");
  dragons.forEach(dragon=>{
    const st=traitState(dragon);
    st.raindrops=Number(st.raindrops||0)+1;
    if(st.raindrops<3) return;
    st.raindrops=0;
    const logs=[];
    getAliveTargets(ctx.participants).forEach(ally=>{
      const ac=ensureCombatStats(ally);
      const removed=clearOneFishStatus(ally);
      const heal=Math.max(1,Math.floor(ac.maxHp*0.1));
      ac.hp=Math.min(ac.maxHp,ac.hp+heal);
      logs.push(color(lineFish(ally),ally.grade)+(removed?" · "+removed+" 해제":"")+" · "+heal.toLocaleString()+" 회복");
    });
    battleLog.push(traitUseByFish(dragon, logs.join("\n")));
  });
}

function initTraitBattle(participants,boss,battleLog){
  setBattleDisplayNumbers(participants);
  activeTraitBattle={participants,boss,battleLog,turn:0,history:[],traitDamage:0,lastBossTarget:null,
    deletedSkill:"",firstLetterSealUsed:false,rewriteUsed:false,observedSkill:"",observedUntil:0,lightPool:0,
    periodStarted:false,periodSentences:0,timeRewindPending:false,timeRewindUsed:false,diamondTurn:0};
  participants.forEach(f=>{
    const c=ensureCombatStats(f);
    c._traitBattle={originalMaxHp:c.maxHp,originalCritDamage:c.critDamage};
  });
}

function startTraitTurn(turn,boss,battleLog){
  const ctx=activeTraitBattle; if(!ctx) return;
  ctx.turn=turn;
  ctx.history.push({turn,states:new Map(ctx.participants.map(f=>[f.id,snapshotFishTraitState(f)]))});
  if(ctx.history.length>7) ctx.history.shift();

  const moonReturnFish=traitFish(ctx.participants,"호수에 비친 달");
  if(turn%4===0 && moonReturnFish){
    const past=ctx.history.find(x=>x.turn===turn-2);
    const target=getAliveTargets(ctx.participants).sort((a,b)=>ensureCombatStats(a).hp/ensureCombatStats(a).maxHp-ensureCombatStats(b).hp/ensureCombatStats(b).maxHp)[0];
    if(past&&target&&past.states.get(target.id)){
      restoreFishTraitState(target,past.states.get(target.id));
      battleLog.push(traitUseByFish(moonReturnFish, color(lineFish(target),target.grade)+"\n2턴 전 상태를 되찾았습니다."));
    }
  }

  traitFishes(ctx.participants,"이무기").forEach(f=>{
    const c=ensureCombatStats(f), st=traitState(f);
    if(turn>=7&&!st.ascended&&c.hp>0){
      st.ascended=true;
      const old=c.maxHp; c.maxHp=Math.floor(c.maxHp*1.2); c.hp=Math.min(c.maxHp,c.hp+Math.floor(old*0.3));
      battleLog.push(traitUseByFish(f, color(lineFish(f),f.grade)+"\n최대 체력 20% 증가, 체력 30% 회복, 공격력과 회피율이 상승했습니다."));
    }
  });

  traitFishes(ctx.participants,"금빛 보름달 드래곤").forEach(f=>{
    const st=traitState(f); st.moonPhase=(turn-1)%3;
    if(st.moonPhase===1){
      const target=getAliveTargets(ctx.participants).sort((a,b)=>ensureCombatStats(a).hp/ensureCombatStats(a).maxHp-ensureCombatStats(b).hp/ensureCombatStats(b).maxHp)[0];
      if(target){ const c=ensureCombatStats(target),heal=Math.floor(c.maxHp*0.1); c.hp=Math.min(c.maxHp,c.hp+heal); battleLog.push(traitUseByFish(f, "반달\n"+color(lineFish(target),target.grade)+" "+heal.toLocaleString()+" 회복")); }
    }else if(st.moonPhase===2){
      const target=getAliveTargets(ctx.participants).find(x=>clearOneFishStatus(x));
      if(target) battleLog.push(traitUseByFish(f, "보름달\n"+color(lineFish(target),target.grade)+"의 상태이상을 해제했습니다."));
    }
  });

  traitFishes(ctx.participants,"바다를 삼킨 태양").forEach(f=>traitState(f).sunStage=((turn-1)%5)+1);
  traitFishes(ctx.participants,"해신룡").forEach(f=>traitState(f).tideHigh=turn%2===1);

  const wishFish=traitFish(ctx.participants,"호수에 비친 별");
  if(wishFish){
    const st=traitState(wishFish);
    if(!st.wish || (st.wishCompletedTurn&&turn-st.wishCompletedTurn>=5)){
      const kinds=["crit","dodge","low"];
      st.wish=kinds[Math.floor(Math.random()*kinds.length)]; st.wishCount=0; delete st.wishCompletedTurn;
      const label=st.wish==="crit"?"아군 치명타 3회":st.wish==="dodge"?"아군 회피 2회":"빈사 상태로 한 턴 생존";
      battleLog.push(traitUseByFish(wishFish, "목표 : "+label));
    }
  }
}

function getCyclingTraitStateText(f,st){
  if(!f || !st) return "";
  if(f.name==="바다를 삼킨 태양"){
    const labels=["새벽","아침","정오","태양 작열","태양 폭발"];
    const idx=Math.max(0,Math.min(labels.length-1,Number(st.sunStage||1)-1));
    return "상태 : " + labels[idx];
  }
  if(f.name==="해신룡"){
    return "상태 : " + (st.tideHigh ? "밀물" : "썰물") + (st.tideStored ? " · 파도 저장" : "");
  }
  if(f.name==="금빛 보름달 드래곤"){
    const labels=["초승달","반달","보름달"];
    const idx=Math.max(0,Math.min(labels.length-1,Number(st.moonPhase||0)));
    return "상태 : " + labels[idx];
  }
  if(f.name==="불타는 마음"){
    const c=ensureCombatStats(f);
    const stage=Number(st.heartbeatStage ?? getBurningHeartStageByCombat(c));
    const label=stage>0 ? stage : "안정";
    const cost=Number(st.heartbeatCost || 0);
    return "상태 : 화염의 심박 " + label + (cost>0 ? "\n체력 " + cost.toLocaleString() + " 소모" : "");
  }
  if(f.name==="잿빛 밤하늘 드래곤" && st.ashRemnant){
    return "상태 : 재의 잔영 " + Number(st.ashTurns||0) + "턴";
  }
  if(f.name==="이무기" && st.ascended){
    return "상태 : 승천";
  }
  return "";
}

function traitPreAttackText(f){
  const stateText=getCyclingTraitStateText(f,traitState(f));
  return stateText || "";
}

function getStormEye(){
  const ctx=activeTraitBattle;if(!ctx||!traitFish(ctx.participants,"휘몰아치는 마음"))return null;
  return getAliveTargets(ctx.participants).sort((a,b)=>ensureCombatStats(a).attack-ensureCombatStats(b).attack)[0]||null;
}

function getSingleTargetCandidates(targets){
  const alive=getAliveTargets(targets),eye=getStormEye();
  if(!eye||alive.length<=1)return alive;
  return alive.filter(f=>f!==eye);
}

function beginBossSpecial(boss,skillName,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return true;
  const firstLetter=traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️");
  const wishFish=traitFish(ctx.participants,"호수에 비친 별");
  const observedFish=traitFish(ctx.participants,"수상한 기운 👁️");
  const frozenFish=traitFish(ctx.participants,"얼어붙은 마음");
  if(ctx.deletedSkill===skillName){
    battleLog.push(traitUseByFish(traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️",false), bossColor(boss.name,boss)+"의 "+subjectText(skillName)+" 이야기에서 삭제되어 사용할 수 없습니다."));
    return false;
  }
  if(firstLetter&&!ctx.firstLetterSealUsed){
    ctx.firstLetterSealUsed=true;
    ctx.deletedSkill=skillName;
    battleLog.push(traitUseByFish(firstLetter, bossColor(boss.name,boss)+"가 펼치려던 "+subjectText(skillName)+" 이야기에서 영구 삭제되었습니다."));
    return false;
  }
  if(ctx.sealNextBossAction){ctx.sealNextBossAction=false;battleLog.push(traitUseByFish(wishFish, "소원이 이루어져 "+bossColor(boss.name,boss)+"의 "+subjectText(skillName)+" 봉인되었습니다."));return false;}
  if(observedFish&&ctx.observedSkill===skillName&&ctx.turn<=ctx.observedUntil){
    const reversedLogs=[];
    getAliveTargets(ctx.participants).forEach(ally=>{
      const c=ensureCombatStats(ally),heal=Math.max(1,Math.floor(c.maxHp*0.15)),removed=clearOneFishStatus(ally);
      c.hp=Math.min(c.maxHp,c.hp+heal);
      reversedLogs.push(color(lineFish(ally),ally.grade)+(removed?" · "+removed+" 해제":"")+" · "+heal.toLocaleString()+" 회복");
    });
    boss._observedWeakUntil=ctx.turn+3;
    ctx.observedSkill="";ctx.observedUntil=0;
    battleLog.push(traitUseByFish(observedFish, bossColor(boss.name,boss)+"의 "+objectText(skillName)+" 뒤집었습니다.\n"+reversedLogs.join("\n")+"\n보스의 공격력이 3턴 동안 20% 감소합니다."));
    return false;
  }
  if(!ctx.frozenSkills)ctx.frozenSkills={};
  if(Number(ctx.frozenSkills[skillName]||0)>0&&Number(ctx.frozenSkills[skillName])>=ctx.turn){battleLog.push(traitUseByFish(frozenFish, subjectText(skillName)+" 얼어붙어 사용할 수 없습니다."));return false;}
  if(!ctx.seenBossSpecials)ctx.seenBossSpecials=new Set();
  if(frozenFish&&ctx.seenBossSpecials.has(skillName)){ctx.frozenSkills[skillName]=ctx.turn+3;ctx.seenBossSpecials.delete(skillName);battleLog.push(traitUseByFish(frozenFish, "반복된 "+objectText(skillName)+" 취소하고 3턴 동안 봉인했습니다."));return false;}
  ctx.seenBossSpecials.add(skillName);
  if(observedFish){ctx.observedSkill=skillName;ctx.observedUntil=ctx.turn+3;battleLog.push(traitUseByFish(observedFish, objectText(skillName)+" 3턴 동안 관측합니다."));}
  return true;
}

function runBossSpecial(boss,skillName,battleLog,fn){
  if(!beginBossSpecial(boss,skillName,battleLog))return false;
  boss._activeSpecialName=skillName;
  try{ fn(); }finally{ delete boss._activeSpecialName; }
  return true;
}

function tryReverseBossSpecial(){ return false; }

function traitModifyIncoming(f,damage,battleLog,meta={}){
  const ctx=activeTraitBattle,c=ensureCombatStats(f),st=traitState(f);
  let final=Math.max(0,Math.floor(damage)),afterHeal=0;
  if(!ctx) return {damage:final,afterHeal};
  if(f.name==="금빛 보름달 드래곤"&&st.moonPhase===0) final=Math.floor(final*0.8);
  if(f.name==="불타는 마음"&&getBurningHeartStageByCombat(c)>=3) final=Math.floor(final*1.2);
  if(!meta.forced&&f.name==="기묘한 기운 🌀"&&final>Number(c.attack||0)&&Math.random()<0.2){
    st.numericStored=final; final=Math.max(0,Math.floor(c.attack));
    battleLog.push(traitUseByFish(f, "받을 피해와 공격 수치가 뒤바뀌었습니다. 다음 공격 : "+st.numericStored.toLocaleString()));
  }
  const lethal=final>=c.hp;
  const hasLetters=traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️")&&traitFish(ctx.participants,"잃어버린 두 번째 편지 조각 ✉️")&&traitFish(ctx.participants,"잃어버린 세 번째 편지 조각 ✉️");
  if(lethal&&hasLetters&&!ctx.rewriteUsed){
    ctx.rewriteUsed=true; final=0;
    battleLog.push(traitUseByFish(traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️"), fishSubjectLabel(f)+" 쓰러지는 사건과 그 피해가 삭제되었습니다.", "다시 쓰인 편지"));
  }else if(lethal&&f.name==="잿빛 밤하늘 드래곤"&&!st.ashUsed){
    st.ashUsed=true;st.ashTurns=3;st.ashRemnant=true;final=Math.max(0,c.hp-1);
    battleLog.push(traitUseByFish(f, color(lineFish(f),f.grade)+"\n3턴 동안 재의 잔영으로 남습니다."));
  }else if(lethal&&traitFish(ctx.participants,"빛나는 마음")){
    const required=Math.max(1,Math.floor(c.maxHp*0.3));
    if(ctx.lightPool>=required){
      ctx.lightPool-=required; final=Math.max(0,c.hp-1); afterHeal=required;meta.skipLightGain=true;
      battleLog.push(traitUseByFish(traitFish(ctx.participants,"빛나는 마음"), color(lineFish(f),f.grade)+"의 죽음을 막고 "+afterHeal.toLocaleString()+" 체력을 회복합니다."));
    }
  }
  return {damage:final,afterHeal};
}

function traitAfterDamage(f,beforeHp,actualDamage,battleLog,meta={},afterHeal=0){
  const ctx=activeTraitBattle;if(!ctx)return;
  const c=ensureCombatStats(f),st=traitState(f);
  if(afterHeal>0)c.hp=Math.min(c.maxHp,c.hp+afterHeal);
  if(actualDamage>0&&!meta.skipLightGain&&traitFish(ctx.participants,"빛나는 마음"))ctx.lightPool+=Math.floor(actualDamage*0.25);
  if(c.hp<=0&&f.name==="무한한 시간"&&!ctx.timeRewindUsed)ctx.timeRewindPending=true;
  if(meta.fromBoss&&actualDamage>0){
    if(ctx.lastBossTarget===f.id&&f.name==="흑룡"){
      const reflected=Math.floor(actualDamage*0.3);ctx.boss._currentHp=Math.max(0,Number(ctx.boss._currentHp)-reflected);ctx.traitDamage+=reflected;st.scaleEmpowered=true;
      battleLog.push(traitUseByFish(f, reflected.toLocaleString()+" 피해를 반사하고 다음 공격이 강화됩니다."));
    }
    ctx.lastBossTarget=f.id;
  }
}

function traitAttackStats(f,boss,battleLog){
  const ctx=activeTraitBattle,c=ensureCombatStats(f),st=traitState(f);
  let attack=getEffectiveFishAttack(f,boss),critDamage=Number(c.critDamage||150),multiplier=1,extra=0,replaced=false;
  if(!ctx)return {attack,critDamage,multiplier,extra,replaced};
  if(st.ashRemnant)multiplier*=0.5;
  if(f.name==="핏빛 초승달 드래곤"){
    const cost=Math.min(Math.max(0,c.hp-1),Math.floor(c.hp*0.05));c.hp-=cost;extra+=Math.floor(cost*1.5);
    if(cost>0)battleLog.push(traitUseByFish(f, "체력 "+cost.toLocaleString()+" 소모 · 추가 피해 "+Math.floor(cost*1.5).toLocaleString()));
  }
  if(f.name==="금빛 보름달 드래곤"&&st.moonPhase===2)multiplier*=1.5;
  if(st.scaleEmpowered){multiplier*=1.5;delete st.scaleEmpowered;}
  if(f.name==="해신룡"&&st.tideHigh)multiplier*=st.tideStored?1.7:1.4;
  if(f.name==="불타는 마음"){
    st.heartbeatCost=consumeBurningHeartHp(c);
    const stage=getBurningHeartStageByCombat(c);
    st.heartbeatStage=stage;
    if(stage===1){multiplier*=1.15;critDamage+=30;}
    else if(stage===2){multiplier*=1.25;critDamage+=60;}
    else if(stage>=3){multiplier*=1.35;critDamage+=100;}
  }
  if(f.name==="바다를 삼킨 태양")multiplier*=[1.1,1.2,1.35,1.5,1.8][Math.max(0,Number(st.sunStage||1)-1)];
  const eye=getStormEye();if(eye&&eye!==f){extra+=Math.floor(ensureCombatStats(eye).attack*0.2);battleLog.push(traitUseByFish(traitFish(ctx.participants,"휘몰아치는 마음"), color(lineFish(eye),eye.grade)+"가 폭풍의 중심이 되어 이번 공격에 힘을 보탰습니다."));}
  if(st.numericStored){attack=st.numericStored;multiplier=1;extra=0;replaced=true;delete st.numericStored;}
  return {attack,critDamage,multiplier,extra,replaced};
}

function dealTraitDamage(boss,raw,label,battleLog){
  const ctx=activeTraitBattle;if(!ctx||raw<=0||Number(boss._currentHp)<=0)return 0;
  const damage=applyBossPassiveBeforeFishAttack(boss,Math.max(1,Math.floor(raw)),battleLog);
  boss._currentHp=Math.max(0,Number(boss._currentHp)-damage);ctx.traitDamage+=damage+Number(boss._lastDamageToSword||0);
  if(boss.id==="surtr" && Number(boss._lastDamageToSword||0)>0){
    let entry = label + "\n\n";
    entry += "수르트가 피해를 불꽃의 검과 나눠 받았습니다.\n\n";
    entry += "수르트 : " + damage.toLocaleString() + " 피해\n";
    entry += "불꽃의 검 : " + Number(boss._lastDamageToSword||0).toLocaleString() + " 피해\n";
    entry += "검 내구도 : " + Number(boss._flameSwordHp||0).toLocaleString() + " / 30,000,000";
    if(boss._flameSwordJustBroken) entry += "\n\n불꽃의 검이 파괴되었습니다.\n이후 수르트가 받는 피해가 30% 증가합니다.";
    entry += "\n\n" + bossColor(boss.name,boss) + "\n" + hpBar(boss._currentHp,boss.hp);
    battleLog.push(entry);
  } else {
    battleLog.push(label+"\n\n"+damage.toLocaleString()+" 피해\n\n"+bossColor(boss.name,boss)+"\n"+hpBar(boss._currentHp,boss.hp));
  }
  startPeriodTraitIfNeeded(boss,battleLog);
  return damage;
}

function advanceWish(kind,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  const f=traitFish(ctx.participants,"호수에 비친 별");if(!f)return;
  const st=traitState(f);if(st.wish!==kind||st.wishCompletedTurn)return;
  st.wishCount=Number(st.wishCount||0)+1;
  const need=kind==="crit"?3:kind==="dodge"?2:1;
  if(st.wishCount>=need){st.wishCompletedTurn=ctx.turn;ctx.sealNextBossAction=true;battleLog.push(traitUseByFish(f, "소원 성취\n보스의 다음 특수 행동을 봉인합니다."));}
}

function startPeriodTraitIfNeeded(boss,battleLog){
  const ctx=activeTraitBattle;if(!ctx||ctx.periodStarted||Number(boss._currentHp)<=0||Number(boss._currentHp)>boss.hp*0.15)return false;
  const periodFish=traitFish(ctx.participants,"잃어버린 세 번째 편지 조각 ✉️");if(!periodFish)return false;
  ctx.periodStarted=true;ctx.periodSentences=0;boss._periodEnraged=true;boss._healingSealed=true;
  battleLog.push(traitUseByFish(periodFish, "보스의 마지막 문장이 시작되었습니다.\n회복이 봉인됩니다.\n문장 0 / 5\n보스의 공격력이 30% 증가합니다."));
  return true;
}

function afterFishAttackTrait(f,boss,outcome,baseAttack,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  const st=traitState(f);
  if(outcome==="crit")advanceWish("crit",battleLog);
  const galaxy=traitFish(ctx.participants,"호수에 비친 은하수");
  if(galaxy){
    const gs=traitState(galaxy);if(!gs.constellation)gs.constellation={hit:false,crit:false,miss:false};gs.constellation[outcome]=true;
    if(gs.constellation.hit&&gs.constellation.crit&&gs.constellation.miss){
      const raw=getAliveTargets(ctx.participants).reduce((sum,x)=>sum+Math.floor(getEffectiveFishAttack(x,boss)*0.3),0);gs.constellation={hit:false,crit:false,miss:false};
      dealTraitDamage(boss,raw,traitUseByFish(galaxy, "일반 적중, 치명타, 빗나감을 모두 기록해 별자리가 완성되었습니다.\n살아 있는 아군의 힘이 별빛으로 이어집니다."),battleLog);
    }
  }
  if(outcome==="miss")return;
  startPeriodTraitIfNeeded(boss,battleLog);
  if(ctx.periodStarted&&Number(boss._currentHp)>0){
    ctx.periodSentences=Math.min(5,Number(ctx.periodSentences||0)+(outcome==="crit"?2:1));
    battleLog.push(traitUseByFish(traitFish(ctx.participants,"잃어버린 세 번째 편지 조각 ✉️",false), "문장 "+ctx.periodSentences+" / 5"));
    if(ctx.periodSentences>=5){
      boss._currentHp=0;
      battleLog.push("마지막 문장에 마침표가 찍혔습니다.\n보스의 이야기가 끝났습니다.");
      return;
    }
  }
  if(f.name==="푸른 눈의 백염룡"){
    boss._whiteFlameStacks=Number(boss._whiteFlameStacks||0)+1;
    if(boss._whiteFlameStacks>=3){boss._whiteFlameStacks=0;dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*1.5,traitUseByFish(f, "백염이 3중첩이 되어 폭발했습니다."),battleLog);}
    else battleLog.push(traitUseByFish(f, "백염 "+boss._whiteFlameStacks+" / 3"));
  }
  if(f.name==="해신룡"){
    if(st.tideHigh){dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*0.4,traitUseByFish(f, "밀물의 파도가 이어져 추가 피해가 들어갑니다."),battleLog);st.tideStored=false;}
    else st.tideStored=true;
  }
  if(f.name==="바다를 삼킨 태양"&&st.sunStage===5)dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*2,traitUseByFish(f, "태양 주기가 태양 폭발 단계에 도달했습니다."),battleLog);
  if(f.name==="불타는 마음"&&Number(st.heartbeatStage||0)>=2&&Number(boss._currentHp)>0){
    const chance=Number(st.heartbeatStage)>=3?0.5:0.3;
    const ratio=Number(st.heartbeatStage)>=3?0.5:0.4;
    if(Math.random()<chance){
      dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*ratio,traitUseByFish(f, "심장이 한 번 더 뛰었습니다."),battleLog);
    }
  }
  if(f.name==="불타는 마음"&&Number(st.heartbeatStage||0)>=3){
    const c=ensureCombatStats(f);
    const cap=Math.floor(c.maxHp*0.3);
    if(c.hp>0&&c.hp<cap&&Math.random()<0.25){
      const heal=Math.min(Math.floor(c.hp*0.3),cap-c.hp);
      if(heal>0){
        c.hp=Math.min(cap,c.hp+heal);
        battleLog.push(traitUseByFish(f, "꺼져가던 심장이 다시 불붙었습니다.\n체력 "+heal.toLocaleString()+" 회복"));
      }
    }
  }
  startPeriodTraitIfNeeded(boss,battleLog);
}

function endFishTraitTurn(boss,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  if(traitFish(ctx.participants,"황룡")){
    const alive=getAliveTargets(ctx.participants).filter(f=>!traitState(f).ashRemnant),total=alive.reduce((s,f)=>s+ensureCombatStats(f).hp,0),maxTotal=alive.reduce((s,f)=>s+ensureCombatStats(f).maxHp,0);
    if(alive.length&&maxTotal>0){let left=total;alive.forEach((f,i)=>{const c=ensureCombatStats(f),v=i===alive.length-1?left:Math.min(c.maxHp,Math.floor(total*c.maxHp/maxTotal));c.hp=Math.max(1,v);left-=v;});battleLog.push(traitUseByFish(traitFish(ctx.participants,"황룡"), "아군의 현재 체력을 최대 체력 비율에 맞춰 재분배했습니다."));}
  }
  ctx.participants.forEach(f=>{
    const c=ensureCombatStats(f),st=traitState(f);
    if(st.ashRemnant){st.ashTurns--;if(st.ashTurns<=0){st.ashRemnant=false;c.hp=0;stunFish(f);battleLog.push(color(lineFish(f),f.grade)+"의 재의 잔영이 사라졌습니다.");}}
  });
}

function tryTimeRewindAfterWipe(battleLog){
  const ctx=activeTraitBattle;if(!ctx||ctx.timeRewindUsed||!ctx.history.length)return false;
  const timeFish=traitFish(ctx.participants,"무한한 시간",false);if(!timeFish)return false;
  if(!ctx.timeRewindPending&&ensureCombatStats(timeFish).hp>0)return false;
  const target=ctx.history.find(x=>x.turn===ctx.turn-5)||ctx.history[0];
  if(!target)return false;
  ctx.timeRewindUsed=true;ctx.timeRewindPending=false;
  ctx.participants.forEach(f=>restoreFishTraitState(f,target.states.get(f.id)));
  const rewound=Math.max(0,ctx.turn-target.turn);
  battleLog.push(traitUseByFish(timeFish, "무한한 시간의 죽음과 함께 시간이 되감겼습니다.\n파티가 "+rewound+"턴 전 상태로 돌아왔습니다.\n보스의 상태와 체력은 유지됩니다."));return true;
}

function finishTraitTurn(boss,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  if(ctx.participants.some(f=>{const c=ensureCombatStats(f);return isBattleActionableFish(f)&&c.maxHp>0&&c.hp/c.maxHp<=0.15;}))advanceWish("low",battleLog);
  startPeriodTraitIfNeeded(boss,battleLog);
}

function getBossAttackMultiplier(boss){
  let multiplier = 1;

  if(boss._enraged){
    multiplier *= 1.3;
  }
  if(boss._periodEnraged){
    multiplier *= 1.3;
  }
  if(activeTraitBattle&&Number(boss._observedWeakUntil||0)>=activeTraitBattle.turn){
    multiplier *= 0.8;
  }

  if(boss.id === "jormungandr"){
    const maxBoost = boss._ringCompleted ? 1.0 : 0.5;
    const boost = Math.min(maxBoost, Number(boss._attackBoost || 0));
    multiplier *= (1 + boost);
  }

  if(boss.id === "fenrir" && Number(boss._gleipnirKnots || 0) > 0){
    multiplier *= 0.75;
  }

  if(boss.id === "typhon" && boss._typhonWeather === "headwind") multiplier *= 1.1;
  if(boss.id === "angra_mainyu" && boss._eternalNight) multiplier *= 1.3;

  return multiplier;
}

function getBossAttackValue(boss, bossAttackMultiplier=1){
  const bonusAttack = Number(boss._bahamutAttackBonus || 0) + Number(boss._fenrirNextAttackBonus || 0);
  return Math.floor((boss.attack + bonusAttack) * bossAttackMultiplier * getBossAttackMultiplier(boss));
}

function getAliveTargets(targets){
  return targets.filter(f => {
    return isBattleActionableFish(f);
  });
}

function getStrongestAliveFish(targets){
  const alive = getAliveTargets(targets);
  return alive.sort((a,b) => ensureCombatStats(b).attack - ensureCombatStats(a).attack)[0] || null;
}

function getEffectiveBossDodge(boss){
  if(boss.id === "fenrir" && Number(boss._gleipnirKnots || 0) > 0) return 0;
  if(boss.id === "angra_mainyu" && boss._eternalNight) return 0;
  const ctx=activeTraitBattle;
  if(ctx && traitFishes(ctx.participants,"바다를 삼킨 태양").some(f=>traitState(f).sunStage===3)) return 0;
  if(boss.id === "typhon" && boss._typhonWeather === "turbulence") return Number(boss.dodge || 0) + 10;
  let value=Number(boss.dodge || 0);
  if(ctx && traitFishes(ctx.participants,"해신룡").some(f=>traitState(f).tideHigh)) value-=10;
  return Math.max(0,value);
}

function getEffectiveFishAttack(f, boss){
  const c = ensureCombatStats(f);
  let value = Number(c.attack || 0);
  if(c.azhiCurses && c.azhiCurses.weakness) value *= 0.85;
  if(boss.id === "typhon" && boss._typhonWeather === "headwind") value *= 0.8;
  if(traitState(f).ascended) value *= 1.3;
  return Math.max(0, Math.floor(value));
}

function getEffectiveFishDodge(f, boss){
  const c = ensureCombatStats(f);
  let value = Number(c.dodge || 0);
  if(c.azhiCurses && c.azhiCurses.fear) value *= 0.5;
  if(boss.id === "typhon" && boss._typhonWeather === "turbulence") value -= 10;
  if(boss.id === "typhon" && boss._typhonWeather === "eye") value = 0;
  if(traitState(f).ascended) value += 10;
  if(f.name === "해신룡" && !traitState(f).tideHigh) value += 15;
  return Math.max(0, value);
}

function getEffectiveFishCritRate(f){
  const c = ensureCombatStats(f);
  return Math.max(0, Number(c.critRate || 0) - (c.azhiCurses && c.azhiCurses.distrust ? 15 : 0));
}

function applyDamageToFish(f, damage, battleLog, prefix, meta={}){
  const c = ensureCombatStats(f);
  const beforeHp = c.hp;
  const modified=traitModifyIncoming(f,damage,battleLog,meta);
  damage=modified.damage;
  c.hp = Math.max(0, c.hp - damage);
  const actualDamage = Math.min(beforeHp, damage);
  traitAfterDamage(f,beforeHp,actualDamage,battleLog,meta,modified.afterHeal);

  let logText = prefix;
  logText += damage.toLocaleString() + " 피해\n\n";
  logText += color(lineFish(f), f.grade) + "\n" + hpBar(c.hp, c.maxHp);
  battleLog.push(logText);

  if(c.hp <= 0){
    stunFish(f);
    battleLog.push(color(lineFish(f), f.grade) + "\n체력이 0이 되어 회복 중입니다.");
  }

  const peers = Array.isArray(c.rootLinkedPeers) ? c.rootLinkedPeers.filter(x => x !== f && isBattleActionableFish(x)) : [];
  if(actualDamage > 0 && peers.length > 0 && !c._receivingRootShare){
    const shareEach = Math.floor(actualDamage * 0.5 / peers.length);
    peers.forEach(peer => {
      const pc = ensureCombatStats(peer);
      pc._receivingRootShare = true;
      applyDamageToFish(peer,shareEach,battleLog,"뿌리의 연결\n",{isShared:true});
      if(pc.hp <= 0 || pc.battleDown) delete pc.rootLinkedPeers;
      delete pc._receivingRootShare;
    });
  }
}

function bossSingleTargetAttack(boss, targets, battleLog, bossAttackMultiplier=1, skillName="공격", ignoreDodge=false, options={}){
  const isSpecial=!!options.isSpecial||boss._activeSpecialName===skillName;
  if(options.isSpecial && !boss._activeSpecialName && !beginBossSpecial(boss,skillName,battleLog)) return false;
  const alive = getSingleTargetCandidates(targets);
  if(alive.length === 0) return false;

  const f = alive[Math.floor(Math.random() * alive.length)];
  const c = ensureCombatStats(f);
  const bossAttack = getBossAttackValue(boss, bossAttackMultiplier);
  const dodgeRoll = Math.random() * 100 < getEffectiveFishDodge(f, boss);

  if(dodgeRoll && !ignoreDodge){
    battleLog.push(bossColor(boss.name, boss) + "의 " + skillName + "\n" + color(lineFish(f), f.grade) + " 회피");
    advanceWish("dodge",battleLog);
    return true;
  }

  const bossHit = calcDamage(bossAttack, boss.critRate, boss.critDamage);

  let prefix = bossColor(boss.name, boss) + "의 " + skillName + "\n";
  if(dodgeRoll && ignoreDodge) prefix += "회피 시도!\n먹물 때문에 회피에 실패했습니다.\n";
  if(bossHit.crit) prefix += "치명타!\n";

  if(isSpecial && tryReverseBossSpecial(boss,f,bossHit.damage,skillName,battleLog)) return true;

  const ctx=activeTraitBattle;
  const diamondFish = ctx ? traitFish(targets,"영롱한 다이아몬드") : null;
  if(ctx && diamondFish && ctx.diamondTurn!==ctx.turn){
    ctx.diamondTurn=ctx.turn;
    const splitTargets=getAliveTargets(targets),split=Math.max(1,Math.floor(bossHit.damage*0.7/splitTargets.length));
    battleLog.push(traitUseByFish(diamondFish, "단일 공격의 총피해를 30% 줄여 아군에게 분산합니다."));
    splitTargets.forEach(x=>applyDamageToFish(x,split,battleLog,bossColor(boss.name,boss)+"의 "+skillName+" · 굴절\n",{fromBoss:true,isSpecial,skillName}));
  }else applyDamageToFish(f, bossHit.damage, battleLog, prefix,{fromBoss:true,isSpecial,skillName});

  if(ensureCombatStats(f).hp > 0 && options.burn){
    c.burnStacks = Math.min(3, Number(c.burnStacks || 0) + 1);
    battleLog.push(color(lineFish(f), f.grade) + "\n화상 " + c.burnStacks + "중첩");
    registerTraitStatus(f,battleLog);
  }

  if(ensureCombatStats(f).hp > 0 && options.poison){
    c.poisonStacks = Math.min(3, Number(c.poisonStacks || 0) + 1);
    battleLog.push(color(lineFish(f), f.grade) + "\n독 " + c.poisonStacks + "중첩");
    registerTraitStatus(f,battleLog);
  }
  return true;
}

function bossAttackSpecificTarget(boss, f, battleLog, bossAttackMultiplier=1, skillName="공격", ignoreDodge=false, options={}){
  const isSpecial=!!options.isSpecial||boss._activeSpecialName===skillName;
  if(options.isSpecial && !boss._activeSpecialName && !beginBossSpecial(boss,skillName,battleLog)) return false;
  if(!f) return false;
  const eye=getStormEye();
  if(f===eye){
    const alternatives=getAliveTargets(activeTraitBattle?activeTraitBattle.participants:[]).filter(x=>x!==eye);
    if(alternatives.length)f=alternatives[Math.floor(Math.random()*alternatives.length)];
  }
  const c = ensureCombatStats(f);
  if(!isBattleActionableFish(f)) return false;

  const dodgeRoll = Math.random() * 100 < getEffectiveFishDodge(f, boss);
  if(dodgeRoll && !ignoreDodge){
    battleLog.push(bossColor(boss.name, boss) + "의 " + skillName + "\n" + color(lineFish(f), f.grade) + " 회피");
    advanceWish("dodge",battleLog);
    return false;
  }

  const hit = calcDamage(getBossAttackValue(boss, bossAttackMultiplier), boss.critRate, boss.critDamage);
  let prefix = bossColor(boss.name, boss) + "의 " + skillName + "\n";
  if(hit.crit) prefix += "치명타!\n";
  if(isSpecial && tryReverseBossSpecial(boss,f,hit.damage,skillName,battleLog)) return true;
  const ctx=activeTraitBattle;
  const diamondFish = ctx ? traitFish(ctx.participants,"영롱한 다이아몬드") : null;
  if(ctx&&diamondFish&&ctx.diamondTurn!==ctx.turn){
    ctx.diamondTurn=ctx.turn;
    const splitTargets=getAliveTargets(ctx.participants),split=Math.max(1,Math.floor(hit.damage*0.7/splitTargets.length));
    battleLog.push(traitUseByFish(diamondFish, "단일 공격의 총피해를 30% 줄여 아군에게 분산합니다."));
    splitTargets.forEach(x=>applyDamageToFish(x,split,battleLog,bossColor(boss.name,boss)+"의 "+skillName+" · 굴절\n",{fromBoss:true,isSpecial,skillName}));
  }else applyDamageToFish(f, hit.damage, battleLog, prefix,{fromBoss:true,isSpecial,skillName});
  return true;
}

function bossAllTargetAttack(boss, targets, battleLog, bossAttackMultiplier=1, skillName="전체 공격", options={}){
  const isSpecial=!!options.isSpecial||boss._activeSpecialName===skillName;
  if(options.isSpecial && !boss._activeSpecialName && !beginBossSpecial(boss,skillName,battleLog)) return false;
  const logs = [];
  const bossAttack = getBossAttackValue(boss, bossAttackMultiplier);

  targets.forEach(f => {
    const c = ensureCombatStats(f);
    if(!isBattleActionableFish(f)) return;

    const dodgeRoll = Math.random() * 100 < getEffectiveFishDodge(f, boss);
    if(dodgeRoll){
      logs.push(color(lineFish(f), f.grade) + "\n회피");
      advanceWish("dodge",battleLog);
      return;
    }

    const hit = calcDamage(bossAttack, boss.critRate, boss.critDamage);
    let damage = hit.damage;

    if(options.burnBonus){
      const burn = Number(c.burnStacks || 0);
      if(burn >= 2) damage = Math.floor(damage * 2.0);
      else if(burn >= 1) damage = Math.floor(damage * 1.5);
    }

    let prefix=color(lineFish(f),f.grade)+"\n"+(hit.crit?"치명타!\n":"")+(options.burnBonus&&(c.burnStacks||0)>0?"화상 추가 피해!\n":"");
    applyDamageToFish(f,damage,logs,prefix,{fromBoss:true,isSpecial,skillName});
  });

  if(logs.length > 0) battleLog.push(bossColor(boss.name, boss) + "의 " + skillName + "!\n\n" + logs.join("\n\n"));
  return true;
}

function applyBossPassiveBeforeFishAttack(boss, damage, battleLog=null){
  boss._lastDamageToSword = 0;
  boss._flameSwordJustBroken = false;

  if(boss.id === "behemoth") return Math.floor(damage * 0.8);

  if(boss.id === "bahamut"){
    const record = Number(boss._damageRecord || 0);
    if(damage >= record){
      const reduced = Math.floor(damage * 0.5);
      boss._damageRecord = reduced;
      if(battleLog){
        battleLog.push(bossColor(boss.name, boss) + "의 드래곤 스케일\n" + damage.toLocaleString() + " 피해를 " + reduced.toLocaleString() + " 피해로 감소\n피해 기록 : " + reduced.toLocaleString());
      }
      return reduced;
    }
  }

  if(boss.id === "surtr"){
    const swordHp = Math.max(0, Number(boss._flameSwordHp || 0));
    if(swordHp > 0){
      const swordDamage = Math.min(swordHp, Math.floor(damage * 0.5));
      boss._flameSwordHp = Math.max(0, swordHp - swordDamage);
      boss._lastDamageToSword = swordDamage;
      const bossDamage = damage - swordDamage;

      if(boss._flameSwordHp <= 0 && !boss._flameSwordBroken){
        boss._flameSwordBroken = true;
        boss._flameSwordJustBroken = true;
      }
      return bossDamage;
    }

    if(boss._flameSwordBroken) return Math.floor(damage * 1.3);
  }

  return damage;
}

function handleFenrirCriticalHit(boss, hit, battleLog){
  if(boss.id !== "fenrir" || !hit.crit) return;

  if(boss._devouredFish) boss._devourCritThisTurn = true;

  const knots = Number(boss._gleipnirKnots || 0);
  const brokenThisTurn = Number(boss._knotsBrokenThisTurn || 0);
  if(knots <= 0 || brokenThisTurn >= 2) return;

  boss._gleipnirKnots = knots - 1;
  boss._knotsBrokenThisTurn = brokenThisTurn + 1;
  battleLog.push(bossColor(boss.name, boss) + "의 글레이프니르\n매듭 해제 : " + boss._gleipnirKnots + " / 6 남음");

  if(boss._gleipnirKnots <= 0){
    battleLog.push(bossColor(boss.name, boss) + "가 글레이프니르를 완전히 끊었습니다.\n공격력과 회피율이 원래 수치로 돌아가며 신을 삼키는 자를 사용할 수 있습니다.");
  }
}

function resolveFenrirDevour(boss, bossHp, battleLog){
  const f = boss._devouredFish;
  if(boss.id !== "fenrir" || !f) return;

  const c = ensureCombatStats(f);
  delete c.devouredByFenrir;

  if(bossHp <= 0 || boss._devourCritThisTurn){
    battleLog.push(color(lineFish(f), f.grade) + "\n신을 삼키는 자에서 구출되었습니다.");
  } else {
    const damage = Math.floor(c.maxHp * 0.5);
    applyDamageToFish(f, damage, battleLog, bossColor(boss.name, boss) + "의 신을 삼키는 자\n구출 실패\n");
  }

  boss._devouredFish = null;
  boss._devourCritThisTurn = false;
}

function prepareSurtrTurn(boss, participants, battleLog){
  if(boss.id !== "surtr") return;

  boss._surtrTurnAction = "normal";
  boss._surtrDuelTarget = null;

  if(boss._muspelPending){
    boss._muspelPending = false;
    boss._surtrTurnAction = "march";
    bossAllTargetAttack(boss, participants, battleLog, 0.8, "공격");
    return;
  }

  const roll = Math.random() * 100;
  if(roll < 20){
    if(!beginBossSpecial(boss,"프레이르와의 결투",battleLog)){boss._surtrTurnAction="blocked";return;}
    const target = getStrongestAliveFish(participants);
    if(target){
      boss._surtrTurnAction = "duel";
      boss._surtrDuelTarget = target;
      battleLog.push(bossColor(boss.name, boss) + "의 프레이르와의 결투\n" + color(lineFish(target), target.grade) + "와 1대1 결투를 시작합니다.\n다른 물고기는 이번 턴에 행동하지 않습니다.");
    }
    return;
  }

  if(roll < 35){
    if(!beginBossSpecial(boss,"무스펠의 진군 준비",battleLog)){boss._surtrTurnAction="blocked";return;}
    boss._surtrTurnAction = "prepare";
    boss._muspelPending = true;
    battleLog.push(bossColor(boss.name, boss) + "가 무스펠의 진군을 준비합니다.\n이번 턴에는 공격하지 않고 다음 턴 시작 시 전체 공격을 사용합니다.");
  }
}

function applyPhoenixImmortalityIfNeeded(boss, bossHp, battleLog){
  if(boss.id !== "phoenix") return bossHp;
  if(bossHp > 0) return bossHp;
  if(boss._revived) return bossHp;

  boss._revived = true;
  bossHp = Math.floor(boss.hp * 0.5);
  battleLog.push(bossColor(boss.name, boss) + "의 불사\n체력 50%로 1회 부활했습니다.\n\n" + hpBar(bossHp, boss.hp));
  return bossHp;
}

function applyBossStartTurnEffects(participants, battleLog){
  participants.forEach(f => {
    const c = ensureCombatStats(f);
    if(!isBattleActionableFish(f)) return;

    const poison = Math.min(3, Number(c.poisonStacks || 0));
    if(poison <= 0) return;

    const damage = Math.floor(c.maxHp * 0.02 * poison);
    applyDamageToFish(f,damage,battleLog,color(lineFish(f),f.grade)+"\n독 "+poison+"중첩\n",{statusDamage:true});
  });
}

function applyBossEndTurnPassive(boss, bossHp, battleLog){
  if((boss.id === "hydra" || boss.id === "tiamat") && bossHp > 0 && !boss._healingSealed){
    const rate = boss.id === "hydra" ? 0.05 : 0.02;
    const heal = Math.floor(boss.hp * rate);
    const before = bossHp;
    bossHp = Math.min(boss.hp, bossHp + heal);
    if(bossHp > before) battleLog.push(bossColor(boss.name, boss) + "가 회복했습니다.\n" + (bossHp - before).toLocaleString() + " 회복\n\n" + hpBar(bossHp, boss.hp));
  }

  if(boss.id === "leviathan" && bossHp > 0 && bossHp <= boss.hp * 0.5 && !boss._enraged){
    boss._enraged = true;
    battleLog.push(bossColor(boss.name, boss) + "이 분노했습니다!\n공격력이 증가했습니다.");
  }

  return bossHp;
}

function spawnBabyDragons(boss, battleLog){
  if(!boss._summons) boss._summons = [];

  for(let i=0;i<3;i++){
    const babyHp = randomInt(100000, 300000);
    const babyAttack = randomInt(10000, 30000);
    boss._summons.push({name:"새끼 용", hp:babyHp, maxHp:babyHp, attack:babyAttack});
  }

  battleLog.push(bossColor(boss.name, boss) + "의 괴수 탄생 (15%)\n새끼 용 3마리를 소환했습니다.");
}

function getAliveSummons(boss){
  return (boss._summons || []).filter(x => x.hp > 0);
}

function fishAttackTargetText(target, boss){
  if(target.type === "boss") return bossColor(boss.name, boss) + "\n" + hpBar(target.hp, boss.hp);
  return target.name + "\n" + hpBar(target.hp, target.maxHp);
}

function babyDragonActions(boss, participants, battleLog){
  const summons = getAliveSummons(boss);
  if(summons.length === 0) return;

  summons.forEach((dragon, i) => {
    const alive = getAliveTargets(participants);
    if(alive.length === 0) return;

    const f = alive[Math.floor(Math.random() * alive.length)];
    const c = ensureCombatStats(f);
    const dodgeRoll = Math.random() * 100 < c.dodge;

    if(dodgeRoll){
      battleLog.push("새끼 용 " + (i+1) + "의 공격\n" + color(lineFish(f), f.grade) + " 회피");
      return;
    }

    applyDamageToFish(f, dragon.attack, battleLog, "새끼 용 " + (i+1) + "의 공격\n");
  });
}

function runFenrirTyrHand(boss, participants, battleLog){
  const target = getStrongestAliveFish(participants);
  if(!target) return;

  const hit = bossAttackSpecificTarget(boss, target, battleLog, 1.3, "티르의 오른손", false);
  boss._fenrirNextAttackBonus = 0;

  if(hit){
    boss._fenrirNextAttackBonus = Math.floor(ensureCombatStats(target).attack * 0.4);
    battleLog.push(bossColor(boss.name, boss) + "가 " + color(lineFish(target), target.grade) + "의 공격력 40%를 빼앗았습니다.\n다음 공격 추가 공격력 : " + boss._fenrirNextAttackBonus.toLocaleString());
  }
}

function runFenrirDevour(boss, participants, battleLog){
  const target = getStrongestAliveFish(participants);
  if(!target) return;

  const c = ensureCombatStats(target);
  c.devouredByFenrir = true;
  boss._devouredFish = target;
  boss._devourCritThisTurn = false;
  battleLog.push(bossColor(boss.name, boss) + "의 신을 삼키는 자\n" + color(lineFish(target), target.grade) + "를 삼켰습니다.\n다음 턴에 남은 물고기가 치명타 피해를 주면 구출할 수 있습니다.");
}

function getFishByHighest(participants, getter){
  return getAliveTargets(participants).sort((a,b) => getter(b) - getter(a))[0] || null;
}

function runCerberusJudgment(boss, participants, battleLog){
  const hpRate = Number(boss._currentHp || boss.hp) / boss.hp;
  const heads = hpRate > 0.66 ? 3 : (hpRate > 0.33 ? 2 : 1);
  const targets = [
    getFishByHighest(participants, f => ensureCombatStats(f).attack),
    getFishByHighest(participants, f => ensureCombatStats(f).maxHp),
    getFishByHighest(participants, f => ensureCombatStats(f).critRate)
  ];
  battleLog.push(bossColor(boss.name, boss) + "의 세 머리의 판결\n남은 머리 : " + heads);
  for(let i=0;i<heads;i++) bossAttackSpecificTarget(boss, targets[i], battleLog, 0.6, "세 머리의 판결", false);
}

function runCerberusDeadWeight(boss, participants, battleLog){
  const target = getAliveTargets(participants).sort((a,b) => ensureCombatStats(a).hp - ensureCombatStats(b).hp)[0];
  if(!target) return;
  const c = ensureCombatStats(target);
  const lostRate = 1 - c.hp / c.maxHp;
  bossAttackSpecificTarget(boss, target, battleLog, 1.2 + lostRate, "망자의 무게", false);
}

function refreshRootLinks(boss, participants, battleLog){
  let links = (boss._rootLinks || []).filter(f => isBattleActionableFish(f));
  const available = getAliveTargets(participants).filter(f => !links.includes(f));
  if(links.length === 0){
    while(links.length < 2 && available.length){
      links.push(available.splice(Math.floor(Math.random()*available.length),1)[0]);
    }
  } else if(links.length < 3 && available.length){
    links.push(available.splice(Math.floor(Math.random()*available.length),1)[0]);
  }
  boss._rootLinks = links;
  boss._rootLinkTurns = 3;
  links.forEach(f => ensureCombatStats(f).rootLinkedPeers = links);
  links.forEach(f => registerTraitStatus(f,battleLog));
  battleLog.push(bossColor(boss.name, boss) + "의 뿌리의 연결\n" + links.map(f => color(lineFish(f), f.grade)).join("\n") + "\n연결 지속 : 2턴");
}

function runRatatoskr(boss, participants, battleLog){
  const attacker = getStrongestAliveFish(participants);
  if(!attacker) return;
  ensureCombatStats(attacker).ratatoskrRedirect = true;
  battleLog.push(bossColor(boss.name, boss) + "의 라타토스크의 이간질\n" + color(lineFish(attacker), attacker.grade) + "의 다음 공격이 아군을 향합니다.");
}

function getCurseCount(f){
  return Object.values(ensureCombatStats(f).azhiCurses || {}).filter(Boolean).length;
}

function triggerThreeCalamities(f, battleLog){
  const c = ensureCombatStats(f);
  if(getCurseCount(f) < 3) return;
  const damage = Math.floor(c.maxHp * 0.2);
  c.azhiCurses = {};
  applyDamageToFish(f,damage,battleLog,"세 가지 재앙 폭발\n최대 체력의 20% 피해\n",{fromBoss:true,isSpecial:true,skillName:"세 가지 재앙 폭발"});
}

function applyAzhiCurse(boss, f, curse, label, participants, battleLog){
  if(!f || ensureCombatStats(f).hp <= 0) return;
  const c = ensureCombatStats(f);
  if(!c.azhiCurses) c.azhiCurses = {};
  c.azhiCurses[curse] = true;
  registerTraitStatus(f,battleLog);
  bossAttackSpecificTarget(boss, f, battleLog, 0.65, "세 머리의 선택 - " + label, false);
  triggerThreeCalamities(f, battleLog);
}

function runAzhiChoice(boss, participants, battleLog){
  applyAzhiCurse(boss, getFishByHighest(participants,f=>ensureCombatStats(f).attack), "weakness", "쇠약", participants, battleLog);
  applyAzhiCurse(boss, getFishByHighest(participants,f=>ensureCombatStats(f).dodge), "fear", "공포", participants, battleLog);
  applyAzhiCurse(boss, getFishByHighest(participants,f=>ensureCombatStats(f).critRate), "distrust", "불신", participants, battleLog);
}

function runAzhiConcentration(boss, participants, battleLog){
  const alive = getAliveTargets(participants);
  const target = alive.sort((a,b)=>getCurseCount(b)-getCurseCount(a))[0];
  if(!target) return;
  const tc = ensureCombatStats(target);
  if(!tc.azhiCurses) tc.azhiCurses = {};
  let moved = 0;
  alive.filter(f=>f!==target).forEach(f=>{
    const c = ensureCombatStats(f);
    const key = Object.keys(c.azhiCurses || {}).find(k => c.azhiCurses[k] && !tc.azhiCurses[k]);
    if(key){ delete c.azhiCurses[key]; tc.azhiCurses[key] = true; moved++; }
  });
  if(moved === 0) return bossAttackSpecificTarget(boss, target, battleLog, 1.6, "재앙 집중", false);
  battleLog.push(bossColor(boss.name, boss) + "의 재앙 집중\n" + moved + "개의 재앙이 " + color(lineFish(target), target.grade) + "에게 이동했습니다.");
  triggerThreeCalamities(target, battleLog);
}

function prepareTyphonWeather(boss, battleLog){
  if(boss.id !== "typhon") return;
  const weather = ["headwind","turbulence","eye"][Math.floor(Math.random()*3)];
  boss._typhonWeather = weather;
  boss.critRate = boss._baseCritRate;
  boss.critDamage = boss._baseCritDamage;
  let text = "역풍 - 물고기 공격력 -20%, 타이폰 공격력 +10%";
  if(weather === "turbulence") text = "난기류 - 물고기 회피율 -10%, 타이폰 회피율 +10%";
  if(weather === "eye"){
    boss.critRate += 15;
    boss.critDamage += 50;
    text = "폭풍의 눈 - 물고기 회피 불가, 타이폰 치명타 강화";
  }
  battleLog.push(bossColor(boss.name, boss) + "의 폭풍의 지배자\n" + text);
}

function runTyphonEcho(boss, participants, battleLog){
  const f = boss._lastTopDamageFish;
  if(!f || ensureCombatStats(f).hp <= 0 || !boss._lastTopDamage){
    return bossSingleTargetAttack(boss, participants, battleLog, 1.3, "폭풍의 반향", false);
  }
  const c = ensureCombatStats(f);
  const damage = Math.min(Math.floor(boss._lastTopDamage * 0.3), Math.floor(c.maxHp * 0.25));
  applyDamageToFish(f, damage, battleLog, bossColor(boss.name, boss) + "의 폭풍의 반향\n회피 불가\n");
}

function runTyphonFall(boss, participants, battleLog){
  const a = getFishByHighest(participants,f=>ensureCombatStats(f).attack);
  const h = getFishByHighest(participants,f=>ensureCombatStats(f).maxHp);
  if(!a || !h) return;
  if(a === h) return bossAttackSpecificTarget(boss, a, battleLog, 1.7, "대지와 하늘의 추락", false);
  const ac=ensureCombatStats(a), hc=ensureCombatStats(h);
  const lower=Math.min(ac.hp/ac.maxHp,hc.hp/hc.maxHp);
  ac.hp=Math.max(1,Math.floor(ac.maxHp*lower)); hc.hp=Math.max(1,Math.floor(hc.maxHp*lower));
  battleLog.push(bossColor(boss.name,boss)+"의 대지와 하늘의 추락\n두 대상의 체력 비율이 "+Math.floor(lower*100)+"%로 추락했습니다.\n\n"+color(lineFish(a),a.grade)+"\n"+hpBar(ac.hp,ac.maxHp)+"\n\n"+color(lineFish(h),h.grade)+"\n"+hpBar(hc.hp,hc.maxHp));
}

function reduceExistence(boss, f, amount, battleLog, reason){
  if(!f || ensureCombatStats(f).hp <= 0) return;
  const c=ensureCombatStats(f);
  c.existence=Math.max(0,Number(c.existence===undefined?3:c.existence)-amount);
  battleLog.push(reason+"\n"+color(lineFish(f),f.grade)+"\n존재 : "+c.existence+" / 3");
  if(c.existence<=0){
    const prevented=traitModifyIncoming(f,c.hp,battleLog,{forced:true,fromBoss:true,isSpecial:true,skillName:"존재 말살"});
    if(prevented.damage<c.hp){c.hp=Math.max(1,c.hp-prevented.damage+prevented.afterHeal);c.existence=1;battleLog.push(color(lineFish(f),f.grade)+"\n존재 말살로부터 되돌아왔습니다.");}
    else{stunFish(f);battleLog.push(color(lineFish(f),f.grade)+"\n존재가 말살되어 회복 중입니다.");}
  }
}

function runExistenceAnnihilation(boss, participants, battleLog){
  const target=getStrongestAliveFish(participants); if(!target) return;
  const before=ensureCombatStats(target).hp;
  bossAttackSpecificTarget(boss,target,battleLog,boss._eternalNight?2.2:1.8,"존재 말살",false);
  if(ensureCombatStats(target).hp<=0 && before>0){
    const other=getAliveTargets(participants).filter(f=>f!==target); if(other.length) reduceExistence(boss,other[Math.floor(Math.random()*other.length)],1,battleLog,"존재 말살 전이");
  } else reduceExistence(boss,target,1,battleLog,"존재 말살");
}

function runCreationCollapse(boss, participants, battleLog){
  const rate=boss._eternalNight?0.2:0.15;
  getAliveTargets(participants).forEach(f=>{
    const c=ensureCombatStats(f), damage=Math.floor(c.maxHp*rate);
    c.hp=Math.max(1,c.hp-damage);
    battleLog.push(bossColor(boss.name,boss)+"의 창조의 붕괴\n"+color(lineFish(f),f.grade)+"\n"+damage.toLocaleString()+" 피해\n\n"+hpBar(c.hp,c.maxHp));
    if(c.hp/c.maxHp<=0.4) reduceExistence(boss,f,1,battleLog,"창조의 붕괴");
  });
}

function runBossAction(boss, participants, battleLog){
  if(boss.id === "cerberus"){
    const r=Math.random()*100;
    if(r<20) return runBossSpecial(boss,"세 머리의 판결",battleLog,()=>runCerberusJudgment(boss,participants,battleLog));
    if(r<35) return runBossSpecial(boss,"망자의 무게",battleLog,()=>runCerberusDeadWeight(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "nidhogg"){
    const r=Math.random()*100;
    if(r<20) return runBossSpecial(boss,"뿌리의 연결",battleLog,()=>refreshRootLinks(boss,participants,battleLog));
    if(r<35) return runBossSpecial(boss,"라타토스크의 이간질",battleLog,()=>runRatatoskr(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "azhi_dahaka"){
    const r=Math.random()*100;
    if(r<25) return runBossSpecial(boss,"세 머리의 선택",battleLog,()=>runAzhiChoice(boss,participants,battleLog));
    if(r<40) return runBossSpecial(boss,"재앙 집중",battleLog,()=>runAzhiConcentration(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "typhon"){
    const r=Math.random()*100;
    if(r<20) return runBossSpecial(boss,"폭풍의 반향",battleLog,()=>runTyphonEcho(boss,participants,battleLog));
    if(r<35) return runBossSpecial(boss,"대지와 하늘의 추락",battleLog,()=>runTyphonFall(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "angra_mainyu"){
    const r=Math.random()*100;
    if(r<20) return runBossSpecial(boss,"존재 말살",battleLog,()=>runExistenceAnnihilation(boss,participants,battleLog));
    if(r<35) return runBossSpecial(boss,"창조의 붕괴",battleLog,()=>runCreationCollapse(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "fenrir"){
    const r = Math.random() * 100;
    if(r < 20) return runBossSpecial(boss,"티르의 오른손",battleLog,()=>runFenrirTyrHand(boss, participants, battleLog));
    if(r < 35 && Number(boss._gleipnirKnots || 0) <= 0 && !boss._devouredFish){
      return runBossSpecial(boss,"신을 삼키는 자",battleLog,()=>runFenrirDevour(boss, participants, battleLog));
    }
    bossSingleTargetAttack(boss, participants, battleLog, 1, "공격", false);
    boss._fenrirNextAttackBonus = 0;
    return;
  }

  if(boss.id === "surtr"){
    if(boss._surtrTurnAction === "normal") bossSingleTargetAttack(boss, participants, battleLog, 1, "공격", false);
    return;
  }

  if(boss.id === "phoenix"){
    const r = Math.random() * 100;
    if(r < 25) return bossSingleTargetAttack(boss, participants, battleLog, 1, "재의 낙인", false, {burn:true,isSpecial:true});
    if(r < 40) return bossAllTargetAttack(boss, participants, battleLog, 1.5, "윤회의 불꽃", {burnBonus:true,isSpecial:true});
    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "bahamut"){
    const r = Math.random() * 100;

    if(r < 15){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 3, "메가 플레어", false,{isSpecial:true})) return;
      boss._fishDisabledNextTurn = true;
      battleLog.push(bossColor(boss.name, boss) + "의 메가 플레어 여파\n다음 턴 참가 물고기 전체가 행동할 수 없습니다.");
      return;
    }

    if(r < 40){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 1.5, "용왕의 포효", false,{isSpecial:true})) return;
      boss._bahamutAttackBonus = Number(boss._bahamutAttackBonus || 0) + Math.floor(boss.attack * 0.5);
      battleLog.push(bossColor(boss.name, boss) + "의 공격력이 누적 증가했습니다.\n현재 공격력 : " + (boss.attack + boss._bahamutAttackBonus).toLocaleString());
      return;
    }

    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "tiamat"){
    const r = Math.random() * 100;
    if(r < 25) return bossSingleTargetAttack(boss, participants, battleLog, 2, "창세의 바다", false,{isSpecial:true});
    if(r < 40) return runBossSpecial(boss,"괴수 탄생",battleLog,()=>spawnBabyDragons(boss, battleLog));
    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "jormungandr"){
    const r = Math.random() * 100;
    if(r < 25){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 2, "미드가르드 감기", false,{isSpecial:true})) return;
      boss._ring = Math.min(3, Number(boss._ring || 0) + 1);
      if(boss._ring >= 3 && !boss._ringCompleted){
        boss._ringCompleted = true;
        boss._attackBoost = Math.max(Number(boss._attackBoost || 0), 0.5);
        battleLog.push(bossColor(boss.name, boss) + "의 세계의 고리가 완성되었습니다.\n공격력 증가 한도가 100%로 확장되고 힘이 더 강해졌습니다.");
      } else {
        battleLog.push(bossColor(boss.name, boss) + "의 세계의 고리 " + boss._ring + " / 3");
      }
      return;
    }
    if(r < 40) return bossSingleTargetAttack(boss, participants, battleLog, 1.2, "종말의 독", false, {poison:true,isSpecial:true});
    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  const skillRoll = Math.random() * 100 < (boss.skillRate || 20);

  if(skillRoll){
    if(boss.id === "kraken") bossSingleTargetAttack(boss, participants, battleLog, 1.5, boss.skillName, false,{isSpecial:true});
    else if(boss.id === "hydra") bossSingleTargetAttack(boss, participants, battleLog, 1.8, boss.skillName, false,{isSpecial:true});
    else if(boss.id === "leviathan") bossAllTargetAttack(boss, participants, battleLog, 1, boss.skillName,{isSpecial:true});
    else if(boss.id === "behemoth") bossSingleTargetAttack(boss, participants, battleLog, 2.5, boss.skillName, false,{isSpecial:true});
    else bossSingleTargetAttack(boss, participants, battleLog, 1, boss.skillName || "공격", false,{isSpecial:true});
  } else {
    if(boss.id === "kraken") bossSingleTargetAttack(boss, participants, battleLog, 1.2, "먹물 난사", true);
    else bossSingleTargetAttack(boss, participants, battleLog, 1, "공격", false);
  }
}

function cleanupBattleEffects(participants){
  participants.forEach(f => {
    const c = ensureCombatStats(f);
    delete c.burnStacks;
    delete c.poisonStacks;
    delete c.devouredByFenrir;
    delete c.rootLinkedPeers;
    delete c.battleDown;
    delete c.ratatoskrRedirect;
    delete c.azhiCurses;
    delete c.existence;
    if(c._preErosionMaxHp){
      const oldMaxHp = Math.max(1, Number(c.maxHp || c._preErosionMaxHp || 1));
      const hpRate = c.hp > 0 ? clamp(Number(c.hp || 0) / oldMaxHp, 0, 1) : 0;
      c.maxHp = c._preErosionMaxHp;
      if(c.hp > 0) c.hp = Math.max(1, Math.min(c.maxHp, Math.floor(c.maxHp * hpRate)));
      delete c._preErosionMaxHp;
    }
    if(c._traitBattle){
      const oldMaxHp = Math.max(1, Number(c.maxHp || c._traitBattle.originalMaxHp || 1));
      const hpRate = c.hp > 0 ? clamp(Number(c.hp || 0) / oldMaxHp, 0, 1) : 0;
      if(c._traitBattle.originalMaxHp) c.maxHp=c._traitBattle.originalMaxHp;
      if(c.hp>0) c.hp=Math.max(1, Math.min(c.maxHp, Math.floor(c.maxHp * hpRate)));
      delete c._traitBattle;
    }
  });
}

function getPreparedRecoveryFishes(){
  return bossPrepIndexes
    .map(idx => bucket[idx])
    .filter(f => f && f.grade !== "쓰레기" && getCombatStatusText(f) !== "정상");
}

function runBossBattle(){
  if(!isBossMenu) return print("보스전에 입장한 뒤 사용할 수 있습니다.");
  recoverStunnedFish();

  const selectedBoss = getCurrentBoss();
  if(isBossCooldownActive(selectedBoss.id)) return print("아직 보스전 쿨타임이 남아있습니다.\n\n남은 시간 : " + formatRemain(getBossCooldownLeft(selectedBoss.id)));
  if(bossPrepIndexes.length === 0) return print("준비된 물고기가 없습니다.\n준비 번호 를 입력하세요.");

  const recoveryFishes = getPreparedRecoveryFishes();
  if(recoveryFishes.length > 0 && !pendingRecoveryBattleConfirm){
    let msg = "회복 중인 물고기가 포함되어 있습니다.\n\n";
    recoveryFishes.forEach(f => {
      msg += color(lineFish(f), f.grade) + "\n";
      msg += "상태 : " + getCombatStatusText(f) + "\n\n";
    });
    msg += "회복 중인 물고기도 전투에 참가합니다.\n\n계속하려면 전투 확인 을 입력하세요.";
    pendingRecoveryBattleConfirm = true;
    return print(msg.trim());
  }

  pendingRecoveryBattleConfirm = false;

  const boss = {
    ...getCurrentBoss(),
    _enraged:false,
    _revived:false,
    _damageRecord:0,
    _fishDisabledNextTurn:false,
    _bahamutAttackBonus:0,
    _summons:[],
    _attackBoost:0,
    _ring:0,
    _ringCompleted:false,
    _gleipnirKnots:6,
    _knotsBrokenThisTurn:0,
    _fenrirNextAttackBonus:0,
    _devouredFish:null,
    _devourCritThisTurn:false,
    _flameSwordHp:30000000,
    _flameSwordBroken:false,
    _lastDamageToSword:0,
    _muspelPending:false,
    _surtrTurnAction:"normal",
    _surtrDuelTarget:null,
    _rootLinks:[],
    _rootLinkTurns:0,
    _erosionStacks:0,
    _baseCritRate:selectedBoss.critRate,
    _baseCritDamage:selectedBoss.critDamage,
    _typhonWeather:null,
    _lastTopDamageFish:null,
    _lastTopDamage:0,
    _thisTurnTopDamageFish:null,
    _thisTurnTopDamage:0,
    _existenceWaves:{75:false,50:false,25:false},
    _eternalNight:false
  };

  if(!isBossUnlocked(boss)) return print("아직 해금되지 않은 보스입니다.");
  if(isBossCooldownActive(boss.id)) return print("아직 보스전 쿨타임이 남아있습니다.\n\n남은 시간 : " + formatRemain(getBossCooldownLeft(boss.id)));

  let bossHp = getBossHp(boss);
  let totalDamage = 0;
  const participants = getAlivePreparedFishes();
  const battleLog = [];
  let result = "처치 실패";
  let rewardMoney = 0;
  let rewardDrop = "";
  let rewardDropCount = 0;

  if(participants.length === 0) return print("전투 가능한 물고기가 없습니다.");

  cleanupBattleEffects(participants);
  initTraitBattle(participants,boss,battleLog);
  boss._currentHp=bossHp;

  if(boss.id === "angra_mainyu") participants.forEach(f => ensureCombatStats(f).existence = 3);

  battleLog.push("전투 시작\n\n" + participants.map(f => color(lineFish(f), f.grade) + "\n" + hpBar(ensureCombatStats(f).hp, ensureCombatStats(f).maxHp)).join("\n\n"));

  let turn = 1;
  while(bossHp > 0 && participants.some(f => isBattleActionableFish(f)) && turn <= 200){
    boss._fishDisabledThisTurn = !!boss._fishDisabledNextTurn;
    boss._fishDisabledNextTurn = false;
    boss._knotsBrokenThisTurn = 0;
    if(boss._devouredFish) boss._devourCritThisTurn = false;
    boss._thisTurnTopDamage = 0;
    boss._thisTurnTopDamageFish = null;

    battleLog.push("턴 " + turn);
    startTraitTurn(turn,boss,battleLog);

    if(boss.id === "nidhogg"){
      if(boss._rootLinkTurns > 0){
        boss._rootLinkTurns--;
        if(boss._rootLinkTurns <= 0){
          (boss._rootLinks || []).forEach(f => delete ensureCombatStats(f).rootLinkedPeers);
          boss._rootLinks = [];
          battleLog.push(bossColor(boss.name,boss) + "의 뿌리 연결이 풀렸습니다.");
        }
      }
      if(turn % 4 === 0 && boss._erosionStacks < 5){
        boss._erosionStacks++;
        participants.forEach(f => {
          const c=ensureCombatStats(f);
          if(!c._preErosionMaxHp) c._preErosionMaxHp=c.maxHp;
          const newMax=Math.max(1,Math.floor(c._preErosionMaxHp*(1-boss._erosionStacks*0.05)));
          c.maxHp=newMax; c.hp=Math.min(c.hp,newMax);
        });
        battleLog.push(bossColor(boss.name,boss)+"의 세계수 침식\n최대 체력 -"+(boss._erosionStacks*5)+"%");
      }
    }

    prepareTyphonWeather(boss,battleLog);

    if(boss._fishDisabledThisTurn){
      battleLog.push(bossColor(boss.name, boss) + "의 메가 플레어 여파\n참가 물고기 전체가 이번 턴 행동할 수 없습니다.");
    }

    if(boss.id === "jormungandr"){
      const limit = boss._ringCompleted ? 1.0 : 0.5;
      const before = Number(boss._attackBoost || 0);
      boss._attackBoost = Math.min(limit, before + 0.05);
      if(boss._attackBoost > before){
        battleLog.push(bossColor(boss.name, boss) + "의 세계를 감은 자\n공격력 증가 : +" + Math.round(boss._attackBoost * 100) + "%");
      }
    }

    applyBossStartTurnEffects(participants, battleLog);
    tryTimeRewindAfterWipe(battleLog);
    if(!participants.some(f => isBattleActionableFish(f))) break;

    const blankPageFish=turn%4===0?traitFish(participants,"잃어버린 두 번째 편지 조각 ✉️"):null;
    if(!blankPageFish) prepareSurtrTurn(boss, participants, battleLog);
    if(!participants.some(f => isBattleActionableFish(f))) break;

    battleLog.push('<span style="color:#58a6ff;font-weight:700">내 턴</span>');

    for(const f of participants){
      const c = ensureCombatStats(f);
      if(!isBattleActionableFish(f)) continue;
      if(bossHp <= 0) break;

      if(c.devouredByFenrir){
        battleLog.push(color(lineFish(f), f.grade) + "\n펜리르에게 삼켜져 이번 턴에 행동할 수 없습니다.");
        continue;
      }

      if(boss.id === "surtr" && boss._surtrTurnAction === "duel" && f !== boss._surtrDuelTarget){
        battleLog.push(color(lineFish(f), f.grade) + "\n프레이르와의 결투가 진행 중이어서 이번 턴에 행동하지 않습니다.");
        continue;
      }

      if(boss._fishDisabledThisTurn){
        battleLog.push(color(lineFish(f), f.grade) + "\n메가 플레어의 여파로 행동할 수 없습니다.");
        continue;
      }

      if(c.ratatoskrRedirect){
        delete c.ratatoskrRedirect;
        const allies=getAliveTargets(participants).filter(x=>x!==f).sort((a,b)=>ensureCombatStats(b).hp-ensureCombatStats(a).hp);
        const ally=allies[0];
        if(ally){
          const ac=ensureCombatStats(ally);
          if(Math.random()*100 < getEffectiveFishDodge(ally,boss)){
            battleLog.push("라타토스크의 이간질\n"+color(lineFish(f),f.grade)+"의 공격을 "+color(lineFish(ally),ally.grade)+"이 회피했습니다.");
          } else {
            const redirected=calcDamage(getEffectiveFishAttack(f,boss),getEffectiveFishCritRate(f),c.critDamage);
            applyDamageToFish(ally,redirected.damage,battleLog,"라타토스크의 이간질\n"+color(lineFish(f),f.grade)+"의 아군 공격\n"+(redirected.crit?"치명타!\n":""));
          }
          continue;
        }
      }

      const summons = getAliveSummons(boss);
      const targetSummon = summons.length > 0 ? summons[0] : null;

      if(targetSummon){
        const ts=traitAttackStats(f,boss,battleLog);
        const preAttackText=traitPreAttackText(f);
        const hit = ts.replaced ? {damage:ts.attack,crit:false} : calcDamage(ts.attack, getEffectiveFishCritRate(f), ts.critDamage);
        const dealt=Math.max(1,Math.floor(hit.damage*ts.multiplier+ts.extra));
        targetSummon.hp = Math.max(0, targetSummon.hp - dealt);
        totalDamage += dealt;

        let entry = (preAttackText ? preAttackText + "\n" : "") + color(lineFish(f), f.grade) + " 공격\n";
        if(hit.crit) entry += "치명타!\n";
        entry += dealt.toLocaleString() + " 피해\n\n";
        entry += targetSummon.name + "\n" + hpBar(targetSummon.hp, targetSummon.maxHp);
        battleLog.push(entry);

        if(targetSummon.hp <= 0){
          battleLog.push(targetSummon.name + "을 쓰러뜨렸습니다.");
        }
        continue;
      }

      const duelAttack = boss.id === "surtr" && boss._surtrTurnAction === "duel" && f === boss._surtrDuelTarget;
      if(duelAttack || Math.random() * 100 >= getEffectiveBossDodge(boss)){
        const ts=traitAttackStats(f,boss,battleLog);
        const preAttackText=traitPreAttackText(f);
        const hit = ts.replaced ? {damage:ts.attack,crit:false} : calcDamage(ts.attack, getEffectiveFishCritRate(f), ts.critDamage);
        const rawDamage=Math.max(1,Math.floor(hit.damage*ts.multiplier+ts.extra));
        let damage = applyBossPassiveBeforeFishAttack(boss, rawDamage, battleLog);
        bossHp = Math.max(0, bossHp - damage);
        boss._currentHp = bossHp;
        totalDamage += damage + Number(boss._lastDamageToSword || 0);

        if(boss.id === "typhon" && damage > boss._thisTurnTopDamage){
          boss._thisTurnTopDamage=damage;
          boss._thisTurnTopDamageFish=f;
        }

        let entry = (preAttackText ? preAttackText + "\n" : "") + color(lineFish(f), f.grade) + " 공격\n";
        if(hit.crit) entry += "치명타!\n";
        if(boss.id === "behemoth" && damage < hit.damage) entry += "베히모스가 피해를 감소시켰습니다.\n";
        if(boss.id === "surtr" && Number(boss._lastDamageToSword || 0) > 0){
          entry += "\n수르트가 피해를 불꽃의 검과 나눠 받았습니다.\n\n";
          entry += "수르트 : " + damage.toLocaleString() + " 피해\n";
          entry += "불꽃의 검 : " + Number(boss._lastDamageToSword || 0).toLocaleString() + " 피해\n";
          entry += "검 내구도 : " + Number(boss._flameSwordHp || 0).toLocaleString() + " / 30,000,000\n";
          if(boss._flameSwordJustBroken) entry += "\n불꽃의 검이 파괴되었습니다.\n이후 수르트가 받는 피해가 30% 증가합니다.\n";
          entry += "\n";
        } else {
          entry += damage.toLocaleString() + " 피해\n\n";
        }
        entry += bossColor(boss.name, boss) + "\n" + hpBar(bossHp, boss.hp);
        battleLog.push(entry);

        afterFishAttackTrait(f,boss,hit.crit?"crit":"hit",ts.attack,battleLog);
        bossHp=Math.max(0,Number(boss._currentHp));
        totalDamage+=Number(activeTraitBattle.traitDamage||0);
        activeTraitBattle.traitDamage=0;

        handleFenrirCriticalHit(boss, hit, battleLog);

        if(boss.id === "angra_mainyu"){
          [75,50,25].forEach(threshold=>{
            if(!boss._existenceWaves[threshold] && bossHp <= boss.hp*threshold/100){
              boss._existenceWaves[threshold]=true;
              const alive=getAliveTargets(participants);
              if(alive.length) reduceExistence(boss,alive[Math.floor(Math.random()*alive.length)],1,battleLog,"파멸의 파동 (체력 "+threshold+"%)");
            }
          });
          if(bossHp <= boss.hp*0.25 && !boss._eternalNight){
            boss._eternalNight=true;
            battleLog.push(bossColor(boss.name,boss)+"의 영겁의 밤\n공격력 30% 증가, 회피율 0%\n존재 말살과 창조의 붕괴가 강화됩니다.");
          }
        }

        bossHp = applyPhoenixImmortalityIfNeeded(boss, bossHp, battleLog);
        boss._currentHp = bossHp;

        if(duelAttack && bossHp > 0){
          bossAttackSpecificTarget(boss, f, battleLog, 1.8, "프레이르와의 결투", true);
        }
      } else {
        traitAttackStats(f,boss,battleLog);
        const preAttackText=traitPreAttackText(f);
        battleLog.push((preAttackText ? preAttackText + "\n" : "") + color(lineFish(f), f.grade) + " 공격\n" + bossColor(boss.name, boss) + " 회피");
        afterFishAttackTrait(f,boss,"miss",getEffectiveFishAttack(f,boss),battleLog);
        bossHp=Math.max(0,Number(boss._currentHp));
        totalDamage+=Number(activeTraitBattle.traitDamage||0);
        activeTraitBattle.traitDamage=0;
      }
    }

    endFishTraitTurn(boss,battleLog);

    resolveFenrirDevour(boss, bossHp, battleLog);

    if(bossHp <= 0) break;

    bossHp=Math.max(0,Number(boss._currentHp));
    if(bossHp<=0) break;
    if(!participants.some(f => isBattleActionableFish(f))){
      tryTimeRewindAfterWipe(battleLog);
      if(!participants.some(f => isBattleActionableFish(f))) break;
    }
    bossHp = applyBossEndTurnPassive(boss, bossHp, battleLog);
    boss._currentHp = bossHp;
    battleLog.push('<span style="color:#ff7b72;font-weight:700">보스 턴</span>');
    if(blankPageFish){
      battleLog.push(traitUseByFish(blankPageFish, "보스의 이번 페이지에는 아무 내용도 적혀 있지 않습니다.\n보스가 이번 턴에 행동하지 못합니다."));
    }else{
      runBossAction(boss, participants, battleLog);
      babyDragonActions(boss, participants, battleLog);
    }

    bossHp=Math.max(0,Number(boss._currentHp));
    totalDamage+=Number(activeTraitBattle.traitDamage||0);
    activeTraitBattle.traitDamage=0;
    tryTimeRewindAfterWipe(battleLog);
    finishTraitTurn(boss,battleLog);
    bossHp=Math.max(0,Number(boss._currentHp));

    if(boss.id === "typhon"){
      boss._lastTopDamage=boss._thisTurnTopDamage;
      boss._lastTopDamageFish=boss._thisTurnTopDamageFish;
    }

    turn++;
  }

  if(bossHp <= 0){
    result = "처치 성공";
    const firstClear = isBossFirstClear(boss);
    rewardMoney = firstClear ? boss.reward : 0;
    rewardDrop = boss.drop;
    rewardDropCount = randomInt(1, 10);

    if(rewardMoney > 0){
      money = normalizeMoney(money + rewardMoney);
      totalEarned = normalizeMoney(totalEarned + rewardMoney);
    }

    addMaterial(rewardDrop, rewardDropCount);
    bossProgress.defeated[boss.id] = true;
    bossProgress.hp[boss.id] = boss.hp;

    battleLog.push("보스 코어 보상\n" + rewardDrop + " x" + rewardDropCount.toLocaleString() + " 획득");

    if(firstClear){
      battleLog.push("최초 클리어 보상\n" + formatMoney(rewardMoney) + " 획득");
    } else {
      battleLog.push("재도전 클리어\n이미 최초 클리어 보상을 획득한 보스입니다.\n상금은 지급되지 않습니다.");
    }

    const nextBoss = bossList.find(b => isBossUnlocked(b) && !bossProgress.defeated[b.id]);
    if(nextBoss){
      bossProgress.selectedBossId = nextBoss.id;
      if(!bossProgress.hp[nextBoss.id]) bossProgress.hp[nextBoss.id] = nextBoss.hp;
    }
  } else {
    bossProgress.hp[boss.id] = boss.hp;
    battleLog.push(bossColor(boss.name, boss) + "의 체력이 최대 체력으로 회복되었습니다.\n다음 전투는 처음부터 다시 시작됩니다.");
  }

  cleanupBattleEffects(participants);
  participants.forEach(f => {
    const c = ensureCombatStats(f);
    if(c.hp > 0){
      if(c.hp >= c.maxHp){
        c.hp = c.maxHp;
        c.status = "정상";
        delete c.stunUntil;
        delete c.recoveryStartAt;
        delete c.recoveryStartHp;
      }else{
        markRecoveringIfDamaged(f);
      }
    }
  });
  activeTraitBattle=null;

  const resultText = buildBattleResultText(boss, participants, totalDamage, result, rewardMoney, rewardDrop, rewardDropCount, battleLog);
  const summary = buildBattleSummaryText(boss, result, rewardMoney, rewardDrop, rewardDropCount);
  clearBattleDisplayNumbers(participants);

  if(result === "처치 성공"){
    setBossCooldown(boss.id);
  }
  bossPrepIndexes = [];
  saveGame();

  printPreview("전투 종료", summary, "전투 결과", resultText);
}

function buildBattleSummaryText(boss, result, rewardMoney, rewardDrop, rewardDropCount){
  let s = line() + "\n\n";
  s += bossColor(boss.name, boss) + " " + result + "\n\n";

  if(result === "처치 성공"){
    s += "획득\n\n";
    if(rewardMoney > 0){
      s += "최초 클리어 상금 : " + formatMoney(rewardMoney) + "\n";
    } else {
      s += "상금 : 이미 획득 완료\n";
    }
    s += rewardDrop + " x" + rewardDropCount.toLocaleString() + "\n\n";
  }

  s += line();
  return s;
}

function buildBattleResultText(boss, participants, totalDamage, result, rewardMoney, rewardDrop, rewardDropCount, battleLog){
  let s = "전투 결과\n\n";
  s += line() + "\n\n";

  if(battleLog && battleLog.length > 0){
    battleLog.forEach((entry,i)=>{
      s += entry + "\n";
      s += "\n" + line() + "\n\n";
    });
  }

  s += "참가 물고기\n\n";

  if(participants.length === 0){
    s += "없음\n";
  } else {
    participants.forEach(f => {
      s += lineFish(f) + " (" + getCombatStatusText(f) + ")\n";
    });
  }

  s += "\n" + line() + "\n\n";
  s += "총 피해\n\n";
  s += totalDamage.toLocaleString() + "\n\n";
  s += line() + "\n\n";
  s += "결과\n\n";
  s += boss.name + " " + result + "\n\n";

  if(result === "처치 성공"){
    s += line() + "\n\n";
    s += "획득\n\n";
    if(rewardMoney > 0){
      s += "최초 클리어 상금 : " + formatMoney(rewardMoney) + "\n";
    } else {
      s += "상금 : 이미 획득 완료\n";
    }
    s += rewardDrop + " x" + rewardDropCount.toLocaleString() + "\n\n";
  }

  s += line();
  return s;
}

function leaveBossMenu(){
  if(!isBossMenu) return print("보스전에 입장한 상태가 아닙니다.");
  isBossMenu = false;
  bossPrepIndexes = [];
  pendingRecoveryBattleConfirm = false;
  print("보스전에서 나왔습니다.");
}

function isAllowedInBossMenu(cmd){
  if(!isBossMenu) return true;
  if(cmd === "보스전" || cmd === "보스정보" || cmd === "보스목록" || cmd === "인벤토리" || cmd === "양동이" || cmd === "전투 확인" || cmd === "물고기도감" || cmd === "코어도감" || cmd === "물고기특성" || cmd === "전투" || cmd === "나가기" || cmd === "명령어") return true;
  if(cmd.startsWith("보스선택 ")) return true;
  if(cmd.startsWith("보스정보 ")) return true;
  if(cmd.startsWith("준비 ")) return true;
  if(cmd.startsWith("준비해제 ")) return true;
  if(cmd.startsWith("정보 ")) return true;
  if(cmd.startsWith("정렬 ")) return true;
  if(cmd === "파티프리셋" || cmd.startsWith("파티저장 ") || cmd.startsWith("파티불러오기 ") || cmd.startsWith("파티해제 ")) return true;
  return false;
}

function blockedBossCommand(){
  print("보스전 진행 중에는 사용할 수 없는 명령어입니다.\n\n나가기를 입력해 보스전을 종료하세요.");
}


