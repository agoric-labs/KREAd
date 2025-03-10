import React, { FC, useCallback, useState } from "react";
import { SelectBox, SelectDivider, StyledSelect, Tick } from "./styles";
import { ButtonText } from "../atoms";
import { color } from "../../design";
import { useViewport } from "../../hooks";
import { Diamond } from "../price-in-ist/styles";
import { ITEM_CATEGORIES } from "../../constants";

export interface Options {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  handleChange: (selected: string[]) => void;
  options: Options[];
  isMultiSelect?: boolean;
}

export const Select: FC<SelectProps> = ({ options, handleChange, isMultiSelect = false }) => {
  const [selected, setSelected] = useState<string | string[]>(isMultiSelect ? [options[0].value] : "");
  const { height } = useViewport();

  const handleOptionClick = useCallback(
    (index: number) => {
      const selectedValue = options[index].value;
      if (selectedValue === options[0].value) {
        setSelected([selectedValue]);
        handleChange([selectedValue]);
      } else {
        if (isMultiSelect) {
          setSelected((prevSelected) => {
            if (Array.isArray(prevSelected)) {
              if (prevSelected.includes(options[0].value)) {
                // Remove the first option and add the selected option
                handleChange([selectedValue]);
                return [selectedValue];
              } else if (prevSelected.includes(selectedValue)) {
                // Deselect the currently selected option
                handleChange(prevSelected.filter((val) => val !== selectedValue));
                return prevSelected.filter((val) => val !== selectedValue);
              } else {
                // Add the selected option
                handleChange([...prevSelected, selectedValue]);
                return [...prevSelected, selectedValue];
              }
            } else {
              // Single select
              handleChange([selectedValue]);
              return [selectedValue];
            }
          });
        } else {
          setSelected(selectedValue);
          handleChange(selectedValue);
        }
      }
    },
    [handleChange],
  );

  const isOptionSelected = (optionValue: string | string[]) => {
    if (isMultiSelect) {
      return Array.isArray(selected) ? selected.includes(optionValue as string) : false;
    }
    return selected === optionValue;
  };

  return (
    <SelectBox height={height}>
      {options.map((option, index) => (
        <React.Fragment key={index}>
          {(option.value === ITEM_CATEGORIES.headPiece || option.value === ITEM_CATEGORIES.equipped) && <SelectDivider />}
          <StyledSelect
            selected={isOptionSelected(option.value)}
            key={index}
            onClick={() => {
              handleOptionClick(index);
              if (!isMultiSelect) {
                handleChange(option.value);
              }
            }}
          >
            <ButtonText customColor={isOptionSelected(option.value) ? color.black : color.darkGrey}>{option.label}</ButtonText>
            {option.value === ITEM_CATEGORIES.forSale && <Diamond />}
            <Tick />
          </StyledSelect>
        </React.Fragment>
      ))}
    </SelectBox>
  );
};
