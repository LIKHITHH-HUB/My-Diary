const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');

const app=express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({extended: true}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'likith@15',
    database: 'MyDairy'
})

connection.connect((err)=>{
    if(err){
        console.log('error occured to connecting the database!');
        return;
    }
    console.log('connected to database');
});

app.get('/',(req,res)=>{
    console.log(req)
    res.status(200).json({message: 'sucessfull'})
})

app.post('/registerUser',async(req,res)=>{
    console.log(req.body);
    const {email,password}=req.body;

    try{
        // hash the password
        const hashedpassword = await bcrypt.hash(password,10);
        console.log("Hashed password:",hashedpassword)

    connection.query(
    `INSERT INTO Users (EmailId, HashedPassword)
     VALUES (?, ?)`,
    [email, hashedpassword],
    (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        return res.status(200).send("okay");
    }
);

    }catch (err){
        console.error(err);
        res.status(500).send('Error while hashing password');
    }
})

app.post('/userLogin',async(req,res)=>{
    console.log("user logged in: ",req.body);
    const{email,password}=req.body;
    // let hashedpassword = "$2b$10$W81vaO37OEBESS2iiQOMqeDKSOVvn60cBNV9J35Ysk4FMhu.Ynx6i"
    // let hashedPassword ="asewdffvrfvj"

    let hashedpassword='';
    let userId = '';
    connection.query(  `select Id,HashedPassword from Users where EmailId='${email}'`,async(err,result)=>{
        if(err){
            return res.status(500).send("DB error");
        }
        if(result.length ===0){
            return res.status(404).json({
                message: "user not found"
            });
        }
    hashedpassword=result[0].HashedPassword;
    userId = result[0].Id;
    let response= await bcrypt.compare(password,hashedpassword);
    if(response){
        res.status(200).json({userId:userId});
    return
    }
    else{
        res.status(500)
        return
    }
    })
    // console.log('Is same?',response);
    // res.status(200).send('Matched');
})

app.post('/newpost',async(req,res)=>{

    const {postTitle,postDescription,userId}=req.body;
    connection.query(`insert into posts(userId,postTitle,postDescription) values(${userId},"${postTitle}","${postDescription}")`,async(err,response)=>{
        if(err){
            res.status(500).send("error");
            return
        }
        res.status(200).send("post Created");
    })
    console.log("New post:", req.body);
})

app.get('/getmyposts',async(req,res)=>{
    console.log(req.query)
connection.query(`select * from posts where userId=${req.query.userId}`,(err,result)=>{
    if(err){
        res.status(500)
        return
    }
    res.status(200).send(result);
})
})

app.post('/deletepost', (req,res)=>{
  const { id } = req.body;

  connection.query(
    'DELETE FROM posts WHERE Id = ?',
    [id],
    (err,result)=>{
      if(err){
        return res.status(500).send("Error deleting");
      }
      res.status(200).send("Deleted");
    }
  );
});

app.post('/updatepost',(req,res)=>{
    const {id ,postTitle,postDescription } = req.body;

    connection.query(
        'UPDATE posts SET postTitle=?, postDescription=? WHERE ID =?',
        [postTitle,postDescription,id],
        (err,result)=>{
            if(err){
                return res.status(500).send("Error updating");
            }
            res.status(200).send("updated successfully");
        } 
    )
});
app.listen(3000,()=>{
    console.log('server started on port 3000!')
})