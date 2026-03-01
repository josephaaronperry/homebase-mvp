import { Router } from 'express'
import { prisma } from '../utils/db'
import { ok, err } from '../utils/response'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.showing.findMany({ where: { userId: req.userId }, include: { property: true }, orderBy: { createdAt: 'desc' } })
  return ok(res, data)
})

router.post('/', async (req: AuthRequest, res) => {
  const { propertyId, requestedAt, notes } = req.body
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) return err(res, 'Property not found', 404)
  const showing = await prisma.showing.create({ data: { userId: req.userId!, propertyId, requestedAt: new Date(requestedAt), notes }, include: { property: true } })
  await prisma.notification.create({ data: { userId: req.userId!, title: 'Showing Requested', body: `Your showing for ${property.address} has been submitted.`, type: 'showing_requested' } })
  return ok(res, showing, 201)
})

router.patch('/:id/cancel', async (req: AuthRequest, res) => {
  const showing = await prisma.showing.findFirst({ where: { id: req.params.id, userId: req.userId } })
  if (!showing) return err(res, 'Not found', 404)
  const updated = await prisma.showing.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } })
  return ok(res, updated)
})

export default router
