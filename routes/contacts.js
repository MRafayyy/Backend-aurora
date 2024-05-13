const express = require('express');
const contactsRegister = require('../model/contactRegistration');
const Nadra = require('../model/NadraModel');
const { main2 } = require('../SendMail');
const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");
const FcmDeviceToken = require('../model/FCMToken');
const register = require('../model/registrationInfo');
const router = express.Router();




router.post("/register", async (req, res) => {
    const obj1 = req.body;
    console.log(obj1);
    try {
        let response2 = await contactsRegister.find({
            $or: [{ userId: obj1.userId }, { email: obj1.email }],
        });
        if (response2.length === 0) {
            let response = await contactsRegister.insertMany(obj1);
            res.send(true);
        } else {
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
                },
                { $set: { userId: req.body.userId } },
                { new: true }
            );
            let response2 = await contactsRegister.findOneAndUpdate(
                { userId: u },
                { $set: { name: req.body.name, nadra_verified: 1 } }
            );
            console.log(response);
            if (response === null) {
                res.status(500).send(false);
                console.log(response);
            } else {
                let eresponse = await contactsRegister.findOne({ userId: u });
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
        let response = await contactsRegister.findOne({
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

        next();

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

                let response = await contactsRegister.findOneAndUpdate(
                    userInfo,
                    { $set: { Token: token, FCMDeviceToken: req.body.FcmDeviceToken } },
                    { new: true }
                );


                if (response !== null) {
                    res.json({
                        success: true,
                        token: encryptedToken,
                        mongoId: response._id,
                        userInfo: response
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





//my added women
router.get("/show-my-added-women/:mongoId", async (req, res) => {
    try {
      const { mongoId } = req.params;
      const user = await contactsRegister
        .findById(mongoId)
        .populate("myWomen", "name email")
        .lean();
  
      if (user.myWomen == undefined) {
        res.status(200).send({ status: "empty" });
      } else {
        const myWomen = user.myWomen;
        res.status(200).json(myWomen);
      }
    } catch (error) {
      res.status(500).send("error fetching added women");
    }
  });





  // remove women
router.post("/remove-women", async (req, res) => {
    try {
      // const {mongoId} = req.params
      const { currentUserId, selectedUserId } = req.body;
  
      await register.findByIdAndUpdate(selectedUserId, {
        $pull: { myContacts: currentUserId },
      });
  
      await contactsRegister.findByIdAndUpdate(currentUserId, {
        $pull: { myWomen: selectedUserId },
      });
  
      res.sendStatus(200);
    } catch (error) {
      res.statusCode(404);
    }
  });







  //show my notifications
  router.get("/get-mynotifs/:mongoId", async (req, res) => {
    try {
      let response = await contactsRegister.findById({
        _id: req.params.mongoId,
      });
      res.status(200).send(response.userSpecificNotifications);
    } catch (error) {
      res.status(404).json({ status: "failed" });
    }
  });












module.exports = router;