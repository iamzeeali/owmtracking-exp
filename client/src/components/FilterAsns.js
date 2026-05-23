import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";
import { filterAsn, clearFilter } from "../_actions/asnAction";

const FilterAsn = ({ filterAsn, clearFilter, filtered }) => {
  const text = useRef("");

  useEffect(() => {
    if (filtered === null) {
      text.current.value = "";
    }
  });

  const onChangeHandler = (e) => {
    if (text.current.value !== null) {
      filterAsn(e.target.value);
    } else {
      clearFilter();
    }
  };

  return (
    <div className='input-group mt-5'>
      <input
        ref={text}
        type='text'
        className='form-control col-sm-4 search-menu'
        placeholder='Search'
        onChange={onChangeHandler}
      />
      <div className='input-group-append'>
        <span className='input-group-text'>
          <i className='fa fa-search text-dark' aria-hidden='true'></i>
        </span>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  asns: state.asn.asns,
  filtered: state.asn.filtered,
});

export default connect(mapStateToProps, { filterAsn, clearFilter })(FilterAsn);
