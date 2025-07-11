export const foodOrderWithValidation = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'TextBlock',
      text: 'Your registration is almost complete',
      size: 'Medium',
      weight: 'Bolder',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'What type of food do you prefer?',
      wrap: true
    },
    {
      type: 'ImageSet',
      imageSize: 'medium',
      images: [
        {
          type: 'Image',
          url: 'https://contososcubademo.azurewebsites.net/assets/steak.jpg',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://contososcubademo.azurewebsites.net/assets/chicken.jpg',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://contososcubademo.azurewebsites.net/assets/tofu.jpg',
          size: 'Medium'
        }
      ]
    }
  ],
  actions: [
    {
      type: 'Action.ShowCard',
      title: 'Steak',
      card: {
        type: 'AdaptiveCard',
        body: [
          {
            type: 'Input.ChoiceSet',
            id: 'SteakTemp',
            style: 'expanded',
            label: 'How would you like your steak prepared?',
            isRequired: true,
            errorMessage: 'Please select one of the above options',
            choices: [
              {
                title: 'Rare',
                value: 'rare'
              },
              {
                title: 'Medium-Rare',
                value: 'medium-rare'
              },
              {
                title: 'Well-done',
                value: 'well-done'
              }
            ]
          },
          {
            type: 'Input.Text',
            id: 'SteakOther',
            isMultiline: true,
            label: 'Any other preparation requests?'
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'OK',
            data: {
              FoodChoice: 'Steak'
            }
          }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
      }
    },
    {
      type: 'Action.ShowCard',
      title: 'Chicken',
      card: {
        type: 'AdaptiveCard',
        body: [
          {
            type: 'Input.Toggle',
            id: 'ChickenAllergy',
            valueOn: 'noPeanuts',
            valueOff: 'peanuts',
            title: "I'm allergic to peanuts",
            label: 'Do you have any allergies?'
          },
          {
            type: 'Input.Text',
            id: 'ChickenOther',
            isMultiline: true,
            label: 'Any other preparation requests?'
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'OK',
            data: {
              FoodChoice: 'Chicken'
            }
          }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
      }
    },
    {
      type: 'Action.ShowCard',
      title: 'Tofu',
      card: {
        type: 'AdaptiveCard',
        body: [
          {
            type: 'Input.Toggle',
            id: 'Vegetarian',
            title: 'Please prepare it vegan',
            label: 'Would you like it prepared vegan?',
            valueOn: 'vegan',
            valueOff: 'notVegan'
          },
          {
            type: 'Input.Text',
            id: 'VegOther',
            isMultiline: true,
            label: 'Any other preparation requests?'
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'OK',
            data: {
              FoodChoice: 'Vegetarian'
            }
          }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
      }
    }
  ]
};
