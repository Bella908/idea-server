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
        const usersCollection = db.collection('users');
        const teacherCollection = db.collection('teacherRequest');

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
   
//    teach On
   
    app.post('/teachOn', async (req, res) => {
        try {
            const teacher = req.body;
            console.log(teacher);
            const result = await teacherCollection.insertOne(teacher);
            res.status(201).send(result);
        } catch (error) {
            console.error('Error adding class:', error);
            res.status(500).send({ error: 'An error occurred while adding the class' });
        }
    });


    app.get('/teachOn', async (req, res) => {
      try {
          const cursor = teacherCollection.find();
          const result = await cursor.toArray();
          console.log(result);
          res.json(result);
      } catch (error) {
          console.error("Error fetching teacher requests:", error);
          res.status(500).json({ error: "Internal Server Error" });
      }
  });


 
  
// change the status
app.patch('/teachOn/:id', async (req, res) => {
  const id = req.params.id;
  const user = req.body
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: { ...user },
  }
  const result = await teacherCollection.updateOne(query, updateDoc)
  res.send(result)
})

app.patch('/allclasses/:id', async (req, res) => {
  const id = req.params.id;
  const user = req.body
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: { ...user },
  }
  const result = await classCollection.updateOne(query, updateDoc)
  res.send(result)
})










    // get the list

    app.get('/myclass/:email', async (req, res) => {
        const email = req.params.email;
      
        try {
          const query = { email: email };
          const result = await classCollection.find(query).toArray();
          res.send(result);
        } catch (error) {
          console.error('Error fetching classes:', error);
          res.status(500).send({ message: 'Failed to fetch classes' });
        }
      });


    //   deleat a list item
    app.delete("/myclass/delete/:_id", async (req, res) => {
        const result = await classCollection.deleteOne({ _id: new ObjectId(req.params._id) });
  
        res.send(result)
      })


    //   save a user
   
app.put('/user', async (req, res) => {
    const user = req.body;
  
    try {
      const query = { email: user?.email };
  
      // Check if the user already exists
      const isExist = await usersCollection.findOne(query);
  
      if (isExist) {
        // If the user is trying to change their status to "Requested"
        if (user.status === 'Requested') {
          const result = await usersCollection.updateOne(query, {
            $set: { status: user?.status }
          });
          return res.send(result);
        } else {
          // If the user already exists and is logging in again
          return res.send(isExist);
        }
      }
  
      // If the user doesn't exist, create a new user with upsert
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...user,
          timestamp: Date.now(),
        },
      };
  
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

//    // get a user info by email from db
    app.get('/user/:email', async (req, res) => {
        const email = req.params.email
        const result = await usersCollection.findOne({ email })
        res.send(result)
      })
    // get the user

    app.get('/users', async (req, res) => {
        const result = await usersCollection.find().toArray()
        res.send(result)
      })


// update user role
app.patch('/users/update/:email', async (req, res) => {
  const email = req.params.email
  const user = req.body
  const query = { email }
  const updateDoc = {
    $set: { ...user, timestamp: Date.now() },
  }
  const result = await usersCollection.updateOne(query, updateDoc)
  res.send(result)
})


        app.get('/', (req, res) => {
            res.send('Hello from server');
        });

        app.listen(port, () => console.log(`Server running on port ${port}`));
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

run().catch(console.dir);
