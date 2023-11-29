import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import UserModel from "./models/User.js";
import jwt from "jsonwebtoken";

// library to Confirm the validity of the data
import { check, validationResult } from "express-validator";

const app = express();
const port = 3000;

mongoose
  .connect("mongodb://localhost:27017")
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((err) => {
    console.log("ERROR MongoDB " + err);
  });

app.use(express.json());

app.post(
  "/register",
  [
    check("username").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  async (req, res) => {
    // Confirm the validity of the data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array());
    }

    try {
      const { username, email, password } = req.body;
      const findUserName = await UserModel.findOne({ username });
      const findEmail = await UserModel.findOne({ email });

      if (findUserName || findEmail) {
        return res.status(401).send("user already exist");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const findUser = await UserModel.findOne({ email });

      if (findUser) {
        return res.status(401).send("user already exist");
      }

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
      });

      await newUser.save();
      res.status(200).send("register is Successfully");
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await UserModel.findOne({ email });

    if (!findUser) {
      return res.status(401).send("email not found");
    } else {
      const validPassword = await bcrypt.compare(password, findUser.password);
      if (validPassword) {
        const token = jwt.sign({ sub: findUser._id }, "test-backend", {
          expiresIn: "1h",
        });
        res
          .status(200)
          .send(
            `token: ${token}\n login successfully Welcome ${findUser.username}`
          );
      } else {
        res.status(401).send("invalid password");
      }
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.put(
  "/recovery/:id",
  [
    check("newUsername").not().isEmpty(),
    check("newEmail").isEmail(),
    check("newPassword").isLength({ min: 8 }),
  ],
  async (req, res) => {
    // Confirm the validity of the data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(`input valid data`);
    }

    try {
      const { id } = req.params;
      const findUser = await UserModel.findById(id);
      if (!findUser) {
        res.status(404).send("user ID not found");
      } else {
        const { newEmail, newPassword, newUsername } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        findUser.email = newEmail ? newEmail : findUser.email;
        findUser.password = newPassword ? hashedPassword : findUser.password;
        findUser.username = newUsername ? newUsername : findUser.username;

        findUser.save();
        res.status(200).send("update successfully");
      }
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
);

app.listen(port, () => console.log("Server is running on port 3000"));
