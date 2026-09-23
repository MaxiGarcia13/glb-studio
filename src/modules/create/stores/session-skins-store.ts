import type { Object3D, Texture } from 'three';
import type {
  SessionSkinEntry,
  SessionSkinsByModel,
  SessionSkinWardrobe,
} from '../types/session-skins';

import { atom } from 'nanostores';
import { disposeImageTexture } from '@/utils/dispose-image-texture';
import { collectLiveColorMaps } from '../domain/collect-live-color-maps';
import { labelForColorMap } from '../domain/color-map-label';

const EMPTY_WARDROBE: SessionSkinWardrobe = {
  skins: [],
  activeSkinId: null,
};

let nextSkinId = 1;

function createSkinId(): string {
  return `skin-${nextSkinId++}`;
}

/** Session-only skinned wardrobe keyed by library `modelId` (US-48). */
export const $sessionSkinsByModel = atom<SessionSkinsByModel>({});

export function getSessionSkinWardrobe(
  modelId: string,
): Readonly<SessionSkinWardrobe> {
  return $sessionSkinsByModel.get()[modelId] ?? EMPTY_WARDROBE;
}

export function getSessionSkin(
  modelId: string,
  skinId: string,
): SessionSkinEntry | null {
  return (
    getSessionSkinWardrobe(modelId).skins.find((entry) => entry.id === skinId)
    ?? null
  );
}

/** Wardrobe-owned textures for a model (must not be freed as live orphans). */
export function collectSessionSkinTextures(modelId: string): Texture[] {
  return getSessionSkinWardrobe(modelId).skins.map((entry) => entry.texture);
}

/**
 * Append a wardrobe entry and make it active.
 * Caller owns decode; this store takes ownership of `texture`.
 */
export function appendSessionSkin(
  modelId: string,
  options: {
    texture: Texture;
    label?: string;
    id?: string;
  },
): SessionSkinEntry {
  const entry: SessionSkinEntry = {
    id: options.id ?? createSkinId(),
    label: options.label ?? labelForColorMap(options.texture),
    texture: options.texture,
  };

  const all = $sessionSkinsByModel.get();
  const previous = all[modelId] ?? EMPTY_WARDROBE;
  $sessionSkinsByModel.set({
    ...all,
    [modelId]: {
      skins: [...previous.skins, entry],
      activeSkinId: entry.id,
    },
  });
  return entry;
}

/** Set which wardrobe entry is active (`null` = No skin). Does not assign materials. */
export function setActiveSessionSkinId(
  modelId: string,
  activeSkinId: string | null,
): void {
  const all = $sessionSkinsByModel.get();
  const wardrobe = all[modelId];
  if (!wardrobe) {
    return;
  }

  if (activeSkinId !== null
    && !wardrobe.skins.some((entry) => entry.id === activeSkinId)) {
    return;
  }

  if (wardrobe.activeSkinId === activeSkinId) {
    return;
  }

  $sessionSkinsByModel.set({
    ...all,
    [modelId]: { ...wardrobe, activeSkinId },
  });
}

/**
 * Drop one wardrobe entry and dispose its texture when safe.
 * Does not clear the live material (caller / later Remove-entry path).
 */
export function removeSessionSkinEntry(
  modelId: string,
  skinId: string,
  options: { liveMaps?: ReadonlySet<Texture> } = {},
): SessionSkinEntry | null {
  const all = $sessionSkinsByModel.get();
  const wardrobe = all[modelId];
  if (!wardrobe) {
    return null;
  }

  const index = wardrobe.skins.findIndex((entry) => entry.id === skinId);
  if (index < 0) {
    return null;
  }

  const removed = wardrobe.skins[index]!;
  const skins = wardrobe.skins.filter((entry) => entry.id !== skinId);
  const activeSkinId
    = wardrobe.activeSkinId === skinId ? null : wardrobe.activeSkinId;

  if (skins.length === 0 && activeSkinId === null) {
    const next = { ...all };
    delete next[modelId];
    $sessionSkinsByModel.set(next);
  } else {
    $sessionSkinsByModel.set({
      ...all,
      [modelId]: { skins, activeSkinId },
    });
  }

  const liveMaps = options.liveMaps;
  if (!liveMaps || !liveMaps.has(removed.texture)) {
    disposeImageTexture(removed.texture);
  }

  return removed;
}

/**
 * Dispose wardrobe textures for a model and drop the store entry.
 * Pass `scene` when the model is about to be scene-disposed so live
 * `material.map` instances are left for `disposeScene` (no double-free).
 */
export function disposeSessionSkinsForModel(
  modelId: string,
  scene?: Object3D | null,
): void {
  const all = $sessionSkinsByModel.get();
  const wardrobe = all[modelId];
  if (!wardrobe) {
    return;
  }

  const liveMaps = scene ? collectLiveColorMaps(scene) : new Set<Texture>();
  for (const entry of wardrobe.skins) {
    if (!liveMaps.has(entry.texture)) {
      disposeImageTexture(entry.texture);
    }
  }

  const next = { ...all };
  delete next[modelId];
  $sessionSkinsByModel.set(next);
}

/** Drop every wardrobe (e.g. last model removed). Disposes all owned textures. */
export function disposeAllSessionSkins(): void {
  const all = $sessionSkinsByModel.get();
  if (Object.keys(all).length === 0) {
    return;
  }
  for (const wardrobe of Object.values(all)) {
    for (const entry of wardrobe.skins) {
      disposeImageTexture(entry.texture);
    }
  }
  $sessionSkinsByModel.set({});
}

/** Test helper — reset id counter and store without disposing. */
export function resetSessionSkinsStoreForTests(): void {
  $sessionSkinsByModel.set({});
  nextSkinId = 1;
}
