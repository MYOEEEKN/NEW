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
// This is the function you need to edit.
// It should call your API to get the most recent game history.
async function fetchRealHistoryFromAPI() {
    //
    // REPLACE THIS with a call to your actual API endpoint.
    // For example:
    // const apiUrl = 'https://your-game-api.com/getHistory?limit=200';
    // const response = await fetch(apiUrl);
    // const realHistory = await response.json();
    //
    // The data you get back MUST be an array of objects, with the most recent result at the top (index 0).
    // Each object must have at least these properties:
    // {
    //   "period": "20240613123",  // The actual period ID as a string
    //   "actual": "7",             // The actual winning number as a string
    //   "status": "Win" or "Loss"  // The outcome status for the prediction
    // }
    //
    
    // For now, I am returning realistic-looking MOCK data for demonstration.
    // You MUST replace this mock data with your actual API call.
    console.log("Fetching data from REAL API (placeholder)...");
    
    // Generate some mock history data that looks real
    let mockHistory = [];
    let currentPeriod = 20240613300;
    for(let i=0; i<200; i++){
        const actualNumber = String(Math.floor(Math.random() * 10));
        mockHistory.push({
            period: String(currentPeriod - i),
            actual: actualNumber,
            actualNumber: actualNumber, // The logic uses this property
            status: Math.random() > 0.5 ? "Win" : "Loss"
        });
    }

    return mockHistory;
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
