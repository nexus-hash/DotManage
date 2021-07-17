const transport = require("./send-mail");
const { sendMail } = require("./send-mail");
function sendEmail(to, subject, message) {
  const mailOptions = {
    from: "dotmanageapp@gmail.com",
    to,
    subject,
    html: message,
  };
  transport.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
    }
  });
}

module.exports = sendEmail;
