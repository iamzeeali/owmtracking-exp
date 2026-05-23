import * as types from "../_actions/types";

const initialState = {
  data: [],
  results: 0,
  loading: true,
  error: {},
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case types.GET_REPORTS:
      return {
        ...state,
        data: payload.data || [],
        results: payload.results || 0,
        loading: false,
        error: {},
      };
    case types.REPORT_ERROR:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    default:
      return state;
  }
}
