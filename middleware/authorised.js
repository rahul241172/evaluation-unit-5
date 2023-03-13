const arr=["seller","user"]


const authorised=(arr)=>{
    return (req,res,next)=>{
        const role=req.user.role
        if(arr.includes(role)){
            next()
        }else{
            res.send({msg:"Not Authorized"})
        }
    }
}



module.exports={
    authorised
}