import React, { useState, useEffect } from "react";
import axios from "axios";
import AddAsn from "./AddAsn";
import AddGrn from "./AddGrn";
import { Link } from "react-router-dom";
import { getLimitedGrns } from "../_actions/grnAction";
import { getLimitedAsns } from "../_actions/asnAction";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Moment from "react-moment";

const UploadEcci = ({ getLimitedAsns, getLimitedGrns, asns, grns }) => {
  const [ecciFile, setEcciFile] = useState(null);
  const [grnFile, setGrnFile] = useState(null);

  useEffect(() => {
    getLimitedAsns();
    getLimitedGrns();

    //eslint-diable-next-line
  }, []);

  const onFileChangeOne = (e) => {
    setEcciFile(e.target.files[0]);
    // alert('fileSelected', file)
  };

  const onFileChangeTwo = (e) => {
    setGrnFile(e.target.files[0]);
    // alert('fileSelected', file)
  };

  const onSubmitHandlerOne = (e) => {
    e.preventDefault();

    let formData = new FormData();
    formData.append("ecciFile", ecciFile);
    if (window.confirm("Confirm Upload?")) {
      axios
        .post("/api/asn", formData, {
          header: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log("Status: ", response.status);
          alert("Uploaded Successfully");
          window.location.reload();
        })
        .catch((error) => {
          alert("Incorrect Document!");
        });
    }
    setEcciFile();
  };

  const onSubmitHandlerTwo = (e) => {
    e.preventDefault();

    let formData = new FormData();
    formData.append("grnFile", grnFile);

    if (window.confirm("Confirm Upload?")) {
      axios
        .post("/api/grn", formData, {
          header: {
            "Content-Type": "multipart/form-data",
          },
        })

        .then((response) => {
          console.log("Status: ", response.status);
          alert("Uploaded Successfully");
          window.location.reload();
        })
        .catch((error) => {
          console.error("Something went wrong!", error);
          alert("Incorrect Document!");
        });
    }

    setGrnFile();
  };

  return (
    <div className='upload upload-modern mt-5'>
      <div className='container upload-modern-container'>
        <header className='upload-modern-header'>
          <p className='upload-modern-eyebrow'>Operations Data Hub</p>
          <h2 className='upload-modern-title'>Upload or create ASN and Stock Movement data</h2>
          <p className='upload-modern-subtitle'>
            Keep shipment visibility accurate by importing the latest enterprise reports.
          </p>
        </header>

        <div className='row upload-modern-grid'>
          <div className='col-lg-6 mb-4'>
            <section className='upload-modern-card'>
              <div className='upload-modern-card-head'>
                <h3>ASN Report (REP22246)</h3>
                <Link to='/asns' className='btn btn-outline-secondary btn-sm'>
                  View Report
                </Link>
              </div>
              <p className='upload-modern-card-meta'>Use file name: <strong>asn_rep22246.xlsx</strong></p>

              <form onSubmit={onSubmitHandlerOne} encType='multipart/form-data'>
                <label htmlFor='ecciFile' className='upload-file-label'>
                  <i className='fa fa-file-excel-o mr-2' aria-hidden />
                  {ecciFile ? ecciFile.name : "Choose ASN workbook"}
                </label>
                <input
                  type='file'
                  className='upload-file-input'
                  id='ecciFile'
                  name='ecciFile'
                  onChange={onFileChangeOne}
                  accept='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  required
                />

                {asns && asns.result > 0 && (
                  <small className='upload-modern-last'>
                    Last upload:{" "}
                    <Moment format='DD-MMM-YYYY, HH:mm:ss'>{asns.data && asns.data.data[0].date}</Moment>
                    {" "}by {asns.data.data[0].user && asns.data.data[0].user.name}
                  </small>
                )}

                <button type='submit' className='btn btn-primary btn-block mt-3' disabled={!ecciFile}>
                  Upload ASN
                </button>
              </form>

              <div className='upload-modern-divider'>or create manually</div>
              <AddAsn />
            </section>
          </div>

          <div className='col-lg-6 mb-4'>
            <section className='upload-modern-card'>
              <div className='upload-modern-card-head'>
                <h3>Stock Movement Report (REP22248)</h3>
                <Link to='/grns' className='btn btn-outline-secondary btn-sm'>
                  View Report
                </Link>
              </div>
              <p className='upload-modern-card-meta'>Use file name: <strong>grn_rep22248.xlsx</strong></p>

              <form onSubmit={onSubmitHandlerTwo} encType='multipart/form-data'>
                <label htmlFor='grnFile' className='upload-file-label'>
                  <i className='fa fa-file-excel-o mr-2' aria-hidden />
                  {grnFile ? grnFile.name : "Choose GRN workbook"}
                </label>
                <input
                  type='file'
                  className='upload-file-input'
                  id='grnFile'
                  name='grnFile'
                  onChange={onFileChangeTwo}
                  accept='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  required
                />

                {grns && grns.result > 0 && (
                  <small className='upload-modern-last'>
                    Last upload:{" "}
                    <Moment format='DD-MMM-YYYY, HH:mm:ss'>{grns.data.data[0].date}</Moment>
                    {" "}by {grns.data.data[0].user && grns.data.data[0].user.name}
                  </small>
                )}

                <button type='submit' className='btn btn-primary btn-block mt-3' disabled={!grnFile}>
                  Upload GRN
                </button>
              </form>

              <div className='upload-modern-divider'>or create manually</div>
              <AddGrn />
            </section>
          </div>
        </div>

        <div className='upload-modern-help text-center'>
          <small>Tip: Keep both reports updated daily for accurate tracking timelines.</small>
        </div>
      </div>
    </div>
  );
};

UploadEcci.propTypes = {
  getLimitedAsns: PropTypes.func.isRequired,
  getLimitedGrns: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
  asns: state.asn.asns,
  grns: state.grn.grns,
});

export default connect(mapStatetoProps, {
  getLimitedAsns,
  getLimitedGrns,
})(UploadEcci);
