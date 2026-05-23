import React from "react";

const AppFooter = () => (
  <footer className="app-fixed-footer">
    <p className="app-fixed-footer-text">
      &copy; {new Date().getFullYear()} OWM Logistics &nbsp;&middot;&nbsp; Developed by{" "}
      <a href="http://globuslabs.com" target="_blank" rel="noreferrer">
        Globus Labs
      </a>
    </p>
  </footer>
);

export default AppFooter;
