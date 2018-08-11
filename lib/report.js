const colors = require('colors');

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
        user: process.env.MAIL_AUTH_USER,
        pass: process.env.MAIL_AUTH_PASS
    }
});

module.exports = function (err, title, body) {
    if (err) {
        console.log(colors.red(title));
    } else {
        console.log(colors.green(title));
    }
    transporter.sendMail({
        from: `Découverto <${process.env.MAIL_AUTH_USER}>`,
        to: process.env.RECEIVERS,
        subject: 'Sauvegarde Découverto ' + new Date().toISOString().split('T')[0] + ' : ' + title,
        text: err || body
    }, function (error) {
        if (error) console.log('Impossible d\'envoyer un courriel.'.red)
        process.exit()
    });
}