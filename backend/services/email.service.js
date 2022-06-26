const axios = require("axios");

const boldIf = (bool, str) => {
  return bool ? `<b>${str}</b>` : str
}

const sendEmailService = async (
  tips,
  roundNumber,
  name,
  toEmails,
  ccEmails,
  reCaptchaValue
) => {
  // Verify reCaptcha
  let requestBody = `secret=${process.env.GOOGLE_RECAPTCHA_SECRET_KEY}&response=${reCaptchaValue}`

  const reCaptchaResponse = await axios.post("https://www.google.com/recaptcha/api/siteverify", requestBody).catch(function (error) {
    return error.response;
  });

  console.log(reCaptchaResponse.data);

  if (!reCaptchaResponse.data.success) {
    return {
      status: 403,
      data: "Invalid reCaptcha response"
    }
  }

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

  // Set to and cc, if they are empty arrays set undefined
  let to = [];
  if (toEmails.length > 0) {
    toEmails.forEach((email) => {
      to.push({ email: email })
    })
  } else {
    to = undefined;
  }

  let cc = [];
  if (ccEmails.length > 0) {
    ccEmails.forEach((email) => {
      cc.push({ email: email })
    })
  } else {
    cc = undefined;
  }

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
