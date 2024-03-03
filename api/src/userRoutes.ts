import { PostSchema, UserSchema } from "./schemas.js";
import { social_db } from "./dbInit.js";
import { Request, Response } from "express";
import bcrypt from "bcrypt";

const users_coll = social_db.collection<UserSchema>("users");

export const addUsernames = async (posts:PostSchema[]) => {
    const updatedPosts = await Promise.all(
        posts.map(async (post) => {
        const userInfo = await users_coll.findOne({_id: post.author});
        if(!userInfo) return null;
        else return{
          ...post,
          author: {
            username: userInfo.username,
            _id: post.author,
          }
        }
      }
    ));
    return updatedPosts;
}

export const register = async (req: Request <{}, {}, {email: string, username: string, password: string}>, res: Response) => {
    try {
      const { username, password, email } = req.body;
      const existingEmail = await users_coll.findOne({email: email});
      const existingUsername = await users_coll.findOne({username: username});
      if(existingEmail){
        return res.status(400).json({ error: 'Email already exists' });
      }
      if(existingUsername){
        return res.status(400).json({ error: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const insertedUser = await users_coll.insertOne({username, password: hashedPassword, email});

      req.session.user = { uid: insertedUser.insertedId.toString(), username, email }
      res.status(201).json({ message: 'User registered successfully', content: req.session.user });
    }
    catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const logIn = async (req: Request<{}, {usernameOrEmail: string, password: string}>, res: Response) => {
    try {
      const { usernameOrEmail, password } = req.body;
      const user = await users_coll.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });
      if(!user) {
        return res.status(401).json({error: 'Invalid login'});
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if(!passwordMatch){
        return res.status(401).json({error: 'Invalid login'});
      }
      req.session.user = { uid: user._id.toString(), username: user.username, email: user.email }
      res.status(200).json({ message: 'Login successful', content: req.session.user });
    }
    catch (err) {
      console.error(`Error: ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const checkSession = async (req: Request, res: Response) => {
    try {
      res.status(200).json({ message: 'User is logged in', content: req.session.user})
    }
    catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const logOut = (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(`Error: ${err}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      return res.status(200).json({ message: "User successfully logged out"})
    });
}