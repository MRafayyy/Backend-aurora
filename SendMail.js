// glgt eidw eses oznk
// zlnh xxmw clhc zlga
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
    from: `"Aurora" <${process.env.MY_EMAIL}>`, 
    to: email, 
    subject: "Forgot passord - Aurora ", 
    text: "code here man", 
    html: `<b>Here are your credentials</b> <div> UserId: ${userId} </div> <div> Password: ${userPassword} </div>`, // html body
  });

  console.log("Message sent: %s", info.messageId);
return true;

}



const { Resend } = require('resend');

// const resend = new Resend('re_hKDM7NQH_Hpz56K1jotXzfbnj2So4dW7F');

// async function main(email, userId, userPassword) {

//   resend.emails.send({
//     from: 'onboarding@resend.dev',
//     to: 'mohammadrafayaziz12345@gmail.com',
//     subject: 'Hell',
//     html: '<p>hey</strong>!</p>'
//   });

// }




// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

// async function main(email, userId, userPassword){
//   const msg = {
//     to: email, // Change to your recipient
//     from: 'AuroraFortified@gmail.com', // Change to your verified sender
//     subject: 'Aurora - Forgot password request',
//     // subject: 'check',
//     text: 'and easy to do anywhere, even with Node.js',
//     html: `<b>Here are your credentials</b> <div> UserId: ${userId} </div> <div> Password: ${userPassword} </div>`,
//   }

//   let response = await sgMail.send(msg);
//   console.log(response);
//   return true
// }

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