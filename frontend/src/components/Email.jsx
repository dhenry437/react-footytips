import React, { useState } from "react";

export default function Email() {
  const [fields, setFields] = useState({
    name: "",
    toEmail: [""],
    ccEmail: [""],
  });

  const handleInputChange = event => {
    setFields({ ...fields, [event.target.name]: event.target.value });
  };

  const handleArrayInputChange = (event, key, i) => {
    setFields({
      ...fields,
      [key]: [
        ...fields[key].slice(0, i),
        event.target.value,
        ...fields[key].slice(i + 1),
      ],
    });
  };

  const handleClickClear = () => {
    setFields({
      name: "",
      toEmail: [""],
      ccEmail: [""],
    });
  };

  const handleClickAddRow = key => {
    setFields({ ...fields, [key]: [...fields[key], ""] });
  };

  const handleClickRemoveRow = (key, i) => {
    // This method fails when i = 0 or array length
    // That can never occur
    setFields({
      ...fields,
      [key]: [...fields[key].slice(0, i), ...fields[key].slice(i + 1)],
    });
  };

  const handleSubmit = event => {
    event.preventDefault();
  };

  return (
    <div className="card m-3">
      <div className="card-header">Email</div>
      <div className="card-body">
        <form
          className="row g-3 needs-validation"
          id="emailForm"
          onSubmit={handleSubmit}>
          <div className="col-12">
            <label htmlFor="name" className="form-label">
              Your Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              placeholder="John Smith"
              value={fields.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="col-12">
            <label htmlFor="toEmail" className="form-label">
              To
            </label>
            {fields.toEmail.map((toEmail, i) => (
              <div key={i} className="input-group mb-3">
                {i === fields.toEmail.length - 1 ? (
                  <>
                    <button
                      className="btn btn-outline-success d-flex align-items-center"
                      type="button"
                      onClick={() => handleClickAddRow("toEmail")}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        className="bi bi-plus-circle"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      </svg>
                    </button>
                    <input
                      type="email"
                      className="form-control"
                      id="toEmail"
                      name="toEmail"
                      placeholder="name@example.com"
                      value={toEmail}
                      onChange={event => {
                        handleArrayInputChange(event, "toEmail", i);
                      }}
                      required={i === 0}
                    />
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline-danger d-flex align-items-center"
                      type="button"
                      onClick={() => handleClickRemoveRow("toEmail", i)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        className="bi bi-dash-circle"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                      </svg>
                    </button>
                    <input
                      type="email"
                      className="form-control"
                      id="toEmail"
                      name="toEmail"
                      placeholder="name@example.com"
                      value={toEmail}
                      onChange={event => {
                        handleArrayInputChange(event, "toEmail", i);
                      }}
                      required={i === 0}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="col-12">
            <label htmlFor="ccEmail" className="form-label">
              CC
            </label>
            {fields.ccEmail.map((ccEmail, i) => (
              <div key={i} className="input-group mb-3">
                {i === fields.ccEmail.length - 1 ? (
                  <>
                    <button
                      className="btn btn-outline-success d-flex align-items-center"
                      type="button"
                      onClick={() => handleClickAddRow("ccEmail")}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        className="bi bi-plus-circle"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                      </svg>
                    </button>
                    <input
                      type="email"
                      className="form-control"
                      id="ccEmail"
                      name="ccEmail"
                      placeholder="name@example.com"
                      value={ccEmail}
                      onChange={event => {
                        handleArrayInputChange(event, "ccEmail", i);
                      }}
                    />
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline-danger d-flex align-items-center"
                      type="button"
                      onClick={() => handleClickRemoveRow("ccEmail", i)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        fill="currentColor"
                        className="bi bi-dash-circle"
                        viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
                      </svg>
                    </button>
                    <input
                      type="email"
                      className="form-control"
                      id="ccEmail"
                      name="ccEmail"
                      placeholder="name@example.com"
                      value={ccEmail}
                      onChange={event => {
                        handleArrayInputChange(event, "ccEmail", i);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </form>
      </div>
      <div className="card-footer d-flex justify-content-between">
        <div>
          <button type="submit" className="btn btn-primary" form="emailForm">
            Send
          </button>
        </div>
        <div>
          <button className="btn btn-danger" onClick={handleClickClear}>
            Clear Form
          </button>
        </div>
      </div>
    </div>
  );
}
