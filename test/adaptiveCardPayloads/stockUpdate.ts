export const stockUpdate = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'Container',
      items: [
        {
          type: 'TextBlock',
          text: 'Microsoft Corporation',
          size: 'Medium',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: 'Nasdaq Global Select: MSFT',
          isSubtle: true,
          spacing: 'None',
          wrap: true
        },
        {
          type: 'TextBlock',
          text: '{{DATE(2019-05-03T13:00:00-07:00, SHORT)}} {{TIME(2019-05-03T13:00:00-07:00)}}',
          wrap: true
        }
      ]
    },
    {
      type: 'Container',
      spacing: 'None',
      items: [
        {
          type: 'ColumnSet',
          columns: [
            {
              type: 'Column',
              width: 'stretch',
              items: [
                {
                  type: 'TextBlock',
                  text: '128.90 ',
                  size: 'ExtraLarge',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  text: '▲ 2.69 USD (2.13%)',
                  color: 'Good',
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
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'Open',
                      value: '127.42 '
                    },
                    {
                      title: 'High',
                      value: '129.43 '
                    },
                    {
                      title: 'Low',
                      value: '127.25 '
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
