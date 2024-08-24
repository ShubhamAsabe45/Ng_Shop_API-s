const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB local URL
const mongoURL = process.env.URL;

const connectionParams ={
    useNewUrlParser :true,
    useUnifiedTopology: true
  }

  mongoose.connect(mongoURL)
  .then(()=>{ console.log('Connected to MongoDB server')})
  .catch((err) =>{console.log('MongoDB connection error',err)});

  //   Get the default connection
const db = mongoose.connection;

db.on('connected',()=>{
    console.log('MongoDB connection sucessfull');
});

db.on('disconnected',()=>{
    console.log('MongoDB disconnected');
});

db.on('error',()=>{
    console.log('Connection error happened');
})


// Module export
module.exports = db;