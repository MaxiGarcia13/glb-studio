import type { Kit, KitId } from '@/modules/create/types/kit';

export const KITS: { [K in KitId]: Kit<K> } = {
  'empty': {
    id: 'empty',
    label: 'Empty',
    description: 'Start from scratch with a blank scene — pick a part kind and place it.',
    parts: [],
  },
  'simple-car': {
    id: 'simple-car',
    label: 'Simple car',
    description: 'A body with four cylinder wheels you can recolor and move around.',
    parts: [
      {
        kind: 'box',
        name: 'body',
        position: [0, 0.65, 0],
        rotation: [0, 0, 0],
        params: { width: 1.6, height: 0.55, depth: 2.6 },
        color: '#d62828',
      },
      {
        kind: 'cylinder',
        name: 'wheel_FL',
        position: [0.75, 0.35, 0.9],
        rotation: [0, 0, Math.PI / 2],
        params: { radius: 0.35, height: 0.3 },
        color: '#1d3557',
      },
      {
        kind: 'cylinder',
        name: 'wheel_FR',
        position: [-0.75, 0.35, 0.9],
        rotation: [0, 0, Math.PI / 2],
        params: { radius: 0.35, height: 0.3 },
        color: '#1d3557',
      },
      {
        kind: 'cylinder',
        name: 'wheel_RL',
        position: [0.75, 0.35, -0.9],
        rotation: [0, 0, Math.PI / 2],
        params: { radius: 0.35, height: 0.3 },
        color: '#1d3557',
      },
      {
        kind: 'cylinder',
        name: 'wheel_RR',
        position: [-0.75, 0.35, -0.9],
        rotation: [0, 0, Math.PI / 2],
        params: { radius: 0.35, height: 0.3 },
        color: '#1d3557',
      },
    ],
  },
  'block-figure': {
    id: 'block-figure',
    label: 'Block figure',
    description: 'A simple figure made of blocks — torso, head, arms and legs.',
    parts: [
      {
        kind: 'box',
        name: 'torso',
        position: [0, 1.05, 0],
        rotation: [0, 0, 0],
        params: { width: 0.5, height: 0.7, depth: 0.3 },
        color: '#457b9d',
      },
      {
        kind: 'box',
        name: 'head',
        position: [0, 1.56, 0],
        rotation: [0, 0, 0],
        params: { width: 0.32, height: 0.32, depth: 0.32 },
        color: '#f1dac0',
      },
      {
        kind: 'box',
        name: 'arm_L',
        position: [-0.34, 1, 0],
        rotation: [0, 0, 0],
        params: { width: 0.18, height: 0.65, depth: 0.18 },
        color: '#3a506b',
      },
      {
        kind: 'box',
        name: 'arm_R',
        position: [0.34, 1, 0],
        rotation: [0, 0, 0],
        params: { width: 0.18, height: 0.65, depth: 0.18 },
        color: '#3a506b',
      },
      {
        kind: 'box',
        name: 'leg_L',
        position: [-0.15, 0.35, 0],
        rotation: [0, 0, 0],
        params: { width: 0.28, height: 0.7, depth: 0.28 },
        color: '#1d3557',
      },
      {
        kind: 'box',
        name: 'leg_R',
        position: [0.15, 0.35, 0],
        rotation: [0, 0, 0],
        params: { width: 0.28, height: 0.7, depth: 0.28 },
        color: '#1d3557',
      },
    ],
  },
};

export function getKit<K extends KitId>(id: K): Kit<K> {
  return KITS[id];
}

export function listKits(): Kit[] {
  return Object.values(KITS);
}
