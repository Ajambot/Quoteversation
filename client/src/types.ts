export type SuccessfulResponse<Content = undefined> = {
    message: string,
    content: Content
  }

export type ErrorResponse = {
    error: string
}

export type AppError = {
    id: string,
    message: string,
    type: "general" | "login" | "create";
}

export type PostType = {
    _id: string,
    quote: string,
    datePosted: Date,
    likes: string[],
    author: { username: string, _id: string },
    bookmarks: string[],
    comments: [{text: string, likes: number, author: string}],
    source: {text: string, link: string}
  }

export type UserInfo = {
    uid: string,
    username: string,
    email: string
} | null;