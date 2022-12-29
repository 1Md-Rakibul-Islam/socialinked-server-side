const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());



// Mongodb database setup
const dbUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gksews0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verify JWT
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader){
        return res.status(401).send('Unauthorized access');
    }

    const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded){
            if(err){
                return res.status(403).send({message: 'forbidden access'})
            }
            req.decoded = decoded;
            next();
        })
}


async function run() {

    try{
        // db all collections
        const userCollection = client.db('SociaLinked').collection('users');
        const postsCollection = client.db('SociaLinked').collection('posts');
        const commentsCollection = client.db('SociaLinked').collection('comments');


        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);

            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '10h'})
                return res.send({accessToken: token})
            }
            res.status(403).send({accessToken: ''});
        })

        // // all user data insert on databse
        // app.post('/users', async(req, res) => {
        //     const user = req.body;
        //     const result = await usersCollection.insertOne(user);
        //     res.send(result);
        // })

        // eamil based spicific user data get and send to client side
        app.get('/users', async(req, res) => {
            const email = req.query.email;
            console.log(email);
            const filter = { userEmail : email };
            console.log(filter);
            const user = await userCollection.findOne(filter);
            console.log(user);
            res.send(user);
        })

        // all posts get and send to client side
        app.get('/posts', async(req, res) => {
            const query = { };
            const posts = await postsCollection.find( query ).toArray();
            res.send(posts); 
        })

        // top posts get with hight reaction and send to server side
        app.get('/topPosts', async(req, res) => {
            const query = { };
            const cursor = postsCollection.find( query )
            const posts = await cursor.limit(3).toArray();
            res.send(posts); 
        })

        // _id based spicific posts get and send to client side
        app.get('/post/:_id', async(req, res) => {
            const id = req.params._id;
            const filter = { _id: ObjectId(id) };
            const post = await postsCollection.findOne(filter);
            res.send(post);
        })

        // insert a post in db
        app.post('/posts', async(req, res) => {
            const post = req.body;
            const result = await postsCollection.insertOne( post );
            res.send(result);
        });

        // insert a comment in db
        app.post('/comments', async(req, res) => {
            const comment = req.body;
            const result = await commentsCollection.insertOne( comment );
            res.send(result);
        });

        // insert a user in db
        app.post('/users', async(req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await userCollection.insertOne( user );
            res.send(result);
        });







    }

    finally{

    }
    
}
run().catch(console.log())


app.get('/', async(req, res) => {
    res.send('Server server is running');
})

app.listen(port, () => {
    console.log(`Server runnin on: ${port}`);
})