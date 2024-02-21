const NotLoggedInModal = () => {
  return (
    <div className="modal fade" id="notLoggedInModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby="notLoggedInModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="notLoggedInModalLabel">Oops! You're not logged in 😿</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        Access more features like creating your own posts and liking others' posts by logging in now.
                    </div>
                    <div className="modal-footer">
                        <button id="closeButton" type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button id="submitModalButton" data-bs-toggle="modal" data-bs-target="#logInModal" type="button" className="btn btn-primary">Log In</button>
                    </div>
                </div>
            </div>
        </div>
  )
}

export default NotLoggedInModal