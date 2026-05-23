import axios from "axios";
import { setAlert } from "./alertAction";
import * as types from "./types";

// Get current Grn
export const getGrn = (id) => async (dispatch) => {
  try {
    const res = await axios.get(`/api/grn/${id}`);

    dispatch({
      type: types.GET_GRN,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Get all Grn
export const getGrns = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/grn");
    dispatch({
      type: types.GET_GRNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all Grn
export const getLimitedGrns = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/grn/limited");
    dispatch({
      type: types.GET_GRNS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

//Get all CGrn
export const getForReceived = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(
      `/api/grn?ecciNumber=${ecciNumber}&transactionType=GRN&modeOfDelivery=MILK+RUN`
    );
    dispatch({
      type: types.GET_FOR_RECEIVE,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

export const getForMrTransit = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(
      `/api/grn?ecciNumber=${ecciNumber}&transactionType=DO&modeOfDelivery=MILK+RUN`
    );
    dispatch({
      type: types.GET_FOR_MR_TRANSIT,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

export const getForDdTransit = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(
      `/api/grn?ecciNumber=${ecciNumber}&transactionType=GRN&modeOfDelivery=DIRECT+DELIVERY`
    );
    dispatch({
      type: types.GET_FOR_DD_TRANSIT,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

export const getForDdDo = (ecciNumber) => async (dispatch) => {
  try {
    const res = await axios.get(
      `/api/grn?ecciNumber=${ecciNumber}&transactionType=DO&modeOfDelivery=DIRECT+DELIVERY`
    );
    dispatch({
      type: types.GET_FOR_DD_DO,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.GRN_ERROR,
      payload: { status: err.response },
    });
  }
};

// Add Grn
export const addGrn = (formData, history) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/grn", formData);
    dispatch({
      type: types.ADD_GRN,
      payload: res.data,
    });

    dispatch(setAlert("Stock Movement Report Added", "success"));

    // history.push("/Grn");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.GRN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Add CGrn
export const addManualGrn = (formData) => async (dispatch) => {
  console.log(formData);
  try {
    const res = await axios.post("/api/grn/create", formData);
    dispatch({
      type: types.ADD_GRN,
      payload: res.data,
    });

    dispatch(setAlert("Added Sucessfully", "success"));
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.GRN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

// Edit Grn
export const editGrn = (formData, id, history) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await axios.patch(`/api/grn/${id}`, formData, config);

    dispatch({
      type: types.GET_GRN,
      payload: res.data,
    });

    dispatch(setAlert("Grn Updated", "success"));

    history.push("/Grn");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.GRN_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};

//Set Current Grn
export const setCurrentGrn = (Grn) => async (dispatch) => {
  dispatch({
    type: types.SET_CURRENT_GRN,
    payload: Grn,
  });
};

// Clear Grn
export const clearGrn = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_GRN });
};

//Filter Grn
export const filterGrn = (text) => async (dispatch) => {
  dispatch({ type: types.FILTER_GRN, payload: text });
};

// Clear Filter
export const clearFilter = () => async (dispatch) => {
  dispatch({ type: types.CLEAR_FILTER });
};
