import React, { useRef, useEffect } from "react";
import { connect } from "react-redux";
import { filterCustomer, clearFilter } from "../_actions/customerAction";
const FilterCustomer = ({ filterCustomer, clearFilter, filtered }) => {
  const text = useRef("");

  useEffect(() => {
    if (filtered === null) {
      text.current.value = "";
    }
  });

  const onChangeHandler = (e) => {
    if (text.current.value !== null) {
      filterCustomer(e.target.value);
    } else {
      clearFilter();
    }
  };

  return (
    <div className='input-group mb-2'>
      <h6>Customers</h6>

      <input
        ref={text}
        type='text'
        className='ml-auto  form-control col-sm-3'
        placeholder='Search Customers...'
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
  customers: state.customer.customers,
  filtered: state.customer.filtered,
});

export default connect(mapStateToProps, { filterCustomer, clearFilter })(
  FilterCustomer
);
