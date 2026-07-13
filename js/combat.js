function line(){
  return "────────────────────";
}

function bossColor(text,boss){
  return `<span style="color:${boss.color || '#e6edf3'}">${text}</span>`;
}

function bossBattleEvent(boss,title,body="",kind="skill"){
  const safeKind=["skill","crazy","passive","phase"].includes(kind)?kind:"skill";
  const labels={skill:"보스 스킬",crazy:"크레이지 궁극기",passive:"보스 패시브",phase:"페이즈 전환"};
  return `<span class="battle-event battle-event--${safeKind}"><span class="battle-event__eyebrow">${labels[safeKind]}</span><b>${bossColor(escapeHtml(boss.name),boss)} · ${escapeHtml(title)}</b>${body?`<span class="battle-event__body">${escapeHtml(body)}</span>`:""}</span>`;
}

function bossCrazyPassiveEvent(boss,title,body="",variant=""){
  const safeVariant=["phoenix","phoenix-apex"].includes(variant)?` battle-event--crazy-passive-${variant}`:"";
  return `<span class="battle-event battle-event--phase battle-event--crazy-passive${safeVariant}"><span class="battle-event__eyebrow">크레이지 패시브</span><b>${bossColor(escapeHtml(boss.name),boss)} · ${escapeHtml(title)}</b>${body?`<span class="battle-event__body">${escapeHtml(body)}</span>`:""}</span>`;
}

function bossRevivalEvent(boss,title,body="",apex=false){
  const crazy=boss.difficulty==="crazy",classes=["battle-event","battle-event--phase","battle-event--revival","battle-event--revival-phoenix"];
  if(crazy)classes.push("battle-event--crazy-passive",apex?"battle-event--crazy-passive-phoenix-apex":"battle-event--crazy-passive-phoenix");
  return `<span class="${classes.join(" ")}"><span class="battle-event__eyebrow">${crazy?"크레이지 부활":"보스 부활"}</span><b>${bossColor(escapeHtml(boss.name),boss)} · ${escapeHtml(title)}</b>${body?`<span class="battle-event__body">${escapeHtml(body)}</span>`:""}</span>`;
}

function announceBossPassive(boss,battleLog){
  const passives={
    kraken:["먹물 난사","먹물이 물고기의 회피 시도를 무력화합니다."],
    hydra:["재생","보스 턴마다 잃은 체력을 회복합니다."],
    leviathan:["심연의 분노","체력이 낮아질수록 공격력이 크게 증가합니다."],
    behemoth:["고대의 육체","거대한 육체가 받는 피해를 감소시킵니다."],
    phoenix:["불사","쓰러져도 불꽃 속에서 다시 부활합니다."],
    bahamut:["드래곤 스케일","큰 피해를 기억하고 같은 수준의 공격을 막아냅니다."],
    tiamat:["태초의 바다","보스 턴마다 태초의 바다가 체력을 회복시킵니다."],
    jormungandr:["세계를 감은 자","턴이 지날수록 세계의 고리가 조여오며 공격력이 증가합니다."],
    fenrir:["글레이프니르","매듭이 풀릴수록 봉인된 힘을 되찾습니다."],
    surtr:["불꽃의 검","불꽃의 검이 피해를 나누어 받습니다."],
    cerberus:["세 개의 머리","남아 있는 머리 수에 따라 공격 방식이 달라집니다."],
    nidhogg:["세계수 침식","일정 턴마다 물고기의 최대 체력을 침식합니다."],
    azhi_dahaka:["세 가지 재앙","쇠약·공포·불신이 모이면 재앙이 폭발합니다."],
    typhon:["폭풍의 지배자","매 턴 전장을 뒤흔드는 폭풍 효과가 발생합니다."],
    angra_mainyu:["절대악","모든 물고기는 체력과 별개의 존재 수치를 가집니다."],
    erebos:["빛 소멸","빛이 사라지면 완전 암흑이 전장을 덮습니다."],
    chronos:["시간의 잔향","시간의 잔상이 이전 행동을 다시 불러옵니다."],
    nyarlathotep:["천 개의 얼굴","가면을 바꾸며 강한 물고기의 힘을 복제합니다."],
    yog_sothoth:["무한 차원","전장을 여러 차원으로 갈라 행동을 제한합니다."],
    azathoth:["혼돈의 각성","체력 구간마다 전투 규칙을 더욱 혼란스럽게 바꿉니다."]
  },passive=passives[boss.id];
  if(passive)battleLog.push(bossBattleEvent(boss,passive[0],passive[1],"passive"));
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
  const balance=getLiveStarBalance(tier),min=balance.dodgeMin,max=balance.dodgeMax;
  const value = min + (max - min) * clamp((Math.random() + Math.random() + ratio) / 3, 0, 1);
  return Math.round(value * 10) / 10;
}

function rollStarTier(){
  const rows=[0,1,2,3,4].map(getLiveStarBalance),total=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.chance)||0),0);
  if(total<=0)return 0;
  let roll=Math.random()*total;
  for(let tier=4;tier>=0;tier--){
    const chance=Math.max(0,Number(rows[tier].chance)||0);
    if(roll<chance)return tier;
    roll-=chance;
  }
  return 0;
}

function starText(tier){
  tier=clamp(Math.floor(Number(tier)||0),0,4);
  return tier?" "+"★".repeat(tier):"";
}

function rollByStarRange(min,max,tier,ratio=0.5,stat="attack"){
  const balance=getLiveStarBalance(tier),minMultiplier=Number(balance[stat+"Min"]||1),maxMultiplier=Number(balance[stat+"Max"]||1);
  const scaledMin=Math.max(1,Math.floor((tier===0?min:max)*minMultiplier)+(tier===0?0:1));
  const scaledMax=Math.max(scaledMin,Math.floor(max*maxMultiplier));
  return tier===0?weightedRandomBySize(scaledMin,scaledMax,ratio):randomInt(scaledMin,scaledMax);
}
function rollCritRateByStar(tier){
  const balance=getLiveStarBalance(tier);
  return Math.round((balance.critRateMin+Math.random()*(balance.critRateMax-balance.critRateMin))*10)/10;
}

function rollCritDamageByStar(tier){
  const balance=getLiveStarBalance(tier);
  return randomInt(Math.floor(balance.critDamageMin),Math.floor(balance.critDamageMax));
}

function applyLiveGradeBalanceToCombat(f,c){
  if(!f||!c||f.grade==="쓰레기")return c;
  const balance=getLiveGradeBalance(f.grade),defaultAttack=combatAttackRanges[f.grade]||[1,1],defaultHp=combatHpRanges[f.grade]||[1,1],attackMultiplier=(Number(balance.attackMin)+Number(balance.attackMax))/Math.max(1,defaultAttack[0]+defaultAttack[1]),hpMultiplier=(Number(balance.hpMin)+Number(balance.hpMax))/Math.max(1,defaultHp[0]+defaultHp[1]);
  const fusionAttack=Math.max(0,Number(f.fusion?.permanentAttack)||0),fusionHp=Math.max(0,Number(f.fusion?.permanentMaxHp)||0);
  if(fusionAttack>0){
    if(Number(c._liveOpsFusionAttackSource)!==fusionAttack)c._liveOpsRawBaseAttack=fusionAttack;
    c._liveOpsFusionAttackSource=fusionAttack;
  }else if(!Number.isFinite(Number(c._liveOpsRawBaseAttack))){
    const previous=Math.max(.0001,Number(c._liveOpsAttackMultiplier)||1);
    c._liveOpsRawBaseAttack=Math.max(1,Math.round(Number(c._baseAttack??c.attack??1)/previous));
  }
  if(fusionHp>0){
    if(Number(c._liveOpsFusionHpSource)!==fusionHp)c._liveOpsRawBaseMaxHp=fusionHp;
    c._liveOpsFusionHpSource=fusionHp;
  }else if(!Number.isFinite(Number(c._liveOpsRawBaseMaxHp))){
    const previous=Math.max(.0001,Number(c._liveOpsHpMultiplier)||1);
    c._liveOpsRawBaseMaxHp=Math.max(1,Math.round(Number(c._baseMaxHp??c.maxHp??c.hp??1)/previous));
  }
  c._baseAttack=Math.max(1,Math.floor(Number(c._liveOpsRawBaseAttack||1)*attackMultiplier));
  c._baseMaxHp=Math.max(1,Math.floor(Number(c._liveOpsRawBaseMaxHp||1)*hpMultiplier));
  c._liveOpsAttackMultiplier=attackMultiplier;
  c._liveOpsHpMultiplier=hpMultiplier;
  c._fishGrade=f.grade;
  return c;
}

function rerollCritStats(f){
  if(!f) return null;
  if(!f.combat) f.combat = makeCombatStats(f);
  const c = f.combat;
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
    return {attack:0, hp:0, maxHp:0, dodge:0, critRate:0, critDamage:0, status:"전투 불가", combatVersion:COMBAT_VERSION, hpBalanceVersion:FISH_HP_BALANCE_VERSION, voidStatBalanceVersion:VOID_STAT_BALANCE_VERSION, stars:{attack:0,hp:0,dodge:0,critRate:0,critDamage:0}};
  }

  const gradeBalance=getLiveGradeBalance(f.grade);
  const atkRange = [Number(gradeBalance.attackMin)||0,Number(gradeBalance.attackMax)||0];
  const hpRange = [Number(gradeBalance.hpMin)||0,Number(gradeBalance.hpMax)||0];
  const ratio = getSizeRatio(f);

  const stars = fixedStars ? {
    attack:clamp(Math.floor(Number(fixedStars.attack || 0)), 0, 4),
    hp:clamp(Math.floor(Number(fixedStars.hp || 0)), 0, 4),
    dodge:clamp(Math.floor(Number(fixedStars.dodge || 0)), 0, 4),
    critRate:clamp(Math.floor(Number(fixedStars.critRate || 0)), 0, 4),
    critDamage:clamp(Math.floor(Number(fixedStars.critDamage || 0)), 0, 4)
  } : {
    attack:rollStarTier(),
    hp:rollStarTier(),
    dodge:rollStarTier(),
    critRate:rollStarTier(),
    critDamage:rollStarTier()
  };

  const attack = rollByStarRange(atkRange[0], atkRange[1], stars.attack, ratio,"attack");
  const hp = rollByStarRange(hpRange[0], hpRange[1], stars.hp, 0.5,"hp");

  const dodge = rollDodgeByStar(stars.dodge, ratio);

  const critRate = rollCritRateByStar(stars.critRate);
  const critDamage = rollCritDamageByStar(stars.critDamage);

  const defaultAttack=combatAttackRanges[f.grade]||[1,1],defaultHp=combatHpRanges[f.grade]||[1,1],attackScale=(atkRange[0]+atkRange[1])/Math.max(1,defaultAttack[0]+defaultAttack[1]),hpScale=(hpRange[0]+hpRange[1])/Math.max(1,defaultHp[0]+defaultHp[1]);
  const combat={
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
    hpBalanceVersion:FISH_HP_BALANCE_VERSION,
    voidStatBalanceVersion:VOID_STAT_BALANCE_VERSION,
    stars:stars,
    _liveOpsRawBaseAttack:attack/Math.max(.0001,attackScale),
    _liveOpsRawBaseMaxHp:hp/Math.max(.0001,hpScale),
    _liveOpsAttackMultiplier:attackScale,
    _liveOpsHpMultiplier:hpScale
  };
  applyLiveGradeBalanceToCombat(f,combat);
  applyTrainingBonusesToCombat(combat);
  return combat;
}

const KNOCKOUT_MINUTES = 5;
const INJURY_RECOVERY_MINUTES = 10;
const LEGACY_KNOCKOUT_MINUTES = 10;
const KNOCKOUT_DURATION_VERSION = 2;

function getStunMinutes(grade){
  return KNOCKOUT_MINUTES;
}

function getInjuryRecoveryMinutes(grade){
  return INJURY_RECOVERY_MINUTES;
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

function isFishInActiveBattle(f){
  return !!(activeTraitBattle && Array.isArray(activeTraitBattle.participants) && activeTraitBattle.participants.includes(f));
}

function markRecoveringIfDamaged(f,force=false){
  if(isFishInActiveBattle(f) && !force) return false;
  if(!hasMissingCombatHp(f)) return false;
  const c = ensureCombatStats(f);
  if(c.status === "회복 중" && c.stunUntil && !force) return false;

  const now = Date.now();
  const maxHp = Math.max(1, Number(c.maxHp || 1));
  const hpRate = clamp(Number(c.hp || 0) / maxHp, 0, 1);
  const fullDuration = getInjuryRecoveryMinutes(f.grade) * 60 * 1000;
  const duration = Math.max(1000, Math.ceil(fullDuration * (1 - hpRate)));

  c.status = "회복 중";
  delete c.knockedOut;
  delete c.stunDurationVersion;
  c.recoveryStartAt = now;
  c.recoveryStartHp = Math.max(1, Math.floor(c.hp));
  c.stunUntil = now + duration;
  return true;
}

function updateRecoveringFishHp(f){
  const c = ensureCombatStats(f);
  if(isFishInActiveBattle(f)) return false;
  let changed = false;
  const now = Date.now();
  const maxHp = Math.max(1, c.maxHp || 1);
  const knockedOut=f.grade!=="쓰레기"&&(!!c.knockedOut||c.status==="기절"||Number(c.hp||0)<=0);

  if(knockedOut){
    if(!c.knockedOut||c.status!=="기절"||c.hp!==0)changed=true;
    c.knockedOut=true;
    c.status="기절";
    c.hp=0;
    const knockoutDuration=getStunMinutes(f.grade)*60*1000;
    if(Number(c.stunDurationVersion||0)<KNOCKOUT_DURATION_VERSION){
      const legacyUntil=Number(c.stunUntil||0);
      const inferredStart=Number(c.recoveryStartAt||0)||(legacyUntil>0?legacyUntil-LEGACY_KNOCKOUT_MINUTES*60*1000:now);
      c.recoveryStartAt=Math.min(now,Math.max(0,inferredStart||now));
      c.stunUntil=c.recoveryStartAt+knockoutDuration;
      c.stunDurationVersion=KNOCKOUT_DURATION_VERSION;
      changed=true;
    }else{
      if(!Number(c.recoveryStartAt||0)){c.recoveryStartAt=now;changed=true;}
      const maximumUntil=Number(c.recoveryStartAt)+knockoutDuration;
      if(!Number(c.stunUntil||0)||Number(c.stunUntil)>maximumUntil){c.stunUntil=maximumUntil;changed=true;}
    }
    if(!c.stunUntil||now>=c.stunUntil){
      c.hp=maxHp;
      c.status="정상";
      delete c.knockedOut;
      delete c.stunUntil;
      delete c.recoveryStartAt;
      delete c.recoveryStartHp;
      delete c.stunDurationVersion;
      return true;
    }
    return changed;
  }

  if(c.status === "기절"){
    c.status = "회복 중";
    changed = true;
  }
  if(c.status !== "회복 중" && hasMissingCombatHp(f)){
    if(markRecoveringIfDamaged(f)) changed = true;
  }

  if(c.status !== "회복 중") return false;

  if(c.hp >= maxHp){
    c.hp = maxHp;
    c.status = "정상";
    delete c.stunUntil;
    delete c.recoveryStartAt;
    delete c.recoveryStartHp;
    delete c.knockedOut;
    delete c.stunDurationVersion;
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
    delete c.knockedOut;
    delete c.stunDurationVersion;
    return true;
  }

  const recoveryStartAt = Number(c.recoveryStartAt || (c.stunUntil - getInjuryRecoveryMinutes(f.grade) * 60 * 1000));
  const recoveryStartHp = Number(c.recoveryStartHp || 0);
  const duration = Math.max(1, c.stunUntil - recoveryStartAt);
  const ratio = clamp((now - recoveryStartAt) / duration, 0, 1);

  if(ratio >= 1){
    c.status = "정상";
    c.hp = maxHp;
    delete c.stunUntil;
    delete c.recoveryStartAt;
    delete c.recoveryStartHp;
    delete c.knockedOut;
    delete c.stunDurationVersion;
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
    f.combat.hpBalanceVersion = FISH_HP_BALANCE_VERSION;
    f.combat.voidStatBalanceVersion = VOID_STAT_BALANCE_VERSION;
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

  applyLiveGradeBalanceToCombat(f,f.combat);
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

function migrateFusionHpBalance(f){
  if(!f?.fusion||typeof f.fusion!=="object"||Number(f.fusion.hpBalanceVersion||0)>=FISH_HP_BALANCE_VERSION)return false;
  ["mainBaseMaxHp","permanentMaxHp","totalHpGain"].forEach(key=>{
    if(Number(f.fusion[key])>0)f.fusion[key]=Math.max(1,Math.floor(Number(f.fusion[key])*FISH_HP_BALANCE_MULTIPLIER));
  });
  f.fusion.hpBalanceVersion=FISH_HP_BALANCE_VERSION;
  return true;
}

function migrateStoredFishHpToTriple(c){
  if(!c||Number(c.hpBalanceVersion||0)>=FISH_HP_BALANCE_VERSION)return false;
  ["_baseMaxHp","maxHp","hp","recoveryStartHp","_preErosionMaxHp"].forEach(key=>{
    if(c[key]!==undefined&&c[key]!==null)c[key]=Math.max(key==="hp"||key==="recoveryStartHp"?0:1,Math.floor(Number(c[key]||0)*FISH_HP_BALANCE_MULTIPLIER));
  });
  if(c.knockedOut||c.status==="기절"||Number(c.hp||0)<=0)c.hp=0;
  c.hpBalanceVersion=FISH_HP_BALANCE_VERSION;
  c.combatVersion=COMBAT_VERSION;
  return true;
}

function getStarStatBand(range,tier){
  const min=Math.max(1,Number(range?.[0]||1)),max=Math.max(min,Number(range?.[1]||min));
  tier=clamp(Math.floor(Number(tier||0)),0,3);
  if(tier===0)return [min,max];
  const previous=tier===3?7:tier===2?3:1,current=tier===3?20:tier===2?7:3;
  return [Math.floor(max*previous)+1,Math.floor(max*current)];
}

function remapStarStatValue(value,oldRange,newRange,tier){
  const oldBand=getStarStatBand(oldRange,tier),newBand=getStarStatBand(newRange,tier);
  const ratio=oldBand[1]===oldBand[0]?0.5:clamp((Number(value||oldBand[0])-oldBand[0])/(oldBand[1]-oldBand[0]),0,1);
  return Math.max(1,Math.round(newBand[0]+(newBand[1]-newBand[0])*ratio));
}

function migrateVoidFishStats(f){
  if(!f||f.grade!=="공허"||!f.combat||Number(f.combat.voidStatBalanceVersion||0)>=VOID_STAT_BALANCE_VERSION)return false;
  const c=f.combat,stars=c.stars||{},oldMax=Math.max(1,Number(c.maxHp||c.hp||1)),oldHp=Math.max(0,Number(c.hp||0));
  const hpRatio=clamp(oldHp/oldMax,0,1),recoveryRatio=c.recoveryStartHp===undefined?null:clamp(Number(c.recoveryStartHp||0)/oldMax,0,1);
  const wasDown=!!c.knockedOut||c.status==="기절"||oldHp<=0,wasHealthy=c.status==="정상"&&oldHp>=oldMax;
  let baseAttack=Math.max(1,Number(c._baseAttack||c.attack||1)),baseMaxHp=Math.max(1,Number(c._baseMaxHp||c.maxHp||1));

  if(f.fusion&&typeof f.fusion==="object"){
    const fusion=f.fusion,stage=clamp(Math.floor(Number(fusion.evolutionStage||0)),0,3),evolutionMultiplier=[1,2,3,5][stage];
    const oldMainAttack=Math.max(1,Number(fusion.mainBaseAttack||baseAttack)),oldMainMaxHp=Math.max(1,Number(fusion.mainBaseMaxHp||baseMaxHp));
    const newMainAttack=remapStarStatValue(oldMainAttack,LEGACY_VOID_ATTACK_RANGE,combatAttackRanges["공허"],stars.attack);
    const newMainMaxHp=remapStarStatValue(oldMainMaxHp,LEGACY_VOID_HP_RANGE,combatHpRanges["공허"],stars.hp);
    const attackScale=newMainAttack/oldMainAttack,hpScale=newMainMaxHp/oldMainMaxHp;
    fusion.mainBaseAttack=newMainAttack;
    fusion.mainBaseMaxHp=newMainMaxHp;
    fusion.totalAttackGain=Math.max(0,Math.round(Number(fusion.totalAttackGain||0)*attackScale));
    fusion.totalHpGain=Math.max(0,Math.round(Number(fusion.totalHpGain||0)*hpScale));
    fusion.permanentAttack=Math.max(1,newMainAttack*evolutionMultiplier+fusion.totalAttackGain);
    fusion.permanentMaxHp=Math.max(1,newMainMaxHp*evolutionMultiplier+fusion.totalHpGain);
    fusion.voidStatBalanceVersion=VOID_STAT_BALANCE_VERSION;
    baseAttack=fusion.permanentAttack;baseMaxHp=fusion.permanentMaxHp;
  }else{
    baseAttack=remapStarStatValue(baseAttack,LEGACY_VOID_ATTACK_RANGE,combatAttackRanges["공허"],stars.attack);
    baseMaxHp=remapStarStatValue(baseMaxHp,LEGACY_VOID_HP_RANGE,combatHpRanges["공허"],stars.hp);
  }

  c._baseAttack=baseAttack;c._baseMaxHp=baseMaxHp;
  delete c._trainingAttackLevel;delete c._trainingHpLevel;
  applyTrainingBonusesToCombat(c);
  if(wasDown)c.hp=0;
  else if(wasHealthy)c.hp=c.maxHp;
  else c.hp=Math.max(1,Math.min(c.maxHp,Math.floor(c.maxHp*hpRatio)));
  if(recoveryRatio!==null)c.recoveryStartHp=Math.max(wasDown?0:1,Math.floor(c.maxHp*recoveryRatio));
  c.voidStatBalanceVersion=VOID_STAT_BALANCE_VERSION;
  c.combatVersion=COMBAT_VERSION;
  return true;
}

function migrateFishCombatToCurrentVersion(f,targetVersion=COMBAT_VERSION){
  if(!f)return false;
  let changed=false;
  const fusionChanged=migrateFusionHpBalance(f);
  const currentVersion=Number((f.combat&&f.combat.combatVersion)||0);

  if(f.grade==="쓰레기"){
    if(!f.combat)f.combat=makeCombatStats(f);
    f.combat.attack=0;f.combat.hp=0;f.combat.maxHp=0;f.combat.status="전투 불가";f.combat.combatVersion=targetVersion;f.combat.hpBalanceVersion=FISH_HP_BALANCE_VERSION;f.combat.voidStatBalanceVersion=VOID_STAT_BALANCE_VERSION;
    return currentVersion<targetVersion||fusionChanged;
  }

  if(currentVersion<targetVersion){
    if(currentVersion===15&&f.combat){
      migrateVoidFishStats(f);
    }else if(currentVersion===14&&f.combat){
      migrateStoredFishHpToTriple(f.combat);
      migrateVoidFishStats(f);
    }else{
      const existingStars=f.combat&&f.combat.stars?{...f.combat.stars}:null;
      f.combat=makeCombatStats(f,existingStars);
      f.combat.hpBalanceVersion=FISH_HP_BALANCE_VERSION;
    }
    if(f.fusion&&Number(f.fusion.permanentMaxHp)>0){
      f.combat._baseMaxHp=Math.max(1,Math.floor(Number(f.fusion.permanentMaxHp)));
      f.combat._baseAttack=Math.max(1,Math.floor(Number(f.fusion.permanentAttack||f.combat._baseAttack||f.combat.attack||1)));
      applyTrainingBonusesToCombat(f.combat);
    }
    f.combat.combatVersion=targetVersion;
    changed=true;
  }else if(fusionChanged){
    f.combat._baseMaxHp=Math.max(1,Math.floor(Number(f.fusion.permanentMaxHp||f.combat._baseMaxHp||f.combat.maxHp||1)));
    if(typeof syncFishFusionCombat==="function")syncFishFusionCombat(f);
    changed=true;
  }
  if(migrateVoidFishStats(f))changed=true;
  if(fusionChanged)changed=true;
  return changed;
}

function migrateCombatStatsToCurrentVersion(){
  let changed=false;
  bucket.forEach(f=>{if(migrateFishCombatToCurrentVersion(f))changed=true;});
  if(changed)saveGame();
  return changed;
}

function yieldLoginWork(){
  return new Promise(resolve=>{
    if(typeof requestAnimationFrame==="function"&&!document.hidden)requestAnimationFrame(()=>setTimeout(resolve,0));
    else setTimeout(resolve,0);
  });
}

async function migrateCombatStatsToCurrentVersionAsync(batchSize=60,saveAtEnd=true){
  let changed=false;
  const size=Math.max(20,Number(batchSize)||60);
  for(let i=0;i<bucket.length;i++){
    if(migrateFishCombatToCurrentVersion(bucket[i]))changed=true;
    if((i+1)%size===0)await yieldLoginWork();
  }
  if(changed&&saveAtEnd)saveGame();
  return changed;
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
  if(!isFishInActiveBattle(f)) updateRecoveringFishHp(f);

  if(isFishInActiveBattle(f) && (c.hp<=0 || c.battleDown)) return "쓰러짐";

  if(c.knockedOut&&c.stunUntil){
    const left=c.stunUntil-Date.now();
    if(left>0)return "기절 ("+formatRemain(left)+")";
  }

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

function getBossDifficultyConfig(difficultyId){
  return BOSS_DIFFICULTIES[difficultyId] || BOSS_DIFFICULTIES.normal;
}

function isBossDifficultyCleared(bossOrId,difficultyId="normal"){
  if(typeof isCurrentFishingAdmin==="function"&&isCurrentFishingAdmin())return true;
  const id=typeof bossOrId==="string"?bossOrId:bossOrId.id;
  if(difficultyId==="normal" && bossProgress.defeated && bossProgress.defeated[id]) return true;
  return !!(bossProgress.difficultyClears && bossProgress.difficultyClears[id] && bossProgress.difficultyClears[id][difficultyId]);
}

function markBossDifficultyCleared(boss,difficultyId){
  if(!bossProgress.difficultyClears) bossProgress.difficultyClears={};
  if(!bossProgress.difficultyClears[boss.id]) bossProgress.difficultyClears[boss.id]={};
  bossProgress.difficultyClears[boss.id][difficultyId]=true;
  if(difficultyId==="normal") bossProgress.defeated[boss.id]=true;
}

function isBossDifficultyUnlocked(boss,difficultyId){
  if(typeof isCurrentFishingAdmin==="function"&&isCurrentFishingAdmin())return true;
  if(!isBossUnlocked(boss)) return false;
  if(difficultyId==="normal") return true;
  if(difficultyId==="hard") return isBossDifficultyCleared(boss,"normal");
  if(difficultyId==="crazy") return isBossDifficultyCleared(boss,"hard");
  return false;
}

function getSelectedBossDifficulty(boss=getCurrentBoss()){
  const requested=BOSS_DIFFICULTIES[bossProgress.selectedDifficulty]?bossProgress.selectedDifficulty:"normal";
  if(isBossDifficultyUnlocked(boss,requested)) return requested;
  if(isBossDifficultyUnlocked(boss,"crazy")) return "crazy";
  if(isBossDifficultyUnlocked(boss,"hard")) return "hard";
  return "normal";
}

function selectBossDifficulty(difficultyId,quiet=false){
  const boss=getCurrentBoss();
  const config=getBossDifficultyConfig(difficultyId);
  if(!BOSS_DIFFICULTIES[difficultyId]){ if(!quiet) print("존재하지 않는 보스 난이도입니다."); return false; }
  if(!isBossDifficultyUnlocked(boss,difficultyId)){
    if(!quiet) print(difficultyId==="hard"?"일반 난이도를 먼저 클리어해야 합니다.":"어려움 난이도를 먼저 클리어해야 합니다.");
    return false;
  }
  bossProgress.selectedDifficulty=difficultyId;
  saveGame();
  if(!quiet) print(bossColor(boss.name,boss)+" "+config.name+" 난이도를 선택했습니다.");
  return true;
}

function getBossForDifficulty(baseBoss,difficultyId=getSelectedBossDifficulty(baseBoss)){
  const config=getBossDifficultyConfig(difficultyId);
  const live=typeof getLiveBalanceConfig==="function"?getLiveBalanceConfig():{bossHpMultiplier:1,bossAttackMultiplier:1};
  return {
    ...baseBoss,
    hp:Math.floor(baseBoss.hp*config.hpMultiplier*live.bossHpMultiplier),
    attack:Math.floor(baseBoss.attack*config.attackMultiplier*BOSS_ATTACK_BALANCE_MULTIPLIER*live.bossAttackMultiplier),
    dodge:Number(baseBoss.dodge||0)+config.dodgeBonus,
    skillRate:Math.min(100,Number(baseBoss.skillRate||0)*config.skillMultiplier),
    difficulty:difficultyId,
    difficultyName:config.name,
    _baseBoss:baseBoss
  };
}

function getBossDifficultyReward(baseBoss,difficultyId){
  const live=typeof getLiveBalanceConfig==="function"?getLiveBalanceConfig():{bossRewardMultiplier:1};
  const reward=Number(baseBoss.reward||0)*getBossDifficultyConfig(difficultyId).rewardMultiplier*live.bossRewardMultiplier;
  return Math.max(0,Math.round(reward/10)*10);
}

function getBossCoreRange(difficultyId){
  const config=getBossDifficultyConfig(difficultyId);
  return {min:config.coreMin,max:config.coreMax};
}

function scaleBossSkillChance(boss,baseChance){
  return Math.min(100,Number(baseChance||0)*getBossDifficultyConfig(boss.difficulty).skillMultiplier);
}

function isBossUnlocked(boss){
  if(typeof isCurrentFishingAdmin==="function"&&isCurrentFishingAdmin())return true;
  const idx = bossList.findIndex(b => b.id === boss.id);
  if(idx <= 0) return true;
  const prev = bossList[idx - 1];
  return isBossDifficultyCleared(prev,"normal");
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
    if(isBossUnlocked(boss) && !isBossDifficultyCleared(boss,"normal")){
      bossProgress.selectedBossId = boss.id;
      bossProgress.selectedDifficulty="normal";
      return boss;
    }
  }

  const first = bossList[0];
  bossProgress.selectedBossId = first.id;
  return first;
}

function selectBoss(n){
  const boss = bossList[Number(n)-1];

  if(!boss) return print("존재하지 않는 보스 번호입니다.");
  if(!isBossUnlocked(boss)) return print("아직 해금되지 않은 보스입니다.");

  bossProgress.selectedBossId = boss.id;
  bossProgress.selectedDifficulty=getSelectedBossDifficulty(boss);
  saveGame();

  print(bossColor(boss.name, boss) + "을 선택했습니다.");
}

function getBossHp(boss,difficultyId=boss.difficulty||getSelectedBossDifficulty(boss)){
  const scaled=boss.difficulty?boss:getBossForDifficulty(boss,difficultyId);
  const key=boss.id+":"+difficultyId;
  if(!Number.isFinite(Number(bossProgress.hp[key])) || Number(bossProgress.hp[key])<=0) bossProgress.hp[key]=scaled.hp;
  return Math.max(0,Number(bossProgress.hp[key]));
}

function getBossStatus(boss){
  if(!isBossUnlocked(boss)) return "잠김";
  const left = getBossCooldownLeft(boss.id);
  if(left > 0) return "쿨타임 " + formatRemain(left);
  const count=BOSS_DIFFICULTY_ORDER.filter(id=>isBossDifficultyCleared(boss,id)).length;
  return count>0 ? count+" / 3 클리어" : "도전 가능";
}

function addMaterial(name,count){
  bossProgress.materials[name] = (bossProgress.materials[name] || 0) + count;
}
function isBossFirstClear(boss,difficultyId=boss.difficulty||getSelectedBossDifficulty(boss)){
  return !isBossDifficultyCleared(boss,difficultyId);
}

function getBossClearReward(boss,difficultyId=boss.difficulty||getSelectedBossDifficulty(boss)){
  const base=boss._baseBoss||boss;
  return isBossFirstClear(base,difficultyId) ? getBossDifficultyReward(base,difficultyId) : 0;
}


function buildBossBattleText(){
  const baseBoss = getCurrentBoss();
  const difficultyId=getSelectedBossDifficulty(baseBoss);
  const boss = getBossForDifficulty(baseBoss,difficultyId);
  const hp = getBossHp(boss);
  let s = "보스전\n\n";
  s += line() + "\n\n";
  s += "현재 보스\n" + bossColor(boss.name, boss) + "\n\n";
  s += "등급\n" + boss.grade + "\n\n";
  s += "난이도\n" + boss.difficultyName + "\n\n";
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
  const coreRange=getBossCoreRange(difficultyId);
  s += "드랍\n" + boss.drop + " x"+coreRange.min+"~"+coreRange.max+"\n\n";
  s += "명령어\n준비 번호\n준비해제 번호\n정보 번호\n전투\n보스정보\n보스정보 번호\n보스목록\n보스선택 번호\n보스난이도 일반/어려움/크레이지\n인벤토리\n파티프리셋\n파티저장 보스\n파티불러오기 보스\n파티해제 보스\n나가기\n\n";
  s += line();
  return s;
}

function showBossBattle(){
  recoverStunnedFish();
  isBossMenu = true;
  print(buildBossBattleText());
}

function buildBossInfoText(baseBoss = getCurrentBoss()){
  const difficultyId=getSelectedBossDifficulty(baseBoss);
  const boss=getBossForDifficulty(baseBoss,difficultyId);
  const hp = getBossHp(boss);
  const coreRange=getBossCoreRange(difficultyId);
  let s = bossColor(boss.name, boss) + " [" + boss.grade + "] ["+boss.difficultyName+"]\n\n";
  s += line() + "\n\n";
  s += "설명\n" + boss.desc + "\n\n";
  s += line() + "\n\n";
  s += "체력\n" + hpBar(hp, boss.hp) + "\n\n";
  s += "공격력\n" + boss.attack.toLocaleString() + "\n\n";
  s += "스킬 확률 보정\n기존 스킬 확률 x" + getBossDifficultyConfig(difficultyId).skillMultiplier.toFixed(2).replace(/0+$/,'').replace(/\.$/,'') + "\n\n";
  s += "최초 클리어 상금\n" + formatMoney(getBossDifficultyReward(baseBoss,difficultyId)) + "\n\n";
  s += "드랍\n" + boss.drop + " x"+coreRange.min+"~"+coreRange.max+"\n\n";
  const crazySkillName=baseBoss.crazySkillName||(typeof CRAZY_BOSS_SKILL_NAMES!=="undefined"?CRAZY_BOSS_SKILL_NAMES[baseBoss.id]:"");
  if(difficultyId==="crazy" && crazySkillName) s += "크레이지 궁극기\n"+crazySkillName+" (전투당 1회)\n\n";
  s += line() + "\n\n";

  if(boss.id === "phoenix"){
    const reviveText=difficultyId==="crazy"?"첫 사망 시 80%, 두 번째 사망 시 50%로 총 2회 부활":difficultyId==="hard"?"사망 시 체력 70%로 1회 부활":"사망 시 체력 50%로 1회 부활";
    s += "패시브 - 불사\n"+reviveText+"\n\n";
    s += "재의 낙인 (25%)\n공격력 1배\n화상 1중첩 부여\n\n";
    s += "윤회의 불꽃 (15%)\n전체 공격\n공격력 1.5배\n화상 1중첩 대상 추가 피해\n화상 2중첩 대상 대폭 추가 피해\n\n";
    } else if(boss.id === "bahamut"){
    const scaleReduction=difficultyId==="crazy"?70:difficultyId==="hard"?60:50;
    s += "패시브 - 드래곤 스케일\n전투 중 가장 큰 피해 기록 저장\n기록보다 크거나 같은 피해를 받으면 "+scaleReduction+"% 감소\n감소 적용 후 새 기록으로 갱신\n\n";
    if(difficultyId==="crazy")s += "크레이지 전용 - 용왕의 절대명령\n체력 50%에서 약화 효과 제거\n공격력 25%·치명타율 20% 증가\n메가 플레어가 회피를 무시함\n\n";
    s += "메가 플레어 (15%)\n공격력 3배\n다음 턴 참가 물고기 전체 행동 불가\n\n";
    s += "용왕의 포효 (25%)\n공격력 1.5배\n사용할 때마다 공격력 30,000 누적 증가\n\n";
    } else if(boss.id === "tiamat"){
    const tiamatHeal=difficultyId==="crazy"?5:difficultyId==="hard"?3:2;
    s += "패시브 - 태초의 바다\n매 턴 최대 체력의 "+tiamatHeal+"% 회복\n\n";
    if(difficultyId==="crazy")s += "크레이지 전용 - 혼돈의 모태\n새끼 용이 누적 3마리 쓰러지면 태초의 용 소환\n태초의 용은 티아마트 체력 5%·공격력 100%\n쓰러질 때 전체 공격 발동\n\n";
    s += "창세의 바다 (25%)\n공격력 2배\n\n";
    s += "괴수 탄생 (15%)\n새끼 용 3마리 소환\n\n";
    s += "새끼 용\nHP 100,000~300,000 랜덤\n공격력 10,000~30,000 랜덤\n\n";
    } else if(boss.id === "jormungandr"){
    const ringGrowth=difficultyId==="crazy"?10:difficultyId==="hard"?7:5,ringNeed=difficultyId==="crazy"?2:3,ringCap=difficultyId==="crazy"?150:difficultyId==="hard"?125:100;
    s += "패시브 - 세계를 감은 자\n매 턴 공격력 "+ringGrowth+"% 증가\n세계의 고리 "+ringNeed+"단계 완성 시 최대 "+ringCap+"% 증가\n\n";
    if(difficultyId==="crazy")s += "크레이지 전용 - 라그나로크의 고리\n고리 완성 시 모든 물고기에게 독 1중첩\n이후 2턴마다 독 중첩당 최대 체력 5% 피해\n\n";
    s += "미드가르드 감기 (25%)\n공격력 2배\n세계의 고리 1단계 진행\n\n";
    s += "세계의 고리\n3단계 완성 시 공격력 증가 한도가 100%로 확장\n완성 즉시 공격력이 더 강해짐\n\n";
    s += "종말의 독 (15%)\n공격력 1.2배\n독 1중첩 부여\n\n";
    s += "독\n턴 시작 시 최대 체력의 2% 피해\n최대 3중첩\n\n";
    } else if(boss.id === "fenrir"){
    const knots=difficultyId==="crazy"?8:difficultyId==="hard"?7:6,boundPenalty=difficultyId==="crazy"?35:difficultyId==="hard"?30:25;
    s += "패시브 - 글레이프니르\n매듭 "+knots+"개로 시작\n매듭이 남아 있으면 회피율 0%, 공격력 "+boundPenalty+"% 감소\n치명타를 받을 때 매듭 1개 해제\n한 턴에 최대 2개 해제\n"+(difficultyId==="crazy"?"해방 후 공격력 50% 증가\n":"")+"\n";
    s += "티르의 오른손 (20%)\n공격력이 가장 높은 물고기에게 공격력 1.3배\n대상 공격력의 40%를 다음 공격에 추가\n\n";
    s += "신을 삼키는 자 (15%)\n매듭이 모두 풀린 뒤 사용 가능\n공격력이 가장 높은 물고기는 다음 턴 행동 불가\n남은 물고기가 치명타 피해를 주면 구출 성공\n구출 실패 시 최대 체력의 50% 피해\n이후 전투에 복귀\n\n";
    } else if(boss.id === "surtr"){
    s += "패시브 - 불꽃의 검\n불꽃의 검 내구도 "+Math.floor(boss.hp/6).toLocaleString()+"\n받는 피해를 수르트와 불꽃의 검이 절반씩 나눠 받음\n검 파괴 후 받는 피해 증가\n\n";
    if(difficultyId==="crazy")s += "크레이지 진화 - 멸망의 불꽃\n검이 처음 파괴되면 공격력 30% 증가\n모든 공격에 화상 부여\n\n";
    s += "프레이르와의 결투 (20%)\n해당 턴은 공격력이 가장 높은 물고기와 수르트만 행동\n서로 동시에 1회 공격\n물고기는 공격력 1배, 수르트는 공격력 1.8배\n양쪽 모두 회피 불가, 치명타 발동 가능\n\n";
    s += "무스펠의 진군 (15%)\n발동한 턴에는 수르트가 공격하지 않음\n다음 턴 시작 시 모든 물고기에게 공격력 0.8배\n해당 전체 공격이 그 턴의 수르트 행동을 대신함\n\n";
    } else if(boss.id === "cerberus"){
    s += "패시브 - 세 개의 머리\n체력 66%와 33%에서 머리를 하나씩 잃음\n남은 머리 수만큼 세 머리의 판결 공격 횟수 적용\n\n";
    if(difficultyId==="crazy")s += "크레이지 진화 - 죽지 않는 세 머리\n잃은 머리마다 남은 머리 공격 피해 35% 증가\n첫 영혼 머리: 물고기 회복량 30% 감소\n두 번째 영혼 머리: 물고기 회피율 15% 감소\n\n";
    s += "세 머리의 판결 (20%)\n공격력·최대 체력·치명타율이 가장 높은 물고기를 각 머리가 선택\n머리 하나당 공격력 0.6배\n한 물고기가 여러 조건을 만족하면 연속 공격을 받을 수 있음\n\n";
    s += "망자의 무게 (15%)\n현재 체력이 가장 낮은 물고기를 공격\n잃은 체력에 비례해 공격력 1.2~2.2배\n\n";
    } else if(boss.id === "nidhogg"){
    const erosionInterval=difficultyId==="crazy"?2:difficultyId==="hard"?3:4,erosionMax=difficultyId==="crazy"?8:difficultyId==="hard"?6:5;
    s += "패시브 - 세계수 침식\n"+erosionInterval+"턴마다 모든 물고기의 최대 체력 5% 감소\n최대 "+erosionMax+"회, 전투 종료 후 복구\n"+(difficultyId==="crazy"?"빼앗은 최대 체력으로 보호막 생성\n":"")+"\n";
    s += "뿌리의 연결 (20%)\n처음에는 무작위 2마리를 2턴간 연결\n다시 발동하면 최대 3마리까지 추가하고 지속 시간 초기화\n한 마리가 받은 실제 피해의 50%를 나머지가 나눠 받음\n연결 피해는 다시 전파되지 않음\n\n";
    s += "라타토스크의 이간질 (15%)\n공격력이 가장 높은 물고기의 다음 공격을 현재 체력이 가장 높은 아군에게 유도\n자신의 공격력과 치명타율을 사용하며 대상은 회피 가능\n\n";
    } else if(boss.id === "azhi_dahaka"){
    s += "패시브 - 세 가지 재앙\n쇠약: 공격력 15% 감소\n공포: 회피율 50% 감소\n불신: 치명타율 15% 감소\n한 물고기에 세 재앙이 모이면 최대 체력 20% 피해 후 재앙 제거\n\n";
    if(difficultyId==="crazy")s += "크레이지 진화 - 재앙의 흉터\n재앙 폭발 후 무작위 재앙 하나가 남음\n보스 체력 33% 이하에서는 폭발 피해 25%\n\n";
    s += "세 머리의 선택 (25%)\n공격력이 가장 높은 대상에게 쇠약\n회피율이 가장 높은 대상에게 공포\n치명타율이 가장 높은 대상에게 불신\n각 대상에게 공격력 0.65배\n\n";
    s += "재앙 집중 (15%)\n재앙이 가장 많은 대상에게 다른 물고기의 재앙을 하나씩 이동\n세 재앙이 완성되면 즉시 폭발\n옮길 재앙이 없으면 공격력 1.6배\n\n";
    } else if(boss.id === "typhon"){
    s += "패시브 - 폭풍의 지배자\n매 턴 역풍·난기류·폭풍의 눈 중 "+(difficultyId==="crazy"?"두 가지":"한 가지")+"가 발생\n역풍: 물고기 공격력 20% 감소, 타이폰 공격력 10% 증가\n난기류: 물고기 회피율 10% 감소, 타이폰 회피율 10% 증가\n폭풍의 눈: 물고기 회피 불가, 타이폰 치명타율 15%·치명타 피해 50% 증가\n\n";
    s += "폭풍의 반향 (20%)\n지난 턴 가장 큰 피해를 준 물고기에게 그 피해의 30%를 회피 불가로 반환\n대상 최대 체력의 25%가 상한\n기록이 없으면 공격력 1.3배\n\n";
    s += "대지와 하늘의 추락 (15%)\n공격력이 가장 높은 물고기와 최대 체력이 가장 높은 물고기의 체력 비율을 더 낮은 쪽으로 통일\n회복은 발생하지 않음\n두 조건의 대상이 같으면 공격력 1.7배\n\n";
  } else if(boss.id === "angra_mainyu"){
    s += "패시브 - 절대악\n모든 물고기는 체력과 별개인 존재 3으로 시작\n존재가 0이 되면 체력과 관계없이 즉시 회복 중 상태\n체력 75%·50%·25% 진입 시 무작위 물고기의 존재 1 감소\n\n";
    if(difficultyId==="crazy")s += "크레이지 전용 - 선의 부정\n물고기가 처음으로 최대 체력 15% 이상 회복하거나 부활하면 존재 1 감소\n해당 회복량 절반을 보호막으로 흡수\n\n";
    s += "존재 말살 (20%)\n공격력이 가장 높은 물고기에게 공격력 1.8배와 존재 1 감소\n공격을 회피해도 존재는 감소\n공격 피해로 쓰러지면 존재 감소는 다른 무작위 물고기에게 이동\n\n";
    s += "창조의 붕괴 (15%)\n모든 물고기에게 최대 체력 15%의 회피 불가 피해\n체력이 40% 이하가 된 물고기는 존재 1 감소\n이 체력 피해만으로는 쓰러지지 않음\n\n";
    s += "패시브 - 영겁의 밤\n체력 25% 이하에서 공격력 30% 증가, 회피율 0%\n존재 말살 공격력 2.2배, 창조의 붕괴 피해 20%로 강화\n\n";
    } else {
    s += "스킬\n\n";
    s += boss.skillName + (boss.skillRate ? " (" + boss.skillRate + "%)" : "") + "\n" + boss.skillDesc + "\n\n";
    s += "패시브\n\n";
    if(boss.id === "kraken") s += "먹물 난사\n회피 시도 시 회피 실패 처리\n"+(difficultyId==="crazy"?"심해의 수압\n3단계마다 2턴간 공격력 25%·치명타율 15% 감소\n치명타로 턴당 수압 1단계 제거\n":"")+"\n";
    else if(boss.id === "hydra") s += "재생\n매 턴 최대 체력의 "+(difficultyId==="crazy"?10:difficultyId==="hard"?7:5)+"% 회복\n"+(difficultyId==="crazy"?"체력 50%에서 아홉 머리 재생 발동\n":"")+"\n";
    else if(boss.id === "leviathan") s += "심연의 분노\n난이도가 높을수록 더 이른 체력 구간에서 강하게 분노\n\n";
    else if(boss.id === "behemoth") s += "고대의 육체\n받는 피해 "+(difficultyId==="crazy"?40:difficultyId==="hard"?30:20)+"% 감소\n"+(difficultyId==="crazy"?"움직이는 대륙\n체력 70%·40%에서 최대 체력 6% 암석 갑옷 생성\n갑옷 파괴 후 다음 턴까지 받는 피해 20% 증가\n":"")+"\n";
    else if(boss.id === "erebos") s += "빛 소멸\n빛 게이지가 0이 되면 완전 암흑 발동\n"+(difficultyId==="crazy"?"크레이지 전용 - 원초의 장막\n완전 암흑마다 최대 체력 5% 보호막·공격력 10% 증가\n공격력 증가는 최대 3중첩\n":"")+"\n";
    else if(boss.id === "chronos"){
      const echo=getVoidSummonStats("chronos_echo",difficultyId);
      s += "시간의 잔향\n"+(difficultyId==="crazy"?4:5)+"턴마다 시간의 잔상 소환 (다음 2턴 행동)\n잔상 체력 "+Math.round(echo.hpRate*10000)/100+"% · 공격력 "+Math.round(echo.attackRate*100)+"%\n"+(difficultyId==="crazy"?"겹쳐진 시간선\n체력 50% 이하부터 이전 공격이 다음 턴 35% 위력으로 재현\n":"")+"\n";
    }
    else if(boss.id === "nyarlathotep") s += "천 개의 얼굴\n주기적으로 가장 강한 물고기의 힘을 복제\n"+(difficultyId==="crazy"?"가면의 행렬\n3턴마다 폭군·거울·예언자 가면 변경\n체력 40% 이하에서 가면 2개 동시 활성화\n":"")+"\n";
    else if(boss.id === "yog_sothoth") s += "무한 차원\n공간 고정, 크레이지 체력 50%에서 차원 분리\n\n";
    else if(boss.id === "azathoth") s += "혼돈의 각성\n체력 75%·50%·25%마다 전투 규칙 강화\n"+(difficultyId==="crazy"?"회복량 75% 감소 → 회피 무시·치명타율 15% 감소 → 2턴마다 추가 행동\n크레이지 전용 - 혼돈의 꿈\n4턴마다 2턴간 회복·특성·인과 중 규칙 봉인\n체력 25% 이하에서는 규칙 2개 동시 적용\n":"")+"\n";
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
  if(c.knockedOut||c.status==="기절"||c.hp<=0){
    const left=Math.max(0,Number(c.stunUntil||0)-Date.now());
    return print("기절한 물고기는 전투에 참가할 수 없습니다."+(left>0?"\n\n남은 시간 : "+formatRemain(left):""));
  }

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
  const now=Date.now();
  c.hp = 0;
  c.status = "기절";
  c.knockedOut = true;
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
  c.recoveryStartAt = now;
  c.recoveryStartHp = 0;
  c.stunUntil = now + getStunMinutes(f.grade) * 60 * 1000;
  c.stunDurationVersion = KNOCKOUT_DURATION_VERSION;
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

function getBossCooldownKey(bossId,difficultyId){
  return String(bossId) + ":" + String(difficultyId || "normal");
}

function getBossCooldownLeft(bossId=null,difficultyId=null){
  const baseBoss = bossId ? (bossList.find(b => b.id === bossId) || getCurrentBoss()) : getCurrentBoss();
  const id = bossId || baseBoss.id;
  const difficulty = difficultyId || getSelectedBossDifficulty(baseBoss);
  const cooldowns = bossProgress.cooldowns || {};
  const saved = Number(cooldowns[getBossCooldownKey(id,difficulty)] || 0);
  const legacyNormal = difficulty === "normal" ? Number(cooldowns[id] || 0) : 0;
  return Math.max(0, Math.max(saved,legacyNormal) - Date.now());
}

function isBossCooldownActive(bossId=null,difficultyId=null){
  return getBossCooldownLeft(bossId,difficultyId) > 0;
}

function setBossCooldown(bossId=null,difficultyId=null){
  const baseBoss = bossId ? (bossList.find(b => b.id === bossId) || getCurrentBoss()) : getCurrentBoss();
  const id = bossId || baseBoss.id;
  const difficulty = difficultyId || getSelectedBossDifficulty(baseBoss);
  if(!bossProgress.cooldowns) bossProgress.cooldowns = {};
  bossProgress.cooldowns[getBossCooldownKey(id,difficulty)] = Date.now() + 5 * 60 * 1000;
}


function getAlivePreparedFishes(){
  return bossPrepIndexes
    .map(idx => bucket[idx])
    .filter(f => {
      if(!f || f.grade === "쓰레기") return false;
      updateRecoveringFishHp(f);
      const c = ensureCombatStats(f);
      return c.hp > 0 && !c.knockedOut && c.status !== "기절";
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
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  const notBanished=!Number(c.voidBanishedUntil||0)||Number(c.voidBanishedUntil||0)<turn;
  return c.hp > 0 && c.status !== "기절" && !c.knockedOut && !c.battleDown && !c.devouredByFenrir && notBanished;
}

function isBattleTargetableFish(f){
  return isBattleActionableFish(f)&&!traitState(f).ashRemnant;
}

function isFishTraitSealed(f){
  if(!f) return false;
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  const until=Number(ensureCombatStats(f).traitSealedUntil||0);
  return until>0&&until>=turn;
}

function traitFish(participants, name, aliveOnly=true){
  return (participants || []).find(f => f && f.name === name && !isFishTraitSealed(f) && (!aliveOnly || isBattleTargetableFish(f))) || null;
}

function traitFishes(participants, name, aliveOnly=true){
  return (participants || []).filter(f => f && f.name === name && !isFishTraitSealed(f) && (!aliveOnly || isBattleTargetableFish(f)));
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
    stunUntil:c.stunUntil, battleDown:!!c.battleDown, knockedOut:!!c.knockedOut,
    recoveryStartAt:c.recoveryStartAt,recoveryStartHp:c.recoveryStartHp,stunDurationVersion:c.stunDurationVersion,
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
  if(snap.knockedOut) c.knockedOut=true; else delete c.knockedOut;
  if(snap.stunUntil !== undefined) c.stunUntil=snap.stunUntil; else delete c.stunUntil;
  if(snap.recoveryStartAt !== undefined) c.recoveryStartAt=snap.recoveryStartAt; else delete c.recoveryStartAt;
  if(snap.recoveryStartHp !== undefined) c.recoveryStartHp=snap.recoveryStartHp; else delete c.recoveryStartHp;
  if(snap.stunDurationVersion !== undefined) c.stunDurationVersion=snap.stunDurationVersion; else delete c.stunDurationVersion;
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
    const voidSkill=f.grade==="공허";
    const voidPresentation={
      "잃어버린 첫 번째 편지 조각 ✉️":{className:"letter-one",eyebrow:"VOID CHAPTER I"},
      "잃어버린 두 번째 편지 조각 ✉️":{className:"letter-two",eyebrow:"VOID CHAPTER II"},
      "잃어버린 세 번째 편지 조각 ✉️":{className:"letter-three",eyebrow:"VOID FINAL CHAPTER"},
      "수상한 기운 👁️":{className:"observer",eyebrow:"VOID OBSERVATION"},
      "기묘한 기운 🌀":{className:"anomaly",eyebrow:"SYSTEM ERROR"}
    }[f.name];
    const eternalPresentation={
      "휘몰아치는 마음":{className:"storm",eyebrow:"STORM RESONANCE"},
      "영롱한 다이아몬드":{className:"prism",eyebrow:"PRISM REFRACTION"},
      "얼어붙은 마음":{className:"frost",eyebrow:"ABSOLUTE ZERO"},
      "빛나는 마음":{className:"radiance",eyebrow:"LIFE RADIANCE"},
      "불타는 마음":{className:"heartbeat",eyebrow:"BURNING HEART"},
      "무한한 시간":{className:"chronal",eyebrow:"TIME REVERSAL"}
    }[f.name];
    const allyPresentation=title==="태양 폭발"?{className:"solar",eyebrow:"SOLAR BURST"}:title==="승천"?{className:"ascension",eyebrow:"DRAGON ASCENSION"}:title==="별자리 완성"?{className:"constellation",eyebrow:"CONSTELLATION"}:title==="백염 폭발"?{className:"white-flame",eyebrow:"WHITE FLAME"}:title==="밀물의 파도"?{className:"tide",eyebrow:"RISING TIDE"}:title==="화염의 심박"?{className:"heartbeat",eyebrow:"BURNING HEART"}:title==="추격 폭풍"?{className:"storm",eyebrow:"STORM RESONANCE"}:eternalPresentation||null;
    const voidClass=voidSkill?` battle-event--void${voidPresentation?` battle-event--void-${voidPresentation.className}`:""}`:"";
    const allyClass=allyPresentation?` battle-event--ally-${allyPresentation.className}`:"";
    return `<span class="battle-event battle-event--ally${allyClass}${voidClass}"><span class="battle-event__eyebrow">${voidPresentation?.eyebrow||allyPresentation?.eyebrow||(voidSkill?"VOID SIGNATURE":"ALLY SKILL")}</span><b>${fishLabel} · ${escapeHtml(title)}</b>${body?`<span class="battle-event__body">${body}</span>`:""}</span>`;
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
    c._traitBattle={
      originalMaxHp:c.maxHp,
      originalCritDamage:c.critDamage,
      battleStartHp:c.hp,
      battleStartMaxHp:c.maxHp,
      battleStartStatus:c.status,
      battleStartStunUntil:c.stunUntil
    };
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
      const old=c.maxHp; c.maxHp=Math.floor(c.maxHp*1.2); healFishForBattle(f,Math.floor(old*0.3),battleLog);
      battleLog.push(traitUseByFish(f, color(lineFish(f),f.grade)+"\n최대 체력 20% 증가, 체력 30% 회복, 공격력과 회피율이 상승했습니다.","승천"));
    }
  });

  traitFishes(ctx.participants,"금빛 보름달 드래곤").forEach(f=>{
    const st=traitState(f); st.moonPhase=(turn-1)%3;
    if(st.moonPhase===1){
      const target=getAliveTargets(ctx.participants).sort((a,b)=>ensureCombatStats(a).hp/ensureCombatStats(a).maxHp-ensureCombatStats(b).hp/ensureCombatStats(b).maxHp)[0];
      if(target){ const c=ensureCombatStats(target),heal=healFishForBattle(target,Math.floor(c.maxHp*0.1),battleLog); battleLog.push(traitUseByFish(f, "반달\n"+color(lineFish(target),target.grade)+" "+heal.toLocaleString()+" 회복")); }
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
  if(isFishTraitSealed(f)) return "상태 : 고유 특성 봉인";
  const stateText=getCyclingTraitStateText(f,traitState(f));
  return stateText || "";
}

function getStormEye(){
  const ctx=activeTraitBattle;if(!ctx||!traitFish(ctx.participants,"휘몰아치는 마음"))return null;
  return getAliveTargets(ctx.participants).sort((a,b)=>ensureCombatStats(a).hp/Math.max(1,ensureCombatStats(a).maxHp)-ensureCombatStats(b).hp/Math.max(1,ensureCombatStats(b).maxHp))[0]||null;
}

function getSingleTargetCandidates(targets){
  return getAliveTargets(targets);
}

function beginBossSpecial(boss,skillName,battleLog,eventKind="skill"){
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
      const c=ensureCombatStats(ally),heal=healFishForBattle(ally,Math.max(1,Math.floor(c.maxHp*0.18)),battleLog),removed=clearOneFishStatus(ally);
      reversedLogs.push(color(lineFish(ally),ally.grade)+(removed?" · "+removed+" 해제":"")+" · "+heal.toLocaleString()+" 회복");
    });
    boss._observedWeakUntil=ctx.turn+3;
    ctx.observedSkill="";ctx.observedUntil=0;
    battleLog.push(traitUseByFish(observedFish, bossColor(boss.name,boss)+"의 "+objectText(skillName)+" 뒤집었습니다.\n"+reversedLogs.join("\n")+"\n보스의 공격력이 3턴 동안 25% 감소합니다."));
    return false;
  }
  if(!ctx.frozenSkills)ctx.frozenSkills={};
  if(Number(ctx.frozenSkills[skillName]||0)>0&&Number(ctx.frozenSkills[skillName])>=ctx.turn){battleLog.push(traitUseByFish(frozenFish, subjectText(skillName)+" 얼어붙어 사용할 수 없습니다."));return false;}
  if(!ctx.seenBossSpecials)ctx.seenBossSpecials=new Set();
  if(frozenFish&&ctx.seenBossSpecials.has(skillName)){ctx.frozenSkills[skillName]=ctx.turn+3;ctx.seenBossSpecials.delete(skillName);battleLog.push(traitUseByFish(frozenFish, "반복된 "+objectText(skillName)+" 취소하고 3턴 동안 봉인했습니다."));return false;}
  ctx.seenBossSpecials.add(skillName);
  const observationActive=observedFish&&ctx.observedSkill&&ctx.turn<=ctx.observedUntil;
  if(observedFish&&!observationActive){ctx.observedSkill=skillName;ctx.observedUntil=ctx.turn+3;battleLog.push(traitUseByFish(observedFish, objectText(skillName)+" 3턴 동안 관측합니다."));}
  battleLog.push(bossBattleEvent(boss,skillName,eventKind==="crazy"?"전투당 한 번만 사용하는 궁극기가 발동했습니다.":"특수 기술이 발동했습니다.",eventKind));
  return true;
}

function runBossSpecial(boss,skillName,battleLog,fn,eventKind="skill"){
  if(!beginBossSpecial(boss,skillName,battleLog,eventKind))return false;
  boss._activeSpecialName=skillName;
  try{ fn(); }finally{ delete boss._activeSpecialName; }
  return true;
}

function tryReverseBossSpecial(){ return false; }

function traitModifyIncoming(f,damage,battleLog,meta={}){
  const ctx=activeTraitBattle,c=ensureCombatStats(f),st=traitState(f);
  let final=Math.max(0,Math.floor(damage)),afterHeal=0;
  const deferredLogs=[];
  if(!ctx) return {damage:final,afterHeal,deferredLogs};
  const ownTraitActive=!isFishTraitSealed(f);
  const stormFish=traitFish(ctx.participants,"휘몰아치는 마음");
  const lifeEndActive=Number(ctx.lifeEndUntil||0)>=Number(ctx.turn||0);
  if(lifeEndActive) meta.blockDeathPrevention=true;
  if(stormFish&&!isFishTraitSealed(stormFish)&&meta.singleTarget&&!meta.ignoreReduction&&getStormEye()===f){
    final=Math.floor(final*0.5);
    deferredLogs.push(traitUseByFish(stormFish,color(lineFish(f),f.grade)+"가 폭풍의 눈에 들어 단일 대상 피해가 50% 감소했습니다."));
  }
  if(ownTraitActive&&!meta.ignoreReduction&&f.name==="금빛 보름달 드래곤"&&st.moonPhase===0) final=Math.floor(final*0.8);
  if(ownTraitActive&&f.name==="불타는 마음"&&getBurningHeartStageByCombat(c)>=3) final=Math.floor(final*1.2);
  if(ownTraitActive&&!meta.forced&&f.name==="기묘한 기운 🌀"&&final>Number(c.attack||0)&&Math.random()<0.25){
    st.numericStored=Math.max(1,Math.floor(final*1.1/FISH_HP_BALANCE_MULTIPLIER)); final=Math.max(0,Math.floor(c.attack));
    deferredLogs.push(traitUseByFish(f, "받을 피해와 공격 수치가 뒤바뀌었습니다. 다음 공격 : "+st.numericStored.toLocaleString()));
  }
  const lethal=final>=c.hp;
  const hasLetters=traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️")&&traitFish(ctx.participants,"잃어버린 두 번째 편지 조각 ✉️")&&traitFish(ctx.participants,"잃어버린 세 번째 편지 조각 ✉️");
  if(lethal&&!meta.blockDeathPrevention&&hasLetters&&!ctx.rewriteUsed){
    ctx.rewriteUsed=true; final=0;
    deferredLogs.push(traitUseByFish(traitFish(ctx.participants,"잃어버린 첫 번째 편지 조각 ✉️"), fishSubjectLabel(f)+" 쓰러지는 사건과 그 피해가 삭제되었습니다.", "다시 쓰인 편지"));
  }else if(lethal&&ownTraitActive&&!meta.blockDeathPrevention&&f.name==="잿빛 밤하늘 드래곤"&&!st.ashUsed){
    st.ashUsed=true;st.ashTurns=3;st.ashRemnant=true;final=Math.max(0,c.hp-1);
    deferredLogs.push(traitUseByFish(f, color(lineFish(f),f.grade)+"\n3턴 동안 대상이 되지 않고 공격력 50%로 공격합니다."));
  }else if(lethal&&!meta.blockDeathPrevention&&traitFish(ctx.participants,"빛나는 마음")){
    const required=Math.max(1,Math.floor(c.maxHp*0.3));
    if(ctx.lightPool>=required){
      ctx.lightPool-=required; final=Math.max(0,c.hp-1); afterHeal=required;meta.skipLightGain=true;
      deferredLogs.push(traitUseByFish(traitFish(ctx.participants,"빛나는 마음"), color(lineFish(f),f.grade)+"의 죽음을 막고 "+afterHeal.toLocaleString()+" 체력을 회복합니다."));
    }
  }
  return {damage:final,afterHeal,deferredLogs};
}

function traitAfterDamage(f,beforeHp,actualDamage,battleLog,meta={},afterHeal=0){
  const ctx=activeTraitBattle;if(!ctx)return {appliedAfterHeal:0};
  const c=ensureCombatStats(f),st=traitState(f);
  const healingBlocked=Number(c.healingBlockedUntil||0)>=Number(ctx.turn||0)||Number(ctx.lifeEndUntil||0)>=Number(ctx.turn||0);
  let appliedAfterHeal=0;
  if(afterHeal>0&&!healingBlocked)appliedAfterHeal=healFishForBattle(f,afterHeal,battleLog);
  if(actualDamage>0&&!meta.skipLightGain&&traitFish(ctx.participants,"빛나는 마음"))ctx.lightPool+=Math.floor(actualDamage*0.25);
  if(c.hp<=0&&f.name==="무한한 시간"&&!ctx.timeRewindUsed&&!healingBlocked)ctx.timeRewindPending=true;
  if(meta.fromBoss&&actualDamage>0){
    if(ctx.lastBossTarget===f.id&&f.name==="흑룡"&&!isFishTraitSealed(f)){
      const reflected=Math.floor(actualDamage*0.3/FISH_HP_BALANCE_MULTIPLIER),beforeBossHp=Math.max(0,Number(ctx.boss._currentHp||0));
      ctx.boss._currentHp=Math.max(0,beforeBossHp-reflected);ctx.traitDamage+=Math.min(beforeBossHp,reflected);st.scaleEmpowered=true;
      battleLog.push(traitUseByFish(f, reflected.toLocaleString()+" 피해를 반사하고 다음 공격이 강화됩니다."));
    }
    ctx.lastBossTarget=f.id;
  }
  return {appliedAfterHeal};
}

function traitAttackStats(f,boss,battleLog){
  const ctx=activeTraitBattle,c=ensureCombatStats(f),st=traitState(f);
  let attack=getEffectiveFishAttack(f,boss),critDamage=Number(c.critDamage||150),multiplier=1,extra=0,replaced=false;
  if(!ctx)return {attack,critDamage,multiplier,extra,replaced};
  if(isFishTraitSealed(f)) return {attack,critDamage,multiplier,extra,replaced};
  if(st.ashRemnant)multiplier*=0.5;
  if(f.name==="핏빛 초승달 드래곤"){
    const cost=Math.min(Math.max(0,c.hp-1),Math.floor(c.hp*0.05)),bonus=Math.floor(cost*1.5/FISH_HP_BALANCE_MULTIPLIER);c.hp-=cost;extra+=bonus;
    if(cost>0)battleLog.push(traitUseByFish(f, "체력 "+cost.toLocaleString()+" 소모 · 추가 피해 "+bonus.toLocaleString()));
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
  if(st.numericStored){attack=st.numericStored;multiplier=1;extra=0;replaced=true;delete st.numericStored;}
  return {attack,critDamage,multiplier,extra,replaced};
}

function dealTraitDamage(boss,raw,label,battleLog){
  const ctx=activeTraitBattle;if(!ctx||raw<=0||Number(boss._currentHp)<=0)return 0;
  const damage=applyBossPassiveBeforeFishAttack(boss,Math.max(1,Math.floor(raw)),battleLog);
  const beforeBossHp=Math.max(0,Number(boss._currentHp||0)),actualBossDamage=Math.min(beforeBossHp,damage);
  const eventLabel=String(label||"").includes("battle-event--ally")?String(label).replace("battle-event--ally","battle-event--ally battle-event--ally-attack"):String(label||"");
  const separateSkillResult=eventLabel.includes("battle-event--ally-attack");
  if(separateSkillResult)battleLog.push(eventLabel);
  boss._currentHp=Math.max(0,beforeBossHp-damage);ctx.traitDamage+=actualBossDamage+Number(boss._lastDamageToSword||0);
  const hpChange="보스 체력 "+beforeBossHp.toLocaleString()+" → "+Number(boss._currentHp).toLocaleString();
  if(boss.id==="surtr" && Number(boss._lastDamageToSword||0)>0){
    let entry = "수르트가 피해를 불꽃의 검과 나눠 받았습니다.\n\n";
    entry += "수르트 : " + actualBossDamage.toLocaleString() + " 피해\n";
    entry += "불꽃의 검 : " + Number(boss._lastDamageToSword||0).toLocaleString() + " 피해\n";
    entry += "검 내구도 : " + Number(boss._flameSwordHp||0).toLocaleString() + " / 30,000,000";
    entry += "\n" + hpChange + "\n\n" + bossColor(boss.name,boss) + "\n" + hpBar(boss._currentHp,boss.hp);
    if(separateSkillResult)battleLog.push(entry);else battleLog.push(eventLabel+"\n\n"+entry);
    if(boss._flameSwordJustBroken)battleLog.push(bossBattleEvent(boss,"불꽃의 검 파괴","검의 피해 분담이 끝나고 수르트가 받는 피해가 "+(boss.difficulty==="crazy"?20:boss.difficulty==="hard"?25:30)+"% 증가합니다.","phase"));
  } else {
    const result=actualBossDamage.toLocaleString()+" 피해\n"+hpChange+"\n\n"+bossColor(boss.name,boss)+"\n"+hpBar(boss._currentHp,boss.hp);
    if(separateSkillResult)battleLog.push(result);else battleLog.push(eventLabel+"\n\n"+result);
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
  const ctx=activeTraitBattle;if(!ctx||ctx.periodStarted||Number(boss._currentHp)<=0||Number(boss._currentHp)>boss.hp*0.18)return false;
  const periodFish=traitFish(ctx.participants,"잃어버린 세 번째 편지 조각 ✉️");if(!periodFish)return false;
  ctx.periodStarted=true;ctx.periodSentences=0;boss._periodEnraged=true;boss._healingSealed=true;
  battleLog.push(traitUseByFish(periodFish, "보스의 마지막 문장이 시작되었습니다.\n회복이 봉인됩니다.\n문장 0 / 5\n보스의 공격력이 25% 증가합니다."));
  return true;
}

function afterFishAttackTrait(f,boss,outcome,baseAttack,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  const st=traitState(f);
  if(outcome==="crit")advanceWish("crit",battleLog);
  if(isFishTraitSealed(f)){ startPeriodTraitIfNeeded(boss,battleLog); return; }
  const galaxy=traitFish(ctx.participants,"호수에 비친 은하수");
  if(galaxy){
    const gs=traitState(galaxy);if(!gs.constellation)gs.constellation={hit:false,crit:false,miss:false};gs.constellation[outcome]=true;
    if(gs.constellation.hit&&gs.constellation.crit&&gs.constellation.miss){
      const raw=getAliveTargets(ctx.participants).reduce((sum,x)=>sum+Math.floor(getEffectiveFishAttack(x,boss)*0.3),0);gs.constellation={hit:false,crit:false,miss:false};
      dealTraitDamage(boss,raw,traitUseByFish(galaxy, "일반 적중, 치명타, 빗나감을 모두 기록해 별자리가 완성되었습니다.\n살아 있는 아군의 힘이 별빛으로 이어집니다.","별자리 완성"),battleLog);
    }
  }
  const stormFish=traitFish(ctx.participants,"휘몰아치는 마음");
  if(stormFish&&outcome!=="miss"&&!isFishTraitSealed(stormFish)&&Number(boss._currentHp)>0){
    const stormState=traitState(stormFish);
    stormState.stormStacks=Math.min(8,Number(stormState.stormStacks||0)+1);
    const stormIndex=ctx.participants.indexOf(stormFish);
    const latestFrame=battleLog.replayFrames?.[battleLog.replayFrames.length-1];
    if(latestFrame?.fish?.[stormIndex])latestFrame.fish[stormIndex].effects=getFishReplayEffects(stormFish,boss);
    if(stormState.stormStacks>=8){
      stormState.stormStacks=0;
      dealTraitDamage(boss,getEffectiveFishAttack(stormFish,boss)*2.5,traitUseByFish(stormFish,"바람 8 / 8\n파티의 공격이 거대한 추격 폭풍으로 이어졌습니다.","추격 폭풍"),battleLog);
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
    if(boss._whiteFlameStacks>=3){boss._whiteFlameStacks=0;dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*1.5,traitUseByFish(f, "백염이 3중첩이 되어 폭발했습니다.","백염 폭발"),battleLog);}
    else battleLog.push(traitUseByFish(f, "백염 "+boss._whiteFlameStacks+" / 3"));
  }
  if(f.name==="해신룡"){
    if(st.tideHigh){dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*0.4,traitUseByFish(f, "밀물의 파도가 이어져 추가 피해가 들어갑니다.","밀물의 파도"),battleLog);st.tideStored=false;}
    else st.tideStored=true;
  }
  if(f.name==="바다를 삼킨 태양"&&st.sunStage===5)dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*2,traitUseByFish(f, "태양 주기가 태양 폭발 단계에 도달했습니다.","태양 폭발"),battleLog);
  if(f.name==="불타는 마음"&&Number(st.heartbeatStage||0)>=2&&Number(boss._currentHp)>0){
    const chance=Number(st.heartbeatStage)>=3?0.5:0.3;
    const ratio=Number(st.heartbeatStage)>=3?0.5:0.4;
    if(Math.random()<chance){
      dealTraitDamage(boss,getEffectiveFishAttack(f,boss)*ratio,traitUseByFish(f, "불꽃의 잔영이 추가 공격을 가했습니다.","화염의 심박"),battleLog);
    }
  }
  if(f.name==="불타는 마음"&&Number(st.heartbeatStage||0)>=3){
    const c=ensureCombatStats(f);
    const cap=Math.floor(c.maxHp*0.3);
    if(c.hp>0&&c.hp<cap&&Math.random()<0.25){
      const heal=Math.min(Math.floor(c.hp*0.3),cap-c.hp);
      if(heal>0){
        c.hp=Math.min(cap,c.hp+heal);
        battleLog.push(traitUseByFish(f, "화염의 심박으로 체력을 회복했습니다.\n체력 "+heal.toLocaleString()+" 회복"));
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
  const downBefore=new Map(ctx.participants.map(f=>[f.id,Number(ensureCombatStats(f).hp||0)<=0]));
  ctx.participants.forEach(f=>restoreFishTraitState(f,target.states.get(f.id)));
  if(ctx.boss?.id==="angra_mainyu"&&ctx.boss.difficulty==="crazy")ctx.participants.forEach(f=>{const c=ensureCombatStats(f);if(downBefore.get(f.id)&&c.hp>0&&!c.goodDeniedByAngra){c.goodDeniedByAngra=true;reduceExistence(ctx.boss,f,1,battleLog,"선의 부정");ctx.boss._voidShieldHp=Math.min(Math.floor(ctx.boss.hp*0.10),Number(ctx.boss._voidShieldHp||0)+Math.floor(c.hp*0.5));ctx.boss._voidShieldUntil=999;}});
  const rewound=Math.max(0,ctx.turn-target.turn);
  battleLog.push(traitUseByFish(timeFish, "무한한 시간의 죽음과 함께 시간이 되감겼습니다.\n파티가 "+rewound+"턴 전 상태로 돌아왔습니다.\n보스의 상태와 체력은 유지됩니다."));return true;
}

function finishTraitTurn(boss,battleLog){
  const ctx=activeTraitBattle;if(!ctx)return;
  if(ctx.participants.some(f=>{const c=ensureCombatStats(f);return isBattleTargetableFish(f)&&c.maxHp>0&&c.hp/c.maxHp<=0.15;}))advanceWish("low",battleLog);
  startPeriodTraitIfNeeded(boss,battleLog);
}

function hasTyphonWeather(boss,weather){
  if(Array.isArray(boss._typhonWeathers))return boss._typhonWeathers.includes(weather);
  return boss._typhonWeather===weather;
}

function getBossAttackMultiplier(boss){
  let multiplier = 1;

  if(boss._enraged) multiplier *= Number(boss._enrageMultiplier||1.3);
  if(boss._periodEnraged){
    multiplier *= 1.25;
  }
  multiplier *= 1+Math.max(0,Number(boss._crazyAttackBoost||0));
  if(activeTraitBattle&&Number(boss._observedWeakUntil||0)>=activeTraitBattle.turn){
    multiplier *= 0.75;
  }

  if(boss.id === "jormungandr"){
    const maxBoost = boss._ringCompleted
      ? (boss.difficulty==="crazy"?1.5:boss.difficulty==="hard"?1.25:1.0)
      : (boss.difficulty==="crazy"?1.0:boss.difficulty==="hard"?0.75:0.5);
    const boost = Math.min(maxBoost, Number(boss._attackBoost || 0));
    multiplier *= (1 + boost);
  }

  if(boss.id === "fenrir" && Number(boss._gleipnirKnots || 0) > 0){
    multiplier *= boss.difficulty==="crazy"?0.65:boss.difficulty==="hard"?0.70:0.75;
  }
  if(boss.id==="fenrir" && Number(boss._gleipnirKnots||0)<=0 && boss.difficulty==="crazy") multiplier*=1.5;
  if(boss.id==="cerberus"){
    const heads=getCerberusHeadCount(boss);
    if(boss.difficulty==="crazy")multiplier*=1+heads*0.08;
    else if(boss.difficulty==="hard")multiplier*=1+heads*0.04;
    if(boss.difficulty==="crazy")multiplier*=1+(3-heads)*0.35;
  }

  if(boss.id==="nyarlathotep"&&Array.isArray(boss._nyarlMasks)&&boss._nyarlMasks.includes("tyrant"))multiplier*=1.2;

  if(boss.id === "typhon" && hasTyphonWeather(boss,"headwind")) multiplier *= 1.1;
  if(boss.id === "angra_mainyu" && boss._eternalNight) multiplier *= 1.3;
  if(boss.id === "azathoth" && activeTraitBattle && Number(boss._awakenedUntil||0)>=activeTraitBattle.turn) multiplier *= boss.difficulty==="crazy"&&boss._crazyUltimateUsed?1.75:1.5;

  return multiplier;
}

function getBossAttackValue(boss, bossAttackMultiplier=1){
  const bonusAttack = Number(boss._bahamutAttackBonus || 0) + Number(boss._fenrirNextAttackBonus || 0) + Number(boss._stolenAttackBonus||0);
  return Math.floor((boss.attack + bonusAttack) * bossAttackMultiplier * getBossAttackMultiplier(boss));
}

function getAliveTargets(targets){
  return targets.filter(f => {
    return isBattleTargetableFish(f);
  });
}

function getStrongestAliveFish(targets){
  const alive = getAliveTargets(targets);
  return alive.sort((a,b) => ensureCombatStats(b).attack - ensureCombatStats(a).attack)[0] || null;
}

function getEffectiveBossDodge(boss){
  if(boss.id === "fenrir" && Number(boss._gleipnirKnots || 0) > 0) return 0;
  if(boss.id === "angra_mainyu" && boss._eternalNight) return 0;
  if(boss.id === "erebos" && activeTraitBattle && Number(boss._darknessUntil||0)>=activeTraitBattle.turn) return Number(boss.dodge||0)+25;
  const ctx=activeTraitBattle;
  if(ctx && traitFishes(ctx.participants,"바다를 삼킨 태양").some(f=>traitState(f).sunStage===3)) return 0;
  if(boss.id === "typhon" && hasTyphonWeather(boss,"turbulence")) return Number(boss.dodge || 0) + 10;
  let value=Number(boss.dodge || 0);
  if(ctx && traitFishes(ctx.participants,"해신룡").some(f=>traitState(f).tideHigh)) value-=10;
  return Math.max(0,value);
}

function getBattleHealingMultiplier(f){
  const c=ensureCombatStats(f),ctx=activeTraitBattle,turn=ctx?Number(ctx.turn||0):0,boss=ctx&&ctx.boss;
  if(ctx&&Number(ctx.lifeEndUntil||0)>=turn)return 0;
  let multiplier=Number(c.healingPenalty===undefined?1:c.healingPenalty);
  if(Number(c.leviathanHealingUntil||0)>=turn)multiplier*=0.5;
  if(boss&&boss.id==="azathoth"&&boss.difficulty==="crazy"&&Array.isArray(boss._chaosDreamRules)&&boss._chaosDreamRules.includes("healing")&&Number(boss._chaosDreamUntil||0)>=turn)multiplier=0;
  if(boss&&boss.id==="cerberus"&&boss.difficulty==="crazy"&&getCerberusHeadCount(boss)<=2)multiplier*=0.7;
  if(boss&&boss.id==="nyarlathotep"&&Array.isArray(boss._nyarlMasks)&&boss._nyarlMasks.includes("prophet"))multiplier*=0.5;
  return Math.max(0,multiplier);
}

function healFishForBattle(f,amount,battleLog=null){
  const c=ensureCombatStats(f),before=Number(c.hp||0);
  const applied=Math.max(0,Math.floor(Number(amount||0)*getBattleHealingMultiplier(f)));
  c.hp=Math.min(c.maxHp,before+applied);
  const healed=Math.max(0,c.hp-before),boss=activeTraitBattle&&activeTraitBattle.boss;
  if(healed>=c.maxHp*0.15&&boss&&boss.id==="angra_mainyu"&&boss.difficulty==="crazy"&&!c.goodDeniedByAngra){
    c.goodDeniedByAngra=true;
    if(battleLog)reduceExistence(boss,f,1,battleLog,"선의 부정");
    boss._voidShieldHp=Math.min(Math.floor(boss.hp*0.10),Number(boss._voidShieldHp||0)+Math.floor(healed*0.5));boss._voidShieldUntil=999;
  }
  return healed;
}

function getEffectiveFishAttack(f, boss){
  const c = ensureCombatStats(f);
  let value = Number(c.attack || 0);
  if(c.azhiCurses && c.azhiCurses.weakness) value *= 0.85;
  if(boss.id === "typhon" && hasTyphonWeather(boss,"headwind")) value *= 0.8;
  if(traitState(f).ascended) value *= 1.3;
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  if(Number(c.bossAttackDebuffUntil||0)>0&&Number(c.bossAttackDebuffUntil)>=turn) value*=1-Math.max(0,Number(c.bossAttackDebuffRate||0));
  if(Number(c.roarDebuffUntil||0)>0&&Number(c.roarDebuffUntil)>=turn) value*=1-Math.max(0,Number(c.roarAttackDebuffRate??0.20));
  if(Number(c.darknessDebuffUntil||0)>0&&Number(c.darknessDebuffUntil)>=turn) value*=0.7;
  if(Number(c.abyssPressureUntil||0)>0&&Number(c.abyssPressureUntil)>=turn)value*=0.75;
  return Math.max(0, Math.floor(value));
}

function getEffectiveFishDodge(f, boss){
  const c = ensureCombatStats(f);
  let value = Number(c.dodge || 0);
  if(c.azhiCurses && c.azhiCurses.fear) value *= 0.5;
  if(boss.id === "typhon" && hasTyphonWeather(boss,"turbulence")) value -= 10;
  if(boss.id === "typhon" && hasTyphonWeather(boss,"eye")) value = 0;
  if(boss._ignoreDodge||(activeTraitBattle&&Number(boss._ignoreDodgeUntil||0)>=activeTraitBattle.turn)) value=0;
  if(traitState(f).ascended) value += 10;
  if(f.name === "해신룡" && !traitState(f).tideHigh) value += 15;
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  if(Number(c.gazeDebuffUntil||0)>0&&Number(c.gazeDebuffUntil)>=turn) value=0;
  if(boss.id==="cerberus"&&boss.difficulty==="crazy"&&getCerberusHeadCount(boss)<=1)value-=15;
  return Math.max(0, value);
}

function getEffectiveFishCritRate(f){
  const c = ensureCombatStats(f);
  let value=Number(c.critRate||0)-(c.azhiCurses&&c.azhiCurses.distrust?15:0);
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  if(Number(c.roarDebuffUntil||0)>0&&Number(c.roarDebuffUntil)>=turn) value-=Math.max(0,Number(c.roarCritDebuff??20));
  if((Number(c.critSuppressedUntil||0)>0&&Number(c.critSuppressedUntil)>=turn)||(Number(c.gazeDebuffUntil||0)>0&&Number(c.gazeDebuffUntil)>=turn)) value=0;
  const boss=activeTraitBattle&&activeTraitBattle.boss;
  if(boss&&boss.id==="erebos"&&Number(boss._darknessUntil||0)>0&&Number(boss._darknessUntil)>=turn)value=0;
  if(Number(c.abyssPressureUntil||0)>0&&Number(c.abyssPressureUntil)>=turn)value-=15;
  if(boss&&boss.id==="azathoth"&&boss.difficulty==="crazy"&&boss._chaos50)value-=15;
  return Math.max(0,value);
}

function applyDamageToFish(f, damage, battleLog, prefix, meta={}){
  const c = ensureCombatStats(f);
  const beforeHp = c.hp;
  const modified=traitModifyIncoming(f,damage,battleLog,meta);
  damage=modified.damage;
  c.hp = Math.max(0, c.hp - damage);
  const actualDamage = Math.min(beforeHp, damage);

  let logText = prefix;
  logText += damage.toLocaleString() + " 피해\n\n";
  logText += color(lineFish(f), f.grade) + "\n" + hpBar(c.hp, c.maxHp);
  battleLog.push(logText);
  (modified.deferredLogs||[]).forEach(entry=>battleLog.push(entry));
  const afterResult=traitAfterDamage(f,beforeHp,actualDamage,battleLog,meta,modified.afterHeal);
  if(Number(afterResult?.appliedAfterHeal||0)>0){
    battleLog.push(color(lineFish(f),f.grade)+"\n"+hpBar(c.hp,c.maxHp));
  }

  if(c.hp <= 0){
    stunFish(f);
    battleLog.push(color(lineFish(f), f.grade) + "\n체력이 0이 되어 회복 중입니다.");
  }

  const peers = Array.isArray(c.rootLinkedPeers) ? c.rootLinkedPeers.filter(x => x !== f && isBattleTargetableFish(x)) : [];
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
  const appliesBurn=!!options.burn||(boss.id==="surtr"&&boss.difficulty==="crazy"&&boss._muspelAwakened);
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
    splitTargets.forEach(x=>applyDamageToFish(x,split,battleLog,bossColor(boss.name,boss)+"의 "+skillName+" · 굴절\n",{fromBoss:true,isSpecial,skillName,ignoreReduction:!!options.ignoreReduction}));
  }else applyDamageToFish(f, bossHit.damage, battleLog, prefix,{fromBoss:true,isSpecial,skillName,ignoreReduction:!!options.ignoreReduction,singleTarget:true});

  if(ensureCombatStats(f).hp > 0 && appliesBurn){
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
  const appliesBurn=!!options.burn||(boss.id==="surtr"&&boss.difficulty==="crazy"&&boss._muspelAwakened);
  if(options.isSpecial && !boss._activeSpecialName && !beginBossSpecial(boss,skillName,battleLog)) return false;
  if(!f) return false;
  const c = ensureCombatStats(f);
  if(!isBattleTargetableFish(f)) return false;

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
    splitTargets.forEach(x=>applyDamageToFish(x,split,battleLog,bossColor(boss.name,boss)+"의 "+skillName+" · 굴절\n",{fromBoss:true,isSpecial,skillName,ignoreReduction:!!options.ignoreReduction}));
  }else applyDamageToFish(f, hit.damage, battleLog, prefix,{fromBoss:true,isSpecial,skillName,ignoreReduction:!!options.ignoreReduction,singleTarget:true});
  if(ensureCombatStats(f).hp>0&&appliesBurn){
    c.burnStacks=Math.min(3,Number(c.burnStacks||0)+1);
    battleLog.push(color(lineFish(f),f.grade)+"\n화상 "+c.burnStacks+"중첩");
    registerTraitStatus(f,battleLog);
  }
  if(ensureCombatStats(f).hp>0&&options.poison){c.poisonStacks=Math.min(3,Number(c.poisonStacks||0)+1);battleLog.push(color(lineFish(f),f.grade)+"\n독 "+c.poisonStacks+"중첩");registerTraitStatus(f,battleLog);}
  return true;
}

function bossAllTargetAttack(boss, targets, battleLog, bossAttackMultiplier=1, skillName="전체 공격", options={}){
  const isSpecial=!!options.isSpecial||boss._activeSpecialName===skillName;
  const appliesBurn=!!options.burn||(boss.id==="surtr"&&boss.difficulty==="crazy"&&boss._muspelAwakened);
  if(options.isSpecial && !boss._activeSpecialName && !beginBossSpecial(boss,skillName,battleLog)) return false;
  const bossAttack = getBossAttackValue(boss, bossAttackMultiplier);
  const activeTargets=targets.filter(f=>isBattleTargetableFish(f));

  activeTargets.forEach((f,targetIndex) => {
    const logs=[];
    const c = ensureCombatStats(f);

    const dodgeRoll = Math.random() * 100 < getEffectiveFishDodge(f, boss);
    if(dodgeRoll && !options.ignoreDodge){
      logs.push(color(lineFish(f), f.grade) + "\n회피");
      advanceWish("dodge",battleLog);
      battleLog.push(bossColor(boss.name,boss)+"의 "+skillName+"\n대상 "+(targetIndex+1)+" / "+activeTargets.length+"\n\n"+logs.join("\n\n"));
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
    applyDamageToFish(f,damage,logs,prefix,{fromBoss:true,isSpecial,skillName,ignoreReduction:!!options.ignoreReduction});
    if(ensureCombatStats(f).hp>0&&appliesBurn){
      c.burnStacks=Math.min(3,Number(c.burnStacks||0)+1);
      logs.push(color(lineFish(f),f.grade)+"\n화상 "+c.burnStacks+"중첩");
    }
    if(logs.length)battleLog.push(bossColor(boss.name,boss)+"의 "+skillName+"\n대상 "+(targetIndex+1)+" / "+activeTargets.length+"\n\n"+logs.join("\n\n"));
    if(ensureCombatStats(f).hp>0&&appliesBurn)registerTraitStatus(f,battleLog);
  });
  return true;
}

function applyBossPassiveBeforeFishAttack(boss, damage, battleLog=null){
  boss._lastDamageToSword = 0;
  boss._flameSwordJustBroken = false;
  boss._lastReflectedDamage=0;

  if(Number(boss._voidShieldHp||0)>0 && (!activeTraitBattle || Number(boss._voidShieldUntil||0)>=activeTraitBattle.turn)){
    const absorbed=Math.min(Number(boss._voidShieldHp),damage);
    boss._voidShieldHp=Math.max(0,Number(boss._voidShieldHp)-absorbed);
    damage-=absorbed;
    if(battleLog)battleLog.push(bossBattleEvent(boss,"폭풍 장벽",absorbed.toLocaleString()+" 피해 흡수 · 남은 보호막 "+Number(boss._voidShieldHp).toLocaleString(),"passive"));
  }

  if(Number(boss._wrathCharges||0)>0){
    boss._wrathCharges--;
    const reduction=clamp(Number(boss._wrathReduction??0.5),0,0.9),reflection=clamp(Number(boss._wrathReflect??0.3),0,1);
    boss._lastReflectedDamage=Math.floor(damage*reflection);
    damage=Math.floor(damage*(1-reduction));
    if(boss._wrathCharges<=0&&boss._wrathFinalePending)boss._wrathFinaleReady=true;
    if(battleLog)battleLog.push(bossBattleEvent(boss,"용왕의 역린","받는 피해 "+Math.round(reduction*100)+"% 감소 · 공격자에게 "+Math.round(reflection*100)+"% 반사 · 남은 역린 "+boss._wrathCharges,"passive"));
  }

  if(boss.id==="nyarlathotep"&&Array.isArray(boss._nyarlMasks)&&boss._nyarlMasks.includes("mirror")){
    damage=Math.floor(damage*0.75);
  }

  if(boss.id === "behemoth"){
    const reduction=boss.difficulty==="crazy"?0.40:boss.difficulty==="hard"?0.30:0.20;
    damage=Math.floor(damage*(1-reduction));
    if(Number(boss._stoneArmorHp||0)>0){
      damage=Math.floor(damage*0.8);
      const absorbed=Math.min(Number(boss._stoneArmorHp),damage);
      boss._stoneArmorHp=Math.max(0,Number(boss._stoneArmorHp)-absorbed);
      damage-=absorbed;
      if(battleLog)battleLog.push(bossBattleEvent(boss,"암석 갑옷",absorbed.toLocaleString()+" 피해 흡수 · 남은 갑옷 "+Number(boss._stoneArmorHp).toLocaleString(),"passive"));
      if(boss._stoneArmorHp<=0){
        boss._stoneExposedUntil=(activeTraitBattle?activeTraitBattle.turn:0)+1;
        if(battleLog)battleLog.push(bossBattleEvent(boss,"대륙의 균열","암석 갑옷이 무너져 다음 턴까지 받는 피해가 20% 증가합니다.","phase"));
      }
    }else if(activeTraitBattle&&Number(boss._stoneExposedUntil||0)>=activeTraitBattle.turn){
      damage=Math.floor(damage*1.2);
    }
    return Math.max(0,damage);
  }

  if(boss.id==="cerberus"&&boss.difficulty!=="normal"){
    const perHead=boss.difficulty==="crazy"?0.06:0.03;
    damage=Math.floor(damage*(1-getCerberusHeadCount(boss)*perHead));
  }

  if(boss.id === "bahamut"){
    const record = Number(boss._damageRecord || 0);
    if(damage >= record){
      const reduction=boss.difficulty==="crazy"?0.70:boss.difficulty==="hard"?0.60:0.50;
      const reduced = Math.floor(damage * (1-reduction));
      boss._damageRecord = reduced;
      if(battleLog){
        battleLog.push(bossBattleEvent(boss,"드래곤 스케일",damage.toLocaleString()+" 피해를 "+reduced.toLocaleString()+" 피해로 감소 · 피해 기록 "+reduced.toLocaleString(),"passive"));
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
        if(boss.difficulty==="crazy"&&!boss._muspelAwakened){
          boss._muspelAwakened=true;
          boss._crazyAttackBoost=Math.max(Number(boss._crazyAttackBoost||0),0.30);
          if(battleLog)battleLog.push(bossBattleEvent(boss,"멸망의 불꽃","공격력이 30% 증가하고 모든 공격이 화상을 남깁니다.","phase"));
        }
      }
      return bossDamage;
    }

    if(boss._flameSwordBroken) return Math.floor(damage * (boss.difficulty==="crazy"?1.2:boss.difficulty==="hard"?1.25:1.3));
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
  const maxKnots=boss.difficulty==="crazy"?8:boss.difficulty==="hard"?7:6;
  battleLog.push(bossBattleEvent(boss,"글레이프니르","매듭 해제 · "+boss._gleipnirKnots+" / "+maxKnots+" 남음","passive"));

  if(boss._gleipnirKnots <= 0){
    battleLog.push(bossBattleEvent(boss,"글레이프니르 해방",boss.difficulty==="crazy"?"공격력이 50% 증가하고 신을 삼키는 자를 사용할 수 있습니다.":"공격력과 회피율이 돌아오고 신을 삼키는 자를 사용할 수 있습니다.","phase"));
  }
}

function handleKrakenCriticalHit(boss,hit,battleLog){
  if(boss.id!=="kraken"||boss.difficulty!=="crazy"||!hit.crit||Number(boss._krakenPressure||0)<=0)return;
  const turn=activeTraitBattle?activeTraitBattle.turn:0;
  if(Number(boss._krakenPressureReducedTurn||0)===turn)return;
  boss._krakenPressureReducedTurn=turn;
  boss._krakenPressure=Math.max(0,Number(boss._krakenPressure)-1);
  battleLog.push(bossBattleEvent(boss,"심해의 수압","치명타로 수압 감소 · "+boss._krakenPressure+" / 3","passive"));
}

function checkCrazyBossHpPassives(boss,bossHp,battleLog){
  if(boss.difficulty!=="crazy"||bossHp<=0)return;

  if(boss.id==="behemoth"&&Number(boss._stoneArmorHp||0)<=0){
    if(!boss._stoneArmorTriggers)boss._stoneArmorTriggers={70:false,40:false};
    const threshold=[70,40].find(value=>!boss._stoneArmorTriggers[value]&&bossHp<=boss.hp*value/100);
    if(threshold){
      boss._stoneArmorTriggers[threshold]=true;
      boss._stoneArmorMaxHp=Math.max(1,Math.floor(boss.hp*0.06));
      boss._stoneArmorHp=boss._stoneArmorMaxHp;
      battleLog.push(bossCrazyPassiveEvent(boss,"움직이는 대륙","체력 "+threshold+"% 구간 · 최대 체력 6%의 암석 갑옷 생성"));
    }
  }

  if(boss.id==="bahamut"&&bossHp<=boss.hp*0.5&&!boss._absoluteOrderActive){
    boss._absoluteOrderActive=true;boss._crazyAttackBoost=Math.max(0.25,Number(boss._crazyAttackBoost||0));boss.critRate=Number(boss._baseCritRate||boss.critRate||0)+20;boss._megaFlareIgnoreDodge=true;
    delete boss._observedWeakUntil;
    battleLog.push(bossCrazyPassiveEvent(boss,"용왕의 절대명령","약화 효과를 지우고 공격력 25%·치명타율 20% 증가, 메가 플레어 회피 무시"));
  }

  if(boss.id==="cerberus"){
    const heads=getCerberusHeadCount(boss),before=Number(boss._cerberusLastHeads||3);
    if(heads<before){
      boss._cerberusLastHeads=heads;
      const lost=3-heads;
      const effects=["남은 머리 공격 강화","물고기 회복량 30% 감소"];
      if(lost>=2)effects.push("물고기 회피율 15% 감소");
      battleLog.push(bossBattleEvent(boss,"죽지 않는 세 머리",effects.join(" · "),"passive"));
    }
  }

  if(boss.id==="chronos"&&bossHp<=boss.hp*0.5&&!boss._chronosTimelineActive){
    boss._chronosTimelineActive=true;
    battleLog.push(bossBattleEvent(boss,"겹쳐진 시간선","이후 공격이 다음 턴에 35% 위력으로 다시 나타납니다.","passive"));
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
  const duelChance=scaleBossSkillChance(boss,20),marchChance=scaleBossSkillChance(boss,15);
  if(roll < duelChance){
    if(!beginBossSpecial(boss,"프레이르와의 결투",battleLog)){boss._surtrTurnAction="blocked";return;}
    const target = getStrongestAliveFish(participants);
    if(target){
      boss._surtrTurnAction = "duel";
      boss._surtrDuelTarget = target;
      battleLog.push(bossColor(boss.name, boss) + "의 프레이르와의 결투\n" + color(lineFish(target), target.grade) + "와 1대1 결투를 시작합니다.\n다른 물고기는 이번 턴에 행동하지 않습니다.");
    }
    return;
  }

  if(roll < duelChance+marchChance){
    if(!beginBossSpecial(boss,"무스펠의 진군 준비",battleLog)){boss._surtrTurnAction="blocked";return;}
    boss._surtrTurnAction = "prepare";
    boss._muspelPending = true;
    battleLog.push(bossColor(boss.name, boss) + "가 무스펠의 진군을 준비합니다.\n이번 턴에는 공격하지 않고 다음 턴 시작 시 전체 공격을 사용합니다.");
  }
}

function applyPhoenixImmortalityIfNeeded(boss, bossHp, battleLog){
  if(boss.id !== "phoenix") return bossHp;
  if(bossHp > 0) return bossHp;
  const reviveRates=boss.difficulty==="crazy"?[0.8,0.5]:boss.difficulty==="hard"?[0.7]:[0.5];
  const used=Number(boss._crazyRevives||0);
  if(used>=reviveRates.length) return bossHp;
  boss._crazyRevives=used+1;
  boss._revived=true;
  bossHp = Math.floor(boss.hp * reviveRates[used]);
  boss._currentHp=bossHp;
  const reviveBody=(used+1)+"번째 부활 · 체력 "+Math.round(reviveRates[used]*100)+"%로 되살아났습니다.\n"+hpBar(bossHp,boss.hp);
  const apex=boss.difficulty==="crazy"&&used===1;
  battleLog.push(bossRevivalEvent(boss,apex?"두 번째 불사":"불사 발동",reviveBody,apex));
  return bossHp;
}

function applyBossStartTurnEffects(participants, battleLog){
  participants.forEach(f => {
    const c = ensureCombatStats(f);
    if(!isBattleTargetableFish(f)) return;

    const poison = Math.min(3, Number(c.poisonStacks || 0));
    if(poison <= 0) return;

    const damage = Math.floor(c.maxHp * 0.02 * poison);
    applyDamageToFish(f,damage,battleLog,color(lineFish(f),f.grade)+"\n독 "+poison+"중첩\n",{statusDamage:true});
  });
}

function applyBossTurnPassives(boss, bossHp, battleLog){
  if((boss.id === "hydra" || boss.id === "tiamat") && bossHp > 0 && !boss._healingSealed){
    const rate = boss.id === "hydra" ? (boss.difficulty==="crazy"?0.10:boss.difficulty==="hard"?0.07:0.05) : (boss.difficulty==="crazy"?0.05:boss.difficulty==="hard"?0.03:0.02);
    const heal = Math.floor(boss.hp * rate);
    const before = bossHp;
    bossHp = Math.min(boss.hp, bossHp + heal);
    if(bossHp > before){
      boss._currentHp=bossHp;
      const name=boss.id==="hydra"?"재생":"태초의 바다";
      battleLog.push(bossBattleEvent(boss,name,(bossHp-before).toLocaleString()+" 회복\n"+hpBar(bossHp,boss.hp),"passive"));
    }
  }

  if(boss.id==="hydra" && boss.difficulty==="crazy" && bossHp>0 && bossHp<=boss.hp*0.5 && !boss._nineHeadsRegenerated && !boss._healingSealed){
    boss._nineHeadsRegenerated=true;
    const heal=Math.floor(boss.hp*0.25);
    bossHp=Math.min(boss.hp,bossHp+heal);
    boss._currentHp=bossHp;
    boss._crazyAttackBoost=Math.max(Number(boss._crazyAttackBoost||0),0.2);
    battleLog.push(bossCrazyPassiveEvent(boss,"아홉 머리 재생","체력 25% 회복 · 공격력 20% 증가\n"+hpBar(bossHp,boss.hp)));
  }

  if(boss.id === "leviathan" && bossHp > 0){
    const threshold=boss.difficulty==="crazy"?0.7:boss.difficulty==="hard"?0.6:0.5;
    if(bossHp<=boss.hp*threshold&&!boss._enraged){
      boss._enraged=true;
      boss._enrageMultiplier=boss.difficulty==="crazy"?1.3:boss.difficulty==="hard"?1.4:1.3;
      battleLog.push(bossBattleEvent(boss,"심연의 분노","공격력이 "+Math.round((boss._enrageMultiplier-1)*100)+"% 증가했습니다.","passive"));
    }
    if(boss.difficulty==="crazy"&&bossHp<=boss.hp*0.3&&!boss._deepEnraged){
      boss._deepEnraged=true;boss._enrageMultiplier=1.7;
      battleLog.push(bossCrazyPassiveEvent(boss,"심해 최하층","총 공격력이 70% 증가합니다."));
    }
  }

  if(boss.id==="erebos"&&bossHp>0){
    if(!Number.isFinite(Number(boss._lightGauge))) boss._lightGauge=100;
    boss._lightGauge=Math.max(0,boss._lightGauge-(boss.difficulty==="crazy"?30:boss.difficulty==="hard"?25:20));
    if(boss._lightGauge<=0){
      const turn=activeTraitBattle?activeTraitBattle.turn:0;
      boss._darknessUntil=turn+(boss.difficulty==="crazy"?2:1);
      boss._lightGauge=boss.difficulty==="crazy"?40:60;
      if(boss.difficulty==="crazy"){
        boss._erebosVeilStacks=Math.min(3,Number(boss._erebosVeilStacks||0)+1);
        boss._crazyAttackBoost=Math.max(Number(boss._crazyAttackBoost||0),boss._erebosVeilStacks*0.10);
        boss._voidShieldHp=Math.min(Math.floor(boss.hp*0.15),Number(boss._voidShieldHp||0)+Math.floor(boss.hp*0.05));boss._voidShieldUntil=999;
      }
      battleLog.push(bossBattleEvent(boss,"완전 암흑","물고기 치명타 봉인 · 에레보스 회피율 증가","passive"));
      if(boss.difficulty==="crazy")battleLog.push(bossCrazyPassiveEvent(boss,"원초의 장막","최대 체력 5% 보호막 · 공격력 "+(boss._erebosVeilStacks*10)+"% 증가"));
    }
  }

  return bossHp;
}

function spawnBabyDragons(boss, battleLog){
  if(!boss._summons) boss._summons = [];
  const previousOrder=boss._summons.filter(s=>s.summonType==="baby_dragon"||s.name==="새끼 용").reduce((max,s)=>Math.max(max,Number(s.order||0)),0);

  for(let i=0;i<3;i++){
    const config=getBossDifficultyConfig(boss.difficulty);
    const babyHp = Math.floor(randomInt(100000, 300000)*config.hpMultiplier);
    const babyAttack = Math.floor(randomInt(10000, 30000)*config.attackMultiplier);
    boss._summonSeq=Number(boss._summonSeq||0)+1;
    boss._summons.push({id:"baby_dragon_"+boss._summonSeq,summonType:"baby_dragon",name:"새끼 용",order:previousOrder+i+1,hp:babyHp,maxHp:babyHp,attack:babyAttack});
  }

  battleLog.push(bossColor(boss.name, boss) + "의 괴수 탄생 (15%)\n새끼 용 3마리를 소환했습니다.");
}

function spawnPrimordialDragon(boss,battleLog){
  if(!boss||boss._primordialDragonSummoned)return null;
  boss._primordialDragonSummoned=true;boss._summonSeq=Number(boss._summonSeq||0)+1;
  const summon={id:"primordial_dragon_"+boss._summonSeq,summonType:"primordial_dragon",name:"태초의 용",order:1,hp:Math.max(1,Math.floor(boss.hp*0.05)),maxHp:Math.max(1,Math.floor(boss.hp*0.05)),attack:Math.max(1,Math.floor(boss.attack))};
  boss._summons.push(summon);
  battleLog.push(bossBattleEvent(boss,"혼돈의 모태","쓰러진 새끼 용의 생명이 합쳐져 태초의 용이 태어났습니다.","passive"));
  return summon;
}

function handleDefeatedBossSummon(boss,summon,participants,battleLog){
  if(!boss||!summon)return;
  if(boss.id==="tiamat"&&boss.difficulty==="crazy"&&summon.summonType==="baby_dragon"){
    boss._babyDragonDeaths=Number(boss._babyDragonDeaths||0)+1;
    if(boss._babyDragonDeaths>=3)spawnPrimordialDragon(boss,battleLog);
  }
  if(summon.summonType==="primordial_dragon"&&!summon.deathBurstUsed){
    summon.deathBurstUsed=true;bossAllTargetAttack(boss,participants,battleLog,1.5,"태초의 붕괴",{ignoreDodge:true});
  }
  if(summon.summonType==="void_clone"&&summon.ownerFishId){
    const owner=(participants||[]).find(f=>String(f.id||"")===String(summon.ownerFishId));
    if(owner){const c=ensureCombatStats(owner);delete c.traitSealedUntil;delete c.bossAttackDebuffUntil;delete c.bossAttackDebuffRate;battleLog.push(color(lineFish(owner),owner.grade)+"가 빼앗겼던 힘을 되찾았습니다.");}
  }
}

function getAliveSummons(boss){
  const turn=activeTraitBattle?activeTraitBattle.turn:0;
  return (boss._summons || []).filter(x => x.hp > 0 && (!x.expiresTurn||x.expiresTurn>=turn));
}

function getVoidSummonStats(type,difficulty){
  const table={
    chronos_echo:{
      normal:{hpRate:0.0075,attackRate:0.35},
      hard:{hpRate:0.01,attackRate:0.40},
      crazy:{hpRate:0.0125,attackRate:0.45}
    },
    silver_gate_watcher:{
      normal:{hpRate:0.0125,attackRate:0.55},
      hard:{hpRate:0.0175,attackRate:0.65},
      crazy:{hpRate:0.0225,attackRate:0.75}
    }
  };
  const byDifficulty=table[type]||table.chronos_echo;
  return byDifficulty[difficulty]||byDifficulty.normal;
}

function summonVoidMinion(boss,battleLog,options){
  if(!boss._summons)boss._summons=[];
  const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  const stats=getVoidSummonStats(options.type,boss.difficulty);
  const expiresTurn=turn+Number(options.duration||1)-1+(options.startsNextTurn?1:0);
  const active=getAliveSummons(boss).find(s=>s.summonType===options.type);

  if(active){
    active.hp=active.maxHp;
    active.expiresTurn=expiresTurn;
    battleLog.push(subjectText(options.name)+" 다시 완성되었습니다.\n체력을 모두 회복하고 활동 시간이 연장됩니다.");
    return active;
  }

  boss._summonSeq=Number(boss._summonSeq||0)+1;
  const maxHp=Math.max(1,Math.floor(boss.hp*stats.hpRate));
  const summon={
    id:options.type+"_"+boss._summonSeq,
    summonType:options.type,
    name:options.name,
    order:1,
    hp:maxHp,
    maxHp,
    attack:Math.max(1,Math.floor(boss.attack*stats.attackRate)),
    expiresTurn
  };
  boss._summons.push(summon);
  battleLog.push(subjectText(options.name)+" 보스 옆에 나타났습니다.\n체력 "+summon.maxHp.toLocaleString()+" · 공격력 "+summon.attack.toLocaleString()+" · "+options.duration+"턴 활동");
  return summon;
}

function fishAttackTargetText(target, boss){
  if(target.type === "boss") return bossColor(boss.name, boss) + "\n" + hpBar(target.hp, boss.hp);
  return target.name + "\n" + hpBar(target.hp, target.maxHp);
}

function babyDragonActions(boss, participants, battleLog){
  const summons = getAliveSummons(boss);
  if(summons.length === 0) return;

  const counts={};
  summons.forEach(summon=>{counts[summon.name]=(counts[summon.name]||0)+1;});
  summons.forEach((dragon, i) => {
    const alive = getAliveTargets(participants);
    if(alive.length === 0) return;

    const f = alive[Math.floor(Math.random() * alive.length)];
    const c = ensureCombatStats(f);
    const dodgeRoll = Math.random() * 100 < c.dodge;
    const attacker=(dragon.name||"소환물")+(counts[dragon.name]>1?" "+Number(dragon.order||i+1):"");

    if(dodgeRoll){
      battleLog.push(attacker + "의 공격\n" + color(lineFish(f), f.grade) + " 회피");
      return;
    }

    applyDamageToFish(f, dragon.attack, battleLog, attacker + "의 공격\n");
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

function getCerberusHeadCount(boss){
  const hpRate = Number(boss._currentHp || boss.hp) / boss.hp;
  return hpRate>0.66?3:(hpRate>0.33?2:1);
}

function runCerberusJudgment(boss, participants, battleLog){
  const heads = getCerberusHeadCount(boss);
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
  let links = (boss._rootLinks || []).filter(f => isBattleTargetableFish(f));
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

function triggerThreeCalamities(boss,f,battleLog){
  const c = ensureCombatStats(f);
  if(getCurseCount(f) < 3) return;
  const crazy=boss.difficulty==="crazy";
  const lowHp=crazy&&Number(boss._currentHp||boss.hp)<=boss.hp*0.33;
  const rate=lowHp?0.25:0.20;
  const oldCurses=Object.keys(c.azhiCurses||{}).filter(key=>c.azhiCurses[key]);
  const scar=crazy&&oldCurses.length?oldCurses[Math.floor(Math.random()*oldCurses.length)]:"";
  c.azhiCurses=scar?{[scar]:true}:{};
  applyDamageToFish(f,Math.floor(c.maxHp*rate),battleLog,"세 가지 재앙 폭발\n최대 체력의 "+Math.round(rate*100)+"% 피해\n"+(scar?"재앙의 흉터 하나가 남았습니다.\n":""),{fromBoss:true,isSpecial:true,skillName:"세 가지 재앙 폭발",singleTarget:true});
}

function applyAzhiCurse(boss, f, curse, label, participants, battleLog){
  if(!f || ensureCombatStats(f).hp <= 0) return;
  const c = ensureCombatStats(f);
  if(!c.azhiCurses) c.azhiCurses = {};
  c.azhiCurses[curse] = true;
  registerTraitStatus(f,battleLog);
  bossAttackSpecificTarget(boss, f, battleLog, 0.65, "세 머리의 선택 - " + label, false);
  triggerThreeCalamities(boss,f,battleLog);
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
  triggerThreeCalamities(boss,target,battleLog);
}

function prepareTyphonWeather(boss, battleLog){
  if(boss.id !== "typhon") return;
  const pool=["headwind","turbulence","eye"].sort(()=>Math.random()-0.5);
  boss._typhonWeathers=pool.slice(0,boss.difficulty==="crazy"?2:1);
  boss._typhonWeather=boss._typhonWeathers[0];
  boss.critRate = boss._baseCritRate;
  boss.critDamage = boss._baseCritDamage;
  const texts=[];
  if(hasTyphonWeather(boss,"headwind"))texts.push("역풍 - 물고기 공격력 -20%, 타이폰 공격력 +10%");
  if(hasTyphonWeather(boss,"turbulence"))texts.push("난기류 - 물고기 회피율 -10%, 타이폰 회피율 +10%");
  if(hasTyphonWeather(boss,"eye")){
    boss.critRate += 15;
    boss.critDamage += 50;
    texts.push("폭풍의 눈 - 물고기 회피 불가, 타이폰 치명타 강화");
  }
  battleLog.push(bossColor(boss.name, boss) + "의 폭풍의 지배자\n" + texts.join("\n"));
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

const CRAZY_BOSS_SKILL_NAMES={
  kraken:"심해의 포박",hydra:"아홉 머리의 맹독",leviathan:"심해 압궤",behemoth:"거신의 압살",phoenix:"불씨 흡수",
  bahamut:"용왕의 역린",tiamat:"오색 용의 숨결",jormungandr:"독 폭발",fenrir:"라그나로크의 포효",surtr:"불꽃검 재련",
  cerberus:"명계의 문",nidhogg:"시체 포식",azhi_dahaka:"여섯 눈의 응시",typhon:"폭풍 장벽",angra_mainyu:"생명의 종언",
  erebos:"빛이 존재하지 않는 세계",chronos:"시간선 말소",nyarlathotep:"천 번째 얼굴",yog_sothoth:"모든 차원의 종착점",azathoth:"잠든 신의 개안"
};

const CRAZY_BOSS_SKILL_DESCRIPTIONS={
  kraken:"강한 물고기 2마리에게 최대 체력 15% 피해를 주고 2턴 동안 행동·회피·고유 특성을 봉인합니다.",
  hydra:"전체 공격력 2배 피해를 주고 독을 3중첩으로 만듭니다. 이미 3중첩이면 최대 체력 15% 추가 피해를 줍니다.",
  leviathan:"모든 물고기의 최대 체력을 25% 감소시키고 같은 양의 현재 체력 피해와 3턴 회복량 50% 감소를 부여합니다.",
  behemoth:"회피 불가 전체 공격력 2.5배 피해, 최강 물고기 공격력 50% 감소·1턴 기절, 최대 체력 8% 갑옷을 적용합니다.",
  phoenix:"모든 화상을 흡수해 체력을 30~60% 회복하고 공격력 50% 증가 후 윤회의 불꽃을 2회 사용합니다.",
  bahamut:"전체 공격력 2배 피해 후 다음 3회 피해 70% 감소·50% 반사. 종료 시 전체 2.5배 메가 플레어를 사용합니다.",
  tiamat:"서로 다른 상태이상을 가진 오색 숨결을 공격력 1배로 5회 사용하고 새끼 용 3마리를 소환합니다.",
  jormungandr:"모든 물고기를 독 3중첩으로 만든 뒤 최대 체력 30% 피해를 주고 독 1중첩을 남깁니다.",
  fenrir:"회피 불가 전체 공격력 2.5배 피해 후 공격력·치명타율을 3턴 동안 35% 감소시킵니다.",
  surtr:"불꽃검을 완전히 재련하고 전체 공격력 2.5배 피해·화상 2중첩을 주며 검 파괴 전까지 공격력 40% 증가합니다.",
  cerberus:"강한 물고기 2마리를 2턴 추방하고 남은 파티에 전체 2배 피해를 줍니다. 귀환 시 현재 체력 25%를 잃습니다.",
  nidhogg:"쓰러진 물고기당 체력 15% 회복·공격력 10% 증가 후 전체 2배 피해와 최대 체력 10% 감소를 적용합니다.",
  azhi_dahaka:"강한 물고기 3마리를 공격하고 특성 봉인·공격력 50% 감소·회피와 치명타 봉인을 각각 부여합니다.",
  typhon:"최대 체력 12% 폭풍 장벽과 3턴 폭풍을 생성합니다. 매 턴 전체 1.2배 피해, 장벽 생존 시 2.5배 폭발합니다.",
  angra_mainyu:"전체 최대 체력 20% 피해 후 3턴 동안 회복·부활·사망 방지 특성을 봉인합니다.",
  erebos:"전체 최대 체력 35% 피해 후 3턴 동안 암흑·치명타·회피를 봉인하고 에레보스의 공격이 회피를 무시합니다.",
  chronos:"최근 2턴 피해를 되돌려 최대 30% 회복하고 강한 물고기 2마리의 다음 행동을 삭제한 뒤 각각 2배 공격합니다.",
  nyarlathotep:"가장 강한 물고기의 공격력 200%·체력 100%를 가진 복제체를 소환하고 복제체 생존 중 원본을 약화합니다.",
  yog_sothoth:"전투력이 높은 절반을 3턴 추방하고 회피 불가 전체 공격력 3배 피해를 줍니다. 귀환 시 체력 20%를 잃습니다.",
  azathoth:"전체 최대 체력 25% 피해 후 3턴간 공격력 75% 증가·2회 전체 행동·회피와 피해 감소 무시, 마지막에 우주 붕괴를 사용합니다."
};

function damageFishByMaxHp(f,rate,battleLog,skillName){
  const c=ensureCombatStats(f);
  if(c.hp<=0)return;
  const damage=Math.max(1,Math.floor(c.maxHp*rate));
  c.hp=Math.max(1,c.hp-damage);
  battleLog.push(skillName+"\n"+color(lineFish(f),f.grade)+"\n최대 체력의 "+Math.round(rate*100)+"% 피해\n\n"+hpBar(c.hp,c.maxHp));
}

function reduceFishMaxHpForBattle(f,rate,battleLog,skillName){
  const c=ensureCombatStats(f);
  if(!c._preErosionMaxHp)c._preErosionMaxHp=c.maxHp;
  const before=c.maxHp;
  c.maxHp=Math.max(1,Math.floor(c.maxHp*(1-rate)));
  c.hp=Math.min(c.hp,c.maxHp);
  battleLog.push(skillName+"\n"+color(lineFish(f),f.grade)+"\n최대 체력 "+(before-c.maxHp).toLocaleString()+" 감소");
}

function runCrazyBossUltimateEffect(boss,participants,battleLog){
  const turn=activeTraitBattle?activeTraitBattle.turn:0;
  const alive=getAliveTargets(participants);
  if(boss.id==="kraken"){
    [...alive].sort((a,b)=>ensureCombatStats(b).attack-ensureCombatStats(a).attack).slice(0,2).forEach(f=>{const c=ensureCombatStats(f);damageFishByMaxHp(f,0.15,battleLog,"심해의 포박");c.bossDisabledUntil=turn+2;c.traitSealedUntil=turn+2;c.gazeDebuffUntil=turn+2;});
    battleLog.push("강한 물고기 2마리가 2턴 동안 심해에 포박되었습니다.");
  }else if(boss.id==="hydra"){
    bossAllTargetAttack(boss,participants,battleLog,2,"아홉 머리의 맹독");
    getAliveTargets(participants).forEach(f=>{const c=ensureCombatStats(f),already=Number(c.poisonStacks||0)>=3;c.poisonStacks=3;if(already)damageFishByMaxHp(f,0.15,battleLog,"맹독 과포화");});
    battleLog.push("모든 생존 물고기의 독이 3중첩까지 차올랐습니다.");
  }else if(boss.id==="leviathan"){
    alive.forEach(f=>{const c=ensureCombatStats(f),beforeMax=c.maxHp,beforeHp=c.hp;if(!c._preErosionMaxHp)c._preErosionMaxHp=beforeMax;c.maxHp=Math.max(1,Math.floor(beforeMax*0.75));c.hp=Math.max(1,Math.min(c.maxHp,beforeHp-Math.floor(beforeMax*0.25)));c.leviathanHealingUntil=turn+3;battleLog.push("심해 압궤\n"+color(lineFish(f),f.grade)+"\n최대 체력과 현재 체력이 25% 감소했습니다.");});
  }else if(boss.id==="behemoth"){
    bossAllTargetAttack(boss,participants,battleLog,2.5,"거신의 압살",{ignoreDodge:true});
    const target=getStrongestAliveFish(participants);if(target){const c=ensureCombatStats(target);c.bossAttackDebuffUntil=turn+3;c.bossAttackDebuffRate=0.5;c.bossDisabledUntil=turn+1;}
    boss._stoneArmorMaxHp=Math.max(1,Math.floor(boss.hp*0.08));boss._stoneArmorHp=boss._stoneArmorMaxHp;
  }else if(boss.id==="phoenix"){
    let stacks=0;participants.forEach(f=>{const c=ensureCombatStats(f);stacks+=Number(c.burnStacks||0);delete c.burnStacks;});
    const rate=Math.min(0.6,0.3+stacks*0.025);boss._currentHp=Math.min(boss.hp,Number(boss._currentHp)+Math.floor(boss.hp*rate));boss._crazyAttackBoost=Math.max(0.5,Number(boss._crazyAttackBoost||0));
    battleLog.push("모든 화상을 흡수해 체력 "+Math.round(rate*100)+"%를 회복하고 공격력이 50% 증가했습니다.");
    bossAllTargetAttack(boss,participants,battleLog,1.5,"윤회의 불꽃",{burnBonus:true});bossAllTargetAttack(boss,participants,battleLog,1.5,"윤회의 불꽃",{burnBonus:true});
  }else if(boss.id==="bahamut"){
    bossAllTargetAttack(boss,participants,battleLog,2,"용왕의 역린");boss._wrathCharges=3;boss._wrathReduction=0.7;boss._wrathReflect=0.5;boss._wrathFinalePending=true;battleLog.push("다음 3회 받는 피해를 70% 줄이고 공격자에게 50% 반사합니다.");
  }else if(boss.id==="tiamat"){
    const effects=["burn","poison","healing","attack","stun"];
    effects.forEach((effect,index)=>{const targets=getAliveTargets(participants);if(!targets.length)return;const target=targets[Math.floor(Math.random()*targets.length)],c=ensureCombatStats(target);bossAttackSpecificTarget(boss,target,battleLog,1,"오색 용의 숨결 "+(index+1),false,{burn:effect==="burn",poison:effect==="poison"});if(effect==="healing")c.healingBlockedUntil=turn+2;if(effect==="attack"){c.bossAttackDebuffUntil=turn+2;c.bossAttackDebuffRate=0.35;}if(effect==="stun")c.bossDisabledUntil=turn+1;});
    spawnBabyDragons(boss,battleLog);
  }else if(boss.id==="jormungandr"){
    alive.forEach(f=>{const c=ensureCombatStats(f);c.poisonStacks=3;damageFishByMaxHp(f,0.30,battleLog,"독 폭발");c.poisonStacks=1;});
  }else if(boss.id==="fenrir"){
    bossAllTargetAttack(boss,participants,battleLog,2.5,"라그나로크의 포효",{ignoreDodge:true});alive.forEach(f=>{const c=ensureCombatStats(f);c.roarDebuffUntil=turn+3;c.roarAttackDebuffRate=0.35;c.roarCritDebuff=35;});battleLog.push("모든 물고기의 공격력과 치명타 확률이 3턴 동안 35% 감소합니다.");
  }else if(boss.id==="surtr"){
    boss._flameSwordHp=boss._flameSwordMaxHp;boss._flameSwordBroken=false;boss._crazyAttackBoost=Math.max(0.4,Number(boss._crazyAttackBoost||0));bossAllTargetAttack(boss,participants,battleLog,2.5,"불꽃검 재련",{burn:true});getAliveTargets(participants).forEach(f=>ensureCombatStats(f).burnStacks=Math.min(3,Number(ensureCombatStats(f).burnStacks||0)+1));
  }else if(boss.id==="cerberus"){
    const targets=[...alive].sort((a,b)=>(ensureCombatStats(b).attack+ensureCombatStats(b).maxHp)-(ensureCombatStats(a).attack+ensureCombatStats(a).maxHp)).slice(0,2);targets.forEach(target=>{const c=ensureCombatStats(target);c.voidBanishedUntil=turn+2;c.underworldReturnDamage=0.25;});bossAllTargetAttack(boss,participants,battleLog,2,"명계의 문");battleLog.push(targets.length+"마리가 2턴 동안 명계로 추방되었습니다.");
  }else if(boss.id==="nidhogg"){
    const fallen=participants.filter(f=>ensureCombatStats(f).hp<=0||ensureCombatStats(f).battleDown);
    const souls=Math.min(3,fallen.length);if(souls){boss._currentHp=Math.min(boss.hp,Number(boss._currentHp)+Math.floor(boss.hp*0.15*souls));boss._crazyAttackBoost=Math.min(0.3,Number(boss._crazyAttackBoost||0)+0.1*souls);battleLog.push("쓰러진 생명 "+souls+"개를 포식해 체력과 공격력을 회복했습니다.");}
    bossAllTargetAttack(boss,participants,battleLog,2,"시체 포식");getAliveTargets(participants).forEach(f=>reduceFishMaxHpForBattle(f,0.10,battleLog,"세계수 침식"));
  }else if(boss.id==="azhi_dahaka"){
    const targets=[...alive].sort((a,b)=>(ensureCombatStats(b).attack+ensureCombatStats(b).maxHp)-(ensureCombatStats(a).attack+ensureCombatStats(a).maxHp)).slice(0,3);targets.forEach((target,index)=>{const c=ensureCombatStats(target);bossAttackSpecificTarget(boss,target,battleLog,1.2,"여섯 눈의 응시",false);if(index===0)c.traitSealedUntil=turn+3;else if(index===1){c.bossAttackDebuffUntil=turn+3;c.bossAttackDebuffRate=0.5;}else c.gazeDebuffUntil=turn+3;});
  }else if(boss.id==="typhon"){
    boss._voidShieldHp=Math.floor(boss.hp*0.12);boss._voidShieldUntil=turn+3;boss._stormBarrierStartedTurn=turn;boss._stormBarrierUntil=turn+3;boss._stormBarrierExploded=false;battleLog.push("최대 체력 12%의 폭풍 장벽과 3턴간 지속되는 대폭풍을 생성했습니다.\n보호막 : "+boss._voidShieldHp.toLocaleString());
  }else if(boss.id==="angra_mainyu"){
    alive.forEach(f=>{damageFishByMaxHp(f,0.20,battleLog,"생명의 종언");const c=ensureCombatStats(f);c.healingBlockedUntil=turn+3;c.traitSealedUntil=turn+3;});if(activeTraitBattle)activeTraitBattle.lifeEndUntil=turn+3;
  }else if(boss.id==="erebos"){
    alive.forEach(f=>{damageFishByMaxHp(f,0.35,battleLog,"빛이 존재하지 않는 세계");const c=ensureCombatStats(f);c.darknessDebuffUntil=turn+3;c.critSuppressedUntil=turn+3;c.gazeDebuffUntil=turn+3;});boss._darknessUntil=turn+3;boss._ignoreDodgeUntil=turn+3;
  }else if(boss.id==="chronos"){
    const recent=(boss._chronosDamageHistory||[]).slice(-2).reduce((s,v)=>s+Number(v||0),0),heal=Math.min(Math.floor(boss.hp*0.30),recent);boss._currentHp=Math.min(boss.hp,Number(boss._currentHp)+heal);battleLog.push("지워진 시간선에서 "+heal.toLocaleString()+" 체력을 되찾았습니다.");[...alive].sort((a,b)=>ensureCombatStats(b).attack-ensureCombatStats(a).attack).slice(0,2).forEach(target=>{ensureCombatStats(target).bossDisabledUntil=turn+1;bossAttackSpecificTarget(boss,target,battleLog,2,"시간선 말소",false);});
  }else if(boss.id==="nyarlathotep"){
    const target=getStrongestAliveFish(participants);if(target){const c=ensureCombatStats(target),cloneHp=Math.floor(c.maxHp);boss._summonSeq=Number(boss._summonSeq||0)+1;c.traitSealedUntil=999;c.bossAttackDebuffUntil=999;c.bossAttackDebuffRate=0.5;boss._summons.push({id:"void_clone_"+boss._summonSeq,summonType:"void_clone",name:"공허 복제체 · "+target.name,order:1,hp:cloneHp,maxHp:cloneHp,attack:Math.floor(c.attack*2),ownerFishId:String(target.id||"")});battleLog.push(color(lineFish(target),target.grade)+"의 공격력 200%·체력 100%를 가진 복제체가 등장했습니다.");}
  }else if(boss.id==="yog_sothoth"){
    const sorted=[...alive].sort((a,b)=>(ensureCombatStats(b).attack+ensureCombatStats(b).maxHp)-(ensureCombatStats(a).attack+ensureCombatStats(a).maxHp)),banished=sorted.slice(0,Math.ceil(sorted.length/2));bossAllTargetAttack(boss,participants,battleLog,3,"모든 차원의 종착점",{ignoreDodge:true});banished.filter(f=>ensureCombatStats(f).hp>0).forEach(f=>{const c=ensureCombatStats(f);c.voidBanishedUntil=turn+3;c.voidReturnDamage=true;});battleLog.push(banished.filter(f=>ensureCombatStats(f).hp>0).length+"마리가 3턴 동안 공허로 추방되었습니다.");
  }else if(boss.id==="azathoth"){
    alive.forEach(f=>damageFishByMaxHp(f,0.25,battleLog,"잠든 신의 개안"));boss._awakenedUntil=turn+2;boss._ignoreDodgeUntil=turn+2;boss._cosmicCollapseTurn=turn+2;battleLog.push("3턴 동안 공격력 75% 증가, 두 번 전체 행동, 회피와 피해 감소 무시 상태가 됩니다.");
  }
}

function tryRunCrazyBossUltimate(boss,participants,battleLog){
  if(boss.difficulty!=="crazy"||boss._crazyUltimateUsed)return false;
  if(boss.id==="surtr"&&!boss._flameSwordBroken&&Number(boss._flameSwordHp||0)>Number(boss._flameSwordMaxHp||1)*0.65)return false;
  const forced=Number(boss._currentHp||boss.hp)<=boss.hp*0.35;
  if(!forced&&Math.random()>=0.10)return false;
  boss._crazyUltimateUsed=true;
  const skillName=CRAZY_BOSS_SKILL_NAMES[boss.id]||"공허의 궁극기";
  runBossSpecial(boss,skillName,battleLog,()=>runCrazyBossUltimateEffect(boss,participants,battleLog),"crazy");
  return true;
}

function processBossStartTurnDifficultyMechanics(boss,participants,battleLog){
  const turn=activeTraitBattle?activeTraitBattle.turn:0;
  participants.forEach(f=>{
    const c=ensureCombatStats(f);
    if(c.voidReturnDamage&&Number(c.voidBanishedUntil||0)<turn){
      c.hp=Math.max(1,Math.floor(c.hp*0.8));delete c.voidReturnDamage;delete c.voidBanishedUntil;
      battleLog.push(color(lineFish(f),f.grade)+"가 공허에서 돌아왔습니다.\n현재 체력 20% 감소\n\n"+hpBar(c.hp,c.maxHp));
    }
    if(c.underworldReturnDamage&&Number(c.voidBanishedUntil||0)<turn){
      c.hp=Math.max(1,Math.floor(c.hp*(1-Number(c.underworldReturnDamage||0.25))));delete c.underworldReturnDamage;delete c.voidBanishedUntil;
      battleLog.push(color(lineFish(f),f.grade)+"가 명계에서 돌아왔습니다.\n현재 체력 25% 감소\n\n"+hpBar(c.hp,c.maxHp));
    }
  });

  if(boss.id==="jormungandr"&&boss.difficulty==="crazy"&&boss._ragnarokRingActive&&turn%2===0){
    getAliveTargets(participants).forEach(f=>{const stacks=Math.min(3,Number(ensureCombatStats(f).poisonStacks||0));if(stacks>0)damageFishByMaxHp(f,stacks*0.05,battleLog,"라그나로크의 고리");});
  }

  if(boss.id==="typhon"&&boss.difficulty==="crazy"&&Number(boss._stormBarrierUntil||0)>0){
    if(turn>Number(boss._stormBarrierStartedTurn||0)&&turn<=Number(boss._stormBarrierUntil||0))bossAllTargetAttack(boss,participants,battleLog,1.2,"대폭풍",{ignoreDodge:true});
    if(turn>Number(boss._stormBarrierUntil||0)&&!boss._stormBarrierExploded){
      boss._stormBarrierExploded=true;
      if(Number(boss._voidShieldHp||0)>0)bossAllTargetAttack(boss,participants,battleLog,2.5,"폭풍 장벽 붕괴",{ignoreDodge:true});
      boss._voidShieldHp=0;
    }
  }

  if(boss.id==="azathoth"&&boss.difficulty==="crazy"){
    if(turn%4===0){
      const pool=["healing","trait","causality"].sort(()=>Math.random()-0.5),count=Number(boss._currentHp||boss.hp)<=boss.hp*0.25?2:1,labels={healing:"생명의 법칙 붕괴",trait:"존재의 법칙 붕괴",causality:"인과의 법칙 붕괴"};
      boss._chaosDreamRules=pool.slice(0,count);boss._chaosDreamUntil=turn+1;
      if(boss._chaosDreamRules.includes("trait"))getAliveTargets(participants).forEach(f=>ensureCombatStats(f).traitSealedUntil=Math.max(Number(ensureCombatStats(f).traitSealedUntil||0),turn+1));
      battleLog.push(bossBattleEvent(boss,"혼돈의 꿈",boss._chaosDreamRules.map(rule=>labels[rule]).join(" + ")+" · 2턴 지속","passive"));
    }
    if(Number(boss._cosmicCollapseTurn||0)>0&&turn>=Number(boss._cosmicCollapseTurn)&&!boss._cosmicCollapseUsed){
      boss._cosmicCollapseUsed=true;bossAllTargetAttack(boss,participants,battleLog,3,"우주 붕괴",{ignoreDodge:true,ignoreReduction:true});
    }
  }

  if(boss.id==="kraken"&&boss.difficulty==="crazy"){
    boss._krakenPressure=Number(boss._krakenPressure||0)+1;
    if(boss._krakenPressure>=3){
      boss._krakenPressure=0;
      participants.forEach(f=>ensureCombatStats(f).abyssPressureUntil=turn+1);
      battleLog.push(bossBattleEvent(boss,"심해의 수압","2턴 동안 물고기 공격력 25%·치명타율 15% 감소","passive"));
    }
  }

  if(boss.id==="nyarlathotep"&&turn%(boss.difficulty==="normal"?4:3)===0){
    const target=getStrongestAliveFish(participants);
    if(target){boss._stolenAttackBonus=Number(boss._stolenAttackBonus||0)+Math.floor(ensureCombatStats(target).attack*0.1);if(boss.difficulty==="crazy")ensureCombatStats(target).traitSealedUntil=Math.max(Number(ensureCombatStats(target).traitSealedUntil||0),turn);battleLog.push(bossColor(boss.name,boss)+"의 천 개의 얼굴\n"+color(lineFish(target),target.grade)+"의 힘을 복제했습니다.");}
  }

  if(boss.id==="nyarlathotep"&&boss.difficulty==="crazy"){
    const dual=Number(boss._currentHp||boss.hp)<=boss.hp*0.4;
    const shouldChange=turn===1||turn%3===1||(dual&&!boss._nyarlDualActive);
    if(shouldChange){
      boss._nyarlDualActive=dual;
      boss._nyarlMaskIndex=(Number(boss._nyarlMaskIndex??-1)+1)%3;
      const order=["tyrant","mirror","prophet"],labels={tyrant:"폭군",mirror:"거울",prophet:"예언자"};
      boss._nyarlMasks=[order[boss._nyarlMaskIndex]];
      if(dual)boss._nyarlMasks.push(order[(boss._nyarlMaskIndex+1)%3]);
      battleLog.push(bossBattleEvent(boss,"가면의 행렬",boss._nyarlMasks.map(id=>labels[id]+"의 가면").join(" + ")+" 활성화","passive"));
    }
  }

  if(boss.id==="yog_sothoth"){
    if(boss.difficulty==="crazy"&&Number(boss._currentHp||boss.hp)<=boss.hp*0.5){
      if(!boss._dimensionSplit){boss._dimensionSplit=true;battleLog.push(bossBattleEvent(boss,"무한 차원 분열","물고기들이 두 차원으로 갈라져 절반씩 번갈아 행동합니다.","phase"));}
      participants.forEach((f,i)=>{if(i%2!==turn%2){const c=ensureCombatStats(f);c.bossDisabledUntil=Math.max(Number(c.bossDisabledUntil||0),turn);}});
    }else if(turn%(boss.difficulty==="hard"?3:4)===0){
      const targets=getAliveTargets(participants);if(targets.length){const f=targets[Math.floor(Math.random()*targets.length)];ensureCombatStats(f).bossDisabledUntil=turn;battleLog.push(bossColor(boss.name,boss)+"의 공간 고정\n"+color(lineFish(f),f.grade)+"가 이번 턴 행동할 수 없습니다.");}
    }
  }

  if(boss.id==="azathoth"){
    const rate=Number(boss._currentHp||boss.hp)/boss.hp;
    if(rate<=0.75&&!boss._chaos75){
      boss._chaos75=true;
      const penalty=boss.difficulty==="crazy"?0.25:0.5;
      participants.forEach(f=>ensureCombatStats(f).healingPenalty=penalty);
      battleLog.push(bossBattleEvent(boss,"첫 번째 각성",boss.difficulty==="crazy"?"모든 회복 효과가 75% 감소합니다.":"모든 회복 효과가 50% 감소합니다.","phase"));
    }
    if(rate<=0.50&&!boss._chaos50){boss._chaos50=true;boss._ignoreDodge=true;battleLog.push(bossBattleEvent(boss,"두 번째 각성",boss.difficulty==="crazy"?"회피를 무시하고 물고기 치명타율을 15% 감소시킵니다.":"모든 공격이 회피를 무시합니다.","phase"));}
    if(rate<=0.25&&!boss._chaos25){boss._chaos25=true;battleLog.push(bossBattleEvent(boss,"최종 각성",(boss.difficulty==="crazy"?"2":"3")+"턴마다 두 번 연속 행동합니다.","phase"));}
  }
}

function runVoidBossAction(boss,participants,battleLog){
  const r=Math.random()*100,first=scaleBossSkillChance(boss,boss.id==="azathoth"?25:boss.id==="nyarlathotep"?25:20),second=scaleBossSkillChance(boss,boss.id==="azathoth"?20:15),turn=activeTraitBattle?activeTraitBattle.turn:0;
  if(boss.id==="erebos"){
    if(r<first)return runBossSpecial(boss,"흑일식",battleLog,()=>{bossAllTargetAttack(boss,participants,battleLog,1.6,"흑일식");getAliveTargets(participants).forEach(f=>ensureCombatStats(f).critSuppressedUntil=turn+1);});
    if(r<first+second)return runBossSpecial(boss,"어둠의 포식",battleLog,()=>{const t=getStrongestAliveFish(participants);bossAttackSpecificTarget(boss,t,battleLog,3,"어둠의 포식",false);const heal=Math.floor(boss.hp*0.02);boss._currentHp=Math.min(boss.hp,Number(boss._currentHp)+heal);});
  }else if(boss.id==="chronos"){
    if(r<first)return runBossSpecial(boss,"시간 역행",battleLog,()=>{const heal=Math.min(Math.floor(boss.hp*0.05),Math.floor(Number(boss._lastTurnDamageTaken||0)*0.7));boss._currentHp=Math.min(boss.hp,Number(boss._currentHp)+heal);battleLog.push(heal.toLocaleString()+" 체력 회복");});
    if(r<first+second)return runBossSpecial(boss,"미래 삭제",battleLog,()=>{const t=getStrongestAliveFish(participants);bossAttackSpecificTarget(boss,t,battleLog,3,"미래 삭제",false);if(t)ensureCombatStats(t).bossDisabledUntil=turn+1;});
  }else if(boss.id==="nyarlathotep"){
    if(r<first)return runBossSpecial(boss,"광기의 합창",battleLog,()=>{const source=getStrongestAliveFish(participants);if(!source)return;const targets=getAliveTargets(participants).filter(f=>f!==source);(targets.length?targets:[source]).forEach(t=>applyDamageToFish(t,Math.floor(getEffectiveFishAttack(source,boss)*0.8),battleLog,"광기의 합창\n"+color(lineFish(source),source.grade)+"의 아군 공격\n",{fromBoss:true,isSpecial:true,skillName:"광기의 합창"}));});
    if(r<first+second)return runBossSpecial(boss,"가면 강탈",battleLog,()=>{const t=getStrongestAliveFish(participants);if(!t)return;bossAttackSpecificTarget(boss,t,battleLog,1.5,"가면 강탈",false);boss._stolenAttackBonus=Number(boss._stolenAttackBonus||0)+Math.floor(ensureCombatStats(t).attack*0.2);boss.critRate+=5;});
  }else if(boss.id==="yog_sothoth"){
    if(r<first)return runBossSpecial(boss,"차원 압살",battleLog,()=>bossAllTargetAttack(boss,participants,battleLog,1.8,"차원 압살",{ignoreDodge:true}));
    if(r<first+second)return runBossSpecial(boss,"은빛 문의 감시자",battleLog,()=>summonVoidMinion(boss,battleLog,{type:"silver_gate_watcher",name:"은빛 문의 감시자",duration:3}));
  }else if(boss.id==="azathoth"){
    if(r<first)return runBossSpecial(boss,"맹목의 핵동",battleLog,()=>bossAllTargetAttack(boss,participants,battleLog,2,"맹목의 핵동",{ignoreDodge:true}));
    if(r<first+second)return runBossSpecial(boss,"우주의 불협화음",battleLog,()=>{for(let i=0;i<8;i++){const targets=getAliveTargets(participants);if(!targets.length)break;bossAttackSpecificTarget(boss,targets[Math.floor(Math.random()*targets.length)],battleLog,0.8,"우주의 불협화음",true);}});
    if(Number(boss._awakenedUntil||0)>=turn)return bossAllTargetAttack(boss,participants,battleLog,1,"혼돈의 일반 공격",{ignoreDodge:true});
  }
  return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
}

function runBossAction(boss, participants, battleLog){
  if(tryRunCrazyBossUltimate(boss,participants,battleLog))return;
  if(["erebos","chronos","nyarlathotep","yog_sothoth","azathoth"].includes(boss.id))return runVoidBossAction(boss,participants,battleLog);
  if(boss.id === "cerberus"){
    const r=Math.random()*100,a=scaleBossSkillChance(boss,20),b=scaleBossSkillChance(boss,15);
    if(r<a) return runBossSpecial(boss,"세 머리의 판결",battleLog,()=>runCerberusJudgment(boss,participants,battleLog));
    if(r<a+b) return runBossSpecial(boss,"망자의 무게",battleLog,()=>runCerberusDeadWeight(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "nidhogg"){
    const r=Math.random()*100,a=scaleBossSkillChance(boss,20),b=scaleBossSkillChance(boss,15);
    if(r<a) return runBossSpecial(boss,"뿌리의 연결",battleLog,()=>refreshRootLinks(boss,participants,battleLog));
    if(r<a+b) return runBossSpecial(boss,"라타토스크의 이간질",battleLog,()=>runRatatoskr(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "azhi_dahaka"){
    const r=Math.random()*100,a=scaleBossSkillChance(boss,25),b=scaleBossSkillChance(boss,15);
    if(r<a) return runBossSpecial(boss,"세 머리의 선택",battleLog,()=>runAzhiChoice(boss,participants,battleLog));
    if(r<a+b) return runBossSpecial(boss,"재앙 집중",battleLog,()=>runAzhiConcentration(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "typhon"){
    const r=Math.random()*100,a=scaleBossSkillChance(boss,20),b=scaleBossSkillChance(boss,15);
    if(r<a) return runBossSpecial(boss,"폭풍의 반향",battleLog,()=>runTyphonEcho(boss,participants,battleLog));
    if(r<a+b) return runBossSpecial(boss,"대지와 하늘의 추락",battleLog,()=>runTyphonFall(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "angra_mainyu"){
    const r=Math.random()*100,a=scaleBossSkillChance(boss,20),b=scaleBossSkillChance(boss,15);
    if(r<a) return runBossSpecial(boss,"존재 말살",battleLog,()=>runExistenceAnnihilation(boss,participants,battleLog));
    if(r<a+b) return runBossSpecial(boss,"창조의 붕괴",battleLog,()=>runCreationCollapse(boss,participants,battleLog));
    return bossSingleTargetAttack(boss,participants,battleLog,1,"공격",false);
  }

  if(boss.id === "fenrir"){
    const r = Math.random() * 100,a=scaleBossSkillChance(boss,20),b=scaleBossSkillChance(boss,15);
    if(r < a) return runBossSpecial(boss,"티르의 오른손",battleLog,()=>runFenrirTyrHand(boss, participants, battleLog));
    if(r < a+b && Number(boss._gleipnirKnots || 0) <= 0 && !boss._devouredFish){
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
    const r = Math.random() * 100,a=scaleBossSkillChance(boss,25),b=scaleBossSkillChance(boss,15);
    if(r < a) return bossSingleTargetAttack(boss, participants, battleLog, 1, "재의 낙인", false, {burn:true,isSpecial:true});
    if(r < a+b) return bossAllTargetAttack(boss, participants, battleLog, 1.5, "윤회의 불꽃", {burnBonus:true,isSpecial:true});
    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "bahamut"){
    const r = Math.random() * 100;

    const mega=scaleBossSkillChance(boss,15),roar=scaleBossSkillChance(boss,25);
    if(r < mega){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 3, "메가 플레어",!!boss._megaFlareIgnoreDodge,{isSpecial:true})) return;
      boss._fishDisabledNextTurn = true;
      battleLog.push(bossColor(boss.name, boss) + "의 메가 플레어 여파\n다음 턴 참가 물고기 전체가 행동할 수 없습니다.");
      return;
    }

    if(r < mega+roar){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 1.5, "용왕의 포효", false,{isSpecial:true})) return;
      boss._bahamutAttackBonus = Number(boss._bahamutAttackBonus || 0) + Math.floor(boss.attack * 0.5);
      battleLog.push(bossColor(boss.name, boss) + "의 공격력이 누적 증가했습니다.\n현재 공격력 : " + (boss.attack + boss._bahamutAttackBonus).toLocaleString());
      return;
    }

    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "tiamat"){
    const r = Math.random() * 100,a=scaleBossSkillChance(boss,25),b=scaleBossSkillChance(boss,15);
    if(r < a) return bossSingleTargetAttack(boss, participants, battleLog, 2, "창세의 바다", false,{isSpecial:true});
    if(r < a+b) return runBossSpecial(boss,"괴수 탄생",battleLog,()=>spawnBabyDragons(boss, battleLog));
    return bossSingleTargetAttack(boss, participants, battleLog, 1, "일반 공격", false);
  }

  if(boss.id === "jormungandr"){
    const r = Math.random() * 100,a=scaleBossSkillChance(boss,25),b=scaleBossSkillChance(boss,15);
    if(r < a){
      if(!bossSingleTargetAttack(boss, participants, battleLog, 2, "미드가르드 감기", false,{isSpecial:true})) return;
      const needed=boss.difficulty==="crazy"?2:3;
      boss._ring = Math.min(needed, Number(boss._ring || 0) + 1);
      if(boss._ring >= needed && !boss._ringCompleted){
        boss._ringCompleted = true;
        const completedBoost=boss.difficulty==="crazy"?1.0:boss.difficulty==="hard"?0.75:0.5;
        const completedCap=boss.difficulty==="crazy"?150:boss.difficulty==="hard"?125:100;
        boss._attackBoost = Math.max(Number(boss._attackBoost || 0), completedBoost);
        battleLog.push(bossBattleEvent(boss,"세계의 고리 완성","공격력 증가 한도가 "+completedCap+"%로 확장됩니다.","passive"));
        if(boss.difficulty==="crazy"){
          boss._ragnarokRingActive=true;
          getAliveTargets(participants).forEach(f=>{const c=ensureCombatStats(f);c.poisonStacks=Math.min(3,Number(c.poisonStacks||0)+1);});
          battleLog.push(bossCrazyPassiveEvent(boss,"라그나로크의 고리","모든 물고기에게 독 1중첩, 이후 2턴마다 고리가 조여옵니다."));
        }
      } else {
        battleLog.push(bossColor(boss.name, boss) + "의 세계의 고리 " + boss._ring + " / "+needed);
      }
      return;
    }
    if(r < a+b) return bossSingleTargetAttack(boss, participants, battleLog, 1.2, "종말의 독", false, {poison:true,isSpecial:true});
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
    if(boss.id === "kraken"){
      battleLog.push(bossBattleEvent(boss,"먹물 난사","먹물이 퍼져 이번 공격의 회피 시도를 무력화합니다.","passive"));
      bossSingleTargetAttack(boss, participants, battleLog, boss.difficulty==="crazy"?1.5:boss.difficulty==="hard"?1.35:1.2, "먹물 난사", true);
    }
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
    delete c.bossDisabledUntil;
    delete c.voidBanishedUntil;
    delete c.voidReturnDamage;
    delete c.bossAttackDebuffUntil;
    delete c.bossAttackDebuffRate;
    delete c.roarDebuffUntil;
    delete c.darknessDebuffUntil;
    delete c.abyssPressureUntil;
    delete c.critSuppressedUntil;
    delete c.gazeDebuffUntil;
    delete c.traitSealedUntil;
    delete c.healingBlockedUntil;
    delete c.healingPenalty;
    delete c.leviathanHealingUntil;
    delete c.roarAttackDebuffRate;
    delete c.roarCritDebuff;
    delete c.underworldReturnDamage;
    delete c.goodDeniedByAngra;
    if(c._preErosionMaxHp){
      c.maxHp = c._preErosionMaxHp;
      if(c.hp > 0) c.hp = Math.max(1, Math.min(c.maxHp, Math.floor(c.hp)));
      delete c._preErosionMaxHp;
    }
    if(c._traitBattle){
      if(c._traitBattle.originalMaxHp) c.maxHp=c._traitBattle.originalMaxHp;
      if(c.hp>0) c.hp=Math.max(1, Math.min(c.maxHp, Math.floor(c.hp)));
      delete c._traitBattle;
    }
  });
}

function getPreparedRecoveryFishes(){
  return bossPrepIndexes
    .map(idx => bucket[idx])
    .filter(f => f && f.grade !== "쓰레기" && getCombatStatusText(f) !== "정상");
}

function getBossReplayStatuses(boss){
  const statuses=[];
  if(boss.id==="surtr")statuses.push({key:"sword",icon:"🗡️",label:"불꽃의 검",current:Math.max(0,Number(boss._flameSwordHp||0)),max:Math.max(1,Number(boss._flameSwordMaxHp||1)),state:boss._flameSwordBroken?"파괴":"유지"});
  if(boss.id==="fenrir")statuses.push({key:"knots",icon:"⛓️",label:"글레이프니르",current:Math.max(0,Number(boss._gleipnirKnots||0)),max:boss.difficulty==="crazy"?8:boss.difficulty==="hard"?7:6,state:Number(boss._gleipnirKnots||0)<=0?"해방":"속박"});
  if(boss.id==="jormungandr")statuses.push({key:"ring",icon:"⭕",label:"세계의 고리",current:Math.max(0,Number(boss._ring||0)),max:boss.difficulty==="crazy"?2:3,state:boss._ringCompleted?"완성":"진행"});
  if(boss.id==="erebos")statuses.push({key:"light",icon:"🌘",label:"남은 빛",current:Math.max(0,Number(boss._lightGauge??100)),max:100,state:Number(boss._darknessUntil||0)>=(activeTraitBattle?activeTraitBattle.turn:0)?"완전 암흑":"감소 중"});
  if(Number(boss._stoneArmorHp||0)>0)statuses.push({key:"armor",icon:"🪨",label:"암석 갑옷",current:Number(boss._stoneArmorHp),max:Math.max(1,Number(boss._stoneArmorMaxHp||boss._stoneArmorHp)),state:"보호"});
  if(Number(boss._voidShieldHp||0)>0)statuses.push({key:"shield",icon:"🛡️",label:boss.id==="typhon"?"폭풍 장벽":boss.id==="erebos"?"원초의 장막":"보호막",current:Number(boss._voidShieldHp),max:Math.max(1,boss.id==="typhon"?Math.floor(boss.hp*0.12):Math.floor(boss.hp*0.15)),state:"보호"});
  if(boss.id==="typhon"&&Array.isArray(boss._typhonWeathers)&&boss._typhonWeathers.length)statuses.push({key:"weather",icon:"🌪️",label:"폭풍",text:boss._typhonWeathers.map(x=>({headwind:"역풍",turbulence:"난기류",eye:"폭풍의 눈"}[x]||x)).join(" + "),state:"활성"});
  if(boss.id==="azathoth"&&Array.isArray(boss._chaosDreamRules)&&Number(boss._chaosDreamUntil||0)>=(activeTraitBattle?activeTraitBattle.turn:0)){const labels={healing:"회복 봉인",trait:"특성 봉인",causality:"피해 전이"};statuses.push({key:"chaos",icon:"🕳️",label:"혼돈의 꿈",text:boss._chaosDreamRules.map(rule=>labels[rule]||rule).join(" + "),state:"규칙 붕괴"});}
  const ctx=activeTraitBattle,participants=ctx?.participants||[];
  if(ctx?.deletedSkill&&traitFish(participants,"잃어버린 첫 번째 편지 조각 ✉️",false))statuses.push({key:"void-deleted",icon:"✉️",label:"삭제된 서두",text:String(ctx.deletedSkill),state:"영구 삭제"});
  const observationLeft=ctx?.observedSkill?Math.max(0,Number(ctx.observedUntil||0)-Number(ctx.turn||0)):0;
  if(observationLeft>0&&traitFish(participants,"수상한 기운 👁️",false))statuses.push({key:"void-observation",icon:"👁️",label:"뒤틀린 관측",text:String(ctx.observedSkill),current:observationLeft,max:3,state:`관측 ${observationLeft}턴`});
  if(ctx?.periodStarted&&traitFish(participants,"잃어버린 세 번째 편지 조각 ✉️",false))statuses.push({key:"void-period",icon:"💌",label:"완성되지 않은 마침표",current:Math.max(0,Number(ctx.periodSentences||0)),max:5,state:Number(ctx.periodSentences||0)>=5?"종결":"문장 작성"});
  return statuses.slice(0,5);
}

function getFishReplayEffects(f,boss){
  const c=ensureCombatStats(f),effects=[],turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
  const addStack=(key,icon,label,value)=>{const stacks=Math.max(0,Number(value||0));if(stacks>0)effects.push({key,icon,label,stacks});};
  const add=(key,icon,label,detail="")=>effects.push({key,icon,label,detail:String(detail||"")});
  addStack("burn","🔥","화상",c.burnStacks);
  addStack("poison","☠️","독",c.poisonStacks);
  const stormFish=activeTraitBattle?traitFish(activeTraitBattle.participants,"휘몰아치는 마음"):null;
  if(stormFish&&!isFishTraitSealed(stormFish)&&getStormEye()===f)add("storm-eye","🌪️","폭풍의 눈","단일 피해 -50%");
  if(Array.isArray(c.rootLinkedPeers)&&c.rootLinkedPeers.length)add("root","🌿","뿌리 연결",Number(boss?._rootLinkTurns||0)>0?`${Number(boss._rootLinkTurns)}턴`:"");
  if(c.ratatoskrRedirect)add("redirect","🐿️","이간질");
  if(c.azhiCurses?.weakness)add("weakness","⚔️","쇠약");
  if(c.azhiCurses?.fear)add("fear","💨","공포");
  if(c.azhiCurses?.distrust)add("distrust","💥","불신");
  if(c.devouredByFenrir)add("devoured","⛓️","포식");
  if(Number(c.voidBanishedUntil||0)>=turn&&turn>0)add("banished","🌀","차원 추방",`${Math.max(1,Number(c.voidBanishedUntil)-turn+1)}턴`);
  else if(Number(c.bossDisabledUntil||0)>=turn&&turn>0)add("disabled","🔒","행동 불가",`${Math.max(1,Number(c.bossDisabledUntil)-turn+1)}턴`);
  if(Number(c.traitSealedUntil||0)>=turn&&turn>0)add("trait-sealed","🚫","특성 봉인");
  if(Number(c.healingBlockedUntil||0)>=turn&&turn>0)add("healing-blocked","❤️","회복 봉인");
  if(Number(c.critSuppressedUntil||0)>=turn&&turn>0)add("crit-blocked","💥","치명타 봉인");
  if(f.name==="휘몰아치는 마음"&&Number(c._traitBattle?.stormStacks||0)>0)add("storm","🌪️","바람",`${Number(c._traitBattle.stormStacks)} / 8`);
  return effects.slice(0,6);
}

function createBossBattleLog(boss,participants){
  const log=[],frames=[];
  Object.defineProperty(log,"replayFrames",{value:frames,enumerable:false});
  log.push=function(...entries){
    entries.forEach(entry=>{
      Array.prototype.push.call(log,entry);
      frames.push({
        entry:String(entry??""),
        turn:activeTraitBattle?Number(activeTraitBattle.turn||0):0,
        bossHp:Math.max(0,Number(boss._currentHp??boss.hp)),
        bossMaxHp:Number(boss.hp||1),
        fish:participants.map((f,index)=>{const c=ensureCombatStats(f),displayMaxHp=Math.max(Number(c.maxHp||1),Number(c._traitBattle?.originalMaxHp||1));return {
          key:String(f.id||index),name:String(f.name||""),displayName:displayFishName(f.name),grade:f.grade,
          battleLabel:String(lineFish(f)||displayFishName(f.name)),
          hp:Math.max(0,Number(c.hp||0)),maxHp:Math.max(1,displayMaxHp),status:getCombatStatusText(f),effects:getFishReplayEffects(f,boss),
          evolutionStage:typeof getFishEvolutionStage==="function"?getFishEvolutionStage(f):0,
          dimensionGroup:index%2===0?"A":"B"
        };}),
        bossStatuses:getBossReplayStatuses(boss),
        dimension:boss.id==="yog_sothoth"&&boss.difficulty==="crazy"&&!!boss._dimensionSplit?{active:true,activeGroup:(activeTraitBattle&&Number(activeTraitBattle.turn||0)%2===0)?"A":"B"}:{active:false,activeGroup:""},
        summons:(boss._summons||[]).map((summon,index)=>({summon,index})).filter(({summon})=>{
          const turn=activeTraitBattle?Number(activeTraitBattle.turn||0):0;
          return Number(summon.hp||0)>0&&(!summon.expiresTurn||Number(summon.expiresTurn)>=turn);
        }).map(({summon,index})=>({
          key:String(summon.id||("summon_"+index)),name:String(summon.name||"소환물"),order:Number(summon.order||index+1),
          hp:Math.max(0,Number(summon.hp||0)),maxHp:Math.max(1,Number(summon.maxHp||summon.hp||1)),attack:Math.max(0,Number(summon.attack||0))
        }))
      });
    });
    return log.length;
  };
  return log;
}

function captureBattleHealthStarts(participants){
  return participants.map(f=>{
    const c=ensureCombatStats(f),state=c._traitBattle||{};
    return {
      fish:f,
      startHp:Math.max(0,Number(state.battleStartHp??c.hp??0)),
      startMaxHp:Math.max(1,Number(state.battleStartMaxHp??state.originalMaxHp??c.maxHp??1))
    };
  });
}

function createBattleHealthReport(starts){
  const now=Date.now();
  return starts.map(item=>{
    const f=item.fish,c=ensureCombatStats(f);
    const endHp=Math.max(0,Math.min(Number(c.maxHp||1),Number(c.hp||0)));
    const maxHp=Math.max(1,Number(c.maxHp||item.startMaxHp||1));
    const lostHp=Math.max(0,item.startHp-endHp);
    return {
      key:String(f.id||f.name),name:String(f.name||""),grade:f.grade,
      startHp:item.startHp,endHp,maxHp,lostHp,
      lostRate:item.startHp>0?lostHp/item.startHp*100:0,
      remainingRate:endHp/maxHp*100,
      recoveryUntil:Number(c.stunUntil||0),
      recoveryMs:Math.max(0,Number(c.stunUntil||0)-now),
      status:c.knockedOut||c.hp<=0?"기절":c.status||"정상"
    };
  });
}

function runBossBattle(){
  if(!isBossMenu) return print("보스전에 입장한 뒤 사용할 수 있습니다.");
  recoverStunnedFish();

  const selectedBaseBoss = getCurrentBoss();
  const selectedDifficulty = getSelectedBossDifficulty(selectedBaseBoss);
  if(!isBossDifficultyUnlocked(selectedBaseBoss,selectedDifficulty)) return print("아직 해금되지 않은 보스 난이도입니다.");
  if(isBossCooldownActive(selectedBaseBoss.id,selectedDifficulty)) return print("아직 보스전 쿨타임이 남아있습니다.\n\n남은 시간 : " + formatRemain(getBossCooldownLeft(selectedBaseBoss.id,selectedDifficulty)));
  if(bossPrepIndexes.length === 0) return print("준비된 물고기가 없습니다.\n준비 번호 를 입력하세요.");

  const recoveryFishes = getPreparedRecoveryFishes();
  if(recoveryFishes.length > 0 && !pendingRecoveryBattleConfirm){
    pendingRecoveryBattleConfirm = true;
    if(typeof globalThis.openRecoveryBattleConfirm==="function")return globalThis.openRecoveryBattleConfirm(recoveryFishes);
    return print("회복 중인 물고기가 포함되어 있습니다. 계속하려면 전투 확인을 입력하세요.");
  }

  pendingRecoveryBattleConfirm = false;

  const boss = {
    ...getBossForDifficulty(selectedBaseBoss,selectedDifficulty),
    _enraged:false,
    _revived:false,
    _damageRecord:0,
    _fishDisabledNextTurn:false,
    _bahamutAttackBonus:0,
    _summons:[],
    _summonSeq:0,
    _attackBoost:0,
    _ring:0,
    _ringCompleted:false,
    _gleipnirKnots:selectedDifficulty==="crazy"?8:selectedDifficulty==="hard"?7:6,
    _knotsBrokenThisTurn:0,
    _fenrirNextAttackBonus:0,
    _devouredFish:null,
    _devourCritThisTurn:false,
    _flameSwordHp:0,
    _flameSwordMaxHp:0,
    _flameSwordBroken:false,
    _lastDamageToSword:0,
    _muspelPending:false,
    _surtrTurnAction:"normal",
    _surtrDuelTarget:null,
    _rootLinks:[],
    _rootLinkTurns:0,
    _erosionStacks:0,
    _baseCritRate:0,
    _baseCritDamage:0,
    _typhonWeather:null,
    _lastTopDamageFish:null,
    _lastTopDamage:0,
    _thisTurnTopDamageFish:null,
    _thisTurnTopDamage:0,
    _existenceWaves:{75:false,50:false,25:false},
    _eternalNight:false,
    _crazyUltimateUsed:false,
    _crazyAttackBoost:0,
    _crazyRevives:0,
    _voidShieldHp:0,
    _voidShieldUntil:0,
    _awakenedUntil:0,
    _chronosDamageHistory:[],
    _lastTurnDamageTaken:0,
    _currentTurnDamageTaken:0,
    _krakenPressure:0,
    _krakenPressureReducedTurn:0,
    _stoneArmorHp:0,
    _stoneArmorMaxHp:0,
    _stoneArmorTriggers:{70:false,40:false},
    _stoneExposedUntil:0,
    _muspelAwakened:false,
    _cerberusLastHeads:3,
    _chronosTimelineActive:false,
    _chronosTimelineEchoPending:false,
    _nyarlMaskIndex:-1,
    _nyarlMasks:[],
    _nyarlDualActive:false,
    _absoluteOrderActive:false,
    _megaFlareIgnoreDodge:false,
    _wrathReduction:0.5,
    _wrathReflect:0.3,
    _wrathFinalePending:false,
    _wrathFinaleReady:false,
    _babyDragonDeaths:0,
    _primordialDragonSummoned:false,
    _ragnarokRingActive:false,
    _stormBarrierStartedTurn:0,
    _stormBarrierUntil:0,
    _stormBarrierExploded:false,
    _erebosVeilStacks:0,
    _ignoreDodgeUntil:0,
    _cosmicCollapseTurn:0,
    _cosmicCollapseUsed:false,
    _chaosDreamRules:[],
    _chaosDreamUntil:0,
    _difficulty:selectedDifficulty
  };
  boss._baseCritRate=boss.critRate;
  boss._baseCritDamage=boss.critDamage;
  boss._flameSwordMaxHp=Math.max(1,Math.floor(boss.hp/6));
  boss._flameSwordHp=boss._flameSwordMaxHp;

  if(!isBossUnlocked(boss)) return print("아직 해금되지 않은 보스입니다.");
  if(isBossCooldownActive(boss.id,selectedDifficulty)) return print("아직 보스전 쿨타임이 남아있습니다.\n\n남은 시간 : " + formatRemain(getBossCooldownLeft(boss.id,selectedDifficulty)));

  let bossHp = getBossHp(boss,selectedDifficulty);
  let totalDamage = 0;
  const participants = getAlivePreparedFishes();
  const battleLog = createBossBattleLog(boss,participants);
  let result = "처치 실패";
  let rewardMoney = 0;
  let rewardDrop = "";
  let rewardDropCount = 0;
  let firstClear = false;
  let unlockedNextBoss = null;

  if(participants.length === 0) return print("전투 가능한 물고기가 없습니다.");

  cleanupBattleEffects(participants);
  initTraitBattle(participants,boss,battleLog);
  boss._currentHp=bossHp;

  if(boss.id === "angra_mainyu") participants.forEach(f => ensureCombatStats(f).existence = 3);

  battleLog.push("전투 시작\n\n" + participants.map(f => color(lineFish(f), f.grade) + "\n" + hpBar(ensureCombatStats(f).hp, ensureCombatStats(f).maxHp)).join("\n\n"));
  announceBossPassive(boss,battleLog);

  let turn = 1;
  const maxBattleTurns=selectedDifficulty==="crazy"?400:selectedDifficulty==="hard"?300:200;
  while(bossHp > 0 && participants.some(f => isBattleActionableFish(f)) && turn <= maxBattleTurns){
    boss._fishDisabledThisTurn = !!boss._fishDisabledNextTurn;
    boss._fishDisabledNextTurn = false;
    boss._knotsBrokenThisTurn = 0;
    if(boss._devouredFish) boss._devourCritThisTurn = false;
    boss._thisTurnTopDamage = 0;
    boss._thisTurnTopDamageFish = null;
    boss._currentTurnDamageTaken=0;

    battleLog.push("턴 " + turn);
    startTraitTurn(turn,boss,battleLog);
    processBossStartTurnDifficultyMechanics(boss,participants,battleLog);

    if(boss.id === "nidhogg"){
      if(boss._rootLinkTurns > 0){
        boss._rootLinkTurns--;
        if(boss._rootLinkTurns <= 0){
          (boss._rootLinks || []).forEach(f => delete ensureCombatStats(f).rootLinkedPeers);
          boss._rootLinks = [];
          battleLog.push(bossColor(boss.name,boss) + "의 뿌리 연결이 풀렸습니다.");
        }
      }
      const erosionInterval=boss.difficulty==="crazy"?2:boss.difficulty==="hard"?3:4;
      const erosionMax=boss.difficulty==="crazy"?8:boss.difficulty==="hard"?6:5;
      if(turn % erosionInterval === 0 && boss._erosionStacks < erosionMax){
        boss._erosionStacks++;
        let stolenMaxHp=0;
        participants.forEach(f => {
          const c=ensureCombatStats(f);
          if(!c._preErosionMaxHp) c._preErosionMaxHp=c.maxHp;
          const newMax=Math.max(1,Math.floor(c._preErosionMaxHp*(1-boss._erosionStacks*0.05)));
          stolenMaxHp+=Math.max(0,c.maxHp-newMax);
          c.maxHp=newMax; c.hp=Math.min(c.hp,newMax);
        });
        if(boss.difficulty==="crazy"&&stolenMaxHp>0){boss._voidShieldHp=Math.min(Math.floor(boss.hp*0.1),Number(boss._voidShieldHp||0)+Math.floor(stolenMaxHp*0.5));boss._voidShieldUntil=200;}
        battleLog.push(bossColor(boss.name,boss)+"의 세계수 침식\n최대 체력 -"+(boss._erosionStacks*5)+"%"+(boss.difficulty==="crazy"?"\n빼앗은 생명력으로 보호막을 생성했습니다.":""));
      }
    }

    prepareTyphonWeather(boss,battleLog);

    if(boss._fishDisabledThisTurn){
      battleLog.push(bossColor(boss.name, boss) + "의 메가 플레어 여파\n참가 물고기 전체가 이번 턴 행동할 수 없습니다.");
    }

    if(boss.id === "jormungandr"){
      const limit = boss._ringCompleted ? (boss.difficulty==="crazy"?1.5:boss.difficulty==="hard"?1.25:1.0) : (boss.difficulty==="crazy"?1.0:boss.difficulty==="hard"?0.75:0.5);
      const before = Number(boss._attackBoost || 0);
      const growth=boss.difficulty==="crazy"?0.10:boss.difficulty==="hard"?0.07:0.05;
      boss._attackBoost = Math.min(limit, before + growth);
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

      if(Number(c.bossDisabledUntil||0)>=turn || Number(c.voidBanishedUntil||0)>=turn){
        const reason=Number(c.voidBanishedUntil||0)>=turn?"공허의 차원에 추방되어":"보스의 힘에 속박되어";
        battleLog.push(color(lineFish(f),f.grade)+"\n"+reason+" 이번 턴에 행동할 수 없습니다.");
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
        const beforeSummonHp=Math.max(0,Number(targetSummon.hp||0));
        targetSummon.hp = Math.max(0, targetSummon.hp - dealt);
        totalDamage += Math.min(beforeSummonHp,dealt);

        let entry = (preAttackText ? preAttackText + "\n" : "") + color(lineFish(f), f.grade) + " 공격\n";
        if(hit.crit) entry += "치명타!\n";
        entry += dealt.toLocaleString() + " 피해\n\n";
        entry += targetSummon.name + "\n" + hpBar(targetSummon.hp, targetSummon.maxHp);
        battleLog.push(entry);

        if(targetSummon.hp <= 0){
          battleLog.push(targetSummon.name + "을 쓰러뜨렸습니다.");
          handleDefeatedBossSummon(boss,targetSummon,participants,battleLog);
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
        const beforeBossHp=Math.max(0,Number(bossHp||0));
        bossHp = Math.max(0, bossHp - damage);
        boss._currentHp = bossHp;
        const actualBossDamage=Math.min(beforeBossHp,damage);
        boss._currentTurnDamageTaken+=actualBossDamage;
        totalDamage += actualBossDamage + Number(boss._lastDamageToSword || 0);

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
          entry += "검 내구도 : " + Number(boss._flameSwordHp || 0).toLocaleString() + " / " + Number(boss._flameSwordMaxHp || 0).toLocaleString() + "\n";
          entry += "\n";
        } else {
          entry += damage.toLocaleString() + " 피해\n\n";
        }
        entry += bossColor(boss.name, boss) + "\n" + hpBar(bossHp, boss.hp);
        battleLog.push(entry);
        if(boss._flameSwordJustBroken)battleLog.push(bossBattleEvent(boss,"불꽃의 검 파괴","검의 피해 분담이 끝나고 수르트가 받는 피해가 "+(boss.difficulty==="crazy"?20:boss.difficulty==="hard"?25:30)+"% 증가합니다.","phase"));

        if(boss.id==="azathoth"&&boss.difficulty==="crazy"&&Array.isArray(boss._chaosDreamRules)&&boss._chaosDreamRules.includes("causality")&&Number(boss._chaosDreamUntil||0)>=turn){
          const allies=getAliveTargets(participants).filter(ally=>ally!==f),target=allies.length?allies[Math.floor(Math.random()*allies.length)]:f;
          if(target)applyDamageToFish(target,Math.max(1,Math.floor(damage*0.3)),battleLog,"인과의 법칙 붕괴\n"+color(lineFish(f),f.grade)+"의 공격이 아군에게 되돌아왔습니다.\n",{fromBoss:true,isSpecial:true,skillName:"인과의 법칙 붕괴"});
        }

        if(Number(boss._lastReflectedDamage||0)>0 && isBattleTargetableFish(f)){
          const reflected=Number(boss._lastReflectedDamage||0);
          boss._lastReflectedDamage=0;
          applyDamageToFish(f,reflected,battleLog,bossColor(boss.name,boss)+"의 용왕의 역린\n반사 피해\n",{fromBoss:true,isSpecial:true,skillName:"용왕의 역린"});
        }
        if(boss._wrathFinaleReady&&getAliveTargets(participants).length){
          boss._wrathFinaleReady=false;boss._wrathFinalePending=false;
          battleLog.push(bossBattleEvent(boss,"메가 플레어 반격","세 장의 역린이 깨지며 축적된 힘이 폭발합니다.","crazy"));
          bossAllTargetAttack(boss,participants,battleLog,2.5,"메가 플레어 반격",{ignoreDodge:true});
        }

        afterFishAttackTrait(f,boss,hit.crit?"crit":"hit",ts.attack,battleLog);
        bossHp=Math.max(0,Number(boss._currentHp));
        totalDamage+=Number(activeTraitBattle.traitDamage||0);
        activeTraitBattle.traitDamage=0;

        handleFenrirCriticalHit(boss, hit, battleLog);
        handleKrakenCriticalHit(boss,hit,battleLog);
        checkCrazyBossHpPassives(boss,bossHp,battleLog);

        if(boss.id === "angra_mainyu"){
          [75,50,25].forEach(threshold=>{
            if(!boss._existenceWaves[threshold] && bossHp <= boss.hp*threshold/100){
              boss._existenceWaves[threshold]=true;
              const alive=getAliveTargets(participants);
              const count=boss.difficulty==="crazy"?(threshold===75?1:threshold===50?2:alive.length):(boss.difficulty==="hard"?Math.min(2,alive.length):1);
              const shuffled=[...alive].sort(()=>Math.random()-0.5).slice(0,count);
              shuffled.forEach(target=>reduceExistence(boss,target,1,battleLog,"파멸의 파동 (체력 "+threshold+"%)"));
            }
          });
          if(bossHp <= boss.hp*0.25 && !boss._eternalNight){
            boss._eternalNight=true;
            battleLog.push(bossBattleEvent(boss,"영겁의 밤","공격력 30% 증가 · 회피율 0% · 존재 말살과 창조의 붕괴 강화","passive"));
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
    battleLog.push('<span style="color:#ff7b72;font-weight:700">보스 턴</span>');
    bossHp = applyBossTurnPassives(boss, bossHp, battleLog);
    boss._currentHp = bossHp;
    if(blankPageFish){
      battleLog.push(traitUseByFish(blankPageFish, "보스의 이번 페이지에는 아무 내용도 적혀 있지 않습니다.\n보스가 이번 턴에 행동하지 못합니다."));
    }else{
      if(boss.id==="chronos"&&boss._chronosTimelineEchoPending&&getAliveTargets(participants).length){
        boss._chronosTimelineEchoPending=false;
        battleLog.push(bossColor(boss.name,boss)+"의 겹쳐진 시간선\n이전 공격이 35% 위력으로 되돌아옵니다.");
        bossSingleTargetAttack(boss,participants,battleLog,0.35,"시간선의 잔상",false);
      }
      runBossAction(boss, participants, battleLog);
      if(boss.id==="chronos"&&boss._chronosTimelineActive)boss._chronosTimelineEchoPending=true;
      babyDragonActions(boss, participants, battleLog);
      const chronosEchoInterval=boss.difficulty==="crazy"?4:5;
      if(boss.id==="chronos"&&turn%chronosEchoInterval===0&&getAliveTargets(participants).length){
        battleLog.push(bossBattleEvent(boss,"시간의 잔향","다음 2턴 동안 대신 싸우는 시간의 잔상을 불러냅니다.","passive"));
        summonVoidMinion(boss,battleLog,{type:"chronos_echo",name:"시간의 잔상",duration:2,startsNextTurn:true});
      }
      const azathothInterval=boss.difficulty==="crazy"?2:3;
      const azathothExtra=boss.id==="azathoth"&&(Number(boss._awakenedUntil||0)>=turn||(boss._chaos25&&turn%azathothInterval===0));
      if(azathothExtra && getAliveTargets(participants).length){
        battleLog.push(bossColor(boss.name,boss)+"의 완전 각성\n두 번째 행동이 시작됩니다.");
        runBossAction(boss,participants,battleLog);
      }
    }

    bossHp=Math.max(0,Number(boss._currentHp));
    totalDamage+=Number(activeTraitBattle.traitDamage||0);
    activeTraitBattle.traitDamage=0;
    bossHp=applyPhoenixImmortalityIfNeeded(boss,bossHp,battleLog);
    boss._currentHp=bossHp;
    tryTimeRewindAfterWipe(battleLog);
    finishTraitTurn(boss,battleLog);
    bossHp=Math.max(0,Number(boss._currentHp));

    if(boss.id === "typhon"){
      boss._lastTopDamage=boss._thisTurnTopDamage;
      boss._lastTopDamageFish=boss._thisTurnTopDamageFish;
    }

    boss._lastTurnDamageTaken=Number(boss._currentTurnDamageTaken||0);
    boss._chronosDamageHistory.push(boss._lastTurnDamageTaken);
    if(boss._chronosDamageHistory.length>2) boss._chronosDamageHistory.shift();

    turn++;
  }

  if(bossHp <= 0){
    result = "처치 성공";
    firstClear = isBossFirstClear(selectedBaseBoss,selectedDifficulty);
    const clearedBossIndex=bossList.findIndex(item=>item.id===selectedBaseBoss.id);
    const nextBossCandidate=clearedBossIndex>=0?bossList[clearedBossIndex+1]:null;
    const nextBossWasUnlocked=!!(nextBossCandidate&&isBossUnlocked(nextBossCandidate));
    rewardMoney = firstClear ? getBossDifficultyReward(selectedBaseBoss,selectedDifficulty) : 0;
    rewardDrop = boss.drop;
    const coreRange=getBossCoreRange(selectedDifficulty);
    rewardDropCount = randomInt(coreRange.min,coreRange.max);

    if(rewardMoney > 0){
      money = normalizeMoney(money + rewardMoney);
      totalEarned = normalizeMoney(totalEarned + rewardMoney);
    }

    addMaterial(rewardDrop, rewardDropCount);
    markBossDifficultyCleared(selectedBaseBoss,selectedDifficulty);
    if(nextBossCandidate&&!nextBossWasUnlocked&&isBossUnlocked(nextBossCandidate)){
      unlockedNextBoss={id:nextBossCandidate.id,name:nextBossCandidate.name};
    }
    bossProgress.hp[boss.id+":"+selectedDifficulty] = boss.hp;

    if(firstClear&&selectedDifficulty==="hard"){
      battleLog.push(bossBattleEvent(boss,"프로필 테두리 해금",boss.name+" 어려움 클리어 보상으로 전용 테두리를 획득했습니다.","passive"));
    }
    if(firstClear&&selectedDifficulty==="crazy"){
      battleLog.push(bossBattleEvent(boss,"보스 오라 해금",boss.name+" 크레이지 클리어 보상으로 전용 오라를 획득했습니다.","passive"));
      if(isBossGradeCrazyCleared(boss.grade)){
        battleLog.push(bossBattleEvent(boss,boss.grade+" 등급 완전 정복",boss.grade+" 전용 배경과 최종 한정 공격 연출을 함께 획득했습니다.","passive"));
      }
    }

    battleLog.push(boss.difficultyName+" 난이도 보스 코어 보상\n" + rewardDrop + " x" + rewardDropCount.toLocaleString() + " 획득");

    if(firstClear){
      battleLog.push("최초 클리어 보상\n" + formatMoney(rewardMoney) + " 획득");
    } else {
      battleLog.push("재도전 클리어\n이미 최초 클리어 보상을 획득한 보스입니다.\n상금은 지급되지 않습니다.");
    }

    if(selectedDifficulty==="normal") bossProgress.selectedDifficulty="hard";
    else if(selectedDifficulty==="hard") bossProgress.selectedDifficulty="crazy";
    else {
      const nextBoss = bossList.find(b => isBossUnlocked(b) && !isBossDifficultyCleared(b,"normal"));
      if(nextBoss){ bossProgress.selectedBossId=nextBoss.id; bossProgress.selectedDifficulty="normal"; }
    }
  } else {
    bossProgress.hp[boss.id+":"+selectedDifficulty] = boss.hp;
    battleLog.push(bossColor(boss.name, boss) + "의 체력이 최대 체력으로 회복되었습니다.\n다음 전투는 처음부터 다시 시작됩니다.");
  }

  const battleHealthStarts=captureBattleHealthStarts(participants);
  cleanupBattleEffects(participants);
  activeTraitBattle=null;
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
        markRecoveringIfDamaged(f,true);
      }
    }
  });
  const healthReport=createBattleHealthReport(battleHealthStarts);

  const resultText = buildBattleResultText(boss, participants, totalDamage, result, rewardMoney, rewardDrop, rewardDropCount, battleLog,healthReport);
  const summary = buildBattleSummaryText(boss, result, rewardMoney, rewardDrop, rewardDropCount,healthReport);
  globalThis.pendingBossBattleReplay={
    id:`boss_${Date.now()}_${boss.id}_${selectedDifficulty}`,
    createdAtMillis:Date.now(),
    boss:{id:boss.id,name:boss.name,grade:boss.grade,color:boss.color,difficulty:boss.difficultyName||"일반",maxHp:boss.hp},
    frames:battleLog.replayFrames.slice(),result,totalDamage,rewardMoney,rewardDrop,rewardDropCount,firstClear,difficultyId:selectedDifficulty,unlockedNextBoss,summary,healthReport
  };
  addBattleHistory("boss",globalThis.pendingBossBattleReplay);
  clearBattleDisplayNumbers(participants);

  if(result === "처치 성공"){
    setBossCooldown(boss.id,selectedDifficulty);
  }
  bossPrepIndexes = [];
  saveGame();

  printPreview("전투 종료", summary, "전투 결과", resultText);
}

function buildBattleSummaryText(boss, result, rewardMoney, rewardDrop, rewardDropCount,healthReport=[]){
  let s = line() + "\n\n";
  s += bossColor(boss.name, boss) + " ["+(boss.difficultyName||"일반")+"] " + result + "\n\n";

  if(result === "처치 성공"){
    s += "획득\n\n";
    if(rewardMoney > 0){
      s += (boss.difficultyName||"일반")+" 최초 클리어 상금 : " + formatMoney(rewardMoney) + "\n";
    } else {
      s += "상금 : 이미 획득 완료\n";
    }
    s += rewardDrop + " x" + rewardDropCount.toLocaleString() + "\n\n";
  }

  if(healthReport.length){
    s += "파티 체력 변화\n\n";
    healthReport.forEach(item=>{
      s += displayFishName(item.name)+" : "+Math.floor(item.startHp).toLocaleString()+" → "+Math.floor(item.endHp).toLocaleString()+" / "+Math.floor(item.maxHp).toLocaleString()+"\n";
      s += "감소 "+item.lostRate.toFixed(1)+"% · 잔여 "+item.remainingRate.toFixed(1)+"%"+(item.recoveryMs>0?" · "+(item.status==="기절"?"기절 ":"회복 ")+formatRemain(item.recoveryMs):"")+"\n";
    });
    s += "\n";
  }

  s += line();
  return s;
}

function buildBattleResultText(boss, participants, totalDamage, result, rewardMoney, rewardDrop, rewardDropCount, battleLog,healthReport=[]){
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
    participants.forEach((f,index) => {
      const health=healthReport[index];
      s += lineFish(f) + " (" + getCombatStatusText(f) + ")\n";
      if(health){
        s += "전투 전 "+Math.floor(health.startHp).toLocaleString()+" → 종료 "+Math.floor(health.endHp).toLocaleString()+" / "+Math.floor(health.maxHp).toLocaleString()+"\n";
        s += "기존 체력 대비 "+health.lostRate.toFixed(1)+"% 감소 · 잔여 "+health.remainingRate.toFixed(1)+"%"+(health.recoveryMs>0?" · "+(health.status==="기절"?"기절 ":"회복 ")+formatRemain(health.recoveryMs):"")+"\n";
      }
    });
  }

  s += "\n" + line() + "\n\n";
  s += "총 피해\n\n";
  s += totalDamage.toLocaleString() + "\n\n";
  s += line() + "\n\n";
  s += "결과\n\n";
  s += boss.name + " ["+(boss.difficultyName||"일반")+"] " + result + "\n\n";

  if(result === "처치 성공"){
    s += line() + "\n\n";
    s += "획득\n\n";
    if(rewardMoney > 0){
      s += (boss.difficultyName||"일반")+" 최초 클리어 상금 : " + formatMoney(rewardMoney) + "\n";
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


