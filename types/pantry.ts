export interface PantryItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface PantryStorageData {
  version: string;
  items: PantryItem[];
  lastUpdated: string;
}


