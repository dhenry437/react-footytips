import React from "react";
import logo from "../img/logo192.png";

export default function Navbar() {
  return (
    <nav className="navbar bg-light">
      <div className="d-flex justify-content-between container-fluid">
        <a className="navbar-brand" href="/">
          <img
            src={logo}
            alt=""
            width="30"
            height="30"
            className="d-inline-block align-text-top me-2"
          />
          Footy Tipping
        </a>
        <button className="btn btn-outline-success">Refresh Data</button>
      </div>
    </nav>
  );
}
