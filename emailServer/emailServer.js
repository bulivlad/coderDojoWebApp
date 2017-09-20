/**
 * Created by Catalin Paraschiv on 9/14/2017.
 */

const nodemailer = require('nodemailer');
const logger = require('winston');
const User = require('../models/userModel');

let mailUser = process.env.MAIL_USER;
let clientId = process.env.MAIL_CLIENT_ID;
let clientSecred = process.env.MAIL_CLIENT_SECRET;
let refreshToken = process.env.MAIL_REFRESH_TOKEN;

let mailerInfoAvailable = mailUser && clientId && clientSecred && refreshToken;

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: mailUser,
        clientId: clientId,
        clientSecret: clientSecred,
        refreshToken: refreshToken
    }
});

function sendMail(mailOptions, errMessage){
    if(mailerInfoAvailable){
        transporter.sendMail(mailOptions, function(err, res){
            if(err){
                logger.error(`${errMessage}: ${err}`);
            }
        })
    } else {
        logger.debug(`Mailer info not available: mailUser=${mailUser},  clientId=${clientId},  clientSecred=${clientSecred},  refreshToken=${refreshToken}`)
    }

}

module.exports.sendMailForAcceptanceToDojo = function(userId, typeOfUser, dojoName){
    User.getUsersEmail(userId, function(err, user){
        if(err){
            return logger.error(`Error quering database for user (_id=${userid}) for sending the user an email ` +
                `notification for acceptance to dojo ${dojoName}`)
        }
        if(user){
            if(user.email){
                let mailOptions = {
                    from: mailUser,
                    to: user.email,
                    subject: `Cerere devenire ${typeOfUser} la dojo-ul ${dojoName}`,
                    text: `Felicitari, cererea ta sa devi ${typeOfUser} la dojo-ul ${dojoName} a fost acceptata`
                };
                let errMessage = `Error sending email to user (_id=${userId}, email=${user.email}) to ` +
                    ` notify him/her of acceptance to dojo ${dojoName}.`;
                sendMail(mailOptions, errMessage);
            }
        } else {
            return logger.error(`User (_id=${userId}) not found in the database for sending the user an email ` +
                `notification for acceptance to dojo ${dojoName}`)
        }
    })
};


