const express= require('express')
const {alterMove} = require('../../util/alterMove.js')
const router = express.Router()
const mongoose = require('mongoose');
const connectDB = require("../../config/db");
const User = require("../../models/User"); // User model 불러오기
const base32 = require('base32');
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const MongoClient = require('mongodb').MongoClient;
//const session = {}
const session = require('express-session');
router.get('/login', (req,res)=>{
    res.render('login.ejs')
})

var db;
MongoClient.connect('mongodb+srv://poh1005:als96321%40@cluster0.q4o5jcp.mongodb.net/?retryWrites=true&w=majority', function(err,client){
    if(err){
        return console.log(err);
    }
    db = client.db('test');
});

connectDB();

db = mongoose.connection;


var t = new Date().getTime();
const ts = 30; //30초 간격으로 토큰 생성
let N = Math.floor(t / (ts * 1000)); //Unix Time에서 토큰 생성 간격 ts만큼을 나누고 소수점은 버린다
let N_hex = ('000000000000000' + N.toString(16)).substr(-16); //16자리가 되도록 앞에 0 패딩 추가
let m = Buffer.from(N_hex); //N_hex를 byte array로 변환

const random12 = `${Math.random() * Math.pow(10, 20)}`.substring(0, 12); // 12자리 랜덤숫자 생성
const K = base32.encode(random12);
let hmac_hash = crypto.createHmac('sha1', K).update(m).digest('hex');//Hmac hash 구하기

const offset = parseInt(Number(`0x${hmac_hash[hmac_hash.length - 1]}`), 10);

// offset으로부터 4개 바이트 변환
const token_hex_4bytes = hmac_hash.substring(offset * 2, offset * 2 + 4 * 2);
let toekn_hex = '';

toekn_hex += (
    '00' + (Number(`0x${token_hex_4bytes.substring(0, 2)}`) & 0x7f).toString(16)
).substr(-2);

for (let index = 2; index < token_hex_4bytes.length; index += 2) {
    const element = token_hex_4bytes.substring(index, index + 2);
    toekn_hex += ('00' + (Number(`0x${element}`) & 0xff).toString(16)).substr(-2);
}
const token = Number(`0x${toekn_hex}`).toString().substr(-6);

router.post('/login', async(req,res)=>{
    const { id, pw } = req.body;


    try {
		//유저정보 유무 확인
		const user = await User.findOne({ id });
		if (user == null) {
            res.redirect('/user/login?msg=등록되지 않은 사용자 입니다. 다시 로그인하세요.');
		}
		//bcrypt 해쉬암호와 입력값 비교, result: true or flase
		
        
        const match = await bcrypt.compare(pw, user.pw);
		if (match) {
            const privateKey = Math.floor(Math.random() * 1000000);
            session[privateKey] = match;
            db.collection('otp').insertOne({'_id': '1', otp: token}, function(에러, 결과){
            });
            return res
            .setHeader('Set-Cookie', `connect.id=${privateKey};path=/`)
            .status(200)
            .redirect('/otp');                     
		}
        

		//유저 아이디나 비밀번호가 불일치 할 때
    } catch (err) {
        //res.send(alterMove("아이디나 패스워드가 불일치", "/user/login"))
		console.log(err);
	}
})
router.get('/logout', (req,res)=>{
    res.render('index.ejs')
})
router.post('/logout', (req,res)=>{
    
    
    if(req.headers.cookie){
        const [,privateKey] = req.headers.cookie.split('=')
        delete session[privateKey]
        res.setHeader('Set-Cookie','connect.id=delete; Max-age=0; path=/')
        res.redirect('/user/login')
    
    }
    
    else{
        res.redirect('/user/login?msg=로그인부터 하세요')
    }
    
})

module.exports = router;