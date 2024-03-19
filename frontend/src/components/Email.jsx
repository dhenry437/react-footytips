import React, { createRef, useEffect, useState } from "react";
import {
  getEmailFieldsLocalStorage,
  sendEmail,
  setEmailFieldsLocalStorage,
} from "../data/repository";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import { z } from "zod";

export default function Email(props) {
  const { matches, selectedRound } = props;
  const [fields, setFields] = useState({
    name: "",
    toEmails: [""],
    ccEmails: [""],
  });

  const recaptchaRef = createRef();

  // On page load, restore fields from local storage
  useEffect(() => {
    const emailFieldsSchema = z.object({
      name: z.string(),
      toEmails: z.array(z.string()),
      ccEmails: z.array(z.string()),
    });

    const emailFields = getEmailFieldsLocalStorage();

    // If emailFields is does not match schema, do not populate state.
    // Should also catch undef value from JSON parse error in repository
    emailFieldsSchema.safeParse(emailFields).success && setFields(emailFields);
  }, []);

  const handleInputChange = event => {
    const tmpFields = { ...fields, [event.target.name]: event.target.value };
    setFields(tmpFields);

    // On field change, save to local storage
    setEmailFieldsLocalStorage(tmpFields);
  };

  const handleArrayInputChange = (event, key, i) => {
    const tmpFields = {
      ...fields,
      [key]: [
        ...fields[key].slice(0, i),
        event.target.value,
        ...fields[key].slice(i + 1),
      ],
    };
    setFields(tmpFields);

    // On field change, save to local storage
    setEmailFieldsLocalStorage(tmpFields);
  };

  const handleClickClear = () => {
    const tmpFields = {
      name: "",
      toEmails: [""],
      ccEmails: [""],
    };
    setFields(tmpFields);

    // On field change, save to local storage
    setEmailFieldsLocalStorage(tmpFields);
  };

  const handleClickAddRow = key => {
    const tmpFields = { ...fields, [key]: [...fields[key], ""] };
    setFields(tmpFields);

    // On field change, save to local storage
    setEmailFieldsLocalStorage(tmpFields);
  };

  const handleClickRemoveRow = (key, i) => {
    // This method fails when i = 0 or array length
    // That can never occur
    const tmpFields = {
      ...fields,
      [key]: [...fields[key].slice(0, i), ...fields[key].slice(i + 1)],
    };
    setFields(tmpFields);

    // On field change, save to local storage
    setEmailFieldsLocalStorage(tmpFields);
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const t = toast.loading("Sending email...");

    // Save the value of name incase it is changed while promise is pending
    const name = fields.name;

    // Keep only the properties we need
    const tmpMatches = matches.map(({ home_team, away_team, selected }) => ({
      home_team,
      away_team,
      selected,
    }));

    let response = await sendEmail(
      tmpMatches,
      selectedRound,
      name,
      fields.toEmails.filter(x => x !== ""), // Filter to avoid sending [""]
      fields.ccEmails.filter(x => x !== ""),
      recaptchaRef.current.getValue()
    );
    const {
      data: { type, message },
    } = response;

    window.grecaptcha.reset();

    toast.update(t, {
      render: message,
      type,
      isLoading: false,
      autoClose: 3000,
      closeOnClick: true,
    });
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
            <label htmlFor="toEmails" className="form-label">
              To
            </label>
            {fields.toEmails &&
              fields.toEmails.map((toEmails, i) => (
                <div key={i} className="input-group mb-3">
                  {i === fields.toEmails.length - 1 ? (
                    <>
                      <button
                        className="btn btn-outline-success d-flex align-items-center"
                        type="button"
                        onClick={() => handleClickAddRow("toEmails")}>
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
                        id="toEmails"
                        name="toEmails"
                        placeholder="name@example.com"
                        value={toEmails}
                        onChange={event => {
                          handleArrayInputChange(event, "toEmails", i);
                        }}
                        required={i === 0}
                      />
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-outline-danger d-flex align-items-center"
                        type="button"
                        onClick={() => handleClickRemoveRow("toEmails", i)}>
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
                        id="toEmails"
                        name="toEmails"
                        placeholder="name@example.com"
                        value={toEmails}
                        onChange={event => {
                          handleArrayInputChange(event, "toEmails", i);
                        }}
                        required={i === 0}
                      />
                    </>
                  )}
                </div>
              ))}
          </div>
          <div className="col-12">
            <label htmlFor="ccEmails" className="form-label">
              CC
            </label>
            {fields.ccEmails &&
              fields.ccEmails.map((ccEmails, i) => (
                <div key={i} className="input-group mb-3">
                  {i === fields.ccEmails.length - 1 ? (
                    <>
                      <button
                        className="btn btn-outline-success d-flex align-items-center"
                        type="button"
                        onClick={() => handleClickAddRow("ccEmails")}>
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
                        id="ccEmails"
                        name="ccEmails"
                        placeholder="name@example.com"
                        value={ccEmails}
                        onChange={event => {
                          handleArrayInputChange(event, "ccEmails", i);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-outline-danger d-flex align-items-center"
                        type="button"
                        onClick={() => handleClickRemoveRow("ccEmails", i)}>
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
                        id="ccEmails"
                        name="ccEmails"
                        placeholder="name@example.com"
                        value={ccEmails}
                        onChange={event => {
                          handleArrayInputChange(event, "ccEmails", i);
                        }}
                      />
                    </>
                  )}
                </div>
              ))}
          </div>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY}
          />
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
