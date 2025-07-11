export const sportingEvent = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  speak: 'The Seattle Seahawks beat the Carolina Panthers 40-7',
  body: [
    {
      type: 'Container',
      items: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'auto',
              items: [
                {
                  type: 'Image',
                  url: 'https://adaptivecards.io/content/cats/3.png',
                  size: 'Medium'
                },
                {
                  type: 'TextBlock',
                  text: 'SHADES',
                  horizontalAlignment: 'Center',
                  weight: 'Bolder',
                  wrap: true
                }
              ]
            },
            {
              type: 'Column',
              width: 'stretch',
              separator: true,
              spacing: 'Medium',
              items: [
                {
                  type: 'TextBlock',
                  text: '{{DATE(2019-08-31T19:30:00Z, SHORT)}}',
                  horizontalAlignment: 'Center',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  text: 'Final',
                  spacing: 'None',
                  horizontalAlignment: 'Center',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  text: '45 - 7',
                  size: 'ExtraLarge',
                  horizontalAlignment: 'Center',
                  wrap: true
                }
              ]
            },
            {
              type: 'Column',
              width: 'auto',
              separator: true,
              spacing: 'Medium',
              items: [
                {
                  type: 'Image',
                  url: 'https://adaptivecards.io/content/cats/2.png',
                  size: 'Medium',
                  horizontalAlignment: 'Center'
                },
                {
                  type: 'TextBlock',
                  text: 'SKINS',
                  horizontalAlignment: 'Center',
                  weight: 'Bolder',
                  wrap: true
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
