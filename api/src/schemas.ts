import type { ObjectId } from "mongodb"

export type PostSchema = {
    quote: string,
    datePosted: Date,
    likes: ObjectId[],
    author: ObjectId,
    bookmarks: ObjectId[],
    comments: {text: string, likes: number, author: ObjectId}[],
    source: {text: string, link: string}
};

export type UserSchema = {
    username: string,
    password: string,
    email: string
};