import { useCallback, useMemo, useState } from "react";
import { useMutation } from "react-query";
import { Item, ItemCategory, ItemInMarket } from "../interfaces";
import { filterItems, filterItemsInShop, ItemFilters, ItemsMarketFilters, mediate } from "../util";
import { useAgoricContext } from "../context/agoric";
import { useOffers } from "./offers";
import { INVENTORY_CALL_FETCH_DELAY, ITEM_PURSE_NAME } from "../constants";
import { useItemMarketState } from "../context/item-shop";
import { useUserState, useUserStateDispatch } from "../context/user";
import { useWalletState } from "../context/wallet";
import { marketService } from "./character/market";
import { inventoryService } from "./character/inventory";

// TODO: Fix this function used during buy and sell
export const useMyItem = (id: string): [Item | undefined, boolean] => {
  const [found] = useState<Item | undefined>(undefined);
  return [found, false];
};

export const useGetItemInInventoryByNameAndCategory = (name: string, category: ItemCategory | undefined): [Item | undefined, boolean] => {
  const [items, isLoading] = useGetItemsInInventory();

  const found = useMemo(() => items.find((item) => item.category === category && item.name === name), [name, category, items]);

  return [found, isLoading];
};

export const useGetItemsInInventory = (filters?: ItemFilters): [Item[], boolean] => {
  const { characters, fetched } = useUserState();
  const allEquippedItems = characters.flatMap((character) => Object.values(character.equippedItems)).filter((item) => item !== undefined);

  if (!filters) return [allEquippedItems, !fetched];

  const filtered = !filters ? allEquippedItems : filterItems(allEquippedItems, filters);

  return [filtered, !fetched];
};

export const useMyItemsForSale = () => {
  const offers = useOffers({ description: "seller", status: "pending" });

  // filtering item offers
  const itemOffers = useMemo(
    () =>
      offers.filter((offer) => {
        try {
          return offer.proposalTemplate.give.Items.pursePetname[1] === ITEM_PURSE_NAME;
        } catch (error) {
          return false;
        }
      }),
    [offers],
  );

  // getting items from filtered offers
  const itemsForSale: ItemEquip[] = useMemo(() => {
    try {
      const itemsFromOffers: ItemBackend[] = itemOffers.map((offer: any) => {
        return offer.proposalTemplate.give.Items.value[0];
      });
      const itemsFromOffersFrontend: ItemEquip[] = mediate.items
        .toFront(itemsFromOffers)
        .map((item) => ({ ...item, equippedTo: "", isForSale: true }));
      return itemsFromOffersFrontend;
    } catch (error) {
      return [];
    }
  }, [itemOffers]);

  return itemsForSale;
};

export const useGetItemInShopById = (id: string): [ItemInMarket | undefined, boolean] => {
  const { items, fetched } = useItemMarketState();

  const found = useMemo(() => items.find((item) => item.id === id), [id, items]);

  return [found, !fetched];
};

export const useGetItemsInShop = (filters?: ItemsMarketFilters): [ItemInMarket[], boolean] => {
  const { items, fetched } = useItemMarketState();
  if (!filters) return [items, !fetched];
  const filtered = !filters ? items : filterItemsInShop(items, filters);

  return [filtered, !fetched];
};

export const useSellItem = (itemName: string | undefined, itemCategory: ItemCategory | undefined) => {
  const [service] = useAgoricContext();
  const wallet = useWalletState();
  const { items } = useUserState();
  const [isLoading, setIsLoading] = useState(false);

  const callback = useCallback(
    async (price: number, setPlacedInShop: () => void) => {
      try {
        const found = items.find((item) => item.name === itemName && item.category === itemCategory);
        if (!found) return;
        const { forSale, equippedTo, activity, ...itemToSell } = found;
        const instance = service.contracts.kread.instance;
        const itemBrand = service.tokenInfo.item.brand;

        setIsLoading(true);

        marketService.sellItem({
          item: itemToSell,
          price: BigInt(price),
          service: {
            kreadInstance: instance,
            itemBrand,
            makeOffer: service.walletConnection.makeOffer,
            istBrand: service.tokenInfo.ist.brand,
          },
          callback: async () => {
            console.info("SellItem call settled");
            setPlacedInShop();
          },
        });
        return true;
      } catch (error) {
        console.warn(error);
        return false;
      }
    },
    [itemName, itemCategory, wallet, items, service],
  );

  return { callback, isLoading };
};

export const useBuyItem = (itemToBuy: ItemInMarket) => {
  const [service] = useAgoricContext();
  const wallet = useWalletState();
  const [items] = useGetItemsInShop();

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const instance = service.contracts.kread.instance;
  const itemBrand = service.tokenInfo.item.brand;
  const istBrand = service.tokenInfo.ist.brand;

  const callback = useCallback(
    async (setIsAwaitingApprovalToFalse: () => void) => {
      try {
        if (!itemToBuy) return;
        const { forSale, equippedTo, activity, ...itemObject } = itemToBuy.item;
        itemToBuy.item = itemObject;

        setIsLoading(true);

        return await marketService.buyItem({
          entryId: itemToBuy.id,
          item: itemToBuy.item,
          price: BigInt(itemToBuy.sell.price + itemToBuy.sell.platformFee + itemToBuy.sell.royalty),
          service: {
            kreadInstance: instance,
            itemBrand,
            makeOffer: service.walletConnection.makeOffer,
            istBrand,
          },
          callback: async () => {
            console.info("BuyItem call settled");
            setIsLoading(false);
          },
        });
      } catch (error) {
        console.warn(error);
        setIsError(true);
        setIsAwaitingApprovalToFalse();
      }
    },
    [itemToBuy, items, wallet, service],
  );

  return { callback, isLoading, isError };
};

export const useEquipItem = (callback?: React.Dispatch<React.SetStateAction<Item | undefined>>) => {
  const [service] = useAgoricContext();
  const { selected: character } = useUserState();
  const { character: charactersInWallet } = useWalletState();
  const userStateDispatch = useUserStateDispatch();
  const kreadInstance = service.contracts.kread.instance;
  const characterBrand = service.tokenInfo.character.brand;
  const itemBrand = service.tokenInfo.item.brand;

  return useMutation(async (body: { item: Item }) => {
    if (!character || !body.item) {
      console.error("Could not find item or character");
      return;
    }
    // FIXME: add character type
    const characterInWallet = charactersInWallet.find((walletEntry: any) => walletEntry.id == character.nft.id);

    if (!body.item) return;

    userStateDispatch({ type: "START_INVENTORY_CALL" });

    const { forSale, equippedTo, activity, ...itemToEquip } = body.item;

    await inventoryService.equipItem({
      character: characterInWallet,
      item: itemToEquip,
      service: {
        kreadInstance,
        characterBrand,
        itemBrand,
        makeOffer: service.walletConnection.makeOffer,
      },
      callback: async () => {
        console.info("Equip call settled");

        if (callback) callback(body.item);

        // Using a delay to prevent the character from disappearing when making inventory calls
        setTimeout(() => userStateDispatch({ type: "END_INVENTORY_CALL" }), INVENTORY_CALL_FETCH_DELAY);
      },
    });
  });
};

export const useUnequipItem = (callback?: () => void) => {
  const [service] = useAgoricContext();
  const { characters: ownedCharacters } = useUserState();
  const userStateDispatch = useUserStateDispatch();
  const instance = service.contracts.kread.instance;
  const charBrand = service.tokenInfo.character.brand;
  const itemBrand = service.tokenInfo.item.brand;

  return useMutation(async (body: { item: Item }) => {
    if (!body.item) return;
    userStateDispatch({ type: "START_INVENTORY_CALL" });

    const { forSale, equippedTo, activity, ...itemToUnequip } = body.item;
    const characterToUnequipFrom = ownedCharacters.find((character) => character.nft.name === equippedTo);
    if (!characterToUnequipFrom) {
      console.error("Could find character to unequip from");
      return;
    }

    await inventoryService.unequipItem({
      item: itemToUnequip,
      character: characterToUnequipFrom.nft,
      service: {
        kreadInstance: instance,
        characterBrand: charBrand,
        itemBrand,
        makeOffer: service.walletConnection.makeOffer,
      },
      callback: async () => {
        console.info("Unequip call settled");
        if (callback) callback();

        // Using a delay to prevent the character from disappearing when making inventory calls
        setTimeout(() => userStateDispatch({ type: "END_INVENTORY_CALL" }), INVENTORY_CALL_FETCH_DELAY);
      },
    });
  });
};
