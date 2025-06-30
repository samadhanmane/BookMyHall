import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import hallRouter from './routes/hallRoute.js'
import userRouter from './routes/userRoute.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewears
app.use(express.json())
app.use(cors())

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/hall', hallRouter)
app.use('/api/user', userRouter)

app.get('/', (req, res) => {
    res.send('BookMyHall API is running.')
})

app.listen(port, () => console.log("Server started on port", port))