import jwt from 'jsonwebtoken'

// admin authentication middleware
const authUser = async (req,res,next) =>{
    try {
        // Check for token in headers (case insensitive)
        const token = req.headers.token || req.headers.atoken || req.headers.Token || req.headers.Atoken
        
        if (!token){
           return res.json({success:false,message:'Not Authorized Login Again'})
        }

        // Log the token for debugging
        console.log('AuthUser: Token received', { tokenLength: token.length })
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        
        // Log the decoded token
        console.log('AuthUser: Token decoded', token_decode)
       
        // Handle both user and admin tokens
        if (token_decode.id) {
            req.body.userId = token_decode.id
        } else if (token_decode.role === 'admin') {
            req.body.isAdmin = true
            req.body.adminEmail = token_decode.email
        }
       
        next()

    }catch (error){
        console.log("JWT Error in authUser middleware:", error)
        res.json({ success: false, message: error.message })
    }

}
export default authUser
