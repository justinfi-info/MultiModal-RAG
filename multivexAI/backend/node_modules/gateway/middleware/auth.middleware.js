import redis from "../../shared/redis/redis.js"

const protect=async (req,res,next) => {
    try {
        const sessionId=req.cookies.session
        if(!sessionId){
            return res.status(400).json({message:"unauthorised"})
        }
        const session=await redis.get(`session-${sessionId}`)
        if(!session){
            return res.status(400).json({message:"session expired"})
        }
        let user
        try {
            user=JSON.parse(session)
        } catch {
            return res.status(400).json({message:"session expired"})
        }
        req.user=user
        next()

    } catch (error) {
        return res.status(500).json({message:`protect error ${error}`})

    }
}

export default protect