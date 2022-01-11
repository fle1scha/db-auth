const express = require("express") // add express module
const app = express() // create Express application
const mysql = require("mysql") // add mysql module
require("dotenv").config() 

// get sensitive info from .env
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const db = mysql.createPool({
   connectionLimit: 100,
   host: DB_HOST, // localhost
   user: DB_USER, // "newuser" user type from mysql database
   password: DB_PASSWORD, // password for "newuser"
   database: DB_DATABASE, // database name
   port: DB_PORT // port name, "3306" by default      
})

db.getConnection( (err, connection)=> {
   if (err) throw (err)
   console.log ("Connected to db with thread: " + connection.threadId)
})

const port = process.env.PORT
app.listen(port, 
()=> console.log(`Server started on port ${port}`))


const bcrypt = require("bcrypt")
app.use(express.json())

//middleware to read req.body.<params>

//CREATE USER
app.post("/createUser", async (req,res) => {
const user = req.body.name;
const hashedPassword = await bcrypt.hash(req.body.password,10);
db.getConnection( async (err, connection) => {
 if (err) throw (err)
 const sqlSearch = "SELECT * FROM userTable WHERE user = ?"
 const search_query = mysql.format(sqlSearch,[user])
 const sqlInsert = "INSERT INTO userTable VALUES (0,?,?)"
 const insert_query = mysql.format(sqlInsert,[user, hashedPassword])
 // ? will be replaced by values
 // ?? will be replaced by string
 await connection.query (search_query, async (err, result) => {
  if (err) throw (err)
  console.log("------> Search Results")
  console.log(result.length)
  if (result.length != 0) {
   connection.release()
   console.log("------> User already exists")
   res.sendStatus(409) 
  } 
  else {
   await connection.query (insert_query, (err, result)=> {
   connection.release()
   if (err) throw (err)
   console.log ("--------> Created new User")
   console.log(result.insertId)
   res.sendStatus(201)
  })
 }
}) //end of connection.query()
}) //end of db.getConnection()
}) //end of app.post()





/*
1. We first store the "req.body.name" in "user"
2. We then use the bcrypt.hash() function to hash the "password"
NOTE: that the bcrypt.hash() function may take a while to generate the hash, and so we use the "await" keyword in front of it. 
Since we are using the "await" keyword within the function, we need to add "async" keyword in front of the function.
"async" and "await" are basically "syntactical sugar", or a neater way to write promises in Javascript. 
Ideally we want to include the "await" part in a "try/catch" block that represents the "resolve/reject" parts of the Promise. However we will forego this, to keep our code simple and readable for the purposes of this tutorial.
3. We then use the db.getConnection() function to get a new connection. This function may have 2 outcomes, either an "error" or a "connection". i.e. db.getConnection ( (err, connection) )
4. In case we get the connection, we can then QUERY the connection, using connection.query(). Note that since the query() function may take some time to respond, we use the keyword "await" in front of it. Accordingly we need to include the "async" keyword in front of the parent function.
i.e. db.getConnection ( async (err, connection) => {
           await connection.query(<query>) 
})
5. The construction of the query strings are particularly interesting,
const sqlSearch = "SELECT * FROM userTable WHERE user = ?"
const search_query = mysql.format(sqlSearch,[user])
const sqlInsert = "INSERT INTO userTable VALUES (0,?,?)"
const insert_query = mysql.format(sqlInsert,[user, hashedPassword])
NOTE: Basically the ? will get replaced by the values in the []
Also, notice that in the INSERT query we are using (0,?,?), this is because the first column in our userDB is an AUTOINCREMENT column. So we pass either a "0" or "null", and the mySQL database will assign the next autoincrement value from its side 
i.e. we do not need to pass a value in the query, and we want mySQL DB to assign an autoincremented value.
6. The reason we have a "search_query" and a "insert_query", is because, we want to check to see if the "user" already exists in our MySQL DB. 
- In case they do, we do not add them again ("User already exists"). - In case they do NOT exist, we add them to the DB.
7. Note that after we make the query, we no longer need the connection and we must call a connection.release()
8. The connection.query() function will either have an error OR a result. i.e. connection.query( (err, result) )
9. The "results" returns each ROW as an object in an array.
Thus if the "search_query" results.length==0, then no ROWs were returned indicating that the user does not exist in the DB


*/