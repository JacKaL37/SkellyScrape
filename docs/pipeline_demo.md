# PHASE 1: Link Selection

## 🧠USER INPUT
Base URL to fetch links from: 
`https://www.restaurantbusinessonline.com/top-500-2025-ranking`

## 🧠USER INPUT:
Link pre-selection guidance: 
`"Select the links most likely to contain data about specific individual restaurants in the top 500."`

## 💻SYSTEM ACTION
System fetches the page's HTML bones, extracts all the links. 

## 🔮AI ACTION
Generate recommendations for which links to unearth from the page, where `high_confidence` links align super closely to the guidance and are preselected, while `mid_confidence` links are pulled but NOT preselected. 

Output of the AI recommendations (numbers are just addresses of the links' position in a list).
```
{
    high_confidence: "38-87", 
    mid_confidence: "12, 98, 88-97"
}
```

The list is then re-organized and preselected according to these recommendations.

## 🧠USER INTERACTION
- user can now adjust the links for data extraction, if ai recommendation leaves something to be desired.

## PHASE 1 OUTPUT
List of links, first recommended by the AI, then adjusted by the user. 

(the example, 38-87, ARE the 50 links we want from that page, so, assume those here)

---
# PHASE 2: DATA EXTRACTION

## 🧠USER INPUT: Column Headers
User will define the headers (like, what data are we extracting)--
`["name", "url", "revenue", "rank", "location", "type"];`

## 🧠USER INPUT: Extraction Guidance
And the user can define some guidance:
`"You'll need to infer rank from the pagination data on the page, as it is not with the rest of the information."`

## 💻SYSTEM ACTION
From here, we go link-by-link, fetching each page's HTML to send to the AI for extraction.

## 🔮AI ACTION
Take the user guidance and column headers, along with each page's data, and ask the AI to return an object with values for each user-defined column-header, adhering to the user's guidance when possible. 

## FINAL OUTPUT
```
[
  {
    name: "McDonald's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/mcdonalds',
    revenue: '53469000000',
    rank: '1',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Starbucks',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/starbucks',
    revenue: '31462000000',
    rank: '2',
    location: 'U.S.',
    type: 'Coffee Cafe'
  },
  {
    name: 'Chick-fil-A',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/chick-fil',
    revenue: '22746',
    rank: '3',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: 'Taco Bell',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/taco-bell',
    revenue: '16197000000',
    rank: '4',
    location: 'U.S.',
    type: 'Mexican'
  },
  {
    name: "Wendy's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/wendys',
    revenue: '12554',
    rank: '5',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: "Dunkin'",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/dunkin',
    revenue: '12468000000',
    rank: '6',
    location: 'United States',
    type: 'Coffee Cafe'
  },
  {
    name: 'Chipotle Mexican Grill',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/chipotle-mexican-grill',
    revenue: '11247',
    rank: '7',
    location: 'U.S.',
    type: 'Mexican'
  },
  {
    name: 'Burger King',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/burger-king',
    revenue: '10980000000',
    rank: '8',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Subway',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/subway',
    revenue: '9511',
    rank: '9',
    location: 'U.S.',
    type: 'Sandwich'
  },
  {
    name: "Domino's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/dominos',
    revenue: '9500000',
    rank: '10',
    location: 'U.S.',
    type: 'Pizza'
  },
  {
    name: 'Panda Express',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/panda-express',
    revenue: '6199000000',
    rank: '11',
    location: 'U.S.',
    type: 'Asian'
  },
  {
    name: 'Panera Bread',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/panera-bread',
    revenue: '6126000000',
    rank: '12',
    location: 'United States',
    type: 'Sandwich'
  },
  {
    name: 'Popeyes',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/popeyes',
    revenue: '5726000000',
    rank: '13',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: 'Pizza Hut',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/pizza-hut',
    revenue: '5550000',
    rank: '14',
    location: 'U.S.',
    type: 'Pizza'
  },
  {
    name: 'Texas Roadhouse',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/texas-roadhouse',
    revenue: '5488000000',
    rank: '15',
    location: 'U.S.',
    type: 'Steak'
  },
  {
    name: 'Sonic Drive-In',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/sonic-drive',
    revenue: '5384000000',
    rank: '16',
    location: 'United States',
    type: 'Burger'
  },
  {
    name: 'Olive Garden',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/olive-garden',
    revenue: '5152000000',
    rank: '17',
    location: 'U.S.',
    type: 'Italian/Pizza'
  },
  {
    name: "Raising Cane's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/raising-canes',
    revenue: '4960000',
    rank: '18',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: 'Dairy Queen',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/dairy-queen',
    revenue: '4909000000',
    rank: '19',
    location: 'U.S.',
    type: 'Frozen Desserts'
  },
  {
    name: 'KFC',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/kfc',
    revenue: '4907',
    rank: '20',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: "Chili's Grill & Bar",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/chilis-grill-bar',
    revenue: '4571',
    rank: '21',
    location: 'U.S.',
    type: 'Varied Menu'
  },
  {
    name: 'Little Caesars',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/little-caesars',
    revenue: '4420000000',
    rank: '22',
    location: 'United States',
    type: 'Pizza'
  },
  {
    name: 'Jack in the Box',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/jack-box',
    revenue: '4396000000',
    rank: '23',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Wingstop',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/wingstop',
    revenue: '4392000000',
    rank: '24',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: "Arby's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/arbys',
    revenue: '4325000000',
    rank: '25',
    location: 'U.S.',
    type: 'Sandwich'
  },
  {
    name: 'Whataburger',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/whataburger',
    revenue: '4122000000',
    rank: '26',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: "Applebee's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/applebees',
    revenue: '4105',
    rank: '27',
    location: 'U.S.',
    type: 'Varied Menu'
  },
  {
    name: 'Buffalo Wild Wings',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/buffalo-wild-wings',
    revenue: '4054',
    rank: '28',
    location: 'U.S.',
    type: 'Sports Bar'
  },
  {
    name: "Culver's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/culvers',
    revenue: '3823000000',
    rank: '29',
    location: 'United States',
    type: 'Burger'
  },
  {
    name: "Jersey Mike's Subs",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/jersey-mikes-subs',
    revenue: '3731000000',
    rank: '30',
    location: 'United States',
    type: 'Sandwich'
  },
  {
    name: 'Papa Johns',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/papa-johns',
    revenue: '3663000000',
    rank: '31',
    location: 'U.S.',
    type: 'Pizza'
  },
  {
    name: 'IHOP',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/ihop',
    revenue: '3348000000',
    rank: '32',
    location: 'U.S.',
    type: 'Family Style'
  },
  {
    name: 'LongHorn Steakhouse',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/longhorn-steakhouse',
    revenue: '3011',
    rank: '33',
    location: 'United States',
    type: 'Steak'
  },
  {
    name: 'Cracker Barrel',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/cracker-barrel',
    revenue: '2767000000',
    rank: '34',
    location: 'U.S.',
    type: 'Family Style'
  },
  {
    name: 'Outback Steakhouse',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/outback-steakhouse',
    revenue: '2719000000',
    rank: '35',
    location: 'U.S.',
    type: 'Steak'
  },
  {
    name: 'The Cheesecake Factory',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/cheesecake-factory',
    revenue: '2662000000',
    rank: '36',
    location: 'U.S.',
    type: 'Varied Menu'
  },
  {
    name: "Denny's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/dennys',
    revenue: '2652000000',
    rank: '37',
    location: 'U.S.',
    type: 'Family Style'
  },
  {
    name: "Jimmy John's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/jimmy-johns',
    revenue: '2599000000',
    rank: '38',
    location: 'U.S.',
    type: 'Sandwich'
  },
  {
    name: "Zaxby's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/zaxbys',
    revenue: '2588000000',
    rank: '39',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: 'In-N-Out Burger',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/n-out-burger',
    revenue: '2355000000',
    rank: '40',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Five Guys',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/five-guys',
    revenue: '2270000000',
    rank: '41',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Bojangles',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/bojangles',
    revenue: '1881000000',
    rank: '42',
    location: 'U.S.',
    type: 'Chicken'
  },
  {
    name: "Hardee's",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/hardees',
    revenue: '1831000000',
    rank: '43',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Dutch Bros Coffee',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/dutch-bros-coffee',
    revenue: '1819',
    rank: '44',
    location: 'U.S.',
    type: 'Coffee Cafe'
  },
  {
    name: 'Red Lobster',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/red-lobster',
    revenue: '1681000000',
    rank: '45',
    location: 'U.S.',
    type: 'Seafood'
  },
  {
    name: 'Golden Corral',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/golden-corral',
    revenue: '1631000000',
    rank: '46',
    location: 'U.S.',
    type: 'Family Style'
  },
  {
    name: "Carl's Jr.",
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/carls-jr',
    revenue: '1523000000',
    rank: '47',
    location: 'U.S.',
    type: 'Burger'
  },
  {
    name: 'Red Robin',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/red-robin',
    revenue: '1499',
    rank: '48',
    location: 'U.S.',
    type: 'Varied Menu'
  },
  {
    name: 'Tropical Smoothie Cafe',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/tropical-smoothie-cafe',
    revenue: '1420000000',
    rank: '49',
    location: 'United States',
    type: 'Other Beverage/Snack'
  },
  {
    name: 'Waffle House',
    url: 'https://www.restaurantbusinessonline.com/top-500-chains-2025/waffle-house',
    revenue: '1418000000',
    rank: '50',
    location: 'U.S.',
    type: 'Family Style'
  }
]
```