import React, { useState } from 'react'

interface Props {
    children: React.ReactNode;
    onLoginHandler: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    onRegisterHandler: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

const LogInModal = ({children, onLoginHandler,onRegisterHandler: onRegister}: Props) => {
    const [registering, setRegistering] = useState(false);
  return (
    <div className="modal fade" id="logInModal" tabIndex={-1} aria-labelledby="logInModal" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                <div className="modal-header">
                    <h1 className="modal-title fs-5" id="logInModal">{registering? "Register": "Log In"}</h1>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                    {children}
                    <form className='needs-validation' id="logIn" onSubmit={registering? onRegister: onLoginHandler} noValidate>
                        {registering?
                            <>
                                <div className="mb-3">
                                    <label htmlFor="email" className="col-form-label required">Email:</label>
                                    <input type='email' id="email" className="form-control" name="email" required></input>
                                    <div className="invalid-feedback">An email with a valid format is required</div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="username" className="col-form-label required">Username:</label>
                                    <input type='text' id="username" className="form-control" name="username" required></input>
                                    <div className="invalid-feedback">A username is required</div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="col-form-label required">Password:</label>
                                    <input id="password" type="password" className="form-control" name="password" required></input>
                                    <div className="invalid-feedback">A password is required</div>
                                </div>
                            </>
                        :
                            <>
                                <div className="mb-3">
                                    <label htmlFor="username/email" className="col-form-label required">Username or Email:</label>
                                    <input type='text' id="username/email" className="form-control" name="username/email" required></input>
                                    <div className="invalid-feedback">A username or email is required</div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="col-form-label required">Password:</label>
                                    <input id="password" type="password" className="form-control" name="password" required></input>
                                    <div className="invalid-feedback">A password is required</div>
                                </div>
                            </>
                        }
                    </form>
                </div>
                <div className="modal-footer d-flex justify-content-between">
                    <span>{registering? "Already have an account? ": "Don't have an account?"}<br/><button onClick={() => {
                        document.dispatchEvent(new Event("hidden.bs.modal")); // clears the form
                        setRegistering(!registering)
                    }} type="button" className="btn btn-link p-0">{registering? "Log In instead": "Register instead"}</button></span>
                    <div>
                        <button id="logInButton" type="submit" form="logIn" className="btn btn-primary me-2">{registering? "Register": "Log In"}</button>
                        <button id="closeLoginForm" type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
                </div>
            </div>
        </div>
  )
}

export default LogInModal