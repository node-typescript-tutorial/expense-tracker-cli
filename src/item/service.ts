import { IItemRepository, IItemService, Item, SearchResult } from "./item";

export class ItemClient implements IItemService {
  constructor(private csvService: IItemRepository, generateId: () => string) {
    this.create = this.create.bind(this);
  }

  create(description: string, amount: number) {
    const item: Item = {
      id: "1",
      description: description,
      amount: amount,
      createdAt: new Date(),
    };
    this.csvService.insert(item);
  }

  async getAll(): Promise<SearchResult<Item>> {
    return this.csvService.all().then((result) => {
      return {
        list: result,
        total: result.length,
      };
    });
  }
}

