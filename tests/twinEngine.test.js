const assert = require('node:assert/strict');
const test = require('node:test');

const { getTwinResponse } = require('../twinEngine.js');

test('random prompts get a context-aware reply instead of a generic fallback', () => {
  const reply = getTwinResponse('What should I do if I feel overwhelmed today?', {
    sleep: 5.5,
    stress: 7,
    energy: 4,
    homeworkHours: 4,
    screenTime: 6,
    socialInteractions: 2,
    assignmentsDue: 3,
  }, {
    score: 58,
    level: 'watch',
  });

  assert.match(reply.toLowerCase(), /today|right now|pressure|load|sleep|homework|screen/i);
});
