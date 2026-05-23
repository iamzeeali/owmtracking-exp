import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";
import { filterGrn, clearFilter } from "../_actions/grnAction";

const FilterGrn = ({ filterGrn, clearFilter, filtered }) => {
  const text = useRef("");

  useEffect(() => {
    if (filtered === null) {
      text.current.value = "";
    }
  });

  const onChangeHandler = (e) => {
    if (text.current.value !== null) {
      filterGrn(e.target.value);
    } else {
      clearFilter();
    }
  };

  return (
    <div className='input-group mt-5'>
      <input
        ref={text}
        type='text'
        className='form-control col-sm-2 search-menu'
        placeholder='Search ECCI'
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
  grns: state.grn.grns,
  filtered: state.grn.filtered,
});

export default connect(mapStateToProps, { filterGrn, clearFilter })(FilterGrn);
