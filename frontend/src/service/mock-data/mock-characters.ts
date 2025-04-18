import { Character, CharacterInMarket } from "../../interfaces";
import { Lina } from "../../assets/images/items";
import { mockCharacterItems } from "./mock-items";

export const mockCharacters: Character[] = [
  {
    title: "Lina Character",
    image: Lina.character,
    keyId: 1,
    name: "Lina Character",
    type: "tempetScavenger",
    id: "7999",
    description:
      "A Tempet Scavenger has Tempet technology, which is, own modification on the standard requirements and regulations on tech that is allowed. Agreed among the cities. Minimal and elegant, showcasing their water technology filtration system that is known throughout that land as having the best mask when it comes to scent tracking technology.",
    level: 1,
    detail: {
      boardId: "06553",
      brand: "0x0177812bsjs7998",
      artist: "emily",
      metadata: "https://yourmetadata.info",
    },
    projectDescription: "this is a project",
    itemActivity: [
      {
        name: "transfer",
        to: "0x0177812bsjs7998",
        from: "0x0177812bsjs7998",
        date: 1235667272,
      },
    ],
  },
  {
    title: "Tempet Character",
    image: Lina.character,
    keyId: 2,
    name: "Tempet Character",
    type: "tempetScavenger",
    id: "78991",
    description:
      "A Tempet Scavenger has Tempet technology, which is, own modification on the standard requirements and regulations on tech that is allowed. Agreed among the cities. Minimal and elegant, showcasing their water technology filtration system that is known throughout that land as having the best mask when it comes to scent tracking technology.",
    level: 2,
    detail: {
      boardId: "06553",
      brand: "0x0177812bsjs7998",
      artist: "emily",
      metadata: "https://yourmetadata.info",
    },
    projectDescription: "this is a project",
    itemActivity: [
      {
        name: "transfer",
        to: "0x0177812bsjs7998",
        from: "0x0177812bsjs7998",
        date: 1235667272,
      },
    ],
  },
];

export const mockCharactersForShop: Character[] = [
  {
    title: "Lina Character",
    image: Lina.character,
    keyId: 3,
    name: "Lina Character",
    type: "tempetScavenger",
    id: "9000",
    description:
      "A Tempet Scavenger has Tempet technology, which is, own modification on the standard requirements and regulations on tech that is allowed. Agreed among the cities. Minimal and elegant, showcasing their water technology filtration system that is known throughout that land as having the best mask when it comes to scent tracking technology.",
    level: 1,
    detail: {
      boardId: "06553",
      brand: "0x0177812bsjs7998",
      artist: "emily",
      metadata: "https://yourmetadata.info",
    },
    projectDescription: "this is a project",
    itemActivity: [
      {
        name: "transfer",
        to: "0x0177812bsjs7998",
        from: "0x0177812bsjs7998",
        date: 1235667272,
      },
    ],
  },
  {
    title: "Tempet Character",
    image: Lina.character,
    keyId: 4,
    name: "Tempet Character",
    type: "tempetScavenger",
    id: "9001",
    description:
      "A Tempet Scavenger has Tempet technology, which is, own modification on the standard requirements and regulations on tech that is allowed. Agreed among the cities. Minimal and elegant, showcasing their water technology filtration system that is known throughout that land as having the best mask when it comes to scent tracking technology.",
    level: 2,
    detail: {
      boardId: "06553",
      brand: "0x0177812bsjs7998",
      artist: "emily",
      metadata: "https://yourmetadata.info",
    },
    projectDescription: "this is a project",
    itemActivity: [
      {
        name: "transfer",
        to: "0x0177812bsjs7998",
        from: "0x0177812bsjs7998",
        date: 1235667272,
      },
    ],
  },
];

export const mockCharactersInMarket: CharacterInMarket[] = [
  {
    id: "1",
    character: mockCharactersForShop[0],
    equippedItems: mockCharacterItems,
    sell: {
      publicFacet: "",
      price: BigInt(50_000),
    },
  },
  {
    id: "2",
    character: mockCharactersForShop[1],
    equippedItems: mockCharacterItems,
    sell: {
      publicFacet: "",
      price: BigInt(500_000),
    },
  },
];
