
require('dotenv').config()
const cors = require('cors')

const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_EMAIL_PASS,
  },
});


async function main(email, userId, userPassword) {

  const info = await transporter.sendMail({
    from: `"Aurora Fortified" <${process.env.MY_EMAIL}>`, 
    to: email, 
    subject: "Forgot passord - Aurora ", 
    text: "code here man", 
    html: `<b>Here are your credentials</b> <div> UserId: ${userId} </div> <div> Password: ${userPassword} </div>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
return true;

}



const { Resend } = require('resend');


const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


async function main2(email) {

  const message = {
    from: {
      email: 'AuroraFortified@gmail.com',
      name: "Aurora Fortified"
    },
    personalizations: [
      {
        to: [
          {
            email: email
            
          }
        ],
        dynamic_template_data: {"hey" :"wo"}
      }],
   
    subject: 'Thank you for registering with Aurora',
    template_id: 'd-ab938ae553844d0699d77cc275b29a00',


  };

try {
  
  
  let response = await sgMail.send(message);
  // console.log(response);
  // console.log("login email sent");
  return true

} catch (error) {
  
  console.log(error);
}
}

module.exports = {main, main2};