import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface Props {
    children: React.ReactNode;
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    onShowClick: (id?: string) => void;
    isLoggedIn: boolean;
}

const CreatePostModal = ({ children, onSubmit, onShowClick, isLoggedIn }: Props) => {
    return(
    <>
        <button
            className="btn btn-primary btn-circle btn-xl position-fixed end-0 bottom-0 m-3"
            data-bs-toggle="modal"
            data-bs-target={isLoggedIn? "#createPostModal" : "#notLoggedInModal"}
            onClick = { () => {
                onShowClick();
            }}
            ><FontAwesomeIcon icon={faPlus} />
        </button>
        {/* <button
            className="btn btn-primary btn-lg position-fixed end-0 bottom-0 m-3"
            data-bs-toggle="modal"
            data-bs-target={isLoggedIn? "#createPostModal" : "#notLoggedInModal"}
            onClick = { () => {
                onShowClick();
            }}
            >
        Create Post
        </button> */}
        <div className="modal fade" id="createPostModal" tabIndex={-1} aria-labelledby="createPostModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="createPostModalLabel">New quote</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {children}
                        <form className='needs-validation' id="createPost" onSubmit={onSubmit} noValidate>
                            <div className="mb-3">
                                <label htmlFor="quote" className="col-form-label required">Quote:</label>
                                <textarea id="quote" className="form-control" name="quote" required></textarea>
                                <div className="invalid-feedback">A quote is required</div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="sourceAuthor" className="col-form-label required">Source (author):</label>
                                <input id="sourceAuthor" type="text" className="form-control" name="sourceAuthor" required/>
                                <div className="invalid-feedback">A source is required</div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="sourceLink" className="col-form-label">Source link:</label>
                                <input id="sourceLink" type="text" className="form-control" name="sourceLink"/>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button id="closeButton" type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button id="submitModalButton" type="submit" form="createPost" className="btn btn-primary">Post quote</button>
                    </div>
                </div>
            </div>
        </div>
    </>
)}

export default CreatePostModal;