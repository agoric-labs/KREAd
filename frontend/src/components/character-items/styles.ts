import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { margins, zIndex } from "../../design";
import { disappear, fadeIn, fadeOut } from "../atoms";

interface Animation {
  showItems: boolean;
}

export const LeftItemContainer = styled.div<Animation>`
  position: absolute;
  width: 310px;
  height: 408px;
  left: ${margins.big};
  bottom: ${margins.big};
  z-index: ${zIndex.overCharacter};
  ${(props) =>
    props.showItems === true
      ? css`
          animation: ${disappear}, ${fadeIn};
          animation-duration: 0.6s, 0.8s;
          animation-delay: 0s, 0.6s;
        `
      : css`
          animation: ${fadeOut};
          animation-duration: 0.5s;
        `};
  ${({ showItems }): string => {
    return showItems
      ? `

        `
      : `
        opacity: 0;
        pointer-events: none;
      `;
  }};
`;

export const RightItemContainer = styled.div<Animation>`
  position: absolute;
  width: 310px;
  height: 408px;
  right: 60px;
  bottom: ${margins.big};
  z-index: ${zIndex.overCharacter};
  ${(props) =>
    props.showItems === true
      ? css`
          animation: ${disappear}, ${fadeIn};
          animation-duration: 0.6s, 0.8s;
          animation-delay: 0s, 0.6s;
        `
      : css`
          animation: ${fadeOut};
          animation-duration: 0.5s;
        `};
  ${({ showItems }): string => {
    return showItems
      ? `

        `
      : `
      opacity: 0;
      pointer-events: none;
      `;
  }};
`;

export const RightItems = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: -22px;
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  margin: 24px 0px;
`;

export const Conta = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  margin: 24px 0px;
`;
