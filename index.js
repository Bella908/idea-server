const express = require('express');
const cors = require('cors');
const stripe = require("stripe")('sk_test_51PPrgzRtjC8EFUM0TchOH5HbQQAv8ugf5OouxAMaT9WakdvA4qJqUfC77sNWoTyArQmN1surEK4DMdVfSlKmEygw00qcHmQxm1')
require('dotenv').config();
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = "mongodb+srv://DB_USERS:DB_PASSWORD.ld1lprp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Update with your MongoDB URI
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
        const assignmentCollection = db.collection('assignment');
        const userAddClass = db.collection('userAddClass');
        const feedbackCollection = db.collection('feedback');


// JWT RELATED
app.post('/jwt',async(req , res) =>{
    const user =req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '1hr'
    });
    res.send({token});
})





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
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classCollection.findOne(query);
            res.send(result);
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

        // Teach On
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


        app.patch('/teachOn/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body; // Assume we are passing status in the request body
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status },
            };
            const result = await teacherCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        
        app.get('/user/status', async (req, res) => {
            const email = req.query.email;
            try {
                const result = await teacherCollection.findOne({ email });
                res.send(result);
            } catch (error) {
                console.error('Error fetching user status:', error);
                res.status(500).send('Internal Server Error');
            }
        });
        





        // Change the status
        app.patch('/teachOn/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { ...user },
            };
            const result = await teacherCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        app.patch('/allclasses/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;
            const query = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { ...user },
            };
            const result = await classCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        // Create payment intent and save class information after successful payment

        // Get the list
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

        // Delete a list item
        app.delete("/myclass/delete/:_id", async (req, res) => {
            const result = await classCollection.deleteOne({ _id: new ObjectId(req.params._id) });

            res.send(result);
        });

        // Save a user
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

        // Get a user info by email from db
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        });

        // Get the users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        // Update user role
        app.patch('/users/update/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email };
            const updateDoc = {
                $set: { ...user, timestamp: Date.now() },
            };
            const result = await usersCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        app.patch('/users/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const user = req.body;
                const query = { _id: new ObjectId(id) };
                const updateDoc = {
                    $set: { ...user },
                };
                const result = await usersCollection.updateOne(query, updateDoc);
                res.send(result);
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).send({ error: 'An error occurred while updating the user' });
            }
        });
        
        // Save assignment
        app.post('/assignment/:id', async (req, res) => {
            try {
                const assignment = req.body;
                console.log(assignment);

                const result = await assignmentCollection.insertOne(assignment);

                res.status(201).send(result);
            } catch (error) {
                console.error('Error adding assignment:', error);
                res.status(500).send({ error: 'An error occurred while adding the assignment' });
            }
        });
        // get the assigment
        app.get('/assignment', async (req, res) => {
            try {
                const cursor =assignmentCollection.find();
                const result = await cursor.toArray();
                console.log(result);
                res.json(result);
            } catch (error) {
                console.error("Error fetching teacher requests:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        app.get('/assignment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classCollection.findOne(query);
            res.send(result);
        });


// update class
app.patch('/update/:id', async (req, res) => {
    const id = req.params.id;
    const { title, price, shortDescription, image } = req.body; // Get updated fields from request body

    try {
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: { title, price, shortDescription, image },
        };
        const result = await classCollection.updateOne(query, updateDoc);
        res.send(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});







        // payment

        app.post('/payment', async (req, res) => {
            try {
                const payment = req.body;
                console.log(payment);
                const result = await userAddClass.insertOne(payment);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error adding class:', error);
                res.status(500).send({ error: 'An error occurred while adding the class' });
            }
        });

        // get the enroll info
        app.get('/enrollClass', async (req, res) => {
            try {
                const cursor = userAddClass.find();
                const result = await cursor.toArray();
                console.log(result);
                res.json(result);
            } catch (error) {
                console.error("Error fetching teacher requests:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        app.get('/enrollClass/:classId', async (req, res) => {
            try {
                const cursor = assignmentCollection.find({ classId: req.params.classId });
                const result = await cursor.toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching assignments:", error);
                res.status(500).send("Internal Server Error");
            }
        });
        
        // feedback
        app.post('/feedback', async (req, res) => {
            try {
                const feedback = req.body;
                console.log(feedback);
                const result = await feedbackCollection.insertOne(feedback);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error adding class:', error);
                res.status(500).send({ error: 'An error occurred while adding the class' });
            }
        });

        app.get('/feedback', async (req, res) => {
            try {
                const cursor = feedbackCollection.find();
                const result = await cursor.toArray();
                console.log(result);
                res.json(result);
            } catch (error) {
                console.error("Error fetching teacher requests:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });
       
        app.get('/feedback/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await feedbackCollection.findOne(query);
            res.send(result);
        });

        app.get('/admin-stat', async (req, res) => {
           
      
            const totalUsers = await usersCollection.countDocuments()
            const totalClasses = await classCollection.countDocuments()
            const totalAddClass = await userAddClass.countDocuments()
            
            res.send({
              totalUsers,
              totalClasses,
              totalAddClass
              
            })
          })
      

          app.get('/classes/:id/enrollments', async (req, res) => {
            try {
                const classId = req.params.id;
                const totalEnrollments = await enrollmentCollection.countDocuments({ classId: new ObjectId(classId) });
                res.json({ totalEnrollments });
            } catch (error) {
                console.error('Error fetching enrollments:', error);
                res.status(500).send({ error: 'An error occurred while fetching enrollments' });
            }
        });

        app.get('/teachers/:id/assignments', async (req, res) => {
            try {
                const teacherId = req.params.id;
                const totalAssignments = await assignmentCollection.countDocuments({ teacherId: new ObjectId(teacherId) });
                res.json({ totalAssignments });
            } catch (error) {
                console.error('Error fetching assignments:', error);
                res.status(500).send({ error: 'An error occurred while fetching assignments' });
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
