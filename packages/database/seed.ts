import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const properties = [
  {
    address: '2847 Oakridge Drive',
    city: 'Austin', state: 'TX', zipCode: '78701',
    price: 485000, bedrooms: 4, bathrooms: 2.5, sqft: 2340, yearBuilt: 2018,
    propertyType: 'SINGLE_FAMILY' as const, status: 'ACTIVE' as const,
    description: 'Stunning modern home in the heart of Austin. Open floor plan, gourmet kitchen with quartz countertops, primary suite with spa bath. Large backyard perfect for entertaining.',
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'],
    features: { garage: '2-car', pool: false, fireplace: true },
    listedAt: new Date('2024-01-15'),
  },
  {
    address: '1205 Palm Canyon Blvd',
    city: 'Austin', state: 'TX', zipCode: '78702',
    price: 329000, bedrooms: 3, bathrooms: 2, sqft: 1680, yearBuilt: 2015,
    propertyType: 'SINGLE_FAMILY' as const, status: 'ACTIVE' as const,
    description: 'Charming bungalow in East Austin. Hardwood floors throughout, updated kitchen, covered porch. Minutes from restaurants and nightlife. Move-in ready.',
    images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
    features: { garage: '1-car', pool: false, fireplace: false },
    listedAt: new Date('2024-01-20'),
  },
  {
    address: '9512 Lakeview Terrace #4B',
    city: 'Austin', state: 'TX', zipCode: '78703',
    price: 275000, bedrooms: 2, bathrooms: 2, sqft: 1150, yearBuilt: 2020,
    propertyType: 'CONDO' as const, status: 'ACTIVE' as const,
    description: 'Modern luxury condo with stunning lake views. Floor-to-ceiling windows, chef kitchen, private balcony. Building amenities include rooftop pool and gym.',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    features: { garage: 'covered', pool: true, fireplace: false },
    listedAt: new Date('2024-02-01'),
  },
  {
    address: '4421 Riverside Court',
    city: 'Dallas', state: 'TX', zipCode: '75201',
    price: 595000, bedrooms: 5, bathrooms: 3.5, sqft: 3200, yearBuilt: 2019,
    propertyType: 'SINGLE_FAMILY' as const, status: 'ACTIVE' as const,
    description: 'Executive home in prestigious Riverside neighborhood. Grand foyer, formal dining, game room. Resort-style pool with outdoor kitchen. Three-car garage.',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
    features: { garage: '3-car', pool: true, fireplace: true },
    listedAt: new Date('2024-01-10'),
  },
  {
    address: '770 Magnolia Street #201',
    city: 'Dallas', state: 'TX', zipCode: '75204',
    price: 189000, bedrooms: 1, bathrooms: 1, sqft: 780, yearBuilt: 2016,
    propertyType: 'CONDO' as const, status: 'ACTIVE' as const,
    description: 'Stylish urban condo in vibrant Uptown. High ceilings, modern finishes, private parking. Steps from restaurants, shops, and nightlife. Perfect for first-time buyers.',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    features: { garage: 'private', pool: true, fireplace: false },
    listedAt: new Date('2024-02-05'),
  },
  {
    address: '3318 Sunset Ridge Lane',
    city: 'Houston', state: 'TX', zipCode: '77001',
    price: 412000, bedrooms: 4, bathrooms: 3, sqft: 2750, yearBuilt: 2017,
    propertyType: 'SINGLE_FAMILY' as const, status: 'ACTIVE' as const,
    description: 'Beautifully maintained family home in the Heights. Gourmet kitchen, butler pantry, covered patio and large backyard. Walk to Hermann Park and museums.',
    images: ['https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800'],
    features: { garage: '2-car', pool: false, fireplace: true },
    listedAt: new Date('2024-01-25'),
  },
  {
    address: '88 Harbor View Drive',
    city: 'Miami', state: 'FL', zipCode: '33101',
    price: 875000, bedrooms: 4, bathrooms: 3, sqft: 2900, yearBuilt: 2021,
    propertyType: 'SINGLE_FAMILY' as const, status: 'ACTIVE' as const,
    description: 'Breathtaking waterfront property with panoramic bay views. Infinity pool, private dock, summer kitchen. Imported marble, custom cabinetry, smart home technology.',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
    features: { garage: '3-car', pool: true, fireplace: false, waterfront: true },
    listedAt: new Date('2024-01-05'),
  },
  {
    address: '1550 Brickell Ave #38C',
    city: 'Miami', state: 'FL', zipCode: '33129',
    price: 650000, bedrooms: 3, bathrooms: 2.5, sqft: 1820, yearBuilt: 2022,
    propertyType: 'CONDO' as const, status: 'ACTIVE' as const,
    description: 'Luxury high-rise with iconic Miami skyline views. Italian kitchen, spa master bath, floor-to-ceiling impact windows. World-class amenities: pool, spa, tennis, concierge.',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    features: { garage: 'valet', pool: true, fireplace: false, gym: true },
    listedAt: new Date('2024-02-10'),
  },
]

async function main() {
  console.log('🌱 Seeding database...')
  await prisma.property.deleteMany()
  for (const p of properties) {
    await prisma.property.create({ data: p })
    console.log(`  ✅ ${p.address}, ${p.city}`)
  }
  console.log(`\n🏠 Seeded ${properties.length} properties!`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
