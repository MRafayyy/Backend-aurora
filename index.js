const { urlencoded } = require("express");
const express = require("express");
const app = require("express")();
const { createServer } = require("http");
const { Server } = require("socket.io");
const server = createServer(app);
const io = new Server(server);
const mongoose = require("mongoose");
const contacts = require('./routes/contacts')
const women = require('./routes/women');
const admin = require('./routes/admin')

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
const handleSocketConnections = require("./sockets/sockets");
const contactsRegister = require("./model/contactRegistration");

app.use(urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());


app.use('/contacts', contacts);
app.use('/women', women);
app.use('/admin', admin);

const usp = io.of("/auro");

handleSocketConnections(io);

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

app.get('/getRescueButtonStatus/:mongoId', async (req, res) => {
  try {
    const mongoId = req.params.mongoId
    let user = await register.findById(mongoId)
    const status = user.currentRescueButtonStatus
    
    if(user.rescueButtonHistory.length!==0){
      const location = user.rescueButtonHistory.pop().locationWhereRescuePressed
    res.status(200).send({ status, location })
    }
    else{
      res.status(200).send({ status })
      
    }

  } catch (error) {
    res.send("Invalid error")
  }
})

app.post("/pressedRescueButton/:mongoId", async (req, res) => {
  try {
    const mongoId = req.params.mongoId;

    const user = await register
      .findById(mongoId)
      .populate("friends", "_id name userSpecificNotifications FCMDeviceToken")
      .populate("myContacts", "_id name userSpecificNotifications FCMDeviceToken")
      .lean();

    const data = {
      title: `${user.name} is in danger!!`,
      body: "Please rush to help your friend.",
    };



    await sendNotifToMany(data, user.friends, user.myContacts);

    const rescueButtonObject = req.body;

    await register.findByIdAndUpdate(
      { _id: mongoId },
      {
        $push: { rescueButtonHistory: rescueButtonObject },
        $set: { currentRescueButtonStatus: true },
      }
    );

    res.status(200).send(true);
  } catch (error) {
    res.status(404).send(false);
  }
});

app.post("/pressedSafeButton/:mongoId", async (req, res) => {
  try {
    const mongoId = req.params.mongoId;
    const rescueButtonAdditionalObject = req.body;

    const {
      safeButtonPressed,
      timeWhenSafeButtonPressed,
      dateWhenSafeButtonPressed,
      locationWhereSafeButtonPressed,
    } = rescueButtonAdditionalObject;

    const user = await register
      .findById(mongoId)
      .populate("friends", "_id name userSpecificNotifications FCMDeviceToken")
      .populate("myContacts", "_id name userSpecificNotifications FCMDeviceToken")
      .lean();

    const data = {
      title: `${user.name} is safe now!!`,
      body: "Your friend is not in danger anymmore.",
    };



    await sendNotifToMany(data, user.friends, user.myContacts);

    let length = user.rescueButtonHistory.length - 1;
    let response = await register.findByIdAndUpdate(
      { _id: mongoId },
      {
        $pull: { rescueButtonHistory: user.rescueButtonHistory[length] },
      },
      { new: false }
    );

    const obj = {
      timeWhenRescueButtonPressed:
        user.rescueButtonHistory[length].timeWhenRescueButtonPressed,
      dateWhenRescueButtonPressed:
        user.rescueButtonHistory[length].dateWhenRescueButtonPressed,
      locationWhereRescuePressed:
        user.rescueButtonHistory[length].locationWhereRescuePressed,
      safeButtonPressed: safeButtonPressed,
      timeWhenSafeButtonPressed: timeWhenSafeButtonPressed,
      dateWhenSafeButtonPressed: dateWhenSafeButtonPressed,
      locationWhereSafeButtonPressed: locationWhereSafeButtonPressed,
    };

    await register.findByIdAndUpdate(
      { _id: mongoId },
      {
        $push: { rescueButtonHistory: obj },
        $set: { currentRescueButtonStatus: false },
      }
    );


    res.status(200).send(true);
  } catch (error) {
    console.log(error);
    res.status(404).send(false);
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

    // let response = await register.updateMany(
    //   {},
    //   // { $set: { rescueButtonHistory: [] } }
    //   // { $set: { userSpecificNotifications: [] } }
    //   { $set: { myContacts : [] } }
    // );

   // let response = await contactsRegister.updateMany(
    //  {},
      // { $set: { rescueButtonHistory: [] } }
      // { $set: { userSpecificNotifications: [] } }
     // { $set: { myWomen: [] } }
   // );

   let response = await register.updateMany(
    {},
      { $set: { currentRescueButtonStatus: false } }
   )

    res.status(200).json({ message: "done", updatedCount: response.nModified });
  } catch (error) {
    res.status(500).json({ message: "oops" });
  }
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
        priority: "high",
        data: {
          body: req.body.body,
          title: req.body.title,
          icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6vvkBnMlO-uoIeQt_Oy_J79-cZQ0Awbc5adQHrr8O-g&s",
          imageUrl:
            "https://static.vecteezy.com/system/resources/previews/010/642/074/non_2x/graphic-fluorescent-perspective-neon-room-floor-abstract-wallpaper-light-space-illustration-3d-render-cyber-club-electronic-game-glowing-illumination-laser-cool-illusion-shape-free-photo.jpg",
          sound: "mySound",
        },
        // notification: {
        //   body: req.body.body,
        //   title: req.body.title,
        //   // imageUrl: 'https://my-cdn.com/app-logo.png',
        //   icon: "myicon",
        //   sound: "mySound",
        // },
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
app.get("/get-mynotifs/:mongoId", async (req, res) => {
  try {
    let response = await register.findById({
      _id: req.params.mongoId,
    });
    res.status(200).send(response.userSpecificNotifications);
  } catch (error) {
    res.status(404).json({ status: "failed" });
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





const sendNotifToOne = async (data, User) => {
  console.log(data);
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

  // await adminNotifications.insertMany({
  //   date: currentDate.toISOString().split("T")[0],
  //   time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
  //   title: data.title,
  //   body: data.body,
  // });

  const notifObj = {
    date: currentDate.toISOString().split("T")[0],
    time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
    title: data.title,
    body: data.body,
  };
try {
  
 let response = await register.findByIdAndUpdate(
    { _id: User._id },
    {
      $push: {
        userSpecificNotifications: notifObj,
      },
    }
  );

  } catch (error) {
  console.log(error)  
  }

  fcm.send(
    {
      registration_ids: dv,
      content_available: true,
      mutable_content: true,
      priority: "high",
      data: {
        body: data.body,
        title: data.title,
        imageUrl:
          "https://img.freepik.com/free-photo/3d-illustration-blue-purple-futuristic-sci-fi-techno-lights-cool-background_181624-57587.jpg",
        icon: "https://img.freepik.com/free-photo/3d-illustration-blue-purple-futuristic-sci-fi-techno-lights-cool-background_181624-57587.jpg",
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




app.post("/sendToOneWomen/:mongoId", async (req, res) => {
  const data = {
    body: req.body.body,
    title: req.body.title,
  };
  try {
    const User = await register.findById({_id: req.params.mongoId});
    // console.log(totalTokens)
    // res.json(totalTokens)
    sendNotifToOne(data, User);

  } catch (error) {
    console.log("error isssssssss:" + error);
  }
});

app.post("/sendToOneContact/:mongoId", async (req, res) => {
  const data = {
    body: req.body.body,
    title: req.body.title,
  };
  try {
    const User = await contactsRegister.findById({_id: req.params.mongoId});
    // console.log(totalTokens)
    // res.json(totalTokens)
    sendNotifToOne(data, User);

  } catch (error) {
    console.log("error isssssssss:" + error);
  }
});








const sendNotifToMany = async (data, Users, Contacts) => {

  const allConcernedUsers = Users.concat(Contacts);

  console.log(data);
  const fcm = new FCM(
    "AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO"
  );
  let dv = [];

  allConcernedUsers.forEach((value, index) => {
    dv.push(value.FCMDeviceToken);
  });

  const currentDate = moment().tz("Asia/Karachi");
  console.log(currentDate);
  const hours = currentDate.hours();
  const minutes = currentDate.minutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  const notifObj = {
    date: currentDate.toISOString().split("T")[0],
    time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
    title: data.title,
    body: data.body,
  };

  // Construct an array of promises for updating documents in the 'register' collection
const updateRegisterPromises = Users.map(async (value) => {
  await register.findByIdAndUpdate(
    { _id: value._id },
    {
      $push: {
        userSpecificNotifications: notifObj,
      },
    }
  );
});

// Construct an array of promises for updating documents in the 'contactsRegister' collection
const updateContactsRegisterPromises = Contacts.map(async (value) => {
  await contactsRegister.findByIdAndUpdate(
    { _id: value._id },
    {
      $push: {
        userSpecificNotifications: notifObj,
      },
    }
  );
});


// Wait for all update operations to complete
await Promise.all([...updateRegisterPromises, ...updateContactsRegisterPromises]);

  

  // await adminNotifications.insertMany({
  //   date: currentDate.toISOString().split("T")[0],
  //   time: `${hours % 12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`,
  //   title: data.title,
  //   body: data.body,
  // });

  fcm.send(
    {
      registration_ids: dv,
      content_available: true,
      mutable_content: true,
      priority: "high",
      data: {
        body: data.body,
        title: data.title,
        icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6vvkBnMlO-uoIeQt_Oy_J79-cZQ0Awbc5adQHrr8O-g&s",
        imageUrl:
          "https://static.vecteezy.com/system/resources/previews/010/642/074/non_2x/graphic-fluorescent-perspective-neon-room-floor-abstract-wallpaper-light-space-illustration-3d-render-cyber-club-electronic-game-glowing-illumination-laser-cool-illusion-shape-free-photo.jpg",
        sound: "mySound",
        topRightPicUrl:
          "https://img2.cgtrader.com/items/3085991/5ab0676214/large/neon-letters-3d-model-obj-fbx-blend.jpg",
        screen: "Screen_Home",
        // screen: 'Screen_Decider',
        // screen: 'HomeTabs, { screen: Screen_Home}',
      },
      // notification: {
      //   body: data.body,
      //   title: data.title,
      //   imageUrl: 'https://www.alleycat.org/wp-content/uploads/2019/03/FELV-cat.jpg',
      //   icon: 'https://www.alleycat.org/wp-content/uploads/2019/03/FELV-cat.jpg',
      //   sound: "mySound",
      // },
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

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("server running on port 3000");
});

// require('./SendMail')
