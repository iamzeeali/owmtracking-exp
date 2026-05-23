import * as types from "../_actions/types";

const initialState = {
  feedback: null,
  feedbacks: [],
  error: {},
  loading: true,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case types.GET_FEEDBACKS:
      return {
        ...state,
        feedbacks: payload,
        loading: false,
      };
    case types.ADD_FEEDBACK:
      return {
        ...state,
        feedback: payload,
        loading: false,
      };

    case types.FEEDBACK_ERROR:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
}
