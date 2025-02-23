import { Item, ItemCategory } from "../../interfaces";
import { BoldLabel, Dash, ImageProps } from "../atoms";
import { FC } from "react";
import {
  AssetContent,
  AssetFooter,
  AssetImage,
  AssetImageContainer,
  AssetInfoContainer,
  AssetTag,
  AssetTitleText,
  AssetTitleWrapper,
  AssetWrapper,
  NoAssetImage,
} from "./styles";
import { text } from "../../assets";
import { color } from "../../design";

interface Props {
  item: Item;
  selectItem: (name: string, category: ItemCategory) => void;
  imageProps?: ImageProps;
}
export const ItemCardInventory: FC<Props> = ({ item, selectItem }) => {
  const handleClick = () => {
    selectItem(item.name, item.category);
  };

  return (
    <AssetWrapper onClick={() => handleClick()}>
      <AssetContent>
        <AssetImageContainer>
          <AssetImage src={item.image} category={item.category} />
        </AssetImageContainer>
        <AssetInfoContainer>
          <AssetTitleWrapper>
            <AssetTitleText>{item.name}</AssetTitleText>
            <BoldLabel>{item.category}</BoldLabel>
          </AssetTitleWrapper>
          <AssetFooter>
            <AssetTag>
              <BoldLabel customColor={color.black}>{text.param.level(item.level)}</BoldLabel>
              <Dash />
              <BoldLabel customColor={color.black}>{text.param.rarity(item.rarity)}</BoldLabel>
            </AssetTag>
            {/* TODO: consider displaying what character the item is equipped to (item.equippedTo) */}
            {item.equippedTo && <BoldLabel customColor={color.black}>{text.general.equipped}</BoldLabel>}
            {item.forSale && <BoldLabel customColor={color.black}>{text.general.forSale}</BoldLabel>}
          </AssetFooter>
        </AssetInfoContainer>
      </AssetContent>
    </AssetWrapper>
  );
};
