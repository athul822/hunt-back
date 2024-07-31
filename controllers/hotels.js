const { v4: uuidv4 } = require("uuid");
const Hotels = require("../models/hotels");

exports.createHotels = async (req, res) => {
    try {
       
        req.body.id = uuidv4();
        const newHotel = await Hotels.create(req.body);
        console.log({ newHotel });

        // // Send success response
        res.json({ message: "Hotel registration successful", newHotel });
    } catch (error) {
        // Handle errors
        console.error("Error in user registration:", error);
        res.status(500).json({
            message: "Unable to register new user",
            error: error.message
        });
    }
};


exports.listHotels = async (req, res) => {
  const givenId = req.body.id;
    const query = givenId == 'all' ? {} : {
      $or: [
        { placeId: givenId },
        { districtId: givenId },
      ],
    };;
    console.log("user login :", query);
    Hotels.find(
      query
    )
      .then((data) => {
        if (data) {
          console.log(data);
            res.json({
              message: "Hotels fetch Success",
            //   token,
              data,
            });
        } else {
          res.status(400).json({
            message: "No hotels found",
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

  exports.deleteHotel = async (req, res) => {
    try {
      const result = await Hotels.deleteOne({ id: req.body.id });
      if (result.deletedCount > 0) {
        console.log('Document deleted successfully');
        res.json({
          message: "Hotels deleted Successfully",
          data: result
        });
      } else {
        console.log('No document found with that ID');
        res.json({
          message: "Hotel not deleted",
          data: result
        });
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      res.json({
        message: "Hotel not deleted",
        data: err
      });
    }
  }


  exports.getLastFiveHotels = async (req, res) => {
    try {
      // Query to find the latest 5 hotels, sorted by createdAt in descending order
      const latestHotels = await Hotels.find().sort({ createdAt: -1 }).limit(5);
  
      // Send success response with the list of hotels
      res.json({
        message: "Latest 5 hotels fetched successfully",
        data: latestHotels,
      });
    } catch (error) {
      // Handle errors
      console.error("Error fetching the latest 5 hotels:", error);
      res.status(500).json({
        message: "Unable to fetch the latest hotels",
        error: error.message,
      });
    }
  };
  