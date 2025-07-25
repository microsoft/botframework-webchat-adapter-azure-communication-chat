export const flightDetails = {
  type: 'AdaptiveCard',
  body: [
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          items: [
            {
              type: 'Container',
              backgroundImage: {
                url: 'https://messagecardplayground.azurewebsites.net/assets/TxP_Background.png'
              },
              items: [
                {
                  type: 'Image',
                  horizontalAlignment: 'Center',
                  url: 'https://messagecardplayground.azurewebsites.net/assets/TxP_Flight.png',
                  altText: 'Departing airplane'
                }
              ],
              bleed: true
            },
            {
              type: 'Container',
              spacing: 'None',
              style: 'emphasis',
              items: [
                {
                  type: 'TextBlock',
                  size: 'ExtraLarge',
                  weight: 'Lighter',
                  color: 'Accent',
                  text: 'Flight to JFK',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  spacing: 'Small',
                  text: 'Continental  Air Lines flight UA110 ',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  spacing: 'None',
                  text: 'Confirmation code: RXJ34P',
                  wrap: true
                },
                {
                  type: 'TextBlock',
                  spacing: 'None',
                  text: '4 hours 15 minutes',
                  wrap: true
                }
              ],
              bleed: true,
              height: 'stretch'
            }
          ],
          width: 45,
          height: 'stretch'
        },
        {
          type: 'Column',
          items: [
            {
              type: 'Container',
              height: 'stretch',
              items: [
                {
                  type: 'ColumnSet',
                  columns: [
                    {
                      type: 'Column',
                      items: [
                        {
                          type: 'TextBlock',
                          size: 'ExtraLarge',
                          weight: 'Lighter',
                          text: 'SFO',
                          wrap: true
                        }
                      ],
                      width: 'auto'
                    },
                    {
                      type: 'Column',
                      verticalContentAlignment: 'Center',
                      items: [
                        {
                          type: 'Image',
                          url: 'https://messagecardplayground.azurewebsites.net/assets/graydot2x2.png',
                          width: '10000px',
                          height: '2px'
                        }
                      ],
                      width: 'stretch'
                    },
                    {
                      type: 'Column',
                      spacing: 'Small',
                      verticalContentAlignment: 'Center',
                      items: [
                        {
                          type: 'Image',
                          url: 'https://messagecardplayground.azurewebsites.net/assets/smallairplane.png',
                          height: '16px'
                        }
                      ],
                      width: 'auto'
                    },
                    {
                      type: 'Column',
                      items: [
                        {
                          type: 'TextBlock',
                          horizontalAlignment: 'Right',
                          size: 'ExtraLarge',
                          weight: 'Lighter',
                          text: 'JFK',
                          wrap: true
                        }
                      ],
                      width: 'auto'
                    }
                  ]
                },
                {
                  type: 'ColumnSet',
                  columns: [
                    {
                      type: 'Column',
                      items: [
                        {
                          type: 'RichTextBlock',
                          inlines: [
                            {
                              type: 'TextRun',
                              size: 'Medium',
                              text: '{{TIME(2017-03-04T20:15:00-08:00)}}\n',
                              wrap: true
                            },
                            {
                              type: 'TextRun',
                              text: '{{DATE(2017-03-04T20:15:00-08:00, SHORT)}}\n',
                              isSubtle: true,
                              wrap: true
                            },
                            {
                              type: 'TextRun',
                              text: 'San Francisco',
                              isSubtle: true,
                              wrap: true
                            }
                          ]
                        }
                      ],
                      width: 1
                    },
                    {
                      type: 'Column',
                      items: [
                        {
                          type: 'RichTextBlock',
                          horizontalAlignment: 'Right',
                          inlines: [
                            {
                              type: 'TextRun',
                              size: 'Medium',
                              text: '{{TIME(2017-03-05T06:30:00-05:00)}}\n',
                              wrap: true
                            },
                            {
                              type: 'TextRun',
                              text: '{{DATE(2017-03-05T06:30:00-05:00, SHORT)}}\n',
                              isSubtle: true,
                              wrap: true
                            },
                            {
                              type: 'TextRun',
                              text: 'New York',
                              isSubtle: true,
                              wrap: true
                            }
                          ]
                        }
                      ],
                      width: 1
                    }
                  ]
                },
                {
                  type: 'ActionSet',
                  separator: true,
                  actions: [
                    {
                      type: 'Action.Submit',
                      title: 'Check in',
                      style: 'positive'
                    },
                    {
                      type: 'Action.Submit',
                      title: 'View'
                    }
                  ],
                  spacing: 'Medium'
                }
              ]
            }
          ],
          width: 55
        }
      ],
      height: 'stretch'
    }
  ],
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.2'
};
