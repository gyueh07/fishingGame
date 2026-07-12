let money=0, totalEarned=0, rodLevel=1, bucket=[], collection={}, ranking=[], isFishing=false;
let totalFishingCount=0, dailyFishing={date:"",count:0}, gradeCounts={}, completedAchievements=[];
let marketHour=null, marketRates={};
let serverTimeOffsetMs=0, hasServerTime=false, serverTimeAtSync=0, monotonicAtSync=0;
let notifications=[];
let messages=[];
let researchLevels={fishing:0, appraisal:0};
let trainingLevels={attack:0,hp:0,critDamage:0};
let unlockedTitles=[];
let equippedTitle="";
let profileCosmetics={border:"",aura:"",background:"",attackEffect:""};
let battleHistory={boss:[],pvp:[]};
let seenUpdateNoticeIds=[];
let bossProgress={defeated:{},difficultyClears:{},hp:{},materials:{},selectedDifficulty:"normal",cooldownUntil:0,cooldowns:{}};
let isBossMenu=false;
let bossPrepIndexes=[];
let pendingRecoveryBattleConfirm=false;
let pvpPrepIndexes=[];
let partyPresets={boss:[],pvp:[]};
let fusionMainFishId="";
let fusionMainFishIds={};
let pendingPresetSaleId="";
let pendingPresetSellAll=false;
let onlinePresenceTimer=null;
let fishingTimer=null;
let fishingSessionId=0;
let isLoginPostProcessing=false;
let startupEmergencySnapshot=null;
let emergencyRestoreRunning=false;
let cloudRevision=0;
let cloudSaveChain=Promise.resolve();
let accountSessionHeartbeatTimer=null;
let accountSessionUnsubscribe=null;

const log = document.getElementById("log");
const input = document.getElementById("command");
const GAME_VERSION = "2026-07-12-fishinglife-season-reset-v24-9";
const USER_WRITE_SCHEMA_VERSION = 249;
const USER_WRITE_PROTOCOL_VERSION = 3;
const ACCOUNT_RESET_VERSION = 1;
const ACCOUNT_SESSION_TTL_MS = 90000;
const ACCOUNT_SESSION_HEARTBEAT_MS = 20000;
const ACCOUNT_BACKUP_SLOT_COUNT = 3;
const GAME_VERSION_CHECK_TTL_MS = 5*60*1000;
const MAX_SAFE_GAME_STATE_BYTES = 850000;
const UPDATE_NOTICE_TITLE = "📢 업데이트 안내";
const UPDATE_NOTICES = [
  {
    id:"2026-07-12-fishinglife-write-guard-24-8",
    title:"구버전 덮어쓰기 차단·계정 안전 백업",
    lines:[
      "v24.8 전용 서버 쓰기 표식이 없는 예전 게임 파일은 Firebase 계정 데이터를 변경할 수 없습니다.",
      "낚싯대 레벨·총 낚시 횟수·누적 수익이 이전 서버 기록보다 낮아지는 저장은 자동으로 중단됩니다.",
      "사용자별 최근 서버 기록은 하루 첫 저장과 전체 복구 직전에 3개 순환 슬롯으로 보존됩니다.",
      "Firebase의 최소 저장 버전을 서버에서 확인하기 전에는 로그인·회원가입·자동저장을 시작하지 않습니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-emergency-recovery-24-7",
    title:"브라우저 전체 계정 긴급 복구",
    lines:[
      "Firebase를 불러오기 전에 현재 브라우저에 남은 물고기·지갑·레벨·진행도 전체를 메모리에 보존합니다.",
      "서버 데이터와 이 기기 데이터를 비교한 뒤 사용자가 선택한 경우에만 Firebase 전체 복구를 실행합니다.",
      "복구 계정이 일치하지 않거나 저장이 완료되지 않으면 후보 데이터를 폐기하지 않습니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-account-integrity-24-6",
    title:"계정 진행도 보호·오늘의 항해",
    lines:[
      "같은 아이디 로그인만으로 레벨과 기존 진행도가 바뀌지 않도록 서버 데이터를 기준으로 불러옵니다.",
      "실제로 저장되지 않은 변경이 표시된 기기에서만 복구 병합을 실행합니다.",
      "레벨·연구·훈련·업적·보스 클리어는 충돌 상황에서도 낮은 값으로 돌아가지 않습니다.",
      "오늘의 항해에는 누적 횟수 대신 오늘 0시 이후 낚시 시도 횟수만 표시됩니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-mobile-login-24-5",
    title:"모바일 빠른 로그인·자동 로그인창",
    lines:[
      "로그아웃 상태로 접속하면 게임형 로그인창이 즉시 열립니다.",
      "로그인 시 Firebase 계정 조회를 한 번으로 줄이고 진행 상태를 바로 표시합니다.",
      "물고기 전투 데이터 보정은 작은 묶음으로 나누어 처리하여 모바일 화면이 멈추지 않습니다.",
      "로그인 화면을 먼저 연 뒤 받은 소식과 후속 동기화를 백그라운드에서 처리합니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-cloud-save-boss-scene-24-4",
    title:"Firebase 안전 저장·보스 공격 배경 연출",
    lines:[
      "낚은 직후 Firebase 저장 상태를 표시하고, 네트워크 오류가 나면 데이터를 유지한 채 자동으로 다시 저장합니다.",
      "서버 버전 충돌과 송금·물고기 전송 알림이 저장되지 않은 양동이를 덮어쓰지 않도록 로컬·서버 데이터를 병합합니다.",
      "같은 계정은 기기별 로그인 세션을 유지하여 다른 기기 로그인 때문에 진행 중인 저장이 취소되지 않습니다.",
      "보스가 공격하거나 스킬을 사용할 때 속성에 맞는 전투 배경이 잠시 펼쳐집니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-combat-readability-ranking-24-3",
    title:"전투 가독성·게임 알림·랭킹 UI 수정",
    lines:[
      "1대1 전투에서 PVP_SIDE:left/right 내부 표식이 보이던 문제를 현재 기록과 이전 기록 모두 수정합니다.",
      "새 전투 기록에는 내부 표식을 저장하지 않고 보는 사람 기준의 아군·적으로 저장합니다.",
      "받은 소식, 메시지·송금·선물, 프리셋·잠금·강화 등 짧은 행동 결과를 아이콘이 포함된 게임 알림 카드로 통일합니다.",
      "보스 다중 공격은 대상 한 마리씩 재생하고 피해 전후 체력·감소율을 별도 결과 카드로 표시합니다.",
      "치명타와 회피에 전용 배지·화면 효과를 추가하고 수르트 검 파괴·피닉스 부활 등은 BOSS PHASE 카드로 표시합니다.",
      "랭킹은 보유 골드·낚싯대 레벨·PVP 전투력 3개 선택 화면으로 나누고 선택한 목록만 보여줍니다.",
      "보스 최초 상금은 실제 지급값까지 10원 단위로 반올림합니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-void-pvp-skill-ui-24-2",
    title:"공허 전용 연출·1대1 스킬 결과 UI",
    lines:[
      "공허 물고기 5종의 전용 색상과 화면 연출이 각각 다른 모습으로 표시됩니다.",
      "1대1에서 스킬이 발동하면 스킬명과 설명을 먼저 보여준 뒤 체력 변화를 별도 결과 화면으로 보여줍니다.",
      "보스전에는 삭제된 스킬, 관측 남은 턴, 마침표 문장 수를 상태 게이지로 표시합니다.",
      "아래 전투 로그는 공허 연출 색상에 덮이지 않고 기존 물고기 등급과 보스 색상을 유지합니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-observation-void-skill-24-1",
    title:"관측 버그 수정·공허 고유 특성 상향",
    lines:[
      "뒤틀린 관측이 진행 중 다른 보스 스킬에 의해 3턴으로 다시 초기화되던 문제가 수정됩니다.",
      "1대1에서도 관측 반전 직후 같은 턴에 다시 관측을 시작하지 않도록 수정됩니다.",
      "공허 물고기 5종은 크레이지 궁극기급 VOID SIGNATURE 전용 연출을 사용하며, 처형·관측 반전·수치 오류 효과만 소폭 강화됩니다.",
      "1대1 기본 속도가 기존의 35%로 조정되고, 아군·적군 표시는 리플레이를 보는 사람 기준으로 정확히 변환됩니다.",
      "랭킹에 PVP 총합 전투력과 출전 물고기 3마리가 표시되며, 내정보는 확률·성장·전투력을 담은 카드형 화면으로 개편됩니다.",
      "회복 중 출전 확인과 짧은 행동 결과는 콘솔 텍스트 대신 물고기 상태 카드와 게임 알림으로 표시됩니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-crazy-void-ui-24",
    title:"크레이지 보스·공허 밸런스·게임 UI 업데이트",
    lines:[
      "공허 무별 공격력·체력이 영원 ★★ 구간과 같아지고 기존 공허 물고기·합성·진화 수치도 자동 보정됩니다.",
      "모든 보스의 전투당 1회 크레이지 궁극기가 강화되고, 6개 보스에 크레이지 전용 패시브가 추가됩니다.",
      "요그 소토스 차원 분리·보스 특수 자원·소환물 등장이 라이브 전투 화면에 직접 표시됩니다.",
      "보스전과 1대1 기본 재생 속도가 1배로 바뀌고 1대1 회피·치명타 0% 및 전투 이탈 문제가 수정됩니다.",
      "판매 확인·일괄판매·간결한 판매 결과, 읽지 않은 소식함과 다중 물고기 전송이 추가됩니다.",
      "모바일 최근 물고기는 전체보기에서만 표시되며 프로필 오라와 공격 연출이 더 깔끔하게 정리됩니다."
    ]
  },
  {
    id:"2026-07-11-fishinglife-hp-pvp-turn-23",
    title:"체력 3배·1대1 교대 전투 업데이트",
    lines:[
      "기존 양동이와 새로 획득하는 모든 물고기의 최대 체력이 3배로 증가합니다.",
      "부상 물고기는 남은 체력 비율과 회복시간을 유지하고 기절 물고기는 HP 0 상태를 그대로 유지합니다.",
      "합성 누적 체력 전이·본체 기준 체력·진화 체력도 모두 3배로 자동 변환됩니다.",
      "보스의 공격력 기반 일반 공격·스킬·소환물 피해는 2.7배로 조정되고 최대 체력 비례 피해는 기존 비율을 유지합니다.",
      "1대1은 한 파티가 몰아서 공격하지 않고 양쪽 물고기가 한 마리씩 번갈아 행동합니다.",
      "1대1 시작 전 7초 동안 양쪽 출전 물고기와 공격력·체력·치명타·회피 및 파티 총합을 비교합니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-conquest-cosmetics-22",
    title:"등급 정복 배경·공격 연출 강화 업데이트",
    lines:[
      "등급 정복 배경은 영웅부터 공허까지 빛 문양·광륜·입자 밀도가 단계적으로 강해집니다.",
      "장착한 등급 공격 연출은 아군 물고기의 매 공격마다 재생되며 보스 공격에는 발동하지 않습니다.",
      "후반 등급 공격 연출에 빛기둥·회전 광륜·화면 광폭발을 추가하고 공허 연출을 가장 웅장하게 강화했습니다.",
      "후반 보스 오라는 프로필의 네모 프레임 형태와 이중 광륜까지 바꾸며 아자토스 오라는 전용 최종 단계로 표시됩니다.",
      "꾸미기 기본 설정에서 기본 배경과 기본 공격 연출로 언제든 되돌릴 수 있습니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-pvp-live-history-21",
    title:"1대1 라이브 전투·최근 전투 기록 업데이트",
    lines:[
      "1대1 출전 화면에 전투력·공격력·체력·등급·최근 획득 정렬과 30마리씩 더 보기를 추가했습니다.",
      "1대1 결과를 보스 레이드처럼 양쪽 파티 체력·공격자·스킬 발동이 이어지는 라이브 전투로 표시합니다.",
      "낚시터에서도 들어온 대전 신청을 바로 확인하고 수락하거나 거절할 수 있습니다.",
      "광장에 기존 텍스트 게임의 내정보를 카드형 화면으로 추가했습니다.",
      "보스와 1대1 전투는 각각 최근 5회까지 저장되며 전투 기록에서 다시 재생할 수 있습니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-mobile-performance-transfer-20",
    title:"모바일 최적화·안전 거래 업데이트",
    lines:[
      "현재 화면만 갱신하고 양동이 카드를 나누어 그려 모바일 진입 지연을 줄였습니다.",
      "보스 리플레이의 강제 레이아웃 계산과 반복 DOM 탐색을 줄여 전투 연출을 가볍게 만들었습니다.",
      "모바일 프로필·랭킹·보스전 카드와 모달이 화면 한쪽으로 밀리거나 잘리지 않도록 반응형 배치를 보강했습니다.",
      "광장에서 닉네임 기반 송금과 물고기 전송을 사용할 수 있습니다.",
      "거래는 서버 트랜잭션으로 처리되며 잠금 물고기와 합성 본체는 전송할 수 없습니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-boss-intel-19",
    title:"레이드 전 보스 스킬 정보 업데이트",
    lines:[
      "보스 난이도·출전 파티 선택 화면에서 선택한 보스의 패시브와 기본 스킬을 미리 확인할 수 있습니다.",
      "기본 스킬 확률은 일반·어려움·크레이지의 실제 확률 보정값을 반영해 표시합니다.",
      "크레이지 전용 패시브와 궁극기 효과·발동 조건은 크레이지 난이도를 선택했을 때만 표시됩니다.",
      "PC에서는 스킬 카드를 2열로, 모바일에서는 읽기 쉬운 1열로 배치합니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-stun-hp-18",
    title:"기절 5분·레이드 체력 정밀 표시 업데이트",
    lines:[
      "물고기 기절 시간이 전 등급 공통 10분에서 5분으로 줄어듭니다.",
      "이미 기절 중인 물고기도 기절 시작 시각을 기준으로 새 5분 제한이 자동 적용됩니다.",
      "HP 0인데 기절 정보가 일부 누락된 저장 데이터도 즉시 부활하지 않고 정상적인 5분 기절로 복구됩니다.",
      "부분 부상 회복 속도는 기존과 동일하며 기절 시간만 줄어듭니다.",
      "레이드의 보스·아군·소환물·스킬 결과 체력을 억 단위로 뭉개지 않고 만 단위까지 표시합니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-evolution-replay-17",
    title:"진화 성장 강화·보스 스킬 연출 개선 업데이트",
    lines:[
      "진화는 본체 최초 기준 공격력·최대 체력을 1차 2배, 2차 3배, 최종 5배로 만듭니다.",
      "합성 누적 전이는 진화 배율과 별도로 더해져 합성과 진화 순서에 따라 최종 수치가 달라지지 않습니다.",
      "이미 진화한 물고기도 새 고정 기준 방식으로 자동 보정되며 부상 비율과 기절 상태는 그대로 유지됩니다.",
      "진화 화면과 성공 연출에서 공격력·최대 체력의 전후 수치와 실제 증가량을 확인할 수 있습니다.",
      "보스 기본 스킬과 크레이지 궁극기의 큰 카드에 실제 효과 설명이 함께 표시됩니다.",
      "스킬 적용 뒤에는 물고기와 보스의 전후 체력·감소량·감소율을 별도 화면으로 더 오래 표시합니다.",
      "보스 난이도 선택과 1대1 출전 화면에서 저장한 파티 프리셋을 즉시 불러올 수 있습니다.",
      "합성 본체는 어종마다 1마리씩 설정할 수 있고 같은 어종의 다른 개체로 교체하거나 해제할 수 있습니다.",
      "양동이 카드는 합성/진화 진입 버튼만 표시하고 본체 설정은 상세정보와 합성 화면에서 진행합니다.",
      "재료의 영구 공격력과 최대 체력 20%가 횟수 제한 없이 고정 전이되며 회피·치명타·별·특성은 전이되지 않습니다.",
      "누적 합성 3회·7회·15회에 골드를 사용해 1차·2차·최종 진화를 진행할 수 있습니다.",
      "영원·공허 낚시 성공은 다른 접속자의 낚시터 우측 하단에 실시간으로 표시됩니다.",
      "처음 발견한 물고기는 NEW가 표시되고 상세정보를 확인하면 표시가 해제됩니다.",
      "레이드 종료 보고서의 마지막 물고기와 하단 버튼까지 스크롤되며 작은 알림의 표 장식 문자가 제거됩니다."
    ]
  },
  {
    id:"2026-07-10-fishinglife-void-boss-difficulty-6",
    title:"공허 보스와 보스 난이도 업데이트",
    lines:[
      "에레보스, 크로노스, 니알라토텝, 요그 소토스, 아자토스가 공허 등급 보스로 추가되었습니다.",
      "모든 보스에 일반, 어려움, 크레이지 난이도가 추가되고 앞 난이도 클리어 시 다음 난이도가 해금됩니다.",
      "일반은 기존 능력치, 어려움은 체력 10배·공격력 4배, 크레이지는 체력 50배·공격력 10배가 적용됩니다.",
      "난이도별 최초 상금은 기준 상금의 0.5배, 0.7배, 1배이며 코어는 각각 1~3개, 3~5개, 5~10개 지급됩니다.",
      "크레이지 보스는 전투당 한 번 전용 궁극기를 사용하고 기존 패시브도 강화됩니다.",
      "기존 보스 처치 기록은 일반 난이도 클리어로 자동 인정됩니다."
    ]
  },
  {
    id: "2026-07-10-fishinglife-timing-ui-rod-2000-5",
    title: "타이밍 UI와 낚싯대 2000레벨 확장",
    lines: [
      "PERFECT, GREAT, GOOD, BAD 구간이 노랑, 초록, 파랑, 빨강의 단색으로 구분됩니다.",
      "타이밍 판정 문구는 낚아채는 순간에만 표시되고 획득 화면과 최근 기록에서는 반복 표시되지 않습니다.",
      "최근 잡은 물고기를 눌러 능력치와 고유 특성을 바로 확인할 수 있습니다.",
      "불타는 마음 아이콘이 하나의 불꽃 이모지로 표시되며 낚싯대 최대 레벨이 2000으로 확장됩니다.",
      "1750레벨까지의 기존 확률과 낚시 성능은 유지되며 2000레벨까지 추가로 성장합니다."
    ]
  },
  {
    id: "2026-07-10-fishinglife-bad-penalty-4",
    title: "BAD 판정 페널티 강화",
    lines: [
      "BAD 판정에서 일반과 희귀 등급의 비중이 크게 증가합니다.",
      "초월, 영원, 공허 등급 확률이 크게 감소하고 도주 확률은 기본의 150%가 적용됩니다.",
      "GREAT는 기존 낚싯대 확률을 그대로 사용하는 기본 판정으로 유지됩니다."
    ]
  },
  {
    id: "2026-07-10-fishinglife-timing-balance-3",
    title: "낚시 타이밍 밸런스 조정",
    lines: [
      "GREAT 판정이 기존 낚싯대 확률을 그대로 사용하는 기본 판정으로 변경되었습니다.",
      "PERFECT는 소폭의 상위 등급 보너스, GOOD과 BAD는 단계별 페널티가 적용됩니다.",
      "타이밍 판정의 도주 확률 보정 폭을 줄여 낚싯대 성장 효과가 중심이 되도록 조정했습니다."
    ]
  },
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
if(typeof db.enablePersistence === "function"){
  db.enablePersistence({synchronizeTabs:true}).catch(e=>{
    if(!["failed-precondition","unimplemented"].includes(e?.code)) console.warn("Firestore persistence unavailable",e);
  });
}

// 새로 열 때는 반드시 로그인 화면부터 시작합니다. 이전 브라우저의 로컬
// 사용자 표식만으로는 절대 게임을 열지 않습니다.
let currentUser = null;
let cloudSaveTimer = null;
let cloudSaveRetryTimer = null;
let cloudSaveRetryAttempt = 0;
let localSaveSeq = 0;
let cloudSyncedSeq = 0;
let lastCloudSyncedState = null;
let cloudWritesAllowed = false;
let cloudGameReadOnlyBlocked = false;
let cloudVersionGatePromise = null;
let cloudVersionGateCheckedAt = 0;
let cloudVersionGateMessage = "";
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

function getCloudDeviceId(){
  let id=localStorage.getItem("textFishingCloudDeviceId");
  if(!id){
    id="device_"+(crypto.randomUUID?crypto.randomUUID().replace(/-/g,""):Date.now().toString(36)+Math.random().toString(36).slice(2));
    localStorage.setItem("textFishingCloudDeviceId",id);
  }
  return id;
}

function getSessionTokenMap(userData){
  return userData?.sessionTokens&&typeof userData.sessionTokens==="object"?{...userData.sessionTokens}:{};
}

function isSessionHashValid(userData,sessionHash){
  if(!sessionHash||!userData)return false;
  return userData.activeSessionDeviceId===getCloudDeviceId()
    && userData.activeSessionTokenHash===sessionHash;
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
  return isSessionHashValid(userData,sessionHash);
}

function sessionTimestampMillis(value){
  if(value&&typeof value.toMillis==="function")return value.toMillis();
  return Math.max(0,Number(value||0));
}

function isOtherDeviceSessionActive(sessionData){
  if(!sessionData||!sessionData.deviceId)return false;
  if(sessionData.deviceId===getCloudDeviceId())return false;
  const seen=sessionTimestampMillis(sessionData.updatedAt)||Number(sessionData.updatedAtMillis||0);
  return seen>0&&Date.now()-seen<ACCOUNT_SESSION_TTL_MS;
}

async function refreshAccountSession(){
  if(!currentUser)return false;
  const sessionHash=await getCurrentSessionHash();
  if(!sessionHash)return false;
  const username=currentUser,ref=db.collection("accountSessions").doc(username);
  try{
    await db.runTransaction(async tx=>{
      const snap=await tx.get(ref),data=snap.exists?(snap.data()||{}):{};
      if(data.tokenHash&&data.tokenHash!==sessionHash)throw new Error("SESSION_REPLACED");
      if(data.deviceId&&data.deviceId!==getCloudDeviceId())throw new Error("SESSION_REPLACED");
      tx.set(ref,{
        nickname:username,
        deviceId:getCloudDeviceId(),
        tokenHash:sessionHash,
        updatedAtMillis:Date.now(),
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    return true;
  }catch(error){
    console.error(error);
    if(error?.message==="SESSION_REPLACED")forceSessionLogout("이 계정은 다른 기기에서 접속했습니다.");
    return false;
  }
}

function stopAccountSessionHeartbeat(){
  if(accountSessionHeartbeatTimer){clearInterval(accountSessionHeartbeatTimer);accountSessionHeartbeatTimer=null;}
  if(accountSessionUnsubscribe){accountSessionUnsubscribe();accountSessionUnsubscribe=null;}
}

function startAccountSessionHeartbeat(){
  stopAccountSessionHeartbeat();
  if(!currentUser)return;
  const username=currentUser;
  refreshAccountSession();
  accountSessionHeartbeatTimer=setInterval(()=>{if(!document.hidden)refreshAccountSession();},ACCOUNT_SESSION_HEARTBEAT_MS);
  accountSessionUnsubscribe=db.collection("accountSessions").doc(username).onSnapshot(async snap=>{
    if(!currentUser||currentUser!==username)return;
    if(!snap.exists){forceSessionLogout("로그인 연결이 끝났습니다. 다시 로그인해주세요.");return;}
    const sessionHash=await getCurrentSessionHash(),data=snap.data()||{};
    if(!sessionHash||data.tokenHash!==sessionHash||data.deviceId!==getCloudDeviceId())forceSessionLogout("이 계정은 다른 기기에서 접속했습니다.");
  },error=>console.error(error));
}

async function releaseAccountSession(username=currentUser){
  if(!username)return;
  const sessionHash=await getCurrentSessionHash();
  stopAccountSessionHeartbeat();
  if(!sessionHash)return;
  const ref=db.collection("accountSessions").doc(username);
  try{
    await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);
      if(!snap.exists)return;
      const data=snap.data()||{};
      if(data.tokenHash===sessionHash&&data.deviceId===getCloudDeviceId())tx.delete(ref);
    });
  }catch(error){console.error(error);}
}

function forceSessionLogout(message="로그인이 끝났습니다. 다시 로그인해주세요."){
  if(!currentUser)return;
  cancelActiveFishing();
  stopServerAlertListener();
  stopOnlinePresence();
  stopAccountSessionHeartbeat();
  currentUser=null;
  localStorage.removeItem("textFishingCurrentUser");
  clearUserSession();
  resetGameData();
  updateWallet();
  setCloudSyncStatus("offline",message);
  if(typeof globalThis.openFishingLifeLogin==="function")setTimeout(()=>globalThis.openFishingLifeLogin(message),0);
}

function cancelActiveFishing(){
  fishingSessionId++;
  if(fishingTimer !== null){
    clearTimeout(fishingTimer);
    fishingTimer = null;
  }
  isFishing = false;
}

function getLocalDateKey(ms=Date.now()){
  const d=new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function normalizeDailyFishing(value){
  const source=value&&typeof value==="object"?value:{};
  const date=String(source.date||""),count=Math.max(0,Math.floor(Number(source.count||0)));
  return {date,count};
}

function recordDailyFishing(){
  const today=getLocalDateKey();
  dailyFishing=normalizeDailyFishing(dailyFishing);
  if(dailyFishing.date!==today)dailyFishing={date:today,count:0};
  dailyFishing.count++;
  return dailyFishing.count;
}

function getTodayFishingCount(){
  const current=normalizeDailyFishing(dailyFishing);
  return current.date===getLocalDateKey()?current.count:0;
}

function getGameState(){
  return {
    saveSchemaVersion:USER_WRITE_SCHEMA_VERSION,
    accountResetVersion:ACCOUNT_RESET_VERSION,
    money,
    totalEarned,
    rodLevel,
    bucket,
    collection,
    ranking,
    totalFishingCount,
    dailyFishing,
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
    profileCosmetics,
    battleHistory,
    seenUpdateNoticeIds,
    bossProgress,
    pvpPrepIndexes,
    partyPresets,
    fusionMainFishId,
    fusionMainFishIds
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

function normalizeProfileCosmetics(value){
  const source=value&&typeof value==="object"?value:{};
  return {
    border:String(source.border||""),
    aura:String(source.aura||""),
    background:String(source.background||""),
    attackEffect:String(source.attackEffect||"")
  };
}

function createFreshAccountState(){
  return {
    saveSchemaVersion:USER_WRITE_SCHEMA_VERSION,
    accountResetVersion:ACCOUNT_RESET_VERSION,
    money:0,
    totalEarned:0,
    rodLevel:1,
    bucket:[],
    collection:{},
    ranking:[],
    totalFishingCount:0,
    dailyFishing:{date:getLocalDateKey(),count:0},
    gradeCounts:{},
    completedAchievements:[],
    marketHour:null,
    marketRates:{},
    notifications:[],
    messages:[],
    researchLevels:{fishing:0,appraisal:0},
    trainingLevels:{attack:0,hp:0,critDamage:0},
    unlockedTitles:[],
    equippedTitle:"",
    profileCosmetics:{border:"",aura:"",background:"",attackEffect:""},
    battleHistory:{boss:[],pvp:[]},
    seenUpdateNoticeIds:[],
    bossProgress:{defeated:{},difficultyClears:{},hp:{},materials:{},selectedDifficulty:"normal",cooldownUntil:0,cooldowns:{}},
    pvpPrepIndexes:[],
    partyPresets:{boss:[],pvp:[]},
    fusionMainFishId:"",
    fusionMainFishIds:{}
  };
}

function clearOldAccountData(username){
  const account=cleanNickname(username);
  if(account){
    [
      "textFishingCloudRecovery:"+account,
      "textFishingCloudBase:"+account,
      "textFishingCloudDirty:"+account,
      "textFishingEmergencyRecovery:"+account
    ].forEach(key=>localStorage.removeItem(key));
  }
  localStorage.removeItem("textFishingSpeciesSizeSave");
  localStorage.removeItem("textFishingEmergencyRecovery:__unassigned__");
  startupEmergencySnapshot=null;
}

function compactBattleReplayFrames(frames,maxFrames=180){
  const list=Array.isArray(frames)?frames:[];
  if(list.length<=maxFrames)return list;
  const important=/전투 시작|전투 종료|처치 성공|처치 실패|대전 결과|CRAZY|ULTIMATE|BOSS SKILL|ALLY SKILL|PASSIVE|스킬|특성|부활|기절|쓰러|되감|회복/i;
  const keep=new Set([0,list.length-1]);
  list.forEach((frame,index)=>{if(important.test(String(frame?.entry||"")))keep.add(index);});
  const remaining=Math.max(0,maxFrames-keep.size),step=remaining>0?list.length/remaining:list.length;
  for(let cursor=0;keep.size<maxFrames&&cursor<list.length;cursor+=step)keep.add(Math.min(list.length-1,Math.floor(cursor)));
  const indexes=[...keep].sort((a,b)=>a-b);
  if(indexes.length>maxFrames){
    const finalIndex=list.length-1,trimmed=indexes.slice(0,Math.max(1,maxFrames-1));
    if(!trimmed.includes(finalIndex))trimmed.push(finalIndex);
    return trimmed.sort((a,b)=>a-b).map(index=>list[index]);
  }
  return indexes.map(index=>list[index]);
}

function normalizeBattleHistory(value){
  const source=value&&typeof value==="object"?value:{};
  const clean=(items,type)=>(Array.isArray(items)?items:[]).slice(0,5).map((item,index)=>{
    const record=item&&typeof item==="object"?JSON.parse(JSON.stringify(item)):{};
    record.id=String(record.id||`${type}_legacy_${index}_${Number(record.createdAtMillis||0)}`);
    record.createdAtMillis=Number(record.createdAtMillis||Date.now());
    record.frames=compactBattleReplayFrames(record.frames,180);
    if(typeof record.fullLog==="string"&&record.fullLog.length>50000)record.fullLog=record.fullLog.slice(-50000);
    return record;
  });
  return {boss:clean(source.boss,"boss"),pvp:clean(source.pvp,"pvp")};
}

function addBattleHistory(type,replay){
  if(!["boss","pvp"].includes(type)||!replay)return null;
  battleHistory=normalizeBattleHistory(battleHistory);
  const record=JSON.parse(JSON.stringify(replay));
  record.id=String(record.id||`${type}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);
  record.createdAtMillis=Number(record.createdAtMillis||Date.now());
  record.frames=compactBattleReplayFrames(record.frames,180);
  if(typeof record.fullLog==="string"&&record.fullLog.length>50000)record.fullLog=record.fullLog.slice(-50000);
  battleHistory[type]=[record,...battleHistory[type].filter(item=>item.id!==record.id)].slice(0,5);
  return record;
}

function hasBossDifficultyClearById(id,difficulty){
  if(difficulty==="normal"&&bossProgress.defeated&&bossProgress.defeated[id])return true;
  return !!(bossProgress.difficultyClears&&bossProgress.difficultyClears[id]&&bossProgress.difficultyClears[id][difficulty]);
}

function isBossGradeCrazyCleared(grade){
  if(typeof bossList==="undefined")return false;
  const gradeBosses=bossList.filter(boss=>boss.grade===grade);
  return gradeBosses.length>0&&gradeBosses.every(boss=>hasBossDifficultyClearById(boss.id,"crazy"));
}

function isProfileCosmeticUnlocked(type,id){
  if(!id)return true;
  if(type==="border")return hasBossDifficultyClearById(id,"hard");
  if(type==="aura")return hasBossDifficultyClearById(id,"crazy");
  if(type==="background"||type==="attackEffect")return isBossGradeCrazyCleared(id);
  return false;
}

function equipProfileCosmetic(type,id){
  if(!["border","aura","background","attackEffect"].includes(type))return false;
  const selected=String(id||"");
  if(!isProfileCosmeticUnlocked(type,selected))return false;
  profileCosmetics[type]=selected;
  saveGame();
  return true;
}


function normalizeBossProgress(value){
  const base = {defeated:{},difficultyClears:{},hp:{},materials:{},selectedBossId:"",selectedDifficulty:"normal",cooldownUntil:0,cooldowns:{}};
  if(!value || typeof value !== "object") return base;
  const defeated = value.defeated || {};
  const difficultyClears = value.difficultyClears && typeof value.difficultyClears === "object" ? {...value.difficultyClears} : {};
  Object.keys(defeated).forEach(id => {
    if(!defeated[id]) return;
    difficultyClears[id] = {...(difficultyClears[id] || {}), normal:true};
  });
  return {
    defeated,
    difficultyClears,
    hp:value.hp || {},
    materials:value.materials || {},
    selectedBossId:value.selectedBossId || "",
    selectedDifficulty:["normal","hard","crazy"].includes(value.selectedDifficulty) ? value.selectedDifficulty : "normal",
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
  const ownedById=new Map(bucket.filter(Boolean).map(f=>[String(f.id),f]));
  const cleaned={};
  Object.entries(fusionMainFishIds&&typeof fusionMainFishIds==="object"?fusionMainFishIds:{}).forEach(([name,id])=>{
    const fish=ownedById.get(String(id));
    if(fish&&fish.grade!=="쓰레기"&&fish.name===name)cleaned[name]=fish.id;
  });
  const active=ownedById.get(String(fusionMainFishId||""));
  if(active&&active.grade!=="쓰레기")cleaned[active.name]=active.id;
  else fusionMainFishId="";
  fusionMainFishIds=cleaned;
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
  dailyFishing=normalizeDailyFishing(s.dailyFishing??dailyFishing);
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
  profileCosmetics=normalizeProfileCosmetics(s.profileCosmetics??profileCosmetics);
  battleHistory=normalizeBattleHistory(s.battleHistory??battleHistory);
  seenUpdateNoticeIds=normalizeUpdateNoticeIds(s.seenUpdateNoticeIds, s.lastSeenUpdateVersion);
  bossProgress=normalizeBossProgress(s.bossProgress??bossProgress);
  pvpPrepIndexes=Array.isArray(s.pvpPrepIndexes)?s.pvpPrepIndexes:[];
  partyPresets=normalizePartyPresets(s.partyPresets??partyPresets);
  fusionMainFishId=String(s.fusionMainFishId??fusionMainFishId??"");
  fusionMainFishIds=s.fusionMainFishIds&&typeof s.fusionMainFishIds==="object"?{...s.fusionMainFishIds}:{};
  ensureAllFishIds();
}


function reportCloudVersionGate(message){
  const detail=String(message||"최신 FishingLife 파일이 필요합니다.");
  const shouldReport=cloudVersionGateMessage!==detail;
  cloudVersionGateMessage=detail;
  cloudWritesAllowed=false;
  cloudGameReadOnlyBlocked=true;
  setCloudSyncStatus("error",detail);
  if(!shouldReport)return;
  if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"필수 업데이트",detail,kind:"danger",icon:"🛡️",duration:8000});
  else if(typeof print==="function")print("필수 업데이트\n\n"+detail);
  if(typeof globalThis.showFishingLifeVersionBlocker==="function")globalThis.showFishingLifeVersionBlocker(detail);
}

async function checkGameVersion(force=false){
  if(!force&&cloudWritesAllowed&&Date.now()-cloudVersionGateCheckedAt<GAME_VERSION_CHECK_TTL_MS)return true;
  if(cloudVersionGatePromise)return cloudVersionGatePromise;
  cloudVersionGatePromise=(async()=>{
    cloudWritesAllowed=false;
    try{
      const snap=await db.collection("config").doc("game").get({source:"server"});
      const config=snap.exists?(snap.data()||{}):{};
      const minimumSchema=Math.max(0,Number(config.minSaveSchemaVersion??config.minimumBuild??0)||0);
      const minimumProtocol=Math.max(0,Number(config.minimumWriteProtocol??0)||0);
      if(config.maintenance===true){
        reportCloudVersionGate(String(config.message||"서버 점검 중입니다. 점검이 끝난 뒤 다시 접속해주세요."));
        return false;
      }
      if(minimumSchema>USER_WRITE_SCHEMA_VERSION||minimumProtocol>USER_WRITE_PROTOCOL_VERSION){
        reportCloudVersionGate(String(config.message||"새 FishingLife 파일로 다시 접속해주세요. 현재 파일에서는 계정 저장이 차단됩니다."));
        return false;
      }
      cloudWritesAllowed=true;
      cloudGameReadOnlyBlocked=false;
      cloudVersionGateCheckedAt=Date.now();
      cloudVersionGateMessage="";
      return true;
    }catch(error){
      console.error(error);
      reportCloudVersionGate("Firebase 서버에서 안전 버전을 확인하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해주세요.");
      return false;
    }
  })();
  try{return await cloudVersionGatePromise;}
  finally{cloudVersionGatePromise=null;}
}

function cloneCloudState(value){
  if(value===undefined||value===null)return value;
  return JSON.parse(JSON.stringify(value));
}

function isPermissionDeniedError(error){
  const code=String(error?.code||"").toLowerCase();
  const message=String(error?.message||"").toLowerCase();
  return code==="permission-denied"||code==="firestore/permission-denied"||message.includes("permission-denied")||message.includes("missing or insufficient permissions");
}

function handleProtectedWriteError(error,username=currentUser,localState=getGameState(),baseState=lastCloudSyncedState){
  if(error?.message!=="UPDATE_REQUIRED"&&!isPermissionDeniedError(error))return false;
  const preserved=username?peekCloudRecovery(username):null;
  const safeLocal=localState&&typeof localState==="object"?localState:preserved?.localState;
  const safeBase=baseState&&typeof baseState==="object"?baseState:preserved?.baseState;
  if(username&&safeLocal&&typeof safeLocal==="object")storeCloudRecovery(username,safeLocal,safeBase||null,true);
  clearTimeout(cloudSaveRetryTimer);
  cloudSaveRetryTimer=null;
  reportCloudVersionGate("안전 저장 규칙과 현재 게임 파일의 버전이 맞지 않습니다. v24.8 이상으로 다시 접속해주세요. 이 기기의 변경 내용은 복구용으로 보관했습니다.");
  return true;
}

async function handleOnlineActionWriteError(error,username=currentUser,localState=getGameState(),baseState=lastCloudSyncedState){
  if(error?.message==="UPDATE_REQUIRED")return handleProtectedWriteError(error,username,localState,baseState);
  if(!isPermissionDeniedError(error))return false;
  const versionIsCurrent=await checkGameVersion(true);
  if(!versionIsCurrent)return handleProtectedWriteError(error,username,localState,baseState);
  setCloudSyncStatus(hasPendingLocalCloudChanges()?"saving":"saved","현재 계정 자동저장은 유지됩니다. 거래 대상 계정의 데이터 형식을 확인해주세요.");
  if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"상대 계정 저장 차단",detail:"상대 계정이 아직 안전 저장 형식으로 전환되지 않았거나 데이터가 일치하지 않아 이번 작업만 중단했습니다.",kind:"danger",icon:"🛡️"});
  return true;
}

function assertCloudWritesAllowed(){
  if(!cloudWritesAllowed)throw new Error("UPDATE_REQUIRED");
}

function accountBackupDayKey(ms=Date.now()){
  const date=new Date(ms);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}-${String(date.getUTCDate()).padStart(2,"0")}`;
}

function accountBackupFingerprint(data){
  const state=data?.gameState&&typeof data.gameState==="object"?data.gameState:{};
  return JSON.stringify([
    Number(data?.cloudRevision||0),
    normalizeMoney(state.money??data?.money??0),
    Math.max(1,Math.floor(Number(state.rodLevel??data?.rodLevel??1))),
    Math.max(0,Math.floor(Number(state.totalFishingCount||0))),
    normalizeMoney(state.totalEarned||0),
    Array.isArray(state.bucket)?state.bucket.length:0
  ]);
}

function stageAccountBackup(tx,ref,existingData,reason,force=false){
  const data=existingData&&typeof existingData==="object"?existingData:null;
  if(!data||!data.gameState||typeof data.gameState!=="object")return {};
  const today=accountBackupDayKey();
  const isProtocolMigration=Number(data.writeProtocol||0)!==USER_WRITE_PROTOCOL_VERSION||Number(data.writeSchemaVersion||0)!==USER_WRITE_SCHEMA_VERSION;
  if(!force&&!isProtocolMigration&&String(data.lastBackupDay||"")===today)return {};
  const previousCursor=Number.isInteger(Number(data.backupCursor))?Number(data.backupCursor):-1;
  const cursor=(previousCursor+1)%ACCOUNT_BACKUP_SLOT_COUNT;
  const serverTime=firebase.firestore.FieldValue.serverTimestamp();
  const state=cloneCloudState(data.gameState)||{};
  const backupRef=ref.collection("backups").doc("slot"+cursor);
  tx.set(backupRef,{
    username:ref.id,
    slot:cursor,
    sourceRevision:Math.max(0,Math.floor(Number(data.cloudRevision||0))),
    sourceGameVersion:String(data.writeClientVersion||data.emergencyRecoveryVersion||"legacy"),
    sourceSchemaVersion:Math.max(0,Math.floor(Number(data.writeSchemaVersion||state.saveSchemaVersion||0))),
    reason:String(reason||"user_write"),
    summary:{
      money:normalizeMoney(data.money??state.money??0),
      rodLevel:Math.max(1,Math.floor(Number(data.rodLevel??state.rodLevel??1))),
      totalFishingCount:Math.max(0,Math.floor(Number(data.totalFishingCount||0)),Math.floor(Number(state.totalFishingCount||0))),
      totalEarned:normalizeMoney(Math.max(Number(data.totalEarned||0),Number(state.totalEarned||0))),
      bucketCount:Array.isArray(state.bucket)?state.bucket.length:0
    },
    sourceTopLevel:{
      money:normalizeMoney(data.money??state.money??0),
      rodLevel:Math.max(1,Math.floor(Number(data.rodLevel??state.rodLevel??1))),
      totalFishingCount:Math.max(0,Math.floor(Number(data.totalFishingCount||0))),
      totalEarned:normalizeMoney(data.totalEarned||0),
      title:String(data.title||""),
      cloudRevision:Math.max(0,Math.floor(Number(data.cloudRevision||0)))
    },
    gameState:state,
    capturedAtMillis:Date.now(),
    capturedAt:serverTime,
    updatedAt:serverTime,
    writeSchemaVersion:USER_WRITE_SCHEMA_VERSION,
    writeProtocol:USER_WRITE_PROTOCOL_VERSION,
    writeProtocolSeq:Math.max(1,Math.floor(Number(data.writeProtocolSeq||0))+1),
    writeGuardAt:serverTime
  });
  return {
    backupCursor:cursor,
    lastBackupDay:today,
    lastBackupFingerprint:accountBackupFingerprint(data),
    lastBackupAt:serverTime
  };
}

function protectedUserState(existingData,patch){
  const existing=existingData&&typeof existingData==="object"?existingData:{};
  const resetting=Number((patch||{}).accountResetVersion||0)>Number(existing.accountResetVersion||0);
  const source=Object.prototype.hasOwnProperty.call(patch,"gameState")?patch.gameState:existing.gameState;
  const state=cloneCloudState(source&&typeof source==="object"?source:{})||{};
  const hasPatchMoney=Object.prototype.hasOwnProperty.call(patch,"money");
  const hasExistingMoney=Object.prototype.hasOwnProperty.call(existing,"money");
  const moneyValue=hasPatchMoney?patch.money:(hasExistingMoney?existing.money:(state.money??0));
  const hasPatchRod=Object.prototype.hasOwnProperty.call(patch,"rodLevel");
  const rodValue=hasPatchRod?patch.rodLevel:Math.max(1,Number(state.rodLevel||1),Number(existing.rodLevel||1));
  state.money=normalizeMoney(moneyValue);
  state.rodLevel=Math.max(1,Math.floor(Number(rodValue||1)));
  state.totalFishingCount=resetting?Math.max(0,Math.floor(Number(state.totalFishingCount||0))):Math.max(0,Math.floor(Number(state.totalFishingCount||0)),Math.floor(Number(existing.totalFishingCount||0)));
  state.totalEarned=resetting?normalizeMoney(state.totalEarned||0):normalizeMoney(Math.max(Number(state.totalEarned||0),Number(existing.totalEarned||0)));
  state.saveSchemaVersion=USER_WRITE_SCHEMA_VERSION;
  state.accountResetVersion=ACCOUNT_RESET_VERSION;
  return state;
}

function assertNoProgressRegression(existingData,nextState){
  if(!existingData||typeof existingData!=="object")return;
  const oldState=existingData.gameState&&typeof existingData.gameState==="object"?existingData.gameState:{};
  const oldRod=Math.max(1,Number(existingData.rodLevel||1),Number(oldState.rodLevel||1));
  const oldFishing=Math.max(0,Number(existingData.totalFishingCount||0),Number(oldState.totalFishingCount||0));
  const oldEarned=Math.max(0,Number(existingData.totalEarned||0),Number(oldState.totalEarned||0));
  if(Number(nextState.rodLevel||1)<oldRod||Number(nextState.totalFishingCount||0)<oldFishing||Number(nextState.totalEarned||0)<oldEarned)throw new Error("PROGRESS_REGRESSION_BLOCKED");
}

function getSerializedByteSize(value){
  try{return new TextEncoder().encode(JSON.stringify(value)).byteLength;}
  catch(error){console.error(error);return Number.POSITIVE_INFINITY;}
}

function assertCloudStateSize(state){
  const bytes=getSerializedByteSize(state);
  if(bytes>MAX_SAFE_GAME_STATE_BYTES){const error=new Error("USER_STATE_TOO_LARGE");error.stateBytes=bytes;throw error;}
  return bytes;
}

function txSetProtectedUser(tx,ref,existingData,patch,reason="user_write",options={}){
  assertCloudWritesAllowed();
  const create=options.create===true;
  if(create&&existingData)throw new Error("ACCOUNT_ALREADY_EXISTS");
  if(!create&&!existingData)throw new Error("ACCOUNT_NOT_FOUND");
  const state=protectedUserState(existingData,patch||{});
  assertCloudStateSize(state);
  if(options.allowAccountReset!==true)assertNoProgressRegression(existingData,state);
  const expectedRevision=create?0:Number(existingData.cloudRevision||0)+1;
  if(Object.prototype.hasOwnProperty.call(patch||{},"cloudRevision")&&Number(patch.cloudRevision)!==expectedRevision)throw new Error("REVISION_MISMATCH");
  const backupMeta=create||options.backup===false?{}:stageAccountBackup(tx,ref,existingData,reason,options.forceBackup===true);
  const serverTime=firebase.firestore.FieldValue.serverTimestamp();
  const payload={
    ...(patch||{}),
    ...backupMeta,
    nickname:ref.id,
    money:state.money,
    rodLevel:state.rodLevel,
    totalEarned:state.totalEarned,
    totalFishingCount:state.totalFishingCount,
    title:normalizeLegacyTitleName((patch||{}).title??state.equippedTitle??existingData?.title??""),
    cloudRevision:expectedRevision,
    gameState:state,
    writeSchemaVersion:USER_WRITE_SCHEMA_VERSION,
    writeProtocol:USER_WRITE_PROTOCOL_VERSION,
    writeProtocolSeq:create?1:Number(existingData.writeProtocolSeq||0)+1,
    writeClientVersion:GAME_VERSION,
    writeReason:String(reason||"user_write"),
    accountResetVersion:ACCOUNT_RESET_VERSION,
    writeGuardAt:serverTime,
    updatedAt:serverTime
  };
  if(create)tx.set(ref,payload);
  else tx.set(ref,payload,{merge:true});
  return payload;
}

function sameCloudValue(a,b){
  return JSON.stringify(a)===JSON.stringify(b);
}

function cloudItemKey(item,index=0){
  if(item&&typeof item==="object")return String(item.id||item.messageId||item.createdAtMillis||JSON.stringify(item));
  return String(item);
}

function mergeCloudArray(localList,serverList,baseList){
  const local=Array.isArray(localList)?localList:[],server=Array.isArray(serverList)?serverList:[],base=Array.isArray(baseList)?baseList:[];
  const localMap=new Map(local.map((item,index)=>[cloudItemKey(item,index),item]));
  const baseMap=new Map(base.map((item,index)=>[cloudItemKey(item,index),item]));
  const result=new Map(server.map((item,index)=>[cloudItemKey(item,index),cloneCloudState(item)]));
  baseMap.forEach((item,key)=>{if(!localMap.has(key))result.delete(key);});
  localMap.forEach((item,key)=>{const baseItem=baseMap.get(key);if(!baseMap.has(key)||!sameCloudValue(item,baseItem))result.set(key,cloneCloudState(item));});
  return [...result.values()];
}

function mergeCloudBucket(localBucket,serverBucket,baseBucket){
  const local=Array.isArray(localBucket)?localBucket:[],server=Array.isArray(serverBucket)?serverBucket:[],base=Array.isArray(baseBucket)?baseBucket:[];
  const result=new Map(server.filter(Boolean).map(f=>[String(f.id||makeFishId()),cloneCloudState(f)]));
  const serverIds=new Set(result.keys());
  const localMap=new Map(local.filter(Boolean).map(f=>[String(f.id||""),f]).filter(([id])=>id));
  const baseMap=new Map(base.filter(Boolean).map(f=>[String(f.id||""),f]).filter(([id])=>id));
  baseMap.forEach((fish,id)=>{if(!localMap.has(id))result.delete(id);});
  localMap.forEach((fish,id)=>{const baseFish=baseMap.get(id);if(baseMap.has(id)&&!serverIds.has(id))return;if(!baseMap.has(id)||!sameCloudValue(fish,baseFish))result.set(id,cloneCloudState(fish));});
  local.filter(Boolean).filter(f=>!f.id).forEach(f=>{const fish=cloneCloudState(f);fish.id=makeFishId();result.set(String(fish.id),fish);});
  return [...result.values()];
}

function mergeNumericRecord(localValue,serverValue,baseValue){
  const local=localValue&&typeof localValue==="object"?localValue:{},server=serverValue&&typeof serverValue==="object"?serverValue:{},base=baseValue&&typeof baseValue==="object"?baseValue:{};
  const result={...server};
  new Set([...Object.keys(local),...Object.keys(server),...Object.keys(base)]).forEach(key=>{
    const delta=Number(local[key]||0)-Number(base[key]||0);
    result[key]=Math.max(0,Number(server[key]||0)+delta);
  });
  return result;
}

function mergeMaxRecord(...values){
  const result={};
  values.filter(value=>value&&typeof value==="object").forEach(value=>Object.entries(value).forEach(([key,item])=>{result[key]=Math.max(Number(result[key]||0),Number(item||0));}));
  return result;
}

function mergeUniqueStrings(...values){
  return [...new Set(values.flatMap(value=>Array.isArray(value)?value:[]).map(String).filter(Boolean))];
}

function mergeBossProgressMonotonic(localValue,serverValue){
  const local=normalizeBossProgress(localValue),server=normalizeBossProgress(serverValue),result=cloneCloudState(server);
  result.defeated={...server.defeated};
  new Set([...Object.keys(server.defeated||{}),...Object.keys(local.defeated||{})]).forEach(id=>{result.defeated[id]=!!server.defeated?.[id]||!!local.defeated?.[id];});
  result.difficultyClears={...server.difficultyClears};
  new Set([...Object.keys(server.difficultyClears||{}),...Object.keys(local.difficultyClears||{})]).forEach(id=>{
    const s=server.difficultyClears?.[id]||{},l=local.difficultyClears?.[id]||{};
    result.difficultyClears[id]={normal:!!s.normal||!!l.normal,hard:!!s.hard||!!l.hard,crazy:!!s.crazy||!!l.crazy};
  });
  return result;
}

function mergeDailyFishingState(localValue,serverValue,baseValue){
  const today=getLocalDateKey(),local=normalizeDailyFishing(localValue),server=normalizeDailyFishing(serverValue),base=normalizeDailyFishing(baseValue);
  const lc=local.date===today?local.count:0,sc=server.date===today?server.count:0,bc=base.date===today?base.count:0;
  return {date:today,count:Math.max(lc,sc,sc+lc-bc)};
}

function mergeCollectionState(localValue,serverValue,baseValue){
  const local=localValue&&typeof localValue==="object"?localValue:{},server=serverValue&&typeof serverValue==="object"?serverValue:{},base=baseValue&&typeof baseValue==="object"?baseValue:{};
  const result={};
  new Set([...Object.keys(local),...Object.keys(server),...Object.keys(base)]).forEach(name=>{
    const l=local[name]||{},s=server[name]||{},b=base[name]||{},count=Math.max(Number(l.count||0),Number(s.count||0),Number(s.count||0)+Number(l.count||0)-Number(b.count||0),0);
    if(!count&&!local[name]&&!server[name])return;
    const candidates=[s,l,b].filter(x=>x&&x.bestSize!==null&&Number.isFinite(Number(x.bestSize))).sort((a,c)=>Number(c.bestSize)-Number(a.bestSize));
    result[name]={count,bestSize:candidates[0]?.bestSize??null,bestGrade:candidates[0]?.bestGrade||l.bestGrade||s.bestGrade||b.bestGrade||"일반"};
  });
  return result;
}

function mergeCloudGameStates(localState,serverState,baseState){
  const local=cloneCloudState(localState)||{},server=cloneCloudState(serverState)||{},base=cloneCloudState(baseState)||cloneCloudState(server)||{};
  const merged={...server};
  new Set([...Object.keys(server),...Object.keys(local),...Object.keys(base)]).forEach(key=>{
    if(key==="bucket")merged.bucket=mergeCloudBucket(local.bucket,server.bucket,base.bucket);
    else if(key==="rodLevel")merged.rodLevel=Math.max(1,Number(local.rodLevel||1),Number(server.rodLevel||1),Number(base.rodLevel||1));
    else if(key==="money")merged.money=normalizeMoney(Number(server.money||0)+Number(local.money||0)-Number(base.money||0));
    else if(key==="totalEarned"||key==="totalFishingCount")merged[key]=normalizeMoney(Math.max(Number(local[key]||0),Number(server[key]||0),Number(server[key]||0)+Number(local[key]||0)-Number(base[key]||0)));
    else if(key==="dailyFishing")merged.dailyFishing=mergeDailyFishingState(local.dailyFishing,server.dailyFishing,base.dailyFishing);
    else if(key==="gradeCounts")merged.gradeCounts=mergeMaxRecord(mergeNumericRecord(local.gradeCounts,server.gradeCounts,base.gradeCounts),local.gradeCounts,server.gradeCounts);
    else if(key==="collection")merged.collection=mergeCollectionState(local.collection,server.collection,base.collection);
    else if(key==="researchLevels"||key==="trainingLevels")merged[key]=mergeMaxRecord(local[key],server[key],base[key]);
    else if(key==="completedAchievements"||key==="unlockedTitles")merged[key]=mergeUniqueStrings(server[key],local[key]);
    else if(key==="bossProgress")merged.bossProgress=mergeBossProgressMonotonic(local.bossProgress,server.bossProgress);
    else if(key==="notifications"||key==="messages")merged[key]=mergeCloudArray(local[key],server[key],base[key]);
    else merged[key]=sameCloudValue(local[key],base[key])?cloneCloudState(server[key]):cloneCloudState(local[key]);
  });
  return merged;
}

function mergeSafeProgressRecovery(localState,serverState){
  const local=cloneCloudState(localState)||{},server=cloneCloudState(serverState)||{},merged=cloneCloudState(server)||{};
  merged.rodLevel=Math.max(1,Number(server.rodLevel||1),Number(local.rodLevel||1));
  merged.totalEarned=normalizeMoney(Math.max(Number(server.totalEarned||0),Number(local.totalEarned||0)));
  merged.totalFishingCount=Math.max(Number(server.totalFishingCount||0),Number(local.totalFishingCount||0));
  merged.dailyFishing=mergeDailyFishingState(local.dailyFishing,server.dailyFishing,server.dailyFishing);
  merged.gradeCounts=mergeMaxRecord(server.gradeCounts,local.gradeCounts);
  merged.collection=mergeCollectionState(local.collection,server.collection,server.collection);
  merged.researchLevels=mergeMaxRecord(server.researchLevels,local.researchLevels);
  merged.trainingLevels=mergeMaxRecord(server.trainingLevels,local.trainingLevels);
  merged.completedAchievements=mergeUniqueStrings(server.completedAchievements,local.completedAchievements);
  merged.unlockedTitles=mergeUniqueStrings(server.unlockedTitles,local.unlockedTitles);
  merged.bossProgress=mergeBossProgressMonotonic(local.bossProgress,server.bossProgress);
  return merged;
}

function setCloudSyncStatus(status,detail=""){
  const chip=document.getElementById("cloudSyncChip"),icon=document.getElementById("cloudSyncIcon"),label=document.getElementById("cloudSyncText");
  const config={offline:["☁️","로그인 필요"],saving:["↻","저장 중"],saved:["✓","저장 완료"],retry:["!","재시도 중"],error:["!","저장 지연"]}[status]||["☁️","클라우드"];
  if(chip){chip.className="cloud-sync-chip "+status;chip.title=detail||config[1];}
  if(icon)icon.textContent=config[0];
  if(label)label.textContent=config[1];
}

function scheduleCloudSaveRetry(){
  if(!currentUser||cloudSaveRetryTimer!==null)return;
  const delays=[1000,3000,10000,30000],delay=delays[Math.min(cloudSaveRetryAttempt,delays.length-1)];
  cloudSaveRetryAttempt++;
  setCloudSyncStatus("retry",`${Math.ceil(delay/1000)}초 뒤 Firebase 저장을 다시 시도합니다.`);
  cloudSaveRetryTimer=setTimeout(()=>{cloudSaveRetryTimer=null;saveCloudData();},delay);
}

function cloudDirtyKey(username){return "textFishingCloudDirty:"+String(username||"");}
function cloudBaseKey(username){return "textFishingCloudBase:"+String(username||"");}

function persistCloudSyncBase(username,state=lastCloudSyncedState,revision=cloudRevision){
  if(!username||!state||typeof state!=="object")return false;
  try{
    localStorage.setItem(cloudBaseKey(username),JSON.stringify({state:cloneCloudState(state),revision:Number(revision||0),savedAt:Date.now(),schemaVersion:USER_WRITE_SCHEMA_VERSION}));
    return true;
  }catch(error){console.error(error);return false;}
}

function readCloudSyncBase(username){
  if(!username)return null;
  try{
    const value=JSON.parse(localStorage.getItem(cloudBaseKey(username))||"null");
    if(!value||!value.state||typeof value.state!=="object")return null;
    if(Number(value.state.accountResetVersion||0)!==ACCOUNT_RESET_VERSION){localStorage.removeItem(cloudBaseKey(username));return null;}
    return value;
  }catch(error){console.error(error);return null;}
}

function markPersistentCloudDirty(username=currentUser){
  if(!username)return;
  try{localStorage.setItem(cloudDirtyKey(username),JSON.stringify({dirty:true,revision:Number(cloudRevision||0),updatedAt:Date.now()}));}catch(e){console.error(e);}
}

function hasPersistentCloudDirty(username=currentUser){
  if(!username)return false;
  try{return JSON.parse(localStorage.getItem(cloudDirtyKey(username))||"null")?.dirty===true;}catch(e){return false;}
}

function clearPersistentCloudDirty(username=currentUser){
  if(username){
    localStorage.removeItem(cloudDirtyKey(username));
    discardCloudRecovery(username);
  }
}

function storeCloudRecovery(username,localState=getGameState(),baseState=lastCloudSyncedState,dirty=true){
  if(!username)return;
  try{
    const persistedBase=baseState&&typeof baseState==="object"?baseState:readCloudSyncBase(username)?.state||null;
    localStorage.setItem("textFishingCloudRecovery:"+username,JSON.stringify({localState:cloneCloudState(localState),baseState:cloneCloudState(persistedBase),dirty:dirty===true,savedAt:Date.now()}));
  }catch(e){console.error(e);}
}

function discardCloudRecovery(username){if(username)localStorage.removeItem("textFishingCloudRecovery:"+username);}

function peekCloudRecovery(username){
  if(!username)return null;
  const key="textFishingCloudRecovery:"+username,raw=localStorage.getItem(key);
  if(!raw)return null;
  try{
    const value=JSON.parse(raw);
    if(Number(value?.localState?.accountResetVersion||0)!==ACCOUNT_RESET_VERSION){localStorage.removeItem(key);return null;}
    return value;
  }catch(e){console.error(e);return null;}
}

function takeCloudRecovery(username){return peekCloudRecovery(username);}

const EMERGENCY_RECOVERY_ACCOUNTS=new Set(["차희승"]);

function isEmergencyRecoveryAccount(username){return EMERGENCY_RECOVERY_ACCOUNTS.has(cleanNickname(username));}

function emergencySnapshotStorageKey(username=""){
  return "textFishingEmergencyRecovery:"+(cleanNickname(username)||"__unassigned__");
}

function stableCloudSignatureValue(value){
  if(Array.isArray(value))return value.map(stableCloudSignatureValue);
  if(value&&typeof value==="object"){
    const result={};
    Object.keys(value).sort().forEach(key=>{if(value[key]!==undefined)result[key]=stableCloudSignatureValue(value[key]);});
    return result;
  }
  return value;
}

function emergencyRecoverySignature(state){
  const source=state&&typeof state==="object"?state:{};
  return JSON.stringify(stableCloudSignatureValue(source));
}

function isMeaningfulEmergencyState(state){
  if(!state||typeof state!=="object")return false;
  if(Number(state.accountResetVersion||0)!==ACCOUNT_RESET_VERSION)return false;
  return Number(state.rodLevel||1)>1||normalizeMoney(state.money||0)>0||Number(state.totalFishingCount||0)>0||(Array.isArray(state.bucket)&&state.bucket.length>0);
}

function emergencyRecoveryProgressScore(state){
  const level=Math.max(1,Number(state?.rodLevel||1));
  return [level>=1200?1:0,Math.max(0,Number(state?.totalFishingCount||0)),normalizeMoney(state?.totalEarned||0),level];
}

function compareEmergencyRecoveryProgress(a,b){
  const left=emergencyRecoveryProgressScore(a),right=emergencyRecoveryProgressScore(b);
  for(let i=0;i<left.length;i++){if(left[i]!==right[i])return left[i]-right[i];}
  return 0;
}

function readPersistedEmergencySnapshot(username=""){
  try{
    const value=JSON.parse(localStorage.getItem(emergencySnapshotStorageKey(username))||"null");
    if(!value||!isMeaningfulEmergencyState(value.state))return null;
    value.signature=emergencyRecoverySignature(value.state);
    value.signatureVersion=2;
    value.storagePersisted=true;
    return value;
  }catch(e){console.error(e);return null;}
}

function persistEmergencySnapshot(snapshot){
  if(!snapshot)return false;
  try{localStorage.setItem(emergencySnapshotStorageKey(snapshot.username),JSON.stringify(snapshot));return true;}
  catch(e){console.error(e);return false;}
}

function shouldProtectEmergencyOriginalLocalSave(){
  return !!startupEmergencySnapshot&&isMeaningfulEmergencyState(startupEmergencySnapshot.state);
}

function captureStartupEmergencySnapshot(username,state,source="이 브라우저에 남은 시작 데이터",baseState=null){
  const account=cleanNickname(username);
  if(account&&!isEmergencyRecoveryAccount(account)&&!hasPersistentCloudDirty(account))return null;
  if(!isMeaningfulEmergencyState(state))return null;
  const candidate=cloneCloudState(state),signature=emergencyRecoverySignature(candidate);
  let existing=(startupEmergencySnapshot&&startupEmergencySnapshot.username===account?startupEmergencySnapshot:null)||readPersistedEmergencySnapshot(account);
  if(existing?.signature===signature){
    if(!existing.baseState&&baseState&&typeof baseState==="object"){existing.baseState=cloneCloudState(baseState);persistEmergencySnapshot(existing);}
    startupEmergencySnapshot=existing;
    return startupEmergencySnapshot;
  }
  if(existing&&!isEmergencyRecoveryAccount(account)&&hasPersistentCloudDirty(account)){
    startupEmergencySnapshot=existing;
    return startupEmergencySnapshot;
  }
  if(existing&&isEmergencyRecoveryAccount(account)&&compareEmergencyRecoveryProgress(existing.state,candidate)>=0){
    startupEmergencySnapshot=existing;
    return startupEmergencySnapshot;
  }
  const nextSnapshot={
    id:"emergency_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),
    username:account,
    state:candidate,
    baseState:cloneCloudState(baseState&&typeof baseState==="object"?baseState:readCloudSyncBase(account)?.state||null),
    signature,
    signatureVersion:2,
    source:String(source||"이 기기의 로컬 복구본"),
    capturedAt:Date.now(),
    storagePersisted:true
  };
  nextSnapshot.storagePersisted=persistEmergencySnapshot(nextSnapshot);
  startupEmergencySnapshot=nextSnapshot;
  if(account&&nextSnapshot.storagePersisted)localStorage.removeItem(emergencySnapshotStorageKey(""));
  return startupEmergencySnapshot;
}

function getStartupEmergencySnapshot(){
  if(!currentUser)return null;
  const canRecover=isEmergencyRecoveryAccount(currentUser)||hasPersistentCloudDirty(currentUser)||!!readPersistedEmergencySnapshot(currentUser);
  if(!canRecover)return null;
  if(!startupEmergencySnapshot||![currentUser,""].includes(startupEmergencySnapshot.username)){
    startupEmergencySnapshot=readPersistedEmergencySnapshot(currentUser)||readPersistedEmergencySnapshot("");
  }
  if(!startupEmergencySnapshot||![currentUser,""].includes(startupEmergencySnapshot.username))return null;
  return cloneCloudState(startupEmergencySnapshot);
}

function getEmergencySnapshotSummary(state){
  const source=state&&typeof state==="object"?state:{},owned=Array.isArray(source.bucket)?source.bucket:[];
  const rank={"쓰레기":0,"일반":1,"희귀":2,"영웅":3,"전설":4,"신화":5,"초월":6,"영원":7,"공허":8};
  const fishPower=fish=>{const combat=fish?.combat||{},attack=Math.max(0,Number(combat.attack||0)),maxHp=Math.max(0,Number(combat.maxHp||combat.hp||0)),critRate=Math.max(0,Number(combat.critRate||0)),critDamage=Math.max(100,Number(combat.critDamage||150));return Math.floor(attack*(1+critRate/100*Math.max(0,critDamage/100-1))+maxHp*.2);};
  const battleFish=owned.filter(fish=>fish&&fish.grade!=="쓰레기"&&fish.combat),presetIds=Array.isArray(source.partyPresets?.pvp)?source.partyPresets.pvp.map(String):[];
  let pvpTeam=presetIds.map(id=>battleFish.find(fish=>String(fish.id||"")===id)).filter(Boolean).slice(0,3);
  if(pvpTeam.length<3)pvpTeam=[...battleFish].sort((a,b)=>fishPower(b)-fishPower(a)).slice(0,3);
  const featured=owned.filter(Boolean).map((fish,index)=>({fish,index})).sort((a,b)=>(rank[b.fish.grade]??-1)-(rank[a.fish.grade]??-1)||b.index-a.index).slice(0,5).map(item=>({name:String(item.fish.name||"이름 없는 물고기"),grade:String(item.fish.grade||"일반")}));
  const gradeSummary={};
  owned.forEach(fish=>{const grade=String(fish?.grade||"일반");gradeSummary[grade]=Number(gradeSummary[grade]||0)+1;});
  return {
    rodLevel:Math.max(1,Number(source.rodLevel||1)),
    money:normalizeMoney(source.money||0),
    totalEarned:normalizeMoney(source.totalEarned||0),
    totalFishingCount:Math.max(0,Number(source.totalFishingCount||0)),
    fishCount:owned.length,
    pvpPower:pvpTeam.reduce((sum,fish)=>sum+fishPower(fish),0),
    pvpTeam:pvpTeam.map(fish=>({name:String(fish.name||"이름 없는 물고기"),grade:String(fish.grade||"일반"),power:fishPower(fish)})),
    featured,
    gradeSummary
  };
}

function shouldOfferFishingLifeEmergencyRecovery(){
  const candidate=getStartupEmergencySnapshot();
  if(!candidate||!isMeaningfulEmergencyState(candidate.state))return false;
  const serverState=lastCloudSyncedState||getGameState();
  if(candidate.signature===emergencyRecoverySignature(serverState)){
    dismissStartupEmergencySnapshot();
    return false;
  }
  return true;
}

function dismissStartupEmergencySnapshot(){
  const account=startupEmergencySnapshot?.username||currentUser||"";
  try{
    localStorage.removeItem(emergencySnapshotStorageKey(account));
    if(account)localStorage.removeItem(emergencySnapshotStorageKey(""));
  }catch(e){console.error(e);}
  startupEmergencySnapshot=null;
}

function hasPendingEmergencyRecoveryDecision(){
  if(emergencyRestoreRunning||!currentUser||!lastCloudSyncedState)return false;
  return shouldOfferFishingLifeEmergencyRecovery();
}

function prepareEmergencyRecoveryOffer(){
  const snapshot=getStartupEmergencySnapshot();
  if(!snapshot||!shouldOfferFishingLifeEmergencyRecovery())return null;
  snapshot.offeredServerRevision=Number(cloudRevision||0);
  snapshot.offeredServerSignature=emergencyRecoverySignature(lastCloudSyncedState||getGameState());
  startupEmergencySnapshot=cloneCloudState(snapshot);
  const persistableSnapshot={...startupEmergencySnapshot,storagePersisted:true};
  startupEmergencySnapshot.storagePersisted=persistEmergencySnapshot(persistableSnapshot);
  return cloneCloudState(startupEmergencySnapshot);
}

function keepCurrentFirebaseEmergencyState(candidateId=""){
  const snapshot=getStartupEmergencySnapshot();
  if(!snapshot||candidateId&&snapshot.id!==candidateId||!currentUser)return {ok:false,message:"확인할 복구본을 찾지 못했습니다."};
  if(!lastCloudSyncedState)return {ok:false,message:"Firebase 현재 데이터를 아직 불러오지 못했습니다."};
  applyGameState(cloneCloudState(lastCloudSyncedState));
  cloudSyncedSeq=localSaveSeq;
  persistCloudSyncBase(currentUser,lastCloudSyncedState,cloudRevision);
  localStorage.setItem("textFishingSpeciesSizeSave",JSON.stringify(getGameState()));
  clearPersistentCloudDirty(currentUser);
  discardCloudRecovery(currentUser);
  dismissStartupEmergencySnapshot();
  setCloudSyncStatus("saved","Firebase 현재 데이터를 유지하도록 선택했습니다.");
  updateWallet();
  if(typeof globalThis.requestFishingLifeRender==="function")globalThis.requestFishingLifeRender(true);
  startServerAlertListener();
  return {ok:true};
}

async function restoreStartupEmergencySnapshot(candidateId=""){
  if(emergencyRestoreRunning)return {ok:false,error:"RESTORE_BUSY",message:"계정 복구를 처리하고 있습니다."};
  if(!(await checkGameVersion()))return {ok:false,error:"UPDATE_REQUIRED",message:"Firebase 안전 버전을 확인한 뒤 다시 시도해주세요."};
  const snapshot=getStartupEmergencySnapshot();
  const candidateBelongsToAccount=snapshot&&(snapshot.username===currentUser||snapshot.username===""&&isEmergencyRecoveryAccount(currentUser));
  if(!candidateBelongsToAccount||candidateId&&snapshot.id!==candidateId)return {ok:false,error:"CANDIDATE_INVALID",message:"현재 계정과 일치하는 복구본을 찾지 못했습니다."};
  if(!isMeaningfulEmergencyState(snapshot.state))return {ok:false,error:"CANDIDATE_EMPTY",message:"복구할 수 있는 계정 데이터가 없습니다."};

  emergencyRestoreRunning=true;
  isLoginPostProcessing=true;
  clearTimeout(cloudSaveTimer);
  clearTimeout(cloudSaveRetryTimer);
  cloudSaveTimer=null;
  cloudSaveRetryTimer=null;
  const account=currentUser,beforeState=cloneCloudState(getGameState());
  let committedState=null,committedRevision=cloudRevision,latestServerState=null,latestServerRevision=cloudRevision;

  try{
    cloudSaveChain=cloudSaveChain.catch(e=>{console.error(e);});
    await cloudSaveChain;
    if(currentUser!==account)throw new Error("ACCOUNT_CHANGED");

    applyGameState(cloneCloudState(snapshot.state));
    const mobile=typeof matchMedia==="function"&&matchMedia("(max-width: 850px)").matches;
    await migrateCombatStatsToCurrentVersionAsync(mobile?35:100,false);
    const preparedState=cloneCloudState(getGameState());
    applyGameState(beforeState);

    const sessionHash=await getCurrentSessionHash();
    if(!sessionHash)throw new Error("SESSION_INVALID");
    const ref=db.collection("users").doc(account);
    const commitEmergencyRestore=()=>db.runTransaction(async tx=>{
      const latestSnap=await tx.get(ref);
      if(!latestSnap.exists)throw new Error("ACCOUNT_NOT_FOUND");
      const data=latestSnap.data()||{};
      if(!isSessionHashValid(data,sessionHash))throw new Error("SESSION_INVALID");
      const serverState=data.gameState&&typeof data.gameState==="object"?data.gameState:{};
      latestServerState=cloneCloudState(serverState);
      latestServerRevision=Number(data.cloudRevision||0);
      if(data.lastEmergencyRecoveryId===snapshot.id){committedState=cloneCloudState(serverState);committedRevision=latestServerRevision;return;}
      const latestServerSignature=emergencyRecoverySignature(serverState);
      if(Number(snapshot.offeredServerRevision)!==latestServerRevision||snapshot.offeredServerSignature!==latestServerSignature)throw new Error("SERVER_CHANGED");
      try{localStorage.setItem("textFishingEmergencyServerBackup:"+account,JSON.stringify({state:serverState,revision:latestServerRevision,savedAt:Date.now(),recoveryId:snapshot.id}));}catch(e){console.error(e);}
      committedState=snapshot.baseState&&typeof snapshot.baseState==="object"?mergeCloudGameStates(preparedState,serverState,snapshot.baseState):cloneCloudState(preparedState);
      committedState.messages=mergeCloudArray(committedState.messages,serverState.messages,[]);
      committedState.notifications=mergeCloudArray(committedState.notifications,serverState.notifications,[]);
      committedState.seenUpdateNoticeIds=mergeUniqueStrings(serverState.seenUpdateNoticeIds,committedState.seenUpdateNoticeIds);
      committedState.dailyFishing=mergeDailyFishingState(committedState.dailyFishing,serverState.dailyFishing,serverState.dailyFishing);
      committedRevision=Number(data.cloudRevision||0)+1;
      const write=txSetProtectedUser(tx,ref,data,{
        nickname:account,
        money:normalizeMoney(committedState.money||0),
        rodLevel:Math.max(1,Number(committedState.rodLevel||1)),
        title:normalizeLegacyTitleName(committedState.equippedTitle||""),
        cloudRevision:committedRevision,
        lastEmergencyRecoveryId:snapshot.id,
        emergencyRecoveryVersion:GAME_VERSION,
        emergencyRecoveredAt:firebase.firestore.FieldValue.serverTimestamp(),
        gameState:committedState
      },"emergency_restore",{forceBackup:true});
      committedState=cloneCloudState(write.gameState);
      committedRevision=write.cloudRevision;
    });
    cloudSaveChain=cloudSaveChain.then(commitEmergencyRestore,commitEmergencyRestore);
    await cloudSaveChain;

    if(currentUser!==account)throw new Error("ACCOUNT_CHANGED");
    applyGameState(committedState);
    cloudRevision=committedRevision;
    cloudSyncedSeq=localSaveSeq;
    lastCloudSyncedState=cloneCloudState(committedState);
    persistCloudSyncBase(account,committedState,committedRevision);
    localStorage.setItem("textFishingSpeciesSizeSave",JSON.stringify(getGameState()));
    clearPersistentCloudDirty(account);
    discardCloudRecovery(account);
    dismissStartupEmergencySnapshot();
    updateWallet();
    setCloudSyncStatus("saved","선택한 브라우저 기록으로 Firebase 전체 복구를 완료했습니다.");
    if(typeof globalThis.requestFishingLifeRender==="function")globalThis.requestFishingLifeRender(true);
    return {ok:true,summary:getEmergencySnapshotSummary(committedState)};
  }catch(e){
    console.error(e);
    if(currentUser===account){
      if(e.message==="SERVER_CHANGED"&&latestServerState){
        applyGameState(latestServerState);
        cloudRevision=latestServerRevision;
        cloudSyncedSeq=localSaveSeq;
        lastCloudSyncedState=cloneCloudState(latestServerState);
        persistCloudSyncBase(account,latestServerState,latestServerRevision);
        if(!shouldProtectEmergencyOriginalLocalSave())localStorage.setItem("textFishingSpeciesSizeSave",JSON.stringify(getGameState()));
        if(startupEmergencySnapshot){startupEmergencySnapshot.offeredServerRevision=latestServerRevision;startupEmergencySnapshot.offeredServerSignature=emergencyRecoverySignature(latestServerState);persistEmergencySnapshot(startupEmergencySnapshot);}
      }else applyGameState(beforeState);
    }
    updateWallet();
    setCloudSyncStatus("error","전체 복구가 완료되지 않았습니다. 복구본은 그대로 보관 중입니다.");
    const message=e.message==="SESSION_INVALID"?"로그인 세션이 만료되었습니다. 다시 로그인한 뒤 재시도해주세요.":e.message==="ACCOUNT_NOT_FOUND"?"Firebase에서 계정을 찾지 못했습니다.":e.message==="ACCOUNT_CHANGED"?"로그인 계정이 바뀌어 복구를 중단했습니다.":e.message==="SERVER_CHANGED"?"비교 후 Firebase 데이터가 바뀌었습니다. 새로 도착한 데이터를 반영했으니 내용을 다시 확인해주세요.":"네트워크 저장이 완료되지 않았습니다. 복구본을 유지한 채 다시 시도해주세요.";
    return {ok:false,error:e.message||"RESTORE_FAILED",message};
  }finally{
    emergencyRestoreRunning=false;
    isLoginPostProcessing=false;
  }
}

function resetGameData(){
  cancelActiveFishing();
  clearTimeout(cloudSaveTimer);
  clearTimeout(cloudSaveRetryTimer);
  cloudSaveTimer = null;
  cloudSaveRetryTimer = null;
  cloudSaveRetryAttempt = 0;
  money = 0;
  totalEarned = 0;
  rodLevel = 1;
  bucket = [];
  collection = {};
  ranking = [];
  isFishing = false;
  totalFishingCount = 0;
  dailyFishing = {date:getLocalDateKey(),count:0};
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
  profileCosmetics = {border:"",aura:"",background:"",attackEffect:""};
  battleHistory = {boss:[],pvp:[]};
  seenUpdateNoticeIds = [];
  bossProgress = {defeated:{},difficultyClears:{},hp:{},materials:{},selectedDifficulty:"normal",cooldownUntil:0,cooldowns:{}};
  isBossMenu = false;
  bossPrepIndexes = [];
  pvpPrepIndexes = [];
  partyPresets = {boss:[],pvp:[]};
  fusionMainFishId = "";
  fusionMainFishIds = {};
  pendingPresetSaleId = "";
  pendingPresetSellAll = false;
  cloudRevision = 0;
  localSaveSeq = 0;
  cloudSyncedSeq = 0;
  lastCloudSyncedState = null;
  setCloudSyncStatus("offline");
  bucketSortOrder = "등급";
  localStorage.setItem("textFishingBucketSortOrder", bucketSortOrder);
  if(!shouldProtectEmergencyOriginalLocalSave())localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
}

function syncCloudSoon(){
  if(!currentUser||emergencyRestoreRunning) return;
  if(hasPendingEmergencyRecoveryDecision()){
    setCloudSyncStatus("error","이 기기의 계정 복구본을 먼저 확인해주세요.");
    return;
  }
  localSaveSeq++;
  markPersistentCloudDirty(currentUser);
  setCloudSyncStatus("saving","Firebase에 변경 내용을 저장하고 있습니다.");
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveCloudData, 700);
}

function saveCloudData(){
  if(emergencyRestoreRunning)return cloudSaveChain;
  if(hasPendingEmergencyRecoveryDecision()){
    setCloudSyncStatus("error","복구본 선택 전에는 Firebase 자동 저장을 잠시 멈춥니다.");
    return Promise.resolve(false);
  }
  if(cloudSaveTimer !== null){
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  cloudSaveChain = cloudSaveChain.then(saveCloudDataNow, saveCloudDataNow);
  return cloudSaveChain;
}

function queueProtectedCloudAction(action){
  const queued=cloudSaveChain.then(action,action);
  cloudSaveChain=queued;
  return queued;
}

async function saveCloudDataNow(){
  if(!currentUser) return;
  if(emergencyRestoreRunning||hasPendingEmergencyRecoveryDecision())return false;
  const userAtStart = currentUser;
  if(!(await checkGameVersion())){
    storeCloudRecovery(userAtStart,getGameState(),lastCloudSyncedState,true);
    return false;
  }
  const saveSeq = localSaveSeq;
  const localState = cloneCloudState(getGameState());
  const baseState = cloneCloudState(lastCloudSyncedState);
  const sessionHash = await getCurrentSessionHash();
  if(!sessionHash){scheduleCloudSaveRetry();return;}

  try{
    const ref = db.collection("users").doc(userAtStart);
    const expectedRevision = cloudRevision;
    let committedRevision=expectedRevision;
    let committedState=localState;
    let mergedConflict=false;

    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if(!snap.exists) throw new Error("ACCOUNT_NOT_FOUND");

      const data = snap.data() || {};
      if(!isSessionHashValid(data,sessionHash)) throw new Error("SESSION_INVALID");

      const serverRevision = Number(data.cloudRevision || 0);
      mergedConflict=serverRevision!==expectedRevision;
      committedState=mergedConflict?mergeCloudGameStates(localState,data.gameState,baseState):localState;
      committedRevision=serverRevision+1;

      const write=txSetProtectedUser(tx,ref,data,{
        nickname: userAtStart,
        money: normalizeMoney(committedState.money),
        rodLevel:Number(committedState.rodLevel||1),
        title: normalizeLegacyTitleName(committedState.equippedTitle||""),
        cloudRevision: committedRevision,
        gameState: committedState
      },"autosave");
      committedState=cloneCloudState(write.gameState);
      committedRevision=write.cloudRevision;
    });

    if(currentUser === userAtStart){
      cloudRevision = committedRevision;
      cloudSyncedSeq = Math.max(cloudSyncedSeq, saveSeq);
      lastCloudSyncedState=cloneCloudState(committedState);
      persistCloudSyncBase(userAtStart,committedState,committedRevision);
      cloudSaveRetryAttempt=0;
      clearTimeout(cloudSaveRetryTimer);cloudSaveRetryTimer=null;
      if(localSaveSeq===saveSeq&&mergedConflict){
        applyGameState(committedState);
        migrateCombatStatsToCurrentVersion();
        localStorage.setItem("textFishingSpeciesSizeSave",JSON.stringify(getGameState()));
        updateWallet();
      }
      const pending=hasPendingLocalCloudChanges();
      if(!pending)clearPersistentCloudDirty(userAtStart);
      setCloudSyncStatus(pending?"saving":"saved",pending?"새 변경 내용을 계속 저장하고 있습니다.":"Firebase 저장이 완료되었습니다.");
    }
  }catch(e){
    console.error(e);
    if(e.message === "SESSION_INVALID"){
      forceSessionLogout("이 계정의 접속이 끝났습니다. 다시 로그인해주세요.");
    }else if(e.message === "ACCOUNT_NOT_FOUND"){
      setCloudSyncStatus("error","Firebase 계정을 찾을 수 없습니다.");
    }else if(e.message === "PROGRESS_REGRESSION_BLOCKED"){
      storeCloudRecovery(userAtStart,localState,baseState,true);
      setCloudSyncStatus("error","낮아진 진행도의 저장을 차단했습니다. 이 기기의 데이터는 복구용으로 보관했습니다.");
      if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"진행도 감소 차단",detail:"낚싯대 레벨·낚시 횟수·누적 수익이 서버 기록보다 낮아 저장을 중단했습니다.",kind:"danger",icon:"🛡️"});
    }else if(e.message === "USER_STATE_TOO_LARGE"){
      storeCloudRecovery(userAtStart,localState,baseState,true);
      setCloudSyncStatus("error","계정 데이터가 안전 저장 크기를 넘어 Firebase 쓰기를 중단했습니다.");
      if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"계정 저장 용량 경고",detail:"물고기와 전투 기록이 많아졌습니다. 데이터는 이 기기에 보관했으며 양동이 분리 저장 업데이트가 필요합니다.",kind:"danger",icon:"🗄️",duration:8000});
    }else if(handleProtectedWriteError(e,userAtStart,localState,baseState)){
      return false;
    }else{
      scheduleCloudSaveRetry();
      if(cloudSaveRetryAttempt===1&&typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"클라우드 저장 지연",detail:"데이터는 이 기기에 보관 중이며 자동으로 다시 저장합니다.",kind:"danger",icon:"☁️"});
    }
  }
}

function hasPendingLocalCloudChanges(){
  return !!currentUser && localSaveSeq > cloudSyncedSeq;
}

async function refreshMyCloudData(force=false){
  if(!currentUser) return false;
  if(emergencyRestoreRunning||hasPendingEmergencyRecoveryDecision())return false;
  if(hasPendingLocalCloudChanges()){
    await saveCloudData();
    if(hasPendingLocalCloudChanges())return false;
  }

  try{
    const snap = await db.collection("users").doc(currentUser).get();
    if(!snap.exists) return false;

    const data = snap.data();
    if(!(await hasValidSession(data))) throw new Error("SESSION_INVALID");
    const hadPending=hasPendingLocalCloudChanges();
    const nextState=hadPending?mergeCloudGameStates(getGameState(),data.gameState,lastCloudSyncedState):data.gameState;
    applyGameState(nextState);
    cloudRevision = Number(data.cloudRevision || 0);
    lastCloudSyncedState=cloneCloudState(data.gameState);
    persistCloudSyncBase(currentUser,data.gameState,cloudRevision);
    if(!hadPending)cloudSyncedSeq = localSaveSeq;
    migrateCombatStatsToCurrentVersion();
    localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
    updateWallet();
    if(hadPending)saveCloudData();
    else{clearPersistentCloudDirty(currentUser);setCloudSyncStatus("saved","Firebase의 최신 데이터를 불러왔습니다.");}

    return true;
  }catch(e){
    console.error(e);
    if(e.message === "SESSION_INVALID"){
      forceSessionLogout("이 계정의 접속이 끝났습니다. 다시 로그인해주세요.");
    }
    return false;
  }
}

async function removeRealtimeNotification(matchText){
  if(!currentUser || !matchText) return;
  if(emergencyRestoreRunning||hasPendingEmergencyRecoveryDecision())return;
  if(!(await checkGameVersion()))return;
  if(hasPendingLocalCloudChanges()){
    await saveCloudData();
    if(hasPendingLocalCloudChanges()){
      setTimeout(()=>removeRealtimeNotification(matchText),3000);
      return;
    }
  }

  try{
    const ref = db.collection("users").doc(currentUser);
    const sessionHash = await getCurrentSessionHash();
    const saveSeq=localSaveSeq;
    const localState=cloneCloudState(getGameState());
    const baseState=cloneCloudState(lastCloudSyncedState);
    let committedRevision = null;
    let committedState = null;

    await db.runTransaction(async (tx)=>{
      committedRevision = null;
      committedState = null;
      const snap = await tx.get(ref);
      if(!snap.exists) return;

      const data = snap.data();
      if(!isSessionHashValid(data,sessionHash)) throw new Error("SESSION_INVALID");
      const state = mergeCloudGameStates(localState,data.gameState,baseState);
      const list = Array.isArray(state.notifications) ? state.notifications : [];

      const filtered = list.filter(msg => !String(msg).includes(matchText));
      committedState = {...state, notifications: filtered};
      const write=txSetProtectedUser(tx,ref,data,{
        cloudRevision: Number(data.cloudRevision || 0) + 1,
        gameState: committedState
      },"notification_read");
      committedState=write.gameState;
      committedRevision = write.cloudRevision;
    });

    if(committedRevision !== null) cloudRevision = committedRevision;
    if(committedRevision !== null) cloudSyncedSeq = Math.max(cloudSyncedSeq,saveSeq);
    if(committedState){lastCloudSyncedState=cloneCloudState(committedState);persistCloudSyncBase(currentUser,committedState,committedRevision);}
    if(committedState){
      if(localSaveSeq===saveSeq)applyGameState(committedState);
      migrateCombatStatsToCurrentVersion();
      localStorage.setItem("textFishingSpeciesSizeSave", JSON.stringify(getGameState()));
      updateWallet();
      setCloudSyncStatus(hasPendingLocalCloudChanges()?"saving":"saved");
    }
  }catch(e){
    console.error(e);
    if(e.message==="USER_STATE_TOO_LARGE"){
      storeCloudRecovery(currentUser,localState,baseState,true);
      setCloudSyncStatus("error","계정 데이터가 안전 저장 크기를 넘어 알림 동기화를 중단했습니다.");
    }else if(!handleProtectedWriteError(e,currentUser,localState,baseState))scheduleCloudSaveRetry();
  }
}

async function registerUser(providedNickname,providedPassword){
  if(currentUser) return print("먼저 로그아웃한 뒤 새 계정을 만들어주세요.");
  if(!(await checkGameVersion())) return {ok:false};
  const formRegister=typeof providedNickname==="string"||typeof providedPassword==="string";
  const nickname=cleanNickname(formRegister?providedNickname:prompt("닉네임을 입력하세요."));
  const password=String(formRegister?providedPassword:(nickname?prompt("비밀번호를 입력하세요."):"")||"");
  const setLoginProgress=(message,kind="loading")=>{if(typeof globalThis.updateFishingLifeLoginStatus==="function")globalThis.updateFishingLifeLoginStatus(message,kind);};
  if(!nickname){setLoginProgress("닉네임을 입력해주세요.","error");return {ok:false};}
  if(password.length<4){setLoginProgress("비밀번호는 4자 이상 입력해주세요.","error");return {ok:false};}

  try{
    const ref = db.collection("users").doc(nickname);
    const passwordHash = await hashPassword(password);
    const sessionTokenHash = await startUserSession(nickname);
    const sessionRef=db.collection("accountSessions").doc(nickname);
    resetGameData();
    await db.runTransaction(async tx => {
      const latest = await tx.get(ref);
      if(latest.exists) throw new Error("NICKNAME_TAKEN");
      const freshState=createFreshAccountState(),serverTime=firebase.firestore.FieldValue.serverTimestamp();
      txSetProtectedUser(tx,ref,null,{
        nickname,
        passwordHash,
        sessionTokenHash,
        sessionTokens:{},
        activeSessionDeviceId:getCloudDeviceId(),
        activeSessionTokenHash:sessionTokenHash,
        activeSessionSeenAt:serverTime,
        accountResetVersion:ACCOUNT_RESET_VERSION,
        cloudRevision: 0,
        money: 0,
        rodLevel: 1,
        title: "",
        createdAt: serverTime,
        gameState:freshState
      },"register",{create:true,backup:false});
      tx.set(sessionRef,{nickname,deviceId:getCloudDeviceId(),tokenHash:sessionTokenHash,updatedAtMillis:Date.now(),updatedAt:serverTime});
    });

    currentUser = nickname;
    localStorage.setItem("textFishingCurrentUser", currentUser);
    localStorage.setItem("textFishingLastLoginNickname",currentUser);
    clearOldAccountData(currentUser);
    applyGameState(createFreshAccountState());
    lastCloudSyncedState=cloneCloudState(getGameState());
    persistCloudSyncBase(currentUser,lastCloudSyncedState,cloudRevision);
    clearPersistentCloudDirty(currentUser);
    setCloudSyncStatus("saved","새 계정이 Firebase에 저장되었습니다.");

    updateWallet();
    startServerAlertListener();
    startOnlinePresence();
    startAccountSessionHeartbeat();
    setLoginProgress("새 계정을 만들었습니다!","success");
    if(typeof globalThis.completeFishingLifeLogin==="function")globalThis.completeFishingLifeLogin(nickname);
    print(nickname + " 님 회원가입 완료.\nLv.1부터 새로 시작합니다.");
    return {ok:true};
  }catch(e){
    console.error(e);
    clearUserSession();
    const message=e.message==="NICKNAME_TAKEN"?"이미 사용 중인 닉네임입니다.":e.message==="USER_STATE_TOO_LARGE"?"새 계정 저장 공간을 확인하지 못했습니다.":"계정을 만들지 못했습니다. 잠시 후 다시 시도해주세요.";
    setLoginProgress(message,"error");
    if(!formRegister)print(message);
    return {ok:false,error:e.message};
  }
}

async function loginUser(providedNickname,providedPassword){
  if(currentUser)return print("다른 계정으로 로그인하려면 먼저 로그아웃해주세요.");
  if(!(await checkGameVersion()))return {ok:false};
  const formLogin=typeof providedNickname==="string"||typeof providedPassword==="string";
  const nickname=cleanNickname(formLogin?providedNickname:prompt("닉네임을 입력하세요."));
  const password=String(formLogin?providedPassword:(nickname?prompt("비밀번호를 입력하세요."):"")||"");
  const setLoginProgress=(message,kind="loading")=>{if(typeof globalThis.updateFishingLifeLoginStatus==="function")globalThis.updateFishingLifeLoginStatus(message,kind);};
  if(!nickname){setLoginProgress("닉네임을 입력해주세요.","error");if(!formLogin)print("로그인이 취소되었습니다.");return {ok:false};}
  if(!password){setLoginProgress("비밀번호를 입력해주세요.","error");if(!formLogin)print("비밀번호를 입력해야 합니다.");return {ok:false};}

  setLoginProgress("Firebase에서 계정을 확인하고 있습니다.");
  const ref=db.collection("users").doc(nickname);
  const sessionRef=db.collection("accountSessions").doc(nickname);
  const passwordHash=await hashPassword(password);
  const sessionTokenHash=await startUserSession(nickname);
  let loginData=null,nextRevision=0;
  let accountWasReset=false;

  try{
    await db.runTransaction(async tx=>{
      const latestSnap=await tx.get(ref);
      if(!latestSnap.exists)throw new Error("ACCOUNT_NOT_FOUND");
      const sessionSnap=await tx.get(sessionRef);
      const latest=latestSnap.data()||{};
      if(latest.passwordHash!==passwordHash)throw new Error("WRONG_PASSWORD");
      const activeSession=sessionSnap.exists?(sessionSnap.data()||{}):null;
      if(isOtherDeviceSessionActive(activeSession))throw new Error("SESSION_IN_USE");
      accountWasReset=Number(latest.accountResetVersion||0)<ACCOUNT_RESET_VERSION;
      const nextState=accountWasReset?createFreshAccountState():cloneCloudState(latest.gameState||createFreshAccountState());
      const serverTime=firebase.firestore.FieldValue.serverTimestamp();
      const write=txSetProtectedUser(tx,ref,latest,{
        sessionTokenHash,
        sessionTokens:{},
        activeSessionDeviceId:getCloudDeviceId(),
        activeSessionTokenHash:sessionTokenHash,
        activeSessionSeenAt:serverTime,
        accountResetVersion:ACCOUNT_RESET_VERSION,
        cloudRevision:Number(latest.cloudRevision||0)+1,
        money:Number(nextState.money||0),
        rodLevel:Number(nextState.rodLevel||1),
        title:String(nextState.equippedTitle||""),
        gameState:nextState
      },accountWasReset?"full_account_reset":"login",{allowAccountReset:accountWasReset,backup:!accountWasReset});
      tx.set(sessionRef,{nickname,deviceId:getCloudDeviceId(),tokenHash:sessionTokenHash,updatedAtMillis:Date.now(),updatedAt:serverTime});
      nextRevision=write.cloudRevision;
      loginData={...latest,money:write.money,rodLevel:write.rodLevel,title:write.title,gameState:cloneCloudState(write.gameState)};
    });
  }catch(e){
    console.error(e);
    clearUserSession();
    const pendingRecovery=peekCloudRecovery(nickname);
    const protectedWriteBlocked=handleProtectedWriteError(e,nickname,pendingRecovery?.localState||null,pendingRecovery?.baseState||null);
    const message=e.message==="ACCOUNT_NOT_FOUND"?"존재하지 않는 닉네임입니다.":e.message==="WRONG_PASSWORD"?"비밀번호가 틀렸습니다.":e.message==="SESSION_IN_USE"?"이미 다른 기기에서 접속 중입니다. 그 기기에서 로그아웃한 뒤 다시 시도해주세요.":protectedWriteBlocked?"최신 FishingLife 파일로 다시 접속해주세요.":e.message==="USER_STATE_TOO_LARGE"?"계정 데이터가 커서 초기화를 완료하지 못했습니다.":"네트워크가 불안정합니다. 잠시 후 다시 시도해주세요.";
    setLoginProgress(message,"error");
    if(!formLogin)print(message);
    return {ok:false,error:e.message};
  }

  try{
    isLoginPostProcessing=true;
    currentUser=nickname;
    localStorage.setItem("textFishingCurrentUser",currentUser);
    localStorage.setItem("textFishingLastLoginNickname",currentUser);
    if(accountWasReset)clearOldAccountData(nickname);
    applyGameState(loginData.gameState);
    cloudRevision=nextRevision;
    cloudSyncedSeq=localSaveSeq;
    lastCloudSyncedState=cloneCloudState(loginData.gameState);
    persistCloudSyncBase(nickname,loginData.gameState,nextRevision);
    updateWallet();
    clearPersistentCloudDirty(nickname);
    setCloudSyncStatus("saved",accountWasReset?"계정을 Lv.1로 초기화했습니다.":"계정 데이터를 불러왔습니다.");
    setLoginProgress(accountWasReset?"초기화 완료! Lv.1부터 시작합니다.":"로그인 완료! 게임을 시작합니다.","success");
    if(typeof globalThis.completeFishingLifeLogin==="function")globalThis.completeFishingLifeLogin(nickname);
    print(nickname+" 님 로그인 완료.\n게임을 시작할 수 있습니다.");
  }catch(e){
    console.error(e);
    currentUser=null;
    localStorage.removeItem("textFishingCurrentUser");
    clearUserSession();
    isLoginPostProcessing=false;
    setLoginProgress("게임 데이터를 불러오지 못했습니다.","error");
    return {ok:false,error:"APPLY_FAILED"};
  }

  try{
    await yieldLoginWork();
    startServerAlertListener();
    startOnlinePresence();
    startAccountSessionHeartbeat();
    const mobile=typeof matchMedia==="function"&&matchMedia("(max-width: 850px)").matches;
    const combatChanged=await migrateCombatStatsToCurrentVersionAsync(mobile?35:100,false);
    const titlesChanged=checkSpecialTitles();
    if(combatChanged||titlesChanged.length)saveGame();
    updateWallet();
  }catch(e){
    console.error(e);
  }finally{
    isLoginPostProcessing=false;
    if(typeof globalThis.requestFishingLifeRender==="function")globalThis.requestFishingLifeRender(true);
  }

  setTimeout(async()=>{
    try{
      await showUpdateNoticeIfNeeded();
      await showNewNotifications();
      await showNewMessages();
    }
    catch(e){console.error(e);}
  },50);
  return {ok:true};
}

async function logoutUser(){
  if(!currentUser) return print("로그인 상태가 아닙니다.");
  if(isOnlineActionRunning)return print("송금·물고기 전송·메시지 처리가 끝난 뒤 로그아웃해주세요.");
  const old = currentUser;
  await saveCloudData();
  if(hasPendingLocalCloudChanges()){
    setCloudSyncStatus("retry","저장이 끝나면 다시 로그아웃해주세요.");
    return print("Firebase 저장이 아직 끝나지 않았습니다. 데이터 보호를 위해 로그아웃을 잠시 멈췄습니다.");
  }
  stopServerAlertListener();
  stopOnlinePresence();
  await releaseAccountSession(old);
  currentUser = null;
  localStorage.removeItem("textFishingCurrentUser");
  clearUserSession();
  resetGameData();
  updateWallet();
  print(old + " 님 로그아웃 완료.\n\n다른 계정을 사용하려면 로그인 또는 회원가입을 해주세요.");
  if(typeof globalThis.openFishingLifeLogin==="function")setTimeout(()=>globalThis.openFishingLifeLogin(),50);
}

async function deleteAccount(password=""){
  if(!currentUser)return {ok:false,message:"로그인 상태가 아닙니다."};
  if(isOnlineActionRunning)return {ok:false,message:"진행 중인 전송이 끝난 뒤 다시 시도해주세요."};
  const username=currentUser,sessionHash=await getCurrentSessionHash();
  if(!sessionHash)return {ok:false,message:"로그인 정보가 만료되었습니다. 다시 로그인해주세요."};
  const passwordHash=await hashPassword(String(password||""));
  try{
    const userRef=db.collection("users").doc(username),sessionRef=db.collection("accountSessions").doc(username);
    await db.runTransaction(async tx=>{
      const userSnap=await tx.get(userRef);
      if(!userSnap.exists)throw new Error("ACCOUNT_NOT_FOUND");
      const sessionSnap=await tx.get(sessionRef);
      const data=userSnap.data()||{},session=sessionSnap.exists?(sessionSnap.data()||{}):{};
      if(data.passwordHash!==passwordHash)throw new Error("WRONG_PASSWORD");
      if(!isSessionHashValid(data,sessionHash)||session.tokenHash!==sessionHash)throw new Error("SESSION_INVALID");
      for(let slot=0;slot<ACCOUNT_BACKUP_SLOT_COUNT;slot++)tx.delete(userRef.collection("backups").doc("slot"+slot));
      tx.delete(userRef);
      if(sessionSnap.exists)tx.delete(sessionRef);
    });
    stopServerAlertListener();
    stopOnlinePresence();
    stopAccountSessionHeartbeat();
    clearOldAccountData(username);
    localStorage.removeItem("textFishingCurrentUser");
    if(localStorage.getItem("textFishingLastLoginNickname")===username)localStorage.removeItem("textFishingLastLoginNickname");
    currentUser=null;
    clearUserSession();
    resetGameData();
    updateWallet();
    if(typeof globalThis.requestFishingLifeRender==="function")globalThis.requestFishingLifeRender(true);
    return {ok:true,username};
  }catch(error){
    console.error(error);
    const message=error?.message==="WRONG_PASSWORD"?"비밀번호가 틀렸습니다.":error?.message==="SESSION_INVALID"?"로그인 정보가 만료되었습니다. 다시 로그인해주세요.":error?.message==="ACCOUNT_NOT_FOUND"?"이미 삭제된 계정입니다.":"계정을 삭제하지 못했습니다. 네트워크를 확인해주세요.";
    return {ok:false,message,error:error?.message||"DELETE_FAILED"};
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
  if(emergencyRestoreRunning||hasPendingEmergencyRecoveryDecision())return;
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
          if(typeof globalThis.showWorldCatchAlert==="function"){
            globalThis.showWorldCatchAlert({nickname:sender,fishName,fishGrade:data.fishGrade||"영원"});
          }else{
            print("📢 알림\n\n" + sender + " 님이 " + color(fishName, data.fishGrade || "영원") + objParticle(data.fishName) + " 낚았습니다.");
          }
          return;
        }

        if(data.type === "moneyTransfer"){
          if(data.to !== currentUser) return;

          const sender = formatUserName(data.from, data.fromTitle);
          const amountText = Number(data.amount || 0).toLocaleString() + "원을 송금했습니다.";

          print("📢 알림\n\n" + sender + " 님이 " + amountText);
          removeRealtimeNotification(amountText);
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
          const fishCount=Math.max(1,Number(data.fishCount||1));
          print("📢 알림\n\n" + sender + " 님이 " + (fishCount>1?`물고기 ${fishCount.toLocaleString()}마리를 전송했습니다.`:color(lineFish(fish), fish.grade) + objParticle(data.fishName) + " 전송했습니다."));
          removeRealtimeNotification(fishText);
          return;
        }


        if(data.type === "pvpRequest"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          if(typeof globalThis.showPvpRequestAlert==="function")globalThis.showPvpRequestAlert({roomId:data.roomId,from:data.from,fromTitle:data.fromTitle||"",sender});
          else print("⚔️ 대전 신청\n\n" + sender + " 님이 대전을 신청했습니다.\n\n대전수락\n대전거절");
          return;
        }

        if(data.type === "pvpAccepted"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 수락\n\n" + sender + " 님이 대전을 수락했습니다.\n\n이제 대전준비 번호 로 물고기를 고르고 대전준비완료 를 입력하세요.");
          if(typeof globalThis.openPvpPanel==="function")setTimeout(()=>globalThis.openPvpPanel(),80);
          return;
        }

        if(data.type === "pvpReady"){
          if(data.to !== currentUser) return;
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 준비완료\n\n" + sender + " 님이 준비완료했습니다.");
          if(typeof globalThis.openPvpPanel==="function")setTimeout(()=>globalThis.openPvpPanel(),80);
          return;
        }

        if(data.type === "pvpCancelled"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
          saveGame();
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 취소\n\n" + sender + " 님이 대전을 취소했습니다.");
          return;
        }

        if(data.type === "pvpRejected"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
          saveGame();
          const sender = formatUserName(data.from, data.fromTitle);
          print("⚔️ 대전 거절\n\n" + sender + " 님이 대전 신청을 거절했습니다.");
          return;
        }

        if(data.type === "pvpResult"){
          if(data.to !== currentUser) return;
          pvpPrepIndexes = [];
          if(typeof globalThis.hidePvpRequestAlert==="function")globalThis.hidePvpRequestAlert();
          const replay=data.replay?addBattleHistory("pvp",data.replay):null;
          saveGame();
          if(replay&&typeof globalThis.openPvpBattleReplay==="function")globalThis.openPvpBattleReplay(replay);
          else printPvpResultPreview(data.summary || "대전 결과", data.fullLog || "상세 로그가 없습니다.");
          return;
        }

        if(data.type === "userMessage"){
          if(data.to !== currentUser) return;

          const sender = formatUserName(data.from, data.fromTitle);
          const body = safeMessageText(data.text);

          print(sender + " 님이 메세지를 보냈습니다.\n\n" + body);
          setTimeout(()=>refreshMyCloudData(),300);
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
  const battleClasses = new Set([
    "battle-event", "battle-event--skill", "battle-event--crazy", "battle-event--passive", "battle-event--phase", "battle-event--ally",
    "battle-event--void", "battle-event--void-letter-one", "battle-event--void-letter-two", "battle-event--void-letter-three",
    "battle-event--void-observer", "battle-event--void-anomaly",
    "battle-event__eyebrow", "battle-event__body"
  ]);

  [...template.content.querySelectorAll("*")].reverse().forEach(el => {
    if(!allowedTags.has(el.tagName)){
      el.replaceWith(document.createTextNode(el.textContent || ""));
      return;
    }

    [...el.attributes].forEach(attr => {
      const isSafeColor = el.tagName === "SPAN" && attr.name === "style" &&
        /^color:\s*#[0-9a-fA-F]{3,8}\s*;?$/.test(attr.value);
      const isSafeBattleClass = el.tagName === "SPAN" && attr.name === "class" &&
        attr.value.split(/\s+/).every(name => battleClasses.has(name));
      if(!isSafeColor && !isSafeBattleClass) el.removeAttribute(attr.name);
    });
  });

  return template.innerHTML;
}
function appendLogHtml(value){
  log.insertAdjacentHTML("beforeend", sanitizeGameHtml(value));
  log.scrollTop=log.scrollHeight;
}
function print(t){
  const value=String(t??""),plainValue=value.replace(/<[^>]*>/g,"").replace(/\n{3,}/g,"\n\n").trim();
  const compactNotice=plainValue.length>0&&plainValue.length<=260&&plainValue.split("\n").length<=8&&!/battle-event|HP\s*[█▓▒░]|━━━━━━━━|────/.test(value);
  if(compactNotice&&typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice(value);
  else appendLogHtml(value+"\n\n");
  updateWallet();
}

function openModal(title, content){
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = sanitizeGameHtml(content);
  document.getElementById("modalOverlay").style.display = "block";
}
function closeModal(force=false){
  if(!force&&!currentUser){
    if(typeof globalThis.openFishingLifeLogin==="function")globalThis.openFishingLifeLogin("로그인해야 게임을 시작할 수 있습니다.");
    return;
  }
  if(!force&&emergencyRestoreRunning){
    if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"계정 복구 저장 중",detail:"Firebase 저장이 끝날 때까지 잠시 기다려주세요.",kind:"info",icon:"🛟"});
    return;
  }
  if(!force&&typeof hasPendingEmergencyRecoveryDecision==="function"&&hasPendingEmergencyRecoveryDecision()){
    if(typeof globalThis.showFishingLifeNotice==="function")globalThis.showFishingLifeNotice({title:"복구 기록 선택 필요",detail:"Firebase 현재 기록과 이 기기의 미저장 기록 중 하나를 먼저 확인해주세요.",kind:"info",icon:"🛟"});
    if(typeof globalThis.offerFishingLifeEmergencyRecovery==="function")globalThis.offerFishingLifeEmergencyRecovery();
    return;
  }
  if(!force&&cloudGameReadOnlyBlocked){
    if(typeof globalThis.showFishingLifeVersionBlocker==="function")globalThis.showFishingLifeVersionBlocker(cloudVersionGateMessage);
    return;
  }
  if(!force&&typeof globalThis.isFishingLifeBattleLocked==="function"&&globalThis.isFishingLifeBattleLocked()){
    if(typeof globalThis.showFishingLifeBattleLockNotice==="function")globalThis.showFishingLifeBattleLockNotice();
    return;
  }
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
  if(!currentUser)return;
  if(!shouldProtectEmergencyOriginalLocalSave())localStorage.setItem("textFishingSpeciesSizeSave",JSON.stringify(getGameState()));
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
    dailyFishing=normalizeDailyFishing(s.dailyFishing);
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
    profileCosmetics=normalizeProfileCosmetics(s.profileCosmetics);
    battleHistory=normalizeBattleHistory(s.battleHistory);
    seenUpdateNoticeIds=normalizeUpdateNoticeIds(s.seenUpdateNoticeIds, s.lastSeenUpdateVersion);
    bossProgress=normalizeBossProgress(s.bossProgress);
    pvpPrepIndexes=Array.isArray(s.pvpPrepIndexes)?s.pvpPrepIndexes:[];
    partyPresets=normalizePartyPresets(s.partyPresets);
    fusionMainFishId=String(s.fusionMainFishId||"");
    fusionMainFishIds=s.fusionMainFishIds&&typeof s.fusionMainFishIds==="object"?{...s.fusionMainFishIds}:{};
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

  // 보스전 중 임시 최대 체력 증감은 전투 규칙이 관리한다.
  // 여기서 훈련 수치를 다시 맞추면 현재 체력까지 완전히 회복되는 문제가 생긴다.
  if(c._traitBattle) return c;

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
    if(c.knockedOut || c.status === "기절" || Number(c.hp || 0) <= 0) c.hp = 0;
    else if(c.status === "정상") c.hp = newMaxHp;
    else c.hp = Math.max(1, Math.min(newMaxHp, Math.floor(newMaxHp * hpRatio)));
    c._trainingHpLevel = hpLevel;
  } else {
    c.maxHp = newMaxHp;
  }

  c.critDamage = Math.floor(c._baseCritDamage + getProgressiveTrainingBonus(critDamageLevel));

  return c;
}





