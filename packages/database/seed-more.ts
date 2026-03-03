/**
 * Seed 20 additional realistic properties across 10 cities.
 * Uses Supabase client - set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' seed-more.ts
 * Or from packages/database: npm run seed:more
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const UNSPLASH_IDS = [
  '1568605114967',
  '1570129477492',
  '1545324418',
  '1600596542815',
  '1522708323590',
  '1583608205776',
  '1613490493576',
  '1600585154340',
  '1600566753190',
  '1600602647944',
  '1600573477772',
  '1512917776440',
];

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`;

const properties = [
  {
    title: 'Cozy Upper West Side Condo',
    address: '242 West 75th Street Apt 4B',
    city: 'New York',
    state: 'NY',
    price: 895000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    year_built: 1985,
    description:
      'Bright pre-war condo in a well-maintained co-op building. Hardwood floors, crown molding, and a renovated kitchen with Bosch appliances. Walking distance to Central Park, Trader Joe\'s, and the 1/2/3 trains. Low monthly maintenance and pet-friendly building.',
    image_url: img(UNSPLASH_IDS[0]),
  },
  {
    title: 'Modern Brooklyn Townhouse',
    address: '412 Park Slope Avenue',
    city: 'New York',
    state: 'NY',
    price: 1895000,
    beds: 5,
    baths: 3.5,
    sqft: 3200,
    year_built: 2018,
    description:
      'Stunning new construction townhouse with roof deck and private garden. Chef\'s kitchen, primary suite with walk-in closet, and finished basement. Steps from Prospect Park and excellent schools. High-end finishes throughout.',
    image_url: img(UNSPLASH_IDS[1]),
  },
  {
    title: 'Hollywood Hills Contemporary',
    address: '7821 Mulholland Drive',
    city: 'Los Angeles',
    state: 'CA',
    price: 2100000,
    beds: 4,
    baths: 4,
    sqft: 3800,
    year_built: 2019,
    description:
      'Architectural masterpiece with panoramic city and canyon views. Floor-to-ceiling glass, infinity pool, and outdoor entertaining space. Smart home system, wine cellar, and three-car garage. Private and gated.',
    image_url: img(UNSPLASH_IDS[2]),
  },
  {
    title: 'Santa Monica Beach Bungalow',
    address: '1834 Ocean Avenue',
    city: 'Los Angeles',
    state: 'CA',
    price: 1650000,
    beds: 3,
    baths: 2,
    sqft: 1650,
    year_built: 1962,
    description:
      'Charming beach bungalow two blocks from the sand. Updated kitchen and baths, hardwood floors, and a private backyard. Walk to shops, restaurants, and the pier. Strong rental history for investment buyers.',
    image_url: img(UNSPLASH_IDS[3]),
  },
  {
    title: 'Lincoln Park Single Family',
    address: '2045 North Halsted Street',
    city: 'Chicago',
    state: 'IL',
    price: 975000,
    beds: 4,
    baths: 2.5,
    sqft: 2450,
    year_built: 1912,
    description:
      'Classic Chicago greystone fully renovated in 2021. Original millwork, modern kitchen, and finished third floor. Large lot with detached two-car garage. Lincoln Park schools and walkable to the lakefront.',
    image_url: img(UNSPLASH_IDS[4]),
  },
  {
    title: 'Wicker Park Condo',
    address: '1420 North Milwaukee Ave Unit 3',
    city: 'Chicago',
    state: 'IL',
    price: 425000,
    beds: 2,
    baths: 2,
    sqft: 1150,
    year_built: 2008,
    description:
      'Spacious loft-style condo in the heart of Wicker Park. Exposed brick, 12-foot ceilings, and in-unit laundry. Building has rooftop deck. Steps from the Blue Line, restaurants, and nightlife.',
    image_url: img(UNSPLASH_IDS[5]),
  },
  {
    title: 'Scottsdale Desert Estate',
    address: '8847 East Pinnacle Peak Road',
    city: 'Phoenix',
    state: 'AZ',
    price: 1480000,
    beds: 5,
    baths: 4,
    sqft: 4500,
    year_built: 2020,
    description:
      'Contemporary desert home with mountain views. Resort-style pool and spa, outdoor kitchen, and fire pit. Open floor plan with walls of glass. Three-car garage and RV parking.',
    image_url: img(UNSPLASH_IDS[6]),
  },
  {
    title: 'Downtown Phoenix Loft',
    address: '44 West Monroe Street #1202',
    city: 'Phoenix',
    state: 'AZ',
    price: 385000,
    beds: 2,
    baths: 2,
    sqft: 1420,
    year_built: 2006,
    description:
      'Industrial loft with exposed ductwork and concrete floors. Floor-to-ceiling windows and private balcony. Building amenities include pool and fitness center. Walking distance to Chase Field and Footprint Center.',
    image_url: img(UNSPLASH_IDS[7]),
  },
  {
    title: 'Highland Ranch Family Home',
    address: '8921 South Telluride Way',
    city: 'Denver',
    state: 'CO',
    price: 725000,
    beds: 4,
    baths: 3,
    sqft: 2850,
    year_built: 2016,
    description:
      'Immaculate family home on a quiet cul-de-sac. Vaulted ceilings, main-floor office, and finished basement with rec room. Large backyard with patio. Top-rated Douglas County schools.',
    image_url: img(UNSPLASH_IDS[8]),
  },
  {
    title: 'LoDo Penthouse',
    address: '1600 Market Street PH',
    city: 'Denver',
    state: 'CO',
    price: 1395000,
    beds: 3,
    baths: 3,
    sqft: 2200,
    year_built: 2019,
    description:
      'Stunning penthouse with 360-degree mountain and downtown views. Private roof deck, Sub-Zero and Wolf kitchen, and spa-like primary. Two parking spaces. Walking distance to Union Station and Coors Field.',
    image_url: img(UNSPLASH_IDS[9]),
  },
  {
    title: '12 South Victorian',
    address: '2312 12th Avenue South',
    city: 'Nashville',
    state: 'TN',
    price: 895000,
    beds: 4,
    baths: 3,
    sqft: 2650,
    year_built: 1905,
    description:
      'Restored Victorian in the heart of 12 South. Original hardwood, clawfoot tubs, and wraparound porch. Chef\'s kitchen and primary suite addition. Walk to restaurants, coffee shops, and Sevier Park.',
    image_url: img(UNSPLASH_IDS[10]),
  },
  {
    title: 'East Nashville Bungalow',
    address: '1408 Woodland Street',
    city: 'Nashville',
    state: 'TN',
    price: 549000,
    beds: 3,
    baths: 2,
    sqft: 1480,
    year_built: 1938,
    description:
      'Charming bungalow with period details and modern updates. Open living and dining, updated kitchen, and fenced backyard. Desirable Lockeland Springs. Quick drive to downtown and the Gulch.',
    image_url: img(UNSPLASH_IDS[11]),
  },
  {
    title: 'Capitol Hill Craftsman',
    address: '1417 East Harrison Street',
    city: 'Seattle',
    state: 'WA',
    price: 965000,
    beds: 3,
    baths: 2,
    sqft: 1920,
    year_built: 1910,
    description:
      'Classic Seattle craftsman with modern renovation. Original fir floors, built-ins, and period fixtures. Gourmet kitchen and spa bath. Large lot with detached garage. Walk to light rail and Broadway.',
    image_url: img(UNSPLASH_IDS[0]),
  },
  {
    title: 'Queen Anne View Home',
    address: '312 West Galer Street',
    city: 'Seattle',
    state: 'WA',
    price: 1425000,
    beds: 4,
    baths: 3,
    sqft: 3100,
    year_built: 2003,
    description:
      'Spectacular views of Puget Sound and the Olympics. Main floor living with wall of windows, chef\'s kitchen, and deck. Lower level has separate suite. Three-car garage. Top Queen Anne schools.',
    image_url: img(UNSPLASH_IDS[1]),
  },
  {
    title: 'Buckhead Estate',
    address: '4420 Peachtree Road NE',
    city: 'Atlanta',
    state: 'GA',
    price: 1890000,
    beds: 6,
    baths: 5,
    sqft: 5200,
    year_built: 2017,
    description:
      'Luxury estate on one acre in prime Buckhead. Grand foyer, wine cellar, home theater, and resort pool. Gated entry and circular drive. Minutes from Phipps Plaza and top private schools.',
    image_url: img(UNSPLASH_IDS[2]),
  },
  {
    title: 'Inman Park Victorian',
    address: '876 Euclid Avenue NE',
    city: 'Atlanta',
    state: 'GA',
    price: 725000,
    beds: 3,
    baths: 2.5,
    sqft: 2200,
    year_built: 1895,
    description:
      'Stunning Victorian with original stained glass and pocket doors. Updated kitchen and baths, high ceilings, and large front porch. Walk to the Beltline, Krog Street Market, and MARTA.',
    image_url: img(UNSPLASH_IDS[3]),
  },
  {
    title: 'Beacon Hill Brownstone',
    address: '84 Pinckney Street',
    city: 'Boston',
    state: 'MA',
    price: 1650000,
    beds: 4,
    baths: 3,
    sqft: 2850,
    year_built: 1865,
    description:
      'Historic brownstone on a tree-lined Beacon Hill street. Four levels, original details, and modern kitchen. Private garden and roof deck with city views. Steps from the Common and Charles Street.',
    image_url: img(UNSPLASH_IDS[4]),
  },
  {
    title: 'South End Condo',
    address: '535 Columbus Avenue Unit 4',
    city: 'Boston',
    state: 'MA',
    price: 675000,
    beds: 2,
    baths: 2,
    sqft: 1150,
    year_built: 2004,
    description:
      'Light-filled condo in converted warehouse. Open layout, exposed brick, and in-unit laundry. Building has elevator and common roof deck. Walk to SoWa, restaurants, and the Orange Line.',
    image_url: img(UNSPLASH_IDS[5]),
  },
  {
    title: 'Pacific Beach Coastal',
    address: '1842 Ocean Boulevard',
    city: 'San Diego',
    state: 'CA',
    price: 1495000,
    beds: 4,
    baths: 3,
    sqft: 2600,
    year_built: 2015,
    description:
      'Newer coastal home two blocks from the beach. Open floor plan, chef\'s kitchen, and rooftop deck with ocean views. Private backyard with outdoor shower. Low-maintenance landscaping.',
    image_url: img(UNSPLASH_IDS[6]),
  },
  {
    title: 'La Jolla Condo',
    address: '7660 Fay Avenue #302',
    city: 'San Diego',
    state: 'CA',
    price: 825000,
    beds: 2,
    baths: 2,
    sqft: 1380,
    year_built: 2012,
    description:
      'Corner unit with ocean glimpses and mountain views. Modern finishes, large balcony, and assigned parking. Building has pool and gym. Walk to Village shops, beaches, and La Jolla Cove.',
    image_url: img(UNSPLASH_IDS[7]),
  },
];

async function main() {
  console.log('🌱 Seeding 20 additional properties to Supabase...');
  const { data, error } = await supabase.from('properties').insert(properties).select('id, address, city');
  if (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
  console.log(`\n🏠 Seeded ${data?.length ?? 20} properties!`);
  data?.forEach((p: { address: string; city: string }) =>
    console.log(`  ✅ ${p.address}, ${p.city}`)
  );
}

main();
