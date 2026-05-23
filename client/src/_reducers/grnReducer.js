import * as types from "../_actions/types";

const initialState = {
  grn: null,
  grns: [],
  received: [],
  mrTransit: [],
  ddTransit: [],
  ddDo: [],
  transDate: "",
  transDateForDirect: "",
  transDateForReceive: "",
  transDateForDoDirect: "",
  giNoForGRN: "",
  giNoForDO: "",
  giNoForDD: "",
  giNoForDODD: "",
  error: {},
  filtered: null,
  loading: true,
};

export default function (state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case types.GET_GRN:
      return {
        ...state,
        grn: payload,
        loading: false,
      };
    case types.GET_GRNS:
      return {
        ...state,
        grns: payload,
        loading: false,
      };
    case types.GET_FOR_RECEIVE:
      return {
        ...state,
        received: payload,
        loading: false,
        transDateForReceive: payload.data.data[0].transDate,
        giNoForGRN: payload.data.data[0].giNumber,
      };
    case types.GET_FOR_MR_TRANSIT:
      return {
        ...state,
        mrTransit: payload,
        transDate: payload.data.data[0].transDate,
        giNoForDO: payload.data.data[0].giNumber,
        loading: false,
      };
    case types.GET_FOR_DD_TRANSIT:
      return {
        ...state,
        ddTransit: payload,
        transDateForDirect: payload.data.data[0].transDate,
        giNoForDD: payload.data.data[0].giNumber,
        loading: false,
      };

    case types.GET_FOR_DD_DO:
      return {
        ...state,
        ddDo: payload,
        transDateForDoDirect: payload.data.data[0].transDate,
        giNoForDODD: payload.data.data[0].giNumber,

        loading: false,
      };
    case types.ADD_GRN:
      return {
        ...state,
        grn: payload,
        loading: false,
      };
    case types.SET_CURRENT_GRN:
      return {
        ...state,
        grn: action.payload,
      };
    case types.CLEAR_GRN:
      return {
        ...state,
        grn: null,
        loading: false,
      };

    case types.FILTER_GRN:
      return {
        ...state,
        filtered: state.grns.data.data.filter((grn) => {
          const regex = new RegExp(`${action.payload}`, "gi");
          return (
            grn.ecciNumber.match(regex) ||
            grn.vendorCode.match(regex) ||
            grn.vendorName.match(regex) ||
            grn.transactionType.match(regex) ||
            grn.modeOfDelivery.match(regex)
          );
        }),
      };
    case types.CLEAR_FILTER:
      return {
        ...state,
        filtered: null,
      };
    case types.DELETE_GRN:
      return {
        ...state,
        grns: state.grns.filter((grn) => grn._id !== action.payload),
        loading: false,
      };
    case types.GRN_ERROR:
      return {
        ...state,
        error: payload,
        loading: false,
      };
    default:
      return state;
  }
}
