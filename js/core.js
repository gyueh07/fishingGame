let money=0, totalEarned=0, rodLevel=1, bucket=[], collection={}, ranking=[], isFishing=false;
let totalFishingCount=0, gradeCounts={}, completedAchievements=[];
let marketHour=null, marketRates={};
let serverTimeOffsetMs=0, hasServerTime=false, serverTimeAtSync=0, monotonicAtSync=0;
let notifications=[];
let messages=[];
let researchLevels={fishing:0, appraisal:0};
let trainingLevels={attack:0,hp:0,critDamage:0};
let unlockedTitles=[];
let equippedTitle="";
let seenUpdateNoticeIds=[];
let bossProgress={defeated:{}, hp:{}, materials:{}, cooldownUntil:0};
let isBossMenu=false;
let bossPrepIndexes=[];
let pendingRecoveryBattleConfirm=false;
let pvpPrepIndexes=[];
let partyPresets={boss:[],pvp:[]};
let pendingPresetSaleId="";
let pendingPresetSellAll=false;
let onlinePresenceTimer=null;
let fishingTimer=null;
let fishingSessionId=0;
let cloudRevision=0;
let cloudSaveChain=Promise.resolve();

const log = document.getElementById("log");
const input = document.getElementById("command");
const GAME_VERSION = "2026-07-10-fishinglife-timing-training-v2";
const UPDATE_NOTICE_TITLE = "📢 업데이트 안내";
const UPDATE_NOTICES = [
  {
    id: "2026-07-10-fishinglife-timing-training-2",
    title: "FishingLife 게임 UI 업데이트",
    lines: [
      "게임 이름이 FishingLife로 변경되었습니다.",
      "낚시 타이밍 미니게임과 PERFECT, GREAT, GOOD, BAD 판정이 추가되었습니다.",
      "타이밍 판정에 따라 물고기 등급 확률과 도주 확률이 달라집니다.",
      "훈련소가 구간별 누적 성장 방식으로 상향되어 기존 양동이 물고기에도 적용됩니다.",
      "채팅형 명령어 화면을 제거하고 시세, 도감, 보스전, 대전 메뉴를 게임형 화면으로 변경했습니다.",
      "양동이에서 최근 획득한 물고기 10마리를 확인할 수 있습니다."
    ]
  },
  {
    id: "2026-07-10-responsive-ui-core-drop-1",
    title: "새 게임 화면과 보스 코어 보상",
    lines: [
      "모바일과 PC에서 함께 사용할 수 있는 반응형 게임 화면이 적용되었습니다.",
      "기존 명령어와 모든 저장 데이터, 물고기 능력치, 전투 규칙은 그대로 유지됩니다.",
      "보스를 처치하면 해당 보스의 전용 코어를 1~10개 획득합니다.",
      "기존 명령어는 게임 기록의 명령어 입력창에서 계속 사용할 수 있습니다."
    ]
  },
  {
    id: "2026-06-25-battle-pvp-bugfix-1",
    title: "보스전/PVP 전투 버그 수정",
    lines: [
      "수르트가 프레이르와의 결투 중 쓰러진 뒤에도 반격할 수 있던 문제를 수정했습니다.",
      "PVP에서 흑룡의 역린 반사 피해가 사망 방지, 시간 되감기 같은 방어 효과를 건너뛰던 문제를 수정했습니다.",
      "PVP에서 반사 피해로 쓰러진 공격자가 추가 공격 같은 후속 고유효과를 이어서 발동할 수 있던 문제를 수정했습니다."
    ]
  },
  {
    id: "2026-06-25-nidhogg-achievement-fix-1",
    title: "업적/니드호그 전투 수정",
    lines: [
      "업적에서 초월 낚싯대와 궁극 낚싯대를 제거했습니다.",
      "제거된 업적이 저장 데이터에 남아 있어도 업적 달성률에는 포함되지 않도록 수정했습니다.",
      "니드호그의 뿌리 연결 전투 중 쓰러진 아군이 다음 턴에 다시 행동할 수 있던 문제를 수정했습니다."
    ]
  },
  {
    id: "2026-06-23-log-spacing-1",
    title: "전투 로그 가독성 수정",
    lines: [
      "수르트의 불꽃의 검 분산 로그에서 피해량이 중복 표시되는 문제를 수정했습니다.",
      "고유 특성 추가 피해와 불꽃의 검 분산 로그 사이에 문단 간격을 추가해 읽기 쉽게 정리했습니다."
    ]
  },
  {
    id: "2026-06-23-burning-heartbeat-1",
    title: "불타는 마음 특성 개편",
    lines: [
      "불타는 마음의 고유 특성이 폭주에서 화염의 심박으로 변경되었습니다.",
      "공격 시 현재 체력을 조금 소모하고, 체력 비율에 따라 심박 단계가 상승합니다.",
      "심박 2 이상에서는 추가 공격이, 심박 3에서는 낮은 체력 회복이 일정 확률로 발생합니다.",
      "전투 중 상태 표시는 별도 로그가 아니라 해당 물고기의 공격 바로 위에 표시됩니다."
    ]
  },
  {
    id: "2026-06-23-surtr-letter-log-1",
    title: "수르트/편지 특성 로그 수정",
    lines: [
      "무스펠의 진군으로 발생하는 피해가 수르트의 공격 로그와 물고기 체력바로 표시됩니다.",
      "불꽃의 검 피해 분산은 물고기가 공격한 로그 안에서 함께 표시되도록 변경되었습니다.",
      "잃어버린 첫 번째 편지는 여러 마리가 있어도 전투당 하나의 스킬만 삭제합니다.",
      "잃어버린 세 번째 편지의 부활 봉인 효과가 제거되고 회복 봉인만 유지됩니다."
    ]
  },
  {
    id: "2026-06-23-training-rod-1750-1",
    title: "훈련소/낚싯대 확장",
    lines: [
      "훈련소 최대 레벨이 15단계로 확장되고 해금 조건 없이 골드로 강화할 수 있습니다.",
      "낚싯대 최대 레벨이 1750으로 확장되고 영원 보스 재료 구간이 추가되었습니다.",
      "낚싯대는 1000레벨부터 강화 성공률이 100%로 적용됩니다.",
      "1000~1750레벨의 등급별 낚시 확률이 일차함수로 변화합니다.",
      "공허 등급의 기본 판매가가 영원 등급의 100배로 상향되고 영원 보스 상금이 조정되었습니다."
    ]
  },
  {
    id: "2026-06-23-eternal-void-rework-1",
    title: "영원/공허 고유 특성 개편",
    lines: [
      "생명의 빛이 충분한 빛을 저장했을 때만 죽음을 막도록 조정되었습니다.",
      "무한한 시간이 쓰러지면 파티가 5턴 전 상태로 되돌아가도록 변경되었습니다.",
      "수상한 기운과 세 편지 조각의 고유 특성이 새롭게 개편되었습니다.",
      "보스전과 PVP에 개편된 특성 판정과 로그가 함께 적용됩니다."
    ]
  },
  {
    id: "2026-06-22-pvp-traits-1",
    title: "PVP 다중 전투 업데이트",
    lines: [
      "PVP가 1대1 순차 전투에서 준비한 물고기 전원이 참여하는 다중 전투로 변경되었습니다.",
      "신화, 초월, 영원, 공허 고유 특성이 PVP에서도 작동하도록 적용되었습니다.",
      "공허 편지, 수치 오류, 생명의 빛, 재의 유언 같은 사망/반전/복구 특성도 PVP용으로 처리됩니다."
    ]
  },
  {
    id: "2026-06-22-fish-traits-1",
    title: "물고기 고유 특성 업데이트",
    lines: [
      "신화, 초월, 영원, 공허 물고기 24종에 서로 다른 고유 패시브가 추가되었습니다.",
      "일반 공격과 보스 특수 스킬 판정이 분리되어 반전과 봉인이 특수 스킬에만 적용됩니다.",
      "물고기특성 명령어와 정보 번호에서 고유 특성을 확인할 수 있습니다.",
      "기묘한 기운의 수치 오류는 조건 충족 시 20% 확률로 발동하며 피해 제한이 없습니다."
    ]
  },
  {
    id: "2026-06-20-update-1",
    title: "시세/메세지 업데이트",
    lines: [
      "시세가 10분마다 갱신되도록 변경되었습니다.",
      "시세 대상이 전설~영원 중 랜덤 10종으로 변경되었습니다.",
      "미획득 시세 물고기는 [???] ??? 로 표시됩니다.",
      "메세지 기능이 추가되었습니다.",
      "업데이트/알림/메세지가 각각 따로 표시됩니다."
    ]
  },
  {
    id: "2026-06-20-boss-expansion-1",
    title: "보스전 확장 업데이트",
    lines: [
      "인벤토리 기능이 추가되었습니다.",
      "보스선택 기능이 추가되었습니다.",
      "보스별 패턴이 추가되었습니다.",
      "전투 결과 전체보기에서 상세 로그를 볼 수 있게 되었습니다.",
      "전투 로그에 체력바가 추가되었습니다.",
      "보스별 색상이 적용되었습니다."
    ]
  },
  {
    id: "2026-06-20-boss-balance-1",
    title: "보스전 밸런스 업데이트",
    lines: [
      "별 시스템이 개편되었습니다.",
      "공격력/체력은 ★ 3배, ★★ 7배, ★★★ 20배 구간에서 생성됩니다.",
      "회피율은 별 없음 1~1.5%, ★ 1.5~2.5%, ★★ 2.5~4.5%, ★★★ 4.5~7% 구간에서 생성됩니다.",
      "보스전 쿨타임 5분이 추가되었습니다.",
      "물고기 기절 회복 시간이 전 등급 공통 10분으로 변경되었습니다."
    ]
  },
  {
    id: "2026-06-20-boss-rod-void-1",
    title: "보스/낚싯대/공허 업데이트",
    lines: [
      "공허 등급과 편지 조각 3종이 추가되었습니다.",
      "보스가 크라켄, 히드라, 리바이어던, 베히모스로 확장되었습니다.",
      "보스전이 준비한 물고기 전체가 함께 싸우는 방식으로 변경되었습니다.",
      "물고기도감과 코어도감이 분리되었습니다.",
      "낚싯대 최대 레벨이 1500으로 확장되었습니다."
    ]
  },
  {
    id: "2026-06-20-rod-material-cap-1",
    title: "낚싯대 확장 밸런스 업데이트",
    lines: [
      "현재 버전의 강화 가능 레벨이 1400으로 확장되었습니다.",
      "1000레벨부터 보스 재료가 필요하도록 변경되었습니다.",
      "보스 재료는 50레벨마다 교체됩니다.",
      "필요 재료 수량은 25레벨마다 1개씩 증가합니다.",
      "1200~1400 강화 구간에 피닉스, 바하무트, 티아마트, 요르문간드 재료가 추가되었습니다."
    ]
  },
  {
    id: "2026-06-20-combat-recovery-1",
    title: "전투 회복 업데이트",
    lines: [
      "기존 물고기의 별/공격력/체력/회피율/치명타가 새 전투 시스템 기준으로 다시 생성됩니다.",
      "전투 상태 표시가 정상 / 회복 중으로 정리되었습니다.",
      "회복 중인 물고기도 전투에 참가할 수 있습니다.",
      "회복 중인 물고기가 포함된 상태로 전투를 시작하면 확인이 필요합니다.",
      "전투 종료 후 살아남은 물고기는 체력이 모두 회복됩니다."
    ]
  },
  {
    id: "2026-06-20-message-material-fix-1",
    title: "메세지/강화 오류 수정",
    lines: [
      "메세지 보내기 기능이 정상 작동하도록 수정되었습니다.",
      "읽지 않은 메세지 전체보기 기능이 추가되었습니다.",
      "1000레벨 이후 강화 재료 검사와 소모가 정상 적용됩니다.",
      "전투 스탯 자동 변환이 계정당 1회만 적용되도록 수정되었습니다.",
      "회복 중 물고기가 전투에서 살아남으면 정상 상태로 회복되도록 수정되었습니다."
    ]
  },
  {
    id: "2026-06-20-crit-star-fix-1",
    title: "치명타 별 시스템 수정",
    lines: [
      "치명타 확률과 치명타 피해가 별 구간 방식으로 변경되었습니다.",
      "별 없음 70%, ★ 20%, ★★ 8%, ★★★ 2% 확률이 적용됩니다.",
      "치명타 확률은 별 없음 10~20%, ★ 20~30%, ★★ 30~40%, ★★★ 40~50%로 생성됩니다.",
      "치명타 피해는 별 없음 150~250%, ★ 250~350%, ★★ 350~450%, ★★★ 450~500%로 생성됩니다.",
      "기존 물고기의 치명타 확률과 치명타 피해가 새 기준으로 다시 생성됩니다."
    ]
  },
  {
    id: "2026-06-20-boss-next-fix-1",
    title: "보스 진행 오류 수정",
    lines: [
      "보스 처치 후 다음 보스가 자동으로 선택되도록 수정되었습니다.",
      "이미 처치한 보스가 선택된 상태로 남아 전투가 막히던 문제가 수정되었습니다.",
      "보스 처치 완료 후에도 보스목록에서 다음 도전 가능한 보스를 확인할 수 있습니다."
    ]
  },
  {
    id: "2026-06-20-boss-cooldown-recovery-1",
    title: "보스 쿨타임/회복 방식 수정",
    lines: [
      "처치 완료한 보스도 다시 도전할 수 있도록 변경되었습니다.",
      "보스 쿨타임이 보스별로 따로 적용되도록 변경되었습니다.",
      "보스전 실패 시에는 쿨타임이 적용되지 않습니다.",
      "회복 중인 물고기는 시간이 지날수록 체력이 서서히 회복됩니다.",
      "회복 중인 물고기도 현재 회복된 체력으로 전투에 참가할 수 있습니다."
    ]
  },
  {
    id: "2026-06-20-boss-fail-hp-reset-1",
    title: "보스전 실패 처리 수정",
    lines: [
      "보스전 실패 시 보스 체력이 최대 체력으로 초기화됩니다.",
      "전투 실패 후에는 쿨타임 없이 바로 다시 도전할 수 있습니다.",
      "보스 처치 성공 시에도 다음 도전은 보스 최대 체력으로 시작됩니다."
    ]
  },
  {
    id: "2026-06-20-boss-13-first-clear-1",
    title: "13보스/최초 클리어 보상 업데이트",
    lines: [
      "보스가 8단계 요르문간드까지 적용되었습니다.",
      "9단계 이후 보스는 삭제되었습니다.",
      "보스 상금은 최초 클리어 시에만 지급됩니다.",
      "재도전 처치 시에는 상금 없이 보스 재료만 획득합니다.",
      "피닉스, 바하무트, 티아마트, 요르문간드의 전용 스킬 효과가 적용되었습니다."
    ]

  },
  {
    id: "2026-06-21-training-lab-1",
    title: "훈련소 업데이트",
    lines: [
      "훈련소가 추가되었습니다.",
      "훈련소1은 모든 전투 물고기의 공격력을 증가시킵니다.",
      "훈련소2는 모든 전투 물고기의 체력을 증가시킵니다.",
      "훈련소3은 모든 전투 물고기의 치명타 피해를 증가시킵니다.",
      "훈련소는 별 시스템과 별개로 적용되며 골드만 사용합니다."
    ]
  }
  ,
  {
    id: "2026-06-21-pvp-1",
    title: "1대1 대전 업데이트",
    lines: [
      "온라인 유저에게 1대1 대전을 신청할 수 있습니다.",
      "대전수락 후 대전준비를 할 수 있습니다.",
      "대전은 서로 최대 3마리씩 출전합니다.",
      "보스전처럼 체력 숫자와 체력바가 포함된 전체보기 로그가 제공됩니다.",
      "대전에서는 기절, 회복, 보상, 재료 획득이 적용되지 않습니다.",
      "훈련소 효과는 대전에도 적용됩니다."
    ]
  },
  {
    id: "2026-06-22-fenrir-surtr-1",
    title: "펜리르/수르트 및 1500레벨 확장",
    lines: [
      "9단계 보스 펜리르와 10단계 보스 수르트가 추가되었습니다.",
      "낚싯대 강화 가능 레벨이 1500까지 확장되었습니다.",
      "1400~1450 구간에는 글레이프니르의 파편이 필요합니다.",
      "1450~1500 구간에는 무스펠의 불꽃이 필요합니다.",
      "영원/공허 전투 능력치 상향과 겹치지 않는 공격력·체력 별 구간이 적용됩니다."
    ]
  }
];

const firebaseConfig = {
  apiKey: "AIzaSyBLH8EJYZ4x9dez23PkFrMAMo3JD5vaO8I",
  authDomain: "fishinggame-1c8ac.firebaseapp.com",
  projectId: "fishinggame-1c8ac",
  storageBucket: "fishinggame-1c8ac.firebasestorage.app",
  messagingSenderId: "1075825889471",
  appId: "1:1075825889471:web:dba6773633846463e4760a",
  measurementId: "G-HKMKFFCT67"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentUser = localStorage.getItem("textFishingCurrentUser") || null;
let cloudSaveTimer = null;
let localSaveSeq = 0;
let cloudSyncedSeq = 0;
let serverAlertUnsubscribe = null;
let serverAlertStartTime = Date.now();
let isOnlineActionRunning = false;

function cleanNickname(name){
  const cleaned = String(name || "").trim().replace(/\s+/g, "_").slice(0, 16);
  return /^[A-Za-z0-9_\-가-힣]{1,16}$/.test(cleaned) ? cleaned : "";
}

async function hashPassword(password){
  const msg = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msg);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function createSessionToken(){
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function startUserSession(nickname){
  const token = createSessionToken();
  sessionStorage.setItem("textFishingSessionToken", token);
  sessionStorage.setItem("textFishingSessionUser", nickname);
  return hashPassword("session:" + token);
}

function clearUserSession(){
  sessionStorage.removeItem("textFishingSessionToken");
  sessionStorage.removeItem("textFishingSessionUser");
}

async function getCurrentSessionHash(){
  const token = sessionStorage.getItem("textFishingSessionToken");
  const user = sessionStorage.getItem("textFishingSessionUser");
  if(!token || !currentUser || user !== currentUser) return "";
  return hashPassword("session:" + token);
}

async function hasValidSession(userData){
  const sessionHash = await getCurrentSessionHash();
  return !!sessionHash && !!userData && userData.sessionTokenHash === sessionHash;
}

function cancelActiveFishing(){
  fishingSessionId++;
  if(fishingTimer !== null){
    clearTimeout(fishingTimer);
    fishingTimer = null;
  }
  isFishing = false;
}

function getGameState(){
  return {
    money,
    totalEarned,
    rodLevel,
    bucket,
    collection,
    ranking,
    totalFishingCount,
    gradeCounts,
    completedAchievements,
    marketHour,
    marketRates,
    notifications,
    messages,
    researchLevels,
    trainingLevels,
    unlockedTitles,
    equippedTitle,
    seenUpdateNoticeIds,
    bossProgress,
    pvpPrepIndexes,
    partyPresets
  };
}

function normalizeUpdateNoticeIds(value, oldValue){
  if(Array.isArray(value)) return value;
  if(typeof value === "string" && value) return [value];
  if(Array.isArray(oldValue)) return oldValue;
  if(typeof oldValue === "string" && oldValue) return [oldValue];
  return [];
}

function normalizeLegacyTitleName(value){
  return value === "만렙" ? "천 번의 담금질" : value;
}

function normalizeLegacyTitleList(value){
  if(!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeLegacyTitleName))];
}


function normalizeBossProgress(value){
  const base = {defeated:{}, hp:{}, materials:{}, selectedBossId:"", cooldownUntil:0, cooldowns:{}};
  if(!value || typeof value !== "object") return base;
  return {
    defeated:value.defeated || {},
    hp:value.hp || {},
    materials:value.materials || {},
    selectedBossId:value.selectedBossId || "",
    cooldownUntil:Number(value.cooldownUntil || 0),
    cooldowns:value.cooldowns || {}
  };
}

function normalizeResearchLevels(value){
  const base = {fishing:0, appraisal:0};
  if(!value || typeof value !== "object") return base;
  return {
    fishing: Number(value.fishing || 0),
    appraisal: Number(value.appraisal || 0)
  };
}

function normalizeTrainingLevels(value){
  const base = {attack:0,hp:0,critDamage:0};
  if(!value || typeof value !== "object") return base;
  return {
    attack: Math.min(15, Math.max(0, Number(value.attack || 0))),
    hp: Math.min(15, Math.max(0, Number(value.hp || 0))),
    critDamage: Math.min(15, Math.max(0, Number(value.critDamage || 0)))
  };
}

function normalizePartyPresets(value){
  if(!value || typeof value !== "object") return {boss:[],pvp:[]};
  return {
    boss:Array.isArray(value.boss) ? [...new Set(value.boss.map(String))].slice(0,5) : [],
    pvp:Array.isArray(value.pvp) ? [...new Set(value.pvp.map(String))].slice(0,3) : []
  };
}

function makeFishId(){
  return "fish_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,10);
}

function ensureAllFishIds(){
  const used = new Set();
  bucket.forEach(f => {
    if(!f) return;
    let id = String(f.id || "");
    if(!id || used.has(id)) id = makeFishId();
    f.id = id;
    used.add(id);
  });
}

function applyGameState(s){
  if(!s) return;
  money=normalizeMoney(s.money??money);
  totalEarned=normalizeMoney(s.totalEarned??totalEarned);
  rodLevel=s.rodLevel??rodLevel;
  bucket=s.bucket??bucket;
  collection=s.collection??collection;
  ranking=s.ranking??ranking;
  totalFishingCount=s.totalFishingCount??totalFishingCount;
  gradeCounts=s.gradeCounts??gradeCounts;
  completedAchievements=normalizeLegacyTitleList(s.completedAchievements??completedAchievements);
  marketHour=s.marketHour??marketHour;
  marketRates=s.marketRates??marketRates;
  notifications=s.notifications??notifications;
  messages=Array.isArray(s.messages)?s.messages:messages;
  researchLevels=normalizeResearchLevels(s.researchLevels??researchLevels);
  trainingLevels=normalizeTrainingLevels(s.trainingLevels??trainingLevels);
  unlockedTitles=normalizeLegacyTitleList(Array.isArray(s.unlockedTitles)?s.unlockedTitles:unlockedTitles);
  equippedTitle=normalizeLegacyTitleName(s.equippedTitle??equippedTitle);
  seenUpdateNoticeIds=normalizeUpdateNoticeIds(s.seenUpdateNoticeIds, s.lastSeenUpdateVersion);
  bossProgress=normalizeBossProgress(s.bossProgress??bossProgress);
  pvpPrepIndexes=Array.isArray(s.pvpPrepIndexes)?s.pvpPrepIndexes:[];
  partyPresets=normalizePartyPresets(s.partyPresets??partyPresets);
  ensureAllFishIds();
}


async function checkGameVersion(){
  return true;
}

function resetGameData(){
  cancelActiveFishing();
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = null;
  money = 0;
  totalEarned = 0;
  rodLevel = 1;
  bucket = [];
  collection = {};
  ranking = [];
  isFishing = false;
  totalFishingCount = 0;
  gradeCounts = {};
  completedAchievements = [];
  marketHour = null;
  marketRates = {};
  notifications = [];
  messages = [];
  researchLevels = {fishing:0, appraisal:0};
  trainingLevels = {attack:0,hp:0,critDamage:0};
  unlockedTitles = [];
  equippedTitle = "";
  seenUpdateNoticeIds = [];
  bossProgress = {defeated:{}, hp:{}, materials:{}, cooldownUntil:0, cooldowns:{}};
  isBossMenu = false;
  bossPrepIndexes = [];
  pvpPrepIndexes = [];
  partyPresets = {boss:[],pvp:[]};
  pendingPresetSaleId = "";
  pendingPresetSellAll = false;
  cloudRevision = 0;
  localSaveSeq = 0;
  cloudSyncedSeq = 0;
  bucketSortOrder = "등급";
  localStorage.setItem("textFishingBucketSortOrder", bucketSortOrder);
  localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
}

function syncCloudSoon(){
  if(!currentUser) return;
  localSaveSeq++;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveCloudData, 700);
}

function saveCloudData(){
  if(cloudSaveTimer !== null){
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  cloudSaveChain = cloudSaveChain.then(saveCloudDataNow, saveCloudDataNow);
  return cloudSaveChain;
}

async function saveCloudDataNow(){
  if(!currentUser) return;
  const userAtStart = currentUser;
  const saveSeq = localSaveSeq;
  const sessionHash = await getCurrentSessionHash();
  if(!sessionHash) return;

  try{
    const ref = db.collection("users").doc(userAtStart);
    const expectedRevision = cloudRevision;

    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if(!snap.exists) throw new Error("ACCOUNT_NOT_FOUND");

      const data = snap.data() || {};
      if(data.sessionTokenHash !== sessionHash) throw new Error("SESSION_INVALID");

      const serverRevision = Number(data.cloudRevision || 0);
      if(serverRevision !== expectedRevision) throw new Error("STALE_STATE");

      tx.set(ref, {
        nickname: userAtStart,
        money: normalizeMoney(money),
        rodLevel,
        title: getCurrentTitle(),
        cloudRevision: serverRevision + 1,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        gameState: getGameState()
      }, {merge:true});
    });

    if(currentUser === userAtStart){
      cloudRevision = expectedRevision + 1;
      cloudSyncedSeq = Math.max(cloudSyncedSeq, saveSeq);
    }
  }catch(e){
    console.error(e);
    if(e.message === "STALE_STATE"){
      await refreshMyCloudData(true);
      print("다른 탭이나 기기에서 더 최신 데이터가 확인되어 현재 화면을 새로 불러왔습니다.");
    }else if(e.message === "SESSION_INVALID"){
      cancelActiveFishing();
      stopServerAlertListener();
      stopOnlinePresence();
      currentUser = null;
      localStorage.removeItem("textFishingCurrentUser");
      clearUserSession();
      resetGameData();
      updateWallet();
      print("다른 곳에서 다시 로그인하여 현재 세션이 종료되었습니다. 다시 로그인해주세요.");
    }
  }
}

function hasPendingLocalCloudChanges(){
  return !!currentUser && localSaveSeq > cloudSyncedSeq;
}

async function refreshMyCloudData(force=false){
  if(!currentUser) return false;
  if(!force && hasPendingLocalCloudChanges()) return false;

  try{
    const snap = await db.collection("users").doc(currentUser).get();
    if(!snap.exists) return false;

    const data = snap.data();
    if(!(await hasValidSession(data))) throw new Error("SESSION_INVALID");
    applyGameState(data.gameState);
    cloudRevision = Number(data.cloudRevision || 0);
    cloudSyncedSeq = localSaveSeq;
    migrateCombatStatsToCurrentVersion();
    localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
    updateWallet();

    return true;
  }catch(e){
    console.error(e);
    if(e.message === "SESSION_INVALID"){
      cancelActiveFishing();
      stopServerAlertListener();
      stopOnlinePresence();
      currentUser = null;
      localStorage.removeItem("textFishingCurrentUser");
      clearUserSession();
      resetGameData();
      updateWallet();
      print("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
    }
    return false;
  }
}

async function removeRealtimeNotification(matchText){
  if(!currentUser || !matchText) return;

  try{
    const ref = db.collection("users").doc(currentUser);
    const sessionHash = await getCurrentSessionHash();
    let committedRevision = null;
    let committedState = null;

    await db.runTransaction(async (tx)=>{
      committedRevision = null;
      committedState = null;
      const snap = await tx.get(ref);
      if(!snap.exists) return;

      const data = snap.data();
      if(data.sessionTokenHash !== sessionHash) throw new Error("SESSION_INVALID");
      const state = data.gameState || {};
      const list = Array.isArray(state.notifications) ? state.notifications : [];

      const filtered = list.filter(msg => !String(msg).includes(matchText));
      if(filtered.length === list.length) return;

      committedState = {...state, notifications: filtered};
      tx.set(ref, {
        cloudRevision: Number(data.cloudRevision || 0) + 1,
        gameState: committedState,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
      committedRevision = Number(data.cloudRevision || 0) + 1;
    });

    if(committedRevision !== null) cloudRevision = committedRevision;
    if(committedRevision !== null) cloudSyncedSeq = localSaveSeq;
    if(committedState){
      applyGameState(committedState);
      migrateCombatStatsToCurrentVersion();
      localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
      updateWallet();
    }
  }catch(e){
    console.error(e);
  }
}

async function registerUser(){
  if(currentUser) return print("먼저 로그아웃한 뒤 새 계정을 만들어주세요.");
  if(!(await checkGameVersion())) return;
  const nickname = cleanNickname(prompt("닉네임을 입력하세요."));
  if(!nickname) return print("회원가입이 취소되었습니다.");

  const password = prompt("비밀번호를 입력하세요.");
  if(!password) return print("비밀번호를 입력해야 합니다.");

  try{
    const ref = db.collection("users").doc(nickname);
    const snap = await ref.get();

    if(snap.exists){
      return print("이미 사용 중인 닉네임입니다.");
    }

    const passwordHash = await hashPassword(password);
    const sessionTokenHash = await startUserSession(nickname);

    resetGameData();

    await db.runTransaction(async tx => {
      const latest = await tx.get(ref);
      if(latest.exists) throw new Error("NICKNAME_TAKEN");
      tx.set(ref, {
        nickname,
        passwordHash,
        sessionTokenHash,
        cloudRevision: 0,
        money: 0,
        rodLevel: 1,
        title: "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        gameState: getGameState()
      });
    });

    currentUser = nickname;
    localStorage.setItem("textFishingCurrentUser", currentUser);

    updateWallet();
    startServerAlertListener();
    startOnlinePresence();
    print(nickname + " 님 회원가입 완료.\n새 계정은 0원부터 시작합니다.");
  }catch(e){
    console.error(e);
    clearUserSession();
    if(e.message === "NICKNAME_TAKEN") print("이미 사용 중인 닉네임입니다.");
    else print("회원가입 중 오류가 발생했습니다.");
  }
}

async function loginUser(){
  if(currentUser) return print("다른 계정으로 로그인하려면 먼저 로그아웃해주세요.");
  if(!(await checkGameVersion())) return;
  const nickname = cleanNickname(prompt("닉네임을 입력하세요."));
  if(!nickname) return print("로그인이 취소되었습니다.");

  const password = prompt("비밀번호를 입력하세요.");
  if(!password) return print("비밀번호를 입력해야 합니다.");

  try{
    const ref = db.collection("users").doc(nickname);
    const snap = await ref.get();

    if(!snap.exists){
      return print("존재하지 않는 닉네임입니다.");
    }

    const data = snap.data();
    const passwordHash = await hashPassword(password);

    if(data.passwordHash !== passwordHash){
      return print("비밀번호가 틀렸습니다.");
    }

    const sessionTokenHash = await startUserSession(nickname);
    const nextRevision = Number(data.cloudRevision || 0) + 1;
    await ref.set({
      sessionTokenHash,
      cloudRevision: nextRevision,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});

    currentUser = nickname;
    localStorage.setItem("textFishingCurrentUser", currentUser);

    applyGameState(data.gameState);
    cloudRevision = nextRevision;
    cloudSyncedSeq = localSaveSeq;
    migrateCombatStatsToCurrentVersion();
    updateWallet();

    try{
      checkSpecialTitles();
      saveGame();
      updateWallet();
    }catch(e){
      console.error(e);
    }

    try{
      startServerAlertListener();
      startOnlinePresence();
    }catch(e){
      console.error(e);
    }

    print(nickname + " 님 로그인 완료.\n게임을 시작할 수 있습니다.");

    try{
      await showUpdateNoticeIfNeeded();
    }catch(e){
      console.error(e);
    }

    try{
      await showNewNotifications();
    }catch(e){
      console.error(e);
    }

    try{
      await showNewMessages();
    }catch(e){
      console.error(e);
    }
  }catch(e){
    console.error(e);
    clearUserSession();
    print("로그인 중 오류가 발생했습니다.");
  }
}

function logoutUser(){
  if(!currentUser) return print("로그인 상태가 아닙니다.");
  const old = currentUser;
  stopServerAlertListener();
  stopOnlinePresence();
  currentUser = null;
  localStorage.removeItem("textFishingCurrentUser");
  clearUserSession();
  resetGameData();
  updateWallet();
  print(old + " 님 로그아웃 완료.\n\n다른 계정을 사용하려면 로그인 또는 회원가입을 해주세요.");
}

async function deleteAccount(){
  if(!currentUser) return print("로그인 상태가 아닙니다.");

  const nickname = currentUser;
  const password = prompt("탈퇴하려면 비밀번호를 입력하세요.");
  if(!password) return print("탈퇴가 취소되었습니다.");

  const confirmText = prompt("정말 탈퇴하려면 닉네임을 다시 입력하세요.\n닉네임 : " + nickname);
  if(confirmText !== nickname) return print("닉네임이 일치하지 않아 탈퇴가 취소되었습니다.");

  try{
    const ref = db.collection("users").doc(nickname);
    const snap = await ref.get();

    if(!snap.exists){
      currentUser = null;
      localStorage.removeItem("textFishingCurrentUser");
      clearUserSession();
      resetGameData();
      updateWallet();
      return print("이미 삭제된 계정입니다.");
    }

    const data = snap.data();
    const passwordHash = await hashPassword(password);

    if(data.passwordHash !== passwordHash){
      return print("비밀번호가 틀렸습니다.");
    }

    await ref.delete();

    stopServerAlertListener();
    stopOnlinePresence();
    currentUser = null;
    localStorage.removeItem("textFishingCurrentUser");
    clearUserSession();
    resetGameData();
    updateWallet();

    print(nickname + " 계정이 탈퇴되었습니다.\n랭킹에서도 삭제됩니다.\n\n현재 기기의 게임 데이터도 초기화되었습니다.");
  }catch(e){
    console.error(e);
    print("탈퇴 중 오류가 발생했습니다.");
  }
}


function getUnreadUpdateNotices(){
  seenUpdateNoticeIds = normalizeUpdateNoticeIds(seenUpdateNoticeIds, "");
  return [];
}

function buildUpdateNoticeText(list){
  let s = UPDATE_NOTICE_TITLE + "\n\n";

  list.forEach((notice, noticeIndex)=>{
    s += "[" + notice.title + "]\n";
    s += "버전 : " + notice.id + "\n\n";
    s += "────┬────────────────────\n";

    notice.lines.forEach((line,i)=>{
      s += rankNumber(i+1) + "│" + line + "\n";
      if(i !== notice.lines.length - 1) s += "────┼────────────────────\n";
    });

    s += "────┴────────────────────";

    if(noticeIndex !== list.length - 1){
      s += "\n\n────────────────────\n\n";
    }
  });

  return s;
}

async function markUpdateNoticesRead(list){
  seenUpdateNoticeIds = normalizeUpdateNoticeIds(seenUpdateNoticeIds, "");

  list.forEach(n => {
    if(!seenUpdateNoticeIds.includes(n.id)) seenUpdateNoticeIds.push(n.id);
  });

  saveGame();
  if(currentUser) await saveCloudData();
}

async function showUpdateNoticeIfNeeded(){
  return;
}

function buildNotificationText(list){
  let s = "📢 알림\n\n";
  s += "────┬────────────────────\n";

  list.forEach((msg,i)=>{
    s += rankNumber(i+1) + "│" + msg + "\n";
    if(i !== list.length - 1) s += "────┼────────────────────\n";
  });

  s += "────┴────────────────────";
  return s;
}

async function showNewNotifications(){
  if(!notifications || notifications.length === 0) return;

  const list = [...notifications];

  printPreview(
    "📢 알림",
    "새로운 알림이 " + list.length + "개 도착했습니다.",
    "알림 전체보기",
    buildNotificationText(list)
  );

  notifications = [];
  saveGame();
  if(currentUser) await saveCloudData();
}

function rankNumber(n){
  return String(n).padStart(2, "0");
}

function buildRankSection(title, list, type){
  let s = "[" + title + "]\n";
  s += "────────────────────\n";

  if(list.length === 0){
    s += "등록된 유저가 없습니다.\n";
    s += "────────────────────\n";
    return s;
  }

  list.forEach((u,i)=>{
    if(type === "money"){
      s += rankNumber(i+1) + " | " + formatUserName(u.nickname, u.title) + " : " + formatMoney(u.money || 0) + "\n";
    } else {
      s += rankNumber(i+1) + " | " + formatUserName(u.nickname, u.title) + " : Lv." + (u.rodLevel || 1) + "\n";
    }

    s += "────────────────────\n";
  });

  return s;
}

async function showRanking(){
  try{
    if(currentUser) await saveCloudData();

    const moneySnap = await db.collection("users").orderBy("money","desc").get();
    const levelSnap = await db.collection("users").orderBy("rodLevel","desc").get();

    const moneyList = moneySnap.docs.map(d => d.data());
    const levelList = levelSnap.docs.map(d => d.data());

    const moneyFull = buildRankSection("지갑 랭킹", moneyList, "money").trim();
    const levelFull = buildRankSection("레벨 랭킹", levelList, "level").trim();

    const id1 = "btn_" + Math.random().toString(36).slice(2);
    const id2 = "btn_" + Math.random().toString(36).slice(2);

    const summary = "랭킹\n\n" +
      "등록된 유저 : " + Math.max(moneyList.length, levelList.length) + "명\n\n";

    appendLogHtml(summary);
    const b1 = document.createElement("button");
    const b2 = document.createElement("button");
    b1.className = b2.className = "openBtn";
    b1.id = id1;
    b2.id = id2;
    b1.textContent = "지갑 랭킹 전체보기";
    b2.textContent = "레벨 랭킹 전체보기";
    b1.addEventListener("click", () => openModal("지갑 랭킹", moneyFull));
    b2.addEventListener("click", () => openModal("레벨 랭킹", levelFull));
    log.append(b1, document.createTextNode("\n"), b2, document.createTextNode("\n\n"));
    updateWallet();
  }catch(e){
    console.error(e);
    print("랭킹을 불러오는 중 오류가 발생했습니다.\nFirestore 규칙 또는 네트워크 상태를 확인해주세요.");
  }
}

async function announceEternalCatch(fish){
  if(!currentUser || !["영원","공허"].includes(fish.grade)) return;

  try{
    await db.collection("serverAlerts").add({
      type: "eternalCatch",
      nickname: currentUser,
      title: getCurrentTitle(),
      fishName: fish.name,
      fishGrade: fish.grade,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAtMillis: Date.now()
    });
  }catch(e){
    console.error(e);
  }
}

function startServerAlertListener(){
  if(!currentUser) return;
  if(serverAlertUnsubscribe) serverAlertUnsubscribe();

  serverAlertStartTime = Date.now();

  serverAlertUnsubscribe = db.collection("serverAlerts")
    .orderBy("createdAtMillis", "desc")
    .limit(10)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if(change.type !== "added") return;

        const data = change.doc.data();
        if(!data || (data.createdAtMillis || 0) <= serverAlertStartTime) return;

        if(data.type === "eternalCatch"){
          if(data.nickname === currentUser) return;

          const sender = formatUserName(data.nickname, data.title);
          const fishName = displayFishName(data.fishName);

          print("📢 알림\n\n" + sender + " 님이 " + color(fishName, data.fishGrade || "영원") + objParticle(data.fishName) + " 낚았습니다.");
          return;
        }

        if(data.type === "moneyTransfer"){
          if(data.to !== currentUser) return;

          const sender = formatUserName(data.from, data.fromTitle);
          const amountText = Number(data.amount || 0).toLocaleString() + "원을 송금했습니다.";

          print("📢 알림\n\n" + sender + " 님이 " + amountText);
          removeRealtimeNotification(amountText);
          setTimeout(() => refreshMyCloudData(), 300);
          return;
        }

        if(data.type === "fishTransfer"){
          if(data.to !== currentUser) return;

          const sender = formatUserName(data.from, data.fromTitle);
          const fish = {
            grade: data.fishGrade,
            name: data.fishName,
            size: data.fishSize ?? null
          };
          const fishText = lineFish(fish) + objParticle(data.fishName) + " 전송했습니다.";

          print("📢 알림\n\n" + sender + " 님이 " + color(lineFish(fish), fish.grade) + objParticle(data.fishName) + " 전송했습니다.");
          removeRealtimeNotification(fishText);
          setTimeout(() => refreshMyCloudData(), 300);
          return;
        }


        if(data.type === "pvpRequest"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 신청\n\n" + sender + " 님이 대전을 신청했습니다.\n\n대전수락\n대전거절");
          return;
        }

        if(data.type === "pvpAccepted"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 수락\n\n" + sender + " 님이 대전을 수락했습니다.\n\n이제 대전준비 번호 로 물고기를 고르고 대전준비완료 를 입력하세요.");
          return;
        }

        if(data.type === "pvpReady"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 준비완료\n\n" + sender + " 님이 준비완료했습니다.");
          return;
        }

        if(data.type === "pvpCancelled"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          saveGame();
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 취소\n\n" + sender + " 님이 대전을 취소했습니다.");
          return;
        }

        if(data.type === "pvpRejected"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          saveGame();
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 거절\n\n" + sender + " 님이 대전 신청을 거절했습니다.");
          return;
        }

        if(data.type === "pvpResult"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          saveGame();
          printPvpResultPreview(data.summary || "대전 결과", data.fullLog || "상세 로그가 없습니다.");
          return;
        }

        if(data.type === "userMessage"){
          if(data.to !== currentUser) return;

          const sender = formatUserName(data.from, data.fromTitle);
          const body = safeMessageText(data.text);

          print(sender + " 님이 메세지를 보냈습니다.\n\n" + body);
          setTimeout(() => {
            refreshMyCloudData().then(() => {
              messages = (messages || []).filter(m => {
                if(data.messageId && m.id === data.messageId) return false;

                return !(
                  m.from === data.from &&
                  m.text === data.text &&
                  Math.abs((m.createdAtMillis || 0) - (data.createdAtMillis || 0)) < 5000
                );
              });
              saveGame();
            });
          }, 300);
          return;
        }
      });
    }, e => {
      console.error(e);
    });
}

function stopServerAlertListener(){
  if(serverAlertUnsubscribe){
    serverAlertUnsubscribe();
    serverAlertUnsubscribe = null;
  }
}


function fullWidthNumber(n,len=4){
  const fw=["０","１","２","３","４","５","６","７","８","９"];
  return String(n).padStart(len,"0").split("").map(x=>fw[Number(x)]).join("");
}
function normalizeMoney(n){
  n = Number(n || 0);
  if(!Number.isFinite(n)) return 0;
  if(Math.abs(n) <= Number.MAX_SAFE_INTEGER) return Math.floor(n);
  const quantum = Math.pow(2, Math.max(1, Math.floor(Math.log2(Math.abs(n))) - 52));
  return Math.round(n / quantum) * quantum;
}
function formatMoney(n){ return normalizeMoney(n).toLocaleString()+"원"; }
function formatSize(s){ return s === null ? "" : Number(s).toFixed(1); }

function hasBatchim(word){
  if(!word) return false;
  const text = String(word).trim();
  for(let i=text.length-1;i>=0;i--){
    const code = text.charCodeAt(i);
    if(code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 !== 0;
  }
  return false;
}

function objParticle(word){
  return hasBatchim(word) ? "을" : "를";
}

function subjectParticle(word){
  return hasBatchim(word) ? "이" : "가";
}

function objectText(word){
  return String(word || "") + objParticle(word);
}

function subjectText(word){
  return String(word || "") + subjectParticle(word);
}

const battleDisplayNumbers = new WeakMap();
let activePvpFishLabeler = null;

function setBattleDisplayNumbers(fishes){
  const counts = {};
  (fishes || []).forEach(f => {
    if(f && f.name) counts[f.name] = (counts[f.name] || 0) + 1;
  });
  const seen = {};
  (fishes || []).forEach(f => {
    if(!f || !f.name) return;
    if(counts[f.name] > 1){
      seen[f.name] = (seen[f.name] || 0) + 1;
      battleDisplayNumbers.set(f, seen[f.name]);
    } else {
      battleDisplayNumbers.delete(f);
    }
  });
}

function clearBattleDisplayNumbers(fishes){
  (fishes || []).forEach(f => {
    if(f) battleDisplayNumbers.delete(f);
  });
}


const specialFishEmoji = {
  "호수에 비친 은하수":"🌌",
  "호수에 비친 별":"⭐",
  "호수에 비친 달":"🌙",
  "바다를 삼킨 태양":"☀️",
  "휘몰아치는 마음":"🌪️",
  "영롱한 다이아몬드":"💎",
  "얼어붙은 마음":"🧊",
  "빛나는 마음":"✨",
  "불타는 마음":"🔥",
  "무한한 시간":"♾️",
  "잃어버린 첫 번째 편지 조각 ✉️":"✉️",
  "잃어버린 두 번째 편지 조각 ✉️":"✉️",
  "잃어버린 세 번째 편지 조각 ✉️":"✉️"
};

function displayFishName(name){
  return specialFishEmoji[name] && !String(name).includes(specialFishEmoji[name]) ? name + " " + specialFishEmoji[name] : name;
}


function lineFish(f){
  const name = displayFishName(f.name);
  const suffix = battleDisplayNumbers.has(f) ? " (" + battleDisplayNumbers.get(f) + ")" : "";
  if(f.size === null) return `[${f.grade}] ${name}${suffix}`;
  return `[${f.grade}] ${name}(${formatSize(f.size)}cm)${suffix}`;
}

function color(text,grade){
  const g=grades.find(x=>x.name===grade);
  return `<span style="color:${g?g.color:'#e6edf3'}">${text}</span>`;
}

function fishSubjectLabel(f){
  return color(lineFish(f),f.grade) + subjectParticle(lineFish(f));
}

function fishObjectLabel(f){
  return color(lineFish(f),f.grade) + objParticle(lineFish(f));
}

function escapeHtml(text){
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function sanitizeGameHtml(value){
  const template = document.createElement("template");
  template.innerHTML = String(value ?? "");
  const allowedTags = new Set(["SPAN", "B", "BR"]);

  [...template.content.querySelectorAll("*")].reverse().forEach(el => {
    if(!allowedTags.has(el.tagName)){
      el.replaceWith(document.createTextNode(el.textContent || ""));
      return;
    }

    [...el.attributes].forEach(attr => {
      const isSafeColor = el.tagName === "SPAN" && attr.name === "style" &&
        /^color:\s*#[0-9a-fA-F]{3,8}\s*;?$/.test(attr.value);
      if(!isSafeColor) el.removeAttribute(attr.name);
    });
  });

  return template.innerHTML;
}
function appendLogHtml(value){
  log.insertAdjacentHTML("beforeend", sanitizeGameHtml(value));
  log.scrollTop=log.scrollHeight;
}
function print(t){
  appendLogHtml(String(t ?? "")+"\n\n");
  updateWallet();
}

function openModal(title, content){
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = sanitizeGameHtml(content);
  document.getElementById("modalOverlay").style.display = "block";
}
function closeModal(){
  document.getElementById("modalOverlay").style.display = "none";
}
function printPreview(title, summary, buttonText, modalContent){
  const id = "btn_" + Math.random().toString(36).slice(2);
  appendLogHtml(title + "\n\n" + summary + "\n\n");
  const btn = document.createElement("button");
  btn.className = "openBtn";
  btn.id = id;
  btn.textContent = buttonText;
  btn.addEventListener("click", () => openModal(title, modalContent));
  log.append(btn, document.createTextNode("\n\n"));
  updateWallet();
}
function printWalletPreview(title, buttonText, modalContent){
  const id = "btn_" + Math.random().toString(36).slice(2);
  appendLogHtml(title + "\n\n");
  const btn = document.createElement("button");
  btn.className = "openBtn";
  btn.id = id;
  btn.textContent = buttonText;
  btn.addEventListener("click", () => openModal(title, modalContent));
  log.append(btn, document.createTextNode("\n\n"));
  updateWallet();
}
function printSimplePreview(title, summary, buttonText, modalContent){
  const id = "btn_" + Math.random().toString(36).slice(2);
  appendLogHtml(title + "\n\n" + summary + "\n\n");
  const btn = document.createElement("button");
  btn.className = "openBtn";
  btn.id = id;
  btn.textContent = buttonText;
  btn.addEventListener("click", () => openModal(title, modalContent));
  log.append(btn, document.createTextNode("\n\n"));
  updateWallet();
}

function formatDateTime(ms){
  const d = new Date(ms || Date.now());
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const h = String(d.getHours()).padStart(2,"0");
  const min = String(d.getMinutes()).padStart(2,"0");
  return y + "-" + m + "-" + day + " " + h + ":" + min;
}

function safeMessageText(text){
  return String(text || "").replace(/[<>]/g, "");
}
function allFishCount(){
  return Object.values(fishByGrade).reduce((a,b)=>a+b.length,0);
}


function getMarketHour(){
  return Math.floor(getTrustedNowMs() / (1000 * 60 * 10));
}

function getTrustedNowMs(){
  if(hasServerTime && typeof performance !== "undefined"){
    return serverTimeAtSync + Math.max(0, performance.now() - monotonicAtSync);
  }
  return Date.now() + (hasServerTime ? serverTimeOffsetMs : 0);
}

function getMarketTargets(){
  const targetGrades = ["전설","신화","초월","영원"];
  return targetGrades.flatMap(g => fishByGrade[g].map(name => ({name, grade:g})));
}

function getFishGradeByName(name){
  for(const grade of Object.keys(fishByGrade)){
    if(fishByGrade[grade].includes(name)) return grade;
  }
  return "";
}

function seededRandom(seed){
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function seededShuffle(list, seed){
  const arr = [...list];

  for(let i = arr.length - 1; i > 0; i--){
    const r = seededRandom(seed + i * 97);
    const j = Math.floor(r * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }

  return arr;
}

function buildExpectedMarketRates(hour){
  const selected = seededShuffle(getMarketTargets(), hour).slice(0, 10);
  const bonusOptions = [20, 50, 100, 200];
  const expected = {};
  selected.forEach((x, i) => {
    const bonusIndex = Math.floor(seededRandom(hour * 31 + i * 17) * bonusOptions.length);
    expected[x.name] = bonusOptions[bonusIndex];
  });
  return expected;
}

function marketRatesMatchExpected(actual, expected){
  const a = Object.keys(actual || {}).sort();
  const b = Object.keys(expected || {}).sort();
  return a.length === b.length && a.every((name,i) => name === b[i] && actual[name] === expected[name]);
}

function refreshMarketIfNeeded(){
  const nowHour = getMarketHour();
  const expected = buildExpectedMarketRates(nowHour);

  // 저장값을 그대로 신뢰하지 않고 현재 구간의 정상 시세와 대조한다.
  if(marketHour === nowHour && marketRatesMatchExpected(marketRates, expected)) return;

  marketRates = expected;
  marketHour = nowHour;
  saveGame();
}

function getMarketBonus(name){
  refreshMarketIfNeeded();
  return marketRates[name] || 0;
}

function applyMarketPrice(f){
  const marketBonus = getMarketBonus(f.name);
  const appraisalBonus = Math.round((getAppraisalMultiplier() - 1) * 100);

  return Math.floor(
    f.price * (1 + (marketBonus + appraisalBonus) / 100)
  );
}

function getNextMarketMinutes(){
  const serverNow = getTrustedNowMs();
  const next = (getMarketHour() + 1) * 1000 * 60 * 10;
  return Math.max(0, Math.ceil((next - serverNow) / (1000 * 60)));
}

function buildMarketText(){
  refreshMarketIfNeeded();

  let s = "현재 시세\n\n";
  const entries = Object.entries(marketRates);

  if(entries.length === 0){
    s += "현재 적용 중인 시세가 없습니다.\n";
  } else {
    const marketGradeOrder = {"영원":0,"초월":1,"신화":2,"전설":3};

    entries.sort((a,b)=>{
      const gradeA = getFishGradeByName(a[0]);
      const gradeB = getFishGradeByName(b[0]);

      return (marketGradeOrder[gradeA] ?? 99) - (marketGradeOrder[gradeB] ?? 99)
        || b[1] - a[1]
        || a[0].localeCompare(b[0],"ko");
    });

    s += "────┬────────────────────\n";

    entries.forEach(([name, bonus], i)=>{
      const grade = getFishGradeByName(name);
      const discovered = !!collection[name];

      const shownGrade = discovered ? grade : "???";
      const shownName = discovered ? displayFishName(name) : "???";
      const line = "[" + shownGrade + "] " + shownName + " +" + bonus + "%";

      s += fullWidthNumber(i+1) + "│" + color(line, discovered ? grade : "") + "\n";

      if(i !== entries.length - 1){
        s += "────┼────────────────────\n";
      }
    });

    s += "────┴────────────────────";
  }

  s += "\n\n다음 갱신까지 : 약 " + getNextMarketMinutes() + "분";
  return s;
}

async function showMarket(){
  if(currentUser) await updateOnlinePresence();
  refreshMarketIfNeeded();
  printPreview("시세", "현재 시세 대상 : " + Object.keys(marketRates).length + "종\n다음 갱신까지 : 약 " + getNextMarketMinutes() + "분", "시세 전체보기", buildMarketText());
}

const achievementList = [
  {name:"환경 지킴이", desc:"쓰레기 500개 수집", reward:100000000000, check:()=> (gradeCounts["쓰레기"]||0) >= 500},

  {name:"수집가", desc:"도감 25% 달성", reward:200000000, check:()=> Object.keys(collection).length / allFishCount() >= 0.25},
  {name:"탐험가", desc:"도감 50% 달성", reward:2000000000, check:()=> Object.keys(collection).length / allFishCount() >= 0.50},
  {name:"개척자", desc:"도감 75% 달성", reward:100000000000, check:()=> Object.keys(collection).length / allFishCount() >= 0.75},
  {name:"정복자", desc:"도감 100% 달성", reward:2000000000000, check:()=> Object.keys(collection).length >= allFishCount()},

  {name:"전설", desc:"전설 등급 50마리 수집", reward:200000000, check:()=> (gradeCounts["전설"]||0) >= 50},
  {name:"신화", desc:"신화 등급 50마리 수집", reward:2000000000, check:()=> (gradeCounts["신화"]||0) >= 50},
  {name:"초월자", desc:"초월 등급 50마리 수집", reward:100000000000, check:()=> (gradeCounts["초월"]||0) >= 50},
  {name:"불멸", desc:"영원 등급 50마리 수집", reward:2000000000000, check:()=> (gradeCounts["영원"]||0) >= 50},
  {name:"공허", desc:"공허 등급 1개 수집", reward:5000000000000, check:()=> (gradeCounts["공허"]||0) >= 1},

  {name:"초보", desc:"10회 낚시", reward:200000, check:()=> totalFishingCount >= 10},
  {name:"베테랑", desc:"100회 낚시", reward:20000000, check:()=> totalFishingCount >= 100},
  {name:"중독자", desc:"1,000회 낚시", reward:20000000000, check:()=> totalFishingCount >= 1000},
  {name:"거장", desc:"10,000회 낚시", reward:2000000000000, check:()=> totalFishingCount >= 10000},

  {name:"천 번의 담금질", desc:"낚싯대 Lv.1000 달성", reward:0, check:()=> rodLevel >= 1000},
  {name:"행운아", desc:"영원 등급 1마리 수집", reward:7777777, check:()=> (gradeCounts["영원"]||0) >= 1},
  {name:"드래곤 헌터", desc:"용 계열 9종 도감 등록", reward:10000000000, check:()=> {
    const dragons = [
      "핏빛 초승달 드래곤",
      "잿빛 밤하늘 드래곤",
      "금빛 보름달 드래곤",
      "푸른 눈의 백염룡",
      "이무기",
      "청룡",
      "흑룡",
      "황룡",
      "해신룡"
    ];
    return dragons.every(x => collection[x]);
  }}
];

function updateSpecialTitles(){
  const newly = [];

  const specialTitleList = [
    {name:"부자", check:()=> money >= 10000000000000},
    {name:"재벌", check:()=> money >= 100000000000000}
  ];

  for(const t of specialTitleList){
    if(t.check() && !unlockedTitles.includes(t.name)){
      unlockedTitles.push(t.name);
      newly.push(t.name);
    }
  }

  return newly;
}

function printTitleUnlocks(list){
  if(!list || list.length === 0) return;

  for(const title of list){
    const msg = "칭호 획득!\n\n[" + title + "] 칭호를 획득했습니다.";

    if(!notifications.includes(msg)){
      notifications.push(msg);
    }
  }
}

function checkSpecialTitles(){
  const newSpecialTitles = updateSpecialTitles();
  printTitleUnlocks(newSpecialTitles);
  return newSpecialTitles;
}

function updateAchievements(){
  const newly = [];

  for(const a of achievementList){
    if(a.check() && !completedAchievements.includes(a.name)){
      completedAchievements.push(a.name);
      money = normalizeMoney(money + a.reward);
      totalEarned = normalizeMoney(totalEarned + a.reward);
      newly.push(a);
    }
  }

  return newly;
}

function getCurrentCompletedAchievements(){
  const valid = new Set(achievementList.map(a => a.name));
  return completedAchievements.filter(name => valid.has(name));
}

function buildAchievementText(){
  const currentCompleted = getCurrentCompletedAchievements();
  let s = "업적\n\n";
  s += "달성률 : " + currentCompleted.length + " / " + achievementList.length + "\n\n";

  achievementList.forEach((a,i)=>{
    const done = currentCompleted.includes(a.name);
    s += fullWidthNumber(i+1) + "│" + (done ? "[달성] " : "[미달성] ") + a.name + "\n";
    s += "    조건 : " + a.desc + "\n";
    s += "    보상 : " + formatMoney(a.reward) + (done ? " [수령 완료]" : "") + "\n\n";
  });

  return s;
}

function showAchievements(){
  const newly = updateAchievements();
  const newSpecialTitles = checkSpecialTitles();
  if(newly.length > 0 || newSpecialTitles.length > 0) saveGame();
  const currentCompleted = getCurrentCompletedAchievements();

  const summary =
    "업적 달성률 : " + currentCompleted.length + " / " + achievementList.length + "\n\n" +
    "달성한 업적은 자동으로 보상이 지급됩니다.";

  printPreview("업적", summary, "업적 전체보기", buildAchievementText());
}

function printAchievementRewards(list){
  if(!list || list.length === 0) return;

  let s = "업적 달성!\n\n";
  for(const a of list){
    s += "[" + a.name + "]\n";
    s += "보상 : " + formatMoney(a.reward) + "\n\n";
  }

  print(s.trim());
}

function getOwnedTitles(){
  const order = [
    "환경 지킴이",
    "수집가",
    "탐험가",
    "개척자",
    "정복자",
    "전설",
    "신화",
    "초월자",
    "불멸",
    "공허",
    "초보",
    "베테랑",
    "중독자",
    "거장",
    "천 번의 담금질",
    "행운아",
    "드래곤 헌터",
    "부자",
    "재벌"
  ];

  const ownedSet = new Set();

  completedAchievements.forEach(title => ownedSet.add(title));
  unlockedTitles.forEach(title => ownedSet.add(title));

  return order.filter(title => ownedSet.has(title));
}

function getCurrentTitle(){
  return equippedTitle && getOwnedTitles().includes(equippedTitle) ? equippedTitle : "";
}

function formatUserName(nickname, title){
  return title ? "[" + title + "] " + nickname : nickname;
}

function formatCurrentUserName(){
  return formatUserName(currentUser, getCurrentTitle());
}

function buildTitleText(){
  const owned = getOwnedTitles();
  let s = "칭호\n\n";
  s += "현재 칭호 : " + (getCurrentTitle() || "없음") + "\n\n";

  if(owned.length === 0){
    s += "보유한 칭호가 없습니다.\n";
    return s;
  }

  s += "────┬────────────────────\n";
  owned.forEach((title,i)=>{
    s += rankNumber(i+1) + "│" + title + (getCurrentTitle() === title ? " [장착중]" : "") + "\n";
    if(i !== owned.length - 1) s += "────┼────────────────────\n";
  });
  s += "────┴────────────────────";
  return s;
}

function showTitles(){
  const owned = getOwnedTitles();
  const summary =
    "현재 칭호 : " + (getCurrentTitle() || "없음") + "\n" +
    "보유 칭호 : " + owned.length + "개";

  printPreview("칭호", summary, "칭호 전체보기", buildTitleText());
}

function equipTitle(n){
  const owned = getOwnedTitles();
  const idx = Number(n) - 1;

  if(idx < 0 || !owned[idx]) return print("존재하지 않는 칭호 번호입니다.");

  equippedTitle = owned[idx];
  saveGame();

  print("칭호가 " + equippedTitle + "로 변경되었습니다.");
}

function unequipTitle(){
  if(!getCurrentTitle()) return print("장착 중인 칭호가 없습니다.");

  equippedTitle = "";
  saveGame();

  print("칭호가 해제되었습니다.");
}

function saveGame(){
  localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify({money,totalEarned,rodLevel,bucket,collection,ranking,totalFishingCount,gradeCounts,completedAchievements,marketHour,marketRates,notifications,messages,researchLevels,trainingLevels,unlockedTitles,equippedTitle,seenUpdateNoticeIds,bossProgress,pvpPrepIndexes,partyPresets}));
  syncCloudSoon();
}
function loadGame(){
  const raw=localStorage.getItem("textFishingSpeciesSizeSave");
  if(!raw) return;
  try {
    const s=JSON.parse(raw);
    money=normalizeMoney(s.money??0); totalEarned=normalizeMoney(s.totalEarned??0); rodLevel=s.rodLevel??1;
    bucket=s.bucket??[]; collection=s.collection??{}; ranking=s.ranking??[];
    totalFishingCount=s.totalFishingCount??0;
    gradeCounts=s.gradeCounts??{};
    completedAchievements=normalizeLegacyTitleList(s.completedAchievements??s.removedUnlockedTitles??[]);

    marketHour=s.marketHour??null;
    marketRates=s.marketRates??{};
    notifications=Array.isArray(s.notifications)?s.notifications:[];
    messages=Array.isArray(s.messages)?s.messages:[];
    researchLevels=normalizeResearchLevels(s.researchLevels);
    trainingLevels=normalizeTrainingLevels(s.trainingLevels);
    unlockedTitles=normalizeLegacyTitleList(s.unlockedTitles);
    equippedTitle=normalizeLegacyTitleName(s.equippedTitle??"");
    seenUpdateNoticeIds=normalizeUpdateNoticeIds(s.seenUpdateNoticeIds, s.lastSeenUpdateVersion);
    bossProgress=normalizeBossProgress(s.bossProgress);
    pvpPrepIndexes=Array.isArray(s.pvpPrepIndexes)?s.pvpPrepIndexes:[];
    partyPresets=normalizePartyPresets(s.partyPresets);
    ensureAllFishIds();
  } catch(e) {}
}
const MAX_RESEARCH = 10;
const researchCostTable = [
  100000000,
  300000000,
  1000000000,
  3000000000,
  10000000000,
  30000000000,
  100000000000,
  300000000000,
  1000000000000,
  3000000000000
];

function getResearchCost(level){
  if(level >= MAX_RESEARCH) return null;
  return researchCostTable[level] || researchCostTable[researchCostTable.length - 1];
}

function getFishingResearchLevel(){
  return Math.min(MAX_RESEARCH, researchLevels.fishing || 0);
}

function getAppraisalResearchLevel(){
  return Math.min(MAX_RESEARCH, researchLevels.appraisal || 0);
}

function getFishingTimeReduction(){
  return getFishingResearchLevel() * 5;
}

function getFishingTimeMultiplier(){
  return Math.max(0.5, 1 - getFishingResearchLevel() * 0.05);
}

function getAppraisalBonus(){
  return getAppraisalResearchLevel() * 10;
}

function getAppraisalMultiplier(){
  return 1 + getAppraisalResearchLevel() * 0.10;
}

function buildResearchLine(num, name, level, effectText){
  const maxed = level >= MAX_RESEARCH;
  let s = fullWidthNumber(num) + "│" + name + " Lv." + level + (maxed ? " [MAX]" : "") + "\n";
  s += "    효과 : " + effectText + "\n";
  s += "    비용 : " + (maxed ? "최대 레벨" : formatMoney(getResearchCost(level)));
  return s;
}

function buildResearchText(){
  const fishingLevel = getFishingResearchLevel();
  const appraisalLevel = getAppraisalResearchLevel();

  let s = "연구소\n\n";
  s += "────┬────────────────────\n";
  s += buildResearchLine(1, "낚시 기술 연구", fishingLevel, "낚시시간 -" + getFishingTimeReduction() + "%") + "\n";
  s += "────┼────────────────────\n";
  s += buildResearchLine(2, "감정 연구", appraisalLevel, "판매가 +" + getAppraisalBonus() + "%") + "\n";
  s += "────┴────────────────────\n\n";
  s += "명령어 : 연구소1 강화 / 연구소2 강화";
  return s;
}

function showResearchLab(){
  print(buildResearchText());
}

function upgradeResearch(which){
  let key = "";
  let name = "";

  if(which === 1){
    key = "fishing";
    name = "낚시 기술 연구";
  } else if(which === 2){
    key = "appraisal";
    name = "감정 연구";
  } else {
    return print("사용법 : 연구소1 강화 / 연구소2 강화");
  }

  const level = Math.min(MAX_RESEARCH, researchLevels[key] || 0);

  if(level >= MAX_RESEARCH){
    return print(name + "는 이미 최대 레벨입니다.\nLv." + MAX_RESEARCH + " [MAX]");
  }

  const cost = getResearchCost(level);

  if(money < cost){
    return print("돈이 부족합니다.\n연구 비용 : " + formatMoney(cost));
  }

  money = normalizeMoney(money - cost);
  researchLevels[key] = level + 1;
  saveGame();

  let effect = "";
  if(key === "fishing"){
    effect = "낚시시간 -" + getFishingTimeReduction() + "%";
  } else {
    effect = "판매가 +" + getAppraisalBonus() + "%";
  }

  print(name + " 강화 완료\n\nLv." + level + " → Lv." + researchLevels[key] + "\n효과 : " + effect + "\n사용 금액 : " + formatMoney(cost));
}

const MAX_TRAINING = 15;
const trainingCostTable = [
  100000000, 300000000, 1000000000, 3000000000, 10000000000,
  30000000000, 100000000000, 300000000000, 1000000000000, 3000000000000,
  5000000000000, 10000000000000, 25000000000000, 50000000000000, 100000000000000
];

function getTrainingLevel(key){
  trainingLevels = normalizeTrainingLevels(trainingLevels);
  return Math.min(MAX_TRAINING, Math.max(0, Number(trainingLevels[key] || 0)));
}

function getTrainingCost(level){
  if(level >= MAX_TRAINING) return null;
  return trainingCostTable[level];
}

function getProgressiveTrainingBonus(level){
  level = Math.min(MAX_TRAINING, Math.max(0, Number(level || 0)));
  const first = Math.min(level, 5) * 20;
  const middle = Math.min(Math.max(level - 5, 0), 5) * 50;
  const final = Math.min(Math.max(level - 10, 0), 5) * 100;
  return first + middle + final;
}

function getTrainingAttackBonus(){
  return getProgressiveTrainingBonus(getTrainingLevel("attack"));
}

function getTrainingHpBonus(){
  return getProgressiveTrainingBonus(getTrainingLevel("hp"));
}

function getTrainingCritDamageBonus(){
  return getProgressiveTrainingBonus(getTrainingLevel("critDamage"));
}

function buildTrainingLine(num, name, level, effectText){
  const maxed = level >= MAX_TRAINING;
  let s = fullWidthNumber(num) + "│" + name + " Lv." + level + (maxed ? " [MAX]" : "") + "\n";
  s += "    효과 : " + effectText + "\n";
  s += "    비용 : " + (maxed ? "최대 레벨" : formatMoney(getTrainingCost(level)));
  return s;
}

function buildTrainingText(){
  const attackLevel = getTrainingLevel("attack");
  const hpLevel = getTrainingLevel("hp");
  const critDamageLevel = getTrainingLevel("critDamage");

  let s = "훈련소\n\n";
  s += "별 시스템과 별개로 모든 전투 물고기에 적용됩니다.\n";
  s += "해금 조건 없이 골드만 사용합니다.\n\n";
  s += "────┬────────────────────\n";
  s += buildTrainingLine(1, "공격 훈련", attackLevel, "공격력 +" + getTrainingAttackBonus() + "%") + "\n";
  s += "────┼────────────────────\n";
  s += buildTrainingLine(2, "체력 훈련", hpLevel, "체력 +" + getTrainingHpBonus() + "%") + "\n";
  s += "────┼────────────────────\n";
  s += buildTrainingLine(3, "치명타 피해 훈련", critDamageLevel, "치명타 피해 +" + getTrainingCritDamageBonus() + "%") + "\n";
  s += "────┴────────────────────\n\n";
  s += "명령어 : 훈련소1 강화 / 훈련소2 강화 / 훈련소3 강화";
  return s;
}

function showTrainingLab(){
  print(buildTrainingText());
}

function upgradeTraining(which){
  const map = {
    1:["attack", "공격 훈련"],
    2:["hp", "체력 훈련"],
    3:["critDamage", "치명타 피해 훈련"]
  };

  const data = map[which];
  if(!data) return print("사용법 : 훈련소1 강화 / 훈련소2 강화 / 훈련소3 강화");

  const key = data[0];
  const name = data[1];
  const level = getTrainingLevel(key);

  if(level >= MAX_TRAINING){
    return print(name + "는 이미 최대 레벨입니다.\nLv." + MAX_TRAINING + " [MAX]");
  }

  const cost = getTrainingCost(level);

  if(money < cost){
    return print("돈이 부족합니다.\n훈련 비용 : " + formatMoney(cost));
  }

  money = normalizeMoney(money - cost);
  trainingLevels[key] = level + 1;

  // 모든 훈련 효과를 기존 물고기에도 즉시 반영합니다.
  bucket.forEach(f => {
    if(f && f.combat){
      if(key === "hp") delete f.combat._trainingHpLevel;
      applyTrainingBonusesToCombat(f.combat);
    }
  });

  saveGame();

  let effect = "";
  if(key === "attack") effect = "공격력 +" + getTrainingAttackBonus() + "%";
  else if(key === "hp") effect = "체력 +" + getTrainingHpBonus() + "%";
  else effect = "치명타 피해 +" + getTrainingCritDamageBonus() + "%";

  print(name + " 강화 완료\n\nLv." + level + " → Lv." + trainingLevels[key] + "\n효과 : " + effect + "\n사용 금액 : " + formatMoney(cost));
}

function applyTrainingBonusesToCombat(c){
  if(!c) return c;
  if(c.status === "전투 불가") return c;

  if(c._baseAttack === undefined) c._baseAttack = Number(c.attack || 0);
  if(c._baseMaxHp === undefined) c._baseMaxHp = Number(c.maxHp || c.hp || 1);
  if(c._baseCritDamage === undefined) c._baseCritDamage = Number(c.critDamage || 0);

  const attackLevel = getTrainingLevel("attack");
  const hpLevel = getTrainingLevel("hp");
  const critDamageLevel = getTrainingLevel("critDamage");

  c.attack = Math.floor(c._baseAttack * (1 + getProgressiveTrainingBonus(attackLevel) / 100));

  const oldMaxHp = Math.max(1, Number(c.maxHp || c._baseMaxHp || 1));
  const newMaxHp = Math.max(1, Math.floor(c._baseMaxHp * (1 + getProgressiveTrainingBonus(hpLevel) / 100)));

  if(c._trainingHpLevel !== hpLevel || c.maxHp !== newMaxHp){
    const hpRatio = oldMaxHp > 0 ? clamp(Number(c.hp || oldMaxHp) / oldMaxHp, 0, 1) : 1;
    c.maxHp = newMaxHp;
    if(c.status === "정상") c.hp = newMaxHp;
    else c.hp = Math.max(1, Math.min(newMaxHp, Math.floor(newMaxHp * hpRatio)));
    c._trainingHpLevel = hpLevel;
  } else {
    c.maxHp = newMaxHp;
  }

  c.critDamage = Math.floor(c._baseCritDamage + getProgressiveTrainingBonus(critDamageLevel));

  return c;
}





