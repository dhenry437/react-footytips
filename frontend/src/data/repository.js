import axios from "axios";

export default async function refreshData() {
  const response = await axios.get("/refresh-data").catch(function (error) {
    return error.response;
  });

  return response;
}

export async function getSeasons() {
  const response = await axios.get("/seasons").catch(function (error) {
    return error.response;
  });

  return response;
}

export async function getRounds(year) {
  let config = {};
  if (year) {
    config.params = {
      year: year,
    };
  }

  const response = await axios.get("/rounds", config).catch(function (error) {
    return error.response;
  });

  return response;
}

export async function getMatches(year, round) {
  let config = {};
  if (year && round) {
    config.params = {
      year: year,
      round: round,
    };
  }

  const response = await axios.get("/matches", config).catch(function (error) {
    return error.response;
  });

  return response;
}

export async function sendEmail(
  tips,
  roundNumber,
  name,
  toEmails,
  ccEmails,
  reCaptchaValue
) {
  const bodyParameters = {
    tips: tips,
    roundNumber: roundNumber,
    name: name,
    toEmails: toEmails,
    ccEmails: ccEmails,
    reCaptchaValue: reCaptchaValue,
  };

  const response = await axios
    .post("/send-email", bodyParameters)
    .catch(function (error) {
      return error.response;
    });

  return response;
}

export async function getOdds(matches, year, round) {
  const bodyParameters = {
    matches: matches,
    year: year,
    round: round,
  };

  const response = await axios
    .post("/odds", bodyParameters)
    .catch(function (error) {
      return error.response;
    });

  return response;
}

export function setEmailFieldsLocalStorage(fields) {
  localStorage.setItem("emailFields", JSON.stringify(fields));
}

export function getEmailFieldsLocalStorage() {
  let emailFields;
  try {
    emailFields = JSON.parse(localStorage.getItem("emailFields"));
  } catch (e) {
    localStorage.removeItem("emailFields");
    return emailFields;
  }
  return emailFields;
}
