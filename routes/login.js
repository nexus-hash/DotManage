const pool = require("./db");
const session = require("cookie-session");
const sha256 = require("sha256");
const sendEmail = require("./sendEmail");
const e = require("express");
const url = require("url");
const getIP = require("ipware")().get_ip;
var ip = require("ip");

/*
    Function to perform authentication,
    This function matches entered credentials with
    the credentials in the database,
    if matches 
        store user details in session
        redirect to dashboard
    else
        return respective error message
*/
login = (req, res) => {

    // check for already logged in user
    if (req.session.username) {
      res.redirect("/dashboard");
    } else {
      pool.connect();
      pool.query(
        "select count(*) from users where uemail=$1",
        [req.body.email],
        function (err, resp) {
          if (err) {
            res.redirect("/error");
          } else {
            if (resp.rows[0].count == 0) {
              res.redirect("/user-not-found-signup");
            } else {
              pool.query(
                "select *from users where uemail=$1",
                [req.body.email],
                function (error, response) {

                  // matching entered password with database password
                  if (sha256(req.body.password) == response.rows[0].upassword) {
                    req.session.username = response.rows[0].uname.toString();
                    req.session.userid = response.rows[0].uid.toString();
                    req.session.useremail = req.body.email;
                    req.session.data = null;

                    //checking for logged in ip address
                    var ipinfo = ip.address();
                    var message =
                      "<h3>You have a recent login on " +
                      ipinfo.toString() +
                      ".</h3>";
                    
                    // send login device details email
                    sendEmail(req.body.email, "Recent Login", message);
                    res.redirect("/dashboard");
                  } else {
                    res.redirect("/invalid-credentials");
                  }
                }
              );
            }
          }
        }
      );
    }
}

module.exports = login;