var mysql = require("mysql");

const dotenv = require("dotenv");
dotenv.config();

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

connection.connect(function (err) {
  var db_creation = `CREATE DATABASE IF NOT EXISTS nepali_audio_db;`;
  if (err) throw err;
  console.log("Connected!");

  connection.query(db_creation, (err, result) => {
    if (err) throw err;
    console.log("Database created");
  });

  connection.end();
});
