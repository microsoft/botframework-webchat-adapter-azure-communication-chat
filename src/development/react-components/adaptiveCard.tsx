import React, { useState } from 'react';
import { commonButtonStyle, commonStyle, marginLeft } from './styles/AdaptiveCard.styles';

type Props = {
  store: any;
};

const AdaptiveCard = (props: Props): any => {
  const [text, setText] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [videoPoster, setVideoPoster] = useState('');
  const [videoURL, setVideoURL] = useState('');
  const [buttonTitle, setButtonTitle] = useState('');
  const [buttonURL, setButtonURL] = useState('');

  const SendAdaptiveCard = (): any => {
    const body: any = [];
    const actions: any = [];
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.1',
            body: body,
            actions: actions
          }
        }
      ]
    };
    let hasAdaptiveCard = false;

    if (text) {
      hasAdaptiveCard = true;
      card.attachments[0].content.body.push({
        type: 'TextBlock',
        text: text
      });
    }

    if (imageURL) {
      hasAdaptiveCard = true;
      card.attachments[0].content.body.push({
        type: 'Image',
        url: imageURL
      });
    }

    if (videoPoster && videoURL) {
      hasAdaptiveCard = true;
      card.attachments[0].content.body.push({
        type: 'Media',
        poster: videoPoster,
        sources: [
          {
            mimeType: 'video/mp4',
            url: videoURL
          }
        ]
      });
    }
    if (buttonTitle && buttonURL) {
      hasAdaptiveCard = true;
      card.attachments[0].content.actions.push({
        type: 'Action.OpenUrl',
        title: buttonTitle,
        url: buttonURL
      });
    }

    if (!hasAdaptiveCard) {
      card.attachments = [];
    }

    props.store.dispatch({
      type: 'DIRECT_LINE/POST_ACTIVITY',
      meta: { method: 'customizedButton' },
      payload: {
        activity: {
          type: 'message',
          adaptiveCards: card.attachments
        }
      }
    });
  };

  return (
    <div
      style={{
        margin: '5px',
        display: 'inline',
        justifyContent: 'left',
        alignItems: 'left'
      }}
    >
      <h2 style={{ color: 'blue', marginLeft: '10px' }}>Adaptive Cards Sample</h2>
      <InputElement name="Text" label="Text" value={text} setValue={setText} />
      <InputElement name="ImageURL" label="Image Url" value={imageURL} setValue={setImageURL} />
      <InputElement name="VideoPoster" label="Video Poster" value={videoPoster} setValue={setVideoPoster} />
      <InputElement name="VideoURL" label="Video URL" value={videoURL} setValue={setVideoURL} />
      <InputElement name="ButtonTitle" label="Button Title" value={buttonTitle} setValue={setButtonTitle} />
      <InputElement name="ButtonURL" label="Button URL" value={buttonURL} setValue={setButtonURL} />
      <button name="SendButton" style={commonButtonStyle} onClick={SendAdaptiveCard}>
        Send Adaptiver Card
      </button>
    </div>
  );
};

const InputElement = (props: any): any => {
  return (
    <div
      style={{
        margin: '5px',
        display: 'flex',
        justifyContent: 'left',
        alignItems: 'left'
      }}
    >
      <label style={commonStyle}>{props.label}</label>
      <input
        style={marginLeft}
        name={props.name}
        value={props.value}
        onChange={(event) => props.setValue(event.target.value)}
      />
    </div>
  );
};

export default AdaptiveCard;
