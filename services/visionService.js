// Vision service using Hugging Face Inference API (optional) and Gemini AI
// Set keys in env or app.json extra
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
// Gemini removed. Only Hugging Face/CLIP helpers remain.

const HUGGINGFACE_ENDPOINT = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";
const CLIP_ENDPOINT = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32";

function getKey(name) {
  const extra = Constants?.expoConfig?.extra || {};
  return extra[name] || process.env[name] || undefined;
}

export async function classifyImageByUrl(imageUrl) {
  try {
    const apiKey = getKey();
    if (!apiKey) return ["unknown"];

    const res = await fetch(HUGGINGFACE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ inputs: imageUrl }),
    });
    if (!res.ok) return ["unknown"];
    const data = await res.json();
    const top = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    const labels = top.slice(0, 5).map(x => x.label || "unknown");
    return labels.length ? labels : ["unknown"];
  } catch {
    return ["unknown"];
  }
}

export async function classifyImageByUrlScored(imageUrl) {
  try {
    const apiKey = getKey();
    if (!apiKey) return [];
    const res = await fetch(HUGGINGFACE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ inputs: imageUrl }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    return arr
      .filter(x => x && typeof x.label === "string" && typeof x.score === "number")
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export async function classifyClipByUrl(imageUrl, candidateLabels = []) {
  try {
    const apiKey = getKey();
    if (!apiKey) return [];
    const labels = candidateLabels.length ? candidateLabels : [
      "person","selfie","face",
      "dog","cat","animal",
      "car","motorcycle","vehicle",
      "flower","plant","tree",
      "mountain","outdoor","indoor",
      "food","meal","document","text"
    ];
    const res = await fetch(CLIP_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ image: imageUrl, candidate_labels: labels }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    return arr
      .filter(x => x && typeof x.label === "string" && typeof x.score === "number")
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export async function classifyImageByFileUri(fileUri) {
  try {
    const apiKey = getKey();
    if (!apiKey) return [];
    // Read as base64 and send binary
    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const res = await fetch(HUGGINGFACE_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/octet-stream",
        "Accept": "application/json",
      },
      body: binary,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    return arr
      .filter(x => x && typeof x.label === "string" && typeof x.score === "number")
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

// Deprecated Gemini/Google stubs retained for compatibility; now return empty
export async function geminiLabelsByFileUri(_fileUri) {
  return [];
}

export async function googleVisionLabelsByFileUri(_fileUri) {
  return [];
}

// Structured IMAGE TAGGING API output per schema in user request
function _normalizeLabel(raw) {
  const l = String(raw || "").toLowerCase().trim();
  return l.replace(/[^a-z\s]/g, "").replace(/\s+/g, " ");
}

function _inferMainCategory(labels) {
  const set = new Set((labels || []).map(l => _normalizeLabel(l.label || l)));
  const has = (w) => set.has(w);
  // People
  if (["person","people","human","man","woman","boy","girl","child","baby","portrait","selfie","face"].some(has)) {
    return "people";
  }
  // Animal
  if (["animal","dog","cat","bird","horse","cow","sheep","goat","pig","fish"].some(has)) {
    return "animal";
  }
  // Vehicle
  if (["car","truck","motorcycle","bike","bicycle","bus","vehicle"].some(has)) {
    return "vehicle";
  }
  // Food
  if (["food","meal","dish","cuisine","breakfast","lunch","dinner","pizza","burger","noodles","rice"].some(has)) {
    return "food";
  }
  // Product (fallback for clear object items)
  if (["phone","laptop","computer","watch","shoe","bag","bottle","book"].some(has)) {
    return "product";
  }
  // Scene
  const indoorHits = ["indoor","room","office","kitchen","bedroom","living room","interior"].some(has);
  const outdoorHits = ["outdoor","street","park","garden","beach","mountain","forest","landscape"].some(has);
  if (indoorHits && !outdoorHits) return "indoor_scene";
  if (outdoorHits && !indoorHits) return "outdoor_scene";
  if (set.has("landscape")) return "landscape";
  return "other";
}

function _pickPrimaryObject(scoredLabels) {
  // scoredLabels: [{label, score, category?}]
  if (!Array.isArray(scoredLabels) || scoredLabels.length === 0) {
    return { label: "none", confidence: 0.0 };
  }
  const byScore = [...scoredLabels]
    .filter(x => x && typeof x.label === "string")
    .sort((a,b) => (b.score||0)-(a.score||0));

  // Avoid overly generic human tags if there are more specific items
  const genericHuman = new Set(["person","people","human","face","selfie"]);
  const specificHuman = new Set(["man","woman","boy","girl","portrait","child","baby"]);
  const hasSpecific = byScore.some(x => specificHuman.has(_normalizeLabel(x.label)));
  let top = byScore[0];
  if (genericHuman.has(_normalizeLabel(top.label)) && hasSpecific) {
    const alt = byScore.find(x => specificHuman.has(_normalizeLabel(x.label)));
    if (alt) top = alt;
  }

  const label = _normalizeLabel(top.label);
  let confidence = Number(top.score || 0.6);
  // Calibrate reasonable bounds
  if (confidence > 1) confidence = 1;
  if (confidence < 0) confidence = 0;
  return { label, confidence: Number(confidence.toFixed(2)) };
}

function _categorizeTag(label) {
  const l = _normalizeLabel(label);
  // Simple heuristics to map tag category
  if (["indoor","outdoor","street","park","garden","beach","mountain","forest","room","office","kitchen","bedroom"].includes(l)) return "scene";
  if (["happy","calm","moody","romantic"].includes(l)) return "mood";
  if (["vintage","minimal","aesthetic"].includes(l)) return "style";
  if (["red","blue","green","yellow","brown","black","white","orange","purple","pink","gray"].includes(l)) return "color";
  if (["running","walking","swimming","playing","working","reading","driving","riding"].includes(l)) return "action";
  return "objects";
}

function _buildTags(scoredLabels, primary, cap = 12) {
  const primaryLabel = primary.label;
  const out = [];
  for (const it of (scoredLabels || [])) {
    const l = _normalizeLabel(it.label);
    if (!l || l === primaryLabel) continue;
    const confidence = Math.max(0, Math.min(1, Number(it.score || 0.5)));
    out.push({ label: l, confidence: Number(confidence.toFixed(2)), category: _categorizeTag(l) });
  }
  // Deduplicate by label keep highest confidence
  const best = new Map();
  for (const t of out) {
    const prev = best.get(t.label);
    if (!prev || t.confidence > prev.confidence) best.set(t.label, t);
  }
  const uniq = Array.from(best.values()).sort((a,b) => b.confidence - a.confidence);
  return uniq.slice(0, cap);
}

function _buildExclusiveGroups(primary, tags) {
  const labels = new Set([primary.label, ...tags.map(t => t.label)]);
  // animal_type group
  const animalMembers = ["dog","cat","bird","horse","cow"];
  const selectedAnimal = animalMembers.find(m => labels.has(m)) || null;
  // indoor_outdoor group
  const ioMembers = ["indoor","outdoor"];
  const selectedIO = ioMembers.find(m => labels.has(m)) || null;
  return [
    { group_name: "animal_type", selected: selectedAnimal },
    { group_name: "indoor_outdoor", selected: selectedIO }
  ];
}

function _generateDescription(primary, mainCategory, tags) {
  const pieces = [];
  pieces.push(`A ${primary.label} in a ${mainCategory.replace(/_/g, ' ')}`);
  const scene = tags.find(t => t.category === "scene");
  if (scene) pieces.push(`showing ${scene.label}`);
  const color = tags.find(t => t.category === "color");
  if (color) pieces.push(`with ${color.label} tones`);
  const sentence = pieces.join(", ") + ".";
  // Ensure 8-18 words; if too short, pad with a generic phrase
  const words = sentence.split(/\s+/);
  if (words.length < 8) {
    return `${sentence.slice(0, -1)} captured in natural light.`;
  }
  return sentence;
}

export async function tagImageAsStructured(fileUri) {
  try {
    // Gemini removed: produce structure from empty scores when unavailable
    const safeScored = [];

    if (!safeScored.length) {
      return {
        main_category: "other",
        primary_object: { label: "none", confidence: 0.0 },
        tags: [],
        exclusive_groups: [],
        description: "",
        notes: "unclear image"
      };
    }

    const primary = _pickPrimaryObject(safeScored);
    const mainCategory = _inferMainCategory(safeScored);
    const tags = _buildTags(safeScored, primary, 12);

    // Enforce exclusivity rule 5: reduce near-conflicting labels within 0.05 of primary
    const filteredTags = tags.filter(t => !(t.category === "objects" && Math.abs(t.confidence - primary.confidence) <= 0.05 && t.label !== primary.label));

    const groups = _buildExclusiveGroups(primary, filteredTags);
    const description = _generateDescription(primary, mainCategory, filteredTags);

    // Notes: if low confidence overall
    const maxConf = Math.max(primary.confidence, ...(filteredTags.map(t => t.confidence))); 
    const notes = maxConf <= 0.5 ? "unclear image" : "";

    return {
      main_category: mainCategory,
      primary_object: primary,
      tags: filteredTags,
      exclusive_groups: groups,
      description,
      notes
    };
  } catch (e) {
    return {
      main_category: "other",
      primary_object: { label: "none", confidence: 0.0 },
      tags: [],
      exclusive_groups: [],
      description: "",
      notes: "unclear image"
    };
  }
}