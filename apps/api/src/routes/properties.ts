import { Router } from 'express'
import { prisma } from '../utils/db'
import { ok, err } from '../utils/response'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { city, state, minPrice, maxPrice, bedrooms, page = '1', limit = '20' } = req.query
    const where: any = { status: 'ACTIVE' }
    if (city) where.city = { contains: city as string, mode: 'insensitive' }
    if (state) where.state = state
    if (minPrice || maxPrice) { where.price = {}; if (minPrice) where.price.gte = parseFloat(minPrice as string); if (maxPrice) where.price.lte = parseFloat(maxPrice as string) }
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms as string) }
    const pageNum = parseInt(page as string); const limitNum = Math.min(parseInt(limit as string), 100)
    const [data, total] = await Promise.all([prisma.property.findMany({ where, skip: (pageNum-1)*limitNum, take: limitNum, orderBy: { listedAt: 'desc' } }), prisma.property.count({ where })])
    return ok(res, { data, total, page: pageNum, totalPages: Math.ceil(total/limitNum) })
  } catch (e: any) { return err(res, e.message, 500) }
})

router.get('/:id', async (req, res) => {
  const property = await prisma.property.findUnique({ where: { id: req.params.id } })
  if (!property) return err(res, 'Not found', 404)
  return ok(res, property)
})

export default router
