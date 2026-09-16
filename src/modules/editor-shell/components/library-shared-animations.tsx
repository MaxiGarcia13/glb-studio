import { useStore } from '@nanostores/react';
import { ClipRows } from '@/modules/animation/components/clip-rows';
import { $clips } from '@/modules/animation/stores/clip-store';
import { LibrarySectionCollapsible } from '@/modules/editor-shell/components/library-section-collapsible';

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
    >
      <ClipRows clips={sharedClips} ownerModelId={null} />
    </LibrarySectionCollapsible>
  );
}
