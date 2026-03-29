const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  MySQL Pool (Correct for Render + Railway)for free acesess
const dbUrl = new URL(process.env.MYSQL_PUBLIC_URL);

const pool = mysql.createPool({
  host: dbUrl.hostname,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  port: dbUrl.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});



//  Test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'successful' });
});

//  Register User
app.post('/registerUser', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedpassword = await bcrypt.hash(password, 10);

    pool.query(
      `INSERT INTO Users (EmailId, HashedPassword) VALUES (?, ?)`,
      [email, hashedpassword],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Database error");
        }
        res.status(200).send("Registered successfully");
      }
    );

  } catch (err) {
    console.error(err);
    res.status(500).send("Error hashing password");
  }
});

// Login User
app.post('/userLogin', (req, res) => {
  const { email, password } = req.body;

  pool.query(
    `SELECT Id, HashedPassword FROM Users WHERE EmailId = ?`,
    [email],
    async (err, result) => {
      if (err) return res.status(500).send("DB error");

      if (result.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedpassword = result[0].HashedPassword;
      const userId = result[0].Id;

      const match = await bcrypt.compare(password, hashedpassword);

      if (match) {
        res.status(200).json({ userId });
      } else {
        res.status(401).send("Invalid password");
      }
    }
  );
});

// Create New Post
app.post('/newpost', (req, res) => {
  const { postTitle, postDescription, userId } = req.body;

  pool.query(
    `INSERT INTO posts (userId, postTitle, postDescription) VALUES (?, ?, ?)`,
    [userId, postTitle, postDescription],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error creating post");
      }
      res.status(200).send("Post created");
    }
  );
});

//  Get User Posts
app.get('/getmyposts', (req, res) => {
  const { userId } = req.query;

  pool.query(
    `SELECT * FROM posts WHERE userId = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching posts");
      }
      res.status(200).send(result);
    }
  );
});

//  Delete Post
app.post('/deletepost', (req, res) => {
  const { id } = req.body;

  pool.query(
    `DELETE FROM posts WHERE Id = ?`,
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting post");
      }
      res.status(200).send("Deleted");
    }
  );
});

// Update Post
app.post('/updatepost', (req, res) => {
  const { id, postTitle, postDescription } = req.body;

  pool.query(
    `UPDATE posts SET postTitle = ?, postDescription = ? WHERE Id = ?`,
    [postTitle, postDescription, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error updating post");
      }
      res.status(200).send("Updated successfully");
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

pool.query("SHOW TABLES", (err, result) => {
  console.log("TABLES:", result);
});