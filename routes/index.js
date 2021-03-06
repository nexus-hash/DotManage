var express = require("express");
var router = express.Router();
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

const pool = require("./db");
const session = require("cookie-session");
const sha256 = require("sha256");
const transport = require("./send-mail");
const { sendMail } = require("./send-mail");
const e = require("express");
const url = require("url");
const { escapeXML } = require("ejs");
const { SSL_OP_NO_SSLv2 } = require("constants");
const getIP = require("ipware")().get_ip;
var ip = require("ip");

const login = require("./login")
const signup = require("./signup")
const sendEmail = require("./sendEmail")
const calculate = require("./calculatecost")

function makeid(length = 4) {
  var result = [];
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join("");
}

function makelid(length = 5) {
  var result = [];
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(
      characters.charAt(Math.floor(Math.random() * charactersLength))
    );
  }
  return result.join("");
}



function deadlinecheck() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();

  today = dd + "-" + mm + "-" + yyyy;
  return today;
}

function checkdates(d1, d2) {
  var parts = d1.split("-");
  var d1 = Number(parts[2] + parts[1] + parts[0]);
  var parts = d2.split("-");
  var d2 = Number(parts[2] + parts[1] + parts[0]);
  return d1 > d2;
}

/* GET home page. */
router.get("/", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/login");
  }
});

// Get signup page
router.get("/signup", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    res.render("Signup");
  }
});


router.get("/user-not-found-signup", function (req, res, next) {
  res.render("UserSignup.ejs");
});

router.post("/signup", function (req, res, next) {

  // Call sigup function
  signup(req,res);
});


router.get("/usernameunavailable", function (req, res, next) {
  res.render("usernameunavailable");
});


router.get("/jointeam", function (req, res, next) {
  if (req.session.username) {
    res.render("jointeam");
  } else {
    res.redirect("/login");
  }
});


router.post("/jointeam", function (req, res, next) {
  pool.query(
    "select teamid from team where tcode=$1",
    [req.body.code],
    function (err, resp) {
      if (err) {
        res.redirect("/err");
      } else {
        if (resp.rowCount != 1) {
          res.send("Invalid Code");
        } else {
          pool.query(
            "select count(*) from role where uid=$1 and teamid in (select teamid from team where tcode=$2)",
            [req.session.userid, req.body.code],
            function (error, respo) {
              if (error) {
                res.redirect("/err");
              } else {
                if (respo.rows[0].count != 0) {
                  res.send("You are already in the team");
                } else {
                  pool.query(
                    "insert into role (uid,teamid,role) values($1,$2,FALSE)",
                    [req.session.userid, resp.rows[0].teamid],
                    function (errorr, response) {
                      if (errorr) {
                        res.redirect("/error");
                      } else {
                        pool.query(
                          "select teamid,tname from team where teamid in(select teamid from role where uid=$1)",
                          [req.session.userid],
                          function (errorr, responses) {
                            if (errorr) {
                              console.log(errorr);
                            } else {
                              var data = {
                                username: req.session.username,
                                teams: responses.rows,
                              };
                              req.session.data = data;
                              res.redirect("/dashboard");
                            }
                          }
                        );
                      }
                    }
                  );
                }
              }
            }
          );
        }
      }
    }
  );
});


router.get("/login", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    res.render("Login.ejs");
  }
});


router.get("/account-already-exists-login", function (req, res, next) {
  res.render("Login-alreadyexists.ejs");
});


router.get("/invalid-credentials", function (req, res, next) {
  res.render("Login_invalid.ejs");
});


router.post("/login", function (req, res, next) {

  // Call login function
  login(req,res);
});

router.get("/createteam", function (req, res, next) {
  res.render("CreateTeam");
});

router.post("/createteam", function (req, res, next) {
  var a = makeid() + "-" + makelid() + "-" + makeid();
  pool.query(
    "insert into team (tcode,tname,tdescription) values ($1,$2,$3)",
    [a, req.body.tname, req.body.tdes],
    function (err, resp) {
      if (err) {
        res.redirect("/err");
      } else {
        pool.query(
          "select teamid from team where tcode=$1",
          [a],
          function (error, respo) {
            if (error) {
              res.redirect("/error");
            } else {
              pool.query(
                "insert into role (role,uid,teamid) values(TRUE,$1,$2)",
                [req.session.userid, respo.rows[0].teamid],
                function (erro, respon) {
                  if (erro) {
                    console.log(erro);
                  } else {
                    pool.query(
                      "select teamid,tname,tdescription from team where teamid in(select teamid from role where uid=$1)",
                      [req.session.userid],
                      function (errorr, response) {
                        if (errorr) {
                          console.log(errorr);
                        } else {
                          var data = {
                            username: req.session.username,
                            teams: response.rows,
                          };
                          req.session.data = data;
                          res.redirect("/dashboard");
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

router.get("/test", function (req, res, next) {
  res.render("test.ejs");
});

router.get("/settask", function (req, res, next) {
  res.render("SetTask", req.query);
});

router.get("/dashboard", function (req, res, next) {
  if (!req.session.username) {
    res.redirect("/login");
  } else {
    if (req.session.data) {
      res.render("userdash", req.session.data);
    } else {
      pool.query(
        "select teamid,tname,tdescription from team where teamid in(select teamid from role where uid=$1)",
        [req.session.userid],
        function (err, resp) {
          if (err) {
            console.log(err);
          } else {
            var data = {
              username: req.session.username,
              teams: resp.rows,
            };
            req.session.data = data;
            res.render("userdash", data);
          }
        }
      );
    }
  }
});

router.get("/unavailable", function (req, res, next) {
  res.render("unavailable");
});

router.get("/team", function (req, res, next) {
  if (!req.session.username) {
    res.redirect("/login");
  } else {
    pool.query(
      "select count(*) from role where uid=$1 and teamid =$2",
      [req.session.userid, req.query.tid],
      function (err, resp) {
        if (err) {
          console.log(err);
          res.redirect("/error");
        } else {
          if (resp.rows[0].count == 1) {
            pool.query(
              "select title,isdone,taskid,to_char(deadline,'DD-MM-YYYY') from task where teamid = $1 ",
              [req.query.tid],
              function (erro, respo) {
                if (erro) {
                  console.log(erro);
                } else {
                  for (let i = 0; i < respo.rows.length; i++) {
                    if (respo.rows[i].isdone) {
                      respo.rows[i].status = "Completed";
                    } else if (
                      checkdates(deadlinecheck(), respo.rows[i].to_char)
                    ) {
                      respo.rows[i].status = "Past Due";
                    } else {
                      respo.rows[i].status = "Ongoing";
                    }
                  }

                  pool.query(
                    "select role from role where uid = $1 and teamid = $2",
                    [req.session.userid, req.query.tid],
                    function (error, respon) {
                      if (error) {
                        console.log(error);
                      } else {
                        var taskdata = {
                          tname: req.query.tname,
                          teamid: req.query.tid,
                          userid: req.session.userid,
                          tasks: respo.rows,
                        };
                        if (respon.rows[0].role) {
                          res.render("mteamlanding", taskdata);
                        } else {
                          res.render("teamlanding", taskdata);
                        }
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.redirect("/forcingentry");
          }
        }
      }
    );
  }
});

router.get("/view", function (req, res, next) {
  pool.query(
    "select uemail, task.taskid ,teamid,title,description,to_char(deadline, 'YYYY-MM-DD'),isdone,taskcode from task inner join assign on task.taskid = assign.taskid inner join users on assign.uid = users.uid  where task.taskid=$1",
    [req.query.taskid],
    function (err, resp) {
      if (err) {
        console.log(err);
      } else {
        pool.query(
          "select uemail from users where users.uid in(Select uid from assign where taskid = $1);",
          [req.query.taskid],
          function (error, respo) {
            var taskdetails = {
              taskid: resp.rows[0].taskid,
              teamid: resp.rows[0].teamid,
              title: resp.rows[0].title,
              description: resp.rows[0].description,
              to_char: resp.rows[0].to_char,
              isdone: resp.rows[0].isdone,
              taskcode: resp.rows[0].taskcode,
              user: respo.rows,
            };
            console.log(taskdetails);
            res.render("taskview", taskdetails);
          }
        );
      }
    }
  );
});

router.get("/modify", function (req, res, next) {
  pool.query(
    "select task.taskid,teamid,title,description,to_char(deadline, 'YYYY-MM-DD'),isdone,taskcode from task where task.taskid=$1",
    [req.query.taskid],
    function (err, resp) {
      if (err) {
        console.log(err);
      } else {
        pool.query(
          "select uemail from users where users.uid in(Select uid from assign where taskid = $1);",
          [req.query.taskid],
          function (error, respo) {
            var taskdetails = {
              taskid: resp.rows[0].taskid,
              teamid: resp.rows[0].teamid,
              title: resp.rows[0].title,
              description: resp.rows[0].description,
              to_char: resp.rows[0].to_char,
              isdone: resp.rows[0].isdone,
              taskcode: resp.rows[0].taskcode,
              user: respo.rows,
            };
            console.log(taskdetails);
            if (
              req.query.status == "Ongoing" ||
              req.query.status == "Past Due"
            ) {
              res.render("modify", taskdetails);
            } else {
              res.render("nmodify", taskdetails);
            }
          }
        );
      }
    }
  );
});

router.post("/modify", function (req, res, next) {
  if (req.body.isdone == "on") {
    pool.query(
      "update task set isdone = true where taskid = $1",
      [req.body.taskid],
      function (error, respon) {
        if (error) {
          console.log(error);
        } else {
          pool.query(
            "select uemail from users inner join assign on assign.uid = users.uid where taskid = $1",
            [req.body.taskid],
            function (erro, respo) {
              for (let i = 0; i < respo.rowCount; i++) {
                var alert =
                  "<h2>Task Progress Update in Team" +
                  req.body.tname +
                  "</h2><h2>Task titled as " +
                  req.body.tasktitle +
                  " is marked as Completed.";
                sendEmail(respo.rows[i].uemail, "Task Progress", alert);
              }
              res.redirect("/dashboard");
            }
          );
        }
      }
    );
  } else {
    pool.query(
      "update task set title = $1, description = $2, deadline = $3 where taskid = $4",
      [
        req.body.tasktitle,
        req.body.taskdes,
        req.body.deadline,
        req.body.taskid,
      ],
      function (err, resp) {
        if (err) {
          console.log(err);
        } else {
          pool.query(
            "select uemail from users inner join assign on assign.uid = users.uid where taskid = $1",
            [req.body.taskid],
            function (erro, respo) {
              for (let i = 0; i < respo.rowCount; i++) {
                var alert =
                  "<h2>Modification on Task in Team" +
                  req.body.tname +
                  "</h2><h2>Task Details after modification : </h2><h2>Task titled as " +
                  req.body.tasktitle +
                  "</h2><h2>Deadline: " +
                  req.body.deadline +
                  "</h2>";
                sendEmail(respo.rows[i].uemail, "Modified Task", alert);
              }
              res.redirect("/dashboard");
            }
          );
        }
      }
    );
  }
});

router.get("/forcingentry", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/logout");
  } else {
    res.redirect("/login");
  }
});

router.get("/settings", function (req, res, next) {
  pool.query(
    "select role,users.uid,uname,uemail from users inner join role on users.uid = role.uid inner join team on team.teamid = role.teamid where role.teamid = $1 ",
    [req.query.teamid],
    function (err, resp) {
      if (err) {
        res.redirect("/error");
      } else {
        pool.query(
          "select tcode from team where teamid = $1",
          [req.query.teamid],
          function (erro, respo) {
            if (erro) {
              console.log(erro);
              res.redirect("/error");
            } else {
              var val = {
                teamid: req.query.teamid,
                tname: req.query.tname,
                tcode: respo.rows[0].tcode,
                users: resp.rows,
              };
              var mt = 0;
              for (let i = 0; i < val.users.length; i++) {
                if (req.session.userid == val.users[i].uid) {
                  if (val.users[i].role) {
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
          }
        );
      }
    }
  );
});

router.post("/refreshcode", function (req, res, next) {
  pool.query(
    "select role from team inner join role on team.teamid=role.teamid where role.uid=$1 and team.teamid = $2",
    [req.session.userid, req.body.teamid],
    function (err, resp) {
      if (err) {
        console.log(err);
        res.redirect("/error");
      } else {
        if (resp.rows[0].role) {
          var code = makeid() + "-" + makelid() + "-" + makeid();
          pool.query(
            "update team set tcode = $1 where teamid = $2",
            [code, req.body.teamid],
            function (error, respon) {
              if (error) {
                console.log(error);
                res.redirect("/error");
              } else {
                res.redirect(
                  url.format({
                    pathname: "/settings",
                    query: { teamid: req.body.teamid, tname: req.body.tname },
                  })
                );
              }
            }
          );
        } else {
          res.redirect("/forcingentry");
        }
      }
    }
  );
});

router.get("/leaveteam", function (req, res, next) {
  if (req.session.userid) {
    var teamdat = { teamid: req.query.teamid, tname: req.query.tname };
    res.render("leave", teamdat);
  } else {
    res.redirect("/login");
  }
});

router.post("/leave", function (req, res, next) {
  if (req.session.username) {
    pool.query(
      "delete from role where uid = $1 and teamid = $2",
      [req.session.userid, req.body.teamid],
      function (erro, respo) {
        if (erro) {
          console.log(erro);
          res.redirect("/error");
        } else {
          pool.query(
            "select teamid,tname from team where teamid in(select teamid from role where uid=$1)",
            [req.session.userid],
            function (err, resp) {
              if (err) {
                console.log(err);
              } else {
                var data = {
                  username: req.session.username,
                  teams: resp.rows,
                };
                req.session.data = data;
                res.redirect("/dashboard");
              }
            }
          );
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

router.get("/remove", function (req, res, next) {
  res.render("promote", req.query);
});

router.post("/remove", function (req, res, next) {
  pool.query(
    "select role from role where teamid = $1 and uid= $2",
    [req.body.teamid, req.session.userid],
    function (err, resp) {
      if (err) {
        console.log(err);
      } else {
        if (resp.rows[0].role) {
          pool.query(
            "delete from role where uid=$1 and teamid = $2",
            [req.body.uid, req.body.teamid],
            function (error, respon) {
              if (error) {
                console.log(error);
              } else {
                var message =
                  "You have been removed from the team " + req.body.tname + ".";
                sendEmail(req.body.uemail, "Removal", message);
                res.redirect("/dashboard");
              }
            }
          );
        } else {
          res.send("You are not the manager of this team. Access Denied.");
        }
      }
    }
  );
});

router.post("/assign", function (req, res, next) {
  if (req.session.userid) {
    pool.query(
      "select role from role where uid=$1 and teamid = $2",
      [req.session.userid, req.body.teamid],
      function (err, resp) {
        if (err) {
          console.log(err);
        } else {
          if (resp.rows[0].role) {
            var code = makelid() + makelid() + makelid();

            pool.query(
              "insert into task (teamid,title,description,deadline,isdone,taskcode) values($1,$2,$3,$4,false,$5)",
              [
                req.body.teamid,
                req.body.tasktitle,
                req.body.taskdes,
                req.body.deadline,
                code,
              ],
              function (erro, respo) {
                if (erro) {
                  console.log(erro);
                } else {
                  pool.query(
                    "select taskid from task where taskcode = $1",
                    [code],
                    function (errors, responses) {
                      if (errors) {
                        console.log(errors);
                      } else {
                        for (let i = 0; i < req.body.uid.length; i++) {
                          pool.query(
                            "insert into assign values($1,$2)",
                            [responses.rows[0].taskid, req.body.uid[i]],
                            function (error, respon) {
                              if (error) {
                                console.log(error);
                              } else {
                                pool.query(
                                  "select uemail from users where uid=$1",
                                  [req.body.uid[i]],
                                  function (errorrs, re) {
                                    if (errorrs) {
                                      console.log(errorrs);
                                    } else {
                                      var alert =
                                        "<h2>You have been assigned to a new Task in Team" +
                                        req.body.tname +
                                        "</h2><h2>Task titled as " +
                                        req.body.tasktitle +
                                        "</h2><h2>Deadline: " +
                                        req.body.deadline +
                                        "</h2>";
                                      sendEmail(
                                        re.rows[0].uemail,
                                        "New Task",
                                        alert
                                      );
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                        res.redirect("/dashboard");
                      }
                    }
                  );
                }
              }
            );
          } else {
            res.send("Access Denied!");
          }
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

router.get("/assign", function (req, res, next) {
  pool.query(
    "select users.uid,uname,uemail from users inner join role on users.uid = role.uid inner join team on team.teamid = role.teamid where role.teamid = $1 and role = false ",
    [req.query.teamid],
    function (err, resp) {
      if (err) {
        res.redirect("/error");
      } else {
        var usersdata = {
          tasktitle: req.query.tasktitle,
          taskdes: req.query.taskdes,
          deadline: req.query.deadline,
          teamid: req.query.teamid,
          tname: req.query.tname,
          user: resp.rows,
        };
        res.render("assigneesselect", usersdata);
      }
    }
  );
});

// Estimate Cost and return result
router.get("/costestimated", function (req, res, next) {

  //Call calculate estimated cost function
  calculate(req,res);
});

router.get("/costestimation", function (req, res, next) {
  res.render("CostEstimate");
});

router.get("/forgotpassword", function (req, res, next) {
  res.render("forgotpassword");
});

router.post("/forgotpassword", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    pool.connect();
    pool.query(
      "select count(uemail) from users where uemail = $1",
      [req.body.email],
      (err, resp) => {
        if (resp.rows[0].count == 1) {
          var token = Math.floor(Math.random() * 100000000000 + 1000000);
          var hashtoken = sha256(token.toString());
          var link =
            "https://dotmanage.herokuapp.com/changepassword?email=" +
            req.body.email +
            "&token=" +
            hashtoken;

          localStorage.setItem(req.body.email, token.toString());
          var myHour = new Date().getTime();
          var Hours = 0.5;

          myHour = myHour + Hours * 60 * 60 * 1000;

          localStorage.setItem("Time", myHour);
          var message =
            '<h2>Use this link to reset your password</h2><h4>This link will expire after 30 mins.</h4><a href="' +
            link +
            '"><button type="submit" style="border-radius: 5px;background-color: rgba(73,115,162,1) ;width: 20%;position: center;margin: 3%;padding: 1%;color: aliceblue;" >Reset Password</button></a>';

          sendEmail(req.body.email, "Forgot Password", message);
          res.redirect("/checkmail");
        } else {
          res.redirect("/accountnotfound");
        }
      }
    );
  }
});

router.get("/checkmail", function (req, res, next) {
  if (localStorage.getItem("Time")) {
    res.render("checkmail");
  } else {
    res.redirect("/forgotpassword");
  }
});

router.get("/accountnotfound", function (req, res, next) {
  res.render("accountnotfound");
});

router.get("/changepassword", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    var time = new Date().getTime();
    if (time > localStorage.getItem("Time")) {
      res.redirect("/expired");
    } else {
      if (localStorage.getItem(req.query.email)) {
        if (
          sha256(localStorage.getItem(req.query.email).toString()) ==
          req.query.token
        ) {
          var data = {
            email: req.query.email,
            token: req.query.token,
          };
          req.session.passwordChange = true;
          res.render("changepassword", data);
        } else {
          res.redirect("/invalidlink");
        }
      } else {
        res.redirect("/expired");
      }
    }
  }
});

router.post("/changepassword", function (req, res, next) {
  if (req.session.username) {
    res.redirect("/dashboard");
  } else {
    if (req.body.token == sha256(localStorage.getItem(req.body.email))) {
      pool.connect();
      pool.query(
        "update users set upassword=$1 where uemail=$2",
        [sha256(req.body.newpassword), req.body.email],
        (err, resp) => {
          if (err) {
            res.redirect("/error");
          } else {
            localStorage.clear();
            res.redirect("/passwordupdated");
          }
        }
      );
    } else {
      res.redirect("/forgotpassword");
    }
  }
});

router.get("/passwordupdated", function (req, res, next) {
  if (!req.session.passwordChange) {
    res.redirect("/login");
  } else {
    req.session.passwordChange = null;
    res.render("passwordupdated");
  }
});

router.get("/expired", function (req, res, next) {
  res.render("expired");
});

router.get("/invalidlink", function (req, res, next) {
  res.render("Signup2");
});

router.get("/logout", function (req, res, next) {
  req.session.username = null;
  req.session.destroy;
  res.redirect("/login");
});

router.get("/costestimation", function (req, res, next) {
  res.render("CostEstimationInput");
});

router.get("/test", function (req, res, next) {
  res.render("test.ejs");
});

module.exports = router;