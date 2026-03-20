// Complete Cloudinary photo service with user-based storage
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system/legacy";
import { classifyImageByFileUri, classifyImageByUrlScored, classifyClipByUrl } from "./visionService";

const EXTRA = (Constants?.expoConfig?.extra) || {};

// Cloud name is not a secret; provide a safe fallback for convenience
export const CLOUDINARY_CONFIG = {
  cloud_name: EXTRA.CLOUDINARY_CLOUD_NAME,
  upload_preset: EXTRA.CLOUDINARY_UPLOAD_PRESET,
  api_key: EXTRA.CLOUDINARY_API_KEY || "",
};

function assertCloudinaryConfigured() {
  if (!CLOUDINARY_CONFIG.cloud_name || !CLOUDINARY_CONFIG.upload_preset) {
    throw new Error(
      "Cloudinary chưa được cấu hình: cần CLOUDINARY_CLOUD_NAME và CLOUDINARY_UPLOAD_PRESET (app.config.js → extra hoặc biến môi trường)."
    );
  }
}

const STORAGE_KEY = "photos";

// Utility function to validate and fix Cloudinary URLs
export function validateCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Check if it's already a valid HTTP URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Check if it's a file:// URL (invalid for remote display)
  if (url.startsWith('file://')) {
    console.warn('Invalid file:// URL detected:', url);
    return null;
  }

  // If it's a Cloudinary public ID, construct the URL
  if (url && !url.includes('://')) {
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/${url}`;
  }

  return url;
}

function extractAutoTags(uploadResult) {
  const explicitTags = Array.isArray(uploadResult?.tags) ? uploadResult.tags : [];
  const info = uploadResult?.info || {};
  const imagga = info?.categorization?.imagga_tagging?.data || [];
  const google = info?.categorization?.google_tagging?.data || [];
  const imaggaTags = imagga.map((x) => x.tag?.en || x.tag || "").filter(Boolean);
  const googleTags = google.map((x) => x.tag || x.label || "").filter(Boolean);
  return Array.from(new Set([...explicitTags, ...imaggaTags, ...googleTags]));
}

export async function uploadImageToCloudinary(fileUri, userId) {
  try {
    assertCloudinaryConfigured();

    console.log("📤 Cloudinary config:", {
      cloud_name: CLOUDINARY_CONFIG.cloud_name,
      upload_preset: CLOUDINARY_CONFIG.upload_preset,
      api_key: CLOUDINARY_CONFIG.api_key ? "***" : "missing",
      env_check: {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "not_set",
        CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || "not_set"
      }
    });

    // Ensure file URI is valid for Expo/EAS Build
    let validFileUri = fileUri;
    if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
      validFileUri = `file://${fileUri}`;
    }

    console.log("📤 File URI:", validFileUri);

    const formData = new FormData();

    // For Expo/EAS Build compatibility, ensure proper file object format
    formData.append("file", {
      uri: validFileUri,
      type: "image/jpeg", // Critical: must specify exact MIME type
      name: `photo_${Date.now()}.jpg`,
    });

    formData.append("upload_preset", CLOUDINARY_CONFIG.upload_preset);
    formData.append("folder", `photos/${userId}`);
    formData.append("tags", `user:${userId}`);

    // Add API key for signed uploads (if available)
    if (CLOUDINARY_CONFIG.api_key) {
      formData.append("api_key", CLOUDINARY_CONFIG.api_key);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
    console.log("📤 Uploading to:", uploadUrl);

    // Critical: Do NOT set Content-Type header manually - let fetch handle it
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      // No headers - let fetch set multipart/form-data with boundary automatically
    });

    const result = await response.json();
    console.log("📤 Upload response:", {
      status: response.status,
      ok: response.ok,
      result: result
    });

    if (!response.ok) {
      const errorMessage = result.error?.message || result.message || `HTTP ${response.status}`;
      console.error("❌ Cloudinary upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: result
      });
      throw new Error(`Cloudinary upload failed: ${errorMessage}`);
    }

    const autoTags = extractAutoTags(result);

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      bytes: result.bytes,
      format: result.format,
      autoTags,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
}

function detectType({ isSelfie, source }) {
  if (isSelfie) return "selfie";
  if (source === "camera") return "chụp";
  if (source === "picker") return "tải";
  return "khác";
}

function buildDateParts(dateIso) {
  const d = new Date(dateIso);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

async function readAll() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
}

async function writeAll(list) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function articleFor(word) {
  const w = String(word || "").trim().toLowerCase();
  if (!w) return "a";
  return ["a", "e", "i", "o", "u"].includes(w[0]) ? "an" : "a";
}

function canonicalMap(label) {
  const l = String(label || "").toLowerCase();
  if (/(person|human|man|woman|people|girl|boy|selfie)/.test(l)) return "person";
  if (/(flower|blossom|rose|tulip)/.test(l)) return "flower";
  if (/(dog|puppy|canine)/.test(l)) return "dog";
  if (/(car|vehicle|automobile|sedan|suv)/.test(l)) return "car";
  if (/(mountain|mount|peak|alps|himalaya)/.test(l)) return "mountain";
  if (/(meal|food|dish|cuisine|plate|lunch|dinner|breakfast)/.test(l)) return "meal";
  return label;
}

function toPhrase(label) {
  if (!label) return "a photo";
  const raw = canonicalMap(label).toString().trim();
  const lower = raw.toLowerCase();
  if (lower.startsWith("a ") || lower.startsWith("an ")) return raw;
  return `${articleFor(raw)} ${raw}`;
}

function formatLabels(labels) {
  const arr = Array.isArray(labels) ? labels : [];
  const phrases = arr.map(toPhrase);
  return Array.from(new Set(phrases));
}

// Remove overly-generic human tags when more specific or non-human tags exist
function sanitizeLabels(labels) {
  const input = Array.from(new Set((labels || []).map(x => String(x).toLowerCase().trim()).filter(Boolean)));
  // Always hide user-specific tags from app display
  const withoutUserTags = input.filter(l => !l.startsWith("user:"));
  const genericHuman = new Set(["person", "people", "human", "face", "selfie"]);
  const specificHuman = new Set(["man", "woman", "boy", "girl", "portrait", "child", "baby"]);

  const hasSpecificHuman = withoutUserTags.some(l => specificHuman.has(l));
  const hasNonHuman = withoutUserTags.some(l => !genericHuman.has(l) && !specificHuman.has(l));

  let out = withoutUserTags.slice();
  if (hasSpecificHuman || hasNonHuman) {
    out = out.filter(l => !genericHuman.has(l));
  }

  // Soft cleanup of vague terms
  out = out.filter(l => l !== "object");

  return out;
}

// Infer hierarchical categories from labels
function inferCategories(labels) {
  const set = new Set((labels || []).map(l => String(l).toLowerCase().trim()));
  const humanGeneric = ["person", "people", "human", "face", "selfie"];
  const humanSpecific = ["man", "woman", "boy", "girl", "portrait", "child", "baby"];
  const animalWords = [
    "animal", "dog", "cat", "bird", "fish", "horse", "cow", "sheep", "goat", "pig", "chicken",
    "duck", "goose", "rabbit", "hamster", "turtle", "frog", "insect", "butterfly", "spider",
    "puppy", "kitten", "parrot", "pet", "wildlife"
  ];

  const hasHuman = [...humanGeneric, ...humanSpecific].some(w => set.has(w));
  if (hasHuman) {
    return { categoryPrimary: "human", categorySecondary: null };
  }

  const hasAnimal = animalWords.some(w => set.has(w));
  return { categoryPrimary: "thing", categorySecondary: hasAnimal ? "animal" : "object" };
}

// Remove custom ranking; rely on API confidence
function pickTopByScore(cloudTags, hfScored, clipScored, max = 3) {
  const items = [];
  for (const t of cloudTags || []) items.push({ label: String(t), score: 0.50 });
  for (const s of hfScored || []) items.push({ label: String(s.label), score: Number(s.score) });
  for (const s of clipScored || []) items.push({ label: String(s.label), score: Number(s.score) + 0.05 }); // small bias to CLIP
  const best = new Map();
  for (const it of items) {
    const key = it.label.toLowerCase();
    const prev = best.get(key);
    if (!prev || it.score > prev.score) best.set(key, it);
  }
  const sorted = Array.from(best.values()).sort((a, b) => b.score - a.score);
  return sorted.slice(0, max).map(x => x.label);
}

export async function updatePhotoLabels(photoId, userId, newLabels) {
  const list = await readAll();
  const idx = list.findIndex(p => p.id === photoId && p.userId === userId);
  if (idx >= 0) {
    const clean = sanitizeLabels(newLabels);
    const mergedRaw = Array.from(new Set([...(list[idx].labels || []), ...clean]));
    const pruned = mergedRaw.slice(0, 3);
    const { categoryPrimary, categorySecondary } = inferCategories(pruned);
    list[idx] = { ...list[idx], labels: pruned, categoryPrimary, categorySecondary };
    await writeAll(list);
  }
}

export async function savePhotoLocal({ uri, coords, note = "", labels = [], userId, isSelfie = false, source = "camera" }) {
  const timestamp = new Date().toISOString();
  const cleanLabels = sanitizeLabels(labels);
  const { categoryPrimary, categorySecondary } = inferCategories(cleanLabels);
  const photo = {
    id: Date.now().toString(),
    uri,
    coords,
    note,
    labels: cleanLabels.slice(0, 3),
    timestamp,
    userId,
    type: detectType({ isSelfie, source }),
    categoryPrimary,
    categorySecondary,
    ...buildDateParts(timestamp),
  };
  const saved = await readAll();
  saved.push(photo);
  await writeAll(saved);
  return photo;
}

export async function savePhotoToCloudinary({ uri, coords, note = "", labels = [], isSelfie = false, source = "camera" }, userId) {
  const timestamp = new Date().toISOString();

  try {
    // Upload to Cloudinary first
    console.log("📤 Uploading to Cloudinary...");
    const cloudinaryResult = await uploadImageToCloudinary(uri, userId);
    console.log("✅ Cloudinary upload successful:", cloudinaryResult.publicId);

    // Get AI labels using Hugging Face
    console.log("🤖 Analyzing image with AI (Hugging Face)...");
    const hfScoredPrimary = await classifyImageByFileUri(uri);
    // Rank labels giving slight preference to CLIP style when available
    let top3 = pickTopByScore(cloudinaryResult.autoTags || [], hfScoredPrimary || [], [], 3);

    // Fallback to secondary HF pipeline if primary returns empty
    if (!top3.length) {
      try {
        console.log("🔄 Trying secondary HF pipeline (CLIP zero-shot by URL)...");
        const clipScored = await classifyClipByUrl(cloudinaryResult.secureUrl);
        top3 = pickTopByScore(cloudinaryResult.autoTags || [], [], clipScored || [], 3);
      } catch (hfError) {
        console.warn("⚠️ Hugging Face fallback failed:", hfError.message);
      }
    }

    // Combine Cloudinary auto-tags with AI labels; ensure best subjects first and hide user:* tags
    let combined = Array.from(new Set([
      ...top3,
      ...(labels || []),
      ...(cloudinaryResult.autoTags || [])
    ]));
    let allLabels = sanitizeLabels(combined);
    // If after sanitization we have less than 3, top up with more Cloudinary tags
    if (allLabels.length < 3 && Array.isArray(cloudinaryResult.autoTags)) {
      for (const t of cloudinaryResult.autoTags) {
        const lt = String(t || '').toLowerCase();
        if (!lt || lt.startsWith('user:')) continue;
        if (!allLabels.includes(lt)) {
          allLabels.push(lt);
          if (allLabels.length >= 3) break;
        }
      }
    }

    const { categoryPrimary, categorySecondary } = inferCategories(allLabels);

    const photo = {
      id: Date.now().toString(),
      uri: cloudinaryResult.secureUrl, // Use Cloudinary URL instead of local URI
      localUri: uri, // Keep local URI for reference
      coords,
      note,
      labels: allLabels.slice(0, 3),
      timestamp,
      userId,
      type: detectType({ isSelfie, source }),
      categoryPrimary,
      categorySecondary,
      ...buildDateParts(timestamp),
      // Cloudinary metadata
      cloudinary: {
        publicId: cloudinaryResult.publicId,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        bytes: cloudinaryResult.bytes,
        format: cloudinaryResult.format,
        createdAt: cloudinaryResult.createdAt
      }
    };

    // Save to local storage
    const saved = await readAll();
    saved.push(photo);
    await writeAll(saved);

    console.log("💾 Photo saved locally with Cloudinary URL");

    // Firebase sync will be handled by caller (CameraScreen)
    console.log("✅ Photo ready for Firebase sync by caller");

    // Background AI processing for additional labels
    (async () => {
      try {
        console.log("🔄 Running background AI analysis...");
        const [hf, clip] = await Promise.all([
          classifyImageByUrlScored(cloudinaryResult.secureUrl),
          classifyClipByUrl(cloudinaryResult.secureUrl)
        ]);

        const top = sanitizeLabels(pickTopByScore(cloudinaryResult.autoTags || [], hf || [], clip || [], 3));
        if (top && top.length) {
          await updatePhotoLabels(photo.id, userId, top);
          console.log("✅ Background AI analysis completed");
        }
      } catch (bgError) {
        console.warn("⚠️ Background AI analysis failed:", bgError.message);
      }
    })();

    return photo;

  } catch (cloudinaryError) {
    console.error("❌ Cloudinary upload failed:", cloudinaryError);

    // Re-throw the error instead of falling back to local storage
    throw new Error(`Không thể upload ảnh lên Cloudinary: ${cloudinaryError.message}`);
  }
}

export async function getAllPhotos(userId) {
  const allPhotos = await readAll();
  return allPhotos.filter(photo => photo.userId === userId);
}

export async function getAllPhotosLocal() {
  return await readAll();
}

export async function getPhotoById(userId, photoId) {
  const allPhotos = await readAll();
  return allPhotos.find(p => p.userId === userId && p.id === photoId) || null;
}

export async function deletePhotoLocal(userId, photoId) {
  const allPhotos = await readAll();
  const filtered = allPhotos.filter(p => !(p.userId === userId && p.id === photoId));
  await writeAll(filtered);
  return true;
}

export function subscribePhotoUpdates(userId, photoId, onChange, intervalMs = 1500) {
  let cancelled = false;
  const tick = async () => {
    if (cancelled) return;
    const p = await getPhotoById(userId, photoId);
    if (p) onChange(p);
    if (!cancelled) setTimeout(tick, intervalMs);
  };
  tick();
  return () => { cancelled = true; };
}

// Grouping helpers
export function groupByDate(photos) {
  const map = {};
  for (const p of photos) {
    const key = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

export function groupByType(photos) {
  const map = {};
  for (const p of photos) {
    const key = p.type || 'khác';
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

export function groupByLabel(photos) {
  const map = {};
  for (const p of photos) {
    const labels = Array.isArray(p.labels) && p.labels.length ? p.labels : ["unknown"];
    for (const l of labels) {
      if (!map[l]) map[l] = [];
      map[l].push(p);
    }
  }
  return map;
}

// List all labels (albums) with counts
export function listAllLabels(photos) {
  const grouped = groupByLabel(photos);
  return Object.keys(grouped).map(label => ({ label, count: grouped[label].length }));
}

// Fetch photos by a specific label (album)
export function getPhotosByLabel(photos, label) {
  const key = String(label || '').toLowerCase();
  return (photos || []).filter(p => {
    const arr = Array.isArray(p.labels) ? p.labels : [];
    return arr.some(l => String(l).toLowerCase() === key);
  });
}

export async function deletePhotoFromCloudinary(photoId, userId) {
  try {
    console.log('🗑️ Attempting to delete photo:', { photoId, userId });

    // Import Firebase delete function
    const { deletePhotoFromUserAlbum } = require('./userAlbumService');

    // Delete from Firebase first (main data source)
    const deletedPhoto = await deletePhotoFromUserAlbum(userId, photoId);

    if (!deletedPhoto) {
      console.log('⚠️ Photo not found in Firebase, checking local storage...');

      // Fallback: try local storage
      const allPhotos = await readAll();
      const photoToDelete = allPhotos.find(p => p.id === photoId && p.userId === userId);

      if (!photoToDelete) {
        throw new Error('Không tìm thấy ảnh để xóa');
      }

      // Delete from local storage
      const filtered = allPhotos.filter(p => !(p.userId === userId && p.id === photoId));
      await writeAll(filtered);
      console.log('✅ Photo deleted from local storage:', photoId);
    } else {
      console.log('✅ Photo deleted from Firebase:', photoId);
    }

    return true;
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    throw error;
  }
}

export async function refreshLabels(userId, photoId, uri) {
  try {
    // const hfLabels = await classifyImageByUrl(uri);
    // if (hfLabels && hfLabels.length) {
    //   await updatePhotoLabels(photoId, userId, hfLabels);
    // }
    return true;
  } catch {
    return false;
  }
}
