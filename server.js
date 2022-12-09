const { query } = require('express');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const methodOverride = require('method-override');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(session({secret : '비밀코드', resave : true, saveUninitialiezed : false}));
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use('public', express.static('public'));

var db;

MongoClient.connect('mongodb+srv://hyeongtae:rlagudxo97@cluster0.p1tihon.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true }, function (err, client) {
    if (err) return console.log(err)
	db = client.db('todoapp');
});

app.use(express.urlencoded({extended: true})) 


var title;
var day;


app.listen(8080, function(){
    console.log('listening on 8080');
});

app.get('/', function(request, response){
    response.sendFile(__dirname + '/index.html');
});

app.get('/write', function(request, response){
    response.sendFile(__dirname + '/write.html');
});

app.post('/add', function(request, response){
    response.send('전송완료');
    db.collection('counter').findOne({ name : '게시물갯수' }, function(err, result){
        if (err){
            console.log(err);
            alert.apply("에러발생");
        }
        else{
        var totalcount = result.totalPost;

        db.collection('post').insertOne( { _id : totalcount + 1, 제목 : request.body.todo, 날짜 : request.body.day } , function(err, result){
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
        response.render('list.ejs', {posts : result});
    });
    
});

app.delete('/delete', function(req, res){
    console.log(req.body._id);
    req.body._id = parseInt(req.body._id);
    console.log(req.body._id);
    db.collection('post').deleteOne({_id : req.body._id}, function(err, result){
    res.status(200).send({ message : '삭제 성공'});
    });
});

app.get('/detail/:pageNumber', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.pageNumber)}, function(err, result){

        console.log(result);
        res.render('detail.ejs', {data : result});

    });
});

app.get('/edit/:pageNumber', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.pageNumber)}, function(err, result){

        res.render('edit.ejs', {data : result});
    });
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({_id : parseInt(req.body.id)}, {$set : {제목 : req.body.todo, 날짜 : req.body.day}}, function(err, result){

        res.redirect('/');
    });
});

app.get('/login', function(req, res){
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/')
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));