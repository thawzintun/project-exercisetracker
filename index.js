const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

//DB Connect
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);

//Schema
const userSchema = new mongoose.Schema({
    username: String,
});
const User = mongoose.model("User", userSchema);

const exerciseScheme = new mongoose.Schema({
    description: String,
    duration: Number,
    date: String,
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const Exercise = mongoose.model("Exercise", exerciseScheme);

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
    const { username } = req.body;
    const createUser = await User.create({ username });
    res.json({
        username: createUser.username,
        _id: createUser._id,
    });
});

app.get("/api/users", async (req, res) => {
    const getUsers = await User.find().select("username _id");
    res.json(getUsers);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    const { description, duration, date } = req.body;
    const exerciseData = {
        description,
        duration,
        date: date ? new Date(date).toDateString() : new Date().toDateString(),
        user_id: req.params._id,
    };
    const createExercise = await Exercise.create(exerciseData);
    const getExercise = await Exercise.findById(createExercise._id)
        .populate("user_id")
        .exec();
    res.json({
        _id: getExercise.user_id._id,
        username: getExercise.user_id.username,
        date: getExercise.date,
        duration: getExercise.duration,
        description: getExercise.description,
    });
});

app.get("/api/users/:_id/logs", async (req, res) => {
    const { _id } = req.params;
    const getExercise = await Exercise.find({ user_id: _id }).select(
        "-_id -user_id -__v"
    );
    const getUser = await User.findById(_id).select("_id username");
    const count = await Exercise.countDocuments({ user_id: _id });
    res.json({
        _id: getUser._id,
        username: getUser.username,
        count,
        log: getExercise,
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
