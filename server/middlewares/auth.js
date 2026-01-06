export const protect = (req, res, next) => {
    try {
        const {userId} = req.auth()
        if(!userId){
            return res.status(401).json({success: false, message: "Not authorized"})
        }
        // Set userId on req for easy access in controllers
        req.userId = userId;
        next()
    } catch (error) {
        return res.status(401).json({success: false, message: error.message})
    }
}