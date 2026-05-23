import axios from "axios";
import { setAlert } from "./alertAction";
import * as types from "./types";

// Get current Customer
export const getCustomer = (id) => async (dispatch) => {
  try {
    const res = await axios.get(`/api/customer/${id}`);

    dispatch({
      type: types.GET_CUSTOMER,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Get all Customer
export const getCustomers = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/customer");
    dispatch({
      type: types.GET_CUSTOMERS,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all CCustomer
export const getCCustomers = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/ccustomer");
    dispatch({
      type: types.GET_CUSTOMERS,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { status: err.response },
    });
  }
};

// Add Customer
export const addCustomer = (formData, history) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/customer", formData);
    dispatch({
      type: types.ADD_CUSTOMER,
      payload: res.data,
    });

    dispatch(setAlert("Customer Added", "success"));

    // history.push("/Customer");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Add CCustomer
export const addCCustomer = (formData, history) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/ccustomer", formData);
    dispatch({
      type: types.ADD_CUSTOMER,
      payload: res.data,
    });

    dispatch(setAlert("Customer Added", "success"));

    // history.push("/Customer");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Edit Customer
export const editCustomer = (formData, id, history) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.patch(`/api/customer/${id}`, formData, config);

    dispatch({
      type: types.GET_CUSTOMER,
      payload: res.data,
    });

    dispatch(setAlert("Customer Updated", "success"));

    history.push("/Customer");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.CUSTOMER_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Set Current Customer
export const setCurrentCustomer = (Customer) => async (dispatch) => {
  dispatch({
    type: types.SET_CURRENT_CUSTOMER,
    payload: Customer,
  });
};

// Clear Customer
export const clearCustomer = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_CUSTOMER });
};

//Filter Customer
export const filterCustomer = (text) => async (dispatch) => {
  dispatch({ type: types.FILTER_CUSTOMER, payload: text });
};

// Clear Filter
export const clearFilter = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_FILTER });
};
