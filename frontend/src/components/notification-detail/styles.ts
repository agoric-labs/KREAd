import styled from "@emotion/styled";
import { CloseIcon, ExclamationIcon, TickIcon } from "../../assets";
import { color, margins } from "../../design";
import { HeaderHorizontalDivider, NavigationTitle } from "../atoms";

export const ToastContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  padding: ${margins.medium} ${margins.medium} ${margins.medium} 32px;
  gap: ${margins.medium};
  background: ${color.lightGrey};
  border: 1px solid ${color.grey};
  border-radius: ${margins.small};
  bottom: ${margins.big};
  z-index: 10000;
  width: 720px;
  position: absolute;
  left: 40px;
  height: fit-content;
`;

export const Tick = styled(TickIcon)`
  margin: 0px;
  width: 9px;
  height: 6px;
`;

export const Exclamation = styled(ExclamationIcon)`
  width: 2px;
  height: 8px;
  margin: 0px;
`;

export const IconContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${margins.nano};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  border: 1px solid ${color.black};
  min-width: 18px;
`;

export const ToastTitle = styled(NavigationTitle)``;

export const Divider = styled(HeaderHorizontalDivider)`
  transform: rotate(90deg);
  width: ${margins.big};
`;

export const ArrowContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  box-sizing: border-box;
  border-radius: ${margins.medium};
  margin-left: 46px;
  margin-right: 14px;
`;

export const Close = styled(CloseIcon)`
  width: ${margins.small};
  height: ${margins.small};
  cursor: pointer;
`;
export const ReturnContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0px;
`;

export const InfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 4px;
`;

export const DividerContainer = styled.div``;

interface NotificationProps {
  showNotification: boolean;
}

export const NotificationWrapper = styled.div<NotificationProps>`
  ${ToastContainer} {
    position: absolute;
    margin-left: auto;
    margin-right: auto;
    left: 0;
    right: 0;
    z-index: 1002;
    bottom: 40px;
  }
  ${({ showNotification }): string => {
    return showNotification
      ? ""
      : `
        display: none;
      `;
  }};
`;
