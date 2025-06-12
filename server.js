// server.js
// This file sets up a simple Node.js Express server to run the prediction logic.

const express = require('express');
const cors = require('cors');
const { ultraAIPredict } = require('./predictionLogic.js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON requests

// --- In-Memory State Management ---
// This will store the prediction history and stats while the server is running.
// Note: This data will be reset if the Render server restarts.
let sharedHistory = [];
let sharedStats = {
    // Initialize with empty or default values
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


// --- API Endpoint ---
// The frontend will call this endpoint to get new predictions.
app.post('/predict', (req, res) => {
    try {
        // The frontend sends its current history. We merge/use it if needed,
        // but for this implementation, we rely on the server's state.
        const clientHistory = req.body.history || [];

        // For simplicity, we'll use the server's maintained history.
        // In a more complex app, you might merge client and server histories.
        const predictionResult = ultraAIPredict(sharedHistory, sharedStats);

        // --- Update Server State ---
        // Save the latest results to be used in the next prediction cycle.
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
            lastPeriodFull: Date.now(), // Use current timestamp as period ID
        };
        
        // The logic needs to know the actual outcome of its last prediction to learn.
        // We simulate this by taking the most recent "actual" from the client,
        // assuming the client has the most up-to-date results.
        if (clientHistory.length > 0 && clientHistory[0].actual) {
             sharedStats.lastActualOutcome = clientHistory[0].actual;
        }

        // Add the new prediction to the history for the *next* round.
        // The prediction logic needs `actual` numbers to work, so we simulate
        // a result for the prediction we just made.
        const newHistoryEntry = {
            period: String(Date.now()).slice(-8),
            prediction: predictionResult.finalDecision,
            actual: String(Math.floor(Math.random() * 10)), // Simulate an actual result
            status: 'Win', // Simulate status
            confidence: predictionResult.finalConfidence,
        };
        newHistoryEntry.actualNumber = newHistoryEntry.actual;
        
        // Add to the beginning of the history array
        sharedHistory.unshift(newHistoryEntry);
        
        // Keep history from growing too large
        if (sharedHistory.length > 200) {
            sharedHistory.pop();
        }

        // Send the prediction back to the frontend
        res.json({
            status: 'success',
            predictionResult: predictionResult,
            // We send back the server's updated history so the frontend can display it
            pendingPredictions: sharedHistory.slice(0, 50) 
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


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
