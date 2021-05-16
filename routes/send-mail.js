const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'thisdavejdemo@gmail.com',
        pass: 'myGmailPassword',
    },
});
module.exports = function sendEmail(to, subject, message) {
    const mailOptions = {
        from: 'thisdavejdemo@gmail.com',
        to,
        subject,
        html: message,
    };
    transport.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error);
        }
    });
};