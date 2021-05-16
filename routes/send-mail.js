const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'dotmanagenotification@gmail.com',
        pass: 'dotmanage2021',
    },
});
module.exports = transport;