export interface ModelGroup {
  id: string;
  name: string;
  modelIds: string[];
}

export interface ModelGroupsState {
  groups: ModelGroup[];
}
