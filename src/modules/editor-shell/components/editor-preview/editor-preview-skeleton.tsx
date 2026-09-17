export function EditorPreviewSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-canvas">
      <div className="relative flex-1 min-h-0">
        <div className="w-full h-full bg-surface animate-pulse" />
      </div>
    </div>
  );
}
