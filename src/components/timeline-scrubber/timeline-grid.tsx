interface TimelineGridProps {
  majorFrames: number[];
  minorFrames: number[];
  totalFrames: number;
}

export function TimelineGrid({ majorFrames, minorFrames, totalFrames }: TimelineGridProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 bottom-0 border-t border-border/80">
      {minorFrames.map((frame) => (
        <span
          key={`minor-${frame}`}
          className="absolute top-0 h-full w-px bg-surface"
          style={{ left: `${(frame / totalFrames) * 100}%` }}
        />
      ))}
      {majorFrames.map((frame) => (
        <span
          key={`major-${frame}`}
          className="absolute top-0 h-full w-px bg-control-strong/80"
          style={{ left: `${(frame / totalFrames) * 100}%` }}
        >
          <span className="absolute top-0 left-0 h-2 w-px bg-fg-muted" />
        </span>
      ))}
      <span className="absolute top-0 left-0 h-full w-px bg-control-strong/80">
        <span className="absolute top-0 left-0 h-2 w-px bg-fg-muted" />
      </span>
      <span className="absolute top-0 right-0 h-full w-px bg-control-strong/80">
        <span className="absolute top-0 left-0 h-2 w-px bg-fg-muted" />
      </span>
    </div>
  );
}
