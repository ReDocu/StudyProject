window.UIUtils = (() => {
  function qs(selector, parent = document) {
    return parent.querySelector(selector);
  }
  function qsa(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }
  function create(tag, className, html) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (html !== undefined) el.innerHTML = html;
    return el;
  }
  function formatMinutes(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}분`;
    return `${h}시간 ${m}분`;
  }
  function today() {
    return new Date().toISOString().slice(0, 10);
  }
  function weekStats(records) {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    records.forEach((r) => {
      if (days[r.date] !== undefined) days[r.date] += Number(r.minutes || 0);
    });
    return days;
  }
  return { qs, qsa, create, formatMinutes, today, weekStats };
})();
