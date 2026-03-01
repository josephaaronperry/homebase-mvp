import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../utils/db'
import { ok, err } from '../utils/response'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const SECRET = process.env.JWT_SECRET || 'secret'

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2),
      phone: z.string().optional()
    }).parse(req.body)
    if (await prisma.user.findUnique({ where: { email } })) return err(res, 'Email already in use', 409)
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { email, passwordHash, fullName, phone } })
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
    await prisma.session.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } })
    return ok(res, { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, kycStatus: user.kycStatus } }, 201)
  } catch (e: any) { return err(res, e.message || 'Registration failed', 500) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) return err(res, 'Invalid credentials', 401)
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '7d' })
    await prisma.session.create({ data: { userId: user.id, token, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } })
    return ok(res, { token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, kycStatus: user.kycStatus } })
  } catch (e: any) { return err(res, e.message || 'Login failed', 500) }
})

router.post('/logout', authenticate, async (req: AuthRequest, res) => {
  const token = req.headers.authorization?.split(' ')[1]!
  await prisma.session.deleteMany({ where: { token } })
  return ok(res, null)
})

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return err(res, 'Not found', 404)
  return ok(res, { id: user.id, email: user.email, fullName: user.fullName, role: user.role, kycStatus: user.kycStatus })
})

export default router
