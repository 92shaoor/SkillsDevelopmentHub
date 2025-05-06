const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mongoose = require('mongoose');


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillHub', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);


// Expert Schema
const expertSchema = new mongoose.Schema({
    expertName: { type: String, required: true },
    expertField: { type: String, required: true },
    image: { type: String }, // Optional field for the expert's image URL
});

const Expert = mongoose.model('Expert', expertSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    expert: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
});

const Booking = mongoose.model('Booking', bookingSchema);


// Skill Schema
const skillSchema = new mongoose.Schema({
    skillName: { type: String, required: true },
    skillDescription: { type: String, required: true },
});

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;



const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
    })
);

// File to store user data
const usersFile = path.join(__dirname, 'users.json');

// File paths for courses and experts
const coursesFile = path.join(__dirname, 'skill.json');
const expertsFile = path.join(__dirname, 'experts.json');

// Helper function to read users from file
const readUsers = () => {
    if (!fs.existsSync(usersFile)) {
        return [];
    }
    const data = fs.readFileSync(usersFile, 'utf8');
    return data ? JSON.parse(data) : [];
};

// Helper functions to read and write JSON files
const readData = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return data ? JSON.parse(data) : [];
};

const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Helper function to write users to file
const writeUsers = (users) => {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// Signup route
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }
    
    try {
        // Check if username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Save the new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        res.send('Signup successful!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// Route to add a new skill
app.post('/admin/add-skill', async (req, res) => {
    const { skillName, skillDescription } = req.body;

    try {
        // Check if the skill already exists
        const existingSkill = await Skill.findOne({ skillName });
        if (existingSkill) {
            return res.status(400).send('Skill already exists');
        }

        // Create a new skill
        const newSkill = new Skill({ skillName, skillDescription: skillDescription });
        await newSkill.save();

        res.status(200).send('Skill added successfully');
    } catch (error) {
        console.error('Error adding skill:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Course Schema
const courseSchema = new mongoose.Schema({
    skillName: { type: String, required: true },
    courseName: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseLink: { type: String, required: true },
    coursePrice: { type: Number }, // Added price field
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;

// Route to add a new course
app.post('/admin/add-course', async (req, res) => {
    const { skillName, courseName, courseDescription, courseLink, coursePrice } = req.body;

    try {
        const newCourse = new Course({ skillName, courseName, courseDescription, courseLink, coursePrice });
        await newCourse.save();
        res.status(200).json({ message: 'Course added successfully' });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).send('Invalid username or password');
        }
        
        // Save user session
        req.session.user = { username };
        res.send('Login successful!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logged out successfully!');
});


// Admin route to add a new expert
app.post('/admin/add-expert', async (req, res) => {
    const { expertName, expertField } = req.body;

    try {
        // Check if the expert already exists
        const existingExpert = await Expert.findOne({ expertName });
        if (existingExpert) {
            return res.status(400).json({ message: 'Expert already exists' });
        }

        // Create a new expert
        const newExpert = new Expert({ expertName, expertField });
        await newExpert.save();

        res.status(200).json({ message: 'Expert added successfully' });
    } catch (error) {
        console.error('Error adding expert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to remove a course
app.post('/admin/remove-course', async (req, res) => {
    const { courseId } = req.body;

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await Course.findByIdAndDelete(courseId);
        res.status(200).json({ message: 'Course removed successfully' });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to remove an expert
app.post('/admin/remove-expert', async (req, res) => {
    const { expertName } = req.body;

    try {
        // Check if the expert exists
        const expert = await Expert.findOne({ expertName });
        if (!expert) {
            return res.status(404).json({ message: 'Expert not found' });
        }

        // Remove the expert
        await Expert.deleteOne({ expertName });
        res.status(200).json({ message: 'Expert removed successfully' });
    } catch (error) {
        console.error('Error removing expert:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to remove a skill
app.post('/admin/remove-skill', async (req, res) => {
    const { skillName } = req.body;

    try {
        // Check if the skill exists
        const skill = await Skill.findOne({ skillName });
        if (!skill) {
            return res.status(404).send('Skill not found');
        }

        // Remove the skill
        await Skill.deleteOne({ skillName });
        res.status(200).send('Skill removed successfully');
    } catch (error) {
        console.error('Error removing skill:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to remove a user
app.post('/admin/remove-user', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove the user
        await User.deleteOne({ email });
        res.status(200).json({ message: 'User removed successfully' });
    } catch (error) {
        console.error('Error removing user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to remove a booking
app.post('/admin/remove-booking', async (req, res) => {
    const { bookingId } = req.body;

    try {
        // Check if the booking exists
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Remove the booking
        await Booking.findByIdAndDelete(bookingId);
        res.status(200).json({ message: 'Booking removed successfully' });
    } catch (error) {
        console.error('Error removing booking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Serve the booking page
app.post('/book', async (req, res) => {
    const { name, email, expert, date, time } = req.body;
    
    try {
        const newBooking = new Booking({ name, email, expert, date, time });
        await newBooking.save();
        res.send('Booking successfully saved!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch all skills
app.get('/SkillsList', async (req, res) => {
    try {
        const skills = await Skill.find(); // Fetch all skills from MongoDB
        res.json(skills); // Send skills as JSON to the frontend
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch course details by skillName
app.get('/courses/:skillName', async (req, res) => {
    try {
        const skillName = req.params.skillName;
        const course = await Course.findOne({ skillName }); // Fetch course by skillName

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course); // Send course details as JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch courses by skill name
app.get('/courses', async (req, res) => {
    const { skillName } = req.query;

    try {
        // Fetch courses related to the skill from the database
        const courses = await Course.find({ skillName });
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found for this skill' });
        }
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Route to fetch all courses
app.get('/courses', async (req, res) => {
    try {
        // Fetch all courses from the database
        const courses = await Course.find();
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// Serve the admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname,'admin.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

//Adding Middleware for Admin Panel Authentication
const adminUsername = 'shaoor'; // Replace with your admin username
const adminPassword = '123'; // Replace with your hashed admin password

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin-login.html'); // Redirect to the admin login page if not authenticated
}

// Admin login route
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Check if the username and password match
    if (username === adminUsername && (await bcrypt.compare(password, await bcrypt.hash(adminPassword, 10)))) {
        req.session.isAdmin = true; // Set the admin session
        res.redirect('/admin'); // Redirect to the admin panel
    } else {
        res.status(401).send('Invalid username or password');
    }
});

// Serve the admin panel (protected route)
app.get('/admin', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Route to fetch experts from the database
app.get('/experts', async (req, res) => {
    try {
        const experts = await Expert.find(); // Fetch all experts from MongoDB
        res.json(experts); // Send experts as JSON to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch experts for the booking page
app.get('/experts', async (req, res) => {
    try {
        const experts = await Expert.find(); // Fetch all experts from MongoDB
        res.json(experts); // Send experts as JSON to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to save booking details
app.post('/book', async (req, res) => {
    const { name, email, expert, date, time } = req.body;
    
    try {
        // Create a new booking record
        const newBooking = new Booking({ name, email, expert, date, time });
        await newBooking.save(); // Save the booking in MongoDB
        
        res.send('Booking successfully saved!'); // Respond to the client
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all skills
app.get('/skills', async (req, res) => {
    try {
        const skills = await Skill.find(); // Fetch all skills from the database
        res.json(skills);
    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all experts
app.get('/experts', async (req, res) => {
    try {
        const experts = await Expert.find(); // Fetch all experts from the database
        res.json(experts);
    } catch (error) {
        console.error('Error fetching experts:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Fetch all bookings
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find(); // Fetch all bookings from the database
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Internal Server Error');
    }
});