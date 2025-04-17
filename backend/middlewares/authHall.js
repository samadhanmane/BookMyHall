import jwt from 'jsonwebtoken'
import hallModel from '../models/hallModel.js'

// admin authentication middleware
const authHall = async (req,res,next) =>{
    try {
        // Get token from headers, case-insensitive
        const token = req.headers.dtoken || req.headers.dToken || req.headers.Dtoken || req.headers.DToken;
        
        if (!token){
           return res.json({success:false,message:'Not Authorized Login Again'})
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.hallId = token_decode.id
        
        // Get hall information and attach it to the request
        const hall = await hallModel.findById(token_decode.id);
        if (hall) {
            req.hall = hall;
        }

        next()

    }catch (error){
        console.error("Error in authHall middleware:", error)
        res.json({ success: false, message: error.message })
    }
}

export default authHall
