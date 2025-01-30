import ReactDOM from 'react-dom';
import React from 'react';
import AdaptiveCard from './AdaptiveCard';
import LeaveChatButton from './leaveChatButton';
import PaginationMessagesButton from './paginationMessagesButton';

const DebugPanel = (props: any): any => {
  return (
    <div>
      <AdaptiveCard store={props.store} />
      <LeaveChatButton />
      <PaginationMessagesButton />
    </div>
  );
};

export const renderDebugPanel = (htmlElement: HTMLElement, store: unknown): any => {
  window.addEventListener('keydown', function (zEvent) {
    if (zEvent.ctrlKey && zEvent.key === 'd') {
      if (!htmlElement.style.display || htmlElement.style.display === 'none') {
        htmlElement.style.display = 'block';
      } else {
        htmlElement.style.display = 'none';
      }
    }
  });

  ReactDOM.render(
    <React.StrictMode>
      <DebugPanel store={store} />
    </React.StrictMode>,
    htmlElement
  );
};
