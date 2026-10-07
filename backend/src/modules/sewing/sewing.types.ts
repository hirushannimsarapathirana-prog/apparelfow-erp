export interface SewingQueueItem {
  id: string;
  orderNo: string;
  targetQty: number;
  fabricRollId: string | null;
  actualFabricYds: number | null;
  status: string;
  createdAt: Date;
  recipe: {
    id: string;
    recipeCode: string;
    name: string;
    category: string;
  };
}