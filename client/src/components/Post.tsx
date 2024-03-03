type Comment = {
    text: string;
    likes: number;
    author: string;
  };

type Source = {
  text: string;
  link: string;
};

interface Props {
  quote: string;
  datePosted: Date;
  likes: number;
  author: string;
  bookmarks: string[];
  comments: Array<Comment>;
  source: Source;
  id: string;
  onLikeHandler: (id: string) => Promise<void>;
  onDeleteHandler: (id: string) => void;
  onUpdateClick: (id: string) => void;
  isAuthor: boolean;
  isLiked: boolean;
  isLoggedIn: boolean;
}

const Post = ({
  quote,
  //datePosted,
  likes,
  author,
  //bookmarks,
  //comments,
  source,
  onLikeHandler: onLike,
  onDeleteHandler: onCloseClick,
  onUpdateClick,
  id,
  isAuthor,
  isLiked,
  isLoggedIn
}: Props) => {
  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between">
        {author}
        {
          isAuthor?
            <div>
              <button type="button" className="edit me-3 bi bi-pencil-fill" aria-label="Update" data-bs-toggle="modal"
              data-bs-target="#createPostModal" onClick = { () => onUpdateClick(id) }></button>
              <button type="button" className="btn-close" aria-label="Close" onClick={() => onCloseClick(id)}></button>
            </div>
          :
          <></>
        }
      </div>
      <div className="card-body">
        <blockquote className="blockquote mb-0">
          <p>{quote}</p>
          <footer className="blockquote-footer">
            {source.link===''? <>{source.text}</> : <a target="_blank" href={source.link}>
              {source.text}
            </a>}
          </footer>
        </blockquote>
      </div>
      <div className="card-footer">
        <div>
          <button
            className={"btn btn-outline-success like" + (isLiked ? " active" : "")}
            onClick={isLoggedIn? () => onLike(id): undefined}
            data-bs-toggle={isLoggedIn? undefined : "modal"}
            data-bs-target= {isLoggedIn? "#" : "#notLoggedInModal"}
          >
            <i className="bi bi-envelope-paper-heart me-2 like"></i>
            {likes}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;
