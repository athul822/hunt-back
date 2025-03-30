const { v4: uuidv4 } = require("uuid");
const Places = require("../models/places");
const Contest = require("../models/contest");

const getRandomCoordinate = async (lat, lng, radius) => {
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radius;
  const deltaLat = (randomRadius * Math.cos(randomAngle)) / 111320; // Convert meters to degrees
  const deltaLng =
    (randomRadius * Math.sin(randomAngle)) /
    (111320 * Math.cos((lat * Math.PI) / 180)); // Adjust for latitude
  return [lat + deltaLat, lng + deltaLng];
};
exports.createPlaces = async (req, res) => {
  try {
    req.body.id = uuidv4();
    console.log(req.body, "body");
    // console.log({ newHotel });
    const circleRadius = 80;
    const zone = await getRandomCoordinate(
      req.body.coords.latitude,
      req.body.coords.longitude,
      circleRadius
    );
    // console.log(zone,"zone");
    req.body.zone = zone;
    const newHotel = await Places.create(req.body);
    // Send success response
    res.json({ message: "User registration successful", newHotel });
  } catch (error) {
    // Handle errors
    console.error("Error in user registration:", error);
    res.status(500).json({
      message: "Unable to register new user",
      error: error.message,
    });
  }
};

exports.listContest = async (req, res) => {
  const query = {};
  console.log("Contest fetch query:", query);

  Contest.find(query)
    .select("_id contestName subjectImage difficulty maxParticipants duration prizePool startDate startTime address.display_name creatorId")
    .then((data) => {
      if (data && data.length > 0) {
        console.log("Contests found:", data.length);
        res.json({
          message: "Contest fetch Success",
          data,
        });
      } else {
        console.log("No contests found for the given query");
        res.status(400).json({
          message: "No contests found",
        });
      }
    })
    .catch((err) => {
      console.error("Error fetching contests:", err);
      res.status(400).json({
        message: "unable to fetch",
        error: err.message,
      });
    });
};

exports.listContestById = async (req, res) => {
  const query = { _id: req.body._id };
  console.log("Contest fetch by ID:", query);
  Contest.findOne(query)
    .then((data) => {
      if (data) {
        console.log("Contest found:", data._id);
        res.json({
          message: "Contest fetch Success",
          data,
        });
      } else {
        res.status(404).json({
          message: "No Contest found",
        });
      }
    })
    .catch((err) =>
      res.status(400).json({
        message: "Unable to fetch contest",
        error: err.message,
      })
    );
};

exports.getPlaceByDistrict = async (req, res) => {
  const query = { districtId: req.body.districtId };
  console.log(" login :", query);
  Places.find(query, "name id")
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
      console.log("place deleted successfully");
      res.json({
        message: "place deleted Successfully",
        data: result,
      });
    } else {
      console.log("No places found with that ID");
      res.json({
        message: "palce not deleted",
        data: result,
      });
    }
  } catch (err) {
    console.error("Error deleting place:", err);
    res.json({
      message: "place not deleted",
      data: err,
    });
  }
};

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

    if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
      return res.status(400).json({
        message:
          "Invalid or missing keyword. Please provide a valid keyword for the search.",
      });
    }

    const regex = new RegExp(keyword, "i");

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
    console.log(req.body, "body");
    
    // Add creator ID from authenticated user
    req.body.creatorId = req.user._id;
    
    const newContest = await Contest.create(req.body);
    // Send success response
    res.json({ message: "Contest created successfully", newContest });
  } catch (error) {
    // Handle errors
    console.error("Error in contest creation:", error);
    res.status(500).json({
      message: "Unable to create contest",
      error: error.message,
    });
  }
};

exports.getMyContests = async (req, res) => {
  try {
    const query = { creatorId: req.user._id };
    console.log("My contests fetch query:", query);

    const contests = await Contest.find(query)
      .select("_id contestName subjectImage difficulty maxParticipants duration prizePool startDate startTime address.display_name");

    if (contests && contests.length > 0) {
      console.log("User contests found:", contests.length);
      res.json({
        message: "My contests fetch success",
        data: contests,
      });
    } else {
      console.log("No contests found for this user");
      res.status(200).json({
        message: "No contests found for this user",
        data: [],
      });
    }
  } catch (err) {
    console.error("Error fetching user contests:", err);
    res.status(400).json({
      message: "Unable to fetch user contests",
      error: err.message,
    });
  }
};
