const express = require('express');
const app = express();

const cors = require('cors');
const { param } = require('express/lib/request');

const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mongoClient = mongodb.MongoClient;
const URL = 'mongodb+srv://shan1:shan1@cluster0.9trsz.mongodb.net/?retryWrites=true&w=majority';

app.use(
    cors({
        origin: "*",
    })
);

app.use(express.json());


function authenticate(req, res, next) {
  if (req.headers.authorization) {
    let decode = jwt.verify(req.headers.authorization, 'thisisasecretkey');
    if (decode) {
      req.userId = decode.id;
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized1' });
    }
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }

}

app.get('/students', authenticate, async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);
    let db = connection.db('data');
    let students = await db
      .collection('movie')
      .find({ createdBy: req.userId })
      .toArray();
    await connection.close();

    res.json(students);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


app.post('/student',authenticate,  async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);

    let db = connection.db('data');
    req.body.createdBy = req.userId;
    await db.collection('movie').insertOne(req.body);

    await connection.close();

    res.json({ message: 'Student Added' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }


});


app.put('/student/:id',  async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);

    let db = connection.db('data');

    await db
      .collection('movie')
      .updateOne({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body });

    await connection.close();

    res.json({ message: 'Student Updated' });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Something went wrong' });
  }

});


app.delete('/student/:id', authenticate, async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);

    let db = connection.db('data');

    await db
      .collection('movie')
      .deleteOne({ _id: mongodb.ObjectId(req.params.id) });

    await connection.close();

    res.json({ message: 'Student Deteleted' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }

});

app.get('/student/:id', authenticate, async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);

    let db = connection.db('data');

    let student = await db
      .collection('movie')
      .findOne({ _id: mongodb.ObjectId(req.params.id) });

    await connection.close();

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

app.post('/register', async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);
    let db = (await connection).db('data');

    let salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    req.body.password = hash;

    await db.collection('users').insertOne(req.body);
    await connection.close();
    res.json({ message: 'User Created' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
});

app.post('/login', async (req, res) => {
  try {
    let connection = await mongoClient.connect(URL);
    let db = connection.db('data');
    let user = await db.collection('users').findOne({ email: req.body.email });
    if (user) {
      let compare = bcrypt.compareSync(req.body.password, user.password);
      if (compare) {
        let token = jwt.sign(
          { name: user.name, id: user._id },
          'thisisasecretkey',
          { expiresIn: '1h' }
        );
        res.json({ token });
      } else {
        res.status(500).json({ message: 'Credientials does not match' });
      }
    } else {
      res.status(401).json({ message: 'Credientials does not match' });
    }
    await connection.close();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
});


app.listen(process.env.PORT || 3001, () => {
  console.log('Web server Started');
});

