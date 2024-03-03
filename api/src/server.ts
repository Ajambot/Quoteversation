import express, { Request, Response, NextFunction } from "express";
import cors from "cors"
import dotenv from "dotenv";
import session from "express-session"
import MongoStore from 'connect-mongo'
import { createPost, deletePost, getPosts, likePost, unlikePost, updatePost } from "./postRoutes.js";
import { checkSession, logIn, logOut, register } from "./userRoutes.js";

// Add typing support to session data
declare module 'express-session' {
  interface SessionData {
    user: {
      username: string,
      email: string
      uid: string,
    };
  }
};

dotenv.config({
  path: "../.env",
});

const environment = process.env.NODE_ENV;
// Initialize MongoDB
const uri = environment=="development"? process.env.DEV_ATLAS_URI : process.env.PROD_ATLAS_URI;
if(!uri) {
  throw new Error("Cannot find ATLAS_URI in .env");
}

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const urlOrigin = environment=="development"? 'http://localhost:5173': ['https://www.quoteversation.me', 'https://quoteversation.me'];
app.use(cors({
  origin: urlOrigin,
  optionsSuccessStatus: 200,
  credentials: true,
}));

// Trust Nginx reverse proxy
if(environment=="production"){
  app.set('trust proxy', 1);
  app.enable('trust proxy');
}

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
    proxy: true,
    cookie: {
      sameSite: environment=="development"? "lax": "none",
      secure: !(environment=="development"),
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

app.get(
  "/posts",
  getPosts
);

app.post(
  "/posts",
  isLoggedIn,
  createPost
)

app.delete(
  "/posts/:_id",
  isLoggedIn,
  deletePost
);

app.patch(
  "/posts/:_id",
  isLoggedIn,
  updatePost
)

app.post(
  "/posts/:_id/like",
  isLoggedIn,
  likePost
);


app.delete(
  "/posts/:_id/like",
  isLoggedIn,
  unlikePost
);

app.post(
  "/register",
  register
)

app.post(
  "/login",
  logIn
);

app.get("/session", isLoggedIn, checkSession)

app.post("/logout", isLoggedIn, logOut);

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
