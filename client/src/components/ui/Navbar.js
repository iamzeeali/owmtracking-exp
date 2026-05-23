import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { logout } from "../../_actions/authAction";

const Navbar = ({
  auth: { username, isAuthenticated, loading, role, user },
  logout,
}) => {
  const adminLinks = [
    { to: "/", icon: "fa-search", label: "Track" },
    { to: "/upload", icon: "fa-list", label: "ECCI" },
    { to: "/feedback", icon: "fa-user", label: "Feedbacks" },
    { to: "/reports", icon: "fa-line-chart", label: "Reports" },
  ];

  const customerLinks = [
    { to: "/", icon: "fa-home", label: "Home" },
    { to: "/inventory", icon: "fa-cube", label: "Inventory" },
    { to: "/order", icon: "fa-list", label: "Orders" },
    { to: "/reports", icon: "fa-line-chart", label: "Reports" },
  ];

  const guestLinks = [
    { to: "/", icon: "fa-map-marker", label: "Track", external: false },
    { to: "http://www.owmlogistics.com/", icon: "fa-info-circle", label: "About", external: true },
    { to: "/add-feedback", icon: "fa-commenting-o", label: "Feedback", external: false },
  ];

  const currentLinks = isAuthenticated
    ? role === "admin"
      ? adminLinks
      : customerLinks
    : guestLinks;

  const renderNavItem = (item) => (
    <li key={item.label} className='nav-item'>
      {item.external ? (
        <a className='nav-link' href={item.to} target='_blank' rel='noreferrer'>
          <i className={`fa ${item.icon}`} aria-hidden /> {item.label}
        </a>
      ) : (
        <Link className='nav-link' to={item.to}>
          <i className={`fa ${item.icon}`} aria-hidden /> {item.label}
        </Link>
      )}
    </li>
  );

  return (
    <Fragment>
      {!loading && (
        <nav className='navbar navbar-expand-lg fixed-top py-2 px-3 app-navbar-modern'>
          <Link className='navbar-brand app-navbar-brand' to='/'>
            <img src='/logob.png' alt='OWM Logistics' width='72' />
          </Link>

          <button
            className='navbar-toggler'
            type='button'
            data-toggle='collapse'
            data-target='#navbarSupportedContent'
            aria-controls='navbarSupportedContent'
            aria-expanded='false'
            aria-label='Toggle navigation'
          >
            <span className='navbar-toggler-icon'></span>
          </button>

          <div className='collapse navbar-collapse' id='navbarSupportedContent'>
            <ul className='navbar-nav mr-auto app-navbar-links'>
              {currentLinks.map(renderNavItem)}
            </ul>

            <ul className='navbar-nav align-items-center app-navbar-actions'>
              {isAuthenticated && (
                <li className='nav-item mr-lg-2'>
                  <span className='app-navbar-userchip'>Hi, {username || user?.name || "User"}</span>
                </li>
              )}
              {isAuthenticated ? (
                <li className='nav-item'>
                  <Link to='/login' onClick={logout} className='nav-link app-navbar-logout'>
                    <i className='fa fa-sign-out' aria-hidden /> Logout
                  </Link>
                </li>
              ) : (
                <li className='nav-item'>
                  <Link className='nav-link app-navbar-login' to='/login'>
                    <i className='fa fa-sign-in' aria-hidden /> Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      )}
    </Fragment>
  );
};

Navbar.propTypes = {
  logout: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps, { logout })(Navbar);
