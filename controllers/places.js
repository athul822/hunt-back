const { v4: uuidv4 } = require("uuid");
const Places = require("../models/places");
const Contest = require("../models/contest");
const Users = require("../models/users");

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
  try {
    const query = {};
    const { bounds } = req.body;

    // Handle bounding box query if bounds are provided
    if (bounds) {
      const { minLat, maxLat, minLng, maxLng } = bounds;
      if (minLat && maxLat && minLng && maxLng) {
        // Use $or to search both circleCenter and treasureLocation
        query.$or = [
          {
            "circleCenter.latitude": { $gte: minLat, $lte: maxLat },
            "circleCenter.longitude": { $gte: minLng, $lte: maxLng }
          },
          {
            "treasureLocation.latitude": { $gte: minLat, $lte: maxLat },
            "treasureLocation.longitude": { $gte: minLng, $lte: maxLng }
          }
        ];
      }
    }

    // Only show active or scheduled contests by default if not specified
    if (!req.body.status) {
      query.status = { $in: ["active", "scheduled"] };
    } else {
      query.status = req.body.status;
    }

    console.log("Contest fetch query:", JSON.stringify(query));

    const contests = await Contest.find(query)
      .select(
        "_id contestName subjectImage difficulty maxParticipants duration prizePool startDate startTime address.display_name circleCenter treasureLocation"
      )
      .lean(); // Use lean() for better performance

    if (contests && contests.length > 0) {
      console.log("Contests found:", contests.length);
      res.json({
        message: "Contest fetch Success",
        data: contests,
      });
    } else {
      console.log("No contests found for the given query");
      res.status(200).json({ // Return 200 with empty array instead of 400
        message: "No contests found",
        data: []
      });
    }
  } catch (err) {
    console.error("Error fetching contests:", err);
    res.status(400).json({
      message: "unable to fetch",
      error: err.message,
    });
  }
};

exports.listContestById = async (req, res) => {
  const query = { _id: req.body._id };
  console.log("Contest fetch by ID:", query);
  Contest.findOne(query)
    .select(
      "-secretCode -proximityClues -creatorId -contextPhotos -participants -views -ratings -arConfig -initialClue -treasureLocation"
    )
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

// exports.createContest = async (req, res) => {
//   try {
//     req.body.id = uuidv4();
//     console.log(req.body, "body");
//     // console.log({ newHotel });
//     // console.log(zone,"zone");
//     // req.body.zone = zone;
//     const newContest = await Contest.create(req.body);
//     // Send success response
//     res.json({ message: "User registration successful", newContest });
//   } catch (error) {
//     // Handle errors
//     console.error("Error in user registration:", error);
//     res.status(500).json({
//       message: "Unable to register new user",
//       error: error.message,
//     });
//   }
// };

/**
 * Create Contest - Receives image URLs (already uploaded)
 * POST /api/places/createContest
 */
exports.createContest = async (req, res) => {
  try {
    const {
      huntType,
      entryFee,
      visibility,
      useVerifiedLocation,
      verifiedLocationId,
      treasureLocation,
      treasurePhoto, // Already uploaded image URL
      contextPhotos, // Array of already uploaded image URLs
      searchRadius,
      circleCenter,
      initialClue,
      proximityClues,
      verificationMethod,
      secretCode,
      arAnchorImage, // Already uploaded image URL
      arText,
      calculatedDifficulty,
      name,
      description,
      startImmediately,
      scheduledDateTime,
      duration,
    } = req.body;

    // Validation
    if (!huntType || !huntType.id) {
      return res.status(400).json({ message: "Hunt type is required" });
    }

    if (!treasureLocation) {
      return res.status(400).json({ message: "Treasure location is required" });
    }

    if (!treasurePhoto || !treasurePhoto.url) {
      return res.status(400).json({ message: "Treasure photo is required" });
    }

    if (!initialClue || initialClue.length < 10) {
      return res.status(400).json({
        message: "Initial clue must be at least 10 characters",
      });
    }

    if (!name || name.length < 3) {
      return res.status(400).json({ message: "Contest name is required" });
    }

    // For AR hunts, validate AR anchor image
    if (verificationMethod === "ar" && (!arAnchorImage || !arAnchorImage.url)) {
      return res.status(400).json({
        message: "AR anchor image is required for AR hunts",
      });
    }

    // Get creator ID from authenticated user
    const creatorId = req.user.id;
    const contestId = uuidv4();

    // Build contest object
    const contestData = {
      id: contestId,
      huntType,
      entryFee: entryFee || 0,
      visibility: visibility || "public",
      useVerifiedLocation: useVerifiedLocation || false,
      verifiedLocationId,
      treasureLocation,
      treasurePhoto, // { url, filename, size }
      contextPhotos: contextPhotos || [],
      searchRadius: searchRadius || 200,
      circleCenter,
      initialClue,
      proximityClues: proximityClues || [],
      verificationMethod,
      secretCode: verificationMethod === "code" ? secretCode : null,
      calculatedDifficulty: calculatedDifficulty || "medium",
      name,
      description,
      startImmediately: startImmediately !== false,
      scheduledDateTime: !startImmediately ? new Date(scheduledDateTime) : null,
      duration: duration || 24,
      creatorId,
      status: startImmediately ? "active" : "scheduled",

      // Legacy fields
      contestName: name,
      subjectImage: treasurePhoto.url,
      difficulty: calculatedDifficulty,
    };

    // Add AR config if AR hunt
    if (verificationMethod === "ar" && arAnchorImage) {
      contestData.arConfig = {
        anchorImage: arAnchorImage, // { url, filename, size }
        arText: arText || "Treasure Found!",
        verified: true,
      };
    }

    // Create contest
    const newContest = await Contest.create(contestData);

    res.status(201).json({
      message: "Contest created successfully",
      contest: {
        id: newContest.id,
        name: newContest.name,
        status: newContest.status,
        treasurePhoto: newContest.treasurePhoto,
      },
    });
  } catch (error) {
    console.error("Error creating contest:", error);
    res.status(500).json({
      message: "Unable to create contest",
      error: error.message,
    });
  }
};

exports.joinContest = async (req, res) => {
  try {
    const { contestId } = req.body;
    const userId = req.user.id;

    if (!contestId) {
      return res.status(400).json({ message: "Contest ID is required" });
    }

    // Find contest and user
    // Try finding by custom ID first, then fallback to _id if needed
    let contest = await Contest.findOne({ id: contestId });
    if (!contest) {
      // Try finding by _id
      try {
        contest = await Contest.findById(contestId);
      } catch (e) {
        // Ignore error if contestId is not a valid ObjectId
      }
    }
    
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // Ensure we use the consistent ID format
    const targetContestId = contest.id || contest._id.toString();

    // Fix for legacy participants data (strings instead of objects)
    if (contest.participants && contest.participants.length > 0) {
      const firstPart = contest.participants[0];
      // Check if it's a string or an object without userId (legacy format)
      if (typeof firstPart === 'string' || (firstPart && !firstPart.userId && !firstPart.status)) {
        console.log("Migrating legacy participants data...");
        // Create a plain array of IDs
        const legacyIds = contest.participants.map(p => p.toString());
        // Reset and repopulate
        contest.participants = []; 
        legacyIds.forEach(id => {
          contest.participants.push({
            userId: id,
            joinedAt: new Date(),
            status: 'joined'
          });
        });
      }
    }

    const user = await Users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already joined
    if (user.huntsParticipated && (user.huntsParticipated.includes(targetContestId) || user.huntsParticipated.includes(contest._id.toString()))) {
      return res.status(400).json({ message: "Already joined this contest" });
    }

    // Check entry fee
    if (contest.entryFee > 0) {
      if ((user.coinBalance || 0) < contest.entryFee) {
        return res.status(400).json({ message: "Insufficient coin balance" });
      }
      // Deduct coins
      user.coinBalance = (user.coinBalance || 0) - contest.entryFee;
    }

    // Add to participated lists
    if (!user.huntsParticipated) user.huntsParticipated = [];
    user.huntsParticipated.push(targetContestId);

    if (!contest.participants) contest.participants = [];
    contest.participants.push({
      userId: userId,
      joinedAt: new Date(),
      status: 'joined'
    });

    // Save both
    await user.save();
    await contest.save();

    res.json({
      success: true,
      message: "Successfully joined contest",
      updatedBalance: user.coinBalance,
    });
  } catch (error) {
    console.error("Error joining contest:", error);
    res.status(500).json({
      message: "Unable to join contest",
      error: error.message,
    });
  }
};

exports.getContestTreasureLocation = async (req, res) => {
  try {
    const { contestId } = req.body;
    const userId = req.user.id;

    if (!contestId) {
      return res.status(400).json({ message: "Contest ID is required" });
    }

    // Find contest - try custom ID first, then _id
    let contest = await Contest.findOne({ id: contestId });
    if (!contest) {
      try {
        contest = await Contest.findById(contestId);
      } catch (e) {
        // Ignore error if contestId is not a valid ObjectId
      }
    }
    
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // Find user
    const user = await Users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization check: user must have joined the contest
    const targetContestId = contest.id || contest._id.toString();
    const hasJoined = user.huntsParticipated && (
      user.huntsParticipated.includes(targetContestId) || 
      user.huntsParticipated.includes(contest._id.toString())
    );

    if (!hasJoined) {
      return res.status(403).json({ 
        message: "You must join this contest to view its details" 
      });
    }

    // Contest must be active to reveal treasure location
    if (contest.status !== 'active') {
      return res.status(403).json({ 
        message: "This contest is not currently active",
        status: contest.status
      });
    }

    // Return safe data - exclude sensitive information
    res.json({
      success: true,
      data: {
        treasureLocation: contest.treasureLocation,
        searchRadius: contest.searchRadius,
        circleCenter: contest.circleCenter,
        initialClue: contest.initialClue,
        proximityClues: contest.proximityClues,
        verificationMethod: contest.verificationMethod,
        // Include AR text if it's an AR hunt (but NOT the anchor image)
        arText: contest.arConfig?.arText,
        // Include basic contest info for display
        name: contest.name,
        duration: contest.duration,
        calculatedDifficulty: contest.calculatedDifficulty,
      }
    });
  } catch (error) {
    console.error("Error getting contest treasure location:", error);
    res.status(500).json({
      message: "Unable to get contest details",
      error: error.message,
    });
  }
};
