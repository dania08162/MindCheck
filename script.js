const STORAGE_KEY = "mindcheck-checkins";

const form = document.querySelector("#checkinForm");
const resetButton = document.querySelector("#resetButton");

const inputs = {
  screenTime: document.querySelector("#screenTime"),
  homeworkHours: document.querySelector("#homeworkHours"),
  socialInteractions: document.querySelector("#socialInteractions"),
  assignmentsDue: document.querySelector("#assignmentsDue"),
  meals: document.querySelector("#meals"),
  isolation: document.querySelector("#isolation"),
  focus: document.querySelector("#focus"),
  headache: document.querySelector("#headache"),
  note: document.querySelector("#note"),
  screenUpload: document.querySelector("#screenUpload"),
  journalScan: document.querySelector("#journalScan"),
};

const output = {
  sleep: document.querySelector("#sleepOutput"),
  stress: document.querySelector("#stressOutput"),
  mood: document.querySelector("#moodOutput"),
  energy: document.querySelector("#energyOutput"),
  score: document.querySelector("#scoreValue"),
  percent: document.querySelector("#gaugePercent"),
  ring: document.querySelector("#gaugeRing"),
  title: document.querySelector("#riskTitle"),
  chip: document.querySelector("#statusChip"),
  status: document.querySelector("#statusText"),
  signals: document.querySelector("#signalList"),
  patterns: document.querySelector("#patternStack"),
  history: document.querySelector("#historyList"),
  trend: document.querySelector("#trendText"),
  crack: document.querySelector("#crackGraph"),
  batteryFill: document.querySelector("#batteryFill"),
  batteryText: document.querySelector("#batteryText"),
  calendar: document.querySelector("#calendarInsight"),
  screen: document.querySelector("#screenInsight"),
  forecast: document.querySelector("#forecastCard"),
  academic: document.querySelector("#academicInsight"),
  backpackFill: document.querySelector("#backpackFill"),
  backpack: document.querySelector("#backpackInsight"),
  language: document.querySelector("#languageInsight"),
  twin: document.querySelector("#burnoutTwin"),
  twinText: document.querySelector("#twinText"),
};

let checkins = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function getCheckedValue(name) {
  return Number(document.querySelector(`input[name="${name}"]:checked`).value);
}

function getNumber(id) {
  return Number(inputs[id].value || 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function getCurrentData() {
  return {
    sleep: getCheckedValue("sleep"),
    stress: getCheckedValue("stress"),
    mood: getCheckedValue("mood"),
    energy: getCheckedValue("energy"),
    screenTime: getNumber("screenTime"),
    homeworkHours: getNumber("homeworkHours"),
    socialInteractions: getNumber("socialInteractions"),
    assignmentsDue: getNumber("assignmentsDue"),
    meals: inputs.meals.checked,
    isolation: inputs.isolation.checked,
    focus: inputs.focus.checked,
    headache: inputs.headache.checked,
    note: inputs.note.value.trim(),
  };
}

function levelFromScore(score) {
  if (score >= 78) return "risk";
  if (score >= 58) return "stress";
  if (score >= 36) return "watch";
  return "stable";
}

function levelText(level) {
  const labels = {
    stable: ["Stable", "Stable"],
    watch: ["Watch Out", "Watch Out"],
    stress: ["High Stress", "High Stress"],
    risk: ["Burnout Risk", "Burnout Risk"],
  };

  return labels[level];
}

function calculateRisk(data, history = checkins) {
  let score = 0;
  const signals = [];

  score += Math.max(0, 7.5 - data.sleep) * 8;
  score += Math.max(0, data.screenTime - 4) * 3.5;
  score += Math.max(0, data.homeworkHours - 2) * 5;
  score += data.stress * 4.2;
  score += Math.max(0, 7 - data.mood) * 5;
  score += Math.max(0, 7 - data.energy) * 5.5;
  score += Math.max(0, 3 - data.socialInteractions) * 4;
  score += data.assignmentsDue * 2.8;

  if (data.sleep < 6) signals.push("Sleep has dropped below the recovery zone.");
  if (data.screenTime >= 7) signals.push("Screen time is high enough to flag digital exhaustion.");
  if (data.homeworkHours >= 5) signals.push("Homework hours are crowding out recovery time.");
  if (data.energy <= 4) signals.push("Energy is low even before tomorrow's load begins.");
  if (data.socialInteractions <= 1) signals.push("Social connection is unusually low.");
  if (data.assignmentsDue >= 4) signals.push("Assignments are clustering into a deadline spike.");

  const toggles = [
    [data.meals, 7, "Skipped meals are adding physical strain."],
    [data.isolation, 9, "Withdrawal is showing up as a hidden warning sign."],
    [data.focus, 7, "Focus trouble suggests overload."],
    [data.headache, 6, "Physical tension is showing up in the body."],
  ];

  toggles.forEach(([active, weight, message]) => {
    if (active) {
      score += weight;
      signals.push(message);
    }
  });

  const recent = history.slice(0, 5);
  if (recent.length >= 3) {
    const average = averageOf(recent, "score");
    if (average >= 60) {
      score += 8;
      signals.push("Recent check-ins show a repeated elevated-risk pattern.");
    }
  }

  const capped = Math.min(100, Math.round(score));
  return {
    score: capped,
    level: levelFromScore(capped),
    signals: signals.slice(0, 6),
  };
}

function averageOf(items, key) {
  return items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / Math.max(items.length, 1);
}

function percentChange(oldValue, newValue) {
  if (!oldValue) return 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100);
}

function renderCurrent() {
  const data = getCurrentData();
  const risk = calculateRisk(data);
  const [title, status] = levelText(risk.level);
  const color = `var(--level-${risk.level})`;
  const battery = Math.max(0, 100 - risk.score);

  output.sleep.textContent = `${data.sleep} ${data.sleep === 1 ? "hour" : "hours"}`;
  output.stress.textContent = `${data.stress} / 10`;
  output.mood.textContent = `${data.mood} / 10`;
  output.energy.textContent = `${data.energy} / 10`;
  output.score.textContent = risk.score;
  output.percent.textContent = `${risk.score}%`;
  output.title.textContent = title;
  output.status.textContent = status;
  output.ring.style.background = `conic-gradient(${color} ${risk.score * 3.6}deg, rgba(190, 236, 226, 0.16) 0deg)`;
  output.chip.querySelector(".status-dot").style.background = color;
  output.batteryFill.style.width = `${battery}%`;
  output.batteryText.textContent = `Battery: ${battery}%`;

  document.querySelectorAll(".level-pill").forEach((pill) => {
    pill.classList.toggle("active", pill.classList.contains(risk.level));
  });

  output.signals.innerHTML = risk.signals.length
    ? risk.signals.map((signal) => `<p>${escapeHtml(signal)}</p>`).join("")
    : "<p>No major warning signs detected from this check-in.</p>";

  renderPatterns(risk);
  renderTrend(data, risk);
  renderCrackGraph(risk);
  renderCalendar(data);
  renderAcademic(data, risk);
  renderTwin(risk);
}

function renderPatterns(currentRisk) {
  const recent = checkins.slice(0, 7);
  const highRiskDays = recent.filter((item) => item.score >= 58).length;
  const lowSleepDays = recent.filter((item) => item.sleep < 6).length;
  const highScreenDays = recent.filter((item) => item.screenTime >= 7).length;
  const lowSocialDays = recent.filter((item) => item.socialInteractions <= 1).length;

  const cards = [
    {
      level: currentRisk.level,
      title: "Today",
      text: currentRisk.signals[0] || "Today looks stable from the data entered.",
    },
    {
      level: highRiskDays >= 3 ? "risk" : highRiskDays >= 1 ? "watch" : "stable",
      title: "Risk streak",
      text:
        highRiskDays >= 1
          ? `${highRiskDays} recent saved check-in${highRiskDays === 1 ? "" : "s"} were elevated.`
          : "No elevated streak detected yet.",
    },
    {
      level: lowSleepDays >= 3 ? "risk" : lowSleepDays >= 1 ? "watch" : "stable",
      title: "Recovery debt",
      text:
        lowSleepDays >= 1
          ? `${lowSleepDays} recent check-in${lowSleepDays === 1 ? "" : "s"} had under 6 hours of sleep.`
          : "Sleep recovery is not currently flagged.",
    },
    {
      level: highScreenDays + lowSocialDays >= 3 ? "stress" : "stable",
      title: "Digital + social load",
      text:
        highScreenDays || lowSocialDays
          ? `${highScreenDays} high-screen day${highScreenDays === 1 ? "" : "s"} and ${lowSocialDays} low-social day${lowSocialDays === 1 ? "" : "s"} are visible.`
          : "No digital exhaustion pattern saved yet.",
    },
  ];

  output.patterns.innerHTML = cards
    .map(
      (card) => `
        <div class="pattern-card ${card.level}">
          <strong>${escapeHtml(card.title)}</strong>
          <span>${escapeHtml(card.text)}</span>
        </div>
      `
    )
    .join("");
}

function renderTrend(currentData) {
  const recent = [currentData, ...checkins].slice(0, 14);
  if (recent.length < 4) {
    output.trend.textContent =
      "Save more check-ins to unlock exact trend comparisons like sleep down 25% while workload rises 40%.";
    return;
  }

  const midpoint = Math.ceil(recent.length / 2);
  const newer = recent.slice(0, midpoint);
  const older = recent.slice(midpoint);
  const oldSleep = averageOf(older, "sleep");
  const newSleep = averageOf(newer, "sleep");
  const oldWork = averageOf(older, "homeworkHours") + averageOf(older, "assignmentsDue");
  const newWork = averageOf(newer, "homeworkHours") + averageOf(newer, "assignmentsDue");
  const sleepChange = percentChange(oldSleep, newSleep);
  const workChange = percentChange(oldWork, newWork);

  output.trend.textContent =
    `Your sleep has ${sleepChange < 0 ? "dropped" : "changed"} ${Math.abs(sleepChange)}% while workload has ${workChange >= 0 ? "increased" : "changed"} ${Math.abs(workChange)}% across recent check-ins.`;
}

function renderCrackGraph(currentRisk) {
  const scores = [currentRisk.score, ...checkins.map((item) => item.score)].slice(0, 8).reverse();
  const points = scores.map((score, index) => {
    const x = 18 + index * (264 / Math.max(scores.length - 1, 1));
    const y = 112 - score;
    return `${x},${Math.max(16, y)}`;
  });
  const crackCount = Math.max(2, Math.round(currentRisk.score / 18));
  const cracks = Array.from({ length: crackCount }, (_, index) => {
    const x = 40 + index * 42;
    const height = 16 + currentRisk.score / 5;
    return `<path d="M ${x} 44 l 18 ${height} l -12 16 l 24 22" />`;
  }).join("");

  output.crack.innerHTML = `
    <svg viewBox="0 0 320 130" role="img" aria-label="Compounding burnout crack graph">
      <path class="glass-line" d="M 16 112 H 304" />
      <polyline class="risk-line" points="${points.join(" ")}" />
      <g class="cracks">${cracks}</g>
    </svg>
  `;
}

function renderCalendar(data) {
  const busyBlocks = data.assignmentsDue + Math.round(data.homeworkHours / 2);
  const freeTime = Math.max(0, 6 - data.homeworkHours - data.assignmentsDue * 0.45);
  output.calendar.textContent =
    busyBlocks >= 5
      ? `Calendar scan: less than ${freeTime.toFixed(1)} hours of open time predicted because deadlines and homework are stacking.`
      : `Calendar scan: about ${freeTime.toFixed(1)} hours of open time remains if today's load repeats.`;
}

function renderAcademic(data, risk) {
  const storm = data.assignmentsDue >= 5 || risk.score >= 78;
  const busy = data.assignmentsDue >= 3 || data.homeworkHours >= 5 || risk.score >= 58;
  output.forecast.textContent = storm ? "Burnout Storm" : busy ? "Busy Front" : "Calm";
  output.forecast.className = `forecast-card ${storm ? "storm" : busy ? "busy" : "calm"}`;
  output.academic.textContent = storm
    ? `High stress front expected next week due to ${data.assignmentsDue} overlapping deadlines.`
    : busy
      ? "Moderate academic pressure is building. Protect one recovery block before the next deadline."
      : "Academic weather looks calm from today's data.";
}

function renderTwin(risk) {
  output.twin.className = `avatar ${risk.level}`;
  output.twinText.textContent =
    risk.score >= 78
      ? "Your twin is visibly overloaded: heavy backpack, low posture, low battery."
      : risk.score >= 58
        ? "Your twin is starting to slump under the load."
        : risk.score >= 36
          ? "Your twin looks okay, but the backpack is getting heavier."
          : "Your twin looks steady today.";
}

function renderHistory() {
  if (!checkins.length) {
    output.history.innerHTML =
      '<div class="history-item"><span>No saved check-ins yet.</span></div>';
    return;
  }

  output.history.innerHTML = checkins
    .slice(0, 6)
    .map(
      (item) => `
        <div class="history-item">
          <div>
            <strong>${escapeHtml(item.levelLabel)}</strong>
            <small>${escapeHtml(item.date)}${item.note ? ` - ${escapeHtml(item.note)}` : ""}</small>
          </div>
          <strong>${item.score}%</strong>
        </div>
      `
    )
    .join("");
}

function renderBackpack() {
  const checked = [...document.querySelectorAll(".backpack-items input:checked")];
  const total = checked.reduce((sum, item) => sum + Number(item.dataset.weight), 0);
  const capped = Math.min(total, 100);
  output.backpackFill.style.height = `${capped}%`;
  output.backpack.textContent =
    capped >= 70
      ? `Backpack load: ${capped}%. The combined weight is no longer invisible.`
      : capped >= 35
        ? `Backpack load: ${capped}%. Each item seems manageable alone, but the total is growing.`
        : `Backpack load: ${capped}%. Add weights to reveal the total.`;
}

function renderLanguageScan() {
  const text = `${inputs.journalScan.value} ${inputs.note.value}`.toLowerCase();
  const fatigueWords = [
    "tired",
    "exhausted",
    "drained",
    "overwhelmed",
    "numb",
    "can't",
    "cannot",
    "behind",
    "stressed",
    "unmotivated",
    "burned",
    "hopeless",
  ];
  const matches = fatigueWords.filter((word) => text.includes(word));
  const unique = [...new Set(matches)];
  output.language.textContent = unique.length
    ? `Language scan: fatigue/self-pressure terms detected: ${unique.join(", ")}.`
    : "Language scan: no fatigue pattern detected in the current text.";
}

function renderScreenUpload() {
  const file = inputs.screenUpload.files[0];
  output.screen.textContent = file
    ? `Screenshot loaded: ${file.name}. Prototype AI would extract phone usage, bedtime shift, and late-night activity.`
    : "Uploading a screenshot would let AI extract phone usage, late-night activity, and bedtime shifts.";
}

function saveCheckin(event) {
  event.preventDefault();
  const data = getCurrentData();
  const risk = calculateRisk(data);
  const [, levelLabel] = levelText(risk.level);

  checkins.unshift({
    ...data,
    score: risk.score,
    level: risk.level,
    levelLabel,
    date: new Date().toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
  });

  checkins = checkins.slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
  inputs.note.value = "";
  renderCurrent();
  renderHistory();
  renderLanguageScan();
}

function clearHistory() {
  checkins = [];
  localStorage.removeItem(STORAGE_KEY);
  renderCurrent();
  renderHistory();
}

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", () => {
    renderCurrent();
    renderLanguageScan();
  });
  input.addEventListener("change", () => {
    renderCurrent();
    renderLanguageScan();
  });
});

document.querySelectorAll(".backpack-items input").forEach((input) => {
  input.addEventListener("change", renderBackpack);
});

inputs.screenUpload.addEventListener("change", renderScreenUpload);
form.addEventListener("change", renderCurrent);
form.addEventListener("submit", saveCheckin);
resetButton.addEventListener("click", clearHistory);

renderCurrent();
renderHistory();
renderBackpack();
renderLanguageScan();
renderScreenUpload();
