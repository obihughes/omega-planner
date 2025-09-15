export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  checked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingStorageData {
  version: string;
  items: ShoppingItem[];
  lastUpdated: string;
}


