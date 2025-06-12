// server.js
// This file sets up a simple Node.js Express server to run the prediction logic.

const express = require('express');
const cors = require('cors');
// We need node-fetch to make API calls from the backend
const fetch = require('node-fetch'); 
const { ultraAIPredict } = require('./predictionLogic.js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON requests

// --- In-Memory State Management ---
// This stores the results of the last prediction for the learning algorithm.
let sharedStats = {
    longTermGlobalAccuracy: 0.5,
    lastPredictionSignals: [],
    lastActualOutcome: null,
    lastPredictedOutcome: null,
    lastFinalConfidence: null,
    lastConfidenceLevel: 1,
    lastPeriodFull: null,
    lastVolatilityRegime: 'UNKNOWN',
    lastMacroRegime: 'UNKNOWN_REGIME',
    lastConcentrationModeEngaged: false,
    lastMarketEntropyState: 'STABLE_MODERATE',
};


// --- IMPORTANT ---
// This function now contains the API logic from your file.
async function fetchRealHistoryFromAPI() {
    try {
        console.log("Fetching data from REAL API...");
        const response = await fetch("https://api.bdg88zf.com/api/webapi/GetNoaverageEmerdList", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
          },
          body: JSON.stringify({
            pageSize: 10, // Updated to 10 as requested
            pageNo: 1,
            typeId: 1,
            language: 0,
            random: "4a0522c6ecd8410496260e686be2a57c",
            signature: "334B5E70A0C9B8918B0B15E517E2069C",
            timestamp: Math.floor(Date.now() / 1000)
          })
        });
        
        // Check if the response is JSON before parsing
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await response.text();
            console.error("API did not return JSON. Response:", textResponse);
            throw new Error("Invalid response from API. Expected JSON.");
        }

        const data = await response.json();
        
        // The API response is nested under `data.list`.
        const apiHistory = data?.data?.list || [];

        // --- Data Transformation ---
        // We need to transform the API data into the format our prediction logic expects.
        // The logic needs: { period, actual, actualNumber, status }
        const formattedHistory = apiHistory.map(item => {
            const actualNumber = String(item.number);
            return {
                period: String(item.issueNumber),
                actual: actualNumber,
                actualNumber: actualNumber, // The logic uses this property
                // We'll simulate a status for now, as the API doesn't provide it.
                status: Math.random() > 0.5 ? "Win" : "Loss" 
            };
        });

        return formattedHistory;

    } catch (error) {
        console.error("Error fetching real history:", error);
        // Return an empty array if the API call fails
        return [];
    }
}


// --- API Endpoint ---
// The frontend will call this endpoint to get new predictions.
app.post('/predict', async (req, res) => { // Now async
    try {
        // 1. Fetch the REAL, up-to-date history from your API.
        const realHistory = await fetchRealHistoryFromAPI();

        if (!realHistory || realHistory.length === 0) {
            throw new Error("Failed to fetch real history from the API.");
        }

        // 2. The prediction logic needs the actual outcome of its previous prediction to learn.
        //    We set it here from the most recent real result.
        if (realHistory.length > 1) {
             sharedStats.lastActualOutcome = realHistory[0].actual;
        }

        // 3. Call the prediction logic with the real history.
        const predictionResult = ultraAIPredict(realHistory, sharedStats);

        // 4. Determine the ID for the *next* prediction period.
        //    This simple logic just increments the last known period ID.
        const nextPeriodId = String(Number(realHistory[0].period) + 1);
        
        // 5. Update the shared stats with the results of the prediction we just made.
        //    This will be used for learning in the *next* call.
        sharedStats = {
            ...sharedStats,
            lastPredictedOutcome: predictionResult.lastPredictedOutcome,
            lastFinalConfidence: predictionResult.lastFinalConfidence,
            lastConfidenceLevel: predictionResult.lastConfidenceLevel,
            lastMacroRegime: predictionResult.lastMacroRegime,
            lastPredictionSignals: predictionResult.lastPredictionSignals,
            lastConcentrationModeEngaged: predictionResult.lastConcentrationModeEngaged,
            lastMarketEntropyState: predictionResult.lastMarketEntropyState,
            lastVolatilityRegime: predictionResult.lastVolatilityRegime,
            lastPeriodFull: nextPeriodId, 
        };
        
        // 6. Send the prediction and the real history back to the frontend.
        res.json({
            status: 'success',
            predictionResult: {
                 ...predictionResult,
                 lastPeriodFull: nextPeriodId // Ensure frontend shows the correct upcoming period
            },
            pendingPredictions: realHistory.slice(0, 50) 
        });

    } catch (error) {
        console.error('Error during prediction:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// Health check endpoint for Render
app.get('/', (req, res) => {
    res.send('Prediction server is running.');
});

// Add this to your package.json dependencies: "node-fetch": "^2.6.7"
// Then run `npm install`
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
