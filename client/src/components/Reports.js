import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Moment from "react-moment";
import { getReportData } from "../_actions/reportAction";
import Spinner from "./ui/Spinner";

const REPORT_TYPES = [
  { value: "material-age", label: "Material Age Report" },
  { value: "dispatch", label: "Dispatch Report" },
  { value: "collection", label: "Collection (Picked) Report" },
];

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "weekly", label: "1 Week (Last 7 Days)" },
  { value: "monthly", label: "1 Month (Current Month)" },
];

const Reports = ({ getReportData, report: { data, loading, results } }) => {
  const [reportType, setReportType] = useState("material-age");
  const [period, setPeriod] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deliveryPlant, setDeliveryPlant] = useState("");
  const [transporter, setTransporter] = useState("");
  const [zone, setZone] = useState("");
  const [vendor, setVendor] = useState("");

  const buildFilters = () => {
    const params = { type: reportType, period };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    if (reportType === "dispatch") {
      if (deliveryPlant) params.deliveryPlant = deliveryPlant;
      if (transporter) params.transporter = transporter;
    }

    if (reportType === "collection") {
      if (zone) params.zone = zone;
      if (vendor) params.vendor = vendor;
      if (transporter) params.transporter = transporter;
    }

    if (reportType === "material-age" && zone) {
      params.warehouse = zone;
    }

    return params;
  };

  useEffect(() => {
    getReportData(buildFilters());
    // eslint-disable-next-line
  }, [reportType, period]);

  const onSubmit = (e) => {
    e.preventDefault();
    getReportData(buildFilters());
  };

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setDeliveryPlant("");
    setTransporter("");
    setZone("");
    setVendor("");
    getReportData({ type: reportType, period });
  };

  const renderTableHead = () => {
    if (reportType === "material-age") {
      return (
        <tr>
          <th>ECCI</th>
          <th>Vendor</th>
          <th>Warehouse</th>
          <th>Dispatch Plant</th>
          <th>Transporter</th>
          <th>Received At</th>
          <th>Dispatched At</th>
          <th>Material Age (Days)</th>
        </tr>
      );
    }

    if (reportType === "dispatch") {
      return (
        <tr>
          <th>ECCI</th>
          <th>GI Number</th>
          <th>Transaction Type</th>
          <th>Mode Of Delivery</th>
          <th>Vendor</th>
          <th>Delivery Plant</th>
          <th>Transporter</th>
          <th>Dispatch Date</th>
        </tr>
      );
    }

    return (
      <tr>
        <th>ECCI</th>
        <th>Vendor</th>
        <th>Vendor Code</th>
        <th>Zone</th>
        <th>Transporter</th>
        <th>Picked Date</th>
        <th>Delivery Plant</th>
        <th>Transaction Type</th>
      </tr>
    );
  };

  const renderRow = (row, index) => {
    if (reportType === "material-age") {
      return (
        <tr key={`${row.ecciNumber}-${index}`}>
          <td>{row.ecciNumber}</td>
          <td>{row.vendorName}</td>
          <td>{row.warehouse}</td>
          <td>{row.deliveryLocation}</td>
          <td>{row.transporter}</td>
          <td><Moment format='DD-MMM-YYYY'>{row.receivedAt}</Moment></td>
          <td><Moment format='DD-MMM-YYYY'>{row.dispatchedAt}</Moment></td>
          <td>{row.ageInDays}</td>
        </tr>
      );
    }

    if (reportType === "dispatch") {
      return (
        <tr key={`${row.ecciNumber}-${index}`}>
          <td>{row.ecciNumber}</td>
          <td>{row.giNumber}</td>
          <td>{row.transactionType}</td>
          <td>{row.modeOfDelivery}</td>
          <td>{row.vendorName}</td>
          <td>{row.deliveryPlant}</td>
          <td>{row.transporter}</td>
          <td><Moment format='DD-MMM-YYYY'>{row.dispatchDate}</Moment></td>
        </tr>
      );
    }

    return (
      <tr key={`${row.ecciNumber}-${index}`}>
        <td>{row.ecciNumber}</td>
        <td>{row.vendorName}</td>
        <td>{row.vendorCode}</td>
        <td>{row.zone}</td>
        <td>{row.transporter}</td>
        <td><Moment format='DD-MMM-YYYY'>{row.pickedDate}</Moment></td>
        <td>{row.deliveryPlant}</td>
        <td>{row.transactionType}</td>
      </tr>
    );
  };

  return (
    <div className='container-fluid reports-shell' style={{ paddingTop: "120px" }}>
      <section className='records-hero'>
        <p className='records-eyebrow'>Analytics Workspace</p>
        <div className='records-hero-row'>
          <h5 className='records-title'>Operational Reports</h5>
          <span className='records-chip'>
            <i className='fa fa-line-chart mr-1' aria-hidden />
            {results} records
          </span>
        </div>
      </section>

      <form onSubmit={onSubmit} className='border rounded p-3 bg-light mb-3 reports-filter-card'>
        <div className='form-row'>
          <div className='form-group col-md-3'>
            <label>Report Type</label>
            <select className='form-control' value={reportType} onChange={(e) => setReportType(e.target.value)}>
              {REPORT_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className='form-group col-md-2'>
            <label>Period</label>
            <select className='form-control' value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div className='form-group col-md-2'>
            <label>From Date</label>
            <input type='date' className='form-control' value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className='form-group col-md-2'>
            <label>To Date</label>
            <input type='date' className='form-control' value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className='form-group col-md-3 d-flex align-items-end'>
            <button type='submit' className='btn btn-primary mr-2'>Apply</button>
            <button type='button' className='btn btn-outline-secondary' onClick={resetFilters}>Reset</button>
          </div>
        </div>

        <div className='form-row'>
          {reportType === "dispatch" && (
            <>
              <div className='form-group col-md-3'>
                <label>Delivery Plant</label>
                <input
                  type='text'
                  className='form-control'
                  value={deliveryPlant}
                  onChange={(e) => setDeliveryPlant(e.target.value)}
                  placeholder='Filter by plant'
                />
              </div>
              <div className='form-group col-md-3'>
                <label>Transporter</label>
                <input
                  type='text'
                  className='form-control'
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder='Filter by transporter'
                />
              </div>
            </>
          )}

          {reportType === "collection" && (
            <>
              <div className='form-group col-md-3'>
                <label>Zone</label>
                <input
                  type='text'
                  className='form-control'
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder='Filter by zone'
                />
              </div>
              <div className='form-group col-md-3'>
                <label>Vendor</label>
                <input
                  type='text'
                  className='form-control'
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder='Filter by vendor'
                />
              </div>
              <div className='form-group col-md-3'>
                <label>Transporter</label>
                <input
                  type='text'
                  className='form-control'
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder='Filter by transporter'
                />
              </div>
            </>
          )}

          {reportType === "material-age" && (
            <div className='form-group col-md-3'>
              <label>Warehouse / Zone</label>
              <input
                type='text'
                className='form-control'
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder='Filter by warehouse'
              />
            </div>
          )}
        </div>
      </form>

      <div className='mb-2 text-muted reports-total'>Total records: {results}</div>
      <div className='tableFixHead records-table-wrap'>
        <table className='table table-hover table-striped records-table'>
          <thead style={{ backgroundColor: "#045E84", color: "#fff" }}>{renderTableHead()}</thead>
          {!loading ? <tbody>{data.map((row, idx) => renderRow(row, idx))}</tbody> : <Spinner />}
        </table>
      </div>
    </div>
  );
};

Reports.propTypes = {
  getReportData: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  report: state.report,
});

export default connect(mapStateToProps, { getReportData })(Reports);
