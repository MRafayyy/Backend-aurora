const { urlencoded } = require("express");
const express = require("express");
const app = require("express")();
const { createServer } = require("http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server);
const mongoose = require("mongoose");

const moment = require("moment-timezone");
require("./db/db");
const register = require("./model/registrationInfo");
const Nadra = require("./model/NadraModel");
const FcmDeviceToken = require("./model/FCMToken");
const Admin = require("./model/AdminInfo");
const adminNotifications = require("./model/Notifications");

const jwt = require("jsonwebtoken");
const crypto = require("crypto-js");
const cors = require("cors");
const { main, main2 } = require("./SendMail");
const FCM = require("fcm-node");

app.use(urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

const usp = io.of("/auro");

let connectedUsers = {};
io.on("connection", async (socket) => {
  if (socket.handshake.auth.userType === "user") {
    console.log("a user connected");

    socket.on("LoggedIn", async (data) => {
      const { mongoId } = data;
      connectedUsers[socket.id] = mongoId;
      try {
        console.log(data.mongoId);
        let response = await register.findByIdAndUpdate(data.mongoId, {
          is_online: 1,
        });

        socket.broadcast.emit("aUserGotOnline");
      } catch (error) {
        console.log(error);
      }
    });

    // socket.broadcast.emit('getOnlineUsers', { userId: userId, count: count })

    socket.on("shareCoordinates", (data) => {
      socket.join(data.userId);
      console.log(data.userId);
      console.log(data.Location);
      io.to(data.userId).emit(data.userId, data);
      // socket.broadcast.emit('bd', {la: 'good'})
      // io.emit('bd', {latlng: obj})
    });

    socket.on("newMarker", (obj) => {});

    socket.on("Iamloggingout", async () => {
      try {
        let response = await register.findByIdAndUpdate(
          connectedUsers[socket.id],
          { $set: { is_online: 0 } }
        );
        socket.broadcast.emit("aUserGotOffline");
    } catch (error) {
        console.log(error);
    }
    });
    
    socket.on("disconnect", async () => {
        console.log("a user disconnected");
        // await register.findOneAndUpdate({ userId: userId }, { $set: { is_online: '0' } })
        // count = count - 1;
        // socket.broadcast.emit('getOfflineUsers', { userId: userId, count: count })
        
        try {
            console.log("status")
            let response = await register.findByIdAndUpdate(
                connectedUsers[socket.id],
                { $set: { is_online: 0 } }
                );
                socket.broadcast.emit("aUserGotOffline");
        delete connectedUsers[socket.id];
      } catch (error) {
        console.log(error);
      }
    });

  } else {

    console.log("admin connected")
    try {
      const allUsers = await register.find({});
      const allUserIds = allUsers.map((value, index) => {
        return value.userId;
      });

      socket.join(allUserIds);

      // socket.on('userLocationData',(data)=>{

      // })
    } catch (error) {
      console.log(error);
    }
  }
});

// ---------------------------------------------------------------------------------------

// app.get('/users/:userId', async (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const recepient = await register.find({})
//         let users = await register.find({ userId: { $ne: userId } })

// users = users.filter((usersId)=>{

// })
//         res.status(200).json(users)
//     } catch (error) {
//         res.status(500).json("Error retrieving users")
//         console.log(error)
//     }
// })

app.get("/users/:mongoId", async (req, res) => {
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

    console.log("hello finally");

    const allUserIds = [
      ...currentUserFriends,
      ...currentUserSentFriendReqs,
      ...currentUserReceivedFriendReqs,
    ];
    users = await register.find({
      userId: { $nin: allUserIds },
      _id: { $ne: mongoId },
    });
    // if (fr.friends.length !== 0 && fr.sentfriendRequests.length !== 0 && fr.friendRequests.length !==0) {

    //     const currentUser = await register.findById(mongoId).populate('friends', 'name _id userId').lean();
    //     const currentUser2 = await register.findById(mongoId).populate('sentfriendRequests', 'name _id userId').lean();
    //     const currentUser3 = await register.findById(mongoId).populate('friendRequests', 'name _id userId').lean();

    //     const currentUserFriends = currentUser.friends.map(friend => friend.userId);
    //     const currentUserSentFriendReqs = currentUser2.sentfriendRequests.map(sentfriendreq => sentfriendreq.userId);
    //     const currentUserReceivedFriendReqs = currentUser3.friendRequests.map(recfriendreq => recfriendreq.userId);

    //     users = await register.find({ userId: { $nin: [currentUserFriends, currentUserSentFriendReqs, currentUserReceivedFriendReqs] }, _id: { $ne: mongoId } });
    // }

    // else if (fr.friends.length !== 0 && fr.sentfriendRequests.length === 0 && fr.friendRequests.length ===0) {
    //     const currentUser = await register.findById(mongoId).populate('friends', 'name _id userId').lean();

    //     const currentUserFriends = currentUser.friends.map(friend => friend.userId);

    //     users = await register.find({ userId: { $nin: currentUserFriends }, _id: { $ne: mongoId } });
    // }

    // else if (fr.friends.length === 0 && fr.sentfriendRequests.length !== 0 && fr.friendRequests.length !==0) {
    //     const currentUser = await register.findById(mongoId).populate('friends', 'name _id userId').lean();

    //     const currentUserSentFriendReqs = currentUser.sentfriendRequests.map(sentfriendreq => sentfriendreq._id);

    //     users = await register.find({ userId: { $nin: currentUserSentFriendReqs }, _id: { $ne: mongoId } });
    // }
    // else {
    //     console.log("here")
    //     users = await register.find({ _id: { $ne: mongoId } });

    // }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error retrieving users" });
  }
});

app.post("/friend-Request", async (req, res) => {
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

app.get("/friend-request/:mongoId", async (req, res) => {
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

app.get("/my-friends/:mongoId", async (req, res) => {
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

app.post("/friend-request/accept", async (req, res) => {
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

app.post("/remove-friend", async (req, res) => {
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

const pushNotifs = () => {
  const fcm = new FCM(
    "AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO"
  );
};

app.post("/EnterNadraInfo", async (req, res) => {
  // if(req.body === null){

  try {
    let response = await Nadra.insertMany(req.body);
    console.log(response);
    //    res.send(response)
    res.send(true);
  } catch (error) {
    console.log(error);
  }
  // }
});

app.put("/do", async (req, res) => {
  try {
    // let response = await Nadra.find({})

    // response.forEach(async (value, index) => {
    //     // let response2 = await register.findOneAndUpdate({ userId: value.userId }, { $set: { name: value.name } })
    //     let response2 = await register.findOneAndUpdate({ userId: value.userId }, { $set: { name: value.name } })
    // })

    let response = await register.updateMany(
      {},
      { $set: { is_online: 0 } }
    );

    res.status(200).json({ message: "done", updatedCount: response.nModified });
  } catch (error) {
    res.status(500).json({ message: "oops" });
  }
});

app.post("/VerifyNadraInfo", async (req, res) => {
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
        { userId },
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

app.post("/register", async (req, res) => {
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

app.post("/login", checkLoginInfo, (req, res) => {
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

app.post("/verifyToken", async function verifyToken(req, res) {
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

app.post("/forgotpassword", cors(), async (req, res) => {
  try {
    let response = await register.findOne(req.body);

    if (response !== null) {
      let mail = await main(response.email, response.userId, response.password);
      if (mail === true) {
        res.send({ success: true });
      } else {
        res.send({ success: false });
        console.log("jaldi dedia response");
      }
    } else {
      res.send({ success: false });
    }
    console.log(response.email);
  } catch (error) {
    console.log(error);
  }
});

app.post("/sendFCM", async (req, res) => {
  try {
    let totalTokens = await FcmDeviceToken.find({});
    // console.log(totalTokens)
    // res.json(totalTokens)

    const fcm = new FCM(
      "AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO"
    );
    let dv = [];
    totalTokens.forEach((value, index) => {
      dv.push(value.DeviceToken);
    });
    const currentDate = moment().tz("Asia/Karachi");
    console.log(currentDate);
    const hours = currentDate.hours();
    const minutes = currentDate.minutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    await adminNotifications.insertMany({
      date: currentDate.toISOString().split("T")[0],
      time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
      title: req.body.title,
      body: req.body.body,
    });

    fcm.send(
      {
        registration_ids: dv,
        content_available: true,
        mutable_content: true,
        // data: {
        //     body: req.body.body,
        //     title: req.body.title,
        //     // imageUrl: 'https://my-cdn.com/app-logo.png',
        //     icon: "myicon",
        //     sound: "mySound",

        // },
        notification: {
          body: req.body.body,
          title: req.body.title,
          // imageUrl: 'https://my-cdn.com/app-logo.png',
          icon: "myicon",
          sound: "mySound",
        },
      },
      (err, response) => {
        if (err) {
          console.log("---------------" + err);
        }
        if (response) {
          console.log(response);
        }
      }
    );

    // for (let i = 0; i < totalTokens.length; i++) {

    // ---------------------------------
    //     // await admin.messaging().sendMulticast({
    //     //     tokens: [
    //     //      totalTokens[i].DeviceToken
    //     //     ], // ['token_1', 'token_2', ...]
    //     //     notification: {
    //     //       title: 'Basic Notification',
    //     //       body: 'This is a basic notification sent from the server!',
    //     //       imageUrl: 'https://my-cdn.com/app-logo.png',
    //     //     },
    //     //   });
    // ---------------------------------
    //     // POST https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send HTTP/1.1
    //     let url = 'https://fcm.googleapis.com/fcm/send'
    //     let response = await fetch(url, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': 'Bearer AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO'
    //         },
    //         body: JSON.stringify({

    //             "data": {},
    //             "notification": {
    //                 "body": "This is an FCM notification message!",
    //                 "title": "FCM Message"
    //             },
    //             "to": totalTokens[i].DeviceToken,
    //         }

    //         )

    //     })
    // }
    //     response = response.json()
  } catch (error) {
    console.log("error isssssssss:" + error);
  }
  // res.send(true)
});

app.get("/get-notifs", async (req, res) => {
  try {
    let response = await adminNotifications.find({});
    res.status(200).send(response);
  } catch (error) {
    res.status(404).json({ status: "failed" });
  }
});

app.post("/admin/register", async (req, res) => {
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

    //    else

    res.send({ success: true });
    // next();
  } catch (error) {
    console.log(error);
  }
};

// const secretKey = "hey";

app.post("/admin/login", checkAdminLoginInfo, (req, res) => {
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

app.get("/admin/getAllUsers", async (req, res) => {
  try {
    const allUsers = await register.find({});
    res.status(200).send(allUsers);
  } catch (error) {
    res.status(500).send("Error fetching users");
  }
});

app.post("/save-download-url/:mongoId", async (req, res) => {
  const downloadUrl = req.body.downloadUrl;
  console.log(downloadUrl);
  try {
    const user = await register.findById(req.params.mongoId);
    // console.log(user)
    user.rescue_video_download_urls.push({ download_link: downloadUrl });
    await user.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.msg });
    console.log(error);
  }
});

app.post("/sendToOne/:mongoId", async (req, res) => {
  try {
    let User = await register.findById({ _id: req.params.mongoId });
    // console.log(totalTokens)
    // res.json(totalTokens)
    sendNotifToOne(User);
  } catch (error) {
    console.log("error isssssssss:" + error);
  }
});

const sendNotifToOne = async (User) => {
  const fcm = new FCM(
    "AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO"
  );
  let dv = [];
  dv.push(User.FCMDeviceToken);
  // totalTokens.forEach((value, index) => {
  //     dv.push(value.DeviceToken)
  // })
  const currentDate = moment().tz("Asia/Karachi");
  console.log(currentDate);
  const hours = currentDate.hours();
  const minutes = currentDate.minutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  await adminNotifications.insertMany({
    date: currentDate.toISOString().split("T")[0],
    time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
    title: req.body.title,
    body: req.body.body,
  });

  fcm.send(
    {
      registration_ids: dv,
      content_available: true,
      mutable_content: true,
      // data: {
      //     body: req.body.body,
      //     title: req.body.title,
      //     // imageUrl: 'https://my-cdn.com/app-logo.png',
      //     icon: "myicon",
      //     sound: "mySound",

      // },
      notification: {
        body: req.body.body,
        title: req.body.title,
        // imageUrl: 'https://my-cdn.com/app-logo.png',
        icon: "myicon",
        sound: "mySound",
      },
    },
    (err, response) => {
      if (err) {
        console.log("---------------" + err);
      }
      if (response) {
        console.log(response);
      }
    }
  );
};

server.listen(3000, () => {
  console.log("server running on port 3000");
});

// require('./SendMail')
