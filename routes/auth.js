const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');
const JWT_SECRET = "TigerZindaHai";

// ROUTE 1 : To create a new user
try {
router.post('/createUser',[
    body('name','Enter a valid name').isLength({min : 3}),
    body('email','Enter a valid email').isEmail(),
    body('password','Password must be atleast 5 characters ').isLength({min : 5})
],async (req,res)=>{ 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    //check if a user with the same email already exists
    let user = await User.findOne({email : req.body.email});
    if(user){
      return res.status(400).json({error:"Sorry a user with this email already exists."});
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password,salt);

    user = await User.create({
        name: req.body.name,
        password: secPass,
        email : req.body.email
      }) 

      const data = {
        user : {
          id : user.id
        }
      }
      const authToken = jwt.sign(data,JWT_SECRET);
      res.json({authToken});
})
} catch (error) {
  console.error(error.message);
  res.status(500).send("Internal Server Error.");
}

//ROUTE 2 : endpoint for login : /api/auth/login
router.post('/login',[
  body('email','Enter a valid email').isEmail(),
  body('password','Password cannot be empty').exists()
],async (req,res)=>{ 
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const {email,password} = req.body;
    try {
      let user = await User.findOne({email});
      if(!user){
        return res.status(400).json({error: "Please try to login with correct credentials"});
      }

      const comparePassword = await bcrypt.compare(password,user.password);
      if(!comparePassword){
        return res.status(400).json({error: "Please try to login with correct credentials"});
      }

      const data = {
        user : {
          id : user.id
        }
      }
      const authToken = jwt.sign(data,JWT_SECRET,{ expiresIn: '1h'});
      res.json({authToken});

    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error.");
    }
})


//ROUTE 3 : Get user detail : "/api/auth/getuser". Login required.
router.post('/getuser',fetchuser,async (req,res) =>{
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("-password"); 
      res.send(user);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error.");
    }
})
module.exports = router