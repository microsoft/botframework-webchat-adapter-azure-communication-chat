export const agenda = {
  type: 'AdaptiveCard',
  body: [
    {
      type: 'ColumnSet',
      horizontalAlignment: 'Center',
      columns: [
        {
          type: 'Column',
          items: [
            {
              type: 'ColumnSet',
              horizontalAlignment: 'Center',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/LocationGreen_A.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '**Redmond**',
                      wrap: true
                    },
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: '8a - 12:30p',
                      wrap: true
                    }
                  ],
                  width: 'auto'
                }
              ]
            }
          ],
          width: 1
        },
        {
          type: 'Column',
          spacing: 'Large',
          separator: true,
          items: [
            {
              type: 'ColumnSet',
              horizontalAlignment: 'Center',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/LocationBlue_B.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '**Bellevue**',
                      wrap: true
                    },
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: '12:30p - 3p',
                      wrap: true
                    }
                  ],
                  width: 'auto'
                }
              ]
            }
          ],
          width: 1
        },
        {
          type: 'Column',
          spacing: 'Large',
          separator: true,
          items: [
            {
              type: 'ColumnSet',
              horizontalAlignment: 'Center',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/LocationRed_C.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '**Seattle**',
                      wrap: true
                    },
                    {
                      type: 'TextBlock',
                      spacing: 'None',
                      text: '8p',
                      wrap: true
                    }
                  ],
                  width: 'auto'
                }
              ]
            }
          ],
          width: 1
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
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/Conflict.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  spacing: 'None',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '2:00 PM',
                      wrap: true
                    }
                  ],
                  width: 'stretch'
                }
              ]
            },
            {
              type: 'TextBlock',
              spacing: 'None',
              text: '1hr',
              isSubtle: true,
              wrap: true
            }
          ],
          width: '110px'
        },
        {
          type: 'Column',
          backgroundImage: {
            url: 'https://messagecardplayground.azurewebsites.net/assets/SmallVerticalLineGray.png',
            fillMode: 'RepeatVertically',
            horizontalAlignment: 'Center'
          },
          items: [
            {
              type: 'Image',
              horizontalAlignment: 'Center',
              url: 'https://messagecardplayground.azurewebsites.net/assets/CircleGreen_coffee.png'
            }
          ],
          width: 'auto',
          spacing: 'None'
        },
        {
          type: 'Column',
          items: [
            {
              type: 'TextBlock',
              text: '**Contoso Campaign Status Meeting**',
              wrap: true
            },
            {
              type: 'ColumnSet',
              spacing: 'None',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/location_gray.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: 'Conf Room Bravern-2/9050',
                      wrap: true
                    }
                  ],
                  width: 'stretch'
                }
              ]
            },
            {
              type: 'ImageSet',
              spacing: 'Small',
              imageSize: 'Small',
              images: [
                {
                  type: 'Image',
                  url: 'https://messagecardplayground.azurewebsites.net/assets/person_w1.png',
                  size: 'Small'
                },
                {
                  type: 'Image',
                  url: 'https://messagecardplayground.azurewebsites.net/assets/person_m1.png',
                  size: 'Small'
                },
                {
                  type: 'Image',
                  url: 'https://messagecardplayground.azurewebsites.net/assets/person_w2.png',
                  size: 'Small'
                }
              ]
            },
            {
              type: 'ColumnSet',
              spacing: 'Small',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/power_point.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '**Contoso Brand Guidelines** shared by **Susan Metters**',
                      wrap: true
                    }
                  ],
                  width: 'stretch'
                }
              ]
            }
          ],
          width: 40
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          width: '110px'
        },
        {
          type: 'Column',
          backgroundImage: {
            url: 'https://messagecardplayground.azurewebsites.net/assets/SmallVerticalLineGray.png',
            fillMode: 'RepeatVertically',
            horizontalAlignment: 'Center'
          },
          items: [
            {
              type: 'Image',
              horizontalAlignment: 'Center',
              url: 'https://messagecardplayground.azurewebsites.net/assets/Gray_Dot.png'
            }
          ],
          width: 'auto',
          spacing: 'None'
        },
        {
          type: 'Column',
          items: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/car.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: 'about 45 minutes',
                      isSubtle: true,
                      wrap: true
                    }
                  ],
                  width: 'stretch'
                }
              ]
            }
          ],
          width: 40
        }
      ]
    },
    {
      type: 'ColumnSet',
      spacing: 'None',
      columns: [
        {
          type: 'Column',
          items: [
            {
              type: 'TextBlock',
              spacing: 'None',
              text: '8:00 PM',
              wrap: true
            },
            {
              type: 'TextBlock',
              spacing: 'None',
              text: '1hr',
              isSubtle: true,
              wrap: true
            }
          ],
          width: '110px'
        },
        {
          type: 'Column',
          backgroundImage: {
            url: 'https://messagecardplayground.azurewebsites.net/assets/SmallVerticalLineGray.png',
            fillMode: 'RepeatVertically',
            horizontalAlignment: 'Center'
          },
          items: [
            {
              type: 'Image',
              horizontalAlignment: 'Center',
              url: 'https://messagecardplayground.azurewebsites.net/assets/CircleBlue_flight.png'
            }
          ],
          width: 'auto',
          spacing: 'None'
        },
        {
          type: 'Column',
          items: [
            {
              type: 'TextBlock',
              text: '**Alaska Airlines AS1021 flight to Chicago**',
              wrap: true
            },
            {
              type: 'ColumnSet',
              spacing: 'None',
              columns: [
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'Image',
                      url: 'https://messagecardplayground.azurewebsites.net/assets/location_gray.png'
                    }
                  ],
                  width: 'auto'
                },
                {
                  type: 'Column',
                  items: [
                    {
                      type: 'TextBlock',
                      text: 'Seattle Tacoma International Airport (17801 International Blvd, Seattle, WA, United States)',
                      wrap: true
                    }
                  ],
                  width: 'stretch'
                }
              ]
            },
            {
              type: 'Image',
              url: 'https://messagecardplayground.azurewebsites.net/assets/SeaTacMap.png',
              size: 'Stretch'
            }
          ],
          width: 40
        }
      ]
    }
  ],
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.2'
};
