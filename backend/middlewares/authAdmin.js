import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req,res,next) =>{
    try {
        // Check for admin token in headers (using various ways it might be present)
        const atoken = req.headers.atoken || req.headers.Atoken || req.headers['atoken']
        
        if (!atoken){
           return res.json({success:false,message:'Not Authorized Login Again'})
        }

        // Log the token for debugging
        console.log('AuthAdmin: Token received', { tokenLength: atoken.length })
        
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
        
        // Log the decoded token
        console.log('AuthAdmin: Token decoded', token_decode)
        
        if (!token_decode.role || token_decode.role !== 'admin' || token_decode.email !== process.env.ADMIN_EMAIL) {
            return res.json({success:false,message:'Not Authorized Login Again'})
        }

        next()

    }catch (error){
        console.log("JWT Error in authAdmin middleware:", error)
        res.json({ success: false, message: error.message })
    }

}
export default authAdmin
