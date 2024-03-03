import type { ErrorResponse, SuccessfulResponse, PostType, UserInfo}  from './types.ts';

const environment = import.meta.env.PROD;
const devUrl = "http://localhost:" + (import.meta.env.VITE_API_PORT || "5000");
const prodUrl = "https://api.quoteversation.me"
const api_base = environment? prodUrl: devUrl;

export const fetchPosts = async (searchParams: { searchValue: string }) => {
    const { searchValue } = searchParams;
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
        const successfulResponse = await response.json() as SuccessfulResponse<PostType[]>;
        return successfulResponse;
      }
      catch (err) {
        if (err instanceof Error) {
          return (err).message;
        } else {
          return 'An unexpected error occurred.';
        }
      }
};

export const likeToggle = async (postId: string, userId: string | undefined, isLiked: boolean) => {
    try{
        const response = await fetch(api_base+"/posts/"+postId+"/like", {
            headers: {
            'content-type': 'application/json'
            },
            method: isLiked? 'DELETE' : 'POST',
            credentials: 'include',
            body: JSON.stringify({uid: userId})
        });
      if(!response.ok){
        const errorResponse = await response.json() as ErrorResponse;
        throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
      }
    }
    catch (err) {
        if (err instanceof Error) {
            return err.message;
        } else {
            return 'An unexpected error occurred.';
        }
    }
};

type createPostArg = {
  quote: string,
  author: { username: string, _id: string},
  source: {
    text: string,
    link: string
  }
};

export const createPost = async (newPost: createPostArg) => {
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
    const successfulResponse = await response.json() as SuccessfulResponse<PostType>;
    return successfulResponse;
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
};

type updatePostArg = {
  quote: string,
  sourceAuthor: string,
  sourceLink: string
};

export const updatePost = async (id: string, postUpdates:updatePostArg) => {
  try{
    const response = await fetch(api_base+"/posts/"+id, {
      method: "PATCH",
      headers: {
        'content-type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(postUpdates),
    });
    if(!response.ok){
      const errorResponse = await response.json() as ErrorResponse;
      throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
    }
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
};

export const fetchSession = async () => {
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
    return successfulResponse;
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
}

export const deletePost = async (id: string) => {
  try{
    const response = await fetch(api_base+"/posts/"+id, {
      method: 'DELETE',
      credentials: 'include'
    })
    if(!response.ok){
      const errorResponse = await response.json() as ErrorResponse;
      throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
    }
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
}

type userInfo = {
  usernameOrEmail: string,
  password: string
};

export const login = async (credentials: userInfo) => {
  try {
    const { usernameOrEmail, password } = credentials;
    const response = await fetch(api_base+"/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ usernameOrEmail, password }),
      credentials: 'include'
    })
    if(!response.ok){
      const errorResponse = await response.json() as ErrorResponse;
      throw new Error(`${response.status} ${response.statusText}: ${errorResponse.error}`);
    }
    const successfulResponse = await response.json() as SuccessfulResponse<UserInfo>;
    return successfulResponse;
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
}

type registerInfo = {
  username: string,
  email: string,
  password: string
}

export const register = async (credentials: registerInfo) => {
  try{
    const { username, email, password } = credentials;
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
    return successfulResponse;
  }
  catch (err) {
    if (err instanceof Error) {
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
}

export const logout = async () => {
  try{
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
      return err.message;
    } else {
      return 'An unexpected error occurred.';
    }
  }
}