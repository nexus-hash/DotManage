const pool = require("./db");
const session = require("cookie-session");
const sha256 = require("sha256");
const sendEmail = require("./sendEmail");
const e = require("express");
const url = require("url");

/*
    Function for signup
    if already logged in
        redirect to dashboard
    else 
        check if username and useremail already exists
            send already exists message
        else
            add the user details to the database
            send successful sigup mail 
*/

// TODO: Implement an email checking mechanism by sending an email with a link to verify it

signup = (req, res) => {
    if (req.session.username) {
      res.redirect("/dashboard");
    } else {
      pool.connect();
      pool.query(
        "select count(uemail) from users where uemail = $1",
        [req.body.email],
        (err, resp) => {
          if (err) {
            res.redirect("/error");
          } else {
            if (resp.rows[0].count == 1) {
              res.redirect("/account-already-exists-login");
            } else {
              pool.query(
                "select count(uname) from users where uname=$1",
                [req.body.username],
                (errorrr, responsee) => {
                  if (errorrr) {
                    console.log("error");
                    res.redirect("/error");
                  } else {
                    if (responsee.rows[0].count == 1) {
                      res.redirect("/usernameunavailable");
                    } else {

                      //Add the user to the database
                      pool.query(
                        "insert into users (uname,uemail,upassword) values ($1,$2,$3);",
                        [
                          req.body.username,
                          req.body.email,
                          sha256(req.body.password),
                        ],
                        function (err, respons) {
                          if (err) {
                            res.redirect("/error");
                            console.log(err);
                          } else {
                            sendEmail(
                              req.body.email,
                              "Welcome to Dotmanage App",
                              "<h2>Sigup was sucessful.</h2>"
                            );
                            res.redirect("/login");
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
    }
}

module.exports = signup;