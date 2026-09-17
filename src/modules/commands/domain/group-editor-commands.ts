import type {
  EditorCommand,
  EditorCommandCategory,
} from '../types/editor-command';

export interface EditorCommandGroup {
  category: EditorCommandCategory;
  commands: EditorCommand[];
}

/** Group catalog entries by category, preserving catalog order. */
export function groupEditorCommandsByCategory(
  commands: readonly EditorCommand[],
): EditorCommandGroup[] {
  const groups: EditorCommandGroup[] = [];

  for (const command of commands) {
    const last = groups[groups.length - 1];
    if (last && last.category === command.category) {
      last.commands.push(command);
      continue;
    }
    groups.push({ category: command.category, commands: [command] });
  }

  return groups;
}
