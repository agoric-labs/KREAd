import React, { FC } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowBack,
  ArrowUp,
  ButtonContainer,
  DescriptionTitle,
  ErrorContainer,
  ErrorIcon,
  ErrorTitle,
  ImageConatiner,
  InformationContainer,
  KreadContainer,
  KreadDevelopmentContainer,
} from "./styles";
import { ButtonText, PrimaryButton, SecondaryButton } from "../atoms";
import { ErrorImage, text } from "../../assets";
import { routes } from "../../navigation";
import { color } from "../../design";
import { GO_BACK } from "../../constants";
import { AnimatedLogo } from "../logo";
import { DevelopmentMode } from "../../service/test-service/development-mode";

interface ErrorViewProps {
  headingText?: string;
  descriptionText?: string;
  navigationText?: string;
  redirectRoute?: string;
  onButtonClick?: () => void;
}

export const ErrorView: FC<ErrorViewProps> = ({ redirectRoute, headingText, navigationText, onButtonClick, descriptionText }) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (onButtonClick) return onButtonClick();
    navigate(redirectRoute || routes.character);
  };

  return (
    <>
      <KreadContainer>
        <AnimatedLogo iteration={1} />
        <KreadDevelopmentContainer>
          <DevelopmentMode />
        </KreadDevelopmentContainer>
      </KreadContainer>
      <ErrorContainer>
        <InformationContainer>
          <ErrorTitle>{headingText || text.error.pageNotFound}</ErrorTitle>
          <DescriptionTitle>{descriptionText || text.error.sorrySomethingWentWrong}</DescriptionTitle>
          <ButtonContainer>
            <SecondaryButton onClick={() => navigate(GO_BACK)}>
              <ButtonText>{text.error.goBack}</ButtonText>
              <ArrowBack />
            </SecondaryButton>
            <PrimaryButton onClick={handleButtonClick}>
              <ButtonText customColor={color.white}>{text.error.goHome || navigationText}</ButtonText>
              <ArrowUp />
            </PrimaryButton>
          </ButtonContainer>
        </InformationContainer>
      </ErrorContainer>
      <ImageConatiner>
        <ErrorIcon src={ErrorImage} alt={text.character.clothing} />
      </ImageConatiner>
    </>
  );
};
