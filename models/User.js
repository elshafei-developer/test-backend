import mongoose from "mongoose";
import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
