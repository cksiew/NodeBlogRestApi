const express = require('express');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const MONGODB_URL = process.env.MONGODB_BLOG_URL;
const multer = require('multer');
 
const app = express();

const fileStorage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'images')
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now().toString() + '-' + file.originalname)
    }
});

const fileFilter = (req,file,cb)=>{
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
    {
        cb(null,true);
    } else {
        cb(null,false);
    }
}

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded
app.use(bodyParser.json()); // application/json
// app.use((req,res,next)=>{
//     res.setHeader('Access-Control-Allow-Origin','*');
//     res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
//     res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
//     next();
// })
app.use(multer({storage:fileStorage, fileFilter:fileFilter}).single('image'));
app.use('/images',express.static(path.join(__dirname,'images')));
app.use(cors());
app.use('/feed',feedRoutes);
app.use('/auth',authRoutes);

app.use((err,req,res,next)=>{
    console.log(err);
    const status = err.statusCode || 500;
    const message = err.message;
    const data = err.data;
    res.status(status).json({message:message, data: data });
})

mongoose.connect(MONGODB_URL)
.then(result=>{
    const server = app.listen(8080,()=>{
        console.log('Connected.');
    });
    const io = require('./socket').init(server);
    io.on('connection', socket=>{
        console.log('Client connected');
    });
})
.catch(err=>{
    console.log(err);
});

