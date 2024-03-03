import React from 'react'

interface Props {
    onSearchHandler: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

function SearchBar({ onSearchHandler: onSearch }: Props) {
    return (
        <form id='searchBar' className="input-group mb-3" onSubmit={onSearch} role='search'>
            <input type="text" name="searchValue" className="form-control" placeholder='Search a quote or source' aria-label='Search a quote' aria-describedby='button-addon2'/>
            <button className="btn btn-outline-success" type="submit" id="button-addon2">Submit</button>
        </form>
  )
}

export default SearchBar