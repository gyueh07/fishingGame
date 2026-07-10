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
    "불타는 마음":"❤️‍🔥", "무한한 시간":"⏳",
    "잃어버린 첫 번째 편지 조각 ✉️":"✉️", "잃어버린 두 번째 편지 조각 ✉️":"📨", "잃어버린 세 번째 편지 조각 ✉️":"💌",
    "수상한 기운 👁️":"👁️", "기묘한 기운 🌀":"🌀"
  };
  const bossSymbols = {
    kraken:"🐙", hydra:"🐍", leviathan:"🐋", behemoth:"🦏", phoenix:"🔥", bahamut:"🐉", tiamat:"🐲",
    jormungandr:"🐍", fenrir:"🐺", surtr:"🌋", cerberus:"🐕", nidhogg:"🐉", azhi_dahaka:"🐲", typhon:"🌪️", angra_mainyu:"🌑"
  };
  const ratingColors = {PERFECT:"#ffe46a", GREAT:"#5ef0d1", GOOD:"#73cfff", BAD:"#ff8b91"};

  const state = {
    activeView:"fishingView", bucketKey:"", bossKey:"", collectionKey:"", previousBucketCount:0,
    initialized:false, toastTimer:null, trainingSyncKey:"", trainingBucketRef:null, timingActive:false, timingStartedAt:0, timingDuration:1900,
    timingTarget:.5, timingPosition:0, timingRaf:0, timingTimeout:0
  };

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
    $("#modalTitle").textContent = title;
    $("#modalBody").innerHTML = html;
    $("#modalOverlay").style.display = "block";
  }
  function legacyTextHtml(value) {
    return sanitizeGameHtml(String(value ?? "")).replace(/\n/g, "<br>");
  }

  function installOutputBridge() {
    const basePrint = print;
    print = function(value) {
      basePrint(value);
      const message = plain(value);
      if (message && !message.startsWith(">")) showToast(message.slice(0, 105));
      state.bucketKey = state.bossKey = state.collectionKey = "";
      setTimeout(() => renderAll(true), 0);
    };

    const basePreview = printPreview;
    printPreview = function(title, summary, buttonText, modalContent) {
      basePreview(title, summary, buttonText, modalContent);
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
  }

  function showCatchCelebration(fish) {
    const rating = fish.timingResult || "GOOD";
    const layer = $("#catchCelebration");
    $("#celebrationRating").textContent = rating;
    $("#celebrationRating").style.color = ratingColors[rating] || ratingColors.GOOD;
    $("#celebrationIcon").textContent = fishIcon(fish);
    $("#celebrationName").textContent = fish.name;
    $("#celebrationMeta").textContent = `[${fish.grade}] ${fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`} · ${formatMoney(fish.price || 0)}`;
    layer.classList.remove("show");
    void layer.offsetWidth;
    layer.classList.add("show");
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
    $("#castSubText").textContent = isFishing ? "물고기가 다가오고 있어요" : "타이밍 미니게임 시작";
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
      $("#catchMeta").textContent = `${latest.timingResult || "GOOD"} · ${latest.size === null ? "특별 개체" : `${formatSize(latest.size)}cm`} · ${formatMoney(latest.price || 0)}`;
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
    state.timingStartedAt = performance.now();
    state.timingDuration = 1500 + Math.random() * 750;
    state.timingTarget = .35 + Math.random() * .30;
    $("#timingTrack").style.setProperty("--target", `${state.timingTarget * 100}%`);
    $("#timingResult").textContent = "READY";
    $("#timingResult").style.color = ratingColors.GOOD;
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
    cancelAnimationFrame(state.timingRaf);
    clearTimeout(state.timingTimeout);
    state.timingActive = false;
    $("#timingResult").textContent = rating;
    $("#timingResult").style.color = ratingColors[rating];
    $("#timingNeedle").style.boxShadow = `0 0 18px ${ratingColors[rating]}`;
    setFishingTimingResult(rating);
    showToast(`${rating}! 낚시 확률이 적용되었습니다.`);
    setTimeout(() => {
      $("#timingGame").classList.remove("active");
      $("#timingGame").setAttribute("aria-hidden", "true");
      runGameCommand("낚시");
    }, 650);
  }

  function renderRecentCatches() {
    const recent = bucket.slice(-10).reverse();
    $("#recentCatchCount").textContent = `${recent.length} / 10`;
    $("#recentCatchEmpty").hidden = recent.length > 0;
    $("#recentCatchGrid").hidden = recent.length === 0;
    $("#recentCatchGrid").innerHTML = recent.map((fish, index) => `
      <article class="recent-catch-item ${gradeClass(fish.grade)}" data-tooltip="${safe(fish.time || "최근 획득")}">
        <span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>${safe(fish.grade)} · ${fish.timingResult || "GOOD"}</small></div><em>${index + 1}회 전</em>
      </article>`).join("");
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
    const list = sortedBucketList().slice(0, 180);
    grid.innerHTML = list.map((entry, index) => {
      const fish = entry.fish, combat = ensureCombatStats(fish), no = index + 1;
      return `<article class="fish-card ${gradeClass(fish.grade)}">
        <div class="fish-card-top"><span class="fish-card-icon">${fishIcon(fish)}</span><span class="fish-card-index">NO.${no}${fish.locked ? " · 🔒" : ""}</span></div>
        <span class="fish-card-grade">${safe(fish.grade)}</span><h3>${safe(fish.name)}</h3><p>${fish.size === null ? "특별 개체" : `${formatSize(fish.size)}cm`}</p>
        <div class="fish-stats"><div><small>공격력</small><b>${compactNumber(combat.attack)}</b></div><div><small>체력</small><b>${compactNumber(combat.maxHp)}</b></div></div>
        <div class="fish-actions"><button data-fish-action="info" data-number="${no}" data-tooltip="능력치와 특성을 확인합니다">상세</button><button data-fish-action="lock" data-number="${no}" data-tooltip="${fish.locked ? "잠금을 해제합니다" : "판매되지 않도록 잠급니다"}">${fish.locked ? "잠금 해제" : "잠금"}</button><button class="sell" data-fish-action="sell" data-number="${no}" data-tooltip="현재 시세로 판매합니다" ${fish.locked ? "disabled" : ""}>판매</button></div>
      </article>`;
    }).join("");
  }

  function openFishDetail(displayNumber) {
    const idx = getBucketIndexByDisplayNumber(Number(displayNumber)), fish = bucket[idx];
    if (!fish) return showToast("존재하지 않는 물고기입니다.");
    const c = ensureCombatStats(fish), trait = getFishTrait(fish);
    openUiModal(fish.name, `<div class="game-dialog"><div class="dialog-summary ${gradeClass(fish.grade)}"><div><small>${safe(fish.grade)} · 양동이 ${displayNumber}번</small><b>${safe(fish.name)}</b></div><span>${fishIcon(fish)}</span></div>
      <div class="dialog-card-grid"><article class="dialog-card"><small>공격력</small><strong>${Number(c.attack).toLocaleString()}</strong></article><article class="dialog-card"><small>체력</small><strong>${Number(c.hp).toLocaleString()} / ${Number(c.maxHp).toLocaleString()}</strong></article><article class="dialog-card"><small>회피율</small><strong>${Number(c.dodge).toFixed(1)}%</strong></article><article class="dialog-card"><small>치명타</small><strong>${Number(c.critRate).toFixed(1)}% · ${Number(c.critDamage).toFixed(0)}%</strong></article></div>
      ${trait ? `<article class="dialog-card ${gradeClass(fish.grade)}"><small>고유 특성</small><h3>${safe(trait.name)}</h3><p>${safe(trait.desc)}</p></article>` : ""}</div>`);
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
      const owned = Number(bossProgress?.materials?.[boss.drop] || 0), discovered = owned > 0 || bossProgress?.defeated?.[boss.id];
      return `<article class="dialog-card ${gradeClass(boss.grade)}"><small>${safe(boss.name)}</small><h3>${discovered ? `💎 ${safe(boss.drop)}` : "❔ 미발견 코어"}</h3><strong>x${owned.toLocaleString()}</strong></article>`;
    }).join("");
    openUiModal("코어 도감", `<div class="game-dialog"><div class="dialog-summary"><div><small>BOSS CORE</small><b>보스 처치 시 1~10개 획득</b></div><span>💎</span></div><div class="dialog-card-grid">${cards}</div></div>`);
  }

  function renderBosses(force = false) {
    const key = `${bossList.map(b => bossProgress?.materials?.[b.drop] || 0).join("|")}|${bossList.map(b => bossProgress?.defeated?.[b.id] ? 1 : 0).join("")}`;
    if (!force && key === state.bossKey) return;
    state.bossKey = key;
    $("#bossGrid").innerHTML = bossList.map((boss, index) => {
      const unlocked = isBossUnlocked(boss), cleared = Boolean(bossProgress?.defeated?.[boss.id]), owned = Number(bossProgress?.materials?.[boss.drop] || 0);
      return `<article class="boss-card ${gradeClass(boss.grade)} ${unlocked ? "" : "locked"}" data-tooltip="${safe(boss.skillName)}"><div class="boss-card-head"><div><small>${safe(boss.grade)} · ${cleared ? "처치 완료" : unlocked ? "도전 가능" : "잠김"}</small><h3>${safe(boss.name)}</h3><p>${safe(boss.skillName)}</p></div><span class="boss-card-symbol">${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-stats"><span>❤️ ${compactNumber(boss.hp)}</span><span>⚔️ ${compactNumber(boss.attack)}</span><span>💨 ${boss.dodge}%</span></div><div class="boss-reward"><span>💎 ${safe(boss.drop)}</span><b>x${owned.toLocaleString()}</b></div><button data-boss-index="${index + 1}" ${unlocked ? "" : "disabled"}>${cleared ? "다시 도전" : unlocked ? "도전 준비" : "이전 보스 처치 필요"}</button></article>`;
    }).join("");
  }

  function openBossParty(bossNumber = 0) {
    if (!currentUser) { showToast("보스전에 도전하려면 먼저 로그인해주세요."); switchView("communityView"); return; }
    recoverStunnedFish();
    isBossMenu = true;
    if (bossNumber) {
      const boss = bossList[Number(bossNumber) - 1];
      if (boss && isBossUnlocked(boss)) { bossProgress.selectedBossId = boss.id; saveGame(); }
    }
    const boss = getCurrentBoss(), list = sortedBucketList().filter(entry => entry.fish.grade !== "쓰레기").slice(0, 60);
    const fishCards = list.map(entry => {
      const fish = entry.fish, no = getDisplayNumberByBucketIndex(entry.originalIndex), selected = bossPrepIndexes.includes(entry.originalIndex), c = ensureCombatStats(fish);
      return `<article class="boss-party-fish ${gradeClass(fish.grade)} ${selected ? "selected" : ""}"><span>${fishIcon(fish)}</span><div><b>${safe(fish.name)}</b><small>⚔ ${compactNumber(c.attack)} · ❤️ ${compactNumber(c.maxHp)}</small></div><button data-boss-prep-number="${no}" data-selected="${selected ? 1 : 0}">${selected ? "해제" : "참가"}</button></article>`;
    }).join("");
    const cooldown = getBossCooldownLeft(boss.id);
    openUiModal(`${boss.name} 레이드`, `<div class="game-dialog"><div class="dialog-summary ${gradeClass(boss.grade)}"><div><small>${safe(boss.grade)} BOSS · 파티 ${bossPrepIndexes.length} / 5</small><b>${safe(boss.name)}</b><p>❤️ ${boss.hp.toLocaleString()} · ⚔️ ${boss.attack.toLocaleString()} · 💎 ${safe(boss.drop)} 1~10개</p></div><span>${bossSymbols[boss.id] || "🐲"}</span></div><div class="boss-party-list">${fishCards || "출전 가능한 물고기가 없습니다."}</div><div class="dialog-actions"><button class="primary" data-boss-start ${cooldown > 0 ? "disabled" : ""}>${cooldown > 0 ? `쿨타임 ${formatRemain(cooldown)}` : "레이드 시작"}</button><button data-ui-action="coreCollection">보유 코어 확인</button></div></div>`);
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
    const map = {market:openMarket,fishCollection:openFishCollection,coreCollection:openCoreCollection,bossParty:()=>openBossParty(),ranking:openRanking,wallet:openWallet,achievements:openAchievements,titles:openTitles,pvp:openPvpPanel,presets:openPresets,message:openMessageForm};
    map[action]?.();
  }

  document.addEventListener("click", async event => {
    const viewButton = event.target.closest("[data-view-target]"); if (viewButton) return switchView(viewButton.dataset.viewTarget);
    const uiButton = event.target.closest("[data-ui-action]"); if (uiButton) return handleUiAction(uiButton.dataset.uiAction);
    const commandButton = event.target.closest("[data-game-command]"); if (commandButton) { await runGameCommand(commandButton.dataset.gameCommand); if ($("#modalOverlay").style.display === "block" && commandButton.closest(".modalBody")) closeModal(); return; }
    const sortButton = event.target.closest("[data-sort]"); if (sortButton) return runGameCommand(`정렬 ${sortButton.dataset.sort}`);
    const fishButton = event.target.closest("[data-fish-action]");
    if (fishButton) {
      const no=fishButton.dataset.number, action=fishButton.dataset.fishAction;
      if(action==="info") return openFishDetail(no);
      return runGameCommand(`${action==="lock" ? (fishButton.textContent.includes("해제") ? "잠금해제" : "잠금") : "판매"} ${no}`);
    }
    const bossButton = event.target.closest("[data-boss-index]"); if (bossButton && !bossButton.disabled) return openBossParty(bossButton.dataset.bossIndex);
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
  state.previousBucketCount = bucket.length;
  renderAll(true);
  installTooltips();
  setInterval(() => { renderAll(false); if($("#log").textContent.length > 80000) $("#log").replaceChildren(); }, 800);
})();
