const express = require("express"); //make express available
const app = express(); //invoke express
const multer = require("multer"); //use multer to upload blob data
const upload = multer(); // set multer to be the upload variable (just like express, see above ( include it, then use it/set it up))
const fs = require("fs"); //use the file system so we can save files
const pool = require("./database");
const https = require("https");
var bodyParser = require("body-parser");
var DB;

async function getconn() {
  try {
    DB = await pool.getConnection();
  } catch (err) {
    throw err;
  }
}
getconn();
//serve out any static files in our public folder
app.use(express.static("public"));

//makes the app listen for requests on port 5000
app.listen(process.env.SERVER_PORT, function () {
  console.log(`app listening on port ${process.env.SERVER_PORT}`);
});

app.get("/", function (req, res, next) {
  res.sendFile("index.html", { root: __dirname });
});

app.post(
  "/upload",
  upload.single("audio_data"),
  async function (req, res, next) {
    if (!fs.existsSync(__dirname + "/uploads/")) {
      fs.mkdirSync(__dirname + "/uploads/");
    }
    let destinationFolder =
      __dirname +
      "/uploads/" +
      `${req.body.user_token}_${req.body.username}` +
      "/";
    if (!fs.existsSync(destinationFolder)) {
      fs.mkdirSync(destinationFolder);
    }
    let categoryFolder = destinationFolder + req.body.category + "/";
    if (!fs.existsSync(categoryFolder)) {
      fs.mkdirSync(categoryFolder);
    }
    let uploadLocation = categoryFolder + req.file.originalname;
    fs.writeFileSync(
      uploadLocation,
      Buffer.from(new Uint8Array(req.file.buffer))
    );

    var insert_audiodata_query = `INSERT INTO Nepali_audio(sentence_no, filename, user_token, username) VALUES (
    ${parseInt(req.body.index)}, "${req.file.originalname}","${
      req.body.user_token
    }", "${req.body.username}");`;
    var ID;
    var other_categories_entry = [];
    try {
      await DB.beginTransaction();
      result = await DB.query(insert_audiodata_query);
      ID = result[0].insertId;
      if (req.body.optional_categories) {
        other_categories = req.body.optional_categories.split(",");
        other_categories_entry = [];
        other_categories.forEach((element) => {
          other_categories_entry.push([ID, element, 2]);
        });
      }
      var insert_categorydata_query = `INSERT INTO sentence_categories(audio_id, category_name, orderRank) VALUES (${ID}, "${
        req.body.category
      }", "${parseInt(1)}")`;
      result1 = await DB.query(insert_categorydata_query);

      if (other_categories_entry.length != 0) {
        var insert_other_categorydata_query =
          "INSERT INTO sentence_categories(audio_id, category_name, orderRank) VALUES ?";
        result2 = await DB.query(insert_other_categorydata_query, [
          other_categories_entry,
        ]);
      }
      var alter_recorded_query = `UPDATE Nepali_sentences SET recorded = 1 WHERE id = ${parseInt(
        req.body.index
      )};`;
      result3 = await DB.query(alter_recorded_query);

      await DB.commit();
      await DB.release();
    } catch (err) {
      if (DB) {
        await DB.rollback();
        await DB.release();
      }
      console.log(err);
      throw err;
    }
    res.sendStatus(200); //send back that everything went ok
  }
);

app.get("/data", async function (req, res, next) {
  try {
    var sentences = await DB.query(
      `SELECT * FROM Nepali_sentences WHERE recorded = 0 ORDER BY RAND()`
    );
    res.send(sentences[0]);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

app.use(function (err, req, res, next) {
  console.log("This is the invalid field ->", err.field);
  next(err);
});
