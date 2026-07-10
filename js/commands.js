function runCommand(){

  let cmd=input.value.trim();
  input.value="";
  if(!cmd) return;

  // 예전처럼 !를 붙여도 작동하게 호환
  if(cmd.startsWith("!")) cmd = cmd.slice(1).trim();

  print("> "+escapeHtml(cmd));

  if(cmd.startsWith("대전 ") && cmd.split(/\s+/).length === 2) return requestPvp(cmd.split(/\s+/)[1]);
  if(cmd.startsWith("대전준비 ")) return preparePvpFish(cmd.split(/\s+/)[1]);
  if(cmd.startsWith("대전해제 ")) return unpreparePvpFish(cmd.split(/\s+/)[1]);
  if(cmd === "대전목록") return showPvpPrepList();
  if(cmd === "대전준비완료") return finishPvpReady();
  if(cmd === "대전수락") return acceptLatestPvpRequest();
  if(cmd === "대전거절") return rejectLatestPvpRequest();
  if(cmd === "대전취소") return cancelPvpRequest();


  if(!currentUser && !requireLoginForCommand(cmd)){
    return print("로그인 후 이용 가능합니다.\n\n회원가입 또는 로그인 을 입력하세요.");
  }

  if(!isAllowedInBossMenu(cmd)){
    return blockedBossCommand();
  }

  if(cmd==="명령어") showCommands();
  else if(cmd==="낚시") fish();
  else if(cmd==="양동이") showBucket();
  else if(cmd.startsWith("양동이 ")) showOtherBucket(cmd.split(" ")[1]);
  else if(cmd==="도감") showCollection();
  else if(cmd==="물고기도감") showFishCollection();
  else if(cmd==="코어도감") showCoreCollection();
  else if(cmd==="물고기특성") showFishTraits();
  else if(cmd==="내정보") showGameInfo();
  else if(cmd.startsWith("정보 ")){ const p=cmd.split(" "); showFishInfo(Number(p[1])); }
  else if(cmd==="정보") print("사용법 : 내정보 / 정보 번호");
  else if(cmd==="보스전") showBossBattle();
  else if(cmd==="보스정보") showBossInfo();
  else if(cmd.startsWith("보스정보 ")) showBossInfo(cmd.slice("보스정보 ".length).trim());
  else if(cmd==="보스목록") showBossList();
  else if(cmd.startsWith("보스선택 ")){ const p=cmd.split(" "); selectBoss(Number(p[1])); }
  else if(cmd==="인벤토리") showInventory();
  else if(cmd.startsWith("준비해제 ")){ const p=cmd.split(" "); unprepareBossFish(Number(p[1])); }
  else if(cmd.startsWith("준비 ")){ const p=cmd.split(" "); prepareBossFish(Number(p[1])); }
  else if(cmd==="전투 확인") runBossBattle();
  else if(cmd==="전투") runBossBattle();
  else if(cmd==="나가기") leaveBossMenu();
  else if(cmd==="연구소") showResearchLab();
  else if(cmd==="연구소1 강화") upgradeResearch(1);
  else if(cmd==="연구소2 강화") upgradeResearch(2);
  else if(cmd==="훈련소") showTrainingLab();
  else if(cmd==="훈련소1 강화") upgradeTraining(1);
  else if(cmd==="훈련소2 강화") upgradeTraining(2);
  else if(cmd==="훈련소3 강화") upgradeTraining(3);
  else if(cmd==="시세") showMarket();
  else if(cmd==="랭킹") showRanking();
  else if(cmd==="대전수락") acceptLatestPvpRequest();
  else if(cmd==="대전거절") rejectLatestPvpRequest();
  else if(cmd.startsWith("대전해제 ")){ const p=cmd.split(" "); unpreparePvpFish(p[1]); }
  else if(cmd.startsWith("대전준비 ")){ const p=cmd.split(" "); preparePvpFish(p[1]); }
  else if(cmd==="대전목록") showPvpPrepList();
  else if(cmd.startsWith("대전 ")){ const p=cmd.split(" "); requestPvp(p[1]); }
  else if(cmd.startsWith("메세지 ")) sendMessage(cmd.split(" ")[1]);
  else if(cmd==="지갑") showWallet();
  else if(cmd.startsWith("지갑 ")) showOtherWallet(cmd.split(" ")[1]);
  else if(cmd==="업적") showAchievements();
  else if(cmd==="칭호") showTitles();
  else if(cmd.startsWith("칭호 장착 ")) equipTitle(cmd.split(" ")[2]);
  else if(cmd==="칭호 장착해제") unequipTitle();
  else if(cmd==="회원가입") registerUser();
  else if(cmd==="로그인") loginUser();
  else if(cmd==="로그아웃") logoutUser();
  else if(cmd==="탈퇴") deleteAccount();
  else if(cmd.startsWith("송금 ")){ const p=cmd.split(" "); sendMoney(p[1], p[2]); }
  else if(cmd.startsWith("전송 ")){ const p=cmd.split(" "); sendFish(p[1], p[2]); }
  else if(cmd==="강화") upgradeOne();
  else if(cmd==="일괄강화" || cmd==="강화 최대") upgradeMax();
  else if(cmd.startsWith("정렬 ")) sortBucket(cmd.slice("정렬 ".length).trim());
  else if(cmd==="파티프리셋") showPartyPresets();
  else if(cmd.startsWith("파티저장 ")) savePartyPreset(cmd.slice("파티저장 ".length));
  else if(cmd.startsWith("파티불러오기 ")) loadPartyPreset(cmd.slice("파티불러오기 ".length));
  else if(cmd.startsWith("파티해제 ")) clearPartyPreset(cmd.slice("파티해제 ".length));
  else if(cmd==="확인") confirmPendingPresetSale();
  else if(cmd==="판매 확인") confirmPresetSale();
  else if(cmd==="일괄판매 확인") confirmPresetSellAll();
  else if(cmd==="일괄판매" || cmd==="물고기 일괄판매") sellAll();
  else if(cmd.startsWith("판매 ")) sellOne(Number(cmd.split(" ")[1]));
  else if(cmd.startsWith("물고기 판매 ")) sellOne(Number(cmd.split(" ")[2]));
  else if(cmd.startsWith("잠금해제 ")) lockOne(Number(cmd.split(" ")[1]), false);
  else if(cmd.startsWith("잠금 ")) lockOne(Number(cmd.split(" ")[1]), true);
  else print("없는 명령어입니다. 명령어 를 입력해보세요.");
}

input.addEventListener("keydown", e=>{ if(e.key==="Enter") runCommand(); });
window.addEventListener("beforeunload", () => {
  cancelActiveFishing();
  stopOnlinePresence();
});

loadGame();

if(!currentUser){
  clearUserSession();
  resetGameData();
  refreshMarketIfNeeded();
  saveGame();
  updateWallet();
  print("로그인이 필요합니다.\n\n처음이라면 회원가입 을 입력하세요.\n이미 계정이 있다면 로그인 을 입력하세요.");
  checkGameVersion();
} else {
  updateWallet();
  print(currentUser + " 님으로 접속 중입니다.\n클라우드 데이터를 불러오는 중입니다.");
  checkGameVersion();

  (async function(){
    let startupAchievements = [];

    try{
      const snap = await db.collection("users").doc(currentUser).get();

      if(!snap.exists){
        currentUser = null;
        localStorage.removeItem("textFishingCurrentUser");
        clearUserSession();
        resetGameData();
        updateWallet();
        print("저장된 계정을 찾을 수 없습니다.\n다시 로그인해주세요.");
        return;
      }

      const data = snap.data();
      if(!(await hasValidSession(data))){
        currentUser = null;
        localStorage.removeItem("textFishingCurrentUser");
        clearUserSession();
        resetGameData();
        updateWallet();
        print("로그인 세션이 없거나 만료되었습니다. 다시 로그인해주세요.");
        return;
      }
      applyGameState(data.gameState);
      cloudRevision = Number(data.cloudRevision || 0);
      cloudSyncedSeq = localSaveSeq;
      migrateCombatStatsToCurrentVersion();
      updateWallet();

      print(currentUser + " 님 데이터 불러오기 완료.");
    }catch(e){
      console.error(e);
      print("클라우드 데이터를 불러오지 못했습니다.\n네트워크 상태를 확인한 뒤 다시 로그인해주세요.");
      return;
    }

    try{
      refreshMarketIfNeeded();
    }catch(e){
      console.error(e);
    }

    try{
      startupAchievements = updateAchievements();
      checkSpecialTitles();
      saveGame();
      updateWallet();
      printAchievementRewards(startupAchievements);
    }catch(e){
      console.error(e);
    }

    try{
      startServerAlertListener();
      startOnlinePresence();
    }catch(e){
      console.error(e);
    }

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
  })();
}
