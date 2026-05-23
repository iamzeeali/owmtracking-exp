import React, { useEffect } from "react";
import { getFeedbacks } from "../_actions/feedbackAction";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Spinner from "./ui/Spinner";
import Moment from "react-moment";
const Feedback = ({ getFeedbacks, feedbacks, loading }) => {
  useEffect(() => {
    getFeedbacks();
    //eslint-diable-next-line
  }, []);

  if (loading) {
    return <Spinner />;
  }
  return (
    <div className='container-fluid records-shell feedback-shell' style={{ paddingTop: "130px" }}>
      <section className='records-hero'>
        <p className='records-eyebrow'>Service Desk</p>
        <div className='records-hero-row'>
          <h5 className='records-title'>Complaints & Feedbacks</h5>
          <span className='records-chip'>
            <i className='fa fa-comments-o mr-1' aria-hidden />
            {(feedbacks && feedbacks.data && feedbacks.data.length) || 0} records
          </span>
        </div>
      </section>

      <div className='tableFixHead records-table-wrap feedback-table-wrap'>
        <table className='table table-hover table-striped table-responsive-md my-2 records-table feedback-table'>
          <thead style={{ backgroundColor: "#045E84", color: "#fff" }}>
            <tr>
              <th scope='col'>Vendor Code</th>
              <th scope='col'>Vendor Name</th>
              <th scope='col'>Subject</th>
              <th scope='col'>Message</th>
              <th scope='col'>Date</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.data &&
              feedbacks.data.map((feedback) => (
                <tr key={feedback._id}>
                  <td>{feedback.vendorCode && feedback.vendorCode}</td>
                  <td>{feedback.vendorName && feedback.vendorName}</td>
                  <td>{feedback.subject && feedback.subject}</td>
                  <td className='feedback-message-cell'>{feedback.message && feedback.message}</td>
                  <td>
                    <Moment format='DD-MM-YYYY'>{feedback.date}</Moment>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Feedback.propTypes = {
  getFeedbacks: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
  feedbacks: state.feedback.feedbacks,
  loading: state.feedback.loading,
});

export default connect(mapStatetoProps, {
  getFeedbacks,
})(Feedback);
