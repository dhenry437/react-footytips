import React from "react";
import refreshData from "../data/repository";
import logo from "../assets/logo192.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

export default function Navbar() {
  const handleClickRefreshData = async () => {
    const t = toast.loading("Please wait...");

    const response = await refreshData();
    const {
      data: { type, message },
    } = response;

    toast.update(t, {
      render: message,
      type,
      isLoading: false,
      autoClose: 3000,
      closeOnClick: true,
    });
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
