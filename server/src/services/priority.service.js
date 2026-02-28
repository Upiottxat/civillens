const { prisma } = require('../lib/prisma');
const { haversineDistance } = require('../utils/haversine');

// ─── Weight configuration (sums to 100) ────────────────────────────────────

const SEVERITY_MAX = 40;
const ZONE_MAX = 25;
const POPULATION_MAX = 20;
const DUPLICATE_MAX = 15;

// ─── Critical zones — hardcoded for demo ────────────────────────────────────
// In production, load from a municipal GIS database.

const CRITICAL_ZONES = [
  { label: 'Hospital Zone — AIIMS',       lat: 28.5672, lng: 77.2100, radiusKm: 0.5 },
  { label: 'School Zone — DPS RK Puram',  lat: 28.5631, lng: 77.1727, radiusKm: 0.3 },
  { label: 'Hospital Zone — Safdarjung',  lat: 28.5685, lng: 77.2065, radiusKm: 0.5 },
  { label: 'Market Zone — Connaught Place', lat: 28.6315, lng: 77.2167, radiusKm: 0.4 },
  { label: 'School Zone — Modern School', lat: 28.5832, lng: 77.2259, radiusKm: 0.3 },
];

// ─── Scoring functions ──────────────────────────────────────────────────────

function severityScore(severity) {
  const scores = { CRITICAL: 40, HIGH: 30, MEDIUM: 20, LOW: 10 };
  return scores[severity] || 10;
}

/**
 * Returns { score, zoneLabel } if near a critical zone, else { score: 0, zoneLabel: null }.
 */
function zoneScore(lat, lng) {
  for (const zone of CRITICAL_ZONES) {
    const dist = haversineDistance(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radiusKm) {
      return { score: ZONE_MAX, zoneLabel: zone.label };
    }
  }

  // Partial score for nearby zones (within 2km)
  let closest = null;
  let closestDist = Infinity;

  for (const zone of CRITICAL_ZONES) {
    const dist = haversineDistance(lat, lng, zone.lat, zone.lng);
    if (dist < closestDist) {
      closestDist = dist;
      closest = zone;
    }
  }

  if (closestDist <= 2) {
    // Linear decay: 2km away = 0 pts, 0km = 25 pts
    const score = Math.round(ZONE_MAX * (1 - closestDist / 2));
    return { score, zoneLabel: `Near ${closest.label}` };
  }

  return { score: 0, zoneLabel: null };
}

/**
 * Mock population density score.
 * In production: query a population density grid / census API.
 * For demo: deterministic hash so it's consistent across calls.
 */
function populationScore(lat, lng) {
  // Simple deterministic hash from coordinates
  const hash = Math.abs(Math.sin(lat * 1000 + lng * 3000)) * POPULATION_MAX;
  return Math.round(hash);
}

/**
 * Count duplicate complaints of the same type within ~500m in the last 7 days.
 * Each duplicate adds 5 pts, capped at 15 (3 duplicates).
 */
async function duplicateScore(issueType, lat, lng) {
  const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // ~500m ≈ 0.005 degrees
  const DELTA = 0.005;

  const nearby = await prisma.complaint.count({
    where: {
      issueType,
      createdAt: { gte: SEVEN_DAYS_AGO },
      latitude: { gte: lat - DELTA, lte: lat + DELTA },
      longitude: { gte: lng - DELTA, lte: lng + DELTA },
    },
  });

  const score = Math.min(nearby, 3) * 5;
  return { score, count: nearby };
}

// ─── Main scoring function ──────────────────────────────────────────────────

/**
 * Calculates a 0–100 priority score with a transparent breakdown.
 * Returns { score, breakdown }.
 */
async function calculatePriorityScore({ severity, latitude, longitude, issueType }) {
  const sev = severityScore(severity);
  const zone = zoneScore(latitude, longitude);
  const pop = populationScore(latitude, longitude);
  const dup = await duplicateScore(issueType, latitude, longitude);

  const total = Math.min(sev + zone.score + pop + dup.score, 100);

  return {
    score: total,
    breakdown: {
      severity: { points: sev, max: SEVERITY_MAX, label: severity },
      zone: { points: zone.score, max: ZONE_MAX, label: zone.zoneLabel },
      population: { points: pop, max: POPULATION_MAX },
      duplicates: { points: dup.score, max: DUPLICATE_MAX, count: dup.count },
    },
  };
}

module.exports = { calculatePriorityScore, CRITICAL_ZONES };
