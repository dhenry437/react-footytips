const { sendEmailService } = require("../services/email.service");
const { sendInBlueResponseDict } = require("../dict");

const sendEmail = async (req, res) => {
  const { tips, roundNumber, name, toEmails, ccEmails, reCaptchaValue } =
    req.body;

  // Check if any params are blank

  const response = await sendEmailService(
    tips,
    roundNumber,
    name,
    toEmails,
    ccEmails,
    reCaptchaValue
  );
  const { data, status } = response;
  const { code, message } = data;

  if (Math.floor(status / 100) === 2) {
    // 2xx
    res.send({
      type: "success",
      message: `Email sent to ${toEmails.join(", ")}`,
    });
  } else {
    console.log("---------- Error sending email ----------");
    console.log(data);
    res.status(500).send({
      type: code === "invalid_parameter" ? "warning" : "error",
      message:
        sendInBlueResponseDict[message] ||
        "Error sending email, check node logs",
    });
  }
};

module.exports = {
  sendEmail,
};
