export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStorageData {
  version: string;
  items: TodoItem[];
  lastUpdated: string;
}
