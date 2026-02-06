import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = "winevill_secret_key";
const MONGO_URI = "mongodb+srv://jamessabblah123_db_user:<db_password>@learn-m0.28aoya8.mongodb.net/? appName=learn-m0"; // <-- Replace with your MongoDB connection string

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// User Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: { type: String, enum: ["admin", "teacher", "student"] }
});
const User = mongoose.model("User", UserSchema);

// Student Model
const StudentSchema = new mongoose.Schema({
  userId: String,
  level: String,
  className: String,
  feesPaid: Boolean
});
const Student = mongoose.model("Student", StudentSchema);

// Result Model
const ResultSchema = new mongoose.Schema({
  studentId: String,
  subject: String,
  term: String,
  score: Number
});
const Result = mongoose.model("Result", ResultSchema);

// Attendance Model
const AttendanceSchema = new mongoose.Schema({
  studentId: String,
  date: String,
  present: Boolean
});
const Attendance = mongoose.model("Attendance", AttendanceSchema);

// Auth Middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
}

// Routes
app.post("/api/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ name, email, password: hashed, role });
  await user.save();
  res.json({ msg: "User created" });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Wrong password" });
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
  res.json({ token, role: user.role, name: user.name });
});

app.post("/api/students", auth, async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.json(student);
});

app.get("/api/students", auth, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

app.post("/api/results", auth, async (req, res) => {
  const result = new Result(req.body);
  await result.save();
  res.json(result);
});

app.get("/api/results/:studentId", auth, async (req, res) => {
  const results = await Result.find({ studentId: req.params.studentId });
  res.json(results);
});

app.post("/api/attendance", auth, async (req, res) => {
  const record = new Attendance(req.body);
  await record.save();
  res.json(record);
});

app.get("/api/attendance/:studentId", auth, async (req, res) => {
  const records = await Attendance.find({ studentId: req.params.studentId });
  res.json(records);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
