export const imageGallery = {
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  type: 'AdaptiveCard',
  version: '1.2',
  body: [
    {
      type: 'TextBlock',
      text: 'Here are some cool photos',
      size: 'Large',
      wrap: true
    },
    {
      type: 'TextBlock',
      text: 'Sorry some of them are repeats',
      size: 'Medium',
      weight: 'Lighter',
      wrap: true
    },
    {
      type: 'ImageSet',
      imageSize: 'medium',
      images: [
        {
          type: 'Image',
          url: 'https://4.bp.blogspot.com/-XkviAtJ1s6Q/T3YFb2RUhDI/AAAAAAAAAVQ/EHomLZlFMKo/s1600/small+cat.jpg',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://images4.fanpop.com/image/photos/18500000/Kitten-cats-18565791-1024-768.jpg',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://tse3.mm.bing.net/th?q=Grumpy+Cat&pid=Api&mkt=en-US&adlt=moderate&t=1',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://tse2.mm.bing.net/th?q=Funny+Cats&pid=Api&mkt=en-US&adlt=moderate&t=1',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://tse3.mm.bing.net/th?q=Felidae&pid=Api&mkt=en-US&adlt=moderate&t=1',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://tse3.mm.bing.net/th?q=African+Wildcat&pid=Api&mkt=en-US&adlt=moderate&t=1',
          size: 'Medium'
        },
        {
          type: 'Image',
          url: 'https://tse1.mm.bing.net/th?id=OIP.M38d3aa9aa6cc8c444492212efdb3a91dH0&pid=Api',
          size: 'Medium'
        }
      ]
    }
  ]
};
