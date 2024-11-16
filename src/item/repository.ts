import { CSVRepository } from "../csv";
import { IItemRepository, Item } from "./item";

export class ItemRepository
  extends CSVRepository<Item>
  implements IItemRepository {}
