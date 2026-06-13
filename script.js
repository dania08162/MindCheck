const STORAGE_KEY = "mindcheck-checkins";

const form = document.querySelector("#checkinForm");
const inputs = {
  meals: document.querySelector("#meals"),
  isolation: document.querySelector("#isolation"),
  focus: document.querySelector("#focus"),
  headache: document.querySelector("#headache"),
  note: document.querySelector("#note"),
};

const output = {
  sleep: document.querySelector("#sleepOutput"),
  stress: document.querySelector("#stressOutput"),
  workload: document.querySelector("#workloadOutput"),
  mood: document.querySelector("#moodOutput"),
  score: document.querySelector("#scoreValue"),
  percent: document.querySelector("#gaugePercent"),
  ring: document.querySelector("#gaugeRing"),
  title: document.querySelector("#riskTitle"),
  chip: document.querySelector("#statusChip"),
  status: document.querySelector("#statusText"),
  signals: document.querySelector("#signalList"),
  patterns: document.querySelector("#patternStack"),
  history: document.querySelector("#historyList"),
};

const resetButton = document.querySelector("#resetButton");

let checkins = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function getCheckedValue(name) {
  return Number(document.querySelector(`input[name="${name}"]:checked`).value);
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
    workload: getCheckedValue("workload"),
    mood: getCheckedValue("mood"),
    meals: inputs.meals.checked,
    isolation: inputs.isolation.checked,
    focus: inputs.focus.checked,
    headache: inputs.headache.checked,
    note: inputs.note.value.trim(),
  };
}

function calculateRisk(data, history = checkins) {
  let score = 0;
  const signals = [];

  const lowSleep = Math.max(0, 7 - data.sleep) * 7;
  const stressLoad = data.stress * 5.5;
  const workloadLoad = data.workload * 3.8;
  const lowMood = Math.max(0, 7 - data.mood) * 5.8;

  score += lowSleep + stressLoad + workloadLoad + lowMood;

  if (data.sleep < 6) signals.push("Sleep is below the recovery zone.");
  if (data.stress >= 7) signals.push("Stress is running high.");
  if (data.workload >= 8) signals.push("Workload is crowding out recovery.");
  if (data.mood <= 4) signals.push("Mood is noticeably low.");

  const toggles = [
    [data.meals, 8, "Skipped meals can be a hidden overload signal."],
    [data.isolation, 10, "Withdrawing from people may mean strain is rising."],
    [data.focus, 8, "Focus trouble suggests your system is over capacity."],
    [data.headache, 7, "Physical tension is showing up in the body."],
  ];

  toggles.forEach(([active, weight, message]) => {
    if (active) {
      score += weight;
      signals.push(message);
    }
  });

  const recent = history.slice(0, 3);
  const averageRecent =
    recent.reduce((sum, item) => sum + item.score, 0) / Math.max(recent.length, 1);

  if (recent.length >= 2 && averageRecent >= 65) {
    score += 8;
    signals.push("Recent check-ins show a repeated high-risk pattern.");
  }

  if (recent.length >= 2 && recent.every((item) => item.sleep < 6)) {
    score += 6;
    signals.push("Low sleep has repeated across multiple check-ins.");
  }

  const capped = Math.min(100, Math.round(score));
  return {
    score: capped,
    level: capped >= 75 ? "red" : capped >= 45 ? "yellow" : "green",
    signals: signals.slice(0, 5),
  };
}

function levelText(level) {
  if (level === "red") return ["Check engine light on", "High risk"];
  if (level === "yellow") return ["Warning light", "Moderate risk"];
  return ["Systems steady", "Low risk"];
}

function renderCurrent() {
  const data = getCurrentData();
  const risk = calculateRisk(data);
  const [title, status] = levelText(risk.level);
  const color = `var(--${risk.level})`;

  output.sleep.textContent = `${data.sleep} ${data.sleep === 1 ? "hour" : "hours"}`;
  output.stress.textContent = `${data.stress} / 10`;
  output.workload.textContent = `${data.workload} / 10`;
  output.mood.textContent = `${data.mood} / 10`;
  output.score.textContent = risk.score;
  output.percent.textContent = `${risk.score}%`;
  output.title.textContent = title;
  output.status.textContent = status;
  output.ring.style.background = `conic-gradient(${color} ${risk.score * 3.6}deg, rgba(255, 255, 255, 0.08) 0deg)`;
  output.chip.querySelector(".status-dot").style.background = color;
  output.chip.querySelector(".status-dot").style.boxShadow = `0 0 22px ${color}`;

  output.signals.innerHTML = risk.signals.length
    ? risk.signals.map((signal) => `<p>${signal}</p>`).join("")
    : "<p>No major warning signs detected from this check-in.</p>";

  renderPatterns(risk);
}

function renderPatterns(currentRisk) {
  const recent = checkins.slice(0, 5);
  const highRiskDays = recent.filter((item) => item.score >= 65).length;
  const lowSleepDays = recent.filter((item) => item.sleep < 6).length;
  const isolationDays = recent.filter((item) => item.isolation).length;

  const cards = [
    {
      level: currentRisk.level,
      title: "Today",
      text: currentRisk.signals[0] || "Today looks stable from the data entered.",
    },
    {
      level: highRiskDays >= 2 ? "red" : highRiskDays === 1 ? "yellow" : "green",
      title: "Risk streak",
      text:
        highRiskDays >= 2
          ? `${highRiskDays} of your last ${recent.length} saved check-ins were elevated.`
          : "No strong high-risk streak detected yet.",
    },
    {
      level: lowSleepDays >= 3 ? "red" : lowSleepDays >= 1 ? "yellow" : "green",
      title: "Recovery debt",
      text:
        lowSleepDays >= 1
          ? `${lowSleepDays} recent check-in${lowSleepDays === 1 ? "" : "s"} had under 6 hours of sleep.`
          : "Sleep recovery is not currently flagged.",
    },
    {
      level: isolationDays >= 2 ? "red" : isolationDays === 1 ? "yellow" : "green",
      title: "Connection signal",
      text:
        isolationDays >= 1
          ? "Withdrawal has appeared in recent data."
          : "No recent isolation pattern saved.",
    },
  ];

  output.patterns.innerHTML = cards
    .map(
      (card) => `
        <div class="pattern-card ${card.level}">
          <strong>${card.title}</strong>
          <span>${card.text}</span>
        </div>
      `
    )
    .join("");
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

  checkins = checkins.slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkins));
  inputs.note.value = "";
  renderCurrent();
  renderHistory();
}

function clearHistory() {
  checkins = [];
  localStorage.removeItem(STORAGE_KEY);
  renderCurrent();
  renderHistory();
}

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", renderCurrent);
  input.addEventListener("change", renderCurrent);
});

form.addEventListener("change", renderCurrent);
form.addEventListener("submit", saveCheckin);
resetButton.addEventListener("click", clearHistory);

renderCurrent();
renderHistory();
