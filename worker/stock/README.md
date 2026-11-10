# Moonrise stock media folders

One folder per local business type. Each `manifest.json` lists curated
Unsplash/Pexels image URLs and looping video URLs for that trade.

The generate agent reads the compiled library (`worker/stock-media-library.js`)
and picks the matching folder automatically (spa → spa images/videos,
dog grooming → doggrooming, etc.).

Rebuild:

```bash
node worker/scripts/seed-stock-folders.js
```

Folders: **50**

| Folder | Label | Images | Videos |
| --- | --- | ---: | --- |
| `barber` | barbershop / men's cuts / fades | 14 | barber, people, ambient |
| `salon` | hair salon / beauty / blowouts | 14 | salon, soft, people |
| `nails` | nail salon / manicure / pedicure | 11 | salon, soft, floral |
| `spa` | spa / massage / wellness | 14 | spa, massage, soft |
| `medspa` | med spa / aesthetics / injectables | 12 | spa, soft, medical |
| `tattoo` | tattoo / piercing studio | 10 | ambient, people, city |
| `landscaping` | landscaping / gardening / lawn care | 14 | landscaping, nature, forest |
| `florist` | florist / flowers / arrangements | 12 | floral, nature, soft |
| `plumbing` | plumbing / pipes / water heaters | 12 | construction, ambient, people |
| `electrical` | electrician / wiring / panels | 12 | construction, city, people |
| `hvac` | HVAC / heating / air conditioning | 12 | construction, ambient, city |
| `roofing` | roofing / gutters / exterior | 12 | construction, city, ambient |
| `painting` | painting / interior finish | 12 | construction, soft, people |
| `cleaning` | cleaning / janitorial / maid service | 12 | cleaning, soft, ambient |
| `construction` | construction / contracting / remodeling | 12 | construction, city, people |
| `pestcontrol` | pest control / exterminator | 12 | construction, ambient, people |
| `locksmith` | locksmith / security keys | 12 | city, ambient, people |
| `pool` | pool service / spa pools | 11 | ocean, nature, soft |
| `tutoring` | tutoring / education / schools | 12 | people, soft, office |
| `daycare` | daycare / childcare / kids | 12 | people, soft, nature |
| `musicschool` | music school / lessons / instruments | 11 | people, soft, ambient |
| `restaurant` | restaurant / dining / fine food | 12 | restaurant, kitchen, people |
| `pizza` | pizza / italian / casual food | 12 | kitchen, restaurant, people |
| `cafe` | cafe / coffee shop | 12 | barista, coffee, soft |
| `bakery` | bakery / pastry / bread | 12 | bakery, coffee, kitchen |
| `catering` | catering / events / food service | 12 | restaurant, kitchen, people |
| `foodtruck` | food truck / street food | 12 | kitchen, city, people |
| `fitness` | gym / fitness / training | 12 | workout, city, people |
| `yoga` | yoga / pilates / mindful movement | 12 | yoga, soft, nature |
| `martialarts` | martial arts / karate / MMA | 12 | workout, people, city |
| `dental` | dental / orthodontics | 12 | dental, soft, medical |
| `medical` | medical / clinic / healthcare | 12 | medical, soft, people |
| `chiropractic` | chiropractic / spine care | 12 | medical, soft, yoga |
| `physicaltherapy` | physical therapy / rehab | 12 | medical, workout, soft |
| `optometry` | optometry / eye care / glasses | 12 | soft, medical, people |
| `doggrooming` | dog grooming / pet salon | 12 | doggroom, pets, nature |
| `veterinary` | veterinary / animal hospital | 12 | pets, medical, soft |
| `pets` | pet boarding / daycare / general pets | 12 | pets, nature, people |
| `legal` | law / attorney / legal | 12 | office, city, people |
| `finance` | accounting / finance / insurance | 12 | office, city, people |
| `realestate` | real estate / property | 12 | realestate, city, ambient |
| `auto` | auto repair / mechanic / tires | 12 | auto, city, ambient |
| `cardetail` | car detailing / car wash | 12 | auto, city, people |
| `photography` | photography / creative studio | 12 | people, city, soft |
| `agency` | marketing / design / tech agency | 12 | office, city, people |
| `moving` | moving / storage / hauling | 12 | city, people, ambient |
| `boutique` | boutique / retail / clothing | 12 | people, soft, city |
| `jewelry` | jewelry / watches / luxury retail | 11 | soft, people, ambient |
| `hotel` | hotel / inn / lodging | 12 | soft, city, ambient |
| `default` | local business / general | 14 | city, ambient, people |
