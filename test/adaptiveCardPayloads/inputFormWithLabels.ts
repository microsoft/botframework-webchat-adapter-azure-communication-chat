export const inputFormWithLabels = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 2,
          items: [
            {
              type: 'TextBlock',
              text: 'Tell us about yourself',
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: 'We just need a few more details to get you booked for the trip of a lifetime!',
              isSubtle: true,
              wrap: true
            },
            {
              type: 'TextBlock',
              text: "Don't worry, we'll never share or sell your information.",
              isSubtle: true,
              wrap: true,
              size: 'Small'
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'Input.Text',
                  label: 'Your name (Last, First)',
                  id: 'myName',
                  regex: '^[A-Z][a-z]+, [A-Z][a-z]+$',
                  errorMessage: 'Please enter your name in the specified format',
                  isRequired: true
                }
              ]
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'Input.Text',
                  label: 'Your email',
                  id: 'myEmail',
                  regex: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z0-9-]{2,4}$',
                  errorMessage: 'Please enter a valid email address',
                  isRequired: true
                }
              ]
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'Input.Text',
                  label: 'Phone Number (xxx-xxx-xxxx)',
                  id: 'myTel',
                  regex: '^[0-9]{3}-[0-9]{3}-[0-9]{4}$',
                  errorMessage:
                    'Invalid phone number. Use the specified format: 3 numbers, hyphen, 3 numbers, hyphen and 4 numbers',
                  isRequired: true
                }
              ]
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'Image',
              url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Diver_Silhouette%2C_Great_Barrier_Reef.jpg',
              size: 'auto'
            }
          ]
        }
      ]
    }
  ],
  actions: [
    {
      type: 'Action.Submit',
      title: 'Submit'
    }
  ]
};
