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