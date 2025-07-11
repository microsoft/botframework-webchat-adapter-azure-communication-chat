export const showCardWizard = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'TextBlock',
      text: 'Please provide the following information:',
      wrap: true
    }
  ],
  actions: [
    {
      type: 'Action.ShowCard',
      title: 'Name',
      card: {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        body: [
          {
            type: 'Container',
            id: 'nameProperties',
            items: [
              {
                type: 'Input.Text',
                label: 'First Name',
                id: 'FirstName',
                errorMessage: "'First Name' is required"
              },
              {
                type: 'Input.Text',
                label: 'Middle Name',
                id: 'MiddleName',
                errorMessage: "'Middle Name' is required"
              },
              {
                type: 'Input.Text',
                label: 'Last Name',
                id: 'LastName',
                errorMessage: "'Last Name' is required"
              }
            ]
          }
        ],
        actions: [
          {
            type: 'Action.ShowCard',
            title: 'Address',
            card: {
              type: 'AdaptiveCard',
              $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
              body: [
                {
                  type: 'Container',
                  id: 'addressProperties',
                  items: [
                    {
                      type: 'Input.Text',
                      label: 'Address line 1',
                      id: 'addressLine1',
                      errorMessage: "'Address line 1 is required"
                    },
                    {
                      type: 'Input.Text',
                      label: 'Address line 2',
                      id: 'addressLine2',
                      errorMessage: "'Address line 2 is required"
                    },
                    {
                      type: 'ColumnSet',
                      columns: [
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'Input.Text',
                              label: 'City',
                              id: 'city',
                              errorMessage: "'City' is required"
                            }
                          ]
                        },
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'Input.Text',
                              label: 'State',
                              id: 'state',
                              errorMessage: "'State' is required"
                            }
                          ]
                        },
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'Input.Text',
                              label: 'Zip Code',
                              id: 'zip',
                              errorMessage: "'Zip Code' is required"
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              actions: [
                {
                  type: 'Action.ShowCard',
                  title: 'Phone/Email',
                  card: {
                    type: 'AdaptiveCard',
                    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                    body: [
                      {
                        type: 'Input.Text',
                        label: 'Mobile number',
                        id: 'mobileNumber',
                        errorMessage: "'Mobile number' is required"
                      },
                      {
                        type: 'Input.Text',
                        label: 'Home number',
                        id: 'homeNumber',
                        errorMessage: "'Home number' is required"
                      },
                      {
                        type: 'Input.Text',
                        label: 'Email address',
                        id: 'emailAddress',
                        errorMessage: "'Email address' is required"
                      }
                    ],
                    actions: [
                      {
                        type: 'Action.Submit',
                        title: 'Submit'
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]
};
