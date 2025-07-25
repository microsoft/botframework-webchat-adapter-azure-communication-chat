export const inputs = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'TextBlock',
      size: 'Medium',
      weight: 'Bolder',
      text: ' Input.Text elements',
      horizontalAlignment: 'Center',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Name',
      wrap: true
    },
    {
      type: 'Input.Text',
      style: 'text',
      id: 'SimpleVal'
    },
    {
      type: 'TextBlock',
      text: 'Homepage',
      wrap: true
    },
    {
      type: 'Input.Text',
      style: 'Url',
      id: 'UrlVal'
    },
    {
      type: 'TextBlock',
      text: 'Email',
      wrap: true
    },
    {
      type: 'Input.Text',
      style: 'Email',
      id: 'EmailVal'
    },
    {
      type: 'TextBlock',
      text: 'Phone',
      wrap: true
    },
    {
      type: 'Input.Text',
      style: 'Tel',
      id: 'TelVal'
    },
    {
      type: 'TextBlock',
      text: 'Comments',
      wrap: true
    },
    {
      type: 'Input.Text',
      style: 'text',
      isMultiline: true,
      id: 'MultiLineVal'
    },
    {
      type: 'TextBlock',
      text: 'Quantity',
      wrap: true
    },
    {
      type: 'Input.Number',
      min: -5,
      max: 5,
      value: 1,
      id: 'NumVal'
    },
    {
      type: 'TextBlock',
      text: 'Due Date',
      wrap: true
    },
    {
      type: 'Input.Date',
      id: 'DateVal',
      value: '2017-09-20'
    },
    {
      type: 'TextBlock',
      text: 'Start time',
      wrap: true
    },
    {
      type: 'Input.Time',
      id: 'TimeVal',
      value: '16:59'
    },
    {
      type: 'TextBlock',
      size: 'Medium',
      weight: 'Bolder',
      text: 'Input ChoiceSet ',
      horizontalAlignment: 'Center',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'What color do you want? (compact)',
      wrap: true
    },
    {
      type: 'Input.ChoiceSet',
      id: 'CompactSelectVal',
      value: '1',
      choices: [
        {
          title: 'Red',
          value: '1'
        },
        {
          title: 'Green',
          value: '2'
        },
        {
          title: 'Blue',
          value: '3'
        }
      ]
    },
    {
      type: 'TextBlock',
      text: 'What color do you want? (expanded)',
      wrap: true
    },
    {
      type: 'Input.ChoiceSet',
      id: 'SingleSelectVal',
      style: 'expanded',
      value: '1',
      choices: [
        {
          title: 'Red',
          value: '1'
        },
        {
          title: 'Green',
          value: '2'
        },
        {
          title: 'Blue',
          value: '3'
        }
      ]
    },
    {
      type: 'TextBlock',
      text: 'What color do you want? (multiselect)',
      wrap: true
    },
    {
      type: 'Input.ChoiceSet',
      id: 'MultiSelectVal',
      isMultiSelect: true,
      value: '1,3',
      choices: [
        {
          title: 'Red',
          value: '1'
        },
        {
          title: 'Green',
          value: '2'
        },
        {
          title: 'Blue',
          value: '3'
        }
      ]
    },
    {
      type: 'TextBlock',
      size: 'Medium',
      weight: 'Bolder',
      text: 'Input.Toggle',
      horizontalAlignment: 'Center',
      wrap: true
    },
    {
      type: 'Input.Toggle',
      title: 'I accept the terms and conditions (True/False)',
      id: 'AcceptsTerms',
      value: 'false'
    },
    {
      type: 'Input.Toggle',
      title: 'Red cars are better than other cars',
      valueOn: 'RedCars',
      valueOff: 'NotRedCars',
      id: 'ColorPreference',
      value: 'NotRedCars'
    }
  ],
  actions: [
    {
      type: 'Action.Submit',
      title: 'Submit',
      data: {
        id: '1234567890'
      }
    },
    {
      type: 'Action.ShowCard',
      title: 'Show Card',
      card: {
        type: 'AdaptiveCard',
        body: [
          {
            type: 'TextBlock',
            text: 'Enter comment',
            wrap: true
          },
          {
            type: 'Input.Text',
            style: 'text',
            id: 'CommentVal'
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'OK'
          }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
      }
    }
  ]
};
