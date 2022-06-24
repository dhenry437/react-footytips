const { sendEmailService } = require("../services/email.service");

const sendEmail = async (req, res) => {
  const { tips, roundNumber, name, toEmails, ccEmails } = req.body;

  // Check if any params are blank

  response = await sendEmailService(tips, roundNumber, name, toEmails, ccEmails);

  if (Math.floor(response.status / 100) === 2) { // 2xx
    res.send(`Email sent to ${toEmails.join(", ")}`);
  } else {
    res.status(500).send(response.data);
  }
};

module.exports = {
  sendEmail,
};
