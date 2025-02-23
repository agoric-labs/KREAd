import { CharacterEquip, CharacterInMarket, Item, ItemInMarket } from "../interfaces";

export const sortItems = (sorting: string, items: Item[]): Item[] => {
  switch (sorting) {
    case "atoz":
      return items.sort((a, b) => a.name.localeCompare(b.name));
    case "rarity":
      return items.sort((a, b) => b.rarity - a.rarity);
    case "level":
      return items.sort((a, b) => b.level - a.level);
    case "latest":
      return items;
    default:
      return items;
  }
};

export const sortItemsMarket = (sorting: string, items: ItemInMarket[]): ItemInMarket[] => {
  switch (sorting) {
    case "atoz":
      return items.sort((a, b) => a.item.name.localeCompare(b.item.name));
    case "lowestPrice":
      return items.sort((a, b) => Number(a.sell.price) - Number(b.sell.price));
    case "highestPrice":
      return items.sort((a, b) => Number(b.sell.price) - Number(a.sell.price));
    case "rarity":
      return items.sort((a, b) => b.item.rarity - a.item.rarity);
    case "level":
      return items.sort((a, b) => b.item.level - a.item.level);
    case "latest":
      return items;
    default:
      return items;
  }
};

export const sortCharacters = (sorting: string, characters: CharacterEquip[]): CharacterEquip[] => {
  switch (sorting) {
    case "atoz":
      return characters.sort((a, b) => a.nft.name.localeCompare(b.nft.name));
    case "rarity":
      return characters.sort((a, b) => b.nft.level - a.nft.level);
    case "latest":
      return characters;
    default:
      return characters;
  }
};

export const sortCharactersMarket = (sorting: string, characters: CharacterInMarket[]): CharacterInMarket[] => {
  switch (sorting) {
    case "atoz":
      return characters.sort((a, b) => a.character.name.localeCompare(b.character.name));
    case "lowestPrice":
      return characters.sort((a, b) => Number(a.sell.price) - Number(b.sell.price));
    case "highestPrice":
      return characters.sort((a, b) => Number(b.sell.price) - Number(a.sell.price));
    case "rarity":
      return characters.sort((a, b) => b.character.level - a.character.level);
    case "latest":
      return characters;
    default:
      return characters;
  }
};
