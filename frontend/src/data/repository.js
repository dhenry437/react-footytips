import axios from "axios";

export default async function refreshData(secret) {
  const bodyParameters = {
    secret: secret
  };

  const response = await axios
    .post("/refresh-data", bodyParameters)
    .catch(function (error) {
      return error.response;
    });

  return response;
}

export async function getSeasons() {
  const response = await axios
    .get("/seasons")
    .catch(function (error) {
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

  const response = await axios
    .get("/rounds", config)
    .catch(function (error) {
      return error.response;
    });

  return response;
}