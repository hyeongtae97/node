const { query } = require('express');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const methodOverride = require('method-override');
const requestIp = require('request-ip');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
require('dotenv').config();


app.use(session({secret : '비밀코드', resave : true, saveUninitialiezed : false}));
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use('public', express.static('public'));

var db;

MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function (err, client) {
    if (err) return console.log(err)
	db = client.db('todoapp');
});

app.use(express.urlencoded({extended: true})) 


var title;
var day;


app.listen(process.env.PORT,'0.0.0.0', function(){
    console.log("HT's server is now starting, listening on 8080");
});

app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
    console.log(" '/' request, client IP : " + requestIp.getClientIp(request));
});

app.get('/write', function(request, response){
    response.sendFile(__dirname + '/write.html');
    console.log(" '/write' request, client IP : " + requestIp.getClientIp(request));
});

app.get('/detail/:pageNumber', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.pageNumber)}, function(err, result){
        console.log(" '/detailPage' request, client IP : " + requestIp.getClientIp(req));
        console.log(result);
        res.render('detail.ejs', {data : result});

    });
});

app.get('/edit/:pageNumber', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.pageNumber)}, function(err, result){
        console.log(" '/editPage' request, client IP : " + requestIp.getClientIp(req));
        res.render('edit.ejs', {data : result});
    });
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({_id : parseInt(req.body.id)}, {$set : {제목 : req.body.todo, 날짜 : req.body.day}}, function(err, result){
      console.log(" '/editPut' request, client IP : " + requestIp.getClientIp(req));
        res.redirect('/');
    });
});

app.get('/login', function(req, res){
    console.log(" '/login' request, client IP : " + requestIp.getClientIp(req));
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', { failureRedirect : '/fail' }), function(req, res){
    console.log(" '/loginPost' request, client IP : " + requestIp.getClientIp(req));
    res.redirect('/')
});



passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (userid, password, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: userid }, function (err, result) {
      if (err) return done(err)
  
      if (!result) return done(null, false, { message: '존재하지않는 아이디요' })
      if ( password === result.pw) {
        console.log('로그인성공')
        return done(null, result)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  })); 

  // done(서버에러, 성공시 사용자 DB 데이터, 에러메시지)
  // 실제 구현 할 때는 '회원가입시 비밀번호' +' 로그인 시 사용자 입력 비밀번호' 암호화 하여 비교해야함 

    // 세션을 만들어주는 passport 라이브러리
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
    // 세션을 해석하는 라이브러리(어떤사람인지)
  passport.deserializeUser(function (useri, done) {
    db.collection('login').findOne({ id: useri }, function(err, result){
      done(null, result)
    });
  }); 

  function authlogin(req, res, next){
    if(req.user){
      next()
    }else {
      console.log(" '/myPage' request, client IP : " + requestIp.getClientIp(req));
      res.send("<script>alert('로그인 먼저 하셔야 하는대요?');document.location.href='/login';</script>");
    }
  }

  app.get('/register', (req, res) => {
    res.render('register.ejs')
  })


  app.post('/register', (req, res) => {
    db.collection('login').insertOne({id:req.body.id, pw:req.body.pw}, function(err,result){
      res.send("<script>alert('가입완료');document.location.href='/';</script>");
      //res.redirect('/')
    })
  })


  app.get('/mypage', authlogin, function(req, res){
    console.log(" '/myPage' request, client IP : " + requestIp.getClientIp(req));
    console.log(req.user);
    res.render('mypage.ejs', {userinfo : req.user});
  });

  app.post('/add', authlogin, function(request, response){
      response.send("<script>alert('전송완료');document.location.href='/write';</script>");
      console.log(" '/add' request, client IP : " + requestIp.getClientIp(request));
      db.collection('counter').findOne({ name : '게시물갯수' }, function(err, result){
        var totalcount = result.totalPost;
        var content ={ _id : totalcount + 1, 제목 : request.body.todo, 날짜 : request.body.day, 작성자 : request.user._id };
          if (err){
              console.log(err);
              alert.apply("에러발생");
          }
          else{
          db.collection('post').insertOne(content , function(err, result){
              if (err){
                  return console.log(err);
              }
              else{
              console.log('저장완료')
              db.collection('counter').updateOne( {name : '게시물갯수' } , { $inc : { totalPost : 1 } } , function(err, result){
                  if(err) {
                      return console.log(err);
                  }
                  else {
                  return console.log('수정완료');

                  }
                });
              }
            });
          }
  
      });
    });

  
  app.get('/list', function(request, response){
    db.collection('post').find().toArray(function(err,result){
      //var whois = request.user._id;
      //console.log(whois);
      console.log(request.user)
        response.render('list.ejs', {posts : result, username : request.user});
        console.log(" '/list' request, client IP : " + requestIp.getClientIp(request));
    });
  });

  app.delete('/delete', function(req, res){
      console.log(req.body._id);
      console.log(" '/delete' request, client IP : " + requestIp.getClientIp(req));
      req.body._id = parseInt(req.body._id);
      content = {_id : req.body._id, 작성자 : req.user._id};
      console.log(req.body._id);
      db.collection('post').deleteOne(content, function(err, result){
      res.status(200).send({ message : '삭제 성공'});
      });
  });

  app.get('/search', (req,res) => {
    var searchitem = [
      {
        $search: {
          index: 'titleSearch',
          text: {
            query: req.query.value,
            path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      },
      { $sort : {_id : 1}}
  ]
    console.log(req.query.value)
    db.collection('post').aggregate(searchitem).toArray((err, result) => {
      console.log(result)
      res.render('search.ejs',{posts:result})
    })
  });
