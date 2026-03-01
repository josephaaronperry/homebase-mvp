import { Router } from 'express'
import { prisma } from '../utils/db'
import { ok, err } from '../utils/response'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authenticate)

router.get('/', async (req: AuthRequest, res) => {
  const data = await prisma.offer.findMany({ where: { userId: req.userId }, include: { property: true, documents: true, timeline: true }, orderBy: { createdAt: 'desc' } })
  return ok(res, data)
})

router.get('/:id', async (req: AuthRequest, res) => {
  const offer = await prisma.offer.findFirst({ where: { id: req.params.id, userId: req.userId }, include: { property: true, documents: true, timeline: true } })
  if (!offer) return err(res, 'Not found', 404)
  return ok(res, offer)
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) return err(res, 'User not found', 404)
    if (user.kycStatus !== 'VERIFIED') return err(res, 'Identity verification required', 403)
    const property = await prisma.property.findUnique({ where: { id: req.body.propertyId } })
    if (!property) return err(res, 'Property not found', 404)
    const offer = await prisma.offer.create({
      data: { userId: req.userId!, propertyId: req.body.propertyId, offerPrice: req.body.offerPrice, earnestMoney: req.body.earnestMoney, downPayment: req.body.downPayment, financingType: req.body.financingType || 'CONVENTIONAL', contingencies: req.body.contingencies || {}, status: 'SUBMITTED',
        timeline: { create: [
          { eventType: 'offer_submitted', title: 'Offer Submitted', status: 'COMPLETED', completedAt: new Date() },
          { eventType: 'under_review', title: 'Under Review', status: 'IN_PROGRESS' },
          { eventType: 'inspection', title: 'Inspection', status: 'PENDING' },
          { eventType: 'closing', title: 'Closing', status: 'PENDING' },
        ]}
      }, include: { property: true, timeline: true }
    })
    return ok(res, offer, 201)
  } catch (e: any) { return err(res, e.message, 500) }
})

export default router
