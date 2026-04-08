(() => {
  let state = StorageService.load();
  let timer = null;
  let elapsedSeconds = 0;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    state = StorageService.normalize(state);
    applyTheme();
    markActiveNav();
    bindGlobalActions();

    const page = document.body.dataset.page;
    const routeMap = {
      dashboard: initDashboard,
      written: () => initStudyPage("필기"),
      practical: () => initStudyPage("실기"),
      sql: () => initProblemPage("sql"),
      coding: () => initProblemPage("coding"),
      bank: initBankPage,
      settings: initSettingsPage,
      adminWritten: initAdminWrittenPage,
      adminProblems: initAdminProblemPage,
      adminBank: initAdminBankPage,
      adminData: initAdminDataPage
    };

    (routeMap[page] || (() => {}))();
  }

  function sync(nextState) {
    state = StorageService.normalize(nextState);
    StorageService.save(state);
  }

  function getProblemCategories(kind) {
    return window.FixedProblemCategories?.[kind] || [];
  }

  function applyTheme() {
    document.body.classList.toggle("dark", state.settings.theme === "dark");
    document.documentElement.style.setProperty("--primary", state.settings.accentColor || "#5CFFD1");
  }

  function markActiveNav() {
    const page = document.body.dataset.page;
    UIUtils.qsa(".nav-item").forEach((item) => {
      if (item.dataset.nav === page) item.classList.add("active");
    });
  }

  function bindGlobalActions() {
    const themeToggle = UIUtils.qs("#themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
        sync(state);
        applyTheme();
      });
    }
  }

  function initDashboard() {
    renderUpdates();
    renderDashboardStats();
    renderRecentRecords();
    initStopwatch();
  }

  function renderUpdates() {
    const wrap = UIUtils.qs("#updateList");
    if (!wrap) return;
    wrap.innerHTML = state.updates.map((item) => `
      <article class="card">
        <div class="badge">${item.date}</div>
        <h3>${item.title}</h3>
        <p class="muted">${item.content}</p>
      </article>
    `).join("");
  }

  function renderDashboardStats() {
    const wrap = UIUtils.qs("#dashboardStats");
    if (!wrap) return;
    const totalMinutes = state.records.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const weekly = Object.values(UIUtils.weekStats(state.records)).reduce((sum, value) => sum + value, 0);
    const noteCount = state.written.필기.length + state.written.실기.length;
    const problemCount = state.problems.sql.length + state.problems.coding.length + state.problems.bank.length;
    wrap.innerHTML = `
      <article class="card stat-card"><div class="muted">총 학습 시간</div><div class="value">${UIUtils.formatMinutes(totalMinutes)}</div></article>
      <article class="card stat-card"><div class="muted">최근 7일 학습</div><div class="value">${UIUtils.formatMinutes(weekly)}</div></article>
      <article class="card stat-card"><div class="muted">등록 과목</div><div class="value">${noteCount}</div></article>
      <article class="card stat-card"><div class="muted">문제 수</div><div class="value">${problemCount}</div></article>
    `;
  }

  function renderRecentRecords() {
    const wrap = UIUtils.qs("#recentRecords");
    if (!wrap) return;
    const rows = [...state.records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    wrap.innerHTML = rows.length ? `
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>날짜</th><th>분류</th><th>과목</th><th>메모</th><th>학습 시간</th></tr></thead>
          <tbody>
            ${rows.map((row) => `<tr><td>${row.date}</td><td>${row.category}</td><td>${row.subject}</td><td>${row.memo}</td><td>${UIUtils.formatMinutes(Number(row.minutes || 0))}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    ` : `<div class="empty">저장된 학습 기록이 없습니다.</div>`;
  }

  function initStopwatch() {
    const valueEl = UIUtils.qs("#timerValue");
    const startBtn = UIUtils.qs("#timerStart");
    const stopBtn = UIUtils.qs("#timerStop");
    const saveBtn = UIUtils.qs("#timerSave");
    const subjectEl = UIUtils.qs("#recordSubject");
    const categoryEl = UIUtils.qs("#recordCategory");
    const memoEl = UIUtils.qs("#recordMemo");
    if (!valueEl || !startBtn || !stopBtn || !saveBtn) return;

    const renderTime = () => {
      const h = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, "0");
      const s = String(elapsedSeconds % 60).padStart(2, "0");
      valueEl.textContent = `${h}:${m}:${s}`;
    };
    renderTime();

    startBtn.addEventListener("click", () => {
      if (timer) return;
      timer = setInterval(() => {
        elapsedSeconds += 1;
        renderTime();
      }, 1000);
    });

    stopBtn.addEventListener("click", () => {
      clearInterval(timer);
      timer = null;
    });

    saveBtn.addEventListener("click", () => {
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      state.records.unshift({
        id: crypto.randomUUID(),
        date: UIUtils.today(),
        subject: subjectEl?.value || "자율 학습",
        category: categoryEl?.value || "기타",
        memo: memoEl?.value || "스톱워치 기록",
        minutes
      });
      elapsedSeconds = 0;
      renderTime();
      clearInterval(timer);
      timer = null;
      sync(state);
      renderDashboardStats();
      renderRecentRecords();
      alert("학습 시간이 저장되었습니다.");
    });
  }

  function flattenStudyItems(data) {
    const flat = [];
    data.forEach((subject, sIndex) => {
      (subject.topics || []).forEach((topic, tIndex) => {
        (topic.subtopics || []).forEach((sub, subIndex) => {
          flat.push({
            subjectIndex: sIndex,
            topicIndex: tIndex,
            subIndex,
            subjectName: subject.subject,
            topicName: topic.name,
            subtopicName: sub.name,
            data: sub,
            key: `${subject.subject}__${topic.name}__${sub.name}`
          });
        });
      });
    });
    return flat;
  }

  function getStudyCompletion(key) {
    return state.progress.completedStudyKeys.includes(key);
  }

  function markStudyComplete(key) {
    if (!state.progress.completedStudyKeys.includes(key)) {
      state.progress.completedStudyKeys.push(key);
      sync(state);
    }
  }

  function findNextStudyIndex(flatItems, currentKey) {
    const idx = flatItems.findIndex((item) => item.key === currentKey);
    if (idx === -1) return null;
    return flatItems[idx + 1] || null;
  }

  function initStudyPage(type) {
    const data = state.written[type];
    const subjectTabs = UIUtils.qs("#subjectTabs");
    const topicGrid = UIUtils.qs("#topicGrid");
    const contentArea = UIUtils.qs("#contentArea");
    if (!subjectTabs || !topicGrid || !contentArea) return;

    let subjectIndex = 0;
    let topicIndex = 0;
    let subIndex = 0;

    function focusByPosition(position) {
      if (!position) return;
      subjectIndex = position.subjectIndex;
      topicIndex = position.topicIndex;
      subIndex = position.subIndex;
    }

    function render() {
      const currentSubject = data[subjectIndex];
      const currentTopic = currentSubject?.topics?.[topicIndex];
      const currentSub = currentTopic?.subtopics?.[subIndex];
      const flatItems = flattenStudyItems(data);
      const currentKey = currentSub ? `${currentSubject.subject}__${currentTopic.name}__${currentSub.name}` : "";
      const currentDone = currentKey ? getStudyCompletion(currentKey) : false;
      const doneCount = flatItems.filter((item) => getStudyCompletion(item.key)).length;

      subjectTabs.innerHTML = data.map((subject, index) => {
        const subjectDoneCount = flattenStudyItems([subject]).filter((item) => getStudyCompletion(item.key)).length;
        const subjectTotal = flattenStudyItems([subject]).length;
        return `<button class="tab ${index === subjectIndex ? "active" : ""}" data-subject-index="${index}">${subject.subject}<span class="tab-count">${subjectTotal ? `${subjectDoneCount}/${subjectTotal}` : "0/0"}</span></button>`;
      }).join("");

      topicGrid.innerHTML = currentSubject && currentSubject.topics?.length
        ? currentSubject.topics.map((topic, index) => `<button class="topic-btn ${index === topicIndex ? "active" : ""}" data-topic-index="${index}">${topic.name}</button>`).join("")
        : `<div class="empty">아직 등록된 주제가 없습니다.</div>`;

      if (!currentSub) {
        contentArea.innerHTML = `
          <div class="empty">
            선택한 과목에는 아직 학습 콘텐츠가 없습니다.<br />
            관리자 페이지에서 주제와 소주제를 추가해 주세요.
          </div>
        `;
      } else {
        contentArea.innerHTML = `
          <article class="card content-card">
            <div class="content-meta-row">
              <div class="badge">${currentSubject.subject} / ${currentTopic.name}</div>
              <div class="badge ${currentDone ? "success-badge" : ""}">${currentDone ? "학습 완료" : "학습 중"}</div>
            </div>
            <div class="study-progress-text">전체 진행: ${doneCount} / ${flatItems.length}</div>
            <h3>${currentSub.name}</h3>
            <p class="study-text">${escapeHtml(currentSub.content)}</p>
            <div class="horizontal-scroll" id="subtopicTabs">
              ${currentTopic.subtopics.map((sub, index) => {
                const subKey = `${currentSubject.subject}__${currentTopic.name}__${sub.name}`;
                const doneClass = getStudyCompletion(subKey) ? "done" : "";
                return `<button class="subtopic-btn ${index === subIndex ? "active" : ""} ${doneClass}" data-sub-index="${index}">${sub.name}</button>`;
              }).join("")}
            </div>
            <section class="keyword-list">
              ${currentSub.keywords.map((keyword) => `
                <div class="keyword-item">
                  <strong>${keyword.word}</strong>
                  <p class="muted preserve-format">${escapeHtml(keyword.description)}</p>
                </div>
              `).join("")}
            </section>
            <div class="study-actions">
              <button class="btn secondary" id="studyCompleteBtn">학습 완료 표시</button>
              <button class="btn primary" id="studyNextBtn">학습 완료 후 다음으로</button>
            </div>
          </article>
        `;

        UIUtils.qs("#studyCompleteBtn", contentArea)?.addEventListener("click", () => {
          markStudyComplete(currentKey);
          render();
        });

        UIUtils.qs("#studyNextBtn", contentArea)?.addEventListener("click", () => {
          markStudyComplete(currentKey);
          const nextItem = findNextStudyIndex(flatItems, currentKey);
          if (!nextItem) {
            render();
            alert("마지막 학습 콘텐츠입니다. 전체 학습을 완료했어요.");
            return;
          }
          focusByPosition(nextItem);
          render();
        });
      }

      UIUtils.qsa("[data-subject-index]", subjectTabs).forEach((btn) => btn.addEventListener("click", () => {
        subjectIndex = Number(btn.dataset.subjectIndex);
        topicIndex = 0;
        subIndex = 0;
        render();
      }));
      UIUtils.qsa("[data-topic-index]", topicGrid).forEach((btn) => btn.addEventListener("click", () => {
        topicIndex = Number(btn.dataset.topicIndex);
        subIndex = 0;
        render();
      }));
      UIUtils.qsa("[data-sub-index]", contentArea).forEach((btn) => btn.addEventListener("click", () => {
        subIndex = Number(btn.dataset.subIndex);
        render();
      }));
    }

    render();
  }

  function initProblemPage(kind) {
    const key = kind === "sql" ? "sql" : "coding";
    const subjectTabs = UIUtils.qs("#subjectTabs");
    const topicGrid = UIUtils.qs("#topicGrid");
    const contentArea = UIUtils.qs("#contentArea");
    const generatorWrap = UIUtils.qs("#generatedQuestion");

    let categoryIndex = 0;
    let itemIndex = 0;

    function render() {
      const items = state.problems[key];
      const categories = getProblemCategories(key);
      const category = categories[categoryIndex] || categories[0];
      const filtered = items.filter((item) => item.category === category);
      const current = filtered[itemIndex] || filtered[0];
      itemIndex = Math.min(itemIndex, Math.max(0, filtered.length - 1));

      subjectTabs.innerHTML = categories.map((name, index) => `<button class="tab ${index === categoryIndex ? "active" : ""}" data-category-index="${index}">${name}<span class="tab-count">${items.filter((item) => item.category === name).length}</span></button>`).join("");
      topicGrid.innerHTML = filtered.length
        ? filtered.map((item, index) => `<button class="topic-btn ${index === itemIndex ? "active" : ""}" data-item-index="${index}">${item.purpose}</button>`).join("")
        : `<div class="empty">${category} 분류에 등록된 문제가 없습니다.</div>`;
      contentArea.innerHTML = current ? `
        <article class="card content-card">
          <div class="badge">${current.category}</div>
          <h3>${current.purpose}</h3>
          <pre class="card" style="white-space:pre-wrap; margin: 12px 0;">${escapeHtml(current.code)}</pre>
          <p><strong>정답/의도:</strong> ${current.answer}</p>
          <p class="muted">${current.explanation}</p>
        </article>
      ` : `<div class="empty">문제가 없습니다.</div>`;

      UIUtils.qsa("[data-category-index]", subjectTabs).forEach((btn) => btn.addEventListener("click", () => {
        categoryIndex = Number(btn.dataset.categoryIndex);
        itemIndex = 0;
        render();
      }));
      UIUtils.qsa("[data-item-index]", topicGrid).forEach((btn) => btn.addEventListener("click", () => {
        itemIndex = Number(btn.dataset.itemIndex);
        render();
      }));
    }

    const generateBtn = UIUtils.qs("#generateQuestionBtn");
    const keywordInput = UIUtils.qs("#keywordPrompt");
    if (generateBtn && keywordInput && generatorWrap) {
      generateBtn.addEventListener("click", () => {
        const keyword = keywordInput.value.trim() || "핵심 개념";
        generatorWrap.innerHTML = `
          <article class="card">
            <h4>생성된 연습 문제</h4>
            <p><strong>Q.</strong> ${keyword}와 관련된 핵심 개념을 설명하고, 실제 예시를 1개 작성하시오.</p>
            <p class="muted"><strong>의도:</strong> 개념 정의 + 활용 능력 동시 점검</p>
          </article>
        `;
      });
    }

    render();
  }

  function initBankPage() {
    const filterEl = UIUtils.qs("#bankFilter");
    const searchEl = UIUtils.qs("#bankSearch");
    const wrap = UIUtils.qs("#bankList");
    if (!filterEl || !searchEl || !wrap) return;

    function render() {
      const type = filterEl.value;
      const query = searchEl.value.trim().toLowerCase();
      const items = state.problems.bank.filter((item) => {
        const typeMatch = type === "전체" || item.type === type;
        const queryMatch = !query || [item.question, item.answer, item.explanation, item.type].join(" ").toLowerCase().includes(query);
        return typeMatch && queryMatch;
      });
      wrap.innerHTML = items.length ? items.map((item) => `
        <article class="card">
          <div class="badge">${item.type}</div>
          <h3>${item.question}</h3>
          <p><strong>답안:</strong> ${item.answer}</p>
          <p class="muted">${item.explanation}</p>
        </article>
      `).join("") : `<div class="empty">조건에 맞는 문제가 없습니다.</div>`;
    }

    filterEl.addEventListener("change", render);
    searchEl.addEventListener("input", render);
    render();
  }

  function initSettingsPage() {
    const themeSelect = UIUtils.qs("#themeSelect");
    const colorInput = UIUtils.qs("#accentColor");
    const saveBtn = UIUtils.qs("#saveSettingsBtn");
    const exportJsonBtn = UIUtils.qs("#exportJsonBtn");
    const exportCsvBtn = UIUtils.qs("#exportCsvBtn");
    const importInput = UIUtils.qs("#importJsonInput");
    const resetBtn = UIUtils.qs("#resetAllBtn");
    if (!themeSelect || !colorInput) return;

    themeSelect.value = state.settings.theme;
    colorInput.value = state.settings.accentColor;

    saveBtn?.addEventListener("click", () => {
      state.settings.theme = themeSelect.value;
      state.settings.accentColor = colorInput.value;
      sync(state);
      applyTheme();
      alert("설정이 저장되었습니다.");
    });

    exportJsonBtn?.addEventListener("click", () => StorageService.exportJSON(state));
    exportCsvBtn?.addEventListener("click", () => StorageService.exportCSV(state));
    importInput?.addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (!file) return;
      StorageService.importFile(file, (error, parsed) => {
        if (error) return alert(error.message);
        state = parsed;
        applyTheme();
        alert("데이터를 불러왔습니다. 페이지를 새로고침하면 전체 화면에 반영됩니다.");
      });
    });
    resetBtn?.addEventListener("click", () => {
      if (!confirm("모든 데이터를 초기화할까요?")) return;
      state = StorageService.reset();
      applyTheme();
      alert("초기화되었습니다. 페이지를 새로고침해 주세요.");
    });
  }

  function createKeywordBlockHtml(index) {
    return `
      <article class="keyword-edit-row" data-keyword-row="${index}">
        <div class="repeat-block-header">
          <h5>키워드 블록 ${index + 1}</h5>
          <button class="btn danger" type="button" data-remove-keyword-row="${index}">삭제</button>
        </div>
        <div class="form-grid two">
          <div class="form-group">
            <label>키워드</label>
            <input name="keywordWord" placeholder="예: 정규화" />
          </div>
          <div class="form-group">
            <label>키워드 설명</label>
            <textarea name="keywordDescription" placeholder="키워드 설명을 입력하세요."></textarea>
          </div>
        </div>
      </article>
    `;
  }

  function createContentBlockHtml(index) {
    return `
      <article class="card repeat-block" data-batch-row="${index}">
        <div class="repeat-block-header">
          <h4>콘텐츠 블록 ${index + 1}</h4>
          <button class="btn danger" type="button" data-remove-batch-row="${index}">삭제</button>
        </div>
        <div class="form-grid two">
          <div class="form-group">
            <label>주제</label>
            <input name="topic" required placeholder="예: 정규화" />
          </div>
          <div class="form-group">
            <label>소주제</label>
            <input name="subtopic" required placeholder="예: 제2정규형" />
          </div>
        </div>
        <div class="form-group">
          <label>내용</label>
          <textarea name="content" required placeholder="학습 콘텐츠 본문"></textarea>
        </div>
        <div class="form-group">
          <div class="repeat-block-header">
            <label style="margin:0;">키워드 목록</label>
            <button class="btn secondary" type="button" data-add-keyword-row>키워드 블록 추가</button>
          </div>
          <div class="keyword-blocks" data-keyword-rows></div>
        </div>
      </article>
    `;
  }

  function initAdminWrittenPage() {
    const form = UIUtils.qs("#adminWrittenForm");
    const typeEl = UIUtils.qs("#writtenType");
    const subjectSelect = UIUtils.qs("#writtenSubject");
    const rowsWrap = UIUtils.qs("#contentBatchRows");
    const addRowBtn = UIUtils.qs("#addContentRowBtn");
    if (!form || !typeEl || !subjectSelect || !rowsWrap || !addRowBtn) return;

    let rowCount = 0;

    function renderSubjectOptions() {
      const subjects = window.FixedSubjects?.[typeEl.value] || [];
      subjectSelect.innerHTML = subjects.map((subject) => `<option value="${subject}">${subject}</option>`).join("");
    }

    function bindKeywordControls(rowEl) {
      const keywordWrap = UIUtils.qs("[data-keyword-rows]", rowEl);
      const addKeywordBtn = UIUtils.qs("[data-add-keyword-row]", rowEl);
      if (!keywordWrap || !addKeywordBtn) return;

      function addKeywordRow() {
        const nextIndex = UIUtils.qsa("[data-keyword-row]", keywordWrap).length;
        keywordWrap.insertAdjacentHTML("beforeend", createKeywordBlockHtml(nextIndex));
        bindKeywordDeleteButtons();
      }

      function bindKeywordDeleteButtons() {
        UIUtils.qsa("[data-remove-keyword-row]", keywordWrap).forEach((btn) => {
          btn.onclick = () => {
            btn.closest("[data-keyword-row]")?.remove();
            if (!UIUtils.qsa("[data-keyword-row]", keywordWrap).length) addKeywordRow();
          };
        });
      }

      addKeywordBtn.onclick = addKeywordRow;
      addKeywordRow();
    }

    function addRow() {
      rowsWrap.insertAdjacentHTML("beforeend", createContentBlockHtml(rowCount));
      const newRow = rowsWrap.lastElementChild;
      if (newRow) bindKeywordControls(newRow);
      rowCount += 1;
      bindRowDeleteButtons();
    }

    function bindRowDeleteButtons() {
      UIUtils.qsa("[data-remove-batch-row]", rowsWrap).forEach((btn) => {
        btn.onclick = () => {
          btn.closest("[data-batch-row]")?.remove();
          if (!UIUtils.qsa("[data-batch-row]", rowsWrap).length) addRow();
        };
      });
    }

    function collectKeywords(block) {
      return UIUtils.qsa("[data-keyword-row]", block)
        .map((row) => {
          const word = UIUtils.qs('[name="keywordWord"]', row)?.value.trim() || "";
          const description = UIUtils.qs('[name="keywordDescription"]', row)?.value.trim() || "";
          if (!word && !description) return null;
          return { word, description };
        })
        .filter(Boolean);
    }

    function saveWrittenBatch(type, subjectName, entries) {
      const subject = state.written[type].find((item) => item.subject === subjectName);
      if (!subject) return alert("선택한 과목을 찾을 수 없습니다.");
      entries.forEach((entry) => {
        let topic = subject.topics.find((item) => item.name === entry.topic);
        if (!topic) {
          topic = { name: entry.topic, subtopics: [] };
          subject.topics.push(topic);
        }
        topic.subtopics.push({
          id: crypto.randomUUID(),
          name: entry.subtopic,
          content: entry.content,
          keywords: entry.keywords
        });
      });
      sync(state);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = typeEl.value;
      const subject = subjectSelect.value;
      const blocks = UIUtils.qsa("[data-batch-row]", rowsWrap);
      const entries = [];

      for (const block of blocks) {
        const topic = UIUtils.qs('[name="topic"]', block)?.value.trim() || "";
        const subtopic = UIUtils.qs('[name="subtopic"]', block)?.value.trim() || "";
        const content = UIUtils.qs('[name="content"]', block)?.value.trim() || "";
        const keywords = collectKeywords(block);
        if (!topic || !subtopic || !content) {
          alert("모든 콘텐츠 블록에 주제, 소주제, 내용을 입력해 주세요.");
          return;
        }
        entries.push({ topic, subtopic, content, keywords });
      }

      if (!entries.length) return alert("저장할 콘텐츠가 없습니다.");
      saveWrittenBatch(type, subject, entries);
      rowsWrap.innerHTML = "";
      rowCount = 0;
      addRow();
      alert("콘텐츠가 일괄 저장되었습니다.");
    });

    typeEl.addEventListener("change", renderSubjectOptions);
    addRowBtn.addEventListener("click", addRow);

    renderSubjectOptions();
    addRow();
  }

  function initAdminProblemPage() {
    const form = UIUtils.qs("#adminProblemForm");
    const list = UIUtils.qs("#adminProblemList");
    const typeSelect = UIUtils.qs("#problemTypeSelect");
    const categorySelect = UIUtils.qs("#problemCategorySelect");
    if (!form || !list || !typeSelect || !categorySelect) return;

    function renderCategoryOptions() {
      const target = typeSelect.value;
      categorySelect.innerHTML = getProblemCategories(target).map((category) => `<option value="${category}">${category}</option>`).join("");
    }

    function render() {
      const rows = [
        ...state.problems.sql.map((item) => ({ ...item, type: "sql" })),
        ...state.problems.coding.map((item) => ({ ...item, type: "coding" }))
      ];
      list.innerHTML = rows.map((item) => `
        <article class="card">
          <div class="inline-actions" style="justify-content:space-between; align-items:center;">
            <div><div class="badge">${item.type.toUpperCase()} / ${item.category}</div><h4>${item.purpose}</h4></div>
            <button class="btn danger" data-delete-problem="${item.id}" data-delete-kind="${item.type}">삭제</button>
          </div>
          <pre class="small" style="white-space:pre-wrap;">${escapeHtml(item.code)}</pre>
          <p><strong>정답:</strong> ${item.answer}</p>
          <p class="muted">${item.explanation}</p>
        </article>
      `).join("");
      UIUtils.qsa("[data-delete-problem]", list).forEach((btn) => btn.addEventListener("click", () => {
        const type = btn.dataset.deleteKind;
        const id = btn.dataset.deleteProblem;
        state.problems[type] = state.problems[type].filter((item) => item.id !== id);
        sync(state);
        render();
      }));
    }

    typeSelect.addEventListener("change", renderCategoryOptions);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const target = fd.get("type");
      state.problems[target].push({
        id: crypto.randomUUID(),
        category: fd.get("category").trim(),
        purpose: fd.get("purpose").trim(),
        code: fd.get("code").trim(),
        answer: fd.get("answer").trim(),
        explanation: fd.get("explanation").trim()
      });
      sync(state);
      form.reset();
      typeSelect.value = target;
      renderCategoryOptions();
      render();
      alert("문제가 저장되었습니다.");
    });

    renderCategoryOptions();
    render();
  }

  function initAdminBankPage() {
    const form = UIUtils.qs("#adminBankForm");
    const list = UIUtils.qs("#adminBankList");
    if (!form || !list) return;

    function render() {
      list.innerHTML = state.problems.bank.map((item) => `
        <article class="card">
          <div class="inline-actions" style="justify-content:space-between; align-items:center;">
            <div><div class="badge">${item.type}</div><h4>${item.question}</h4></div>
            <button class="btn danger" data-delete-bank="${item.id}">삭제</button>
          </div>
          <p><strong>답안:</strong> ${item.answer}</p>
          <p class="muted">${item.explanation}</p>
        </article>
      `).join("");

      UIUtils.qsa("[data-delete-bank]", list).forEach((btn) => btn.addEventListener("click", () => {
        state.problems.bank = state.problems.bank.filter((item) => item.id !== btn.dataset.deleteBank);
        sync(state);
        render();
      }));
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      state.problems.bank.unshift({
        id: crypto.randomUUID(),
        type: fd.get("type").trim(),
        question: fd.get("question").trim(),
        answer: fd.get("answer").trim(),
        explanation: fd.get("explanation").trim()
      });
      sync(state);
      form.reset();
      render();
      alert("문제은행 항목이 저장되었습니다.");
    });

    render();
  }

  function initAdminDataPage() {
    const summary = UIUtils.qs("#dataSummary");
    const preview = UIUtils.qs("#dataPreview");
    const exportJsonBtn = UIUtils.qs("#adminExportJsonBtn");
    const exportCsvBtn = UIUtils.qs("#adminExportCsvBtn");
    const importInput = UIUtils.qs("#adminImportJsonInput");
    const sectionFilter = UIUtils.qs("#adminDataSectionFilter");
    const searchInput = UIUtils.qs("#adminDataSearch");
    if (!summary || !preview || !sectionFilter || !searchInput) return;

    function getEditableRows() {
      const rows = [];
      state.written.필기.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.subtopics.forEach((sub) => {
            rows.push({
              section: "필기",
              id: sub.id || `${subject.subject}__${topic.name}__${sub.name}`,
              subject: subject.subject,
              topic: topic.name,
              subtopic: sub.name,
              content: sub.content,
              keywords: (sub.keywords || []).map((item) => `${item.word}:${item.description}`).join(" | "),
              ref: { subjectName: subject.subject, topicName: topic.name, subtopicName: sub.name }
            });
          });
        });
      });
      state.written.실기.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.subtopics.forEach((sub) => {
            rows.push({
              section: "실기",
              id: sub.id || `${subject.subject}__${topic.name}__${sub.name}`,
              subject: subject.subject,
              topic: topic.name,
              subtopic: sub.name,
              content: sub.content,
              keywords: (sub.keywords || []).map((item) => `${item.word}:${item.description}`).join(" | "),
              ref: { subjectName: subject.subject, topicName: topic.name, subtopicName: sub.name }
            });
          });
        });
      });
      state.problems.sql.forEach((item) => rows.push({
        section: "SQL", id: item.id, category: item.category, purpose: item.purpose, code: item.code, answer: item.answer, explanation: item.explanation
      }));
      state.problems.coding.forEach((item) => rows.push({
        section: "CODING", id: item.id, category: item.category, purpose: item.purpose, code: item.code, answer: item.answer, explanation: item.explanation
      }));
      state.problems.bank.forEach((item) => rows.push({
        section: "BANK", id: item.id, type: item.type, question: item.question, answer: item.answer, explanation: item.explanation
      }));
      state.records.forEach((item) => rows.push({
        section: "RECORD", id: item.id, date: item.date, subject: item.subject, category: item.category, minutes: item.minutes, memo: item.memo
      }));
      return rows;
    }

    function matchesSearch(row, keyword) {
      if (!keyword) return true;
      const haystack = Object.values(row).filter((value) => typeof value !== "object").join(" ").toLowerCase();
      return haystack.includes(keyword);
    }

    function updateRow(section, id, fd) {
      if (section === "필기" || section === "실기") {
        const subject = state.written[section].find((item) => item.subject === fd.get("subject").trim());
        if (!subject) return alert("선택한 과목을 찾을 수 없습니다.");
        let topic = subject.topics.find((item) => item.name === fd.get("topicOriginal"));
        if (!topic) topic = subject.topics.find((item) => item.name === fd.get("topic").trim());
        if (!topic) return alert("수정 대상 주제를 찾을 수 없습니다.");
        const sub = topic.subtopics.find((item) => (item.id || `${subject.subject}__${topic.name}__${item.name}`) === id || item.name === fd.get("subtopicOriginal"));
        if (!sub) return alert("수정 대상 소주제를 찾을 수 없습니다.");
        topic.name = fd.get("topic").trim();
        sub.name = fd.get("subtopic").trim();
        sub.content = fd.get("content").trim();
        sub.keywords = parseKeywords(fd.get("keywords").trim());
      } else if (section === "SQL" || section === "CODING") {
        const key = section === "SQL" ? "sql" : "coding";
        const target = state.problems[key].find((item) => item.id === id);
        if (!target) return;
        target.category = fd.get("category").trim();
        target.purpose = fd.get("purpose").trim();
        target.code = fd.get("code").trim();
        target.answer = fd.get("answer").trim();
        target.explanation = fd.get("explanation").trim();
      } else if (section === "BANK") {
        const target = state.problems.bank.find((item) => item.id === id);
        if (!target) return;
        target.type = fd.get("type").trim();
        target.question = fd.get("question").trim();
        target.answer = fd.get("answer").trim();
        target.explanation = fd.get("explanation").trim();
      } else if (section === "RECORD") {
        const target = state.records.find((item) => item.id === id);
        if (!target) return;
        target.date = fd.get("date").trim();
        target.subject = fd.get("subject").trim();
        target.category = fd.get("category").trim();
        target.minutes = Number(fd.get("minutes") || 0);
        target.memo = fd.get("memo").trim();
      }
      sync(state);
      render();
      alert("수정 내용이 저장되었습니다.");
    }

    function deleteRow(section, id) {
      if (section === "필기" || section === "실기") {
        const subjects = state.written[section];
        subjects.forEach((subject) => {
          subject.topics = subject.topics.map((topic) => ({
            ...topic,
            subtopics: topic.subtopics.filter((sub) => (sub.id || `${subject.subject}__${topic.name}__${sub.name}`) !== id)
          })).filter((topic) => topic.subtopics.length > 0);
        });
      } else if (section === "SQL") {
        state.problems.sql = state.problems.sql.filter((item) => item.id !== id);
      } else if (section === "CODING") {
        state.problems.coding = state.problems.coding.filter((item) => item.id !== id);
      } else if (section === "BANK") {
        state.problems.bank = state.problems.bank.filter((item) => item.id !== id);
      } else if (section === "RECORD") {
        state.records = state.records.filter((item) => item.id !== id);
      }
      sync(state);
      render();
    }

    function render() {
      const rows = getEditableRows();
      const keyword = searchInput.value.trim().toLowerCase();
      const section = sectionFilter.value;
      const filtered = rows.filter((row) => (section === "all" || row.section === section) && matchesSearch(row, keyword));

      summary.innerHTML = `
        <article class="card"><h4>필기 과목</h4><div class="value">${state.written.필기.length}</div></article>
        <article class="card"><h4>실기 과목</h4><div class="value">${state.written.실기.length}</div></article>
        <article class="card"><h4>SQL 문제</h4><div class="value">${state.problems.sql.length}</div></article>
        <article class="card"><h4>코딩 문제</h4><div class="value">${state.problems.coding.length}</div></article>
        <article class="card"><h4>문제은행</h4><div class="value">${state.problems.bank.length}</div></article>
        <article class="card"><h4>학습 기록</h4><div class="value">${state.records.length}</div></article>
      `;

      if (!filtered.length) {
        preview.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
        return;
      }

      preview.innerHTML = filtered.map((row) => {
        if (row.section === "필기" || row.section === "실기") {
          return `
            <article class="card" style="margin-bottom:16px;">
              <div class="inline-actions" style="justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div><div class="badge">${row.section}</div><h4>${row.subject} / ${row.topic} / ${row.subtopic}</h4></div>
                <button class="btn danger" data-delete-row="${row.id}" data-section="${row.section}">삭제</button>
              </div>
              <form class="form-grid" data-edit-row="${row.id}" data-section="${row.section}">
                <input type="hidden" name="topicOriginal" value="${escapeHtml(row.topic)}" />
                <input type="hidden" name="subtopicOriginal" value="${escapeHtml(row.subtopic)}" />
                <div class="form-grid two">
                  <div class="form-group"><label>과목</label><input name="subject" value="${escapeHtml(row.subject)}" readonly /></div>
                  <div class="form-group"><label>주제</label><input name="topic" value="${escapeHtml(row.topic)}" required /></div>
                </div>
                <div class="form-group"><label>소주제</label><input name="subtopic" value="${escapeHtml(row.subtopic)}" required /></div>
                <div class="form-group"><label>내용</label><textarea name="content" required>${escapeHtml(row.content)}</textarea></div>
                <div class="form-group"><label>키워드</label><textarea name="keywords">${escapeHtml(row.keywords)}</textarea></div>
                <button class="btn primary" type="submit">변경 저장</button>
              </form>
            </article>
          `;
        }
        if (row.section === "SQL" || row.section === "CODING") {
          const categories = getProblemCategories(row.section === "SQL" ? "sql" : "coding");
          return `
            <article class="card" style="margin-bottom:16px;">
              <div class="inline-actions" style="justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div><div class="badge">${row.section}</div><h4>${row.purpose}</h4></div>
                <button class="btn danger" data-delete-row="${row.id}" data-section="${row.section}">삭제</button>
              </div>
              <form class="form-grid" data-edit-row="${row.id}" data-section="${row.section}">
                <div class="form-grid two">
                  <div class="form-group"><label>대분류</label><select name="category">${categories.map((category) => `<option value="${category}" ${category === row.category ? "selected" : ""}>${category}</option>`).join("")}</select></div>
                  <div class="form-group"><label>문제 목적</label><input name="purpose" value="${escapeHtml(row.purpose)}" required /></div>
                </div>
                <div class="form-group"><label>문제 코드</label><textarea name="code" required>${escapeHtml(row.code)}</textarea></div>
                <div class="form-grid two">
                  <div class="form-group"><label>정답</label><input name="answer" value="${escapeHtml(row.answer)}" required /></div>
                  <div class="form-group"><label>문제 해설</label><textarea name="explanation" required>${escapeHtml(row.explanation)}</textarea></div>
                </div>
                <button class="btn primary" type="submit">변경 저장</button>
              </form>
            </article>
          `;
        }
        if (row.section === "BANK") {
          return `
            <article class="card" style="margin-bottom:16px;">
              <div class="inline-actions" style="justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div><div class="badge">문제은행</div><h4>${row.question}</h4></div>
                <button class="btn danger" data-delete-row="${row.id}" data-section="${row.section}">삭제</button>
              </div>
              <form class="form-grid" data-edit-row="${row.id}" data-section="${row.section}">
                <div class="form-group"><label>분류</label><input name="type" value="${escapeHtml(row.type)}" required /></div>
                <div class="form-group"><label>문제</label><textarea name="question" required>${escapeHtml(row.question)}</textarea></div>
                <div class="form-group"><label>답안</label><input name="answer" value="${escapeHtml(row.answer)}" required /></div>
                <div class="form-group"><label>설명</label><textarea name="explanation" required>${escapeHtml(row.explanation)}</textarea></div>
                <button class="btn primary" type="submit">변경 저장</button>
              </form>
            </article>
          `;
        }
        return `
          <article class="card" style="margin-bottom:16px;">
            <div class="inline-actions" style="justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div><div class="badge">학습 기록</div><h4>${row.subject}</h4></div>
              <button class="btn danger" data-delete-row="${row.id}" data-section="${row.section}">삭제</button>
            </div>
            <form class="form-grid" data-edit-row="${row.id}" data-section="${row.section}">
              <div class="form-grid two">
                <div class="form-group"><label>날짜</label><input name="date" value="${escapeHtml(row.date)}" required /></div>
                <div class="form-group"><label>분류</label><input name="category" value="${escapeHtml(row.category)}" required /></div>
              </div>
              <div class="form-group"><label>과목</label><input name="subject" value="${escapeHtml(row.subject)}" required /></div>
              <div class="form-grid two">
                <div class="form-group"><label>학습 시간(분)</label><input type="number" name="minutes" min="0" value="${escapeHtml(row.minutes)}" required /></div>
                <div class="form-group"><label>메모</label><textarea name="memo" required>${escapeHtml(row.memo)}</textarea></div>
              </div>
              <button class="btn primary" type="submit">변경 저장</button>
            </form>
          </article>
        `;
      }).join("");

      UIUtils.qsa("[data-edit-row]", preview).forEach((form) => form.addEventListener("submit", (event) => {
        event.preventDefault();
        updateRow(form.dataset.section, form.dataset.editRow, new FormData(form));
      }));
      UIUtils.qsa("[data-delete-row]", preview).forEach((btn) => btn.addEventListener("click", () => {
        deleteRow(btn.dataset.section, btn.dataset.deleteRow);
      }));
    }

    exportJsonBtn?.addEventListener("click", () => StorageService.exportJSON(state));
    exportCsvBtn?.addEventListener("click", () => StorageService.exportCSV(state));
    importInput?.addEventListener("change", (event) => {
      const [file] = event.target.files || [];
      if (!file) return;
      StorageService.importFile(file, (error, parsed) => {
        if (error) return alert(error.message);
        state = parsed;
        render();
        applyTheme();
        alert("전체 데이터를 불러왔습니다.");
      });
    });
    sectionFilter.addEventListener("change", render);
    searchInput.addEventListener("input", render);

    render();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
