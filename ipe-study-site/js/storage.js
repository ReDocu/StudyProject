window.StorageService = (() => {
  const KEY = "ipe-study-site-v1";

  function cloneSeed() {
    return JSON.parse(JSON.stringify(window.SeedData));
  }

  function createSubjectShell(subject) {
    return { id: crypto.randomUUID(), subject, topics: [] };
  }

  function normalizeWrittenByType(type, list) {
    const fixed = (window.FixedSubjects?.[type] || []).map((subject) => {
      const found = (list || []).find((item) => item.subject === subject);
      return found ? { ...found, topics: Array.isArray(found.topics) ? found.topics : [] } : createSubjectShell(subject);
    });
    return fixed;
  }

  function normalizeProblemList(kind, list, fallback) {
    const fixedCategories = window.FixedProblemCategories?.[kind] || [];
    const source = Array.isArray(list) ? list : fallback;
    return (source || []).map((item) => {
      const raw = String(item?.category || '').trim();
      const matched = fixedCategories.find((name) => name.toLowerCase() === raw.toLowerCase());
      const defaultCategory = fixedCategories[0] || raw || '';
      return { ...item, category: matched || defaultCategory };
    });
  }

  function normalize(data) {
    const base = cloneSeed();
    const merged = {
      ...base,
      ...data,
      settings: { ...base.settings, ...(data?.settings || {}) },
      progress: { ...base.progress, ...(data?.progress || {}) },
      written: {
        필기: normalizeWrittenByType("필기", data?.written?.필기 || base.written.필기),
        실기: normalizeWrittenByType("실기", data?.written?.실기 || base.written.실기)
      },
      problems: {
        sql: normalizeProblemList("sql", data?.problems?.sql, base.problems.sql),
        coding: normalizeProblemList("coding", data?.problems?.coding, base.problems.coding),
        bank: Array.isArray(data?.problems?.bank) ? data.problems.bank : base.problems.bank
      },
      records: Array.isArray(data?.records) ? data.records : base.records,
      updates: Array.isArray(data?.updates) ? data.updates : base.updates
    };
    merged.progress.completedStudyKeys = Array.isArray(merged.progress.completedStudyKeys)
      ? merged.progress.completedStudyKeys
      : [];
    return merged;
  }

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = normalize(cloneSeed());
      save(seed);
      return seed;
    }
    try {
      const parsed = JSON.parse(raw);
      const normalized = normalize(parsed);
      save(normalized);
      return normalized;
    } catch (error) {
      const seed = normalize(cloneSeed());
      save(seed);
      return seed;
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(normalize(data)));
  }

  function reset() {
    const seed = normalize(cloneSeed());
    save(seed);
    return seed;
  }

  function exportJSON(data) {
    downloadFile("ipe-study-data.json", JSON.stringify(normalize(data), null, 2), "application/json");
  }

  function exportCSV(data) {
    const rows = [];
    const normalized = normalize(data);
    rows.push(["section", "field1", "field2", "field3", "field4", "field5"]);

    normalized.written.필기.forEach((subject) => {
      subject.topics.forEach((topic) => {
        topic.subtopics.forEach((sub) => {
          rows.push(["필기", subject.subject, topic.name, sub.name, sub.content, sub.keywords.map(k => `${k.word}:${k.description}`).join(" | ")]);
        });
      });
    });

    normalized.written.실기.forEach((subject) => {
      subject.topics.forEach((topic) => {
        topic.subtopics.forEach((sub) => {
          rows.push(["실기", subject.subject, topic.name, sub.name, sub.content, sub.keywords.map(k => `${k.word}:${k.description}`).join(" | ")]);
        });
      });
    });

    normalized.problems.sql.forEach((item) => rows.push(["SQL", item.category, item.purpose, item.code, item.answer, item.explanation]));
    normalized.problems.coding.forEach((item) => rows.push(["CODING", item.category, item.purpose, item.code, item.answer, item.explanation]));
    normalized.problems.bank.forEach((item) => rows.push(["BANK", item.type, item.question, item.answer, item.explanation, ""]));
    normalized.records.forEach((item) => rows.push(["RECORD", item.date, item.subject, item.category, String(item.minutes), item.memo]));

    const csv = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
    downloadFile("ipe-study-data.csv", csv, "text/csv;charset=utf-8;");
  }

  function importFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const normalized = normalize(parsed);
        save(normalized);
        callback(null, normalized);
      } catch (error) {
        callback(new Error("JSON 파일 형식이 올바르지 않습니다."));
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function escapeCSV(value) {
    const safe = String(value ?? "").replace(/"/g, '""');
    return `"${safe}"`;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { KEY, load, save, reset, exportJSON, exportCSV, importFile, normalize };
})();
