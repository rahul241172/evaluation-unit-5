const express=require("express")
const { connection } = require("./config/db")
const {UserModel}=require("./models/user.model")
const { ProductModel}=require("./models/product.model")
require("dotenv").config()
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const cookies=require("cookie-parser")
const {authenticate}=require("./middleware/authenticate")
const {authorised}=require("./middleware/authorised")
const fs=require("fs")
const { json } = require("express")
const app=express()
app.use(express.json())
app.use(cookies())


// ----------------------------------Sign up----------------------------------//
app.post("/signup",async(req,res)=>{
    const {email,name,password,role}=req.body
    try{
        const data= await UserModel.find({email})
        if(data.length>0){
            res.send({msg:"Already a user"})
        }
        else{
            bcrypt.hash(password,5,async(err,hash)=>{
                if(err){
                    res.send({msg:err})
                }
                else{
                    const data= new UserModel({name,email,password:hash,role})
                    await data.save()
                    res.send({msg:"Registered"})
                }
            })
           
        }
    }catch(err){
        res.send({msg:err})
    }
})



// -------------------------------Login----------------------------------------//

app.post("/login",async(req,res)=>{
    const {email,password}=req.body
    try{
        const data= await UserModel.find({email})
        if(data.length>0){
            bcrypt.compare(password,data[0].password,(err,result)=>{
                if(result){
               const token= jwt.sign({userID:data[0]._id},process.env.normal_token,{
                    expiresIn:60
                })
               const refresh= jwt.sign({userID:data[0]._id},process.env.refresh_token,{
                    expiresIn:300
                })
                res.cookie("jwt",token)
                res.cookie("refresh",refresh)
                    res.send({msg:"Login Succes"})
                }
                else{
                    res.send({msg:"Wrong Credentials"})
                }
            })
        }
        else{
            res.send({msg:"Email not registerd please signup first"})
        }
    }catch(err){
        res.send({msg:err})
    }
})

// -----------------------------------Logout------------------------------------------//


app.get("/logout",authenticate,async(req,res)=>{
    let token=req.cookies.jwt
    let refresh=req.cookies.refresh
    let blacklist=JSON.parse(fs.readFileSync("./blacklist.json","utf-8"))
    blacklist.push(token)
    blacklist.push(refresh)
    fs.writeFileSync("./blacklist.json",JSON.stringify(blacklist))
    res.clearCookie("jwt")
    res.clearCookie("refresh")
    res.send({msg:"Logout Success"})
})


//------------------------------------Refresh Token------------------------------------------//


app.get("/refresh",(req,res)=>{
    let refresh=req.cookies.refresh
    if(refresh){
        jwt.verify(refresh,process.env.refresh_token,(err,decoded)=>{
            if(decoded){
                const token= jwt.sign({userID:decoded.userID},process.env.normal_token,{
                    expiresIn:60
                })
                res.cookie("jwt",token)
                
                res.send({msg:"login success"})
            }
            else{
                res.send(err)
            }
        })
    }
    else{
        res.send({msg:"Please Login"})
    }
})





// ----------------------------------Products----------------------------------------//

app.get("/products",authenticate,async(req,res)=>{
    try{
        let data= await ProductModel.find()
        res.send(data)
    }catch(err){
        res.send(err)
    }
})



// -----------------------------------Add Products------------------------------------//


app.post("/addproducts",authenticate,authorised(["seller"]),async(req,res)=>{
    const payload=req.body
    try{
        let data=new ProductModel(payload)
        await data.save()
        res.send("added")
    }catch(err){
        res.send(err)
    }
})


//-------------------------------------Delete Products---------------------------------//


app.delete("/deleteproducts/:id",authenticate,authorised(["seller"]),async(req,res)=>{
    let id=req.params.id
    try{
        await ProductModel.findByIdAndDelete({_id:id})
        res.send("Product deleted")
    }catch(err){
        res.send(err)
    }
})











app.listen(process.env.port,async()=>{
    try{
        await connection
        console.log("Server is running")
    }catch(err){
        console.log(err)
    }
})