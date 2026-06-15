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
  calendarUpload: document.querySelector("#calendarUpload"),
  journalScan: document.querySelector("#journalScan"),
  twinChatInput: document.querySelector("#twinChatInput"),
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
  twinChatLog: document.querySelector("#twinChatLog"),
  twinChatInput: document.querySelector("#twinChatInput"),
  twinSendButton: document.querySelector("#twinSendButton"),
};

const sidebar = document.querySelector("#sidebar");
const sidebarHandle = document.querySelector("#sidebarHandle");
const sidebarClose = document.querySelector("#sidebarClose");
const menuButton = document.querySelector("#menuButton");
const navLinks = document.querySelectorAll(".nav-link");
const pageSections = document.querySelectorAll(".page-section");

let checkins = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function setActivePage(pageId) {
  pageSections.forEach((section) => {
    const active = section.id === pageId;
    section.classList.toggle("active", active);
    section.setAttribute("aria-hidden", active ? "false" : "true");
  });

  navLinks.forEach((button) => {
    const active = button.dataset.page === pageId;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function toggleSidebar(open) {
  document.body.classList.toggle("sidebar-open", open);
}

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
  if (score >= 68) return "risk";
  if (score >= 49) return "stress";
  if (score >= 30) return "watch";
  return "stable";
}

function levelText(level) {
  const labels = {
    stable: ["stable", "stable"],
    watch: ["watch out", "watch out"],
    stress: ["high stress", "high stress"],
    risk: ["burnout risk", "burnout risk"],
  };

  return labels[level];
}

function calculateRisk(data, history = checkins) {
  let score = 16;
  const signals = [];

  if (data.sleep < 6) {
    score += 14;
    signals.push("Sleep is below the recovery zone.");
  } else if (data.sleep < 7) {
    score += 6;
  }

  if (data.stress >= 8) {
    score += 12;
  } else if (data.stress >= 5) {
    score += 6;
  }

  if (data.mood <= 3) {
    score += 10;
  } else if (data.mood <= 5) {
    score += 5;
  }

  if (data.energy <= 3) {
    score += 10;
  } else if (data.energy <= 5) {
    score += 5;
  }

  if (data.screenTime >= 8) {
    score += 8;
    signals.push("Screen time is pushing the day into digital overload.");
  } else if (data.screenTime >= 6) {
    score += 4;
  }

  if (data.homeworkHours >= 5) {
    score += 8;
    signals.push("Homework load is crowding out recovery time.");
  } else if (data.homeworkHours >= 3) {
    score += 4;
  }

  if (data.socialInteractions <= 1) {
    score += 6;
    signals.push("Social connection is unusually low.");
  } else if (data.socialInteractions <= 2) {
    score += 3;
  }

  if (data.assignmentsDue >= 4) {
    score += 8;
    signals.push("Assignments are stacking into a deadline spike.");
  } else if (data.assignmentsDue >= 2) {
    score += 4;
  }

  const toggles = [
    [data.meals, 5, "skipped meals are adding physical strain."],
    [data.isolation, 5, "withdrawal is showing up as a warning sign."],
    [data.focus, 5, "focus trouble suggests the load is mounting."],
    [data.headache, 5, "physical tension is showing up in the body."],
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
    if (average >= 55) {
      score += 6;
      signals.push("Recent check-ins show the same strain building up.");
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

function getBackpackLoad() {
  return [...document.querySelectorAll('.backpack-items input:checked')].reduce(
    (sum, item) => sum + Number(item.dataset.weight || 0),
    0
  );
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("The file could not be read as an image."));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error("The image file could not be loaded."));
    reader.readAsDataURL(file);
  });
}

async function validateImageFile(file, type = "screenshot") {
  if (!file) {
    return { valid: false, reason: `attach a ${type} screenshot before i analyze it.` };
  }

  if (!file.type.startsWith("image/")) {
    return { valid: false, reason: "that file is not a usable image. please attach a photo or screenshot instead." };
  }

  try {
    const image = await loadImage(file);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0);

    const imageData = context.getImageData(0, 0, width, height).data;
    let sum = 0;
    let sumSquares = 0;
    let sampleCount = 0;

    for (let index = 0; index < imageData.length; index += 16) {
      const red = imageData[index];
      const green = imageData[index + 1];
      const blue = imageData[index + 2];
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

      sum += luminance;
      sumSquares += luminance * luminance;
      sampleCount += 1;
    }

    const average = sum / Math.max(sampleCount, 1);
    const variance = (sumSquares / Math.max(sampleCount, 1)) - average * average;
    const isTooSmall = width < 180 || height < 160;
    const isTooFlat = variance < 260;

    if (isTooSmall || isTooFlat) {
      return {
        valid: false,
        reason: "this image is too blurry, too small, or too blank to be reliable. attach a clearer screenshot that actually shows the screen or calendar details.",
      };
    }

    return {
      valid: true,
      width,
      height,
      variance,
    };
  } catch (error) {
    return { valid: false, reason: error.message || "The screenshot could not be read. Please attach a better image." };
  }
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
    : "<p>no major warning signs detected from this check-in.</p>";

  renderPatterns(risk);
  renderTrend(data, risk);
  renderCrackGraph(risk);
  void renderCalendar();
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
      text:
        currentRisk.signals[0] ||
        "Today looks steady from the data you entered, and there is still room for a gentle reset.",
    },
    {
      level: highRiskDays >= 3 ? "risk" : highRiskDays >= 1 ? "watch" : "stable",
      title: "Risk streak",
      text:
        highRiskDays >= 1
          ? `${highRiskDays} recent check-in${highRiskDays === 1 ? "" : "s"} are running a little hotter than usual.`
          : "No elevated streak is showing yet, which is a good sign to keep an eye on.",
    },
    {
      level: lowSleepDays >= 3 ? "risk" : lowSleepDays >= 1 ? "watch" : "stable",
      title: "Recovery debt",
      text:
        lowSleepDays >= 1
          ? `${lowSleepDays} recent check-in${lowSleepDays === 1 ? "" : "s"} were under 6 hours of sleep, so recovery may need a softer night.`
          : "Sleep recovery is not currently flagged, which is a reassuring sign.",
    },
    {
      level: highScreenDays + lowSocialDays >= 3 ? "stress" : "stable",
      title: "Digital + social load",
      text:
        highScreenDays || lowSocialDays
          ? `${highScreenDays} screen-heavy day${highScreenDays === 1 ? "" : "s"} and ${lowSocialDays} low-social day${lowSocialDays === 1 ? "" : "s"} are showing up in your recent pattern.`
          : "Digital and social pressure are not piling up in your recent entries right now.",
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
      "a few more check-ins will help this pattern feel more honest and useful. for now, the trend is still soft and easy to adjust.";
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

  const sleepPhrase = sleepChange < 0 ? "sleep has been slipping" : "sleep has been holding steady";
  const workPhrase = workChange > 0 ? "the workload has been building" : "the workload has been easing";

  output.trend.textContent =
    `The recent pattern suggests ${sleepPhrase}, while ${workPhrase}. That combination can make the day feel heavier than it looks, so gentle pacing matters more than pushing through.`;
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

async function renderCalendar() {
  const file = inputs.calendarUpload?.files?.[0];

  if (!file) {
    output.calendar.textContent =
      "attach a real calendar screenshot before i analyze your schedule. i will not guess your obligations from assumptions.";
    return;
  }

  const result = await validateImageFile(file, "calendar");

  if (!result.valid) {
    output.calendar.textContent = `calendar image invalid: ${result.reason}`;
    return;
  }

  output.calendar.textContent =
    "calendar screenshot accepted. i can review the visible blocks from this image, but i will not invent missing classes, deadlines, or events.";
}

function renderAcademic(data, risk) {
  const storm = data.assignmentsDue >= 5 || risk.score >= 78;
  const busy = data.assignmentsDue >= 3 || data.homeworkHours >= 5 || risk.score >= 58;
  output.forecast.textContent = storm ? "burnout storm" : busy ? "busy front" : "calm";
  output.forecast.className = `forecast-card ${storm ? "storm" : busy ? "busy" : "calm"}`;
  output.academic.textContent = storm
    ? `high stress front expected next week due to ${data.assignmentsDue} overlapping deadlines.`
    : busy
      ? "moderate academic pressure is building. protect one recovery block before the next deadline."
      : "academic weather looks calm from today's data.";
}

function renderTwin(risk) {
  const backpackLoad = getBackpackLoad();
  const capped = Math.min(backpackLoad, 100);

  output.twin.className = `avatar ${risk.level}`;

  if (capped >= 70) {
    output.twinText.textContent = "your twin is carrying a real load today — shoulders are dropping and the battery is low.";
  } else if (capped >= 35) {
    output.twinText.textContent = "your twin is starting to feel the weight, even if it still looks manageable on the outside.";
  } else if (risk.score >= 68) {
    output.twinText.textContent = "your twin looks worn down today, but the backpack is still light right now.";
  } else if (risk.score >= 49) {
    output.twinText.textContent = "your twin is a little tense, and it shows in the posture more than the backpack.";
  } else {
    output.twinText.textContent = "my twin looks steady today — soft, calm, and ready for a gentle reset.";
  }
}

function addTwinMessage(text, role = "bot") {
  const bubble = document.createElement("p");
  bubble.className = `twin-chat-bubble ${role}`;
  bubble.textContent = text;
  output.twinChatLog.appendChild(bubble);
  output.twinChatLog.scrollTop = output.twinChatLog.scrollHeight;
}

function getTwinResponse(prompt, data, risk) {
  if (typeof window !== "undefined" && typeof window.twinResponseEngine === "function") {
    return window.twinResponseEngine(prompt, data, risk);
  }

  const text = prompt.toLowerCase();
  const trimmed = prompt.trim();
  const isQuestion = /\?$/.test(trimmed);

  if (/\b(hi|hey|hello|hey there|how are you|yo)\b/.test(text)) {
    return "hey, i’m really glad you’re here. i can talk with you like a friend, not just dump numbers at you. what feels the heaviest right now — your mind, your schedule, or your energy?";
  }

  if (/\b(stress|stressed|overwhelm|overwhelmed|anxious|panic|sad|down|tired|drained|burnout|low mood|not okay|cry|crying)\b/.test(text)) {
    return "that sounds really full, and i’m glad you said it out loud. let’s keep this gentle: take one slow breath, drink some water, and choose one tiny next step. i can help you sort what feels urgent from what can wait.";
  }

  if (/\b(sleep|bedtime|rest|tired)\b/.test(text)) {
    return `your sleep is ${data.sleep} hours right now. if that feels short, try giving yourself one softer night this week: dim the screen, set a small bedtime cue, and let your body know it is safe to slow down.`;
  }

  if (/\b(calendar|schedule|classes|deadlines|assignments)\b/.test(text)) {
    return "i can help with that, but i only want to use real details you attach. if you upload a calendar screenshot, i’ll look at what is actually visible instead of guessing.";
  }

  if (/\b(screenshot|screen|phone|usage|image)\b/.test(text)) {
    return "absolutely — if the image is clear enough to read, i can help interpret what it shows. if it looks blurry, tiny, or blank, i’ll tell you it needs a better screenshot instead of pretending it’s useful.";
  }

  if (/\b(help|what should i do|advice|coping|reset|calm|relax)\b/.test(text)) {
    return "a gentle reset usually works best: one warm drink, one short walk, one small task, and one kind sentence to yourself. you do not need to fix everything at once.";
  }

  if (/\b(thank|thanks|appreciate|love you|cute)\b/.test(text)) {
    return "i’m glad i can be here for you. you deserve support that feels warm, not pressured.";
  }

  if (isQuestion) {
    return "i’m happy to talk through that with you. you do not have to have it all figured out right now — tell me what part feels most important, and we’ll take it one step at a time.";
  }

  return "i’m here to listen, not to rush you. tell me what is on your mind in your own words, and i’ll help you feel a little less alone with it.";
}

function handleTwinChat() {
  if (!output.twinChatInput || !output.twinChatLog) return;

  const prompt = output.twinChatInput.value.trim();
  if (!prompt) return;

  addTwinMessage(prompt, "user");
  output.twinChatInput.value = "";

  const data = getCurrentData();
  const risk = calculateRisk(data);
  addTwinMessage(getTwinResponse(prompt, data, risk), "bot");
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
  const total = getBackpackLoad();
  const capped = Math.min(total, 100);
  output.backpackFill.style.height = `${capped}%`;

  if (capped >= 70) {
    output.backpack.textContent = `Backpack load: ${capped}%. The load is real today, so it helps to choose one small thing to set down or postpone.`;
  } else if (capped >= 35) {
    output.backpack.textContent = `Backpack load: ${capped}%. A few items are stacking up, but they still feel manageable one step at a time.`;
  } else if (capped > 0) {
    output.backpack.textContent = `Backpack load: ${capped}%. The bag is light enough to sort through gently instead of carrying everything at once.`;
  } else {
    output.backpack.textContent = "Backpack load: 0%. Nothing is in the bag yet, so the load feels light and easy to reset.";
  }
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

async function renderScreenUpload() {
  const file = inputs.screenUpload?.files?.[0];

  if (!file) {
    output.screen.textContent =
      "Attach a real screenshot to analyze phone usage, late-night activity, and bedtime shifts. I will not use a blank or unclear image.";
    return;
  }

  const result = await validateImageFile(file, "screenshot");

  if (!result.valid) {
    output.screen.textContent = `Invalid screenshot: ${result.reason}`;
    return;
  }

  output.screen.textContent =
    `Screenshot accepted: ${file.name} has enough detail to support a usage review, but I still need the image to be clear enough to read the visible content.`;
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

inputs.screenUpload.addEventListener("change", () => {
  void renderScreenUpload();
});
inputs.calendarUpload?.addEventListener("change", () => {
  void renderCalendar();
});

output.twinSendButton?.addEventListener("click", handleTwinChat);
output.twinChatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleTwinChat();
  }
});

navLinks.forEach((button) => {
  button.addEventListener("click", () => {
    setActivePage(button.dataset.page);
    toggleSidebar(false);
  });
});

menuButton?.addEventListener("click", () => {
  toggleSidebar(!document.body.classList.contains("sidebar-open"));
});

sidebarHandle?.addEventListener("mouseenter", () => {
  toggleSidebar(true);
});

sidebar?.addEventListener("mouseleave", () => {
  toggleSidebar(false);
});

sidebarClose?.addEventListener("click", () => {
  toggleSidebar(false);
});

form.addEventListener("change", renderCurrent);
form.addEventListener("submit", saveCheckin);
resetButton.addEventListener("click", clearHistory);

setActivePage("page-summary");

renderCurrent();
renderHistory();
renderBackpack();
renderLanguageScan();
void renderScreenUpload();
void renderCalendar();
