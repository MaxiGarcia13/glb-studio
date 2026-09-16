import type { AssetStatus } from './types';

export const statusBadgeClass: Record<AssetStatus, string> = {
  ready: 'bg-success/15 text-success',
  error: 'bg-warning/15 text-warning',
};

export const defaultStatusLabel: Record<AssetStatus, string> = {
  ready: 'Ready',
  error: 'Needs attention',
};
