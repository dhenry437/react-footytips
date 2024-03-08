import axios from "axios";

export default async function refreshData(secret) {
  const bodyParameters = {
    secret: secret,
  };

  const response = await axios
    .post("/refresh-data", bodyParameters)
    .catch(function (error) {
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

export async function getRounds(season) {
  let config = {};
  if (season) {
    config.params = {
      season: season,
    };
  }

  const response = await axios.get("/rounds", config).catch(function (error) {
    return error.response;
  });

  return response;
}

export async function getMatches(season, round) {
  let config = {};
  if (season && round) {
    config.params = {
      season: season,
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

export async function getOdds(matches, season, round) {
  const bodyParameters = {
    matches: matches,
    season: season,
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
