const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgres://gokxaftytldnxh:a8d4a391764c649cb7752b952306e453482edfe57567ac2b2604d59695e97170@ec2-54-197-228-62.compute-1.amazonaws.com:5432/db9vrdm0t3k5k4",
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;