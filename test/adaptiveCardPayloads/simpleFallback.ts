export const simpleFallback = {
  type: 'AdaptiveCard',
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.2',
  body: [
    {
      type: 'TextBlock',
      text: 'Fallback test:',
      wrap: true
    }
  ]
};
