import axios from "axios";
import { setAlert } from "./alertAction";
import * as types from "./types";

//Get all Feedback
export const getFeedbacks = () => async (dispatch) => {
  try {
    const res = await axios.get("/api/feedback");
    dispatch({
      type: types.GET_FEEDBACKS,
      payload: res.data.data,
    });
  } catch (err) {
    dispatch({
      type: types.FEEDBACK_ERROR,
      payload: { status: err.response },
    });
  }
};

// Add Feedback
export const addFeedback = (formData, history) => async (dispatch) => {
  try {
    const res = await axios.post("/api/feedback", formData);
    dispatch({
      type: types.ADD_FEEDBACK,
      payload: res.data,
    });

    dispatch(setAlert("Thank you for your feedback.", "success"));
    history.push("/");
  } catch (err) {
    const errors = err.response.data.errors;

    if (errors) {
      errors.forEach((error) => dispatch(setAlert(error.msg, "danger")));
    }

    dispatch({
      type: types.FEEDBACK_ERROR,
      payload: { msg: err.response.statusText, status: err.response.status },
    });
  }
};
