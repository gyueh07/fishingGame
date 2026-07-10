(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const gradeClasses = {
    "쓰레기":"trash", "일반":"normal", "희귀":"rare", "영웅":"hero", "전설":"legend",
    "신화":"myth", "초월":"transcend", "영원":"eternal", "공허":"void"
  };

  const bossSymbols = {
    kraken:"🐙", hydra:"🐍", leviathan:"🐋", behemoth:"🦏", phoenix:"🔥",
    bahamut:"🐉", tiamat:"🐲", jormungandr:"🐍", fenrir:"🐺", surtr:"🌋",
    cerberus:"🐕", nidhogg:"🐉", azhi_dahaka:"🐲", typhon:"🌪️", angra_mainyu:"🌑"
  };

  const state = {
    activeView: "fishingView",
    bucketKey: "",
    bossKey: "",
    collectionKey: "",
    previousBucketCount: 0,
    initialized: false,
    toastTimer: null,
    renderTimer: null
  };

  function safe(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
    })[char]);
  }

  function gradeClass(grade) {
    return "grade-" + (gradeClasses[grade] || "normal");
  }

  function fishIcon(fish) {
    const name = String(fish?.name || "");
    if (fish?.grade === "공허") return "🌀";
    if (fish?.grade === "영원") return "💎";
    if (/드래곤|룡|이무기/.test(name)) return "🐉";
    if (/고래/.test(name)) return "🐋";
    if (/상어/.test(name)) return "🦈";
    if (/문어|오징어|낙지/.test(name)) return "🐙";
    if (/게|새우|가재/.test(name)) return "🦀";
    if (/해파리/.test(name)) return "🪼";
    if (/조개|굴|전복/.test(name)) return "🐚";
    if (/해마/.test(name)) return "🦄";
    return fish?.grade === "쓰레기" ? "🗑️" : "🐟";
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
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openConsole() {
    const drawer = $("#consoleDrawer");
    drawer?.classList.add("open");
    drawer?.setAttribute("aria-hidden", "false");
    setTimeout(() => $("#command")?.focus(), 80);
  }

  function closeConsole() {
    const drawer = $("#consoleDrawer");
    drawer?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
  }

  function shouldOpenConsole(command) {
    return /^(명령어|시세|랭킹|지갑|업적|칭호|물고기도감|코어도감|도감|내정보|정보|보스|인벤토리|대전|파티|연구소$|훈련소$)/.test(command);
  }

  function sendCommand(command, options = {}) {
    const commandInput = $("#command");
    if (!commandInput || typeof runCommand !== "function") return;
    commandInput.value = command;
    runCommand();
    state.bucketKey = "";
    state.bossKey = "";
    state.collectionKey = "";
    renderAll(true);
    if (options.openConsole ?? shouldOpenConsole(command)) openConsole();
  }

  function switchView(viewId) {
    if (!document.getElementById(viewId)) return;

    if (viewId !== "bossView" && typeof isBossMenu !== "undefined" && isBossMenu && typeof leaveBossMenu === "function") {
      leaveBossMenu();
    }

    state.activeView = viewId;
    $$(".game-view").forEach(view => view.classList.toggle("active", view.id === viewId));
    $$(`[data-view-target]`).forEach(button => button.classList.toggle("active", button.dataset.viewTarget === viewId));

    const view = document.getElementById(viewId);
    $("#pageTitle").textContent = view.dataset.title || "낚시터";
    $("#pageEyebrow").textContent = view.dataset.eyebrow || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  }

  function renderFishing() {
    const scene = $("#fishingScene");
    const castButton = $("#castButton");
    scene.classList.toggle("is-fishing", Boolean(isFishing));
    castButton.disabled = Boolean(isFishing);
    $("#fishingStateTag").textContent = isFishing ? "입질을 기다리는 중" : "잔잔한 물결";
    $("#fishingHeadline").textContent = isFishing ? "수면 아래 움직임이 느껴져요" : "오늘은 어떤 물고기를 만날까요?";
    $("#fishingHint").textContent = isFishing ? "낚싯대를 거두지 말고 조금만 기다려주세요." : "낚싯대를 던지고 입질을 기다려보세요.";
    castButton.querySelector("b").textContent = isFishing ? "낚시 중..." : "낚싯대 던지기";
    $("#castSubText").textContent = isFishing ? "물고기가 다가오고 있어요" : "한 번의 터치로 낚시 시작";

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
      $("#catchMeta").textContent = latest.size === null ? "크기를 측정할 수 없는 특별한 존재" : `${formatSize(latest.size)}cm · ${formatMoney(latest.price || 0)}`;
    }

    if (state.initialized && bucket.length > state.previousBucketCount && latest) {
      const spotlight = $("#catchSpotlight");
      spotlight.classList.remove("caught");
      void spotlight.offsetWidth;
      spotlight.classList.add("caught");
      showToast(`[${latest.grade}] ${latest.name}을(를) 낚았습니다!`);
    }
    state.previousBucketCount = bucket.length;
  }

  function bucketRenderKey() {
    const sample = bucket.slice(-180).map(f => `${f.id}:${f.locked ? 1 : 0}:${f.combat?.status || ""}`).join("|");
    return `${bucket.length}|${bucketSortOrder}|${sample}`;
  }

  function renderBucket(force = false) {
    const key = bucketRenderKey();
    if (!force && key === state.bucketKey) return;
    state.bucketKey = key;

    const grid = $("#bucketGrid");
    const empty = $("#bucketEmpty");
    $("#bucketSummary").textContent = bucket.length ? `${bucket.length.toLocaleString()}마리 보유 · 원하는 물고기를 선택해 관리하세요.` : "보유 중인 물고기가 없습니다.";
    empty.classList.toggle("visible", bucket.length === 0);
    grid.hidden = bucket.length === 0;

    $$("[data-sort]").forEach(button => button.classList.toggle("active", button.dataset.sort === bucketSortOrder));
    if (!bucket.length) {
      grid.replaceChildren();
      return;
    }

    const list = sortedBucketList().slice(0, 180);
    grid.innerHTML = list.map((entry, index) => {
      const fish = entry.fish;
      const combat = ensureCombatStats(fish);
      const displayNumber = index + 1;
      const size = fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`;
      return `
        <article class="fish-card ${gradeClass(fish.grade)}">
          <div class="fish-card-top"><span class="fish-card-icon">${fishIcon(fish)}</span><span class="fish-card-index">NO.${displayNumber}${fish.locked ? " · 🔒" : ""}</span></div>
          <span class="fish-card-grade">${safe(fish.grade)}</span>
          <h3>${safe(fish.name)}</h3><p>${safe(size)}</p>
          <div class="fish-stats"><div><small>공격력</small><b>${compactNumber(combat.attack)}</b></div><div><small>체력</small><b>${compactNumber(combat.maxHp)}</b></div></div>
          <div class="fish-actions">
            <button data-fish-command="정보" data-number="${displayNumber}">상세</button>
            <button data-fish-command="${fish.locked ? "잠금해제" : "잠금"}" data-number="${displayNumber}">${fish.locked ? "잠금 해제" : "잠금"}</button>
            <button class="sell" data-fish-command="판매" data-number="${displayNumber}" ${fish.locked ? "disabled" : ""}>판매</button>
          </div>
        </article>`;
    }).join("");

    if (bucket.length > list.length) {
      grid.insertAdjacentHTML("beforeend", `<div class="empty-state visible"><span>🐟</span><h3>상위 ${list.length}마리 표시 중</h3><p>전체 목록은 기존 명령어의 양동이에서 확인할 수 있어요.</p><button data-command="양동이">전체 양동이 열기</button></div>`);
    }
  }

  function renderCollection(force = false) {
    const discovered = Object.keys(collection || {}).length;
    const total = allFishCount();
    const key = `${discovered}|${Object.values(gradeCounts || {}).join("|")}`;
    if (!force && key === state.collectionKey) return;
    state.collectionKey = key;

    const percent = total ? Math.min(100, discovered / total * 100) : 0;
    $("#collectionPercent").textContent = `${percent.toFixed(1)}%`;
    $("#collectionCount").textContent = `${discovered.toLocaleString()} / ${total.toLocaleString()}종 발견`;
    $(".collection-ring").style.setProperty("--collection-progress", `${percent}%`);

    $("#gradeCollectionGrid").innerHTML = grades.map(grade => {
      const names = fishByGrade[grade.name] || [];
      const found = names.filter(name => collection?.[name]).length;
      return `<article class="grade-progress-card ${gradeClass(grade.name)}"><span>${safe(grade.name)}</span><b>${found.toLocaleString()} / ${names.length.toLocaleString()}</b><small>발견한 물고기</small></article>`;
    }).join("");
  }

  function renderBosses(force = false) {
    const materialValues = bossList.map(boss => bossProgress?.materials?.[boss.drop] || 0).join("|");
    const clearValues = bossList.map(boss => bossProgress?.defeated?.[boss.id] ? 1 : 0).join("");
    const key = `${materialValues}|${clearValues}`;
    if (!force && key === state.bossKey) return;
    state.bossKey = key;

    $("#bossGrid").innerHTML = bossList.map((boss, index) => {
      const unlocked = isBossUnlocked(boss);
      const cleared = Boolean(bossProgress?.defeated?.[boss.id]);
      const owned = Number(bossProgress?.materials?.[boss.drop] || 0);
      return `
        <article class="boss-card ${gradeClass(boss.grade)} ${unlocked ? "" : "locked"}">
          <div class="boss-card-head"><div><small>${safe(boss.grade)} · ${cleared ? "처치 완료" : unlocked ? "도전 가능" : "잠김"}</small><h3>${safe(boss.name)}</h3><p>${safe(boss.skillName)}</p></div><span class="boss-card-symbol">${bossSymbols[boss.id] || "🐲"}</span></div>
          <div class="boss-stats"><span>❤️ ${compactNumber(boss.hp)}</span><span>⚔️ ${compactNumber(boss.attack)}</span><span>💨 ${boss.dodge}%</span></div>
          <div class="boss-reward"><span>💎 ${safe(boss.drop)}</span><b>x${owned.toLocaleString()}</b></div>
          <button data-boss-index="${index + 1}" ${unlocked ? "" : "disabled"}>${cleared ? "다시 도전" : unlocked ? "도전 준비" : "이전 보스 처치 필요"}</button>
        </article>`;
    }).join("");
  }

  function renderGrowth() {
    $("#growthRodLevel").textContent = `Lv.${Number(rodLevel || 1).toLocaleString()}`;
    $("#researchFishingLevel").textContent = `Lv.${Number(researchLevels?.fishing || 0)}`;
    $("#researchAppraisalLevel").textContent = `Lv.${Number(researchLevels?.appraisal || 0)}`;
    $("#trainingAttackLevel").textContent = `Lv.${Number(trainingLevels?.attack || 0)}`;
    $("#trainingHpLevel").textContent = `Lv.${Number(trainingLevels?.hp || 0)}`;
    $("#trainingCritLevel").textContent = `Lv.${Number(trainingLevels?.critDamage || 0)}`;
  }

  function renderAll(force = false) {
    try {
      renderHeader();
      renderFishing();
      renderBucket(force);
      renderCollection(force);
      renderBosses(force);
      renderGrowth();
      state.initialized = true;
    } catch (error) {
      console.error("게임 UI 갱신 오류", error);
    }
  }

  document.addEventListener("click", event => {
    const viewButton = event.target.closest("[data-view-target]");
    if (viewButton) {
      switchView(viewButton.dataset.viewTarget);
      return;
    }

    const commandButton = event.target.closest("[data-command]");
    if (commandButton) {
      sendCommand(commandButton.dataset.command);
      return;
    }

    const fishButton = event.target.closest("[data-fish-command]");
    if (fishButton) {
      sendCommand(`${fishButton.dataset.fishCommand} ${fishButton.dataset.number}`, { openConsole: fishButton.dataset.fishCommand === "정보" });
      return;
    }

    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      sendCommand(`정렬 ${sortButton.dataset.sort}`, { openConsole: false });
      return;
    }

    const bossButton = event.target.closest("[data-boss-index]");
    if (bossButton && !bossButton.disabled) {
      if (!currentUser) {
        showToast("보스전에 도전하려면 먼저 로그인해주세요.");
        switchView("communityView");
        return;
      }
      sendCommand("보스전", { openConsole: false });
      sendCommand(`보스선택 ${bossButton.dataset.bossIndex}`, { openConsole: true });
    }
  });

  $("#castButton")?.addEventListener("click", () => {
    if (!currentUser) {
      showToast("낚시를 시작하려면 먼저 로그인해주세요.");
      switchView("communityView");
      return;
    }
    sendCommand("낚시", { openConsole: false });
  });

  $("#runCommandButton")?.addEventListener("click", () => {
    if ($("#command")?.value.trim()) runCommand();
    renderAll(true);
  });

  $("#openConsole")?.addEventListener("click", openConsole);
  $("#openConsoleSide")?.addEventListener("click", openConsole);
  $("#closeConsole")?.addEventListener("click", closeConsole);
  $("#consoleBackdrop")?.addEventListener("click", closeConsole);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeConsole();
  });

  state.previousBucketCount = bucket.length;
  renderAll(true);
  state.renderTimer = setInterval(() => renderAll(false), 800);
})();
