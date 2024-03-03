import Post from "./components/Post";
import SearchBar from "./components/SearchBar";
import React, {useEffect, useState} from "react";
import CreatePostModal from "./components/CreatePostModal.tsx";
import NavBar from "./components/NavBar.tsx";
import LogInModal from "./components/LogInModal.tsx";
import NotLoggedInModal from "./components/NotLoggedInModal.tsx";
import ErrorAlert from "./components/ErrorAlert.tsx";
import { v4 as uuidv4 } from 'uuid';
import type { AppError, PostType, UserInfo}  from './types.ts';
import { fetchSession } from "./requestsUtilities.ts";
import { onSearch, onPostCreation, onPostUpdate, onLike, onLogIn, onLogOut, onPostDeletion, onRegister } from "./handlers.ts";

function App() {
  const [postList, setPostList] = useState<PostType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [user, setUser] = useState<UserInfo>(null);
  const [errors, setErrors] = useState<AppError[]>([]);

  // Add event listener to remove validation and values from forms in modals when they are dismissed
  useEffect(() => {
    const onModalHide = () => {
      const formList:NodeListOf<HTMLFormElement> = document.querySelectorAll('.needs-validation');
      for(const form of formList){
        form.classList.remove('was-validated');
        form.reset()
      }
      setErrors((prevErrors) => prevErrors.filter(err => err.type=="general")); // remove modal errors after closing modal
    }

    document.addEventListener('hidden.bs.modal', onModalHide);

    return () => {
      document.removeEventListener('hidden.bs.modal', onModalHide);
    };
  }, []);

  // Fetch session if existent
  useEffect(() => {
    const initSession = async () => {
      const response = await fetchSession();
      if(typeof response === 'string'){
        setErrors(prevErrors => [...prevErrors, {id: uuidv4(), message: response, type: "general" }]);
      }
      else{
        setUser(response.content);
      }
    };
    void initSession();
  }, []);

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

  const removeError = (id: string) => {
    setErrors((prevErrors) =>
      prevErrors.filter((err) => err.id!==id))
  }
  return (
    <>
      <NavBar userData={user} onLogOutHandler={() => onLogOut(user, setUser, setErrors)}/>
      <LogInModal
      onLoginHandler={(e) => onLogIn(e, setUser, setErrors)}
      onRegisterHandler={(e) => onRegister(e, setUser, setErrors)}>
        {errors.filter((err) => err.type=="login").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
      </LogInModal>
      <div className="container pt-4 pt-xxl-5">
        {errors.filter((err) => err.type=="general").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
        <SearchBar onSearchHandler={(e) => onSearch(e, setErrors, setPostList)}></SearchBar>
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
          onLikeHandler={(id) => onLike(id, postList, setPostList, user, setErrors)}
          onDeleteHandler={(id) => onPostDeletion(id, postList, setPostList, setErrors)}
          onUpdateClick={setModalValues}
          isAuthor={post.author._id==user?.uid}
          isLiked={user? post.likes.includes(user.uid) : false}
          isLoggedIn={Boolean(user)}
          />
        ))}
      </div>
      <CreatePostModal
      isLoggedIn={Boolean(user)}
      onShowClick={setModalValues}
      onSubmitHandler={isCreating?
      (e: React.SyntheticEvent<HTMLFormElement>) => onPostCreation(e, user, setPostList, setErrors)
      :
      (e: React.SyntheticEvent<HTMLFormElement>) => onPostUpdate(e, postList, setPostList, setErrors)}>
        {errors.filter((err) => err.type=="create").map(error => (<ErrorAlert key={error.id} onClose={() => removeError(error.id)}>{error.message}</ErrorAlert>))}
      </CreatePostModal>
      <NotLoggedInModal/>
    </>
  );
}



export default App;