const contactsRegister = require("../model/contactRegistration");
const register = require("../model/registrationInfo");

let connectedUsers = {};

const handleSocketConnections = async (io) => {

    io.on("connection", async (socket) => {



        if (socket.handshake.auth.userType === "user") {

            console.log("a user connected");

            socket.on("LoggedIn", async (data) => {

                const { mongoId } = data;

                connectedUsers[socket.id] = mongoId;

                try {

                    console.log(data.userId + " logged in");
                    console.log("user's mongoId: " + data.mongoId);


                    let response = await register.findByIdAndUpdate(data.mongoId, {
                        is_online: 1,
                    });

                    socket.broadcast.emit("aUserGotOnline");

                    // ------------------------
                    const allUsers = await register.find({});

                    allUsers.forEach((user) => {
                        // console.log(user._id.toString());
                        socket.join(user._id.toString()); // Join room based on MongoDB ID
                        socket.join(user.userId); // Join room based on user ID
                    });

                } catch (error) {
                    console.log(error);
                }
            });

            // socket.broadcast.emit('getOnlineUsers', { userId: userId, count: count })

            socket.on("shareCoordinates", (data) => {
                // socket.join(data.userId);
                // socket.join(data.mongoId);
                console.log(data.userId);
                console.log(data.mongoId);
                console.log(data.Location);
                socket.to(data.userId).emit(data.userId, data);

                socket.to(data.mongoId).emit(data.mongoId, data);
                // io.to(data.mongoId).emit(data.mongoId, data);
                // socket.broadcast.emit(data.mongoId, data)

                // io.emit('bd', { data})
            });

            socket.on("newMarker", (obj) => { });

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

                try {
                    console.log("status");
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



        } else if (socket.handshake.auth.userType === "contact") {

            console.log("a contact connected");



            socket.on("LoggedIn", async (data) => {

                const { mongoId } = data;

                connectedUsers[socket.id] = mongoId;

                try {
                    console.log(data.userId + " logged in");
                    console.log("the contacts mongoId: " + data.mongoId);

                    let response = await contactsRegister.findByIdAndUpdate(

                        data.mongoId,
                        {
                            is_online: 1,
                        }
                    );

                    socket.broadcast.emit("aUserGotOnline");

                    // ------------------------
                    const allUsers = await register.find({});

                    allUsers.forEach((user) => {
                        // console.log(user._id.toString());
                        socket.join(user._id.toString()); // Join room based on MongoDB ID
                        socket.join(user.userId); // Join room based on user ID
                    });
                } catch (error) {
                    console.log(error);
                }
            });



            socket.on("Iamloggingout", async () => {

                try {
                    let response = await contactsRegister.findByIdAndUpdate(
                        connectedUsers[socket.id],
                        { $set: { is_online: 0 } }
                    );
                    socket.broadcast.emit("aUserGotOffline");

                } catch (error) {

                    console.log(error);
                }
            });

            socket.on("disconnect", async () => {
                console.log("a contact disconnected");

                try {
                    console.log("status");
                    let response = await contactsRegister.findByIdAndUpdate(
                        connectedUsers[socket.id],
                        { $set: { is_online: 0 } }
                    );
                    socket.broadcast.emit("aUserGotOffline");
                    delete connectedUsers[socket.id];
                } catch (error) {
                    console.log(error);
                }
            });
        } else if (socket.handshake.auth.userType === "admin") {
            console.log("admin connected");
            try {
                const allUsers = await register.find({});
                const allUserIds = allUsers.map((value, index) => {
                    return value.userId;
                });

                socket.join(allUserIds);
            } catch (error) {
                console.log(error);
            }
        }
    });
};

module.exports = handleSocketConnections;
