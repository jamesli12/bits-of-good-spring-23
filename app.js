import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import User from './user.js';
import Animal from './animal.js';
import mongoose from 'mongoose';

import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jsonWebToken from 'jsonwebtoken';
import multer from 'multer';
import cloudinary from 'cloudinary';

dotenv.config();
const app = express();
const APP_PORT = 5000;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
});

async function connect(uri) {
    await mongoose.connect(uri);
}
connect(process.env.DATABASE_URI);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: true }));

app.get('/', (req, res) => {
    res.json({"Hello": "World",
            "Version": 2})
})

app.get('/api/health', authenticateToken, (req, res) => {
    res.json({ "healthy": true })
})

app.post('/api/user', (req, res) => {
    const data = req.body;
    if (data == null || data == undefined || data.firstName == undefined || data.lastName == undefined || data.email == undefined || data.password == undefined) {
        res.status(400).send("Bad Request");
    } else {
        const user = new User({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password
        });
        bcrypt.hash(user.password, 10, function(err, hash) {
            if (err) {
                res.status(500).send("Internal Server Error");
            } else {
                user.password = hash;
                user.save((err, user) => {
                    if (err) {
                        res.status(500).send("Internal Server Error");
                    } else {
                        res.status(200).send(user);
                    }
                });
            }
        });
    }
})

app.post('/api/user/login', (req, res) => {
    const data = req.body;
    if (data == null || data == undefined || data.email == undefined || data.password == undefined) {
        res.status(403).send("Bad Request");
    } else {
        User.findOne({ email: data.email }, function(err, user) {
            if (err) {
                console.log(err);
                res.status(500).send("Internal Server Error");
            } else {
                if (user == null) {
                    res.status(403).send("Bad Login");
                } else {
                    bcrypt.compare(data.password, user.password, function(err, result) {
                        if (result) {
                            res.json(jsonWebToken.sign({ user: user }, process.env.JWT_STRING, { expiresIn: '1h' }));
                        } else {
                            res.status(403).send("Bad Login");
                        }
                    });
                }
            }
        }).limit(10).sort('-createdOn');
    }
})

app.post('/api/admin/users', authenticateToken, (req, res) => {
    User.find({}, function(err, users) {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        } else {
            res.status(200).send(users);
        }
    }).limit(10).sort('-createdOn');
})

app.post('/api/admin/animals', authenticateToken, (req, res) => {
    Animal.find({}, function(err, animals) {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        } else {
            res.status(200).send(animals);
        }
    }).limit(10).sort('-createdOn');
})

app.post('/api/admin/training', authenticateToken, (req, res) => {
    TrainingLog.find({}, function(err, trainingLogs) {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        } else {
            res.status(200).send(trainingLogs);
        }
    }).limit(10).sort('-createdOn');
})

app.post('/api/user/verify', authenticateToken, (req, res) => {
    const data = req.body;
    if (data == null || data == undefined || data.email == undefined) {
        res.status(403).send("Bad Request");
    } else {
        res.json(generateToken(req.body));
    }
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.sendStatus(403);
    }
    jsonWebToken.verify(token, process.env.JWT_STRING, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    })
  }

function generateToken(user) {
    return jsonWebToken.sign(user, process.env.JWT_STRING, { expiresIn: '1h' });
}

app.post('/api/animal', authenticateToken, (req, res) => {
    const data = req.body;
    if (data == null || data == undefined || data.name == undefined || data.hoursTrained == undefined || data.dateOfBirth == undefined || data.profilePicture == undefined) {
        res.status(400).send("Bad Request");
    } else {
        const animal = new Animal({
            name: data.name,
            hoursTrained: data.hoursTrained,
            owner: req.user._id,
            dateOfBirth: data.dateOfBirth,
            profilePicture: data.profilePicture
        });
        animal.save((err, animal) => {
            if (err) {
                res.status(500).send("Internal Server Error");
            } else {
                res.status(200).send(animal);
            }
        });
    }
})

//this should be combined with cloudinary to upload it to the cloud
app.post('/api/file/upload', authenticateToken, multer({ dest: "uploads/" }).single('file'), (req, res) => {
    const file = req.file;
    if (file == null || file == undefined) {
        res.status(500).send("Bad Request");
    } else {
        const fileData = {
            originalName: file.originalname,
            fileName: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        };
        const fileUpload = new FileUpload(fileData);
        fileUpload.save((err, fileUpload) => {
            if (err) {
                res.status(500).send("Internal Server Error");
            } else {
                res.status(200).send(fileUpload);
            }
        });
    }
})


app.post('/api/training', authenticateToken, (req, res) => {
    const data = req.body;
    if (data == null || data == undefined || data.date == undefined || data.description == undefined || data.hours == undefined || data.animal == undefined || data.trainingLogVideo == undefined) {
        res.status(400).send("Bad Request");
    } else {
        Animal.findById(data.animal, function(err, animal) {
            if (animal == null || animal == undefined || animal.owner != data.user) {
                res.status(400).send("Invalid Owner");
            } else {
                const trainingLog = new TrainingLog({
                date: data.date,
                description: data.description,
                hours: data.hours,
                animal: data.animal,
                user: req.user._id,
                trainingLogVideo: data.trainingLogVideo
            });
            trainingLog.save((err, trainingLog) => {
                if (err) {
                    res.status(500).send("Internal Server Error");
                } else {
                    res.status(200).send(trainingLog);
                }
            });
            }
        }).limit(10).sort('-createdOn');
    }
})

app.listen(APP_PORT, () => {
    console.log(`api listening at http://localhost:${APP_PORT}`)
})