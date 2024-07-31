const { v4: uuidv4 } = require("uuid");
const Rooms = require("../models/rooms");
const Hotels = require("../models/hotels");
// exports.create = async (req, res) => {
//     try {
//         req.body.id = uuidv4();
//         const newRoom = await Rooms.create(req.body);
//         console.log({ newRoom });

//         // // Send success response
//         res.json({ message: "Room registration successful", newRoom });
//     } catch (error) {
//         // Handle errors
//         console.error("Error in user registration:", error);
//         res.status(500).json({
//             message: "Unable to register new room",
//             error: error.message
//         });
//     }
// };
exports.create = async (req, res) => {
  try {
    const { hotelId,noOfRooms } = req.body;

    // Find the hotel by ID
    const hotel = await Hotels.findOne({ id: hotelId });

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel not found",
      });
    }

    // Ensure there are available rooms
    if (hotel.availableRooms <= 0) {
      return res.status(400).json({
        message: "No available rooms in this hotel",
      });
    }

    // Decrement available rooms and increment engaged rooms
    hotel.availableRooms -= noOfRooms;
    hotel.engagedRooms += noOfRooms;

    // Save the updated hotel data
    await hotel.save();

    req.body.id = uuidv4();
    const newRoom = await Rooms.create(req.body);

    res.json({
      message: "Room registration successful",
      newRoom,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      message: "Unable to register new room",
      error: error.message,
    });
  }
};


exports.list = async (req, res) => {
  const givenId = req.body.id;
    const query = { userId: givenId };
    // console.log("user login :", query);
    Rooms.find(
      query
    )
      .then((data) => {
        if (data) {
          console.log(data);
            res.json({
              message: "Rooms fetch Success",
            //   token,
              data,
            });
        } else {
          res.status(400).json({
            message: "No Rooms found",
          });
        }
      })
      .catch((err) =>
        res.status(400).json({
          message: "unable to login",
          error: err.message,
        })
      );
  };
