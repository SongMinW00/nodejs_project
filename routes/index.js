const express = require('express')
const {alterMove} = require('../util/alterMove.js')
const router = express.Router();
const userRouter = require('./user/index.js')

router.get('/', (req,res)=>{
    res.render('index.ejs')
})

/*User login*/
router.use('/user', userRouter)

module.exports = router;