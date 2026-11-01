require('dotenv').config();
require('./models/User');
require('./models/Problem');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const helmet = require('helmet');
app.use(helmet());

app.use(cors());
app.use(express.json());
app.use('/api/snippets', require('./routes/snippets'));

app.use('/api/stats', require('./routes/stats'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/problems', require('./routes/problems'));

app.get('/',(req,res)=>{
    res.send('AlgoTrack API is running');
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('MongoDB connected');
        app.listen(process.env.PORT, ()=>{
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err)=>console.error('MongoDB connection error:',err));