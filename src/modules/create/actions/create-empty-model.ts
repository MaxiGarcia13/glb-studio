import { Group } from 'three';
import {
  addCreatedModelToLibrary,
  nextCreatedModelFileName,
} from './add-created-model';

/** Create a blank model in the library (no parts) and focus it in the preview. */
export function createEmptyModel(): void {
  const scene = new Group();
  scene.name = 'New model';
  addCreatedModelToLibrary(scene, nextCreatedModelFileName('New model'));
}
