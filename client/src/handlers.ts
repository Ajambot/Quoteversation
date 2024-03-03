import React from "react";
import { createPost, deletePost, fetchPosts, likeToggle, login, logout, register, updatePost } from "./requestsUtilities.ts";
import type { AppError, PostType, UserInfo}  from './types.ts';
import { v4 as uuidv4 } from 'uuid';


export const onSearch = (e: React.SyntheticEvent<HTMLFormElement>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>,
    setPostList: React.Dispatch<React.SetStateAction<PostType[]>>) =>
    {void (async (e: React.SyntheticEvent<HTMLFormElement>)   => {
    try {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const searchValue = formData.get("searchValue") as string | null;
      if(searchValue == null) throw new Error("Search value could not be found. Please refresh and try again");
      const response = await fetchPosts({ searchValue });
      if(typeof response === 'string') // There was an error fetching the posts
      {
        throw new Error(response);
      }
      else
      {
        setPostList(response.content);
      }
    }
    catch(err){
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }]);
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }]);
      }
    }
  })(e);};

  export const onLike = async (id: string,
    postList: PostType[], setPostList: React.Dispatch<React.SetStateAction<PostType[]>>,
    user: UserInfo | null,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => {
    try{
      if(!user) throw new Error('User credentials could not be fetched');
      const isLiked = postList.find((post) => post._id===id)?.likes.includes(user.uid);
      if(typeof isLiked === 'undefined') throw new Error('Something went wrong. Please refresh the page and try again.');
      // preemptively change the UI for responsiveness
      setPostList(postList.map(post => {
        if(post._id===id){
          post.likes = isLiked? post.likes.filter((likeId) => likeId!=user.uid) : [...post.likes, user.uid];
        }
        return post;
      }));
      const response = await likeToggle(id, user?.uid, isLiked);
      if(typeof response === 'string') // There was an error toggling the like
      {
        // Undo the preemptive change
        setPostList(prevPostList => prevPostList.map(post => {
          if(post._id===id){
            post.likes = isLiked? [...post.likes, user.uid] : post.likes.filter((likeId) => likeId!=user.uid);
          }
          return post;
        }))
        throw Error(response);
      }
    }
    catch(err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }]);
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }]);
      }
    }
  }

  export const onPostCreation = (e: React.SyntheticEvent<HTMLFormElement>,
    user: UserInfo,
    setPostList: React.Dispatch<React.SetStateAction<PostType[]>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => { void(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
      try{
      e.preventDefault();
      const form = e.currentTarget;
      if(!form.checkValidity()){
        form.classList.add('was-validated');
        return;
      }
      const formData = new FormData(e.currentTarget);
      const quote = formData.get("quote") as string | undefined;
      const sourceAuthor = formData.get("sourceAuthor") as string | undefined;
      const sourceLink = formData.get("sourceLink") as string | undefined;
      if(typeof quote === 'undefined' || typeof sourceAuthor === 'undefined' || typeof sourceLink === 'undefined'){
        throw new Error("New post values could not be found. Please refresh the page and try again")
      }
      if(!user){
        throw new Error('User credentials could not be found. Please refresh the page and try again');
      }
      const newPost = {
        quote: quote,
        author: { username: user.username, _id: user.uid},
        source: {
          text: sourceAuthor,
          link: sourceLink
        }
      }
      const response = await createPost(newPost);
      if(typeof response === 'string'){
        throw new Error(response);
      }
      else{
        setPostList((oldPostList) => [...oldPostList, response.content]);
        document.getElementById("closeButton")?.click();
      }
    }
    catch(err){
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "create" }]);
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "create" }]);
      }
    }
  })(e);}

  export const onPostUpdate = (e: React.SyntheticEvent<HTMLFormElement>,
    postList: PostType[], setPostList: React.Dispatch<React.SetStateAction<PostType[]>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    try{
      e.preventDefault();
      const form = e.currentTarget;
      if(!form.checkValidity()){
        form.classList.add('was-validated');
        return;
      }
      const formData = new FormData(e.currentTarget);
      const id = e.currentTarget.getAttribute("data-postid");
      const quote = formData.get("quote") as string | null;
      const sourceAuthor = formData.get("sourceAuthor") as string | null;
      const sourceLink = formData.get("sourceLink") as string | null;
      if(!id || !quote || !sourceAuthor || !sourceLink){
        throw new Error("Update values could not be found. Please refresh the page and try again.")
      }
      const postUpdates = { quote: quote, sourceAuthor: sourceAuthor, sourceLink: sourceLink };

      const ogPost = JSON.parse(JSON.stringify(postList.find((post) => post._id === id))) as PostType;
      if(!ogPost) throw new Error('An unexpected error occurred');
      setPostList(postList.map((post) => {
        if(post._id === id){
          post.quote = postUpdates.quote;
          post.source.text = postUpdates.sourceAuthor;
          post.source.link = postUpdates.sourceLink;
        }
        return post;
      }));
      document.getElementById("closeButton")?.click();
      const response = await updatePost(id, postUpdates);
      if(typeof response === 'string'){
        setPostList(postList.map((post) => {
          if(post._id === id){
            return ogPost;
          }
          return post;
        }));
        throw new Error(response);
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  })(e);}

  export const onPostDeletion = (id: string,
    postList: PostType[], setPostList: React.Dispatch<React.SetStateAction<PostType[]>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => { void(async (id: string) => {
    try{
      const ogPostList = [...postList];
      const updatedPostList = postList.filter((post) => post._id !== id);
      setPostList(updatedPostList);
      const response = await deletePost(id);
      if(typeof response === 'string'){
        setPostList(ogPostList);
        throw new Error(response);
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  })(id);}

  export const onLogIn = (e: React.SyntheticEvent<HTMLFormElement>,
    setUser: React.Dispatch<React.SetStateAction<UserInfo>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }
    try{
      const formData = new FormData(e.currentTarget);
      const username = formData.get("username/email") as string | null;
      const password = formData.get("password") as string | null;
      if(!username || !password){
        throw new Error("User credentials could not be found. Please refresh and try again.");
      }
      const userCredentials = {
        usernameOrEmail: username,
        password
      }
      const response = await login(userCredentials);
      if(typeof response === 'string'){
        throw new Error(response);
      }
      setUser(response.content);
      document.getElementById("closeLoginForm")?.click();
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "login" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "login" }])
      }
    }
  })(e);}

  export const onRegister = (e: React.SyntheticEvent<HTMLFormElement>,
    setUser: React.Dispatch<React.SetStateAction<UserInfo>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      const username = formData.get("username") as string | null;
      const email = formData.get("email") as string | null;
      const password = formData.get("password") as string | null;
      if(!username || !email || !password){
        throw new Error("User credentials could not be found. Please refresh and try again.");
      }
      const registerCredentials = { username, email, password };
      const response = await register(registerCredentials);
      if(typeof response === 'string'){
        throw new Error(response);
      }
      setUser(response.content);
      document.getElementById("closeLoginForm")?.click();
    } catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "login" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "login" }])
      }
    }
  })(e);}

  export const onLogOut = (
    user: UserInfo, setUser: React.Dispatch<React.SetStateAction<UserInfo>>,
    setErrors: React.Dispatch<React.SetStateAction<AppError[]>>) => { void(async () => {
    try {
      if(!user) throw new Error("User is not logged in");
      setUser(null);
      const response = await logout();
      if(typeof response === 'string'){
        throw new Error(response);
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  })();}