export const inputsWithValidation = {
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
      type: 'Input.Text',
      label: 'Name',
      style: 'text',
      id: 'SimpleVal',
      isRequired: true,
      errorMessage: 'Name is required'
    },
    {
      type: 'Input.Text',
      label: 'Homepage',
      style: 'Url',
      id: 'UrlVal'
    },
    {
      type: 'Input.Text',
      label: 'Email',
      style: 'Email',
      id: 'EmailVal'
    },
    {
      type: 'Input.Text',
      label: 'Phone',
      style: 'Tel',
      id: 'TelVal'
    },
    {
      type: 'Input.Text',
      label: 'Comments',
      style: 'text',
      isMultiline: true,
      id: 'MultiLineVal'
    },
    {
      type: 'Input.Number',
      label: 'Quantity',
      min: -5,
      max: 5,
      value: 1,
      id: 'NumVal',
      errorMessage: 'The quantity must be between -5 and 5'
    },
    {
      type: 'Input.Date',
      label: 'Due Date',
      id: 'DateVal',
      value: '2017-09-20'
    },
    {
      type: 'Input.Time',
      label: 'Start time',
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
      type: 'Input.ChoiceSet',
      id: 'CompactSelectVal',
      label: 'What color do you want? (compact)',
      style: 'compact',
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
      type: 'Input.ChoiceSet',
      id: 'SingleSelectVal',
      label: 'What color do you want? (expanded)',
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
      type: 'Input.ChoiceSet',
      id: 'MultiSelectVal',
      label: 'What color do you want? (multiselect)',
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
      label: 'Please accept the terms and conditions:',
      title: 'I accept the terms and conditions (True/False)',
      id: 'AcceptsTerms',
      isRequired: true,
      errorMessage: 'Accepting the terms and conditions is required'
    },
    {
      type: 'Input.Toggle',
      label: 'How do you feel about red cars?',
      title: 'Red cars are better than other cars',
      valueOn: 'RedCars',
      valueOff: 'NotRedCars',
      id: 'ColorPreference'
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
            type: 'Input.Text',
            label: 'enter comment',
            style: 'text',
            id: 'CommentVal'
          }
        ],
        actions: [
          {
            type: 'Action.Submit',
            title: 'OK'
          }
        ]
      }
    }
  ]
};
