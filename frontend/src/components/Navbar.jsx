import React from "react";
import refreshData from "../data/repository";
import logo from "../img/logo192.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

export default function Navbar() {
  const handleClickRefreshData = async () => {
    const secret = window.prompt("Password:");

    if (secret) {
      const response = refreshData(secret);

      toast.promise(response, {
        pending: "Refreshing data...",
        success: "Got the data",
        error: "Error when fetching data",
      });
    }
  };

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
          Footy Tipping v3
        </a>
        <button
          className="btn btn-outline-success"
          onClick={handleClickRefreshData}>
          Refresh Data
        </button>
      </div>
    </nav>
  );
}
