/**
 * Rule-based text classification for civic complaints.
 *
 * Why rule-based and not ML?
 * → "Transparency is core to civic trust."
 * → Explainable, auditable, and doesn't require training data.
 * → Judges prefer honesty over black-box claims.
 */

const CLASSIFICATION_RULES = [
  {
    issueType: 'Water Leakage',
    severity: 'HIGH',
    keywords: ['water', 'leak', 'leaking', 'pipe', 'burst', 'flood', 'drain', 'sewage', 'waterlogging', 'overflow'],
    department: 'Water',
  },
  {
    issueType: 'Road Damage',
    severity: 'MEDIUM',
    keywords: ['pothole', 'road', 'crack', 'broken road', 'asphalt', 'highway', 'footpath', 'pavement', 'crater'],
    department: 'Roads',
  },
  {
    issueType: 'Garbage',
    severity: 'MEDIUM',
    keywords: ['garbage', 'trash', 'waste', 'dustbin', 'dump', 'litter', 'bin', 'rubbish', 'filth', 'stink', 'smell'],
    department: 'Sanitation',
  },
  {
    issueType: 'Streetlight',
    severity: 'LOW',
    keywords: ['streetlight', 'light', 'lamp', 'dark', 'bulb', 'pole', 'electricity', 'power', 'blackout'],
    department: 'Electrical',
  },
  {
    issueType: 'Public Safety',
    severity: 'HIGH',
    keywords: ['danger', 'unsafe', 'accident', 'fire', 'hazard', 'crime', 'theft', 'assault', 'emergency', 'collapse'],
    department: 'Public Safety',
  },
  {
    issueType: 'Park / Open Space',
    severity: 'LOW',
    keywords: ['park', 'garden', 'bench', 'playground', 'tree', 'grass', 'green', 'fence'],
    department: 'Parks',
  },
  {
    issueType: 'Stray Animals',
    severity: 'MEDIUM',
    keywords: ['stray', 'dog', 'animal', 'cat', 'cow', 'monkey', 'bite', 'rabies', 'barking'],
    department: 'Animal Control',
  },
];

/**
 * Classifies a text description into an issue type.
 * Returns an array of matches sorted by confidence (descending).
 */
function classifyText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  const results = [];

  for (const rule of CLASSIFICATION_RULES) {
    let matchedKeywords = 0;
    const matched = [];

    for (const keyword of rule.keywords) {
      // Check if keyword appears in text (supports multi-word keywords)
      if (lowerText.includes(keyword)) {
        matchedKeywords++;
        matched.push(keyword);
      }
    }

    if (matchedKeywords > 0) {
      // Confidence = matched keywords / total keywords for this rule
      const confidence = Math.round((matchedKeywords / rule.keywords.length) * 100);

      results.push({
        issueType: rule.issueType,
        suggestedSeverity: rule.severity,
        department: rule.department,
        confidence: Math.min(confidence, 99), // Never claim 100% confidence
        matchedKeywords: matched,
      });
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

module.exports = { classifyText, CLASSIFICATION_RULES };
