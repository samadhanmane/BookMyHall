import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {

        const atoken = req.headers.atoken || req.headers.token;
        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }


        const decoded = jwt.verify(atoken, process.env.JWT_SECRET);
        // Attach decoded payload to req.user for downstream role checks
        req.user = decoded;
        // Optionally, check for role: 'admin' here
        if (!decoded || decoded.role !== 'admin') {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        next()

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}
export default authAdmin
