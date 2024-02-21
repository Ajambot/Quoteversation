import Post from "./components/Post";
import SearchBar from "./components/SearchBar";
import React, {useEffect, useState} from "react";
import CreatePostModal from "./components/CreatePostModal.tsx";
import NavBar from "./components/NavBar.tsx";
import LogInModal from "./components/LogInModal.tsx";
import NotLoggedInModal from "./components/NotLoggedInModal.tsx";
import ErrorAlert from "./components/ErrorAlert.tsx";
import { v4 as uuidv4 } from 'uuid';

type SuccessfulResponse<Content = undefined> = {
  message: string,
  content: Content
}

type ErrorResponse = {
  error: string
}

type AppError = {
  id: string,
  message: string,
  type: "general" | "login" | "create";
}

type Post = {
  _id: string,
  quote: string,
  datePosted: Date,
  likes: string[],
  author: { username: string, _id: string },
  bookmarks: string[],
  comments: [{text: string, likes: number, author: string}],
  source: {text: string, link: string}
}

type UserInfo = {
  uid: string,
  username: string,
  email: string
}

function App() {
  const environment = import.meta.env.VITE_NODE_ENV;
  const api_base = environment=='development'?
    "http://localhost:" + (import.meta.env.VITE_API_PORT || "5000")
    :
    "https://prodUrl:" + (import.meta.env.VITE_API_PORT || "5000");
  const [postList, setPostList] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<{uid: string, email: string, username: string } | null>(null);
  const [errors, setErrors] = useState<AppError[]>([]);

  const GetPosts = (e: React.SyntheticEvent<HTMLFormElement>) => {void (async (e: React.SyntheticEvent<HTMLFormElement>)   => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("searchValue") as string;
    try {
      const response = await fetch(
        api_base +
          "/posts?" +
          new URLSearchParams({
            searchTerm: searchValue,
          }).toString()
      );
      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
      const successfulResponse = await response.json() as SuccessfulResponse<Post[]>;
      setPostList(successfulResponse.content);
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general"}])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  })(e);};

  const likeToggle = async (id: string) => {
    try {
      if(!user) throw new Error("User details could not be found");
      const isLiked = postList.find((post) => post._id===id)?.likes.includes(user.uid);
      setPostList(postList.map(post => {
        if(post._id === id){
          post.likes = isLiked? post.likes.filter((id) => id!=user.uid) : [...post.likes, user.uid];
        }
        return post;
      }));
      const response = await fetch(api_base+"/posts/"+id+"/like", {
        headers: {
          'content-type': 'application/json'
        },
        method: isLiked? 'DELETE' : 'POST',
        credentials: 'include',
        body: JSON.stringify({uid: user.uid})
      });
      if(!response.ok){
        setPostList(postList.map(post => {
          if(post._id === id){
            post.likes = isLiked? [...post.likes, user.uid] : post.likes.filter((id) => id!=user.uid);
          }
          return post;
        }));
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  }

  const createPost = (e: React.SyntheticEvent<HTMLFormElement>) => { void(
    async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const quote = formData.get("quote");
    const sourceAuthor = formData.get("sourceAuthor");
    const sourceLink = formData.get("sourceLink");

    const newPost = {
      quote: quote,
      author: { username: user?.username, _id: user?.uid},
      source: {
        text: sourceAuthor,
        link: sourceLink
      }
    }

    try {
      const response = await fetch(api_base+"/posts",{
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(newPost),
      });
      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
      const successfulResponse = await response.json() as SuccessfulResponse<Post>;
      setPostList((oldPostList) => [...oldPostList, successfulResponse.content]);
      document.getElementById("closeButton")?.click();
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "create" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "create" }])
      }
    }
  })(e);}

  const updatePost = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const id = e.currentTarget.getAttribute("data-postid") as string;
    const quote = formData.get("quote") as string;
    const sourceAuthor = formData.get("sourceAuthor") as string;
    const sourceLink = formData.get("sourceLink") as string;
    const postUpdates = { quote: quote, sourceAuthor: sourceAuthor, sourceLink: sourceLink };

    try{
      const ogPost = JSON.parse(JSON.stringify(postList.find((post) => post._id === id))) as Post;
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
      const response = await fetch(api_base+"/posts/"+id, {
        method: "PATCH",
        headers: {
          'content-type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(postUpdates),
      });
      if(!response.ok){
        setPostList(postList.map((post) => {
          if(post._id === id){
            return ogPost;
          }
          return post;
        }));
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
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

  // Add event listener to remove validation and values from forms in modals when they are dismissed
  useEffect(() => {
    const onModalHide = () => {
      const formList:NodeListOf<HTMLFormElement> = document.querySelectorAll('.needs-validation');
      for(const form of formList){
        form.classList.remove('was-validated');
        form.reset()
      }
      setErrors((prevErrors) => prevErrors.filter(err => err.type=="general"));
    }

    document.addEventListener('hidden.bs.modal', onModalHide);

    return () => {
      document.removeEventListener('hidden.bs.modal', onModalHide);
    };
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(api_base+"/session", {
          method: 'GET',
          credentials: 'include'
        })
        if(!response.ok && response.status !== 401){
          const errorResponse = await response.json() as ErrorResponse;
          throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
        }
        const successfulResponse = await response.json() as SuccessfulResponse<UserInfo>;
        setUser(successfulResponse.content);
      }
      catch (err) {
        if (err instanceof Error) {
          setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
        } else {
          setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
        }
      }
    }
    void fetchSession();
  }, [api_base]);

  const deletePost = (id: string) => { void(async (id: string) => {
    try{
      const ogPostList = [...postList];
      const updatedPostList = postList.filter((post) => post._id !== id);
      setPostList(updatedPostList);
      const response = await fetch(api_base+"/posts/"+id, {
        method: 'DELETE',
        credentials: 'include'
      })
      if(!response.ok){
        setPostList(ogPostList);
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
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

  const setModalValues = (id?: string) => {
    setIsCreating(id? false: true);
    const quoteField = document.getElementById("quote") as HTMLTextAreaElement;
    const sourceNameField = document.getElementById("sourceAuthor") as HTMLInputElement;
    const sourceLinkField = document.getElementById("sourceLink") as HTMLInputElement;
    const modalTitle = document.getElementById("createPostModalLabel") as HTMLHeadingElement;
    const submitButton = document.getElementById("submitModalButton") as HTMLButtonElement;
    const post = postList.find(post => post._id === id)
    const form = document.getElementById("createPost") as HTMLFormElement;
    if(id && post) {
      form.setAttribute("data-postid", id);
      quoteField.value = post.quote;
      sourceNameField.value = post.source.text;
      sourceLinkField.value = post.source.link;
    }
    else form.removeAttribute("data-postid");
    modalTitle.textContent = !id? "New quote": "Update quote";
    submitButton.textContent = !id? "Post quote": "Update";
  }

  const loginSubmission = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username/email");
    const password = formData.get("password");
    try{
      const response = await fetch(api_base+"/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usernameOrEmail: username, password }),
        credentials: 'include'
      })
      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
      const successfulResponse = await response.json() as SuccessfulResponse<UserInfo>;
      setUser(successfulResponse.content);
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

  const registerSubmission = (e: React.SyntheticEvent<HTMLFormElement>) => {
    void(async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if(!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(api_base+"/register", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      });

      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }

      const successfulResponse = await response.json() as SuccessfulResponse<UserInfo>;
      setUser(successfulResponse.content);
      document.getElementById("closeLoginForm")?.click();
    } catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "login" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "login" }])
      }
    }
  })(e);}

  const onLogOut = () => { void(async () => {
    try {
      if(!user) throw new Error("User is not logged in");
      setUser(null);
      const response = await fetch(api_base+"/logout", {
        method: 'POST',
        credentials: 'include'
      })
      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
    }
    catch (err) {
      if (err instanceof Error) {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: (err as Error).message, type: "general" }])
      } else {
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: 'An unexpected error occurred.', type: "general" }])
      }
    }
  })()}

  const removeError = (id: string) => {
    setErrors((prevErrors) =>
      prevErrors.filter((err) => err.id!==id))
  }
  return (
    <>
      <NavBar userData={user} onLogOut={onLogOut}/>
      <LogInModal onLogin={loginSubmission} onRegister={registerSubmission}>
        {errors.filter((err) => err.type=="login").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
      </LogInModal>
      <div className="container pt-4 pt-xxl-5">
        {errors.filter((err) => err.type=="general").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
        <SearchBar onSubmit={GetPosts}></SearchBar>
        {postList.map(post => (
          <Post key={post._id}
          quote = {post.quote}
          datePosted = {post.datePosted}
          likes = {post.likes.length}
          author = {post.author.username}
          bookmarks = {post.bookmarks}
          comments = {post.comments}
          source = {post.source}
          id = {post._id}
          onLikeClick={likeToggle}
          onCloseClick={deletePost}
          onUpdateClick={setModalValues}
          isAuthor={post.author._id==user?.uid}
          isLiked={user? post.likes.includes(user.uid) : false}
          isLoggedIn={Boolean(user)}
          />
        ))}
      </div>
      <CreatePostModal isLoggedIn={Boolean(user)} onShowClick={setModalValues} onSubmit={isCreating? createPost : updatePost}>
        {errors.filter((err) => err.type=="create").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
      </CreatePostModal>
      <NotLoggedInModal/>
    </>
  );
}



export default App;