const express = require('express');
const app = express();
const mongoose = require('mongoose');
const connectDB = require("./config/db");
const User = require("./models/User"); // User model 불러오기
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");        // 암호화 모듈
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.json({extended: false}));
const router = require('./routes/index.js');
app.use(router);
const port = 8080;
const base32 = require('base32');
const crypto = require('crypto');
const server = app.listen(port);
const {alterMove} = require('./util/alterMove.js')
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');

var db;
MongoClient.connect('mongodb+srv://poh1005:als96321%40@cluster0.q4o5jcp.mongodb.net/?retryWrites=true&w=majority', function(err,client){
    if(err){
        return console.log(err);
    }
    db = client.db('test');
});

connectDB();

const io = require('socket.io')(server);
const rtsp = require('rtsp-ffmpeg');
// ffmpeg를 이용해서 url을 설정해줘서 웹스트리밍

db = mongoose.connection;

var ffmpeg = new rtsp.FFMpeg({ // 스트리밍이 안됐던 이유: ip가 바뀌는 즉 새로운 환경에 갔을때 초기화를 해서 다시 ip카메라를 설정해 줘야하는데 카메라 계정도 다시 설정해줘야하기때문에 앱에서 다시 설정하고 vscode도 동기화?가 되어야하므로 껐다 켜주고 연결하면 됨.
    input: 'rtsp://stream:stream@192.168.16.30:554/stream1',
    rate: 10,
    resolution:'640x480',
    quality: 3
});

var stream = new rtsp.FFMpeg({input: ffmpeg.input});
io.on('connection', function(socket) {
    var pipeStream = function(data) {
        socket.emit('data', data.toString('base64'));
    };
    stream.on('data', pipeStream);
    socket.on('disconnect', function() {
        stream.removeListener('data', pipeStream);
    });
});
app.get('/list1', (req, res) => {
    db.collection('tests').find().toArray(function(에러, 결과){
        res.send(결과);
    })
})
app.get('/list2', (req, res) => {
    db.collection('auth').find().toArray(function(에러, 결과){
        res.send(결과);
    })
})
app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
});
app.get('/streaming', (req,res)=>{
    if(req.headers.cookie){
        const [,privateKey] = req.headers.cookie.split('=')
        const userInfo = session[privateKey]
        res.render('streaming.ejs',{
            userInfo,
        });
    } else{res.redirect('/user/login?msg=로그인부터 하세요')}
    
})
app.post('/api', (req, res) => {
    db.collection('otp').find({_id:req.body._id}, {otp:1}).toArray(function(에러, 결과){
        res.send(결과);
    })
})
app.get('/insert', (req, res) => {
    db.collection('auth').insertOne({_id: '1', in:'1'}, function(에러, 결과){
        console.log('저장완료');
    })
})
app.get('/otp', function(req,res){
    db.collection("otp").find({"_id" : "1"}).toArray(function(err,result){
       // console.log(result);
       try{
        res.render('otp.ejs', { a : result[0].otp, b : "success"});
       }
       catch(err){
        res.writeHead(200, {
            "Content-Type": "text/html;charset=utf8"
          });
        res.write("<script>alert('다시 시도해주십시오!')</script>");
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
        db.collection('otp').insertOne({_id: '1', otp: token}, function(에러, 결과){
        });
        res.write("<script>window.location=\"/user/login\"</script>");
        res.end();
       }
    })
});

app.post('/otp', function(req,res) {
    db.collection("auth").find({"_id" : "1"}).toArray(function(err,result){
        try{
            if(result[0].in == '1'){
                db.collection("auth").remove();    
                db.collection("otp").remove();
                return res
                .status(200)
                .redirect('/streaming');
            }   
    }
    catch(err){
        res.writeHead(200, {
            "Content-Type": "text/html;charset=utf8"
          });
        res.write("<script>alert('애플리케이션에서 인증이 완료되지 않았습니다.')</script>");
        db.collection("otp").remove();
        res.write("<script>window.location=\"/login\"</script>");
        res.end();
        }
    })
})

app.get('/register', function(req,res){
    res.render('register.ejs');
});
app.post('/register', async (req, res) => {
    // req의 body 정보를 사용하려면 server.js에서 따로 설정을 해줘야함
    const { id, pw, username, email, tel } = req.body;

    try {
      // id를 비교하여 user가 이미 존재하는지 확인
      let user = await User.findOne({ id });
			if (user) {
                res.writeHead(200, {
                    "Content-Type": "text/html;charset=utf8"
                });
                res.write('<h1>사용자 추가 실패<h1>');
                res.write('<br><a href="/register">이미 사용중인 계정입니다. 다시 회원가입 해주세요. </a>');
                res.end();
        // return res
           //.status(400)
          // .json({ errors: [{ msg: "이미 사용중인 아이디입니다. 다시 설정해주세요" }] });
      }
			
      // user에 name, email, password 값 할당
      user = new User({
        id,
        pw,
        username,
        email,
        tel
      });

      // password를 암호화 하기
      const salt = await bcrypt.genSalt(10);
      user.pw = await bcrypt.hash(pw, salt);

      await user.save(); // db에 user 저장
      res.send(alterMove("회원가입이 완료되었습니다. 다시 로그인 해주세요. ", "/user/login"))
    } catch (error) {
      console.error(error.message);
    }    
});

// const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
// const { stringify } = require('querystring');

// //미들웨어 사용. 요청 응답 중간에 뭔가 실행되는 코드
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
// app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static(__dirname + '/public')); //정적 파일 서비스(CSS 파일)

// app.get('/login',function(req,res){
//     res.render('login.ejs');
// });
// app.post('/login', //passport.authenticate('local', {
//     //failureRedirect : '/fail'
//  async(req, res) => {
//     const { id, pw } = req.body;
//     try {
// 		//유저정보 유무 확인
// 		const user = await User.findOne({ id });
// 		if (user == null) {
// 			res.writeHead(200, {
//                     "Content-Type": "text/html;charset=utf8"
//                 });
//                 res.write('<h1>아이디 혹은 비밀번호가 일치하지 않습니다.<h1>');
//                 res.write('<br><a href="/login">다시 로그인 </a>');
//                 res.end();
// 		}
// 		//bcrypt 해쉬암호와 입력값 비교, result: true or flase
// 		const match = await bcrypt.compare(pw, user.pw);
// 		if (match) {
//             var t = new Date().getTime();
//             const ts = 30; //30초 간격으로 토큰 생성
//             let N = Math.floor(t / (ts * 1000)); //Unix Time에서 토큰 생성 간격 ts만큼을 나누고 소수점은 버린다
//             let N_hex = ('000000000000000' + N.toString(16)).substr(-16); //16자리가 되도록 앞에 0 패딩 추가
//             let m = Buffer.from(N_hex); //N_hex를 byte array로 변환

//             const random12 = `${Math.random() * Math.pow(10, 20)}`.substring(0, 12); // 12자리 랜덤숫자 생성
//             const K = base32.encode(random12);
//             let hmac_hash = crypto.createHmac('sha1', K).update(m).digest('hex');//Hmac hash 구하기

//             const offset = parseInt(Number(`0x${hmac_hash[hmac_hash.length - 1]}`), 10);

//             // offset으로부터 4개 바이트 변환
//             const token_hex_4bytes = hmac_hash.substring(offset * 2, offset * 2 + 4 * 2);
//             let toekn_hex = '';

//             toekn_hex += (
//                 '00' + (Number(`0x${token_hex_4bytes.substring(0, 2)}`) & 0x7f).toString(16)
//             ).substr(-2);

//             for (let index = 2; index < token_hex_4bytes.length; index += 2) {
//                 const element = token_hex_4bytes.substring(index, index + 2);
//                 toekn_hex += ('00' + (Number(`0x${element}`) & 0xff).toString(16)).substr(-2);
//             }

//             const token = Number(`0x${toekn_hex}`).toString().substr(-6);
//             db.collection('otp').insertOne({_id: '1', otp: token}, function(에러, 결과){
//             });
//             return res
//             .status(200)
//             .redirect('/otp');
// 		}
// 	} catch (err) {
// 		console.log(err);
// 		return res.status(400).send({ err: err.message });
// 	}
// });

// passport.serializeUser(function(user, done){
//     done(null, user.id)
// });
// // 로그인한 유저의 세션아이디를 바탕으로 개인정보를 DB에서 찾는 역할
// passport.deserializeUser(function(아이디, done){
//     db.collection('tests').findOne({id : 아이디}, function(err, res){
//         done(null, res)
//     })
// });
