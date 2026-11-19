export default {
  // Quality priority: integer 1–5. 1 = economical/adequate; 3 = balanced; 5 = strongest task capability within the cost ceiling.
  quality: 3,

  // Maximum USD per 1,000,000 total tokens, blended as 50% input + 50% output at uncached catalogue rates.
  // Example: 0.50 allows a $0.50 blended rate. null = no price ceiling. This is NOT a per-task spending limit.
  maxCostPerMillionTokens: null,

  // Milliseconds allowed for Sol's ranking, including one malformed-output retry. Positive integer; 60000 = 60 seconds.
  teacherTimeoutMs: 60000,

  // Maximum AA page-content characters included in each routing payload. Positive integer; complete pages only.
  maxEvidenceChars: 180000,

  // Maximum complete AA pages included in each routing payload. Positive integer; omitted URLs are disclosed.
  maxEvidencePages: 6,

  // true = explicitly save exact router inputs and teacher rankings locally for future training; false = metadata logs only.
  capture: false,

  // null = all eligible Token Factory chat models; otherwise an array of exact provider model IDs. [] = no eligible models.
  allowedModels: null,
};
