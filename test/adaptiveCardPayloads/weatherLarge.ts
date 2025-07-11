export const weatherLarge = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  speak:
    '<s>Weather forecast for Tuesday is high of 50 and low of 32 degrees with a 31% chance of rain</s><s>Winds will be 4 mph from the SSE</s>',
  backgroundImage: {
    url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Background.jpg'
  },
  body: [
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 35,
          items: [
            {
              type: 'Image',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Square.png',
              size: 'Stretch'
            }
          ]
        },
        {
          type: 'Column',
          width: 65,
          items: [
            {
              type: 'TextBlock',
              text: '{{DATE(2019-11-05T07:00:51-08:00, SHORT)}}',
              weight: 'Bolder',
              size: 'Large',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '32 / 50',
              size: 'Medium',
              spacing: 'None',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '31% chance of rain',
              spacing: 'None',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Winds 4.4 mph SSE',
              spacing: 'None',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 20,
          items: [
            {
              type: 'TextBlock',
              horizontalAlignment: 'Center',
              text: 'Wednesday',
              wrap: true
            },
            {
              type: 'Image',
              size: 'auto',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Drizzle-Square.png'
            },
            {
              type: 'FactSet',
              horizontalAlignment: 'Right',
              facts: [
                {
                  title: 'High',
                  value: '50'
                },
                {
                  title: 'Low',
                  value: '32'
                }
              ]
            }
          ],
          selectAction: {
            type: 'Action.OpenUrl',
            title: 'View Wednesday',
            url: 'https://www.microsoft.com'
          }
        },
        {
          type: 'Column',
          width: 20,
          items: [
            {
              type: 'TextBlock',
              horizontalAlignment: 'Center',
              text: 'Thursday',
              wrap: true
            },
            {
              type: 'Image',
              size: 'auto',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Square.png'
            },
            {
              type: 'FactSet',
              horizontalAlignment: 'Right',
              facts: [
                {
                  title: 'High',
                  value: '50'
                },
                {
                  title: 'Low',
                  value: '32'
                }
              ]
            }
          ],
          selectAction: {
            type: 'Action.OpenUrl',
            title: 'View Thursday',
            url: 'https://www.microsoft.com'
          }
        },
        {
          type: 'Column',
          width: 20,
          items: [
            {
              type: 'TextBlock',
              horizontalAlignment: 'Center',
              text: 'Friday',
              wrap: true
            },
            {
              type: 'Image',
              size: 'auto',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Square.png'
            },
            {
              type: 'FactSet',
              horizontalAlignment: 'Right',
              facts: [
                {
                  title: 'High',
                  value: '59'
                },
                {
                  title: 'Low',
                  value: '32'
                }
              ]
            }
          ],
          selectAction: {
            type: 'Action.OpenUrl',
            title: 'View Friday',
            url: 'https://www.microsoft.com'
          }
        },
        {
          type: 'Column',
          width: 20,
          items: [
            {
              type: 'TextBlock',
              horizontalAlignment: 'Center',
              text: 'Saturday',
              wrap: true
            },
            {
              type: 'Image',
              size: 'auto',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Mostly%20Cloudy-Square.png'
            },
            {
              type: 'FactSet',
              horizontalAlignment: 'Right',
              facts: [
                {
                  title: 'High',
                  value: '50'
                },
                {
                  title: 'Low',
                  value: '32'
                }
              ]
            }
          ],
          selectAction: {
            type: 'Action.OpenUrl',
            title: 'View Saturday',
            url: 'https://www.microsoft.com'
          }
        }
      ]
    }
  ]
};
