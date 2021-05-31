var express = require('express');
var router = express.Router();
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

const pool = require('./db')
const session = require('cookie-session');
const sha256 = require('sha256')
const transport = require('./send-mail');
const { sendMail } = require('./send-mail');
const e = require('express');

function makeid(length=4) {
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * 
charactersLength)));
 }
 return result.join('');
}

function makelid(length=5) {
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * 
charactersLength)));
 }
 return result.join('');
}

function findAndReplace(object, value, replacevalue) {
  for (var x in object) {
    if (typeof object[x] == typeof {}) {
      findAndReplace(object[x], value, replacevalue);
    }
    if (object[x] == value) {
      object[x] = replacevalue;
      // break; // uncomment to stop after first replacement
    }
  }
}


function sendEmail(to, subject, message) {
  const mailOptions = {
    from: 'dotmanageapp@gmail.com',
    to,
    subject,
    html: message,
  };
  transport.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
    }
  });
};

var RequiredSoftware = [0.75, 0.88, 1, 1.15, 1.4]
var SizeofProjectDatabase = [0.94, 1, 1.08, 1.16]
var ComplexityofTheProject = [0.7, 0.85, 1, 1.15, 1.3]
var PerformanceRestriction = [1, 1.11, 1.3]
var MemoryRestriction = [1, 1.06, 1.21]
var VirtualMachineEnvironment = [0.87, 1, 1.15, 1.3]
var RequiredTurnaboutTime = [.94, 1, 1.07, 1.15]
var AnalysisCapability = [1.46, 1.19, 1, 0.86, 0.71]
var ApplicationExperience = [1.29, 1.13, 1, 0.91, 0.82]
var SoftwareEngineerCapability = [1.42, 1.17, 1, 0.86, 0.7]
var VirtualMachineExperience = [1.21, 1.1, 1, 0.9]
var ProgrammingExperience = [1.14, 1.07, 1, 0.95]
var SoftwareEngineeringMethods = [1.24, 1.1, 1, 0.91, 0.82]
var UseofSoftwareTools = [1.24, 1.1, 1, 0.91, 0.83]
var DevelopmentTime = [1.23, 1.08, 1, 1.04, 1.1]
var ProjectType = ["Organic", 'Semi-Detached', "Embeded"]
var staticValues = [[2.4, 1.05, 2.5, 0.38], [3, 1.12, 2.5, 0.35], [3.6, 1.2, 2.5, 0.32]]
var scale = ["Very-Low", "Low", "Nominal", "High", "Very-High"]
var scale2 = ["Nominal", "High", "Very-High"]
var scale3 = ["Low", "Nominal", "High", "Very-High"]


/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/signup');
  }
});

router.get('/signup', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard');
  } else {
    res.render('Signup');
  }
})

router.get('/user-not-found-signup', function (req, res, next) {
  res.render("UserSignup.ejs")
})

router.post('/signup', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard');
  } else {
    pool.connect();
    pool.query('select count(uemail) from users where uemail = $1', [req.body.email], (err, resp) => {
      if (err) {
        res.redirect('/error');
      }
      else {
        if (resp.rows[0].count == 1) {

          res.redirect("/account-already-exists-login");
        } else {
          pool.query('select count(uname) from users where uname=$1', [req.body.username], (errorrr, responsee) => {
            if (errorrr) {
              console.log("error")
              res.redirect('/error');
            } else {
              if (responsee.rows[0].count == 1) {
                res.redirect("/usernameunavailable");
              }
              else {
                pool.query('insert into users (uname,uemail,upassword) values ($1,$2,$3);', [req.body.username, req.body.email, sha256(req.body.password)], function (err, respons) {
                  if (err) {
                    res.redirect('/error')
                    console.log(err);
                  } else {
                    sendEmail(req.body.email, "Welcome to Dotmanage App", "<h2>Sigup was sucessful.</h2>");
                    res.redirect('/login')
                  }
                })
              }
            }
          })

        }
      }
    })
  }
})

router.get('/usernameunavailable', function (req, res, next) {
  res.render('usernameunavailable');
})

router.get('/jointeam',function(req,res,next){
  if(req.session.username){
  res.render('jointeam')
}else{
    res.redirect('/login');
  }
})

router.post('/jointeam',function(req,res,next){
  pool.query("select teamid from team where tcode=$1",[req.body.code],function(err,resp){
    if(err){
      res.redirect('/err')
    }else{
      if(resp.rowCount!=1){
        res.send("Invalid Code")
      }else{
        pool.query("select count(*) from role where uid=$1 and teamid in (select teamid from team where tcode=$2)",[req.session.userid,req.body.code],function(error,respo){
          if(error){
            res.redirect('/err')
          }else{
            console.log(respo.rows);
            if(respo.rows[0].count!=0){
              res.flash("You are already in the team");
            }else{
              pool.query("insert into role (uid,teamid,role) values($1,$2,FALSE)",[req.session.userid,resp.rows[0].teamid],function(errorr,response){
                if(errorr){
                  res.redirect('/error')
                }else{
                  pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)",[req.session.userid],function(errorr,responses){
                    if(errorr){
                      console.log(errorr)
                    }else{
                      var data = {
                        "username": req.session.username,
                        "teams":responses.rows
                      }
                      req.session.data=data;
                    res.redirect('/dashboard');
                    }
                  })
                }
              })
            }
          }
        })
      }
    }
  })
})

router.get('/login', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard')
  } else {
    res.render('Login.ejs');
  }
})

router.get('/account-already-exists-login', function (req, res, next) {
  res.render('Login-alreadyexists.ejs')
})

router.get('/invalid-credentials', function (req, res, next) {
  res.render('Login_invalid.ejs')
})

router.post('/login', function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  }
  else {
    pool.connect();
    pool.query('select count(*) from users where uemail=$1', [req.body.email], function (err, resp) {
      if (err) {
        res.redirect('/error')
      } else {
        if (resp.rows[0].count == 0) {
          res.redirect('/user-not-found-signup');
        } else {
          pool.query('select *from users where uemail=$1', [req.body.email], function (error, response) {
            if (sha256(req.body.password) == response.rows[0].upassword) {
              req.session.username = response.rows[0].uname.toString();
              req.session.userid = response.rows[0].uid.toString();
              req.session.useremail = req.body.email;
              req.session.data=null;
              res.redirect('/dashboard');
            } else {
              res.redirect('/invalid-credentials')
            }
          })
        }
      }
    })
  }
})

router.get('/createteam', function (req, res, next) {
  res.render("CreateTeam")
})

router.post('/createteam', function (req, res, next) {
  console.log(req.body);
  var a=makeid()+'-'+makelid()+'-'+makeid();
  console.log(req.body);
  pool.query("insert into team (tcode,tname,tdescription) values ($1,$2,$3)",[a,req.body.tname,req.body.tdes],function(err,resp){
    if(err){
      res.redirect('/err');
    }else{
      pool.query("select teamid from team where tcode=$1",[a],function(error,respo){
        if(error){
          res.redirect(
            '/error'
          )
        }
      else{
        console.log(req.session.userid);
      pool.query("insert into role (role,uid,teamid) values(TRUE,$1,$2)",[req.session.userid,respo.rows[0].teamid],function(erro,respon){
        if(erro){
          console.log(erro);
        }else{
          pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)",[req.session.userid],function(errorr,response){
            if(errorr){
              console.log(errorr)
            }else{
              var data = {
                "username": req.session.username,
                "teams":response.rows
              }
              console.log(data)
              req.session.data=data;
            res.redirect('/dashboard');
            }
          })
        }
      })}
    })
    }
  })
})

router.get('/test', function (req, res, next) {
  res.render("test.ejs")
})

router.get('/settask', function (req, res, next) {
  res.render("SetTask")
})

router.post('/settask', function (req, res, next) {

})


router.get('/dashboard', function (req, res, next) {
  //TODO: GET Teams list the user is present in and send the json data
  if (!(req.session.username)) {
    res.redirect('/login')
  } else {
    if((req.session.data)){
      console.log(req.session.data);
      res.render("userlanding", req.session.data);
    }else{
    pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)",[req.session.userid],function(err,resp){
      if(err){
        console.log(err)
      }else{
        console.log(resp)
        var data = {
          "username": req.session.username,
          "teams":resp.rows
        }
        console.log(data)
        req.session.data=data;
      res.render("userlanding", data);
      }
    })
  }
  }

})

router.get('/unavailable', function (req, res, next) {
  res.render('unavailable');
})

router.get('/team', function (req, res, next) {
  if(!req.session.username){
    res.redirect('/login')
  }else{
    console.log(req.session.userid)
    pool.query("select count(*) from role where uid=$1 and teamid =$2",[req.session.userid,req.query.tid],function(err,resp){
      if(err){
        console.log(err)
        res.redirect('/error')
      }else{
        if(resp.rows[0].count==1){
          res.render("teamlanding",{tname: req.query.tname,teamid: req.query.tid,userid: req.session.userid});
      }else{
        res.redirect('/forcingentry')
      }
    }
    })
}
})

router.get("/forcingentry",function(req,res,next){
  if(req.session.username){
    res.redirect('/logout')
  }else{
    res.redirect('/login')
  }
})

router.get("/settings",function(req,res,next){
  pool.query("select role,users.uid,uname,uemail from users inner join role on users.uid = role.uid inner join team on team.teamid = role.teamid where role.teamid = $1 ",[req.query.teamid],function(err,resp){
    var val={teamid: req.query.teamid,tname: req.query.tname,users:resp.rows}
    var mt=0;
    for (let i=0;i<val.users.length;i++){
      if(req.session.userid==val.users[i].uid){
        console.log(val.users[i].uid);
        if(val.users[i].role){
          console.log(val.users[i].uid);
          mt=1;
        }
      }
    }
    if(mt==1){
    res.render("mteamsettings",val);}else{
      res.render("teamsettings",val);
    }
  })
  
})

router.get('/costestimated', function (req, res, next) {
  console.log(req.query)
  try {
    var val = req.query.ProjectType.toString()
    var type = ProjectType.indexOf(val);
    console.log(req.query)
    var a = staticValues[type][0];
    var b = staticValues[type][1];
    var c = staticValues[type][2];
    var d = staticValues[type][3];
    var eaf = 1;
    updated = req.query
    findAndReplace(updated, "None", "Nominal");




    eaf = eaf * RequiredSoftware[scale.indexOf(updated.Requirements.toString())]
    eaf = eaf * SizeofProjectDatabase[scale3.indexOf(updated.Database.toString())]
    eaf = eaf * ComplexityofTheProject[scale.indexOf(updated.Complexity.toString())]

    eaf = eaf * PerformanceRestriction[scale2.indexOf(updated.Performance.toString())]
    eaf = eaf * MemoryRestriction[scale2.indexOf(updated.Memory.toString())]
    eaf = eaf * VirtualMachineEnvironment[scale3.indexOf(updated.vmenvironment.toString())]
    eaf = eaf * RequiredTurnaboutTime[scale3.indexOf(updated.TurnaboutTime.toString())]

    eaf = eaf * AnalysisCapability[scale.indexOf(updated.AnalysisCapability.toString())]
    eaf = eaf * ApplicationExperience[scale.indexOf(updated.AppExperience.toString())]
    eaf = eaf * SoftwareEngineerCapability[scale.indexOf(updated.SoftwareCapability.toString())]
    eaf = eaf * VirtualMachineExperience[scale.indexOf(updated.vmexperience.toString())]
    eaf = eaf * ProgrammingExperience[scale.indexOf(updated.ProgrammingExperience.toString())]

    eaf = eaf * SoftwareEngineeringMethods[scale.indexOf(updated.sem.toString())]
    eaf = eaf * UseofSoftwareTools[scale.indexOf(updated.ust.toString())]
    eaf = eaf * DevelopmentTime[scale.indexOf(updated.DevelopmentTime.toString())]
    console.log(eaf);
    var effort = (a * Math.pow(req.query.kloc, b) * eaf).toFixed(2)
    var scheduledTime = (c * Math.pow(effort, d)).toFixed(2);
    var results = {
      effortE: effort,
      scheduledTimeD: scheduledTime
    }
    console.log(results);
    res.render('CostEstimationoutput',results);
  } catch (error) {
    console.log(error)
  }

})

router.get('/costestimation', function (req, res, next) {
  res.render('CostEstimate')
})

router.get('/forgotpassword', function (req, res, next) {
  res.render('forgotpassword');
})

router.post('/forgotpassword', function (req, res, next) {
  if(req.session.username){
    res.redirect('/dashboard')
  }else{
  pool.connect()
  pool.query('select count(uemail) from users where uemail = $1', [req.body.email], (err, resp) => {
    if (resp.rows[0].count == 1) {
      var token = Math.floor((Math.random() * 100000000000) + 1000000);
      var hashtoken = sha256(token.toString())
      var link = "https://dotmanage.herokuapp.com/changepassword?email=" + req.body.email + "&token=" + hashtoken;
      console.log(link);
      localStorage.setItem(req.body.email, token.toString())
      var myHour = new Date().getTime();
      var Hours = .50;
      console.log(myHour)
      myHour = myHour + (Hours * 60 * 60 * 1000)
      console.log(myHour)
      localStorage.setItem("Time", myHour);
      var message = '<h2>Use this link to reset your password</h2><h4>This link will expire after 30 mins.</h4><a href="' + link + '"><button type="submit" style="border-radius: 5px;background-color: rgba(73,115,162,1) ;width: 20%;position: center;margin: 3%;padding: 1%;color: aliceblue;" >Reset Password</button></a>';
      console.log(message);
      sendEmail(req.body.email, "Forgot Password", message)
      res.redirect('/checkmail')
    }
    else {
      res.redirect('/accountnotfound')
    }
  })
}
})

router.get('/checkmail', function (req, res, next) {
  if(localStorage.getItem("Time")){
  res.render('checkmail')}
  else{
    res.redirect('/forgotpassword')
  }
})

router.get('/accountnotfound',function(req,res,next){
  res.render('accountnotfound')
})

router.get('/changepassword', function (req, res, next) {
  if(req.session.username){
    res.redirect('/dashboard')
  }else{
  var time = new Date().getTime();
  if (time > localStorage.getItem("Time")) {
    res.redirect('/expired')
  } else {
    if (localStorage.getItem(req.query.email)) {
      if (sha256(localStorage.getItem(req.query.email).toString()) == req.query.token) {
        var data={
          email:req.query.email,
          token:req.query.token
        }
        req.session.passwordChange = true;
        res.render('changepassword',data);
      } else {
        res.redirect('/invalidlink');
      }
    } else {
      res.redirect('/expired');
    }
  }
}
})

router.post('/changepassword',function(req,res,next)
{
  if(req.session.username){
    res.redirect('/dashboard')
  }else{
  if(req.body.token==sha256(localStorage.getItem(req.body.email))){
  pool.connect();
  pool.query("update users set upassword=$1 where uemail=$2",[sha256(req.body.newpassword),req.body.email],(err,resp)=>{
    if(err){
      res.redirect('/error')
    }else{
      localStorage.clear();
      res.redirect('/passwordupdated')
    }
  })}else{
    res.redirect('/forgotpassword');
  }
}
})

router.get('/passwordupdated',function(req,res,next){
  if(!req.session.passwordChange){
    res.redirect('/login')
  }else{
    req.session.passwordChange=null;
    res.render('passwordupdated')
  }
})

router.get('/expired', function (req, res, next) {
  res.render('expired')
})
router.get('/invalidlink', function (req, res, next) {
  res.render('Signup2')
})

router.get('/logout', function (req, res, next) {
  req.session.username = null;
  req.session.destroy
  res.redirect('/login')
})

router.get('/costestimation',function(req,res,next){
  res.render("CostEstimationInput")
})

router.get('/test',function(req,res,next){
  res.render("test.ejs")
})

module.exports = router;
