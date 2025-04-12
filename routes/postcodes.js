const express = require('express');
const router = express.Router();
const axios = require('axios');

// Search postcodes by query
router.get("/search", async (req, res) => {
    const { query } = req.query;
    if (!query || query.length < 3) {
        return res.status(400).json({ error: "Please provide at least the first 3 digits." });
    }

    try {
        const response = await axios.get(`https://api.postalpincode.in/pincode/${query}`);        const data = response.data;
        
        if (data[0].Status !== "Success") {
            return res.status(404).json({ error: "No matching postcodes found." });
        }

        const postcodes = data[0].PostOffice.map(po => po.Pincode);
        res.json({ postcodes });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from API." });
    }
});

module.exports = router; 