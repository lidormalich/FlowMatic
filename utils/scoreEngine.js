const DELTAS = {
  no_show: -20,
  late_cancellation: -10,
  cancellation: -2,
  completed: 3,
};

function clamp(val) {
  return Math.min(100, Math.max(0, val));
}

// Returns { newScore, delta }
function applyDelta(currentScore, eventType) {
  const delta = DELTAS[eventType] ?? 0;
  return { newScore: clamp(currentScore + delta), delta };
}

// 'green' = priority (>=75), 'yellow' = normal (40-74), 'red' = flagged (<40)
function getScoreTier(score) {
  if (score >= 75) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

module.exports = { applyDelta, getScoreTier, DELTAS };
