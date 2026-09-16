import { useStore } from '@nanostores/react';
import { useCollapsible } from '@/components/collapsible';
import { ClipImport } from '@/modules/animation/components/clip-import';
import { ClipRows } from '@/modules/animation/components/clip-rows';
import { $clips } from '@/modules/animation/stores/clip-store';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';

function SharedAnimationsActions() {
  const { setOpen } = useCollapsible();
  return <ClipImport onImport={() => setOpen(true)} />;
}

export function LibrarySharedAnimations() {
  const { clips } = useStore($clips, { keys: ['clips'] });
  const sharedClips = clips.filter((entry) => entry.ownerModelId === null);
  const hasClips = sharedClips.length > 0;

  return (
    <LibrarySectionCollapsible
      title="Shared Animations"
      defaultOpen
      showChevron={hasClips}
      showTreeGuide={hasClips}
      actions={<SharedAnimationsActions />}
    >
      <ClipRows clips={sharedClips} ownerModelId={null} />
    </LibrarySectionCollapsible>
  );
}
