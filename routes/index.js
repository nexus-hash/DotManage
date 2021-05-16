var express = require('express');
var router = express.Router();

const pool = require('./db')
const session=require('cookie-session');
const sha256=require('sha256')

var RequiredSoftware = [0.75,0.88,1,1.15,1.4]
var SizeofProjectDatabase	 = [0.94,1,1.08,1.16]
var ComplexityofTheProject	 = [0.7,0.85,1,1.15,1.3]
var PerformanceRestriction	 = [1,1.11,1.3]
var MemoryRestriction	 = [1,1.06,1.21]
var VirtualMachineEnvironment	 = [0.87,1,1.15,1.3]
var RequiredTurnaboutTime	 = [.94,1,1.07,1.15]
var AnalysisCapability	 = [1.46,1.19,1,0.86,0.71]
var ApplicationExperience	 = [1.29,1.13,1,0.91,0.82]
var SoftwareEngineerCapability	= [1.42,1.17,1,0.86,0.7]
var VirtualMachineExperience	 = [1.21,1.1,1,0.9]
var ProgrammingExperience		= [1.14,1.07,1,0.95]
var SoftwareEngineeringMethods		= [1.24,1.1,1,0.91,0.82]
var UseofSoftwareTools		= [1.24,1.1,1,0.91,0.83]
var DevelopmentTime		= [1.23,1.08,1,1.04,1.1]
var ProjectType = ["Organic","Semi-detached","Embeded"]
var staticValues = [[2.4,1.05,2.5,0.38],[3,1.12,2.5,0.35],[3.6,1.2,2.5,0.32]]




/* GET home page. */
router.get('/', function(req, res, next) {
  if(req.session.username){
    res.redirect('/dashboard');
  }else{
  res.redirect('/signup');}
});

router.get('/signup',function(req,res,next){
  if(req.session.username){
    res.redirect('/dashboard');
  }else{
  res.render('Signup');}
})

router.get('/user-not-found-signup',function(req,res,next){
  res.render("UserSignup.ejs")
})

router.post('/signup',function(req,res,next){
  if(req.session.username){
    res.redirect('/dashboard');
  }else{
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
}
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
  if(req.session.username){
    res.redirect("/dashboard");
  }
  else{
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
}
})

router.get('/createteam',function(req,res,next){
  res.render("CreateTeam")
})

router.post('/createteam',function(req,res,next){
  console.log(req.body);
  res.redirect('/user');
})

router.get('/test',function(req,res,next){
  res.render("test.ejs")
})

router.get('/settask',function(req,res,next){
  res.render("SetTask")
})

router.post('/settask',function(req,res,next){

})


router.get('/dashboard',function(req,res,next){
  //TODO: GET Teams list the user is present in and send the json data
  var data={
    "username":req.session.username
  }
  console.log(data)
  res.render("userlanding",data);
})

router.get('/team',function(req,res,next){
  //TODO: GET Task list currently active in the Team and send the json data
  res.render("teamlanding")
})

router.get('/costestimated',function(req,res,next){


})

router.get('/costestimation',function(req,res,next){
  res.render('CostEstimate')
})

router.get('/logout',function(req,res,next){
  req.session.username=null;
  req.session.destroy
  res.redirect('/login')
})

module.exports = router;
