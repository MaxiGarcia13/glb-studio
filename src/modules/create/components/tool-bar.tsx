import { useIsCreatedModelFocused } from '../hooks/use-selected-created-part';
import { AddPartPalette } from './add-part-palette';
import { PartColorTool } from './part-color-tool';
import { PartDeleteTool } from './part-delete-tool';
import { PartDuplicateTool } from './part-duplicate-tool';

/**
 * Vertical create rail docked after Settings.
 * Shown only when the focused model is `source: 'created'`.
 */
export function ToolBar() {
  return (
    <section
      role="toolbar"
      aria-label="Create tools"
      className="flex h-full shrink-0 flex-col items-center gap-1 border-l border-zinc-700 bg-zinc-800 py-2 px-1"
    >
      <AddPartPalette />
      <div className="my-1 h-px w-6 bg-zinc-700" aria-hidden />
      <PartColorTool />
      <PartDuplicateTool />
      <PartDeleteTool />
    </section>
  );
}
