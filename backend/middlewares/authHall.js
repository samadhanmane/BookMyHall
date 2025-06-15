import jwt from 'jsonwebtoken'
import hallModel from '../models/hallModel.js'

// admin authentication middleware
const authHall = async (req, res, next) => {
    try {
        // Get token from headers, case-insensitive
        const token = req.headers.token || req.headers.dtoken || req.headers.dToken;

        if (!token) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Find hall
        const hall = await hallModel.findById(decoded.id)

        if (!hall) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        // Attach hall to request
        req.hall = hall
        next()

    } catch (error) {
        res.json({ success: false, message: 'Not Authorized Login Again' })
    }
}

export default authHall
