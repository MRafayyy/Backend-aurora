const express = require('express');
const Nadra = require('../model/NadraModel');
const { main2 } = require('../SendMail');
const FcmDeviceToken = require('../model/FCMToken');
const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");
const register = require('../model/registrationInfo');
const contactsRegister = require('../model/contactRegistration');
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
        { $set: { userId: req.body.userId } },
        { new: true }
      );
      console.log(response);
      if (response !== null) {

        let response2 = await register.findOneAndUpdate(
          // { userId },
          { userId: u },
          { $set: { name: req.body.userId, nadra_verified: 1 } }
        );
      }
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






router.get("/showAllContacts/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    let allOtherContacts;
    // Get the current user's friend list
    let user = await register.findById(mongoId);

    let currentUserContacts = [];


    if (user.myContacts.length !== 0) {
      // console.log("hello here")
      const currentUser = await register
        .findById(mongoId)
        .populate("myContacts", "name _id userId")
        .lean();
      currentUserContacts = currentUser.myContacts.map((contact) => contact.userId);

    } else {
      // console.log("hello here not")
      currentUserContacts = [];
    }


    const allUserContactsIds = currentUserContacts;

    allOtherContacts = await contactsRegister.find({
      userId: { $nin: allUserContactsIds },
      _id: { $ne: mongoId },
    });


    res.status(200).json(allOtherContacts);


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving users" });
  }
});





router.post("/add-contact", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;
  try {
    await contactsRegister.findByIdAndUpdate(selectedUserId, {
      $push: { myWomen: currentUserId },
    });

    await register.findByIdAndUpdate(currentUserId, {
      $push: { myContacts: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).send("error adding this contact");
  }
});


//my added contacts
router.get("/show-my-added-contacts/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    const user = await register
      .findById(mongoId)
      .populate("myContacts", "name email")
      .lean();

    if (user.myContacts == undefined) {
      res.status(200).send({ status: "empty" });
    } else {
      const myContacts = user.myContacts;
      res.status(200).json(myContacts);
    }
  } catch (error) {
    res.status(500).send("error fetching friends");
  }
});



// remove contact
router.post("/remove-contact", async (req, res) => {
  try {
    // const {mongoId} = req.params
    const { currentUserId, selectedUserId } = req.body;

    await contactsRegister.findByIdAndUpdate(selectedUserId, {
      $pull: { myWomen: currentUserId },
    });

    await register.findByIdAndUpdate(currentUserId, {
      $pull: { myContacts: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.statusCode(404);
  }
});







//show my friends
router.get("/my-friends/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    const user = await register
      .findById(mongoId)
      .populate("friends", "name email")
      .lean();

    if (user.friends == undefined) {
      res.status(200).send({ status: "empty" });
    } else {
      const friends = user.friends;

      res.status(200).json(friends);
    }
  } catch (error) {
    res.status(500).send("error fetching friends");
  }
});






//accept friend reequest
router.post("/friend-request/accept", async (req, res) => {
  const { senderId, recepientId } = req.body;

  try {
    // retrieve the documents of sender and recepient
    const sender = await register.findById(senderId);
    const recepient = await register.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    sender.sentfriendRequests = sender.sentfriendRequests.filter(
      (requestId) => {
        return requestId.toString() !== recepientId.toString();
      }
    );

    recepient.friendRequests = recepient.friendRequests.filter((requestId) => {
      return requestId.toString() !== senderId.toString();
    });

    await sender.save();
    await recepient.save();

    res.status(200).json({ message: "Friend request accepted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});



//send friend request
router.post("/friend-Request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;
  try {
    await register.findByIdAndUpdate(selectedUserId, {
      $push: { friendRequests: currentUserId },
    });

    await register.findByIdAndUpdate(currentUserId, {
      $push: { sentfriendRequests: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).send("error sending request");
  }
});




// remove friend
router.post("/remove-friend", async (req, res) => {
  try {
    // const {mongoId} = req.params
    const { currentUserId, selectedUserId } = req.body;

    await register.findByIdAndUpdate(selectedUserId, {
      $pull: { friends: currentUserId },
    });

    await register.findByIdAndUpdate(currentUserId, {
      $pull: { friends: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.statusCode(404);
  }
});




//show friend requests in my inbox
router.get("/friend-request/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    const user = await register
      .findById(mongoId)
      .populate("friendRequests", "name email")
      .lean();

    if (user.friendRequests == undefined) {
      res.status(200).send({ status: "empty" });
    } else {
      const friendRequests = user.friendRequests;

      res.status(200).json(friendRequests);
    }
  } catch (error) {
    res.status(500).send("error fetching friend request");
  }
});


//show all women users
router.get("/users/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    let users;
    // Get the current user's friend list
    let fr = await register.findById(mongoId);

    let currentUserFriends = [];
    let currentUserSentFriendReqs = [];
    let currentUserReceivedFriendReqs = [];

    if (fr.friends.length !== 0) {
      // console.log("hello here")
      const currentUser = await register
        .findById(mongoId)
        .populate("friends", "name _id userId")
        .lean();
      currentUserFriends = currentUser.friends.map((friend) => friend.userId);
    } else {
      // console.log("hello here not")
      currentUserFriends = [];
    }

    if (fr.sentfriendRequests.length !== 0) {
      // console.log("hello 2")
      const currentUser2 = await register
        .findById(mongoId)
        .populate("sentfriendRequests", "name _id userId")
        .lean();
      currentUserSentFriendReqs = currentUser2.sentfriendRequests.map(
        (sentfriendreq) => sentfriendreq.userId
      );
    } else {
      console.log("hello 2 not");
      currentUserSentFriendReqs = [];
    }
    if (fr.friendRequests.length !== 0) {
      // console.log("hello 3")
      const currentUser3 = await register
        .findById(mongoId)
        .populate("friendRequests", "name _id userId")
        .lean();
      currentUserReceivedFriendReqs = currentUser3.friendRequests.map(
        (recfriendreq) => recfriendreq.userId
      );
    } else {
      // console.log("hello 3 not")
      currentUserReceivedFriendReqs = [];
    }


    const allUserIds = [
      ...currentUserFriends,
      ...currentUserSentFriendReqs,
      ...currentUserReceivedFriendReqs,
    ];
    users = await register.find({
      userId: { $nin: allUserIds },
      _id: { $ne: mongoId },
    });


    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving users" });
  }
});



router.get("/getRescueHistory/:mongoId", async (req, res) => {
  try {
    const { mongoId } = req.params;
    const user = await register.findById(mongoId)
    res.status(200).json(user.rescueButtonHistory)
  }
  catch {
console.log(error)
  }
}
)

module.exports = router;