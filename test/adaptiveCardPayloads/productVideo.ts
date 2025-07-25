export const productVideo = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  fallbackText:
    'This card requires Media to be viewed. Ask your platform to update to Adaptive Cards v1.1 for this and more!',
  body: [
    {
      type: 'Media',
      poster: 'https://adaptivecards.io/content/poster-video.png',
      sources: [
        {
          mimeType: 'video/mp4',
          url: 'https://adaptivecardsblob.blob.core.windows.net/assets/AdaptiveCardsOverviewVideo.mp4'
        }
      ]
    }
  ],
  actions: [
    {
      type: 'Action.OpenUrl',
      title: 'Learn more',
      url: 'https://adaptivecards.io'
    }
  ]
};
