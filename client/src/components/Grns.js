import React, { useEffect } from "react";
import { getLimitedGrns } from "../_actions/grnAction";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import FilterGrns from "./FilterGrns";
import Spinner from "./ui/Spinner";
import Moment from "react-moment";
import moment from "moment";

const Grns = ({ getLimitedGrns, grns, filtered, loading }) => {
  useEffect(() => {
    getLimitedGrns();
    //eslint-diable-next-line
  }, []);

  function increaseDateBy1(s, manual) {
    if (!manual) {
      var d = moment(s).toDate();
      var increasePlanDate = new Date(d.setDate(d.getDate() + 1));

      return increasePlanDate;
    } else {
      return s;
    }
  }

  return (
    <div className='container-fluid records-shell' style={{ paddingTop: "130px" }}>
      <section className='records-hero'>
        <p className='records-eyebrow'>Movement Visibility</p>
        <div className='records-hero-row'>
          <h5 className='records-title'>Stock Movement Report V3 (Last 7 Days)</h5>
          <span className='records-chip'>
            <i className='fa fa-truck mr-1' aria-hidden />
            {filtered ? filtered.length : grns?.result || 0} records
          </span>
        </div>
      </section>

      <section className='records-filter-wrap'>
        <FilterGrns />
      </section>

      <div className='tableFixHead records-table-wrap'>
        <table className='table table-hover  table-striped my-2 records-table'>
          <thead style={{ backgroundColor: "#045E84", color: "#fff" }}>
            <tr>
              <th scope='col'>ECCI</th>
              <th scope='col'>Transaction Type</th>
              <th scope='col'>Mode Of Delivery</th>
              <th scope='col'>In Date</th>
              <th scope='col'>Trans Date</th>
              <th scope='col'>Vendor Code</th>
              <th scope='col'>Vendor Name</th>
              <th scope='col'>Uploaded At</th>
              <th scope='col'>Uploaded By</th>
            </tr>
          </thead>

          {!loading ? (
            <tbody>
              {filtered !== null
                ? filtered.map((grn) => (
                    <tr key={grn._id}>
                      <td>{grn.ecciNumber && grn.ecciNumber}</td>
                      <td>{grn.transactionType && grn.transactionType}</td>
                      <td>{grn.modeOfDelivery && grn.modeOfDelivery}</td>
                      <td>
                        {" "}
                        <Moment format='DD-MMM-YYYY'>
                          {increaseDateBy1(grn.inDate, grn.manual)}
                        </Moment>{" "}
                      </td>
                      <td>
                        {" "}
                        <Moment format='DD-MMM-YYYY'>
                          {increaseDateBy1(grn.transDate, grn.manual)}
                        </Moment>{" "}
                      </td>

                      <td>{grn.vendorCode && grn.vendorCode}</td>
                      <td>{grn.vendorName && grn.vendorName}</td>
                      <td>
                        <Moment format='DD-MMM-YYYY, HH:mm:ss'>
                          {grn.date && grn.date}
                        </Moment>
                      </td>
                      <td>{grn.user && grn.user.name}</td>
                    </tr>
                  ))
                : grns.data &&
                  grns.data.data.map((grn) => (
                    <tr key={grn._id}>
                      <td>{grn.ecciNumber && grn.ecciNumber}</td>
                      <td>{grn.transactionType && grn.transactionType}</td>
                      <td>{grn.modeOfDelivery && grn.modeOfDelivery}</td>
                      <td>
                        {" "}
                        <Moment format='DD-MMM-YYYY'>
                          {increaseDateBy1(grn.inDate, grn.manual)}
                        </Moment>{" "}
                      </td>
                      <td>
                        {" "}
                        <Moment format='DD-MMM-YYYY'>
                          {increaseDateBy1(grn.transDate, grn.manual)}
                        </Moment>{" "}
                      </td>
                      <td>{grn.vendorCode && grn.vendorCode}</td>
                      <td>{grn.vendorName && grn.vendorName}</td>
                      <td>
                        <Moment format='DD-MMM-YYYY, HH:mm:ss'>
                          {grn.date && grn.date}
                        </Moment>
                      </td>
                      <td>{grn.user && grn.user.name}</td>
                    </tr>
                  ))}
            </tbody>
          ) : (
            <Spinner />
          )}
        </table>
      </div>
    </div>
  );
};

Grns.propTypes = {
  getLimitedGrns: PropTypes.func.isRequired,
};

const mapStatetoProps = (state) => ({
  grns: state.grn.grns,
  loading: state.grn.loading,
  filtered: state.grn.filtered,
});

export default connect(mapStatetoProps, {
  getLimitedGrns,
})(Grns);
