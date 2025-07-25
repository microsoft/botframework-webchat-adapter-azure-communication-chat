export const restaurant = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      speak: "Tom's Pie is a Pizza restaurant which is rated 9.3 by customers.",
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column',
          width: 2,
          items: [
            {
              type: 'TextBlock',
              text: 'Redmond, WA',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: 'Malt & Vine',
              weight: 'Bolder',
              size: 'ExtraLarge',
              spacing: 'None',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '4.5 stars (176 reviews) · mid-priced',
              isSubtle: true,
              spacing: 'None',
              wrap: true
            },
            {
              type: 'TextBlock',
              text: '**Blaire S.** said "Great concept and a wide selection of beers both on tap and bottled! Smaller wine selection than I wanted, but the variety of beers certainly made up for that. Although I didn\'t order anything, my boyfriend got a beer and he loved it. Their prices are fair too. \n\nThe concept is really awesome. It\'s a bar/store that you can bring outside food into. The place was pretty packed tonight. I wish we had stayed for more than one drink. I would have loved to sample everything!"',
              size: 'Small',
              wrap: true,
              maxLines: 3
            }
          ]
        },
        {
          type: 'Column',
          width: 1,
          items: [
            {
              type: 'Image',
              url: 'https://s3-media1.fl.yelpcdn.com/bphoto/HD_NsxwaCTwKRxvOZs2Shw/ls.jpg',
              altText: 'image of beer growlers on a table',
              size: 'auto'
            }
          ]
        }
      ]
    }
  ],
  actions: [
    {
      type: 'Action.OpenUrl',
      title: 'More Info',
      url: 'https://www.yelp.com/biz/malt-and-vine-redmond'
    }
  ]
};
