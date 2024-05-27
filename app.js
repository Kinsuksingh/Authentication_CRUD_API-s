// Importing necessary modules
const path = require('path');  // Provides utilities for working with file paths
const express = require('express');  // Creates a web application framework
const { open } = require('sqlite');  // Asynchronous function to open a SQLite database connection
const sqlite3 = require('sqlite3') // Imports the SQLite3 database driver with verbose logging
const bcrypt = require('bcrypt');  // For password hashing (ensure proper salting)

// Initialize the Express application.
const app = express();

// Parse incoming JSON request bodies.
app.use(express.json());

// Define the database path
const dbPath = path.join(__dirname, 'userData.db');

// Global database variable.
let db = null;

// Port on which the server will listen.
const port = 3000;

// Asynchronous function to initialize the database connection and start the server
const initializingDbAndServe = async () => {
    try {
        // Open the database connection
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        console.log('Connected to the database successfully.');
        
        // Start the Express server
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
    });
    } catch (error) {
        console.error('Error initializing database and server:', error);
        process.exit(1); // Exit the process with an error code (consider more specific handling)
    }
};

// Call the initializingDbAndServe function to start the server
initializingDbAndServe();



//1) Register API.
app.post('/register/', async (req,res) => {
    const {username, name, password, gender, location} = req.body;
    const existingUserQuery = `SELECT username FROM user WHERE username = '${username}';`;
    try{
        const existingUser = await db.get(existingUserQuery);
        if(existingUser){
            res.status(400);
            return res.send('User already exists');
            
        }
        if(password.length < 5){
            res.status(400);
            return res.send('Password is too short');
        }
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert new user into the database
        const insertUserQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
        await db.run(insertUserQuery);
        res.status(200);
        res.send('User created successfully');
    }catch(error){
        console.error('Error registering user:', error);
        res.status(500).json({ status: 'Server error' });
    }
});


//2) Login API.
app.post('/login/', async (req,res) => {
    const {username, password} = req.body;
    const existingUserQuery = `SELECT username, password FROM user WHERE username = '${username}';`;
    try{
        const existingUser = await db.get(existingUserQuery);
        
        if(existingUser){
            const isPasswordMatched = await bcrypt.compare(password, existingUser.password);
            if(isPasswordMatched){
                res.status(200);
                return res.send('Login success!');
            }
            else{
                res.status(400);
                return res.send('Invalid password');
            }
        }
        else{
            res.status(400);
            return res.send('Invalid user');
        }
    }catch(error){
        console.error('Error in login:', error);
        res.status(500).json({ status: 'Server error' });
    }
});


//3) Change-password API.
app.put('/change-password/', async (req,res) => {
    const {username, oldPassword, newPassword} = req.body;
    const existingUserQuery = `SELECT password FROM user WHERE username = '${username}';`;
    try{
        const currentPassword = await db.get(existingUserQuery);
        if(currentPassword){
            const isPasswordMatched = await bcrypt.compare(oldPassword, currentPassword.password);
            if(isPasswordMatched){
                if(newPassword.length > 5){
                    const hashedPassword = await bcrypt.hash(newPassword,10);
                    const queryForUpdatePassword = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}'`;
                    await db.run(queryForUpdatePassword);
                    res.status(200);
                    res.send('Password updated');
                }else{
                    res.status(400);
                    res.send('Password is too short');
                }
            }
            else{
                res.status(400);
                res.send('Invalid current password');
            }
        }else{
            res.status(400);
            res.send('Invalid user name');
        }

    }catch(error){
        console.error('Error in changing password:', error);
        res.status(500).json({ status: 'Server error' });
    }
});




