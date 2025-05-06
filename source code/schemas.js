const mongoose = require('mongoose');

// Skill Schema
const skillSchema = new mongoose.Schema({
    skillName: { type: String, required: true },
    skillDescription: { type: String, required: true },
});

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;



// Course Schema
const courseSchema = new mongoose.Schema({
    skillName: { type: String, required: true },
    courseName: { type: String, required: true },
    courseDescription: { type: String, required: true },
    courseLink: { type: String, required: true },
    coursePrice: { type: Number, required: true }, // Add price field
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;