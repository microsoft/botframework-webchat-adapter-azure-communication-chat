export const inputForm = {
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
              size: 'Medium',
              wrap: true
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
                  type: 'TextBlock',
                  text: 'Your Name',
                  wrap: true
                },
                {
                  type: 'Input.Text',
                  id: 'myName',
                  placeholder: 'Last, First'
                }
              ]
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Your email',
                  wrap: true
                },
                {
                  type: 'Input.Text',
                  id: 'myEmail',
                  placeholder: 'youremail@example.com'
                }
              ]
            },
            {
              type: 'Container',
              items: [
                {
                  type: 'TextBlock',
                  text: 'Phone Number',
                  wrap: true
                },
                {
                  type: 'Input.Text',
                  id: 'myTel',
                  placeholder: 'xxx.xxx.xxxx'
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
