import express, { Request, Response, NextFunction, Application } from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt"
import session from "express-session"
import MongoStore from 'connect-mongo'

declare module 'express-session' {
  interface SessionData {
    user: {
      username: string,
      email: string
      uid: string,
    };
  }
};

type Post = {
  quote: string,
  datePosted: Date,
  likes: ObjectId[],
  author: ObjectId,
  bookmarks: ObjectId[],
  comments: {text: string, likes: number, author: ObjectId}[],
  source: {text: string, link: string}
};

type User = {
  username: string,
  password: string,
  email: string
};

// Initialize environment variables, and ExpressJs
dotenv.config({
  path: "../.env",
});
const environment = process.env.NODE_ENV;
const port = process.env.PORT || 5000;
const app: Application = express();
app.use(express.json());
app.use(express.urlencoded());
const urlOrigin = environment=="development"? 'http://localhost:5173': 'proURL.com:12347';
app.use(cors({origin: urlOrigin, optionsSuccessStatus: 200, credentials: true}));

// Initialize MongoDB
const uri = environment=="development"? process.env.DEV_ATLAS_URI : process.env.PROD_ATLAS_URI;
if(!uri) {
  throw new Error("Cannot find ATLAS_URI in .env");
}
const client = new MongoClient(uri);
const social_db = environment=="development"? client.db("dev_social_data") : client.db("social_data");
const posts_coll = social_db.collection<Post>("posts");
const users_coll = social_db.collection<User>("users");

// Connect to Cluster
const connectToDB = async () => {
  try {
    await client.connect();
    console.log(`Connected to the cluster`);
  } catch (err) {
    console.error(`Error connecting to the cluster: ${err}`);
  }
};

connectToDB();

if(!process.env.SECRET) {
  throw new Error("Cannot find secret for session in .env");
}

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: uri,
    ttl: 14 * 24 * 60 * 60, // 2 weeks
    dbName: "metadata",
    collectionName: "sessions"}),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
  }))

  const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
    if(req.session.user) {
      next();
    }
    else {
      return res.status(401).json({ error: "User is not authenticated" });
    }
  }

const limit = 20;

interface RequestParams {}

interface ResponseBody {}

interface RequestBody {}

interface PostsReqQuery {
  searchTerm?: string;
  beforeDate?: string;
  afterDate?: string;
  source?: string;
  sort?: {
    [sortField in
      | "quote"
      | "author"
      | "datePosted"
      | "source"
      | "likes"
      | "comments"
      | "bookmarks"]: 1 | -1;
  };
  skip?: number;
}

// posts route
app.get(
  "/posts",
  async (
    req: Request<RequestParams, ResponseBody, RequestBody, PostsReqQuery>,
    res: Response
  ) => {
    // Create a MongoDB Search Pipeline
    try {
      const { searchTerm, beforeDate, afterDate, source, sort, skip } =
        req.query;
      let pipeline: Array<{ [key: string]: any }> = [
        { $sort: { datePosted: -1 } },
        { $limit: limit },
        { $skip: skip || 0 },
      ];

      if (sort) pipeline[0].$sort = sort;
      if (searchTerm || beforeDate || afterDate || source) {
        pipeline.unshift({
          $search: {
            index: "postsIndex",
            compound: {},
          },
        });
        let searchComp = pipeline[0].$search.compound;
        if (source) {
          if (!searchComp.must) searchComp.must = [];
          searchComp.must.push({
            text: {
              query: source,
              path: "source.text",
            },
          });
        }

        if (beforeDate || afterDate) {
          if (!searchComp.must) searchComp.must = [];
          let rangeQuery: any = {
            range: {
              path: "datePosted",
            },
          };
          if (beforeDate) rangeQuery.range.lte = new Date(beforeDate);
          if (afterDate) rangeQuery.range.gte = new Date(afterDate);
          searchComp.must.push(rangeQuery);
        }

        if (searchTerm) {
          searchComp.should = [
            {
              text: {
                query: searchTerm,
                path: ["quote", "source.text"],
              },
            },
          ];
        }
      }
      const posts = await posts_coll.aggregate(pipeline).toArray();
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
        const userInfo = await users_coll.findOne({_id: post.author});
        if(!userInfo) return res.status(404).json({error: `User info for one of the authors of the list of posts could not be found`});
        return{
          ...post,
          author: {
            username: userInfo.username,
            _id: post.author,
          }
        }
      }
      ));
      return res.status(200).json({message: "Posts fetched successfully", content: updatedPosts});
    } catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

app.post(
  "/posts",
  isLoggedIn,
  async (req: Request<RequestParams, ResponseBody,
    {
      quote: string,
      author: { username: string, _id: string}, // need to update this after creating authentication
      source: {
        text: string,
        link: string
      }
    }>,
    res: Response) => {
      try {
        const authorId = req.body.author._id;
        const authorUsername = req.body.author.username;
        if(!req.session.user) return res.status(401).json({ error: "User is not authenticated" });
        if(authorId !== req.session.user.uid) return res.status(403).json({error: "User is not authorized to perform this action"});
        const post = {
          ...req.body,
          author: new ObjectId(authorId)  ,
          datePosted: new Date,
          likes: [],
          bookmarks: [],
          comments: [],
        }
        const result = await posts_coll.insertOne(post);
        return res.status(201).json({message: "Post created successfully", content: {...post, _id: result.insertedId, author: {username: authorUsername, _id: authorId}}});
      } catch (err) {
        console.error(`Error ${err}`);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    }
)

// app.get(
//   "/users/:_id",
//   async (
//     req: Request<{ _id: string }, ResponseBody, RequestBody>,
//     res: Response
//   ) => {
//     try {
//       const user = await users_coll.findOne({
//         _id: new ObjectId(req.params._id),
//       });
//       if(!user) {
//         return res.status(404).json({ error: 'User could not be found' });
//       }
//       res.json({ _id: user._id, username: user.username, email: user.email });
//     } catch (err) {
//       console.error(`Error ${err}`);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//   }
// );

app.delete(
  "/posts/:_id",
  isLoggedIn,
  async (
    req: Request<{ _id: string }, ResponseBody, RequestBody>,
    res: Response
  ) => {
    try {
      const postToBeDeleted = await posts_coll.findOne({_id: new ObjectId(req.params._id)});
      if(!req.session.user){
        return res.status(401).json({ error: "User is not authenticated" });
      }
      if(!postToBeDeleted){
        return res.status(404).json({ error: 'Post to be deleted could not be found'});
      }
      if(postToBeDeleted.author.toString()!=req.session.user.uid){
        return res.status(403).json({ error: 'User is not authorized to perform this action'});
      }
      await posts_coll.deleteOne({
        _id: new ObjectId(req.params._id),
      });
      return res.status(204).json();
    } catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

app.patch(
  "/posts/:_id",
  isLoggedIn,
  async (
    req: Request<{ _id: string }, {quote: string, sourceText: string, sourceLink: string}>,
    res: Response
  ) => {
    try{
      const postToBeUpdated = await posts_coll.findOne({_id: new ObjectId(req.params._id)});
      if(!req.session.user){
        return res.status(401).json({ error: "User is not authenticated" });
      }
      if(!postToBeUpdated){
        return res.status(404).json({ error: 'Post to be updated could not be found'});
      }
      if(postToBeUpdated.author.toString()!=req.session.user.uid){
        return res.status(403).json({ error: 'User is not authorized to perform this action'});
      }
      const {quote, sourceAuthor, sourceLink} = req.body;

      await posts_coll.updateOne({_id: new ObjectId(req.params._id) }, { $set: { quote: quote, "source.text": sourceAuthor, "source.link": sourceLink }});
      return res.status(204).json();
    }
    catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
)


app.post(
  "/posts/:_id/like",
  isLoggedIn,
  async (
    req: Request<{ _id: string }, ResponseBody, {uid: string}>,
    res: Response
  ) => {
    try {
      if(!req.session.user){
        return res.status(401).json({ error: "User is not authenticated" });
      }
      if(req.body.uid != req.session.user.uid)
      {
        return res.status(403).json({ error: "User is not authorized to perform this action" });
      }
      const likerId = new ObjectId(req.body.uid);
      const doc = await posts_coll.findOne({_id: new ObjectId(req.params._id)}, {projection: {likes: 1, _id: 0}});
      if(!doc) {
        return res.status(404).json({ error: 'Post to be liked could not be found'});
      }
      if(doc.likes.some((like) => like.equals(likerId))){
        return res.status(400).json({error: "User has already liked the specified post"})
      }
      await posts_coll.updateOne({_id: new ObjectId(req.params._id)}, {$push: {likes: likerId}});
      return res.status(201).json({ message: "Post liked successfully" });
    } catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

app.delete(
  "/posts/:_id/like",
  isLoggedIn,
  async (
    req: Request<{ _id: string }, ResponseBody, {uid: string}>,
    res: Response
  ) => {
    try {
      if(!req.session.user){
        return res.status(401).json({ error: "User is not authenticated" });
      }
      if(req.body.uid != req.session.user.uid)
      {
        return res.status(403).json({ error: "User is not authorized to perform this action" });
      }
      const likerId = new ObjectId(req.body.uid);
      const doc = await posts_coll.findOne({_id: new ObjectId(req.params._id)}, {projection: {likes: 1, _id: 0}});
      if(!doc) {
        return res.status(404).json({ error: 'Post to be liked could not be found'});
      }
      if(!doc.likes.some((like) => like.equals(likerId))){
        return res.status(400).json({ error: "User has not liked the specified post" });
      }
      await posts_coll.updateOne({_id: new ObjectId(req.params._id)}, {$pull: {likes: likerId}});
      return res.status(204).json();
    } catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
);

app.post(
  "/register",
  async (req: Request <RequestParams, ResponseBody, {email: string, username: string, password: string}>, res: Response) => {
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
)

app.post(
  "/login",
  async (req: Request<RequestParams, {usernameOrEmail: string, password: string}>, res: Response) => {
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
);

app.get("/session", isLoggedIn, async (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: 'User is logged in', content: req.session.user})
  }
  catch (err) {
    console.error(`Error ${err}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.post("/logout", isLoggedIn, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) { 
      console.error(`Error: ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    return res.status(200).json({ message: "User successfully logged out"})
  });
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
