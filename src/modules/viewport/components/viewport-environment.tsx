import { GroundGrid } from './ground-grid';

/**
 * Shared scene chrome for editor / preview canvases: lights + ground grid.
 * Keep in sync with the main viewport look (part preview reuses this).
 */
export function ViewportEnvironment() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <GroundGrid />
    </>
  );
}
