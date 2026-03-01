import { Router } from 'express'
import { prisma } from '../utils/db'
import { ok, err } from '../utils/response'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.savedProperty.findMany({ where: { userId: req.userId }, include: { property: true }, orderBy: { savedAt: 'desc' } })
  return ok(res, data)
})

router.post('/', async (req: AuthRequest, res) => {
  const { propertyId, notes } = req.body
  if (!await prisma.property.findUnique({ where: { id: propertyId } })) return err(res, 'Property not found', 404)
  const saved = await prisma.savedProperty.upsert({ where: { userId_propertyId: { userId: req.userId!, propertyId } }, create: { userId: req.userId!, propertyId, notes }, update: { notes }, include: { property: true } })
  return ok(res, saved, 201)
})

router.delete('/:propertyId', async (req: AuthRequest, res) => {
  await prisma.savedProperty.deleteMany({ where: { userId: req.userId, propertyId: req.params.propertyId } })
  return ok(res, null)
})

export default router
