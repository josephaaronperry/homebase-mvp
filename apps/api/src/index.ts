import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth'
import propertyRoutes from './routes/properties'
import savedRoutes from './routes/saved'
import showingRoutes from './routes/showings'
import offerRoutes from './routes/offers'

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/saved', savedRoutes)
app.use('/api/showings', showingRoutes)
app.use('/api/offers', offerRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use((_, res) => res.status(404).json({ success: false, error: 'Not found' }))

app.listen(PORT, () => console.log(`🏠 API running on http://localhost:${PORT}`))
export default app
