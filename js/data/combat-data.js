const COMBAT_VERSION = 14;

const combatAttackRanges = {
  "일반":[30,150], "희귀":[100,500], "영웅":[500,2000], "전설":[2000,8000],
  "신화":[8000,20000], "초월":[20000,50000], "영원":[150000,300000], "공허":[400000,800000]
};

const combatHpRanges = {
  "일반":[150,900], "희귀":[500,3000], "영웅":[2500,12000], "전설":[10000,80000],
  "신화":[40000,180000], "초월":[120000,500000], "영원":[600000,1500000], "공허":[2000000,5000000]
};

const materialInfo = {
  "심연의 촉수":"크라켄에게서 얻을 수 있는 촉수 조각.",
  "히드라의 독니":"히드라에게서 얻을 수 있는 맹독이 서린 독니.",
  "리바이어던의 코어":"리바이어던에게서 얻을 수 있는 심해의 코어.",
  "고대의 비늘":"베히모스에게서 얻을 수 있는 단단한 고대 비늘.",
  "불멸의 깃털":"피닉스에게서 얻을 수 있는 꺼지지 않는 불꽃의 깃털.",
  "용왕의 심장":"바하무트에게서 얻을 수 있는 용왕의 심장.",
  "혼돈의 파편":"티아마트에게서 얻을 수 있는 혼돈의 파편.",
  "세계뱀의 비늘":"요르문간드에게서 얻을 수 있는 거대한 비늘.",
  "글레이프니르의 파편":"펜리르를 묶고 있던 마법 족쇄의 파편.",
  "무스펠의 불꽃":"수르트의 불꽃검에서 떨어져 나온 꺼지지 않는 불꽃.",
  "명계의 송곳니":"명계의 문을 지키는 케르베로스의 송곳니.",
  "세계수의 썩은 뿌리":"니드호그가 갉아 먹어 부패한 세계수의 뿌리.",
  "다마반드의 사슬":"아지다하카를 다마반드 산에 묶어 둔 신성한 사슬.",
  "폭풍의 심장":"대지와 하늘을 뒤엎는 타이폰의 폭풍이 응축된 핵.",
  "파멸의 근원":"선한 창조를 부정하는 앙그라 마이뉴의 절대악이 응축된 근원.",
  "원초의 어둠":"에레보스가 삼킨 빛이 굳어 만들어진 공허의 결정.",
  "시간의 파편":"크로노스의 끊어진 시간선에서 떨어져 나온 파편.",
  "천 번째 가면":"니알라토텝이 마지막까지 감추고 있던 공허의 가면.",
  "은빛 열쇠":"요그 소토스의 무한한 문을 여는 은빛 열쇠.",
  "혼돈의 핵":"아자토스의 잠든 혼돈이 응축된 최종 공허의 핵."
};

const BOSS_DIFFICULTY_ORDER = ["normal","hard","crazy"];
const BOSS_DIFFICULTIES = {
  normal:{id:"normal",name:"일반",hpMultiplier:1,attackMultiplier:1,dodgeBonus:0,skillMultiplier:1,rewardMultiplier:0.5,coreMin:1,coreMax:3},
  hard:{id:"hard",name:"어려움",hpMultiplier:10,attackMultiplier:4,dodgeBonus:5,skillMultiplier:1.15,rewardMultiplier:0.7,coreMin:3,coreMax:5},
  crazy:{id:"crazy",name:"크레이지",hpMultiplier:50,attackMultiplier:10,dodgeBonus:10,skillMultiplier:1.30,rewardMultiplier:1,coreMin:5,coreMax:10}
};

const bossList = [
  {
    id:"kraken", name:"크라켄", grade:"영웅", color:"#6f9dff",
    hp:50000, attack:2500, dodge:5, critRate:10, critDamage:180, skillRate:25,
    reward:100000000, drop:"심연의 촉수",
    skillName:"촉수 강타", skillDesc:"공격력 150% 피해",
    desc:"깊은 심해에 숨어있던 거대 크라켄.\n수많은 낚시꾼들을 바다 아래로 끌고 갔다."
  },
  {
    id:"hydra", name:"히드라", grade:"영웅", color:"#6f9dff",
    hp:150000, attack:6000, dodge:7, critRate:12, critDamage:190, skillRate:25,
    reward:500000000, drop:"히드라의 독니",
    skillName:"독니 물어뜯기", skillDesc:"공격력 180% 피해",
    desc:"바다 깊은 곳에서 여러 머리를 숨긴 채 먹잇감을 기다리는 괴수.\n잘려도 다시 돋아나는 머리로 적을 압박한다."
  },
  {
    id:"leviathan", name:"리바이어던", grade:"전설", color:"#ffa657",
    hp:500000, attack:12000, dodge:12, critRate:15, critDamage:220, skillRate:20,
    reward:2500000000, drop:"리바이어던의 코어",
    skillName:"대해일", skillDesc:"준비된 모든 물고기에게 공격력 100% 피해",
    desc:"전설 속에서만 존재한다고 여겨졌던 심해의 지배자.\n거대한 몸으로 바다를 가르며 지나갈 때마다\n수많은 생명체가 모습을 감춘다고 한다."
  },
  {
    id:"behemoth", name:"베히모스", grade:"전설", color:"#ffa657",
    hp:1500000, attack:25000, dodge:8, critRate:18, critDamage:240, skillRate:20,
    reward:10000000000, drop:"고대의 비늘",
    skillName:"대지 붕괴", skillDesc:"공격력 250% 피해",
    desc:"대지를 뒤흔드는 태고의 거신.\n그 발걸음만으로 산맥이 무너진다고 전해진다."
  },
  {
    id:"phoenix", name:"피닉스", grade:"신화", color:"#ff4d4f",
    hp:5000000, attack:45000, dodge:10, critRate:20, critDamage:260, skillRate:40,
    reward:50000000000, drop:"불멸의 깃털",
    skillName:"재의 낙인 / 윤회의 불꽃", skillDesc:"재의 낙인 25% : 공격력 1배 + 화상 1중첩\n윤회의 불꽃 15% : 전체 공격 1.5배 + 화상 중첩 추가 피해\n일반 공격 60% : 공격력 1배",
    desc:"불꽃 속에서 영원히 되살아나는 전설의 신조.\n죽음조차 그를 멈출 수 없다."
  },
  {
    id:"bahamut", name:"바하무트", grade:"신화", color:"#ff4d4f",
    hp:9000000, attack:60000, dodge:12, critRate:22, critDamage:280, skillRate:40,
    reward:200000000000, drop:"용왕의 심장",
    skillName:"메가 플레어 / 용왕의 포효", skillDesc:"메가 플레어 15% : 공격력 3배, 다음 턴 참가 물고기 전체 행동 불가\n용왕의 포효 25% : 공격력 1.5배, 사용할 때마다 공격력 30,000 누적 증가",
    desc:"태초의 바다를 지배하던 용왕.\n분노한 포효는 하늘과 바다를 갈라놓는다."
  },
  {
    id:"tiamat", name:"티아마트", grade:"신화", color:"#ff4d4f",
    hp:15000000, attack:90000, dodge:15, critRate:24, critDamage:300, skillRate:40,
    reward:1000000000000, drop:"혼돈의 파편",
    skillName:"창세의 바다 / 괴수 탄생", skillDesc:"창세의 바다 25% : 공격력 2배\n괴수 탄생 15% : 새끼 용 3마리 소환\n새끼 용 : HP 100,000~300,000 / 공격력 10,000~30,000 랜덤 / 일반 공격만 사용\n일반 공격 60% : 공격력 1배",
    desc:"혼돈의 바다에서 태어난 창조의 여신.\n수많은 괴수들의 근원이 된 존재이다."
  },
  {
    id:"jormungandr", name:"요르문간드", grade:"초월", color:"#ffd700",
    hp:45000000, attack:150000, dodge:18, critRate:26, critDamage:320, skillRate:40,
    reward:3000000000000, drop:"세계뱀의 비늘",
    skillName:"미드가르드 감기 / 종말의 독", skillDesc:"미드가르드 감기 25% : 공격력 2배, 세계의 고리 1단계 진행\n종말의 독 15% : 공격력 1.2배, 독 1중첩 부여\n일반 공격 60% : 공격력 1배\n독 : 턴 시작 시 최대 체력의 2% 피해, 최대 3중첩\n세계의 고리 : 3단계 완성 시 공격력 증가 한도가 50%에서 100%로 확장되고 즉시 더 강해짐",
    desc:"세계를 감싸고 있는 종말의 거대 뱀.\n몸을 뒤틀 때마다 대륙이 흔들린다."
  },
  {
    id:"fenrir", name:"펜리르", grade:"초월", color:"#ffd700",
    hp:90000000, attack:220000, dodge:18, critRate:28, critDamage:330, skillRate:35,
    reward:10000000000000, drop:"글레이프니르의 파편",
    skillName:"티르의 오른손 / 신을 삼키는 자", skillDesc:"티르의 오른손 20% / 신을 삼키는 자 15%",
    desc:"신들조차 그 성장을 두려워해 마법의 족쇄 글레이프니르로 묶어둔 거대한 늑대.\n속박되는 순간 티르의 손을 물어뜯었으며, 라그나로크가 오면 족쇄를 끊고 오딘의 운명을 끝낸다."
  },
  {
    id:"surtr", name:"수르트", grade:"초월", color:"#ffd700",
    hp:180000000, attack:350000, dodge:20, critRate:30, critDamage:350, skillRate:35,
    reward:30000000000000, drop:"무스펠의 불꽃",
    skillName:"프레이르와의 결투 / 무스펠의 진군", skillDesc:"프레이르와의 결투 20% / 무스펠의 진군 15%",
    desc:"불꽃의 땅 무스펠을 지키는 거인.\n라그나로크가 시작되면 불꽃의 검을 들고 무스펠의 군세를 이끌어 비프로스트를 건넌다.\n프레이르를 쓰러뜨린 뒤 아홉 세계를 불길로 뒤덮는다."
  },
  {
    id:"cerberus", name:"케르베로스", grade:"영원", color:"#00f5d4",
    hp:350000000, attack:500000, dodge:20, critRate:30, critDamage:350, skillRate:35,
    reward:50000000000000, drop:"명계의 송곳니",
    skillName:"세 머리의 판결 / 망자의 무게", skillDesc:"세 머리의 판결 20% / 망자의 무게 15%",
    desc:"명계의 문을 지키며 죽은 자가 지상으로 달아나지 못하게 막는 세 머리의 파수견.\n머리를 잃을수록 공격의 수는 줄지만, 도망치려는 망자에게는 더욱 무거운 벌을 내린다."
  },
  {
    id:"nidhogg", name:"니드호그", grade:"영원", color:"#00f5d4",
    hp:700000000, attack:700000, dodge:21, critRate:31, critDamage:360, skillRate:35,
    reward:80000000000000, drop:"세계수의 썩은 뿌리",
    skillName:"뿌리의 연결 / 라타토스크의 이간질", skillDesc:"뿌리의 연결 20% / 라타토스크의 이간질 15%",
    desc:"세계수 위그드라실의 뿌리를 끊임없이 갉아 먹고 나스트론드의 시체를 삼키는 용.\n뿌리를 타고 생명들을 연결한 뒤 서로의 고통과 공격을 뒤틀어 버린다."
  },
  {
    id:"azhi_dahaka", name:"아지다하카", grade:"영원", color:"#00f5d4",
    hp:1300000000, attack:950000, dodge:22, critRate:32, critDamage:370, skillRate:40,
    reward:120000000000000, drop:"다마반드의 사슬",
    skillName:"세 머리의 선택 / 재앙 집중", skillDesc:"세 머리의 선택 25% / 재앙 집중 15%",
    desc:"앙그라 마이뉴가 만들어 낸 세 머리와 여섯 눈의 사룡.\n패배한 뒤에도 죽지 않은 채 다마반드 산에 봉인되어 세상의 종말에 풀려날 때를 기다린다."
  },
  {
    id:"typhon", name:"타이폰", grade:"영원", color:"#00f5d4",
    hp:2500000000, attack:1300000, dodge:23, critRate:34, critDamage:390, skillRate:35,
    reward:200000000000000, drop:"폭풍의 심장",
    skillName:"폭풍의 반향 / 대지와 하늘의 추락", skillDesc:"폭풍의 반향 20% / 대지와 하늘의 추락 15%",
    desc:"가이아와 타르타로스 사이에서 태어나 신들을 달아나게 하고 제우스마저 궁지로 몰아넣은 폭풍의 괴물.\n거대한 날개와 뱀의 몸으로 대지와 하늘의 질서를 무너뜨린다."
  },
  {
    id:"angra_mainyu", name:"앙그라 마이뉴", grade:"영원", color:"#00f5d4",
    hp:4500000000, attack:1800000, dodge:25, critRate:36, critDamage:420, skillRate:35,
    reward:300000000000000, drop:"파멸의 근원",
    skillName:"존재 말살 / 창조의 붕괴", skillDesc:"존재 말살 20% / 창조의 붕괴 15%",
    desc:"선한 창조에 맞서는 절대적인 파괴의 정신.\n질병과 죽음, 거짓을 퍼뜨려 만들어진 모든 존재를 부정하고 세계를 영원한 어둠으로 되돌리려 한다."
  },
  {
    id:"erebos", name:"에레보스", grade:"공허", color:"#b36cff",
    hp:8000000000, attack:2400000, dodge:26, critRate:38, critDamage:440, skillRate:35,
    reward:500000000000000, drop:"원초의 어둠",
    skillName:"흑일식 / 어둠의 포식", skillDesc:"흑일식 20% : 전체 공격력 160% 피해, 치명타 봉인\n어둠의 포식 15% : 가장 강한 대상에게 공격력 300% 피해, 체력 회복",
    crazySkillName:"빛이 존재하지 않는 세계",
    desc:"모든 빛이 태어나기 전부터 존재한 원초의 어둠.\n빛을 삼킬수록 전장은 완전한 암흑에 가까워진다."
  },
  {
    id:"chronos", name:"크로노스", grade:"공허", color:"#b36cff",
    hp:14000000000, attack:3200000, dodge:27, critRate:40, critDamage:460, skillRate:35,
    reward:800000000000000, drop:"시간의 파편",
    skillName:"시간 역행 / 미래 삭제", skillDesc:"시간 역행 20% : 직전 턴 피해 일부 회복\n미래 삭제 15% : 가장 강한 대상에게 공격력 300% 피해, 다음 행동 삭제",
    crazySkillName:"시간선 말소",
    desc:"과거와 미래를 동시에 내려다보는 시간의 지배자.\n불리한 시간선을 지우고 이미 지나간 공격을 다시 불러온다."
  },
  {
    id:"nyarlathotep", name:"니알라토텝", grade:"공허", color:"#b36cff",
    hp:24000000000, attack:4300000, dodge:28, critRate:42, critDamage:480, skillRate:40,
    reward:1300000000000000, drop:"천 번째 가면",
    skillName:"광기의 합창 / 가면 강탈", skillDesc:"광기의 합창 25% : 가장 강한 물고기가 아군을 공격\n가면 강탈 15% : 대상의 힘을 빼앗아 자신을 강화",
    crazySkillName:"천 번째 얼굴",
    desc:"수많은 모습으로 다가와 정신과 힘을 훔치는 공허의 사자.\n가장 강한 존재의 얼굴을 빼앗아 적으로 되돌려 보낸다."
  },
  {
    id:"yog_sothoth", name:"요그 소토스", grade:"공허", color:"#b36cff",
    hp:40000000000, attack:5800000, dodge:29, critRate:44, critDamage:500, skillRate:40,
    reward:2000000000000000, drop:"은빛 열쇠",
    skillName:"차원 압살 / 은빛 문의 감시자", skillDesc:"차원 압살 25% : 회피 불가 전체 공격력 180% 피해\n은빛 문의 감시자 15% : 3턴 동안 공격하고 물고기의 공격을 대신 받는 감시자 소환",
    crazySkillName:"모든 차원의 종착점",
    desc:"모든 공간과 문의 너머에 동시에 존재하는 공허의 주인.\n전장을 서로 닿을 수 없는 차원으로 갈라 버린다."
  },
  {
    id:"azathoth", name:"아자토스", grade:"공허", color:"#d053ff",
    hp:70000000000, attack:8000000, dodge:30, critRate:46, critDamage:550, skillRate:45,
    reward:3000000000000000, drop:"혼돈의 핵",
    skillName:"맹목의 핵동 / 우주의 불협화음", skillDesc:"맹목의 핵동 25% : 회피 불가 전체 공격력 200% 피해\n우주의 불협화음 20% : 무작위 공격력 80% 피해 8회",
    crazySkillName:"잠든 신의 개안",
    desc:"우주의 중심에서 잠든 채 모든 질서를 꿈꾸는 최종 혼돈.\n눈을 뜨는 순간 전투의 규칙과 세계가 함께 무너진다."
  }
];
