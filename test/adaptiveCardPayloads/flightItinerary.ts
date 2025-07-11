export const flightItinerary = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.2',
  type: 'AdaptiveCard',
  speak:
    '<s>Your flight is confirmed for you and 3 other passengers from San Francisco to Amsterdam on Friday, October 10 8:30 AM</s>',
  body: [
    {
      type: 'TextBlock',
      text: 'Passengers',
      weight: 'Bolder',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Sarah Hum',
      separator: true,
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Jeremy Goldberg',
      spacing: 'None',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Evan Litvak',
      spacing: 'None',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: '2 Stops',
      weight: 'Bolder',
      spacing: 'Medium',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: '{{DATE(2017-05-30T19:25:00Z, SHORT)}} {{TIME(2017-05-30T19:25:00Z)}}',
      weight: 'Bolder',
      spacing: 'None',
      wrap: true
    },
    {
      type: 'ColumnSet',
      separator: true,
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'San Francisco',
              isSubtle: true,
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'Amsterdam',
              horizontalAlignment: 'Right',
              isSubtle: true,
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              size: 'ExtraLarge',
              color: 'Accent',
              text: 'SFO',
              spacing: 'None',
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'Image',
              url: 'https://adaptivecards.io/content/airplane.png',
              size: 'Small',
              spacing: 'None'
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              size: 'ExtraLarge',
              color: 'Accent',
              text: 'AMS',
              horizontalAlignment: 'Right',
              spacing: 'None',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'TextBlock',
      text: 'Non-Stop',
      weight: 'Bolder',
      spacing: 'Medium',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: '{{DATE(2017-06-02T20:55:00Z, SHORT)}} {{TIME(2017-06-02T20:55:00Z)}}',
      weight: 'Bolder',
      spacing: 'None',
      wrap: true
    },
    {
      type: 'ColumnSet',
      separator: true,
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'Amsterdam',
              isSubtle: true,
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'San Francisco',
              horizontalAlignment: 'Right',
              isSubtle: true,
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              size: 'ExtraLarge',
              color: 'Accent',
              text: 'AMS',
              spacing: 'None',
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'Image',
              url: 'https://adaptivecards.io/content/airplane.png',
              size: 'Small',
              spacing: 'None'
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              size: 'ExtraLarge',
              color: 'Accent',
              text: 'SFO',
              horizontalAlignment: 'Right',
              spacing: 'None',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'Medium',
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'Total',
              size: 'Medium',
              isSubtle: true,
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              horizontalAlignment: 'Right',
              text: '$4,032.54',
              size: 'Medium',
              weight: 'Bolder',
              wrap: true
            }
          ]
        }
      ]
    }
  ]
};
