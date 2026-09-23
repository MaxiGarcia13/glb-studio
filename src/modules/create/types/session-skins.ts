import type { Texture } from 'three';

/** One session skin candidate for a skinned library model (US-48). */
export interface SessionSkinEntry {
  id: string;
  label: string;
  /** Wardrobe-owned texture; dispose when the entry leaves the session. */
  texture: Texture;
}

/** Per-model session wardrobe (not GLB extras; not durable across reload). */
export interface SessionSkinWardrobe {
  skins: SessionSkinEntry[];
  activeSkinId: string | null;
}

export type SessionSkinsByModel = Record<string, SessionSkinWardrobe>;
