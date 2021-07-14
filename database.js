var mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const fs = require("fs");
const { parse } = require("csv-parse");

dotenv.config();

var pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function databaseCreate() {
  var sentences_table_creation = `CREATE TABLE IF NOT EXISTS Nepali_sentences(
      id int NOT NULL AUTO_INCREMENT,
      sentence varchar(255),
      recorded bool,
      PRIMARY KEY(id) 
  );`;

  var audio_table_creation = `CREATE TABLE IF NOT EXISTS Nepali_audio(
    id int NOT NULL AUTO_INCREMENT,
    sentence_no int NOT NULL,
    filename varchar(50),
    user_token varchar(50),
    username varchar(50),
    PRIMARY KEY(id),
    FOREIGN KEY (sentence_no) REFERENCES Nepali_sentences(id)
);`;

  var category_table_creation = `CREATE TABLE IF NOT EXISTS Sentence_categories(
    id int NOT NULL AUTO_INCREMENT,
    audio_id int NOT NULL,
    category_name varchar(20),
    orderRank int NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY (audio_id) REFERENCES Nepali_audio(id),
    UNIQUE(audio_id, orderRank, category_name)
);`;

  try {
    connection = await pool.getConnection();
    await connection.query(sentences_table_creation);
    await connection.query(audio_table_creation);
    await connection.query(category_table_creation);

    total_sentences = await connection.query(
      `SELECT COUNT(*) as total FROM Nepali_sentences`
    );

    if (total_sentences[0][0].total == 0) {
      insertSentencesFromFile();
    }

    console.log("Connected!");
  } catch (err) {
    console.log("error");
    throw err;
  }
}

async function insertSentencesFromFile() {
  try {
    connection = await pool.getConnection();
    // Read the file
    const fileData = fs.readFileSync("news_df.csv", "utf-8");

    // Parse the CSV data
    const sentences = [];
    parse(fileData, { columns: true, trim: true }, async (err, records) => {
      if (err) {
        console.error("Error reading CSV file:", err);
        return;
      }

      // Extract the "sentence" column
      records.forEach((record) => {
        if (record["sentence"]) {
          sentences.push(record["sentence"]);
        }
      });

      // Insert sentences into the database
      for (const sentence of sentences) {
        await connection.query(
          "INSERT INTO Nepali_sentences (sentence, recorded) VALUES (?, ?)",
          [sentence, false]
        );
      }
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await connection.end();
  }
}

databaseCreate();
module.exports = pool;
