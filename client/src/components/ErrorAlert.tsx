interface Props {
    children: React.ReactNode
    onClose: () => void;
}

const ErrorAlert = ({ children, onClose } : Props) => {
  return (
    <div className="alert alert-danger alert-dismissible" role="alert">
        {children}
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
    </div>
  )
}

export default ErrorAlert