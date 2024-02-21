interface Props {
  userData: { uid: string; username: string; email: string } | null;
  onLogOut: () => void;
}

const NavBar = ({ userData, onLogOut }: Props) => {
  return (
    <nav className="navbar navbar-expand-lg bg-secondary">
      <div className="container-fluid">
        <span className="h2 mb-0 text-white">
        <img src="quoteversation transparent dark.png" alt="Logo" width="65" height="65" className="mb-3"/>
            Quoteversation
        </span>
        {
            userData?
                <div>
                    <span className='text-white me-3 mb-0 pt-2 align-middle'>{userData.username}</span>
                    <button className='btn btn-primary' onClick={onLogOut}>Log Out</button>
                </div>
                :
                <button className='btn btn-primary' data-bs-toggle="modal" data-bs-target="#logInModal">Login/Signup</button>
        }
      </div>
    </nav>
  );
};

export default NavBar;
