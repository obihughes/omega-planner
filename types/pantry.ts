export interface PantryItem {
  id: string;
  name: string;
  quantity?: string; // e.g., "2 cups", "1 lb"
  category?: string; // e.g., Produce, Protein, Spices
  createdAt: string;
  updatedAt: string;
}

export interface PantryStorageData {
  version: string;
  items: PantryItem[];
  lastUpdated: string;
}


