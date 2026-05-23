import axios from "axios";
import * as types from "./types";

export const getReportData = (params) => async (dispatch) => {
  try {
    const res = await axios.get("/api/reports", { params });
    dispatch({
      type: types.GET_REPORTS,
      payload: res.data,
    });
  } catch (err) {
    dispatch({
      type: types.REPORT_ERROR,
      payload: {
        msg: err?.response?.statusText || "Unable to fetch report",
        status: err?.response?.status || 500,
      },
    });
  }
};
