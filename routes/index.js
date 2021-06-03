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
const url = require('url');
const { escapeXML } = require('ejs');

function makeid(length = 4) {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}

function makelid(length = 5) {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
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

function deadlinecheck() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();

  today = dd + '-' + mm + '-' + yyyy;
  return today;
}

function checkdates(d1, d2) {
  var parts = d1.split('-');
  var d1 = Number(parts[2] + parts[1] + parts[0]);
  console.log(d1)
  var parts = d2.split('-');
  var d2 = Number(parts[2] + parts[1] + parts[0]);
  console.log(d2)
  return d1 > d2
}

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
    res.redirect('/login');
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

router.get('/jointeam', function (req, res, next) {
  if (req.session.username) {
    res.render('jointeam')
  } else {
    res.redirect('/login');
  }
})

router.post('/jointeam', function (req, res, next) {
  pool.query("select teamid from team where tcode=$1", [req.body.code], function (err, resp) {
    if (err) {
      res.redirect('/err')
    } else {
      if (resp.rowCount != 1) {
        res.send("Invalid Code")
      } else {
        pool.query("select count(*) from role where uid=$1 and teamid in (select teamid from team where tcode=$2)", [req.session.userid, req.body.code], function (error, respo) {
          if (error) {
            res.redirect('/err')
          } else {
            console.log(respo.rows);
            if (respo.rows[0].count != 0) {
              res.send("You are already in the team");
            } else {
              pool.query("insert into role (uid,teamid,role) values($1,$2,FALSE)", [req.session.userid, resp.rows[0].teamid], function (errorr, response) {
                if (errorr) {
                  res.redirect('/error')
                } else {
                  pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)", [req.session.userid], function (errorr, responses) {
                    if (errorr) {
                      console.log(errorr)
                    } else {
                      var data = {
                        "username": req.session.username,
                        "teams": responses.rows
                      }
                      req.session.data = data;
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
              req.session.data = null;
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
  var a = makeid() + '-' + makelid() + '-' + makeid();
  console.log(req.body);
  pool.query("insert into team (tcode,tname,tdescription) values ($1,$2,$3)", [a, req.body.tname, req.body.tdes], function (err, resp) {
    if (err) {
      res.redirect('/err');
    } else {
      pool.query("select teamid from team where tcode=$1", [a], function (error, respo) {
        if (error) {
          res.redirect(
            '/error'
          )
        }
        else {
          console.log(req.session.userid);
          pool.query("insert into role (role,uid,teamid) values(TRUE,$1,$2)", [req.session.userid, respo.rows[0].teamid], function (erro, respon) {
            if (erro) {
              console.log(erro);
            } else {
              pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)", [req.session.userid], function (errorr, response) {
                if (errorr) {
                  console.log(errorr)
                } else {
                  var data = {
                    "username": req.session.username,
                    "teams": response.rows
                  }
                  console.log(data)
                  req.session.data = data;
                  res.redirect('/dashboard');
                }
              })
            }
          })
        }
      })
    }
  })
})

router.get('/test', function (req, res, next) {
  res.render("test.ejs")
})

router.get('/settask', function (req, res, next) {
  console.log(req.query)
  res.render("SetTask",req.query)
})


router.get('/dashboard', function (req, res, next) {
  if (!(req.session.username)) {
    res.redirect('/login')
  } else {
    if ((req.session.data)) {
      console.log(req.session.data);
      res.render("userlanding", req.session.data);
    } else {
      pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)", [req.session.userid], function (err, resp) {
        if (err) {
          console.log(err)
        } else {
          console.log(resp)
          var data = {
            "username": req.session.username,
            "teams": resp.rows
          }
          console.log(data)
          req.session.data = data;
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
  if (!req.session.username) {
    res.redirect('/login')
  } else {
    console.log(req.session.userid)
    pool.query("select count(*) from role where uid=$1 and teamid =$2", [req.session.userid, req.query.tid], function (err, resp) {
      if (err) {
        console.log(err)
        res.redirect('/error')
      } else {
        if (resp.rows[0].count == 1) {
          pool.query("select title,isdone,taskid,to_char(deadline,'DD-MM-YYYY') from task where teamid = $1 ", [req.query.tid], function (erro, respo) {
            if (erro) {
              console.log(erro)
            }
            else {
              console.log(deadlinecheck())
              for(let i=0;i<respo.rows.length;i++){
                if(respo.rows[i].isdone){
                  respo.rows[i].status = 'Completed'
                }else if(checkdates(deadlinecheck(),respo.rows[i].to_char)){
                  respo.rows[i].status = 'Past Due'
                }else{
                  respo.rows[i].status = 'Ongoing'
                }
              }
              
              pool.query("select role from role where uid = $1 and teamid = $2", [req.session.userid, req.query.tid], function (error, respon) {

                if (error) {
                  console.log(error)
                } else {
                  var taskdata = { tname: req.query.tname, teamid: req.query.tid, userid: req.session.userid,tasks:respo.rows };
              console.log(respo.rows)
              console.log(respon.rows[0].role)
                  if (respon.rows[0].role) {
                    console.log("yes")
                    res.render("mteamlanding", taskdata);
                  } else {
                    
                    res.render("teamlanding", taskdata);

                  }
                }
              })
            }
          })
        } else {
          res.redirect('/forcingentry')
        }
      }
    })
  }
})

router.get('/modify',function(req,res,next){
  pool.query("select taskid,teamid,title,description,to_char(deadline, 'YYYY-MM-DD'),isdone,taskcode from task where taskid=$1",[req.query.taskid],function(err,resp){
    if(err){
      console.log(err)
    }else{
      var taskdetails = resp.rows[0]
      if(req.query.status == "Ongoing" || req.query.status == "Past Due"){
      res.render('modify',taskdetails);}else{
        res.render('nmodify',taskdetails);
      }
    }
  })
  
})

router.post('/modify',function(req,res,next){
  pool.query("update task set title = $1, description = $2, deadline = $3 isdone = $4 where taskid = $5",[req.body.tasktitle,req.body.taskdes,req.body.deadline,,req.body.taskid],function(err,resp){
    if(err){
      console.log(err)
    }else{
      pool.query("select uemail from users inner join assign on assign.uid = users.uid where taskid = $1",[req.body.taskid],function(erro,respo){
        for(let i = 0;i<respo.rowCount;i++){
          var alert = '<h2>Modification on Task in Team'+req.body.tname+'</h2><h2>Task Details after modification : </h2><h2>Task titled as '+req.body.tasktitle+'</h2><h2>Deadline: '+req.body.deadline+'</h2>';
                            sendEmail(respo.rows[i].uemail,"Modified Task",alert);
        }
        res.redirect('/dashboard')
      })
    }
  })
})

router.get("/forcingentry", function (req, res, next) {
  if (req.session.username) {
    res.redirect('/logout')
  } else {
    res.redirect('/login')
  }
})

router.get("/settings", function (req, res, next) {
  pool.query("select role,users.uid,uname,uemail from users inner join role on users.uid = role.uid inner join team on team.teamid = role.teamid where role.teamid = $1 ", [req.query.teamid], function (err, resp) {
    if (err) {
      res.redirect('/error');
    } else {
      pool.query("select tcode from team where teamid = $1", [req.query.teamid], function (erro, respo) {
        if (erro) {
          console.log(erro)
          res.redirect('/error')
        } else {

          var val = { teamid: req.query.teamid, tname: req.query.tname, tcode: respo.rows[0].tcode, users: resp.rows }
          var mt = 0;
          for (let i = 0; i < val.users.length; i++) {
            if (req.session.userid == val.users[i].uid) {
              console.log(val.users[i].uid);
              if (val.users[i].role) {
                console.log(val.users[i].uid);
                mt = 1;
              }
            }
          }
          if (mt == 1) {
            res.render("mteamsettings", val);
          } else {
            res.render("teamsettings", val);
          }
        }
      })
    }
  })

})

router.post('/refreshcode', function (req, res, next) {
  pool.query("select role from team inner join role on team.teamid=role.teamid where role.uid=$1 and team.teamid = $2", [req.session.userid, req.body.teamid], function (err, resp) {
    if (err) {
      console.log(err);
      res.redirect('/error')
    } else {
      if (resp.rows[0].role) {
        var code = makeid() + '-' + makelid() + '-' + makeid();
        pool.query("update team set tcode = $1 where teamid = $2", [code, req.body.teamid], function (error, respon) {
          if (error) {
            console.log(error);
            res.redirect('/error')
          } else {
            res.redirect(url.format({ pathname: '/settings', query: { "teamid": req.body.teamid, "tname": req.body.tname } }));
          }
        })
      } else {
        res.redirect('/forcingentry')
      }
    }
  })
})

router.get('/leaveteam', function (req, res, next) {
  if (req.session.userid) {
    var teamdat = { "teamid": req.query.teamid, "tname": req.query.tname };
    res.render('leave', teamdat);
  }
  else {
    res.redirect('/login');
  }
})

router.post('/leave', function (req, res, next) {
  if (req.session.username) {
    pool.query("delete from role where uid = $1 and teamid = $2", [req.session.userid, req.body.teamid], function (erro, respo) {
      if (erro) {
        console.log(erro)
        res.redirect('/error')
      } else {
        pool.query("select teamid,tname from team where teamid in(select teamid from role where uid=$1)", [req.session.userid], function (err, resp) {
          if (err) {
            console.log(err)
          } else {
            var data = {
              "username": req.session.username,
              "teams": resp.rows
            }
            console.log(data)
            req.session.data = data;
            res.redirect('/dashboard');
          }
        })
      }
    })
  } else {
    res.redirect('/login')
  }
})

router.get('/promote', function (req, res, next) {
  res.render("promote", req.query);
})

router.post('/promote', function (req, res, next) {
  console.log(req.body)
  pool.query("select role from role where teamid = $1 and uid= $2", [req.body.teamid, req.session.userid], function (err, resp) {
    if (err) {
      console.log(err)
    } else {
      if (resp.rows[0].role) {

      } else {
        res.send("You are not the manager of this team. Access Denied.")
      }
    }
  })
})

router.post('/assign', function (req, res, next) {
  if (req.session.userid) {
    pool.query("select role from role where uid=$1 and teamid = $2", [req.session.userid, req.body.teamid], function (err, resp) {
      if (err) {
        console.log(err)
      } else {
        if (resp.rows[0].role) {
          var code = makelid() + makelid() + makelid();
          console.log(req.body.taskdes)
          pool.query("insert into task (teamid,title,description,deadline,isdone,taskcode) values($1,$2,$3,$4,false,$5)", [req.body.teamid, req.body.tasktitle, req.body.taskdes, req.body.deadline, code], function (erro, respo) {
            if (erro) {
              console.log(erro)
            } else {
              pool.query("select taskid from task where taskcode = $1", [code], function (errors, responses) {
                if (errors) {
                  console.log(errors)
                }
                else {
                  console.log(responses.rows[0].taskid)
                  for (let i = 0; i < req.body.uid.length; i++) {
                    pool.query("insert into assign values($1,$2)", [ responses.rows[0].taskid,req.body.uid[i]], function (error, respon) {
                      if (error) {
                        console.log(error)
                      } else {
                        pool.query("select uemail from users where uid=$1", [req.body.uid[i]], function (errorrs, re) {
                          if (errorrs) {
                            console.log(errorrs)
                          } else {
                            var alert = '<h2>You have been assigned to a new Task in Team'+req.body.tname+'</h2><h2>Task titled as '+req.body.tasktitle+'</h2><h2>Deadline: '+req.body.deadline+'</h2>';
                            sendEmail(re.rows[0].uemail,"New Task",alert);
                          }
                        })
                      }
                    })
                  }
                  res.redirect('/dashboard')
                }
              })

            }
          })
        } else {
          res.send("Access Denied!")
        }
      }
    })
  } else {
    res.redirect('/login')
  }
})

router.get('/assign', function (req, res, next) {
  pool.query("select users.uid,uname,uemail from users inner join role on users.uid = role.uid inner join team on team.teamid = role.teamid where role.teamid = $1 and role = false ", [req.query.teamid], function (err, resp) {
    if (err) {
      res.redirect('/error');
    } else {
      console.log(resp.rows)
      var usersdata = { tasktitle: req.query.tasktitle, taskdes: req.query.taskdes, deadline: req.query.deadline, teamid: req.query.teamid,tname:req.query.tname, user: resp.rows }
      res.render("assigneesselect", usersdata)
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
    res.render('CostEstimationoutput', results);
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
  if (req.session.username) {
    res.redirect('/dashboard')
  } else {
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
  if (localStorage.getItem("Time")) {
    res.render('checkmail')
  }
  else {
    res.redirect('/forgotpassword')
  }
})

router.get('/accountnotfound', function (req, res, next) {
  res.render('accountnotfound')
})

router.get('/changepassword', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard')
  } else {
    var time = new Date().getTime();
    if (time > localStorage.getItem("Time")) {
      res.redirect('/expired')
    } else {
      if (localStorage.getItem(req.query.email)) {
        if (sha256(localStorage.getItem(req.query.email).toString()) == req.query.token) {
          var data = {
            email: req.query.email,
            token: req.query.token
          }
          req.session.passwordChange = true;
          res.render('changepassword', data);
        } else {
          res.redirect('/invalidlink');
        }
      } else {
        res.redirect('/expired');
      }
    }
  }
})

router.post('/changepassword', function (req, res, next) {
  if (req.session.username) {
    res.redirect('/dashboard')
  } else {
    if (req.body.token == sha256(localStorage.getItem(req.body.email))) {
      pool.connect();
      pool.query("update users set upassword=$1 where uemail=$2", [sha256(req.body.newpassword), req.body.email], (err, resp) => {
        if (err) {
          res.redirect('/error')
        } else {
          localStorage.clear();
          res.redirect('/passwordupdated')
        }
      })
    } else {
      res.redirect('/forgotpassword');
    }
  }
})

router.get('/passwordupdated', function (req, res, next) {
  if (!req.session.passwordChange) {
    res.redirect('/login')
  } else {
    req.session.passwordChange = null;
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

router.get('/costestimation', function (req, res, next) {
  res.render("CostEstimationInput")
})

router.get('/test', function (req, res, next) {
  res.render("test.ejs")
})

router.get('/costestimation', function (req, res, next) {
  res.render("CostEstimationInput")
})

router.get('/test', function (req, res, next) {
  res.render("test.ejs")
})

module.exports = router;
