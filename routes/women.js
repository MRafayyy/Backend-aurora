const express = require('express');
const Nadra = require('../model/NadraModel');
const { main2 } = require('../SendMail');
const FcmDeviceToken = require('../model/FCMToken');
const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");
const register = require('../model/registrationInfo');
const router = express.Router();


router.post("/register", async (req, res) => {
  const obj1 = req.body;
  console.log(obj1);
  try {
    let response2 = await register.find({
      $or: [{ userId: obj1.userId }, { email: obj1.email }],
    });
    if (response2.length === 0) {
      let response = await register.insertMany(obj1);
      res.send(true);
    } else {
      console.log("what " + response2);
      res.send(false);
    }
  } catch (error) {
    console.log(error);
  }
});



router.post("/VerifyNadraInfo", async (req, res) => {
  if (req.body !== null) {
    try {
      let u = req.body.userId;
      let response = await Nadra.findOneAndUpdate(
        {
          name: req.body.name,
          fathers_name: req.body.fathers_name,
          cnic: req.body.cnic,
          gender: req.body.gender,
        },
        { $set: { userId: req.body.userId, nadra_verified: 1 } },
        { new: true }
      );
      let response2 = await register.findOneAndUpdate(
        // { userId },
        { userId: u },
        { $set: { name: req.body.userId } }
      );
      console.log(response);
      if (response === null) {
        res.status(500).send(false);
        console.log(response);
      } else {
        let eresponse = await register.findOne({ userId: u });
        console.log(eresponse);
        let mail = await main2(eresponse.email);
        if (mail) {
        }
        res.status(200).send(true);
      }
    } catch (error) {
      console.log(error);
    }
  }
});




const checkLoginInfo = async (req, res, next) => {
  try {
    console.log(req.body.userId);
    console.log(req.body.password);
    let response = await register.findOne({
      userId: req.body.userId,
      password: req.body.password,
    });
    if (response === null) {
      // res.send("login credentials did not match")
      res.send({ success: false, reason: "Login credentials did not match" });
      // console.log(response)
      return;
    }
    if (response.nadra_verified !== 1) {
      res.send({ success: false, reason: "User not verified by Nadra" });
      return;
    }
    // else {
    next();
    // }
  } catch (error) {
    console.log(error);
    // res.send("login credentials did not match")
  }
};



const secretKey = "hey";

router.post("/login", checkLoginInfo, (req, res) => {
  // res.send("u can login")
  const userInfo = {
    userId: req.body.userId,
    password: req.body.password,
  };

  try {
    jwt.sign(
      { userInfo },
      secretKey,
      { expiresIn: "100000s" },
      async (err, token) => {
        let encryptedToken = crypto.AES.encrypt(token, secretKey).toString();

        try {
          let t1 = await FcmDeviceToken.findOne({
            DeviceToken: req.body.FcmDeviceToken,
          }); //for device token
          if (t1 == null) {
            let t2 = await FcmDeviceToken.create({
              DeviceToken: req.body.FcmDeviceToken,
            }); //for device token
          }
        } catch (error) {
          res.json({ success: "FCMTokenError", reason: error });
          console.log("fmc token error");
        }

        let response = await register.findOneAndUpdate(
          userInfo,
          { $set: { Token: token, FCMDeviceToken: req.body.FcmDeviceToken } },
          { new: true }
        );
        // let response = await register.findOneAndUpdate({userId: req.body.userId, password: req.body.password},{$set : {Token : token}},{new: true})
        // console.log(response)
        // res.send(true);

        if (response !== null) {
          res.json({
            success: true,
            token: encryptedToken,
            mongoId: response._id,
          });
        }
      }
    );
  } catch (error) {
    res.json({ success: "SomeError", reason: error });
    console.log(error);
  }
});






router.post("/verifyToken", async function verifyToken(req, res) {
  let decryptedToken = crypto.AES.decrypt(
    req.body.password,
    secretKey
  ).toString(crypto.enc.Utf8);
  jwt.verify(decryptedToken, secretKey, (error, authData) => {
    if (error) {
      res.send({ success: false });
    } else {
      res.send({ success: true, authData });
    }
  });
});


module.exports = router;