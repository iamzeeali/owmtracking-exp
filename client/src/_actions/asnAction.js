import axios from "axios";
import { setAlert } from "./alertAction";
import * as types from "./types";

// Get current Asn
export const getAsn = (id) => async (dispatch) => {
  try {
    const res = await axios.get(`/api/asn/${id}`);

    dispatch({
      type: types.GET_ASN,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.ASN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Get all Asn
export const getAsns = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(`/api/asn?ecciNumber=${ecciNumber}`);

    dispatch({
      type: types.GET_ASNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.ASN_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all Asn
export const getAllAsns = () => async (dispatch) => {
  try {
    const res = await axios.get(`/api/asn`);
    dispatch({
      type: types.GET_ASNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.ASN_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all Asn
export const getLimitedAsns = () => async (dispatch) => {
  try {
    const res = await axios.get(`/api/asn/limited`);
    dispatch({
      type: types.GET_ASNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.ASN_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all CAsn
export const getAsnsOnly = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(
      `/api/asn?ecciNumber=${ecciNumber}&transactionType=Asn`
    );
    dispatch({
      type: types.GET_ASNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.ASN_ERROR,
      payload: { status: err.response },
    });
  }
};

// Add Asn
export const addAsn = (formData, history) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/asn", formData);
    dispatch({
      type: types.ADD_ASN,
      payload: res.data,
    });

    dispatch(setAlert("ASN Added", "success"));

    // history.push("/Asn");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.ASN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Add CAsn
export const addManualAsn = (formData, history) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/asn/create", formData);
    dispatch({
      type: types.ADD_ASN,
      payload: res.data,
    });

    dispatch(setAlert("ASN Added", "success"));

    // history.push("/Asn");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.ASN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Edit Asn
export const editAsn = (formData, id, history) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.patch(`/api/asn/${id}`, formData, config);

    dispatch({
      type: types.GET_ASN,
      payload: res.data,
    });

    dispatch(setAlert("Asn Updated", "success"));

    history.push("/Asn");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.ASN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Set Current Asn
export const setCurrentAsn = (Asn) => async (dispatch) => {
  dispatch({
    type: types.SET_CURRENT_ASN,
    payload: Asn,
  });
};

// Clear Asn
export const clearAsn = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_ASN });
};

//Filter Asn
export const filterAsn = (text) => async (dispatch) => {
  dispatch({ type: types.FILTER_ASN, payload: text });
};

// Clear Filter
export const clearFilter = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_FILTER });
};
