import React, { useState } from "react";
import Input from "./ui/Input";
import { addManualAsn } from "../_actions/asnAction";
import { connect } from "react-redux";
import PropTypes from "prop-types";

const AddAsn = ({ addManualAsn }) => {
  const [formData, setFormData] = useState({
    ecciNumber: "",
    asnUploadDate: "",
    vendorCode: "",
    vendorName: "",
    warehouse: "",
    deliveryLocation: "",
    vehicleNumber: "",
    store: "",
    manual: true,
  });

  const { ecciNumber, asnUploadDate, vendorCode, vendorName, warehouse, deliveryLocation, vehicleNumber, store } = formData;

  const onChangeHandler = (e) => {
    e.preventDefault();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = (e) => {
    e.preventDefault();
    addManualAsn(formData);
    document.getElementById("closeModal").click();
  };
  return (
    <div>
      <button
        type='button'
        className='btn btn-primary btn-block'
        data-toggle='modal'
        data-target='#exampleModalCenter'
      >
        Add Manually
      </button>

      <div
        className='modal fade'
        id='exampleModalCenter'
        tabindex='-1'
        role='dialog'
        aria-labelledby='exampleModalCenterTitle'
        aria-hidden='true'
      >
        <div className='modal-dialog modal-dialog-centered' role='document'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title' id='exampleModalLongTitle'>
                Add ASN
              </h5>
              <button
                type='button'
                className='close'
                data-dismiss='modal'
                aria-label='Close'
              >
                <span aria-hidden='true'>&times;</span>
              </button>
            </div>
            <div className='modal-body'>
              <form onSubmit={(e) => onSubmitHandler(e)}>
                <Input
                  placeholder='ECCI Number'
                  className='form-control'
                  type='number'
                  name='ecciNumber'
                  value={ecciNumber}
                  required={true}
                  autoFocus={true}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <label className='mr-auto'>ASN Upload Date</label>
                <Input
                  placeholder='ASN Upload Date'
                  className='form-control'
                  type='date'
                  name='asnUploadDate'
                  value={asnUploadDate}
                  required={true}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Vendor Code'
                  className='form-control'
                  type='text'
                  name='vendorCode'
                  value={vendorCode}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Vendor Name'
                  className='form-control'
                  type='text'
                  name='vendorName'
                  value={vendorName}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Warehouse'
                  className='form-control'
                  type='text'
                  name='warehouse'
                  value={warehouse}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Delivery Location'
                  className='form-control'
                  type='text'
                  name='deliveryLocation'
                  value={deliveryLocation}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Vehicle Number'
                  className='form-control'
                  type='text'
                  name='vehicleNumber'
                  value={vehicleNumber}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <Input
                  placeholder='Store'
                  className='form-control'
                  type='text'
                  name='store'
                  value={store}
                  onChange={(e) => onChangeHandler(e)}
                />
                <br />
                <div class='modal-footer'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    data-dismiss='modal'
                    aria-label='Close'
                    id='closeModal'
                  >
                    Close
                  </button>
                  <button type='submit' class='btn btn-primary'>
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AddAsn.propTypes = {
  addManualAsn: PropTypes.func.isRequired,
};

export default connect(null, {
  addManualAsn,
})(AddAsn);
