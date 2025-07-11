export const calendarReminder = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  speak:
    "<s>Your  meeting about \"Adaptive Card design session\"<break strength='weak'/> is starting at 12:30pm</s><s>Do you want to snooze <break strength='weak'/> or do you want to send a late notification to the attendees?</s>",
  body: [
    {
      type: 'TextBlock',
      text: 'Adaptive Card design session',
      size: 'Large',
      weight: 'Bolder',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: ' Conf Room 112/3377 (10) ',
      isSubtle: true,
      wrap: true
    },
    {
      type: 'TextBlock',
      text: '12:30 - 01:30',
      isSubtle: true,
      spacing: 'None',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Snooze for',
      wrap: true
    },
    {
      type: 'Input.ChoiceSet',
      id: 'snooze',
      value: '5',
      choices: [
        {
          title: '5 minutes',
          value: '5'
        },
        {
          title: '15 minutes',
          value: '15'
        },
        {
          title: '30 minutes',
          value: '30'
        }
      ]
    }
  ],
  actions: [
    {
      type: 'Action.Submit',
      title: 'Snooze',
      data: {
        x: 'snooze'
      }
    },
    {
      type: 'Action.Submit',
      title: "I'll be late",
      data: {
        x: 'late'
      }
    }
  ]
};
