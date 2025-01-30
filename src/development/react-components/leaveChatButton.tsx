import React from 'react';
import { commonButtonStyle } from './styles/AdaptiveCard.styles';

const LeaveChatButton = (): any => {
  const leaveChatClick = (): any => {
    window.dispatchEvent(new Event('acs-adapter-leavechat'));
  };

  return (
    <button name="leaveChatButton" style={commonButtonStyle} onClick={leaveChatClick}>
      Leave Chat
    </button>
  );
};

export default LeaveChatButton;
