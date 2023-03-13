const fs=require("fs")
const jwt=require("jsonwebtoken")
require("dotenv").config()
const {UserModel}=require("../models/user.model")




const authenticate=(req,res,next)=>{
    let token=req.cookies.jwt
    let blacklist=JSON.parse(fs.readFileSync("./blacklist.json","utf-8"))
   if(blacklist.includes(token)){
    res.send({msg:"Please login again"})
   }
   else{
    if(token){
        jwt.verify(token,process.env.normal_token,async(err,decoded)=>{
            if(decoded){
            const {userID}=decoded
            const user= await UserModel.findById(userID)
            req.user=user
            next()
            }
            else{
                res.send({msg:err.message})
            }
        })
    }
    else{
        res.send({msg:"Please login again"})
    }
   }
   
   
   
   
   
   
}





module.exports={
    authenticate
}