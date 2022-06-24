const axios = require("axios");

const boldIf = (bool, str) => {
  return bool ? `<b>${str}</b>` : str
}

const sendEmailService = async (
  tips,
  roundNumber,
  name,
  toEmails,
  ccEmails
) => {
  const subject = `${name}'s Round ${roundNumber} Footy Tips`;

  let body = "";
  body += "<html>\n";
  body += `  <p>${name}'s Round ${roundNumber} Footy Tips</p>\n`;
  body += "  <p>\n";
  tips.forEach(match => {
    const { selected, home_team, away_team } = match;

    body += `    ${boldIf(selected === "home", home_team)} v ${boldIf(selected === "away", away_team)}<br>\n`;
  });
  body += "  </p>\n";
  body += "  <p>\n";
  body += "    Created using Footy Tips v3<br>\n";
  body += '    <a href="footytipping.app">footytipping.app</a>\n';
  body += "  </p>\n";

  let config = {}
  config.headers = {
    accept: "application/json",
    "api-key": process.env.SENDINBLUE_API_KEY,
    "content-type": "application/json"
  }

  let to = [];
  toEmails.forEach((email) => {
    to.push({ email: email })
  })

  let cc = [];
  ccEmails.forEach((email) => {
    cc.push({ email: email })
  })

  const bodyParameters = {
    sender: {
      name: "Footy Tipping v3",
      email: "no-reply@footytipping.app",
    },
    to: to,
    cc: cc,
    subject: subject,
    htmlContent: body,
  }

  const response = await axios.post("https://api.sendinblue.com/v3/smtp/email", bodyParameters, config).catch(function (error) {
    return error.response;
  });

  return response;
};

module.exports = {
  sendEmailService,
};
