const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');


const User = require('../app/models/user.model'); 
const Project = require('../app/models/project.model');

const seedDatabase = async () => {
  try {
  
    console.log('Starting database seeding...');

    // Hash password once
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Create 25 supervisors
    console.log('Creating 25 supervisors...');
    const supervisors = [];
    for (let i = 0; i < 25; i++) {
      const supervisor = new User({
        name: faker.person.fullName(),
        uniqueId: faker.string.alphanumeric(8).toUpperCase(),
        department: 'Computer Science',
        role: 'supervisor',
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword
      });
      supervisors.push(supervisor);
    }
    const savedSupervisors = await User.insertMany(supervisors);
    console.log(`✓ Created ${savedSupervisors.length} supervisors`);

    // Create 200 students
    console.log('Creating 200 students...');
    const students = [];
    for (let i = 0; i < 200; i++) {
      const student = new User({
        name: faker.person.fullName(),
        uniqueId: faker.string.alphanumeric(8).toUpperCase(),
        department: 'Computer Science',
        role: 'student',
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword
      });
      students.push(student);
    }
    const savedStudents = await User.insertMany(students);
    console.log(`✓ Created ${savedStudents.length} students`);

    // Create projects (around 30-40 projects)
    console.log('Creating projects...');
    const projects = [];
    const projectTopics = [
      'Machine Learning Applications',
      'Web Development Framework',
      'Mobile App Development',
      'Database Optimization',
      'Artificial Intelligence Research',
      'Cybersecurity Analysis',
      'Data Mining Techniques',
      'Cloud Computing Solutions',
      'Software Testing Automation',
      'Computer Vision System',
      'Natural Language Processing',
      'Blockchain Technology',
      'IoT Smart System',
      'Game Development Project',
      'Network Security Protocol',
      'Big Data Analytics',
      'Augmented Reality App',
      'Distributed System Design',
      'Algorithm Optimization',
      'Human Computer Interaction'
    ];

    for (let i = 0; i < 35; i++) {
      const randomTopic = faker.helpers.arrayElement(projectTopics);
      const supervisor_first = faker.helpers.arrayElement(savedSupervisors)._id;
      
      // 30% chance of having second supervisor
      let supervisor_second = null;
      if (Math.random() < 0.3) {
        const availableSupervisors = savedSupervisors.filter(s => !s._id.equals(supervisor_first));
        supervisor_second = faker.helpers.arrayElement(availableSupervisors)._id;
      }

      // 40% chance of having assigned student
      let assignedStudent = null;
      let status = 'available';
      if (Math.random() < 0.4) {
        assignedStudent = faker.helpers.arrayElement(savedStudents)._id;
        status = 'assigned';
      }

      const project = {
        title: `${randomTopic} - ${faker.company.buzzPhrase()}`,
        description: faker.lorem.paragraphs(2, '\n\n'),
        supervisor_first: supervisor_first,
        department: 'Computer Science',
        type: faker.helpers.arrayElement(['Research and development', 'Applied']),
        status: status
      };

      // Add optional fields
      if (supervisor_second) {
        project.supervisor_second = supervisor_second;
      }
      if (assignedStudent) {
        project.assignedStudent = assignedStudent;
        project.assignedAt = faker.date.recent({ days: 30 });
      }

      projects.push(project);
    }

    const savedProjects = await Project.insertMany(projects);
    console.log(`✓ Created ${savedProjects.length} projects`);

    // Summary
    console.log('\n=== SEEDING COMPLETED ===');
    console.log(`Supervisors: ${savedSupervisors.length}`);
    console.log(`Students: ${savedStudents.length}`);
    console.log(`Projects: ${savedProjects.length}`);
    console.log(`Assigned Projects: ${savedProjects.filter(p => p.status === 'assigned').length}`);
    console.log(`Available Projects: ${savedProjects.filter(p => p.status === 'available').length}`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Connect to MongoDB and run seeding
const runSeed = async () => {
  try {
    // Replace with your MongoDB connection string
    await mongoose.connect( process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    await seedDatabase();
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Run the seeding script
runSeed();