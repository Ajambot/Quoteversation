import { Request, Response } from "express";
import { PostSchema } from "./schemas";
import { social_db } from "./dbInit.js";
import { addUsernames } from "./userRoutes.js";
import { ObjectId } from "mongodb";

const limit = 20;

const posts_coll = social_db.collection<PostSchema>("posts");

type sortArg = {
    quote?: 1 | -1;
    author?: 1 | -1;
    datePosted?: 1 | -1;
    source?: 1 | -1;
    likes?: 1 | -1;
    comments?: 1 | -1;
    bookmarks?: 1 | -1;
}

interface PostsReqQuery {
  searchTerm?: string;
  beforeDate?: string;
  afterDate?: string;
  source?: string;
  sort?: sortArg;
  skip?: number;
}

type textSearch = {
    text: {
        query: string,
        path: string | string[]
    };
}

type dateSearch = {
    range: {
        path: string,
        lte?: Date,
        gte?: Date
    }
}

type searchStep = {
    $search?: {
        index: string,
        compound: {
            must?: (textSearch | dateSearch)[],
            should?: textSearch[]
        }
    }
}

type sortStep = {
    $sort: sortArg
}

type limitStep = {
    $limit: number
}

type skipStep = {
    $skip: number
}

type searchPipeline = (searchStep | sortStep | limitStep | skipStep)[]

export const getPosts = async (
    req: Request<{}, {}, {}, PostsReqQuery>,
    res: Response
  ) => {
    // Create a MongoDB Search Pipeline
    try {
      const { searchTerm, beforeDate, afterDate, source, sort, skip } = req.query;
      let searchStep:searchStep = {};
      if (searchTerm || beforeDate || afterDate || source) {
        let mustArg:(textSearch | dateSearch)[] = [];
        let shouldArg:textSearch[] = [];
        if (source) {
          mustArg.push({
            text: {
              query: source,
              path: "source.text",
            },
          });
        }
        if (beforeDate || afterDate) {
          mustArg.push({
            range: {
              path: "datePosted",
              lte: beforeDate? new Date(beforeDate) : undefined,
              gte: afterDate? new Date(afterDate): undefined
            },
          });
        }
        if (searchTerm) {
          shouldArg = [
            {
              text: {
                query: searchTerm,
                path: ["quote", "source.text"],
              },
            },
          ];
        }
        searchStep = {
            $search: {
                index: "postsIndex",
                compound: {
                    must: mustArg.length===0? undefined: mustArg,
                    should: shouldArg.length===0? undefined: shouldArg
                }
            }
        }

      }

      let pipeline: searchPipeline = [
        { $sort: sort || { datePosted: -1 } },
        { $limit: limit },
        { $skip: skip || 0 },
      ];

      if(searchStep.$search){
        pipeline.unshift(searchStep);
      }
      const posts = await posts_coll.aggregate(pipeline).toArray() as PostSchema[];
      const updatedPosts = await addUsernames(posts);
      if(!updatedPosts) return res.status(404).json({error: `User info for one of the authors of the list of posts could not be found`});
      return res.status(200).json({message: "Posts fetched successfully", content: updatedPosts});
    } catch (err) {
      console.error(`Error ${err}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

export const createPost = async (req: Request<{}, {},
    {
      quote: string,
      author: { username: string, _id: string},
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

export const deletePost = async (
    req: Request<{ _id: string }, {}, {}>,
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

export const updatePost = async (
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

export const likePost = async (
    req: Request<{ _id: string }, {}, {uid: string}>,
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

export const unlikePost = async (
    req: Request<{ _id: string }, {}, {uid: string}>,
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