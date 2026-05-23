import React, { useState } from 'react';
import { addFeedback } from '../_actions/feedbackAction';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const AddFeedback = ({ addFeedback, history }) => {
  const [formData, setFormData] = useState({
    vendorCode: '',
    vendorName: '',
    subject: '',
    message: '',
  });

  const onChangeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    addFeedback(formData, history);
  };
  return (
    <div className="feedback">
      <div className="container">
        <div className="col-sm-6 ml-auto mr-auto">
          <form
            onSubmit={(e) => onSubmitHandler(e)}
            className="transparent p-4"
          >
            <h4 className="text-light"> Complaints & Feedback</h4>
            <small>Your feedback is important in improving our services.</small>
            <br />
            <br />
            <input
              type="text"
              placeholder="*Vendor Code"
              className="form-control"
              onChange={(e) => onChangeHandler(e)}
              name="vendorCode"
              value={formData.vendorCode}
              required
            />
            <br />
            <input
              type="text"
              placeholder="*Vendor Name"
              className="form-control"
              onChange={(e) => onChangeHandler(e)}
              name="vendorName"
              value={formData.vendorName}
              required
            />
            <br />
            <input
              type="text"
              placeholder="*Subject"
              className="form-control"
              onChange={(e) => onChangeHandler(e)}
              name="subject"
              value={formData.subject}
              required
            />
            <br />
            <textarea
              type="text"
              placeholder="*Message"
              className="form-control"
              rows="6"
              onChange={(e) => onChangeHandler(e)}
              name="message"
              value={formData.message}
              required
            ></textarea>
            <br />
            <button className="btn btn-dark btn-block">Submit</button>
          </form>
        </div>
      </div>

    </div>
  );
};

AddFeedback.propTypes = {
  addFeedback: PropTypes.func.isRequired,
};

export default connect(null, {
  addFeedback,
})(AddFeedback);
