import { FC, useEffect, useState } from "react";

import { ButtonText, ErrorView, Filters, HorizontalDivider, Label, LoadingPage, LoadMore, MenuItem, Select } from "../../components";
import { CategoryContainer, ListContainer, ListHeader, SortableListWrap, SortContainer } from "./styles";

import { useMyCharacters } from "../../service";

import { text } from "../../assets";
import { characterInventoryCategories, sortItemsInInventory } from "../../assets/text/filter-options";
import { color } from "../../design";
import { PAGE_SIZE } from "../../constants";

interface Props {
  onCharacterClick: (id: string) => void;
  onFilterClick: (items: boolean) => void;
}

// TODO: will soon be legacy code from Nick's changes
export const CharactersList: FC<Props> = ({ onCharacterClick, onFilterClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSorting, setSelectedSorting] = useState<string>("");
  const [filterId, setFilterId] = useState("");
  const [intitial, setInitial] = useState(true);

  const [myCharacters, isLoading] = useMyCharacters({ category: selectedCategory, sorting: selectedSorting });

  useEffect(() => {
    onFilterClick(!myCharacters || !myCharacters.length);
  }, [myCharacters, onFilterClick]);

  if (isLoading) return <LoadingPage spinner={false} />;

  if (!myCharacters || !myCharacters.length) return <ErrorView />;

  const openFilter = (id: string) => {
    setFilterId(id !== filterId ? id : "");
  };

  const removeInitial = () => {
    setInitial(false);
  };

  const loadMore = () => {
    setPage((prevState) => prevState + 1);
  };

  // @ts-ignore
  return (
    <SortableListWrap>
      <ListHeader>
        <CategoryContainer>
          <Filters label={selectedCategory || text.filters.category} openFilter={openFilter} id={filterId}>
            <Select label={text.filters.allCategories} handleChange={setSelectedCategory} options={characterInventoryCategories} />
          </Filters>
        </CategoryContainer>
        <SortContainer>
          <Label>{text.filters.sortBy}</Label>
          <Filters label={selectedSorting || text.filters.latest} openFilter={openFilter} id={filterId}>
            <Select label={text.filters.latest} handleChange={setSelectedSorting} options={sortItemsInInventory} />
          </Filters>
        </SortContainer>
      </ListHeader>
      <ButtonText customColor={color.darkGrey}>{text.param.amountOfCharacters(myCharacters.length)}</ButtonText>
      <HorizontalDivider />
      <ListContainer>
        <MenuItem
          data={{
            ...myCharacters[0].nft,
            image: myCharacters[0].equippedItems,
            category: myCharacters[0].nft.type,
            id: myCharacters[0].nft.id,
            characterImage: myCharacters[0].nft.image,
          }}
          key={myCharacters[0].nft.id}
          onClick={onCharacterClick}
          removeInitial={removeInitial}
          isInitial={intitial}
          isEquipped={myCharacters[0].isEquipped}
          isForSale={myCharacters[0].isForSale}
        />
        {myCharacters.slice(1).map((character) => (
          <MenuItem
            data={{
              ...character.nft,
              image: character.equippedItems,
              category: character.nft.type,
              id: character.nft.id,
              characterImage: character.nft.image,
            }}
            key={character.nft.id}
            onClick={onCharacterClick}
            removeInitial={removeInitial}
            isEquipped={character.isEquipped}
            isForSale={character.isForSale}
          />
        ))}
        {myCharacters.length > PAGE_SIZE && <LoadMore isLoading={isLoading} loadMore={loadMore} />}
      </ListContainer>
    </SortableListWrap>
  );
};
