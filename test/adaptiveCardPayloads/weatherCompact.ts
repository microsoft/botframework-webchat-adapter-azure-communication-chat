export const weatherCompact = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  speak: '<s>The forecast for Seattle November 4 is mostly clear with a High of 50 degrees and Low of 41 degrees</s>',
  body: [
    {
      type: 'TextBlock',
      text: 'Redmond, WA',
      size: 'Large',
      isSubtle: true,
      wrap: true
    },
    {
      type: 'TextBlock',
      text: '{{DATE(2019-11-04T18:21:18-08:00, SHORT)}} {{TIME(2019-11-04T18:21:18-08:00)}}',
      spacing: 'None',
      wrap: true
    },
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'Image',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Square.png',
              size: 'Small'
            }
          ]
        },
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'TextBlock',
              text: '46',
              size: 'ExtraLarge',
              spacing: 'None',
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: '°F',
              weight: 'Bolder',
              spacing: 'Small',
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: 'Hi 50',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Lo 41',
              spacing: 'None',
              wrap: true
            }
          ]
        }
      ]
    }
  ]
};
