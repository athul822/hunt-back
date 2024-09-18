const { v4: uuidv4 } = require("uuid");
const Places = require("../models/places");
const Contest = require("../models/contest");


const getRandomCoordinate = async (lat, lng, radius) => {
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radius;
  const deltaLat = randomRadius * Math.cos(randomAngle) / 111320; // Convert meters to degrees
  const deltaLng = randomRadius * Math.sin(randomAngle) / (111320 * Math.cos(lat * Math.PI / 180)); // Adjust for latitude
  return [lat + deltaLat, lng + deltaLng];
};
exports.createPlaces = async (req, res) => {
    try {
        req.body.id = uuidv4();
        console.log(req.body,"body");
        // console.log({ newHotel });
        const circleRadius = 80;
        const zone =  await getRandomCoordinate(req.body.coords.latitude, req.body.coords.longitude, circleRadius);
        // console.log(zone,"zone");
        req.body.zone = zone;
        const newHotel =  await Places.create(req.body);
        // Send success response
        res.json({ message: "User registration successful", newHotel });
    } catch (error) {
        // Handle errors
        console.error("Error in user registration:", error);
        res.status(500).json({
            message: "Unable to register new user",
            error: error.message
        });
    }
};


exports.listPlaces = async (req, res) => {
    // const query = req.body.districtId == 'all' || req.body.id == 'all' ? {} : {districtId: req.body.districtId};
    const query = {};
    console.log(" login :", query);
    Contest.find(
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


  exports.getPlaceByDistrict = async (req, res) => {
    const query = {districtId: req.body.districtId};
    console.log(" login :", query);
    Places.find(
      query,"name id"
    )
      .then((data) => {
        if (data) {
          console.log(data);
            res.json({
              message: "Place name fetch Success",
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
  
  exports.deletePlaces = async (req, res) => {
    try {
      const result = await Places.deleteOne({ id: req.body.id });
      if (result.deletedCount > 0) {
        console.log('place deleted successfully');
        res.json({
          message: "place deleted Successfully",
          data: result
        });
      } else {
        console.log('No places found with that ID');
        res.json({
          message: "palce not deleted",
          data: result
        });
      }
    } catch (err) {
      console.error('Error deleting place:', err);
      res.json({
        message: "place not deleted",
        data: err
      });
    }
  }



  exports.getLastFivePlaces = async (req, res) => {
    try {
      const latestPlaces = await Places.find().sort({ createdAt: -1 }).limit(5);
  
      res.json({
        message: "Latest 5 places fetched successfully",
        data: latestPlaces,
      });
    } catch (error) {
      // Handle errors
      console.error("Error fetching the latest 5 places:", error);
      res.status(500).json({
        message: "Unable to fetch the latest places",
        error: error.message,
      });
    }
  };

  exports.searchPlaceByKeyword = async (req, res) => {
    try {
      // Extract keyword from request body
      const { keyword } = req.body;
  
      if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
        return res.status(400).json({
          message: "Invalid or missing keyword. Please provide a valid keyword for the search.",
        });
      }
  
      const regex = new RegExp(keyword, 'i');
  
      const places = await Places.find({ name: regex });
  
      if (places.length > 0) {
        // Return the found places with a success message
        res.status(200).json({
          message: `Places found containing the keyword '${keyword}':`,
          data: places,
        });
      } else {
        // Return a 404 if no places were found
        res.status(404).json({
          message: `No places found containing the keyword '${keyword}'.`,
        });
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Error during search by keyword:", error);
      res.status(500).json({
        message: "An error occurred while searching for places.",
        error: error.message,
      });
    }
  };


  exports.createContest = async (req, res) => {
    try {
        req.body.id = uuidv4();
        console.log(req.body,"body");
        // console.log({ newHotel });
        // console.log(zone,"zone");
        // req.body.zone = zone;
        const newContest =  await Contest.create(req.body);
        // Send success response
        res.json({ message: "User registration successful", newContest });
    } catch (error) {
        // Handle errors
        console.error("Error in user registration:", error);
        res.status(500).json({
            message: "Unable to register new user",
            error: error.message
        });
    }
  };