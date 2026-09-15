import { PartColorTool } from './part-color-tool';
import { PartDeleteTool } from './part-delete-tool';
import { PartDuplicateTool } from './part-duplicate-tool';

/**
 * Vertical create rail docked after Settings.
 * Hosts part tools (color, duplicate, delete) without bloating one file.
 */
export function ToolBar() {
  return (
    <section
      role="toolbar"
      aria-label="Create tools"
      className="flex h-full shrink-0 flex-col items-center gap-1 border-l border-zinc-700 bg-zinc-800 py-2 px-1"
    >
      <PartColorTool />
      <PartDuplicateTool />
      <PartDeleteTool />
    </section>
  );
}
