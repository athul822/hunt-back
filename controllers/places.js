const { v4: uuidv4 } = require("uuid");
const Places = require("../models/places");
const Contest = require("../models/contest");
const Users = require("../models/users");
const mongoose = require('mongoose');
const CoinTransaction = require("../models/coinTransaction");

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
    const { includeParticipants } = req.query;
    const { filterType, userLocation, page = 1, pageSize = 10, city } = req.body || {};
    
    console.log("Contest fetch query:", query, "Include participants:", includeParticipants, "Filter type:", filterType);

    // Get user city from request (assuming user data is attached to request)
    let userCity = req.user?.city || city || "Thiruvananthapuram"; // Default city if not specified
    
    // Apply filter based on filterType
    if (filterType && filterType !== 'all') {
      if (filterType === 'popular') {
        // For popular contests, we'll use the user's city
        if (userCity) {
          query['address.city'] = userCity;
        }
        
        // We'll sort by popularity later (ratio of participants to max participants)
      }
      else if (filterType === 'starting-soon') {
        // For contests starting soon, filter by city and time (next 6 hours)
        if (userCity) {
          query['address.city'] = userCity;
        }
        
        // Get current date and time
        const now = new Date();
        
        // Get date 6 hours from now
        const sixHoursLater = new Date(now);
        sixHoursLater.setHours(sixHoursLater.getHours() + 6);
        
        // Format dates as strings in the same format as stored in the database
        const nowDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const laterDateStr = sixHoursLater.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Format times as strings (HH:MM:SS)
        const nowTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
        const laterTimeStr = sixHoursLater.toTimeString().split(' ')[0]; // HH:MM:SS
        
        console.log("Time range for 'starting-soon' filter:", 
          `${nowDateStr} ${nowTimeStr} to ${laterDateStr} ${laterTimeStr}`);
        
        // Check if the contest starts today or tomorrow (within 6 hours window)
        if (nowDateStr === laterDateStr) {
          // Same day - use time range
          query.startDate = nowDateStr;
          query.startTime = { $gte: nowTimeStr, $lte: laterTimeStr };
        } else {
          // Spans two days
          query.$or = [
            { startDate: nowDateStr, startTime: { $gte: nowTimeStr } },
            { startDate: laterDateStr, startTime: { $lte: laterTimeStr } }
          ];
        }
      }
      else if (filterType === 'near-you') {
        // For contests near the user's current location (within 5km radius)
        // Check if user location is provided
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          const { latitude, longitude } = userLocation;
          const maxDistanceInKm = 5; // 5 km radius
          
          console.log(`Searching for contests within ${maxDistanceInKm}km of [${latitude}, ${longitude}]`);
          
          // We'll need to fetch all contests and filter manually since we don't have geo query capabilities
          // in the basic schema. In a production app, you'd use MongoDB's $nearSphere
        } else {
          console.log("No user location provided for 'near-you' filter, using city instead");
          // Fallback to city filter if no location
          if (userCity) {
            query['address.city'] = userCity;
          }
        }
      }
    } else {
      // For "all" filter, still filter by city to show contests in user's area
      if (userCity) {
        query['address.city'] = userCity;
      }
      console.log(`Filtering "all" contests by city: ${userCity}`);
    }

    // Always select participants field to get the count, even if we don't populate it
    let contestQuery = Contest.find(query)
      .select("_id contestName subjectImage difficulty maxParticipants duration prizePool startDate startTime address.display_name creatorId participants playZone");
    
    // Add pagination for the "all" filter
    if (filterType === 'all') {
      // Calculate skip value for pagination (skip = (page - 1) * pageSize)
      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      
      // Add pagination to query
      contestQuery = contestQuery
        .skip(skip)
        .limit(parseInt(pageSize))
        .sort({ createdAt: -1 }); // Sort by creation date, newest first
      
      console.log(`Applying pagination: page ${page}, pageSize ${pageSize}, skip ${skip}`);
    }
    
    // Conditionally include detailed participant information if the flag is true
    if (includeParticipants === 'true') {
      contestQuery = contestQuery.populate({
        path: 'participants',
        select: '_id firstName lastName username profileImage'
      });
    }

    // Get all contests matching the query
    let data = await contestQuery;

    // For "near-you" filter with user location, apply distance calculation after fetching data
    if (filterType === 'near-you' && userLocation && userLocation.latitude && userLocation.longitude) {
      const { latitude, longitude } = userLocation;
      const maxDistanceInKm = 5; // 5 km radius
      
      // Calculate distance for each contest and filter those within range
      data = data.filter(contest => {
        if (!contest.playZone || !contest.playZone.lat || !contest.playZone.lon) {
          return false;
        }
        
        // Calculate distance using haversine formula
        const distance = calculateDistance(
          latitude, 
          longitude, 
          contest.playZone.lat, 
          contest.playZone.lon
        );
        
        // Add distance to contest object for sorting
        contest._distance = distance;
        
        return distance <= maxDistanceInKm;
      });
    }

    if (data && data.length > 0) {
      // Add a participantCount property for convenience
      let enhancedData = data.map(contest => {
        const plainContest = contest.toObject();
        plainContest.participantCount = contest.participants ? contest.participants.length : 0;
        
        // Calculate popularity score: (current participants / max participants) ratio
        plainContest.popularityScore = 
          plainContest.maxParticipants > 0 
            ? plainContest.participantCount / plainContest.maxParticipants
            : 0;
            
        // Add distance if it was calculated
        if (contest._distance !== undefined) {
          plainContest.distance = contest._distance;
        }
            
        return plainContest;
      });
      
      // Apply sorting based on filter type
      if (filterType === 'popular') {
        // Sort by popularity score (descending)
        enhancedData = enhancedData.sort((a, b) => b.popularityScore - a.popularityScore);
      } else if (filterType === 'starting-soon') {
        // Sort by start date and time (ascending)
        enhancedData = enhancedData.sort((a, b) => {
          // Create Date objects for comparison
          const dateA = new Date(`${a.startDate}T${a.startTime}`);
          const dateB = new Date(`${b.startDate}T${b.startTime}`);
          return dateA - dateB; // Ascending order (soonest first)
        });
      } else if (filterType === 'near-you' && userLocation) {
        // Sort by distance if available
        enhancedData = enhancedData.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      // For "all" filter, the sorting is already applied in the query (by creation date)
      
      console.log("Contests found:", enhancedData.length);
      res.json({
        message: "Contest fetch Success",
        data: enhancedData,
        pagination: filterType === 'all' ? {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: enhancedData.length === parseInt(pageSize) // If we got a full page, there might be more
        } : null
      });
    } else {
      console.log("No contests found for the given query");
      res.status(200).json({
        message: "No contests found",
        data: [],
        pagination: filterType === 'all' ? {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: false
        } : null
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
  try {
    const query = { _id: req.body._id };
    const { includeParticipants } = req.query;
    console.log("Contest fetch by ID:", query, "Include participants:", includeParticipants);
    
    // Always select participants field to get the count
    let contestQuery = Contest.findOne(query);
    
    // Conditionally include detailed participant information if the flag is true
    if (includeParticipants === 'true') {
      contestQuery = contestQuery.populate({
        path: 'participants',
        select: '_id firstName lastName username profileImage'
      });
    }
    
    const data = await contestQuery;
    
    if (data) {
      // Add a participantCount property for convenience
      const plainData = data.toObject();
      plainData.participantCount = data.participants ? data.participants.length : 0;
      
      console.log("Contest found:", data._id, "Participants:", plainData.participantCount);
      res.json({
        message: "Contest fetch Success",
        data: plainData,
      });
    } else {
      res.status(404).json({
        message: "No Contest found",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: "Unable to fetch contest",
      error: err.message,
    });
  }
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
    
    // Create new contest
    const newContest = await Contest.create(req.body);

    // Update user's hunt creation stats
    await Users.findByIdAndUpdate(
      req.user._id,
      {
        $push: { huntsCreated: newContest._id },
        $inc: { totalHuntsCreated: 1 }
      }
    );

    // Send success response
    res.json({ 
      message: "Contest created successfully", 
      newContest 
    });
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
    const { includeParticipants } = req.query;
    console.log("My contests fetch query:", query, "Include participants:", includeParticipants);

    // Always select participants field to get the count
    let contestsQuery = Contest.find(query)
      .select("_id contestName subjectImage difficulty maxParticipants duration prizePool startDate startTime address.display_name participants");
    
    // Conditionally include detailed participant information if the flag is true
    if (includeParticipants === 'true') {
      contestsQuery = contestsQuery.populate({
        path: 'participants',
        select: '_id firstName lastName username profileImage'
      });
    }

    const contests = await contestsQuery;

    if (contests && contests.length > 0) {
      // Add a participantCount property for convenience
      const enhancedContests = contests.map(contest => {
        const plainContest = contest.toObject();
        plainContest.participantCount = contest.participants ? contest.participants.length : 0;
        return plainContest;
      });
      
      console.log("User contests found:", contests.length);
      res.json({
        message: "My contests fetch success",
        data: enhancedContests,
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

exports.joinContest = async (req, res) => {
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { contestId } = req.body;
    const userId = req.user._id;

    // Fetch contest details with validation
    const contest = await Contest.findById(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    // Validate contest status
    const startDateTime = new Date(`${contest.startDate} ${contest.startTime}`);
    if (startDateTime < new Date()) {
      throw new Error('Contest has already started');
    }

    // Check if user is already participating
    const user = await Users.findById(userId).select('coinBalance huntsParticipated');
    if (user.huntsParticipated.includes(contestId)) {
      throw new Error('Already joined this contest');
    }

    // Validate entry fee and user balance
    if (contest.entryFee > user.coinBalance) {
      throw new Error('Insufficient coin balance');
    }

    // Check if contest is full by directly checking the participants array
    // This is more accurate than counting users with huntsParticipated
    const currentParticipantCount = contest.participants ? contest.participants.length : 0;
    console.log(`Contest ${contestId} participant check: ${currentParticipantCount}/${contest.maxParticipants}`);
    
    if (currentParticipantCount >= contest.maxParticipants) {
      throw new Error('Contest is full');
    }

    // Create coin transaction record
    const transaction = new CoinTransaction({
      user: userId,
      amount: -contest.entryFee,
      type: 'purchase',
      status: 'completed',
      description: `Entry fee for contest: ${contest.contestName}`,
      metadata: {
        contestId,
        transactionType: 'contest_entry'
      }
    });
    await transaction.save({ session });

    // Update user document
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      {
        $inc: { coinBalance: -contest.entryFee },
        $push: { 
          huntsParticipated: contestId,
          coinTransactions: transaction._id
        }
      },
      { new: true, session }
    );

    // Add user to contest participants and ensure we don't add duplicates
    await Contest.findByIdAndUpdate(
      contestId,
      {
        $addToSet: { participants: userId } // Use addToSet instead of push to avoid duplicates
      },
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the contest',
      updatedBalance: updatedUser.coinBalance
    });

  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    
    console.error('Error joining contest:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to join contest',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Helper function to calculate distance between two points using the haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Helper function to convert degrees to radians
function toRad(degrees) {
  return degrees * Math.PI / 180;
}
