const mysql = require("mysql");

// Create a connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "chatbot_namespaces"
});

module.exports = pool;