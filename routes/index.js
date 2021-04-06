var express = require('express');
var router = express.Router();

const pool = require('./db')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/signup');
});

router.get('/db', async (req, res) => {
  try {
    console.log(process.env.DATABASE_URL);
    const r= await pool.connect();
    const result=await pool.query("select *from users")
      const results = { 'results': (result) ? result.rows : null};
      pool.end()
      res.send(JSON.stringify(results) );

  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

router.get('/signup',function(req,res,next){
  res.render('Signup.ejs');
})

router.post('/signup',function(req,res,next){
  if(req.body.pass){

  }
})

module.exports = router;
