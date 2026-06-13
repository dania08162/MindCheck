(function (global, factory) {
  const engine = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getTwinResponse: engine };
  }

  global.twinResponseEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalize(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function describeLoad(data, risk) {
    const homework = Number(data.homeworkHours || 0);
    const screen = Number(data.screenTime || 0);
    const sleep = Number(data.sleep || 0);
    const deadlines = Number(data.assignmentsDue || 0);

    if (risk.score >= 75) {
      return `From what you entered, this feels like a heavy day: ${homework} hours of homework, ${screen} hours on screens, and ${sleep} hours of sleep. That combination can make everything seem louder than it is.`;
    }

    if (risk.score >= 55) {
      return `The day feels a little full right now: ${homework} hours of homework, ${screen} hours of screen time, and ${sleep} hours of sleep. It makes sense if your brain is running a bit hot.`;
    }

    return `Things look fairly steady right now: ${homework} hours of homework, ${screen} hours of screen time, and ${sleep} hours of sleep. That gives us some room to keep the day gentle instead of rushed.`;
  }

  function detectMood(text) {
    const moodWords = ['stress','stressed','overwhelm','overwhelmed','anxious','panic','sad','down','tired','drained','burnout','numb','frustrat','overloaded','exhaust'];
    return moodWords.some((word) => text.includes(word));
  }

  function detectTopic(text) {
    if (/\b(sleep|bedtime|rest|tired|energy)\b/.test(text)) return 'sleep';
    if (/\b(calendar|schedule|class|deadline|assignment|homework|workload|plan)\b/.test(text)) return 'schedule';
    if (/\b(screen|phone|screenshot|image|usage|scroll)\b/.test(text)) return 'screens';
    return 'general';
  }

  function buildGentleReply(prompt, data, risk) {
    const text = normalize(prompt);
    const topic = detectTopic(text);
    const mood = detectMood(text);
    const question = /\b(what|how|why|can|could|would|do|are|is|tell|help|should)\b/.test(text);
    const loadLine = describeLoad(data, risk);
    const energy = Number(data.energy || 0);
    const stress = Number(data.stress || 0);
    const sleep = Number(data.sleep || 0);

    const pressureLabel = risk.score >= 70
      ? 'a pretty heavy day'
      : risk.score >= 50
        ? 'a full day'
        : 'a fairly steady day';

    const toneLine = risk.score >= 70
      ? 'It sounds like the day is asking for a softer pace, not more pressure.'
      : risk.score >= 50
        ? 'It feels like the day is carrying a bit of weight, but it is still manageable if we keep it simple.'
        : 'It sounds more like a day that needs a little breathing room, not a big fix.';

    if (mood) {
      return `${loadLine} ${toneLine} You do not have to solve the whole day at once — try one small thing first, like water, a short pause, or the next tiny task. What feels most urgent to you right now?`;
    }

    if (topic === 'sleep') {
      return `I hear you asking about rest, and that matters. Your sleep is ${sleep} hours right now, which can feel okay some days and a little thin on others. If you want, we can make tonight feel softer instead of trying to fix everything all at once.`;
    }

    if (topic === 'schedule') {
      return `It makes sense to want a clearer handle on the day. ${loadLine} ${toneLine} If your calendar or assignments are part of the pressure, I’d rather use what you actually attach than guess. What part feels the most crowded right now?`;
    }

    if (topic === 'screens') {
      return `Screens can make a day feel noisier than it really is. ${loadLine} If you want, we can look at the screen time and bedtime side of things together and pick one small reset instead of making the whole week feel bigger than it is.`;
    }

    if (question) {
      return `Honestly, it feels like ${pressureLabel}. ${loadLine} ${toneLine} If you want, tell me what feels heaviest right now — your mind, your schedule, or your energy — and I’ll meet you there instead of giving you a polished script.`;
    }

    return `I’m here with you, and I want this to feel like a real check-in, not a script. ${loadLine} ${toneLine} You can tell me what is actually on your mind, and I’ll meet you there without rushing you.`;
  }

  function getTwinResponse(prompt, data, risk) {
    const text = normalize(prompt);
    const trimmed = String(prompt || '').trim();

    if (!trimmed) {
      return 'I’m here. Tell me what is on your mind, and I’ll help you make sense of it without rushing you.';
    }

    if (/\b(hi|hey|hello|yo|how are you)\b/.test(text)) {
      return "Hey, I’m really glad you’re here. I can talk with you like a friend, not just toss out numbers. What feels the heaviest right now — your mind, your schedule, or your energy?";
    }

    if (/\b(thank|thanks|love you|cute|appreciate)\b/.test(text)) {
      return 'I’m glad I can be here for you. You deserve support that feels warm, not pressure-filled.';
    }

    return buildGentleReply(prompt, data, risk);
  }

  return getTwinResponse;
});
