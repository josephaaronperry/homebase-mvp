import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/db'
import { err } from '../utils/response'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return err(res, 'No token', 401)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string }
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
    if (!session || session.expiresAt < new Date()) return err(res, 'Session expired', 401)
    req.userId = decoded.userId
    req.userRole = session.user.role
    next()
  } catch {
    return err(res, 'Invalid token', 401)
  }
}
