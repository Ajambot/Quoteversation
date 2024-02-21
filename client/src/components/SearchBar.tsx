import React from 'react'

interface Props {
    onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

function SearchBar({ onSubmit }: Props) {
    return (
        <form className="input-group mb-3" onSubmit={onSubmit} role='search'>
            <input type="text" name="searchValue" className="form-control" placeholder='Search a quote or source' aria-label='Search a quote' aria-describedby='button-addon2'/>
            <button className="btn btn-outline-success" type="submit" id="button-addon2">Submit</button>
        </form>
  )
}

export default SearchBar