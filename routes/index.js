var express = require('express');
var router = express.Router();

const pool = require('./db')
const session=require('cookie-session');
const sha256=require('sha256')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/signup');
});

router.get('/signup',function(req,res,next){
  res.render('Signup.ejs');
})

router.get('/user-not-found-signup',function(req,res,next){
  res.render("UserSignup.ejs")
})

router.post('/signup',function(req,res,next){
  pool.connect();
  pool.query('select count(uemail) from users where uemail = $1',[req.body.email],(err,resp)=>{
    if(err){
      res.redirect('/error');
    }
    else{
      if(resp.rows[0].count==1){
        
        res.redirect("/account-already-exists-login");
      }else{
        pool.query('insert into users (uname,uemail,upassword) values ($1,$2,$3);',[req.body.username,req.body.email,sha256(req.body.password)],function(err,respons){
          if(err){
            res.redirect('/error')
            console.log(err);
          }else{
            res.redirect('/login')
            pool.end()
          }
        })
      }
    }
  })
  
})

router.get('/login',function(req,res,next){
  res.render('Login.ejs');
})

router.get('/account-already-exists-login',function(req,res,next){
  res.render('Login-alreadyexists.ejs')
})

router.get('/invalid-credentials',function(req,res,next){
  res.render('Login_invalid.ejs')
})

router.post('/login',function(req,res,next){
  pool.connect()
  pool.query('select count(*) from users where uemail=$1',[req.body.email],function(err,resp){
    if(err){
      res.redirect('/error')
    }else{
      if(resp.rows[0].count==0){
        res.redirect('/user-not-found-signup');
      }else{
        pool.query('select *from users where uemail=$1',[req.body.email],function(error,response){
          if(sha256(req.body.password)==response.rows[0].upassword){
            req.session.username=response.rows[0].uname.toString();
            req.session.userid=response.rows[0].uid.toString();
            pool.end()
            res.redirect('/dashboard');
          }else{
            res.redirect('/invalid-credentials')
          }
        })
      }
    }
  })
})

router.get('/dashboard',function(req,res,next){
  if(req.session.username){
    res.send("Welcome to Dashboard. This website is underconstruction.")
  }else{
    res.redirect('/login');
  }
})

router.get('/createteam',function(req,res,next){
  res.render("CreateTeam")
})

module.exports = router;
