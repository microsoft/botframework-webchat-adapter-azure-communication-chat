import React from 'react';
import { commonButtonStyle } from './styles/AdaptiveCard.styles';

const PaginationMessagesButton = (): any => {
  const paginationClick = (): any => {
    window.dispatchEvent(new Event('acs-adapter-loadnextpage'));
  };

  return (
    <button name="PaginationMessagesButton" style={commonButtonStyle} onClick={paginationClick}>
      Get More Messages
    </button>
  );
};

export default PaginationMessagesButton;
