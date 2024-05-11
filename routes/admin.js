const express = require('express');
const Admin = require('../model/AdminInfo');
const router = express.Router();



router.post("/register", async (req, res) => {
    // const obj = {
    //     adminId: req.body.adminId,
    //     password: req.body.password
    // }
    const obj = req.body;
    try {
        let response = await Admin.insertMany(obj);
        res.send(true);
    } catch (error) {
        console.log(error);
        res.send(false);
    }
});



const checkAdminLoginInfo = async (req, res, next) => {

    try {
        console.log(req.body.adminId);
        console.log(req.body.password);

        let response = await Admin.findOne({
            adminId: req.body.adminId,
            password: req.body.password,
        });

        if (response === null) {
            res.send({ success: false, reason: "Login credentials did not match" });
            return;
        }

        res.send({ success: true });

    } catch (error) {
        console.log(error);
    }
};



router.post("/login", checkAdminLoginInfo, (req, res) => {

    const adminInfo = {
        userId: req.body.userId,
        password: req.body.password,
    };

    // try {
    //     jwt.sign({ userInfo }, secretKey, { expiresIn: '100000s' }, async (err, token) => {

    //         let encryptedToken = crypto.AES.encrypt(token, secretKey).toString();

    //         try {

    //             let t1 = await FcmDeviceToken.findOne({ DeviceToken: req.body.FcmDeviceToken }) //for device token
    //             if (t1 == null) {

    //                 let t2 = await FcmDeviceToken.create({ DeviceToken: req.body.FcmDeviceToken }) //for device token
    //             }
    //         } catch (error) {
    //             res.json({ success: "FCMTokenError", reason: error });
    //             console.log("fmc token error")
    //         }

    //         let response = await register.findOneAndUpdate(userInfo, { $set: { Token: token, FCMDeviceToken: req.body.FcmDeviceToken } }, { new: true })
    //         // let response = await register.findOneAndUpdate({userId: req.body.userId, password: req.body.password},{$set : {Token : token}},{new: true})
    //         // console.log(response)
    //         // res.send(true);

    //         if (response !== null) {
    //             res.json({ success: true, token: encryptedToken, mongoId: response._id });
    //         }
    //     })
    // } catch (error) {
    //     res.json({ success: "SomeError", reason: error });
    //     console.log(error)
    // }
});







router.get("/getAllUsers", async (req, res) => {
    try {
      const allUsers = await register.find({});
      res.status(200).send(allUsers);
    } catch (error) {
      res.status(500).send("Error fetching users");
    }
  });




module.exports = router;