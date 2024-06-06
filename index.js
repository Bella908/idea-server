const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://ideaEducatiobHub:V8CCnG6XQwsdxz39@cluster0.ld1lprp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Update with your MongoDB URI
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const db = client.db('idea');
        const classCollection = db.collection('class');

        app.get('/allclasses', async (req, res) => {
            try {
                const cursor = classCollection.find();
                const result = await cursor.toArray();
                console.log(result);
                res.json(result);
            } catch (error) {
                console.error("Error fetching classes:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });


        app.get('/class/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.findOne(query)
            res.send(result)
        });


      // Route to add a new class
    app.post('/classes', async (req, res) => {
        try {
            const newClass = req.body;
            console.log(newClass);
            const result = await classCollection.insertOne(newClass);
            res.status(201).send(result);
        } catch (error) {
            console.error('Error adding class:', error);
            res.status(500).send({ error: 'An error occurred while adding the class' });
        }
    });



        app.get('/', (req, res) => {
            res.send('Hello from server');
        });

        app.listen(port, () => console.log(`Server running on port ${port}`));
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.dir);
