import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

const Alert = ({ alerts }) =>
  alerts !== null &&
  alerts.length > 0 &&
  alerts.map((alert) => (
    <div
      style={{
        position: "absolute",
        top: "0",
        right: "0",
        zIndex: "99999999",
      }}
      className={`m-4 border-top border-${alert.alertType}`}
    >
      <div
        class={`toast show animated fadeIn px-4`}
        role='alert'
        aria-live='assertive'
        aria-atomic='true'
      >
        <div class={`toast-body`}>
          <>
            {" "}
            {alert.alertType === "success" ? (
              <i className='fa fa-check-circle text-success fa-1x'></i>
            ) : (
              <i
                className='
fa fa-exclamation-triangle text-danger fa-1x'
              ></i>
            )}{" "}
            {alert.msg}
          </>
        </div>
      </div>
    </div>
  ));

Alert.propTypes = {
  alerts: PropTypes.array.isRequired,
};

const mapStateToProps = (state) => ({
  alerts: state.alert,
});

export default connect(mapStateToProps)(Alert);
