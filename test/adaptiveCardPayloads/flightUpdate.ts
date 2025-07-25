export const flightUpdate = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  speak: '<s>Flight KL0605 to San Fransisco has been delayed.</s><s>It will not leave until 10:10 AM.</s>',
  body: [
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'Image',
              size: 'Small',
              url: 'https://adaptivecards.io/content/airplane.png'
            }
          ]
        },
        {
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: 'Flight Status',
              horizontalAlignment: 'Right',
              isSubtle: true,
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'DELAYED',
              horizontalAlignment: 'Right',
              spacing: 'None',
              size: 'Large',
              color: 'Attention',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      separator: true,
      spacing: 'Medium',
      columns: [
        {
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: 'Passengers',
              isSubtle: true,
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Sarah Hum',
              spacing: 'Small',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Jeremy Goldberg',
              spacing: 'Small',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Evan Litvak',
              spacing: 'Small',
              wrap: true
            }
          ]
        },
        {
          type: 'Column',
          width: 'auto',
          items: [
            {
              type: 'TextBlock',
              text: 'Seat',
              horizontalAlignment: 'Right',
              isSubtle: true,
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '14A',
              horizontalAlignment: 'Right',
              spacing: 'Small',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '14B',
              horizontalAlignment: 'Right',
              spacing: 'Small',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '14C',
              horizontalAlignment: 'Right',
              spacing: 'Small',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'Medium',
      separator: true,
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'Flight',
              isSubtle: true,
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'KL605',
              spacing: 'Small',
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
              text: 'Departs',
              isSubtle: true,
              horizontalAlignment: 'Center',
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '{{TIME(2017-03-04T09:20:00-01:00)}}',
              color: 'Attention',
              weight: 'Bolder',
              horizontalAlignment: 'Center',
              spacing: 'Small',
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
              text: 'Arrives',
              isSubtle: true,
              horizontalAlignment: 'Right',
              weight: 'Bolder',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '{{TIME(2017-03-05T08:20:00+04:00)}}',
              color: 'Attention',
              horizontalAlignment: 'Right',
              weight: 'Bolder',
              spacing: 'Small',
              wrap: true
            }
          ]
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'Medium',
      separator: true,
      columns: [
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'Amsterdam Airport',
              isSubtle: true,
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'AMS',
              size: 'ExtraLarge',
              color: 'Accent',
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
              type: 'TextBlock',
              text: ' ',
              wrap: true
            },
            {
              type: 'Image',
              url: 'https://adaptivecards.io/content/airplane.png',
              size: 'Small'
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'TextBlock',
              text: 'San Francisco Airport',
              isSubtle: true,
              horizontalAlignment: 'Right',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'SFO',
              horizontalAlignment: 'Right',
              size: 'ExtraLarge',
              color: 'Accent',
              spacing: 'None',
              wrap: true
            }
          ]
        }
      ]
    }
  ]
};
