import { useIsCreatedModelFocused } from '../hooks/use-selected-created-part';
import { PartColorTool } from './part-color-tool';

/**
 * Vertical create rail docked after Settings.
 * Hosts part tools (color now; duplicate / delete later) without bloating one file.
 */
export function ToolBar() {
  return (
    <div
      role="toolbar"
      aria-label="Create tools"
      className="flex h-full shrink-0 flex-col items-center gap-1 border-l border-zinc-700 bg-zinc-800 py-2 px-1"
    >
      <PartColorTool />
    </div>
  );
}
