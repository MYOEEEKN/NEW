// predictionLogic.js - Quantum AI Supercore Engine
// Version: 42.0.0 - ML Integration & Advanced Adaptation
// NOTE: This is the user-provided file, adapted for a Node.js environment by adding 'module.exports'.

// --- Helper Functions ---
function getBigSmallFromNumber(number) {
    if (number === undefined || number === null) return null;
    const num = parseInt(number);
    if (isNaN(num)) return null;
    return num >= 0 && num <= 4 ? 'SMALL' : num >= 5 && num <= 9 ? 'BIG' : null;
}

function getOppositeOutcome(prediction) {
    return prediction === "BIG" ? "SMALL" : prediction === "SMALL" ? "BIG" : null;
}

function calculateSMA(data, period) {
    if (!Array.isArray(data) || data.length < period || period <= 0) return null;
    const relevantData = data.slice(0, period);
    const sum = relevantData.reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateEMA(data, period) {
    if (!Array.isArray(data) || data.length < period || period <= 0) return null;
    const k = 2 / (period + 1);
    const chronologicalData = data.slice().reverse();

    const initialSliceForSma = chronologicalData.slice(0, period);
    if (initialSliceForSma.length < period) return null;

    let ema = calculateSMA(initialSliceForSma.slice().reverse(), period);
    if (ema === null && initialSliceForSma.length > 0) {
        ema = initialSliceForSma.reduce((a, b) => a + b, 0) / initialSliceForSma.length;
    }
    if (ema === null) return null;

    for (let i = period; i < chronologicalData.length; i++) {
        ema = (chronologicalData[i] * k) + (ema * (1 - k));
    }
    return ema;
}

function calculateStdDev(data, period) {
    if (!Array.isArray(data) || data.length < period || period <= 0) return null;
    const relevantData = data.slice(0, period);
    if (relevantData.length < 2) return null;
    const mean = relevantData.reduce((a, b) => a + b, 0) / relevantData.length;
    const variance = relevantData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / relevantData.length;
    return Math.sqrt(variance);
}

function calculateVWAP(data, period) {
    if (!Array.isArray(data) || data.length < period || period <= 0) return null;
    const relevantData = data.slice(0, period);
    let totalPriceVolume = 0;
    let totalVolume = 0;
    for (const entry of relevantData) {
        const price = parseFloat(entry.actualNumber);
        const volume = parseFloat(entry.volume || 1);
        if (!isNaN(price) && !isNaN(volume) && volume > 0) {
            totalPriceVolume += price * volume;
            totalVolume += volume;
        }
    }
    if (totalVolume === 0) return null;
    return totalPriceVolume / totalVolume;
}


function calculateRSI(data, period) {
    if (period <= 0) return null;
    const chronologicalData = data.slice().reverse();
    if (!Array.isArray(chronologicalData) || chronologicalData.length < period + 1) return null;
    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = chronologicalData[i] - chronologicalData[i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < chronologicalData.length; i++) {
        const change = chronologicalData[i] - chronologicalData[i - 1];
        let currentGain = change > 0 ? change : 0;
        let currentLoss = change < 0 ? Math.abs(change) : 0;
        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

/**
 * **ENHANCED in v42.0.0: Cyclical Time Features**
 * Returns raw hour and sine/cosine transformations for cyclical awareness.
 * @returns {object} An object containing raw, sin, and cos representations of the current IST hour.
 */
function getCurrentISTHour() {
    try {
        const now = new Date();
        const istFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
        });
        const istHourString = istFormatter.formatToParts(now).find(part => part.type === 'hour').value;
        let hour = parseInt(istHourString, 10);
        if (hour === 24) hour = 0;

        return {
            raw: hour,
            sin: Math.sin(hour / 24 * 2 * Math.PI),
            cos: Math.cos(hour / 24 * 2 * Math.PI)
        };
    } catch (error) {
        console.error("Error getting IST hour:", error);
        const hour = new Date().getHours();
        return {
             raw: hour,
             sin: Math.sin(hour / 24 * 2 * Math.PI),
             cos: Math.cos(hour / 24 * 2 * Math.PI)
        };
    }
}


/**
 * **EXPANDED in v42.0.0: Real-Time External Data Simulation**
 * Simulates fetching external data including weather, news sentiment, and market index volatility.
 * @returns {object} An object containing the sentiment factor and descriptive reasons.
 */
function getRealTimeExternalData() {
    // 1. Weather Simulation
    const weatherConditions = ["Clear", "Clouds", "Haze", "Smoke", "Rain", "Drizzle"];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    let weatherFactor = 1.0;
    if (["Clear", "Clouds"].includes(randomWeather)) weatherFactor = 1.01;
    else if (["Rain", "Drizzle"].includes(randomWeather)) weatherFactor = 0.99;

    // 2. Financial News Sentiment Simulation
    const newsSentiments = ["Strongly Positive", "Positive", "Neutral", "Negative", "Strongly Negative"];
    const randomNewsSentiment = newsSentiments[Math.floor(Math.random() * newsSentiments.length)];
    let newsFactor = 1.0;
    if(randomNewsSentiment === "Strongly Positive") newsFactor = 1.05;
    else if(randomNewsSentiment === "Positive") newsFactor = 1.02;
    else if(randomNewsSentiment === "Negative") newsFactor = 0.98;
    else if(randomNewsSentiment === "Strongly Negative") newsFactor = 0.95;

    // 3. Broader Market Index Volatility Simulation
    const marketVolatilities = ["Low", "Normal", "Elevated", "High"];
    const randomMarketVol = marketVolatilities[Math.floor(Math.random() * marketVolatilities.length)];
    let marketVolFactor = 1.0;
    if(randomMarketVol === "Elevated") marketVolFactor = 0.97;
    else if(randomMarketVol === "High") marketVolFactor = 0.94;

    // Combine factors
    const combinedFactor = weatherFactor * newsFactor * marketVolFactor;
    const reason = `ExtData(Weather:${randomWeather},News:${randomNewsSentiment},MktVol:${randomMarketVol})`;

    return { factor: combinedFactor, reason: reason };
}


function getPrimeTimeSession(istHour) {
    // 10:00 AM - 11:59 AM (IST)
    if (istHour >= 10 && istHour < 12) return { session: "PRIME_MORNING", aggression: 1.25, confidence: 1.15 };
    // 1:00 PM - 1:59 PM (IST)
    if (istHour >= 13 && istHour < 14) return { session: "PRIME_AFTERNOON_1", aggression: 1.15, confidence: 1.10 };
    // 3:00 PM - 3:59 PM (IST)
    if (istHour >= 15 && istHour < 16) return { session: "PRIME_AFTERNOON_2", aggression: 1.15, confidence: 1.10 };
     // 5:00 PM - 7:59 PM (IST) - Long shift with peak time
    if (istHour >= 17 && istHour < 20) {
        // Special focus on 7-8 PM as requested
        if (istHour === 19) {
             return { session: "PRIME_EVENING_PEAK", aggression: 1.35, confidence: 1.25 };
        }
        return { session: "PRIME_EVENING", aggression: 1.30, confidence: 1.20 };
    }
    return null; // Not a prime time session
}


// --- Market Context Analysis ---
function getMarketRegimeAndTrendContext(history, shortMALookback = 5, mediumMALookback = 10, longMALookback = 20) {
    const baseContext = getTrendContext(history, shortMALookback, mediumMALookback, longMALookback);
    let macroRegime = "UNCERTAIN";
    const { strength, volatility } = baseContext;
    let isTransitioning = false;

    const numbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));

    if (numbers.length > mediumMALookback + 5) {
        const prevShortMA = calculateEMA(numbers.slice(1), shortMALookback);
        const prevMediumMA = calculateEMA(numbers.slice(1), mediumMALookback);
        const currentShortMA = calculateEMA(numbers, shortMALookback);
        const currentMediumMA = calculateEMA(numbers, mediumMALookback);

        if (prevShortMA && prevMediumMA && currentShortMA && currentMediumMA) {
            if ((prevShortMA <= prevMediumMA && currentShortMA > currentMediumMA) ||
                (prevShortMA >= prevMediumMA && currentShortMA < currentMediumMA)) {
                isTransitioning = true;
            }
        }
    }

    if (strength === "STRONG") {
        if (volatility === "LOW" || volatility === "VERY_LOW") macroRegime = "TREND_STRONG_LOW_VOL";
        else if (volatility === "MEDIUM") macroRegime = "TREND_STRONG_MED_VOL";
        else macroRegime = "TREND_STRONG_HIGH_VOL";
    } else if (strength === "MODERATE") {
        if (volatility === "LOW" || volatility === "VERY_LOW") macroRegime = "TREND_MOD_LOW_VOL";
        else if (volatility === "MEDIUM") macroRegime = "TREND_MOD_MED_VOL";
        else macroRegime = "TREND_MOD_HIGH_VOL";
    } else if (strength === "RANGING") {
        if (volatility === "LOW" || volatility === "VERY_LOW") macroRegime = "RANGE_LOW_VOL";
        else if (volatility === "MEDIUM") macroRegime = "RANGE_MED_VOL";
        else macroRegime = "RANGE_HIGH_VOL";
    } else { // WEAK or UNKNOWN
        if (volatility === "HIGH") macroRegime = "WEAK_HIGH_VOL";
        else if (volatility === "MEDIUM") macroRegime = "WEAK_MED_VOL";
        else macroRegime = "WEAK_LOW_VOL";
    }

    if (isTransitioning && !macroRegime.includes("TRANSITION")) {
        macroRegime += "_TRANSITION";
    }

    baseContext.macroRegime = macroRegime;
    baseContext.isTransitioning = isTransitioning;
    baseContext.details += `,Regime:${macroRegime}`;
    return baseContext;
}

function getTrendContext(history, shortMALookback = 5, mediumMALookback = 10, longMALookback = 20) {
    if (!Array.isArray(history) || history.length < longMALookback) {
        return { strength: "UNKNOWN", direction: "NONE", volatility: "UNKNOWN", details: "Insufficient history", macroRegime: "UNKNOWN_REGIME", isTransitioning: false };
    }
    const numbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));
    if (numbers.length < longMALookback) {
        return { strength: "UNKNOWN", direction: "NONE", volatility: "UNKNOWN", details: "Insufficient numbers", macroRegime: "UNKNOWN_REGIME", isTransitioning: false };
    }

    const shortMA = calculateEMA(numbers, shortMALookback);
    const mediumMA = calculateEMA(numbers, mediumMALookback);
    const longMA = calculateEMA(numbers, longMALookback);

    if (shortMA === null || mediumMA === null || longMA === null) return { strength: "UNKNOWN", direction: "NONE", volatility: "UNKNOWN", details: "MA calculation failed", macroRegime: "UNKNOWN_REGIME", isTransitioning: false };

    let direction = "NONE";
    let strength = "WEAK";
    let details = `S:${shortMA.toFixed(1)},M:${mediumMA.toFixed(1)},L:${longMA.toFixed(1)}`;

    const stdDevLong = calculateStdDev(numbers, longMALookback);
    const epsilon = 0.001;
    const normalizedSpread = (stdDevLong !== null && stdDevLong > epsilon) ? (shortMA - longMA) / stdDevLong : (shortMA - longMA) / epsilon;

    details += `,NormSpread:${normalizedSpread.toFixed(2)}`;

    if (shortMA > mediumMA && mediumMA > longMA) {
        direction = "BIG";
        if (normalizedSpread > 0.80) strength = "STRONG";
        else if (normalizedSpread > 0.45) strength = "MODERATE";
        else strength = "WEAK";
    } else if (shortMA < mediumMA && mediumMA < longMA) {
        direction = "SMALL";
        if (normalizedSpread < -0.80) strength = "STRONG";
        else if (normalizedSpread < -0.45) strength = "MODERATE";
        else strength = "WEAK";
    } else {
        strength = "RANGING";
        if (shortMA > longMA) direction = "BIG_BIASED_RANGE";
        else if (longMA > shortMA) direction = "SMALL_BIASED_RANGE";
    }

    let volatility = "UNKNOWN";
    const volSlice = numbers.slice(0, Math.min(numbers.length, 30));
    if (volSlice.length >= 15) {
        const stdDevVol = calculateStdDev(volSlice, volSlice.length);
        if (stdDevVol !== null) {
            details += ` VolStdDev:${stdDevVol.toFixed(2)}`;
            if (stdDevVol > 3.3) volatility = "HIGH";
            else if (stdDevVol > 2.0) volatility = "MEDIUM";
            else if (stdDevVol > 0.9) volatility = "LOW";
            else volatility = "VERY_LOW";
        }
    }
    return { strength, direction, volatility, details, macroRegime: "PENDING_REGIME_CLASSIFICATION", isTransitioning: false };
}


// --- Core Analytical Modules ---
function analyzeTransitions(history, baseWeight) {
    if (!Array.isArray(history) || history.length < 15) return null;
    const transitions = { "BIG": { "BIG": 0, "SMALL": 0, "total": 0 }, "SMALL": { "BIG": 0, "SMALL": 0, "total": 0 } };
    for (let i = 0; i < history.length - 1; i++) {
        const currentBS = getBigSmallFromNumber(history[i]?.actual);
        const prevBS = getBigSmallFromNumber(history[i + 1]?.actual);
        if (currentBS && prevBS && transitions[prevBS]) {
            transitions[prevBS][currentBS]++;
            transitions[prevBS].total++;
        }
    }
    const lastOutcome = getBigSmallFromNumber(history[0]?.actual);
    if (!lastOutcome || !transitions[lastOutcome] || transitions[lastOutcome].total < 6) return null;
    const nextBigProb = transitions[lastOutcome]["BIG"] / transitions[lastOutcome].total;
    const nextSmallProb = transitions[lastOutcome]["SMALL"] / transitions[lastOutcome].total;
    if (nextBigProb > nextSmallProb + 0.30) return { prediction: "BIG", weight: baseWeight * nextBigProb, source: "Transition" };
    if (nextSmallProb > nextBigProb + 0.30) return { prediction: "SMALL", weight: baseWeight * nextSmallProb, source: "Transition" };
    return null;
}
function analyzeStreaks(history, baseWeight) {
    if (!Array.isArray(history) || history.length < 3) return null;
    const actuals = history.map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (actuals.length < 3) return null;
    let currentStreakType = actuals[0], currentStreakLength = 0;
    for (const outcome of actuals) {
        if (outcome === currentStreakType) currentStreakLength++; else break;
    }
    if (currentStreakLength >= 2) {
        const prediction = getOppositeOutcome(currentStreakType);
        const weightFactor = Math.min(0.45 + (currentStreakLength * 0.18), 0.95);
        return { prediction, weight: baseWeight * weightFactor, source: `StreakBreak-${currentStreakLength}` };
    }
    return null;
}
function analyzeAlternatingPatterns(history, baseWeight) {
    if (!Array.isArray(history) || history.length < 5) return null;
    const actuals = history.slice(0, 5).map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (actuals.length < 4) return null;
    if (actuals[0] === "SMALL" && actuals[1] === "BIG" && actuals[2] === "SMALL" && actuals[3] === "BIG")
        return { prediction: "SMALL", weight: baseWeight * 1.15, source: "Alt-BSBS->S" };
    if (actuals[0] === "BIG" && actuals[1] === "SMALL" && actuals[2] === "BIG" && actuals[3] === "SMALL")
        return { prediction: "BIG", weight: baseWeight * 1.15, source: "Alt-SBSB->B" };
    return null;
}
function analyzeWeightedHistorical(history, weightDecayFactor, baseWeight) {
    if (!Array.isArray(history) || history.length < 5) return null;
    let bigWeightedScore = 0, smallWeightedScore = 0, currentWeight = 1.0;
    const maxHistory = Math.min(history.length, 20);
    for (let i = 0; i < maxHistory; i++) {
        const outcome = getBigSmallFromNumber(history[i].actual);
        if (outcome === "BIG") bigWeightedScore += currentWeight;
        else if (outcome === "SMALL") smallWeightedScore += currentWeight;
        currentWeight *= weightDecayFactor;
    }
    if (bigWeightedScore === 0 && smallWeightedScore === 0) return null;
    const totalScore = bigWeightedScore + smallWeightedScore + 0.0001;
    if (bigWeightedScore > smallWeightedScore) return { prediction: "BIG", weight: baseWeight * (bigWeightedScore / totalScore), source: "WeightedHist" };
    if (smallWeightedScore > bigWeightedScore) return { prediction: "SMALL", weight: baseWeight * (smallWeightedScore / totalScore), source: "WeightedHist" };
    return null;
}

function analyzeTwoPlusOnePatterns(history, baseWeight) {
    if (!history || history.length < 3) return null;
    const outcomes = history.slice(0, 3).map(p => getBigSmallFromNumber(p.actual));
    if (outcomes.some(o => o === null)) return null;

    const pattern = outcomes.join('');
    // Looks for S-B-B -> predicts B continuation
    if (pattern === 'BBS') return { prediction: 'BIG', weight: baseWeight * 0.85, source: 'Pattern-BBS->B' };
    // Looks for B-S-S -> predicts S continuation
    if (pattern === 'SSB') return { prediction: 'SMALL', weight: baseWeight * 0.85, source: 'Pattern-SSB->S' };

    return null;
}

function analyzeDoublePatterns(history, baseWeight) {
    if (!history || history.length < 4) return null;
    const outcomes = history.slice(0, 4).map(p => getBigSmallFromNumber(p.actual));
    if (outcomes.some(o => o === null)) return null;

    // SS-BB pattern -> predict B
    if (outcomes[0] === 'BIG' && outcomes[1] === 'BIG' && outcomes[2] === 'SMALL' && outcomes[3] === 'SMALL') {
        return { prediction: 'BIG', weight: baseWeight * 1.1, source: 'Pattern-SSBB->B' };
    }
    // BB-SS pattern -> predict S
    if (outcomes[0] === 'SMALL' && outcomes[1] === 'SMALL' && outcomes[2] === 'BIG' && outcomes[3] === 'BIG') {
        return { prediction: 'SMALL', weight: baseWeight * 1.1, source: 'Pattern-BBSS->S' };
    }
    return null;
}

function analyzeMirrorPatterns(history, baseWeight) {
    if (!history || history.length < 4) return null;
    const outcomes = history.slice(0, 4).map(p => getBigSmallFromNumber(p.actual));
    if (outcomes.some(o => o === null)) return null;

    // ABBA pattern -> predict A
    if (outcomes[0] === outcomes[3] && outcomes[1] === outcomes[2] && outcomes[0] !== outcomes[1]) {
        return { prediction: outcomes[0], weight: baseWeight * 1.2, source: `Pattern-Mirror->${outcomes[0]}` };
    }
    return null;
}

function analyzeRSI(history, rsiPeriod, baseWeight, volatility) {
    if (rsiPeriod <= 0) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (actualNumbers.length < rsiPeriod + 1) return null;

    const rsiValue = calculateRSI(actualNumbers, rsiPeriod);
    if (rsiValue === null) return null;

    let overbought = 70; let oversold = 30;
    if (volatility === "HIGH") { overbought = 80; oversold = 20; }
    else if (volatility === "MEDIUM") { overbought = 75; oversold = 25; }
    else if (volatility === "LOW") { overbought = 68; oversold = 32; }
    else if (volatility === "VERY_LOW") { overbought = 65; oversold = 35; }


    let prediction = null, signalStrengthFactor = 0;
    if (rsiValue < oversold) { prediction = "BIG"; signalStrengthFactor = (oversold - rsiValue) / oversold; }
    else if (rsiValue > overbought) { prediction = "SMALL"; signalStrengthFactor = (rsiValue - overbought) / (100 - overbought); }

    if (prediction)
        return { prediction, weight: baseWeight * (0.60 + Math.min(signalStrengthFactor, 1.0) * 0.40), source: "RSI" };
    return null;
}
function analyzeMACD(history, shortPeriod, longPeriod, signalPeriod, baseWeight) {
    if (shortPeriod <=0 || longPeriod <=0 || signalPeriod <=0 || shortPeriod >= longPeriod) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (actualNumbers.length < longPeriod + signalPeriod -1) return null;

    const emaShort = calculateEMA(actualNumbers, shortPeriod);
    const emaLong = calculateEMA(actualNumbers, longPeriod);

    if (emaShort === null || emaLong === null) return null;
    const macdLineCurrent = emaShort - emaLong;

    const macdLineValues = [];
    for (let i = longPeriod -1; i < actualNumbers.length; i++) {
        const currentSlice = actualNumbers.slice(actualNumbers.length - 1 - i);
        const shortE = calculateEMA(currentSlice, shortPeriod);
        const longE = calculateEMA(currentSlice, longPeriod);
        if (shortE !== null && longE !== null) {
            macdLineValues.push(shortE - longE);
        }
    }

    if (macdLineValues.length < signalPeriod) return null;

    const signalLine = calculateEMA(macdLineValues.slice().reverse(), signalPeriod);
    if (signalLine === null) return null;

    const macdHistogram = macdLineCurrent - signalLine;
    let prediction = null;

    if (macdLineValues.length >= signalPeriod + 1) {
        const prevMacdSliceForSignal = macdLineValues.slice(0, -1);
        const prevSignalLine = calculateEMA(prevMacdSliceForSignal.slice().reverse(), signalPeriod);
        const prevMacdLine = macdLineValues[macdLineValues.length - 2];

        if (prevSignalLine !== null && prevMacdLine !== null) {
            if (prevMacdLine <= prevSignalLine && macdLineCurrent > signalLine) prediction = "BIG";
            else if (prevMacdLine >= prevSignalLine && macdLineCurrent < signalLine) prediction = "SMALL";
        }
    }

    if (!prediction) {
        if (macdHistogram > 0.25) prediction = "BIG";
        else if (macdHistogram < -0.25) prediction = "SMALL";
    }

    if (prediction) {
        const strengthFactor = Math.min(Math.abs(macdHistogram) / 0.6, 1.0);
        return { prediction, weight: baseWeight * (0.55 + strengthFactor * 0.45), source: `MACD_${prediction === "BIG" ? "CrossB" : "CrossS"}` };
    }
    return null;
}
function analyzeBollingerBands(history, period, stdDevMultiplier, baseWeight) {
    if (period <= 0) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (actualNumbers.length < period) return null;

    const sma = calculateSMA(actualNumbers.slice(0, period), period);
    if (sma === null) return null;

    const stdDev = calculateStdDev(actualNumbers, period);
    if (stdDev === null || stdDev < 0.05) return null;

    const upperBand = sma + (stdDev * stdDevMultiplier);
    const lowerBand = sma - (stdDev * stdDevMultiplier);
    const lastNumber = actualNumbers[0];
    let prediction = null;

    if (lastNumber > upperBand * 1.01) prediction = "SMALL";
    else if (lastNumber < lowerBand * 0.99) prediction = "BIG";

    if (prediction) {
        const bandBreachStrength = Math.abs(lastNumber - sma) / (stdDev * stdDevMultiplier + 0.001);
        return { prediction, weight: baseWeight * (0.65 + Math.min(bandBreachStrength, 0.9)*0.35), source: "Bollinger" };
    }
    return null;
}
function analyzeIchimokuCloud(history, tenkanPeriod, kijunPeriod, senkouBPeriod, baseWeight) {
    if (tenkanPeriod <=0 || kijunPeriod <=0 || senkouBPeriod <=0) return null;
    const chronologicalHistory = history.slice().reverse();
    const numbers = chronologicalHistory.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));

    if (numbers.length < Math.max(senkouBPeriod, kijunPeriod) + kijunPeriod -1 ) return null;

    const getHighLow = (dataSlice) => {
        if (!dataSlice || dataSlice.length === 0) return { high: null, low: null };
        return { high: Math.max(...dataSlice), low: Math.min(...dataSlice) };
    };

    const tenkanSenValues = [];
    for (let i = 0; i < numbers.length; i++) {
        if (i < tenkanPeriod - 1) { tenkanSenValues.push(null); continue; }
        const { high, low } = getHighLow(numbers.slice(i - tenkanPeriod + 1, i + 1));
        if (high !== null && low !== null) tenkanSenValues.push((high + low) / 2); else tenkanSenValues.push(null);
    }

    const kijunSenValues = [];
    for (let i = 0; i < numbers.length; i++) {
        if (i < kijunPeriod - 1) { kijunSenValues.push(null); continue; }
        const { high, low } = getHighLow(numbers.slice(i - kijunPeriod + 1, i + 1));
        if (high !== null && low !== null) kijunSenValues.push((high + low) / 2); else kijunSenValues.push(null);
    }

    const currentTenkan = tenkanSenValues[numbers.length - 1];
    const prevTenkan = tenkanSenValues[numbers.length - 2];
    const currentKijun = kijunSenValues[numbers.length - 1];
    const prevKijun = kijunSenValues[numbers.length - 2];

    const senkouSpanAValues = [];
    for(let i=0; i < numbers.length; i++) {
        if (tenkanSenValues[i] !== null && kijunSenValues[i] !== null) {
            senkouSpanAValues.push((tenkanSenValues[i] + kijunSenValues[i]) / 2);
        } else {
            senkouSpanAValues.push(null);
        }
    }

    const senkouSpanBValues = [];
    for (let i = 0; i < numbers.length; i++) {
        if (i < senkouBPeriod -1) { senkouSpanBValues.push(null); continue; }
        const { high, low } = getHighLow(numbers.slice(i - senkouBPeriod + 1, i + 1));
        if (high !== null && low !== null) senkouSpanBValues.push((high + low) / 2); else senkouSpanBValues.push(null);
    }

    const currentSenkouA = (numbers.length > kijunPeriod && senkouSpanAValues.length > numbers.length - 1 - kijunPeriod) ? senkouSpanAValues[numbers.length - 1 - kijunPeriod] : null;
    const currentSenkouB = (numbers.length > kijunPeriod && senkouSpanBValues.length > numbers.length - 1 - kijunPeriod) ? senkouSpanBValues[numbers.length - 1 - kijunPeriod] : null;


    const chikouSpan = numbers[numbers.length - 1];
    const priceKijunPeriodsAgo = numbers.length > kijunPeriod ? numbers[numbers.length - 1 - kijunPeriod] : null;

    const lastPrice = numbers[numbers.length - 1];
    if (lastPrice === null || currentTenkan === null || currentKijun === null || currentSenkouA === null || currentSenkouB === null || chikouSpan === null || priceKijunPeriodsAgo === null) {
        return null;
    }

    let prediction = null;
    let strengthFactor = 0.3;

    let tkCrossSignal = null;
    if (prevTenkan !== null && prevKijun !== null) {
        if (prevTenkan <= prevKijun && currentTenkan > currentKijun) tkCrossSignal = "BIG";
        else if (prevTenkan >= prevKijun && currentTenkan < currentKijun) tkCrossSignal = "SMALL";
    }

    const cloudTop = Math.max(currentSenkouA, currentSenkouB);
    const cloudBottom = Math.min(currentSenkouA, currentSenkouB);
    let priceVsCloudSignal = null;
    if (lastPrice > cloudTop) priceVsCloudSignal = "BIG";
    else if (lastPrice < cloudBottom) priceVsCloudSignal = "SMALL";

    let chikouSignal = null;
    if (chikouSpan > priceKijunPeriodsAgo) chikouSignal = "BIG";
    else if (chikouSpan < priceKijunPeriodsAgo) chikouSignal = "SMALL";

    if (tkCrossSignal && tkCrossSignal === priceVsCloudSignal && tkCrossSignal === chikouSignal) {
        prediction = tkCrossSignal; strengthFactor = 0.95;
    }
    else if (priceVsCloudSignal && priceVsCloudSignal === tkCrossSignal && chikouSignal === priceVsCloudSignal) {
        prediction = priceVsCloudSignal; strengthFactor = 0.85;
    }
    else if (priceVsCloudSignal && priceVsCloudSignal === tkCrossSignal) {
        prediction = priceVsCloudSignal; strengthFactor = 0.7;
    }
    else if (priceVsCloudSignal && priceVsCloudSignal === chikouSignal) {
        prediction = priceVsCloudSignal; strengthFactor = 0.65;
    }
    else if (tkCrossSignal && priceVsCloudSignal) {
        prediction = tkCrossSignal; strengthFactor = 0.55;
    }
    else if (priceVsCloudSignal) {
         prediction = priceVsCloudSignal; strengthFactor = 0.5;
    }

    if (prediction === "BIG" && lastPrice > currentKijun && prevKijun !== null && numbers[numbers.length-2] <= prevKijun && priceVsCloudSignal === "BIG") {
        strengthFactor = Math.min(1.0, strengthFactor + 0.15);
    } else if (prediction === "SMALL" && lastPrice < currentKijun && prevKijun !== null && numbers[numbers.length-2] >= prevKijun && priceVsCloudSignal === "SMALL") {
        strengthFactor = Math.min(1.0, strengthFactor + 0.15);
    }

    if (prediction) return { prediction, weight: baseWeight * strengthFactor, source: "Ichimoku" };
    return null;
}
function calculateEntropyForSignal(outcomes, windowSize) {
    if (!Array.isArray(outcomes) || outcomes.length < windowSize) return null;
    const counts = { BIG: 0, SMALL: 0 };
    outcomes.slice(0, windowSize).forEach(o => { if (o) counts[o] = (counts[o] || 0) + 1; });
    let entropy = 0;
    const totalValidOutcomes = counts.BIG + counts.SMALL;
    if (totalValidOutcomes === 0) return 1;
    for (let key in counts) {
        if (counts[key] > 0) { const p = counts[key] / totalValidOutcomes; entropy -= p * Math.log2(p); }
    }
    return isNaN(entropy) ? 1 : entropy;
}
function analyzeEntropySignal(history, period, baseWeight) {
    if (history.length < period) return null;
    const outcomes = history.slice(0, period).map(e => getBigSmallFromNumber(e.actual));
    const entropy = calculateEntropyForSignal(outcomes, period);
    if (entropy === null) return null;

    if (entropy < 0.55) {
        const lastOutcome = outcomes[0];
        if (lastOutcome) return { prediction: getOppositeOutcome(lastOutcome), weight: baseWeight * (1 - entropy) * 0.85, source: "EntropyReversal" };
    } else if (entropy > 0.98) {
        const lastOutcome = outcomes[0];
        if (lastOutcome) return { prediction: lastOutcome, weight: baseWeight * 0.25, source: "EntropyHighContWeak" };
    }
    return null;
}
function analyzeVolatilityBreakout(history, trendContext, baseWeight) {
    if (trendContext.volatility === "VERY_LOW" && history.length >= 3) {
        const lastOutcome = getBigSmallFromNumber(history[0].actual);
        const prevOutcome = getBigSmallFromNumber(history[1].actual);
        if (lastOutcome && prevOutcome && lastOutcome === prevOutcome) return { prediction: lastOutcome, weight: baseWeight * 0.8, source: "VolSqueezeBreakoutCont" };
        if (lastOutcome && prevOutcome && lastOutcome !== prevOutcome) return { prediction: lastOutcome, weight: baseWeight * 0.6, source: "VolSqueezeBreakoutInitial" };
    }
    return null;
}
function analyzeStochastic(history, kPeriod, dPeriod, smoothK, baseWeight, volatility) {
    if (kPeriod <=0 || dPeriod <=0 || smoothK <=0) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (actualNumbers.length < kPeriod + smoothK -1 + dPeriod -1) return null;

    const chronologicalNumbers = actualNumbers.slice().reverse();

    let kValues = [];
    for (let i = kPeriod - 1; i < chronologicalNumbers.length; i++) {
        const currentSlice = chronologicalNumbers.slice(i - kPeriod + 1, i + 1);
        const currentClose = currentSlice[currentSlice.length - 1];
        const lowestLow = Math.min(...currentSlice);
        const highestHigh = Math.max(...currentSlice);
        if (highestHigh === lowestLow) kValues.push(kValues.length > 0 ? kValues[kValues.length-1] : 50);
        else kValues.push(100 * (currentClose - lowestLow) / (highestHigh - lowestLow));
    }

    if (kValues.length < smoothK) return null;
    const smoothedKValues = [];
    for(let i = 0; i <= kValues.length - smoothK; i++) {
        smoothedKValues.push(calculateSMA(kValues.slice(i, i + smoothK).slice().reverse(), smoothK));
    }

    if (smoothedKValues.length < dPeriod) return null;
    const dValues = [];
    for(let i = 0; i <= smoothedKValues.length - dPeriod; i++) {
        dValues.push(calculateSMA(smoothedKValues.slice(i, i + dPeriod).slice().reverse(), dPeriod));
    }

    if (smoothedKValues.length < 2 || dValues.length < 2) return null;

    const currentK = smoothedKValues[smoothedKValues.length - 1];
    const prevK = smoothedKValues[smoothedKValues.length - 2];
    const currentD = dValues[dValues.length - 1];
    const prevD = dValues[dValues.length - 1];

    let overbought = 80; let oversold = 20;
    if (volatility === "HIGH") { overbought = 88; oversold = 12; }
    else if (volatility === "MEDIUM") { overbought = 82; oversold = 18;}
    else if (volatility === "LOW") { overbought = 75; oversold = 25; }
    else if (volatility === "VERY_LOW") { overbought = 70; oversold = 30; }


    let prediction = null, strengthFactor = 0;
    if (prevK <= prevD && currentK > currentD && currentK < overbought - 5) {
         prediction = "BIG"; strengthFactor = Math.max(0.35, (oversold + 5 - Math.min(currentK, currentD, oversold + 5)) / (oversold + 5));
    } else if (prevK >= prevD && currentK < currentD && currentK > oversold + 5) {
        prediction = "SMALL"; strengthFactor = Math.max(0.35, (Math.max(currentK, currentD, overbought - 5) - (overbought - 5)) / (100 - (overbought - 5)));
    }
    if (!prediction) {
        if (prevK < oversold && currentK >= oversold && currentK < (oversold + (overbought-oversold)/2) ) {
            prediction = "BIG"; strengthFactor = Math.max(0.25, (currentK - oversold) / ((overbought-oversold)/2) );
        } else if (prevK > overbought && currentK <= overbought && currentK > (oversold + (overbought-oversold)/2) ) {
            prediction = "SMALL"; strengthFactor = Math.max(0.25, (overbought - currentK) / ((overbought-oversold)/2) );
        }
    }
    if (prediction) return { prediction, weight: baseWeight * (0.5 + Math.min(strengthFactor, 1.0) * 0.5), source: "Stochastic" };
    return null;
}
function analyzeMADeviation(history, longMAPeriod, normalizationPeriod, baseWeight) {
    if (longMAPeriod <=0 || normalizationPeriod <=0) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (actualNumbers.length < Math.max(longMAPeriod, normalizationPeriod)) return null;
    const lastNumber = actualNumbers[0];
    const longMA = calculateEMA(actualNumbers, longMAPeriod);
    const stdDevNorm = calculateStdDev(actualNumbers, normalizationPeriod);
    if (longMA === null || stdDevNorm === null || stdDevNorm < 0.01) return null;

    const deviationScore = (lastNumber - longMA) / stdDevNorm;
    let prediction = null, strengthFactor = 0;
    const threshold = 1.8;
    if (deviationScore > threshold) { prediction = "SMALL"; strengthFactor = Math.min((deviationScore - threshold) / threshold, 1.0); }
    else if (deviationScore < -threshold) { prediction = "BIG"; strengthFactor = Math.min(Math.abs(deviationScore - (-threshold)) / threshold, 1.0); }
    if (prediction) return { prediction, weight: baseWeight * (0.4 + strengthFactor * 0.6), source: "MADev" };
    return null;
}
function analyzeVWAPDeviation(history, vwapPeriod, normalizationPeriod, baseWeight) {
    if (vwapPeriod <=0 || normalizationPeriod <=0) return null;
    const actualNumbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(num => !isNaN(num));
    if (history.length < Math.max(vwapPeriod, normalizationPeriod) || actualNumbers.length < 1) return null;

    const vwap = calculateVWAP(history, vwapPeriod);
    const stdDevPrice = calculateStdDev(actualNumbers, normalizationPeriod);
    if (vwap === null || stdDevPrice === null || stdDevPrice < 0.01) return null;

    const lastNumber = actualNumbers[0];
    const deviationScore = (lastNumber - vwap) / stdDevPrice;
    let prediction = null, strengthFactor = 0;
    const threshold = 1.5;
    if (deviationScore > threshold) { prediction = "SMALL"; strengthFactor = Math.min((deviationScore - threshold) / threshold, 1.0); }
    else if (deviationScore < -threshold) { prediction = "BIG"; strengthFactor = Math.min(Math.abs(deviationScore - (-threshold)) / threshold, 1.0); }
    if (prediction) return { prediction, weight: baseWeight * (0.45 + strengthFactor * 0.55), source: "VWAPDev" };
    return null;
}
function analyzeHarmonicPotential(history, baseWeight) {
    const numbers = history.map(entry => parseFloat(entry.actualNumber)).filter(n => !isNaN(n));
    if (numbers.length < 20) return null;

    let swings = [];
    const chronologicalNumbers = numbers.slice().reverse();

    for (let i = 2; i < chronologicalNumbers.length - 2; i++) {
        const isPeak = chronologicalNumbers[i] > chronologicalNumbers[i-1] && chronologicalNumbers[i] > chronologicalNumbers[i-2] &&
                       chronologicalNumbers[i] > chronologicalNumbers[i+1] && chronologicalNumbers[i] > chronologicalNumbers[i+2];
        const isTrough = chronologicalNumbers[i] < chronologicalNumbers[i-1] && chronologicalNumbers[i] < chronologicalNumbers[i-2] &&
                         chronologicalNumbers[i] < chronologicalNumbers[i+1] && chronologicalNumbers[i] < chronologicalNumbers[i+2];

        if (isPeak || isTrough) {
            const newSwing = { price: chronologicalNumbers[i], index: numbers.length - 1 - i, type: isPeak ? 'peak' : 'trough' };
            if (swings.length === 0 || (isPeak && swings[0].type === 'trough') || (isTrough && swings[0].type === 'peak')) {
                 swings.unshift(newSwing);
            } else {
                if (isPeak && swings[0].type === 'peak' && newSwing.price > swings[0].price) swings[0] = newSwing;
                if (isTrough && swings[0].type === 'trough' && newSwing.price < swings[0].price) swings[0] = newSwing;
            }
        }
    }
    if (swings.length < 3) return null;

    const C = swings[0];
    const B = swings[1];
    const X = swings[2];

    if (!X || !B || !C || X.type === B.type || B.type === C.type ) return null;

    const XA_val = Math.abs(B.price - X.price);
    const AB_val = XA_val;
    const BC_val = Math.abs(C.price - B.price);

    if (AB_val < 0.8 || BC_val < 0.5) return null;

    const lastPrice = numbers[0];
    let prediction = null;
    let strengthFactor = 0;
    const bcRetracementOfAb = BC_val / AB_val;

    if (X.type === 'peak' && B.type === 'trough' && C.type === 'peak') {
        if (bcRetracementOfAb >= 0.382 && bcRetracementOfAb <= 0.886) {
            const prz_D_gartley = X.price - AB_val * 0.786;
            if (lastPrice >= prz_D_gartley * 0.98 && lastPrice <= prz_D_gartley * 1.02 && lastPrice < B.price) {
                prediction = "BIG"; strengthFactor = 0.6;
            }
        }
    }
    else if (X.type === 'trough' && B.type === 'peak' && C.type === 'trough') {
        if (bcRetracementOfAb >= 0.382 && bcRetracementOfAb <= 0.886) {
            const prz_D_gartley = X.price + AB_val * 0.786;
             if (lastPrice <= prz_D_gartley * 1.02 && lastPrice >= prz_D_gartley * 0.98 && lastPrice > B.price) {
                prediction = "SMALL"; strengthFactor = 0.6;
            }
        }
    }

    if (prediction) {
        return { prediction, weight: baseWeight * Math.max(0.25, Math.min(strengthFactor, 0.85)), source: "HarmonicPotV3" };
    }
    return null;
}
function analyzeNGramPatterns(history, n, baseWeight) {
    if (!Array.isArray(history) || history.length < n + 10) return null;
    const outcomes = history.map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (outcomes.length < n + 5) return null;
    const recentNGram = outcomes.slice(0, n).join('-');
    const patternCounts = {};
    for (let i = 0; i <= outcomes.length - (n + 1); i++) {
        const pattern = outcomes.slice(i + 1, i + 1 + n).join('-');
        const nextOutcome = outcomes[i];
        if (!patternCounts[pattern]) patternCounts[pattern] = { BIG: 0, SMALL: 0, total: 0 };
        patternCounts[pattern][nextOutcome]++;
        patternCounts[pattern].total++;
    }

    if (patternCounts[recentNGram] && patternCounts[recentNGram].total >= 4) {
        const data = patternCounts[recentNGram];
        const probBig = data.BIG / data.total;
        const probSmall = data.SMALL / data.total;
        if (probBig > probSmall + 0.30 && probBig > 0.65) return { prediction: "BIG", weight: baseWeight * probBig * 1.1, source: `${n}GramB` };
        if (probSmall > probBig + 0.30 && probSmall > 0.65) return { prediction: "SMALL", weight: baseWeight * probSmall * 1.1, source: `${n}GramS` };
    }
    return null;
}
function analyzeCyclicalPatterns(history, period, baseWeight) {
    if (history.length < period || period < 8) return null;
    const outcomes = history.slice(0, period).map(e => getBigSmallFromNumber(e.actual)).filter(o => o);
    if (outcomes.length < period * 0.80) return null;

    for (let cycleLen = 3; cycleLen <= 6; cycleLen++) {
        if (outcomes.length < cycleLen * 2.8) continue;
        const cycle1String = outcomes.slice(0, cycleLen).join('');
        const cycle2String = outcomes.slice(cycleLen, cycleLen * 2).join('');

        if (cycle1String.length === cycleLen && cycle1String === cycle2String) {
            let matchLength = 0;
            for (let k = 0; k < cycleLen && (cycleLen * 2 + k) < outcomes.length; k++) {
                if (outcomes[cycleLen * 2 + k] === outcomes[k]) matchLength++;
                else break;
            }
            if (matchLength >= Math.floor(cycleLen * 0.66)) {
                const predictedOutcome = outcomes[cycleLen - 1];
                if (predictedOutcome) return { prediction: predictedOutcome, weight: baseWeight * (0.65 + (1 / cycleLen) + (matchLength / cycleLen * 0.2)), source: `Cycle${cycleLen}StrongCont` };
            }
        }
    }
    return null;
}
function analyzeVolatilityPersistence(history, period = 10, baseWeight) {
    const numbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));
    if (numbers.length < period * 2) return null;

    const recentVolSlice = numbers.slice(0, period);
    const prevVolSlice = numbers.slice(period, period * 2);

    const currentStdDev = calculateStdDev(recentVolSlice, period);
    const prevStdDev = calculateStdDev(prevVolSlice, period);

    if (currentStdDev === null || prevStdDev === null) return null;

    let prediction = null;
    let strengthFactor = 0;

    if (currentStdDev > prevStdDev * 1.3 && currentStdDev > 2.0) {
        if (numbers[0] > numbers[1]) prediction = "BIG";
        else if (numbers[0] < numbers[1]) prediction = "SMALL";
        strengthFactor = 0.3;
    }
    else if (currentStdDev < prevStdDev * 0.7 && currentStdDev < 1.0) {
        if (numbers[0] > numbers[1]) prediction = "SMALL";
        else if (numbers[0] < numbers[1]) prediction = "BIG";
        strengthFactor = 0.35;
    }

    if(prediction) return { prediction, weight: baseWeight * strengthFactor, source: "VolPersist" };
    return null;
}
function analyzeFractalDimension(history, period = 14, baseWeight) {
    const numbers = history.map(entry => parseFloat(entry.actualNumber)).filter(n => !isNaN(n));
    if (numbers.length < period + 1) return null;

    const chronologicalNumbers = numbers.slice().reverse();

    const periodSlice = chronologicalNumbers.slice(-period);
    const { high: highestHighP, low: lowestLowP } = periodSlice.reduce(
        (acc, val) => ({ high: Math.max(acc.high, val), low: Math.min(acc.low, val) }),
        { high: -Infinity, low: Infinity }
    );
    if (highestHighP === -Infinity || lowestLowP === Infinity) return null;
    const N1_val = (highestHighP - lowestLowP) / period;
    if (N1_val === 0) return { value: 1.0, interpretation: "EXTREMELY_TRENDING_OR_FLAT", prediction: null, weight: 0, source: "FractalDim" };

    let sumPriceChanges = 0;
    for (let i = 1; i < periodSlice.length; i++) {
        sumPriceChanges += Math.abs(periodSlice[i] - periodSlice[i-1]);
    }
    const N2_val = sumPriceChanges / period;

    if (N2_val === 0 && N1_val !== 0) return { value: 2.0, interpretation: "CHOPPY_MAX_NOISE", prediction: null, weight: 0, source: "FractalDim" };
    if (N2_val === 0 && N1_val === 0) return { value: 1.0, interpretation: "FLAT_NO_MOVEMENT", prediction: null, weight: 0, source: "FractalDim" };

    const priceChangeOverPeriod = Math.abs(periodSlice[periodSlice.length - 1] - periodSlice[0]);
    const ER = sumPriceChanges > 0 ? priceChangeOverPeriod / sumPriceChanges : 0;
    const FDI_approx = 1 + (1 - ER);

    let interpretation = "UNKNOWN";
    let prediction = null;

    if (FDI_approx < 1.35) interpretation = "TRENDING";
    else if (FDI_approx > 1.65) interpretation = "CHOPPY_RANGING";
    else interpretation = "MODERATE_ACTIVITY";

    if (FDI_approx > 1.75) {
        const lastOutcome = getBigSmallFromNumber(numbers[0]);
        if (lastOutcome) prediction = getOppositeOutcome(lastOutcome);
    }

    return {
        value: FDI_approx,
        interpretation: interpretation,
        prediction: prediction,
        weight: prediction ? baseWeight * 0.2 : 0,
        source: "FractalDim"
    };
}
function analyzeSignalLeadLag(signals, trendContext, baseWeight) {
    let prediction = null;
    let strengthFactor = 0;

    const rsiSignal = signals.find(s => s.source === "RSI");
    const macdSignal = signals.find(s => s.source.startsWith("MACD"));

    if (rsiSignal && macdSignal && rsiSignal.prediction === macdSignal.prediction) {
        if (rsiSignal.prediction === "BIG" && macdSignal.source.includes("CrossB")) {
            if (trendContext.direction === "BIG" || trendContext.strength === "RANGING" || trendContext.direction.includes("BIG")) {
                prediction = "BIG";
                strengthFactor = 0.5;
            }
        } else if (rsiSignal.prediction === "SMALL" && macdSignal.source.includes("CrossS")) {
            if (trendContext.direction === "SMALL" || trendContext.strength === "RANGING" || trendContext.direction.includes("SMALL")) {
                prediction = "SMALL";
                strengthFactor = 0.5;
            }
        }
    }

    if(prediction) return { prediction, weight: baseWeight * strengthFactor, source: "LeadLagConfirm" };
    return null;
}

/**
 * **INTEGRATED QUANTUM AI ENGINE**
 * Treats recent outcomes as a digital waveform and looks for interference patterns.
 * @param {Array} history - History data.
 * @param {number} baseWeight - Base weight for the signal.
 * @returns {Object|null} Prediction signal or null.
 */
function analyzeWaveformPatterns(history, baseWeight) {
    const outcomes = history.map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (outcomes.length < 8) return null;

    const wave = outcomes.slice(0, 8).map(o => o === "BIG" ? 1 : -1);

    if (wave[0] === wave[1] && wave[2] === wave[3] && wave[0] !== wave[2]) {
        return { prediction: wave[0] === 1 ? "BIG" : "SMALL", weight: baseWeight * 1.2, source: "Waveform-Constructive" };
    }
    if (wave[0] !== wave[1] && wave[1] !== wave[2] && wave[2] !== wave[3]) {
        return { prediction: wave[0] === 1 ? "SMALL" : "BIG", weight: baseWeight, source: "Waveform-Destructive" };
    }
    return null;
}

/**
 * **INTEGRATED QUANTUM AI ENGINE**
 * Maps recent outcomes into a simplified "phase space" to identify attractors.
 * @param {Array} history - History data.
 * @param {number} baseWeight - Base weight for the signal.
 * @returns {Object|null} Prediction signal or null.
 */
function analyzePhaseSpace(history, baseWeight) {
    const outcomes = history.map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (outcomes.length < 10) return null;

    const recent = outcomes.slice(0, 10);
    const bigCount = recent.filter(r => r === "BIG").length;
    const smallCount = recent.filter(r => r === "SMALL").length;

    if (bigCount >= 7) {
        return { prediction: "BIG", weight: baseWeight * ((bigCount - 5) / 5), source: "PhaseSpace-BigAttractor" };
    }
    if (smallCount >= 7) {
        return { prediction: "SMALL", weight: baseWeight * ((smallCount - 5) / 5), source: "PhaseSpace-SmallAttractor" };
    }
    return null;
}

/**
 * **INTEGRATED QUANTUM AI ENGINE**
 * Looks for rare but significant jumps across the numerical spectrum (e.g., a 0 followed by a 9).
 * @param {Array} history - History data.
 * @param {number} baseWeight - Base weight for the signal.
 * @returns {Object|null} Prediction signal or null.
 */
function analyzeQuantumTunneling(history, baseWeight) {
    const actuals = history.map(p => p.actual).filter(n => n !== null);
    if (actuals.length < 2) return null;

    const lastNum = actuals[0];
    const prevNum = actuals[1];

    if ((lastNum <= 1 && prevNum >= 8) || (lastNum >= 8 && prevNum <= 1)) {
        return { prediction: lastNum > 4 ? "SMALL" : "BIG", weight: baseWeight, source: "QuantumTunneling" };
    }
    return null;
}

/**
 * **INTEGRATED QUANTUM AI ENGINE**
 * Simulates "entangled pairs" by looking for correlations between outcomes at different period intervals.
 * @param {Array} history - History data.
 * @param {number} lag - The time lag to check for entanglement.
 * @param {number} baseWeight - Base weight for the signal.
 * @returns {Object|null} Prediction signal or null.
 */
function analyzeEntanglement(history, lag, baseWeight) {
    const outcomes = history.map(p => getBigSmallFromNumber(p.actual)).filter(bs => bs);
    if (outcomes.length < lag + 10) return null;

    let match = 0;
    let antiMatch = 0;
    for(let i = 0; i < 10; i++) {
        if(outcomes[i] === outcomes[i + lag]) {
            match++;
        } else {
            antiMatch++;
        }
    }

    if (match >= 8) {
        return { prediction: outcomes[lag-1], weight: baseWeight, source: `Entangled-Corr-Lag${lag}` };
    }
    if (antiMatch >= 8) {
        return { prediction: outcomes[lag-1] === "BIG" ? "SMALL" : "BIG", weight: baseWeight, source: `Entangled-AntiCorr-Lag${lag}` };
    }

    return null;
}

/**
 * **INTEGRATED ADVANCED ALGORITHM**
 * Runs a limited Monte Carlo simulation to forecast the next outcome based on a set of signals.
 * @param {Array} signals - Array of prediction signals.
 * @param {number} baseWeight - Base weight for the signal.
 * @returns {Object|null} Prediction signal or null.
 */
function analyzeMonteCarloSignal(signals, baseWeight) {
    if (signals.length < 5) return null;

    const bigProb = signals.filter(s => s.prediction === "BIG").reduce((acc, s) => acc + s.weight, 0);
    const smallProb = signals.filter(s => s.prediction === "SMALL").reduce((acc, s) => acc + s.weight, 0);
    const totalWeight = bigProb + smallProb;

    if (totalWeight === 0) return null;

    const normalizedBigProb = bigProb / totalWeight;

    let bigWins = 0;
    const simulations = 1000;
    for(let i = 0; i < simulations; i++) {
        if (Math.random() < normalizedBigProb) {
            bigWins++;
        }
    }

    if (bigWins / simulations > 0.7) {
        return { prediction: "BIG", weight: baseWeight * (bigWins / simulations), source: "MonteCarlo" };
    }
    if (bigWins / simulations < 0.3) {
        return { prediction: "SMALL", weight: baseWeight * (1 - (bigWins / simulations)), source: "MonteCarlo" };
    }

    return null;
}

/**
 * **NEW in v40.0.0: Real-Time Volatility-Trend Fusion**
 * Combines context into a powerful meta-signal.
 * @param {object} trendContext - The market trend context.
 * @param {object} marketEntropyState - The market entropy state.
 * @param {number} baseWeight - The base weight for the signal.
 * @returns {Object|null} A signal based on the fusion analysis.
 */
function analyzeVolatilityTrendFusion(trendContext, marketEntropyState, baseWeight) {
    const { direction, strength, volatility } = trendContext;
    const { state: entropy } = marketEntropyState;

    let prediction = null;
    let weightFactor = 0;

    // High-conviction trend continuation
    if (strength === 'STRONG' && (volatility === 'LOW' || volatility === 'MEDIUM') && entropy === 'ORDERLY') {
        prediction = direction.includes('BIG') ? 'BIG' : 'SMALL';
        weightFactor = 1.4;
    }
    // Trend exhaustion / reversal signal
    else if (strength === 'STRONG' && volatility === 'HIGH' && entropy.includes('CHAOS')) {
        prediction = direction.includes('BIG') ? 'SMALL' : 'BIG';
        weightFactor = 1.2;
    }
    // Ranging market mean reversion
    else if (strength === 'RANGING' && volatility === 'LOW' && entropy === 'ORDERLY') {
        // Needs a secondary trigger, like the last outcome, but for now we can infer a reversion
        prediction = Math.random() > 0.5 ? 'BIG' : 'SMALL'; // Less certain
        weightFactor = 0.8;
    }

    if (prediction) {
        return { prediction, weight: baseWeight * weightFactor, source: 'Vol-Trend-Fusion' };
    }
    return null;
}

/**
 * **NEW in v42.0.0: Machine Learning Model Signal**
 * This is a placeholder function to show how a pre-trained ML model's output would be integrated.
 * In a real implementation, this function would make an API call to a model serving endpoint.
 * @param {object} features - A feature object created by `createFeatureSetForML`.
 * @param {number} baseWeight - The base weight for the signal.
 * @returns {Object|null} A prediction signal from the ML model.
 */
function analyzeMLModelSignal(features, baseWeight) {
    // In a real system, you would serialize 'features' and send to a model endpoint.
    // Here, we simulate the model's output.
    const { rsi_14, macd_hist, stddev_30, time_sin, time_cos } = features;

    let modelConfidence = 0;
    let prediction = null;

    // Simulate a simple tree-like logic that an ML model might learn
    if (rsi_14 > 70 && macd_hist < -0.1) {
        prediction = "SMALL";
        modelConfidence = Math.abs(macd_hist) + (rsi_14 - 70) / 30;
    } else if (rsi_14 < 30 && macd_hist > 0.1) {
        prediction = "BIG";
        modelConfidence = Math.abs(macd_hist) + (30 - rsi_14) / 30;
    } else if (stddev_30 < 1.0 && time_sin > 0) { // Example of using other features
        prediction = "BIG"; // e.g., low vol morning session
        modelConfidence = 0.4;
    }

    if (prediction) {
        // The ML model's confidence should be scaled appropriately.
        const weight = baseWeight * Math.min(1.0, modelConfidence) * 1.5; // Give ML model high importance
        return { prediction, weight: weight, source: "ML-GradientBoost" };
    }

    return null;
}


// --- Trend Stability & Market Entropy ---
function analyzeTrendStability(history) {
    if (!Array.isArray(history) || history.length < 25) {
        return { isStable: true, reason: "Not enough data for stability check.", details: "", dominance: "NONE" };
    }
    const confirmedHistory = history.filter(p => p && (p.status === "Win" || p.status === "Loss") && typeof p.actual !== 'undefined' && p.actual !== null);
    if (confirmedHistory.length < 20) return { isStable: true, reason: "Not enough confirmed results.", details: `Confirmed: ${confirmedHistory.length}`, dominance: "NONE" };

    const recentResults = confirmedHistory.slice(0, 20).map(p => getBigSmallFromNumber(p.actual)).filter(r => r);
    if (recentResults.length < 18) return { isStable: true, reason: "Not enough valid B/S for stability.", details: `Valid B/S: ${recentResults.length}`, dominance: "NONE" };

    const bigCount = recentResults.filter(r => r === "BIG").length;
    const smallCount = recentResults.filter(r => r === "SMALL").length;
    let outcomeDominance = "NONE";

    if (bigCount / recentResults.length >= 0.80) {
        outcomeDominance = "BIG_DOMINANCE";
        return { isStable: false, reason: "Unstable: Extreme Outcome Dominance", details: `BIG:${bigCount}, SMALL:${smallCount} in last ${recentResults.length}`, dominance: outcomeDominance };
    }
    if (smallCount / recentResults.length >= 0.80) {
        outcomeDominance = "SMALL_DOMINANCE";
        return { isStable: false, reason: "Unstable: Extreme Outcome Dominance", details: `BIG:${bigCount}, SMALL:${smallCount} in last ${recentResults.length}`, dominance: outcomeDominance };
    }

    const entropy = calculateEntropyForSignal(recentResults, recentResults.length);
    if (entropy !== null && entropy < 0.45) {
        return { isStable: false, reason: "Unstable: Very Low Entropy (Highly Predictable/Stuck)", details: `Entropy: ${entropy.toFixed(2)}`, dominance: outcomeDominance };
    }

    const actualNumbersRecent = confirmedHistory.slice(0, 15).map(p => parseInt(p.actualNumber || p.actual)).filter(n => !isNaN(n));
    if (actualNumbersRecent.length >= 10) {
        const stdDevNum = calculateStdDev(actualNumbersRecent, actualNumbersRecent.length);
        if (stdDevNum !== null && stdDevNum > 3.3) {
            return { isStable: false, reason: "Unstable: High Numerical Volatility", details: `StdDev: ${stdDevNum.toFixed(2)}`, dominance: outcomeDominance };
        }
    }
    let alternations = 0;
    for (let i = 0; i < recentResults.length - 1; i++) {
        if (recentResults[i] !== recentResults[i + 1]) alternations++;
    }
    if (alternations / recentResults.length > 0.75) {
        return { isStable: false, reason: "Unstable: Excessive Choppiness", details: `Alternations: ${alternations}/${recentResults.length}`, dominance: outcomeDominance };
    }

    return { isStable: true, reason: "Trend appears stable.", details: `Entropy: ${entropy !== null ? entropy.toFixed(2) : 'N/A'}`, dominance: outcomeDominance };
}

function analyzeMarketEntropyState(history, trendContext, stability) {
    const ENTROPY_WINDOW_SHORT = 10;
    const ENTROPY_WINDOW_LONG = 25;
    const VOL_CHANGE_THRESHOLD = 0.3; // 30% change in volatility

    if (history.length < ENTROPY_WINDOW_LONG) return { state: "UNCERTAIN_ENTROPY", details: "Insufficient history for entropy state." };

    const outcomesShort = history.slice(0, ENTROPY_WINDOW_SHORT).map(e => getBigSmallFromNumber(e.actual));
    const outcomesLong = history.slice(0, ENTROPY_WINDOW_LONG).map(e => getBigSmallFromNumber(e.actual));

    const entropyShort = calculateEntropyForSignal(outcomesShort, ENTROPY_WINDOW_SHORT);
    const entropyLong = calculateEntropyForSignal(outcomesLong, ENTROPY_WINDOW_LONG);

    const numbersShort = history.slice(0, ENTROPY_WINDOW_SHORT).map(e => parseInt(e.actualNumber || e.actual)).filter(n => !isNaN(n));
    const numbersLongPrev = history.slice(ENTROPY_WINDOW_SHORT, ENTROPY_WINDOW_SHORT + ENTROPY_WINDOW_SHORT).map(e => parseInt(e.actualNumber || e.actual)).filter(n => !isNaN(n)); // Previous short window

    let shortTermVolatility = null, prevShortTermVolatility = null;
    if(numbersShort.length >= ENTROPY_WINDOW_SHORT * 0.8) shortTermVolatility = calculateStdDev(numbersShort, numbersShort.length);
    if(numbersLongPrev.length >= ENTROPY_WINDOW_SHORT * 0.8) prevShortTermVolatility = calculateStdDev(numbersLongPrev, numbersLongPrev.length);


    let state = "STABLE_MODERATE"; // Default
    let details = `E_S:${entropyShort?.toFixed(2)} E_L:${entropyLong?.toFixed(2)} Vol_S:${shortTermVolatility?.toFixed(2)} Vol_P:${prevShortTermVolatility?.toFixed(2)}`;

    if (entropyShort === null || entropyLong === null) return { state: "UNCERTAIN_ENTROPY", details };

    if (entropyShort < 0.5 && entropyLong < 0.6 && shortTermVolatility !== null && shortTermVolatility < 1.5) { // Added vol check for orderly
        state = "ORDERLY";
    }
    else if (entropyShort > 0.95 && entropyLong > 0.9) {
        if (shortTermVolatility && prevShortTermVolatility && shortTermVolatility > prevShortTermVolatility * (1 + VOL_CHANGE_THRESHOLD) && shortTermVolatility > 2.5) { // Added base vol check
            state = "RISING_CHAOS";
        } else {
            state = "STABLE_CHAOS";
        }
    }
    else if (shortTermVolatility && prevShortTermVolatility) {
        if (shortTermVolatility > prevShortTermVolatility * (1 + VOL_CHANGE_THRESHOLD) && entropyShort > 0.85 && shortTermVolatility > 2.0) { // Stricter
            state = "RISING_CHAOS";
        } else if (shortTermVolatility < prevShortTermVolatility * (1 - VOL_CHANGE_THRESHOLD) && entropyLong > 0.85 && entropyShort < 0.80) { // Stricter
            state = "SUBSIDING_CHAOS";
        }
    }

    if (!stability.isStable && (state === "ORDERLY" || state === "STABLE_MODERATE")) {
        state = "POTENTIAL_CHAOS_FROM_INSTABILITY";
        details += ` | StabilityOverride: ${stability.reason}`;
    }
    return { state, details };
}

/**
 * **NEW in v42.0.0: Advanced Probabilistic Regime Analysis**
 * Simulates the output of a more complex model like a Markov Switching Model.
 * @param {object} trendContext - The current trend context.
 * @param {object} marketEntropyState - The current entropy state.
 * @returns {object} An object with probabilities for different market regimes.
 */
function analyzeAdvancedMarketRegime(trendContext, marketEntropyState) {
    const { strength, volatility } = trendContext;
    const { state: entropy } = marketEntropyState;

    let probabilities = {
        bullTrend: 0.25,
        bearTrend: 0.25,
        volatileRange: 0.25,
        quietRange: 0.25
    };

    // This is a simplified heuristic simulation. A real implementation would use a trained model.
    if (strength === 'STRONG' && volatility !== 'HIGH' && entropy === 'ORDERLY') {
        if (trendContext.direction.includes('BIG')) {
            probabilities = { bullTrend: 0.8, bearTrend: 0.05, volatileRange: 0.1, quietRange: 0.05 };
        } else {
            probabilities = { bullTrend: 0.05, bearTrend: 0.8, volatileRange: 0.1, quietRange: 0.05 };
        }
    } else if (strength === 'RANGING' && volatility === 'HIGH' && entropy.includes('CHAOS')) {
         probabilities = { bullTrend: 0.1, bearTrend: 0.1, volatileRange: 0.7, quietRange: 0.1 };
    } else if (strength === 'RANGING' && volatility === 'VERY_LOW') {
         probabilities = { bullTrend: 0.1, bearTrend: 0.1, volatileRange: 0.1, quietRange: 0.7 };
    }

    return { probabilities, details: `Prob(B:${probabilities.bullTrend.toFixed(2)},S:${probabilities.bearTrend.toFixed(2)})` };
}


// --- Signal & Regime Performance Learning ---
let signalPerformance = {};
const PERFORMANCE_WINDOW = 30; // How many recent predictions per signal to consider for dynamic adjustment
const SESSION_PERFORMANCE_WINDOW = 15; // Shorter window for in-session adaptation
const MIN_OBSERVATIONS_FOR_ADJUST = 10; // Min total predictions for a signal before dynamic adjustment kicks in
const MAX_WEIGHT_FACTOR = 1.95; // Max multiplier for a signal's weight based on good performance
const MIN_WEIGHT_FACTOR = 0.05; // Min multiplier for a signal's weight based on poor performance (Signal Probation can override this lower)
const MAX_ALPHA_FACTOR = 1.6;   // Max for longer-term performance trend factor
const MIN_ALPHA_FACTOR = 0.4;   // Min for longer-term performance trend factor
const MIN_ABSOLUTE_WEIGHT = 0.0003; // Absolute minimum weight a signal can have after all adjustments
const INACTIVITY_PERIOD_FOR_DECAY = PERFORMANCE_WINDOW * 3; // How many periods of inactivity before a signal's adjustment factor starts decaying towards 1.0
const DECAY_RATE = 0.025; // Rate at which adjustment factor decays per period of inactivity
const ALPHA_UPDATE_RATE = 0.04; // How quickly the alphaFactor (long-term trend) adapts to the currentAdjustmentFactor
const PROBATION_THRESHOLD_ACCURACY = 0.40;
const PROBATION_MIN_OBSERVATIONS = 15;
const PROBATION_WEIGHT_CAP = 0.10;
let driftDetector = { p_min: Infinity, s_min: Infinity, n: 0, warning_level: 2.0, drift_level: 3.0 }; // Simple DDM state

function getDynamicWeightAdjustment(signalSourceName, baseWeight, currentPeriodFull, currentVolatilityRegime, sessionHistory) {
    const perf = signalPerformance[signalSourceName];
    if (!perf) {
        signalPerformance[signalSourceName] = {
            correct: 0, total: 0, recentAccuracy: [],
            sessionCorrect: 0, sessionTotal: 0, // NEW in v40
            lastUpdatePeriod: null, lastActivePeriod: null,
            currentAdjustmentFactor: 1.0, alphaFactor: 1.0, longTermImportanceScore: 0.5,
            performanceByVolatility: {}, isOnProbation: false
        };
        return Math.max(baseWeight, MIN_ABSOLUTE_WEIGHT);
    }

    // Reset session stats if a new session starts (heuristic: a long gap)
    if (sessionHistory.length <= 1) {
        perf.sessionCorrect = 0;
        perf.sessionTotal = 0;
    }


    if (perf.lastUpdatePeriod !== currentPeriodFull) {
        if (perf.lastActivePeriod !== null && (currentPeriodFull - perf.lastActivePeriod) > INACTIVITY_PERIOD_FOR_DECAY) {
            if (perf.currentAdjustmentFactor > 1.0) perf.currentAdjustmentFactor = Math.max(1.0, perf.currentAdjustmentFactor - DECAY_RATE);
            else if (perf.currentAdjustmentFactor < 1.0) perf.currentAdjustmentFactor = Math.min(1.0, perf.currentAdjustmentFactor + DECAY_RATE);
            if (perf.isOnProbation) perf.isOnProbation = false; // Probation lifts if inactive for too long
        }
        perf.lastUpdatePeriod = currentPeriodFull;
    }

    let volatilitySpecificAdjustment = 1.0;
    if (perf.performanceByVolatility[currentVolatilityRegime] && perf.performanceByVolatility[currentVolatilityRegime].total >= MIN_OBSERVATIONS_FOR_ADJUST / 2.0) {
        const volPerf = perf.performanceByVolatility[currentVolatilityRegime];
        const volAccuracy = volPerf.correct / volPerf.total;
        const volDeviation = volAccuracy - 0.5;
        volatilitySpecificAdjustment = 1 + (volDeviation * 1.30);
        volatilitySpecificAdjustment = Math.min(Math.max(volatilitySpecificAdjustment, 0.55), 1.45);
    }

    // **NEW in v40.0.0**: Session-aware adjustment
    let sessionAdjustmentFactor = 1.0;
    if (perf.sessionTotal >= 3) {
        const sessionAccuracy = perf.sessionCorrect / perf.sessionTotal;
        const sessionDeviation = sessionAccuracy - 0.5;
        sessionAdjustmentFactor = 1 + (sessionDeviation * 1.5); // Give session performance a strong influence
        sessionAdjustmentFactor = Math.min(Math.max(sessionAdjustmentFactor, 0.6), 1.4);
    }


    let finalAdjustmentFactor = perf.currentAdjustmentFactor * perf.alphaFactor * volatilitySpecificAdjustment * sessionAdjustmentFactor * (0.70 + perf.longTermImportanceScore * 0.6);

    if (perf.isOnProbation) {
        finalAdjustmentFactor = Math.min(finalAdjustmentFactor, PROBATION_WEIGHT_CAP);
    }

    let adjustedWeight = baseWeight * finalAdjustmentFactor;
    return Math.max(adjustedWeight, MIN_ABSOLUTE_WEIGHT);
}

/**
 * **ENHANCED in v42.0.0: Error Magnitude Analysis**
 * Now applies a more severe penalty for high-confidence incorrect predictions.
 */
function updateSignalPerformance(contributingSignals, actualOutcome, periodFull, currentVolatilityRegime, lastFinalConfidence, concentrationModeActive, marketEntropyState) {
    if (!actualOutcome || !contributingSignals || contributingSignals.length === 0) return;
    const isHighConfidencePrediction = lastFinalConfidence > 0.75;
    const isOverallCorrect = getBigSmallFromNumber(actualOutcome) === (lastFinalConfidence > 0.5 ? "BIG" : "SMALL"); // simplified

    contributingSignals.forEach(signal => {
        if (!signal || !signal.source) return;
        const source = signal.source;
        if (!signalPerformance[source]) {
            signalPerformance[source] = {
                correct: 0, total: 0, recentAccuracy: [],
                sessionCorrect: 0, sessionTotal: 0,
                lastUpdatePeriod: null, lastActivePeriod: null,
                currentAdjustmentFactor: 1.0, alphaFactor: 1.0, longTermImportanceScore: 0.5,
                performanceByVolatility: {}, isOnProbation: false
            };
        }

        if (!signalPerformance[source].performanceByVolatility[currentVolatilityRegime]) {
            signalPerformance[source].performanceByVolatility[currentVolatilityRegime] = { correct: 0, total: 0 };
        }

        if (signalPerformance[source].lastActivePeriod !== periodFull || signalPerformance[source].total === 0) {
            signalPerformance[source].total++;
            signalPerformance[source].sessionTotal++;
            signalPerformance[source].performanceByVolatility[currentVolatilityRegime].total++;
            let outcomeCorrect = (signal.prediction === actualOutcome) ? 1 : 0;
            if (outcomeCorrect) {
                signalPerformance[source].correct++;
                signalPerformance[source].sessionCorrect++;
                signalPerformance[source].performanceByVolatility[currentVolatilityRegime].correct++;
            }

            // Enhanced Error Magnitude Adjustment
            let importanceDelta = 0;
            if(outcomeCorrect) {
                importanceDelta = isHighConfidencePrediction ? 0.025 : 0.01;
            } else {
                // Penalize incorrect signals more harshly on high-confidence system misses
                importanceDelta = isHighConfidencePrediction && !isOverallCorrect ? -0.040 : -0.015;
            }

            if (concentrationModeActive || marketEntropyState.includes("CHAOS")) {
                 importanceDelta *= 1.5;
            }
            signalPerformance[source].longTermImportanceScore = Math.min(1.0, Math.max(0.0, signalPerformance[source].longTermImportanceScore + importanceDelta));

            signalPerformance[source].recentAccuracy.push(outcomeCorrect);
            if (signalPerformance[source].recentAccuracy.length > PERFORMANCE_WINDOW) {
                signalPerformance[source].recentAccuracy.shift();
            }

            if (signalPerformance[source].total >= MIN_OBSERVATIONS_FOR_ADJUST && signalPerformance[source].recentAccuracy.length >= PERFORMANCE_WINDOW / 2) {
                const recentCorrectCount = signalPerformance[source].recentAccuracy.reduce((sum, acc) => sum + acc, 0);
                const accuracy = recentCorrectCount / signalPerformance[source].recentAccuracy.length;
                const deviation = accuracy - 0.5;
                let newAdjustmentFactor = 1 + (deviation * 3.5);
                newAdjustmentFactor = Math.min(Math.max(newAdjustmentFactor, MIN_WEIGHT_FACTOR), MAX_WEIGHT_FACTOR);
                signalPerformance[source].currentAdjustmentFactor = newAdjustmentFactor;

                if (signalPerformance[source].recentAccuracy.length >= PROBATION_MIN_OBSERVATIONS && accuracy < PROBATION_THRESHOLD_ACCURACY) {
                    signalPerformance[source].isOnProbation = true;
                } else if (accuracy > PROBATION_THRESHOLD_ACCURACY + 0.15) {
                    signalPerformance[source].isOnProbation = false;
                }


                let alphaLearningRate = ALPHA_UPDATE_RATE;
                if (accuracy < 0.35) alphaLearningRate *= 1.75;
                else if (accuracy < 0.45) alphaLearningRate *= 1.4;

                if (newAdjustmentFactor > signalPerformance[source].alphaFactor) {
                    signalPerformance[source].alphaFactor = Math.min(MAX_ALPHA_FACTOR, signalPerformance[source].alphaFactor + alphaLearningRate * (newAdjustmentFactor - signalPerformance[source].alphaFactor));
                } else {
                    signalPerformance[source].alphaFactor = Math.max(MIN_ALPHA_FACTOR, signalPerformance[source].alphaFactor - alphaLearningRate * (signalPerformance[source].alphaFactor - newAdjustmentFactor));
                }
            }
            signalPerformance[source].lastActivePeriod = periodFull;
        }
        signalPerformance[source].lastUpdatePeriod = periodFull;
    });
}

/**
 * **NEW in v42.0.0: Concept Drift Detection (DDM)**
 * A simple implementation of the Drift Detection Method.
 * @param {boolean} isCorrect - Whether the last prediction was correct.
 * @returns {string} The current drift state: 'STABLE', 'WARNING', or 'DRIFT'.
 */
function detectConceptDrift(isCorrect) {
    driftDetector.n++;
    const errorRate = isCorrect ? 0 : 1;
    const p_i = (driftDetector.n > 1 ? driftDetector.p_i : 0) + (errorRate - (driftDetector.n > 1 ? driftDetector.p_i : 0)) / driftDetector.n;
    driftDetector.p_i = p_i;
    const s_i = Math.sqrt(p_i * (1 - p_i) / driftDetector.n);

    if (p_i + s_i < driftDetector.p_min + driftDetector.s_min) {
        driftDetector.p_min = p_i;
        driftDetector.s_min = s_i;
    }

    if (p_i + s_i > driftDetector.p_min + driftDetector.drift_level * driftDetector.s_min) {
        // Reset detector on drift
        driftDetector.p_min = Infinity;
        driftDetector.s_min = Infinity;
        driftDetector.n = 1;
        return 'DRIFT';
    } else if (p_i + s_i > driftDetector.p_min + driftDetector.warning_level * driftDetector.s_min) {
        return 'WARNING';
    } else {
        return 'STABLE';
    }
}


let REGIME_SIGNAL_PROFILES = {
    "TREND_STRONG_LOW_VOL": { baseWeightMultiplier: 1.30, activeSignalTypes: ['trend', 'momentum', 'ichimoku', 'volBreak', 'leadLag', 'stateSpace', 'fusion', 'ml'], contextualAggression: 1.35, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "TREND_STRONG_MED_VOL": { baseWeightMultiplier: 1.20, activeSignalTypes: ['trend', 'momentum', 'ichimoku', 'pattern', 'leadLag', 'stateSpace', 'fusion', 'ml'], contextualAggression: 1.25, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "TREND_STRONG_HIGH_VOL": { baseWeightMultiplier: 0.70, activeSignalTypes: ['trend', 'ichimoku', 'entropy', 'volPersist', 'zScore', 'fusion'], contextualAggression: 0.70, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "TREND_MOD_LOW_VOL": { baseWeightMultiplier: 1.25, activeSignalTypes: ['trend', 'momentum', 'ichimoku', 'pattern', 'volBreak', 'leadLag', 'stateSpace', 'ml'], contextualAggression: 1.25, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "TREND_MOD_MED_VOL": { baseWeightMultiplier: 1.15, activeSignalTypes: ['trend', 'momentum', 'ichimoku', 'pattern', 'rsi', 'leadLag', 'bayesian', 'fusion', 'ml'], contextualAggression: 1.15, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "TREND_MOD_HIGH_VOL": { baseWeightMultiplier: 0.75, activeSignalTypes: ['trend', 'ichimoku', 'meanRev', 'stochastic', 'volPersist', 'zScore'], contextualAggression: 0.75, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "RANGE_LOW_VOL": { baseWeightMultiplier: 1.30, activeSignalTypes: ['meanRev', 'pattern', 'volBreak', 'stochastic', 'harmonic', 'fractalDim', 'zScore', 'bayesian', 'fusion'], contextualAggression: 1.30, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "RANGE_MED_VOL": { baseWeightMultiplier: 1.15, activeSignalTypes: ['meanRev', 'pattern', 'stochastic', 'rsi', 'bollinger', 'harmonic', 'zScore'], contextualAggression: 1.15, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "RANGE_HIGH_VOL": { baseWeightMultiplier: 0.65, activeSignalTypes: ['meanRev', 'entropy', 'bollinger', 'vwapDev', 'volPersist', 'zScore', 'fusion'], contextualAggression: 0.65, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "WEAK_HIGH_VOL": { baseWeightMultiplier: 0.70, activeSignalTypes: ['meanRev', 'entropy', 'stochastic', 'volPersist', 'fractalDim', 'zScore'], contextualAggression: 0.70, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "WEAK_MED_VOL": { baseWeightMultiplier: 0.75, activeSignalTypes: ['momentum', 'meanRev', 'pattern', 'rsi', 'fractalDim', 'bayesian'], contextualAggression: 0.75, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "WEAK_LOW_VOL": { baseWeightMultiplier: 0.85, activeSignalTypes: ['all'], contextualAggression: 0.85, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 },
    "DEFAULT": { baseWeightMultiplier: 0.9, activeSignalTypes: ['all'], contextualAggression: 0.9, recentAccuracy: [], totalPredictions: 0, correctPredictions: 0 }
};
const REGIME_ACCURACY_WINDOW = 35;
const REGIME_LEARNING_RATE_BASE = 0.028;
let GLOBAL_LONG_TERM_ACCURACY_FOR_LEARNING_RATE = 0.5;

function updateRegimeProfilePerformance(regime, actualOutcome, predictedOutcome) {
    if (REGIME_SIGNAL_PROFILES[regime] && predictedOutcome) { // Added null check for predictedOutcome
        const profile = REGIME_SIGNAL_PROFILES[regime];
        profile.totalPredictions = (profile.totalPredictions || 0) + 1;
        let outcomeCorrect = (actualOutcome === predictedOutcome) ? 1 : 0;
        if(outcomeCorrect === 1) profile.correctPredictions = (profile.correctPredictions || 0) + 1;

        profile.recentAccuracy.push(outcomeCorrect);
        if (profile.recentAccuracy.length > REGIME_ACCURACY_WINDOW) {
            profile.recentAccuracy.shift();
        }

        if (profile.recentAccuracy.length >= REGIME_ACCURACY_WINDOW * 0.7) {
            const regimeAcc = profile.recentAccuracy.reduce((a,b) => a+b, 0) / profile.recentAccuracy.length;
            let dynamicLearningRateFactor = 1.0 + Math.abs(0.5 - GLOBAL_LONG_TERM_ACCURACY_FOR_LEARNING_RATE) * 0.7;
            dynamicLearningRateFactor = Math.max(0.65, Math.min(1.5, dynamicLearningRateFactor));
            let currentLearningRate = REGIME_LEARNING_RATE_BASE * dynamicLearningRateFactor;
            currentLearningRate = Math.max(0.01, Math.min(0.07, currentLearningRate));

            if (regimeAcc > 0.62) {
                profile.baseWeightMultiplier = Math.min(1.9, profile.baseWeightMultiplier + currentLearningRate);
                profile.contextualAggression = Math.min(1.8, profile.contextualAggression + currentLearningRate * 0.5);
            } else if (regimeAcc < 0.38) {
                profile.baseWeightMultiplier = Math.max(0.20, profile.baseWeightMultiplier - currentLearningRate * 1.3);
                profile.contextualAggression = Math.max(0.30, profile.contextualAggression - currentLearningRate * 0.7);
            }
        }
    }
}

// --- New Engines & Advanced Analysis ---

function analyzeBayesianInference(signals, baseWeight) {
    if (!signals || signals.length < 5) return null;

    let posteriorBig = 0.5; // Start with a neutral prior
    let posteriorSmall = 0.5;

    const categories = {
        trend: { BIG: 0, SMALL: 0, total: 0 },
        momentum: { BIG: 0, SMALL: 0, total: 0 },
        meanRev: { BIG: 0, SMALL: 0, total: 0 },
    };

    signals.forEach(s => {
        let category = null;
        if (s.source.includes("MACD") || s.source.includes("Ichimoku")) category = 'trend';
        else if (s.source.includes("Stochastic") || s.source.includes("RSI")) category = 'momentum';
        else if (s.source.includes("Bollinger") || s.source.includes("MADev") || s.source.includes("ZScore")) category = 'meanRev';

        if (category && (s.prediction === 'BIG' || s.prediction === 'SMALL')) {
            categories[category][s.prediction] += s.adjustedWeight;
            categories[category].total += s.adjustedWeight;
        }
    });

    for (const cat of Object.values(categories)) {
        if (cat.total > 0) {
            const evidenceForBig = cat.BIG / cat.total;
            const evidenceForSmall = cat.SMALL / cat.total;

            // Bayesian update
            let newPosteriorBig = evidenceForBig * posteriorBig;
            let newPosteriorSmall = evidenceForSmall * posteriorSmall;

            const normalization = newPosteriorBig + newPosteriorSmall;
            if (normalization > 0) {
                posteriorBig = newPosteriorBig / normalization;
                posteriorSmall = newPosteriorSmall / normalization;
            }
        }
    }

    if (posteriorBig > posteriorSmall && posteriorBig > 0.65) {
        return { prediction: "BIG", weight: baseWeight * (posteriorBig - 0.5) * 2, source: "Bayesian" };
    }
    if (posteriorSmall > posteriorBig && posteriorSmall > 0.65) {
        return { prediction: "SMALL", weight: baseWeight * (posteriorSmall - 0.5) * 2, source: "Bayesian" };
    }
    return null;
}

function analyzeZScoreAnomaly(history, period, threshold, baseWeight) {
    const numbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));
    if (numbers.length < period) return null;

    const slice = numbers.slice(0, period);
    const mean = calculateSMA(slice, period);
    const stdDev = calculateStdDev(slice, period);

    if (mean === null || stdDev === null || stdDev < 0.1) return null;

    const lastNumber = numbers[0];
    const zScore = (lastNumber - mean) / stdDev;

    let prediction = null;
    if (zScore > threshold) prediction = "SMALL"; // Anomaly on the high side, expect reversion to small
    else if (zScore < -threshold) prediction = "BIG"; // Anomaly on the low side, expect reversion to big

    if (prediction) {
        const strengthFactor = Math.min(1.0, (Math.abs(zScore) - threshold) / threshold);
        return { prediction, weight: baseWeight * (0.5 + strengthFactor * 0.5), source: "ZScoreAnomaly" };
    }
    return null;
}

function analyzeStateSpaceMomentum(history, period, baseWeight) {
    const numbers = history.map(entry => parseInt(entry.actualNumber || entry.actual)).filter(n => !isNaN(n));
    if (numbers.length < period * 2) return null;

    const chronologicalNumbers = numbers.slice().reverse();

    // Simplified state: velocity (change between points)
    let velocity = 0;
    let error = 0;
    const gain = 0.6; // How much we trust the new measurement

    // Estimate current velocity
    for (let i = 1; i < chronologicalNumbers.length; i++) {
        const measurement = chronologicalNumbers[i] - chronologicalNumbers[i-1];
        // Prediction is just the last velocity
        const prediction = velocity;
        // Update
        error = measurement - prediction;
        velocity = prediction + gain * error;
    }

    // Is the current velocity significantly different from the average velocity over the period?
    const velocities = [];
    for(let i=1; i < chronologicalNumbers.length; i++) {
        velocities.push(chronologicalNumbers[i] - chronologicalNumbers[i-1]);
    }
    const avgVelocity = velocities.reduce((a,b) => a+b, 0) / velocities.length;

    let prediction = null;
    // If current velocity is much higher than average, trend is accelerating
    if (velocity > avgVelocity * 1.8 && velocity > 0.5) {
        prediction = "BIG";
    }
    // If current velocity is much lower than average, trend is decelerating or reversing
    else if (velocity < avgVelocity * 1.8 && velocity < -0.5) {
        prediction = "SMALL";
    }

    if (prediction) {
        const strengthFactor = Math.min(1, Math.abs(velocity - avgVelocity) / (Math.abs(avgVelocity) + 1));
        return { prediction, weight: baseWeight * strengthFactor, source: "StateSpaceMomentum" };
    }
    return null;
}


function analyzePredictionConsensus(signals, trendContext) {
    if (!signals || signals.length < 4) {
        return { score: 0.5, factor: 1.0, details: "Insufficient signals for consensus" };
    }

    const categories = {
        trend: { BIG: 0, SMALL: 0, weight: 0 },
        momentum: { BIG: 0, SMALL: 0, weight: 0 },
        meanRev: { BIG: 0, SMALL: 0, weight: 0 },
        pattern: { BIG: 0, SMALL: 0, weight: 0 },
        volatility: { BIG: 0, SMALL: 0, weight: 0 },
        probabilistic: { BIG: 0, SMALL: 0, weight: 0 },
        ml: { BIG: 0, SMALL: 0, weight: 0 }
    };

    const getCategory = source => {
        if (source.includes("MACD") || source.includes("Ichimoku") || source.includes("StateSpace") || source.includes("Fusion")) return 'trend';
        if (source.includes("Stochastic") || source.includes("RSI")) return 'momentum';
        if (source.includes("Bollinger") || source.includes("MADev") || source.includes("ZScore")) return 'meanRev';
        if (source.includes("Gram") || source.includes("Cycle") || source.includes("Alt") || source.includes("Harmonic") || source.includes("Pattern")) return 'pattern';
        if (source.includes("Vol") || source.includes("Fractal") || source.includes("QuantumTunnel")) return 'volatility';
        if (source.includes("Bayesian") || source.includes("MonteCarlo") || source.includes("Superposition")) return 'probabilistic';
        if (source.includes("ML-")) return 'ml';
        return null;
    };

    signals.forEach(s => {
        const category = getCategory(s.source);
        if (category && (s.prediction === "BIG" || s.prediction === "SMALL")) {
            categories[category][s.prediction] += s.adjustedWeight;
        }
    });

    let bigWeight = 0, smallWeight = 0;
    let bigCats = 0, smallCats = 0, mixedCats = 0;

    for(const cat of Object.values(categories)) {
        const totalWeight = cat.BIG + cat.SMALL;
        if (totalWeight > 0) {
            bigWeight += cat.BIG;
            smallWeight += cat.SMALL;
            if(cat.BIG > cat.SMALL * 1.2) bigCats++;
            else if (cat.SMALL > cat.BIG * 1.2) smallCats++;
            else mixedCats++;
        }
    }

    let consensusScore = 0.5;
    const totalCats = bigCats + smallCats + mixedCats;
    if(totalCats > 0) {
        const dominantCats = Math.max(bigCats, smallCats);
        const nonDominantCats = Math.min(bigCats, smallCats);
        consensusScore = (dominantCats - nonDominantCats) / totalCats;
    }

    let factor = 1.0 + (consensusScore * 0.4);

    // Heavy penalty for trend/momentum conflict
    if (trendContext.strength === 'STRONG') {
        if((categories.trend.BIG > categories.trend.SMALL && categories.momentum.SMALL > categories.momentum.BIG) ||
           (categories.trend.SMALL > categories.trend.BIG && categories.momentum.BIG > categories.momentum.SMALL)) {
            factor *= 0.6;
        }
    }

    return {
        score: consensusScore,
        factor: Math.max(0.4, Math.min(1.6, factor)),
        details: `Bcat:${bigCats},Scat:${smallCats},Mcat:${mixedCats},Score:${consensusScore.toFixed(2)}`
    };
}

function analyzeQuantumSuperpositionState(signals, consensus, baseWeight) {
    if (!signals || signals.length < 5 || !consensus) return null;

    const totalWeight = signals.reduce((sum, s) => sum + (s.adjustedWeight || 0), 0);
    if (totalWeight < 0.1) return null;

    const bigWeight = signals.filter(s => s.prediction === "BIG").reduce((sum, s) => sum + s.adjustedWeight, 0);
    const smallWeight = signals.filter(s => s.prediction === "SMALL").reduce((sum, s) => sum + s.adjustedWeight, 0);

    const bigCollapseProbability = (bigWeight / totalWeight) * consensus.factor;
    const smallCollapseProbability = (smallWeight / totalWeight) * (2.0 - consensus.factor);

    if (bigCollapseProbability > smallCollapseProbability * 1.3) {
        return {
            prediction: "BIG",
            weight: baseWeight * Math.min(1.0, (bigCollapseProbability - smallCollapseProbability)),
            source: "QuantumSuperposition"
        };
    }

    if (smallCollapseProbability > bigCollapseProbability * 1.3) {
        return {
            prediction: "SMALL",
            weight: baseWeight * Math.min(1.0, (smallCollapseProbability - bigCollapseProbability)),
            source: "QuantumSuperposition"
        };
    }

    return null;
}


function analyzePathConfluenceStrength(signals, finalPrediction) {
    if (!signals || signals.length === 0 || !finalPrediction) return { score: 0, diversePaths: 0, details: "No valid signals or prediction." };

    const agreeingSignals = signals.filter(s => s.prediction === finalPrediction && s.adjustedWeight > MIN_ABSOLUTE_WEIGHT * 10);
    if (agreeingSignals.length < 2) {
        return { score: 0, diversePaths: agreeingSignals.length, details: "Insufficient agreeing signals." };
    }

    const signalCategories = new Set();
    agreeingSignals.forEach(s => {
        if (s.source.includes("MACD") || s.source.includes("Ichimoku")) signalCategories.add('trend');
        else if (s.source.includes("Stochastic") || s.source.includes("RSI")) signalCategories.add('momentum');
        else if (s.source.includes("Bollinger") || s.source.includes("ZScore")) signalCategories.add('meanRev');
        else if (s.source.includes("Gram") || s.source.includes("Cycle") || s.source.includes("Pattern")) signalCategories.add('pattern');
        else if (s.source.includes("Vol") || s.source.includes("FractalDim")) signalCategories.add('volatility');
        else if (s.source.includes("Bayesian") || s.source.includes("Superposition") || s.source.includes("ML-")) signalCategories.add('probabilistic');
        else signalCategories.add('other');
    });

    const diversePathCount = signalCategories.size;
    let confluenceScore = 0;

    if (diversePathCount >= 4) confluenceScore = 0.20;
    else if (diversePathCount === 3) confluenceScore = 0.12;
    else if (diversePathCount === 2) confluenceScore = 0.05;

    const veryStrongAgreeingCount = agreeingSignals.filter(s => s.adjustedWeight > 0.10).length;
    confluenceScore += Math.min(veryStrongAgreeingCount * 0.02, 0.10);

    return { score: Math.min(confluenceScore, 0.30), diversePaths: diversePathCount, details: `Paths:${diversePathCount},Strong:${veryStrongAgreeingCount}` };
}

function analyzeSignalConsistency(signals, trendContext) {
    if (!signals || signals.length < 3) return { score: 0.70, details: "Too few signals for consistency check" };
    const validSignals = signals.filter(s => s.prediction);
    if (validSignals.length < 3) return { score: 0.70, details: "Too few valid signals" };

    const predictions = { BIG: 0, SMALL: 0 };
    validSignals.forEach(s => {
        if (s.prediction === "BIG" || s.prediction === "SMALL") predictions[s.prediction]++;
    });

    const totalPredictions = predictions.BIG + predictions.SMALL;
    if (totalPredictions === 0) return { score: 0.5, details: "No directional signals" };

    const consistencyScore = Math.max(predictions.BIG, predictions.SMALL) / totalPredictions;
    return { score: consistencyScore, details: `Overall split B:${predictions.BIG}/S:${predictions.SMALL}` };
}

let consecutiveHighConfLosses = 0;
let reflexiveCorrectionActive = 0; // This is now a countdown

function checkForAnomalousPerformance(currentSharedStats) {
    if (reflexiveCorrectionActive > 0) {
        reflexiveCorrectionActive--;
        return true;
    }

    if (currentSharedStats && typeof currentSharedStats.lastFinalConfidence === 'number' && currentSharedStats.lastActualOutcome) {
        const lastPredOutcomeBS = getBigSmallFromNumber(currentSharedStats.lastActualOutcome);
        const lastPredWasCorrect = lastPredOutcomeBS === currentSharedStats.lastPredictedOutcome;

        const lastPredWasHighConf = currentSharedStats.lastConfidenceLevel === 3;

        if (lastPredWasHighConf && !lastPredWasCorrect) {
            consecutiveHighConfLosses++;
        } else {
            consecutiveHighConfLosses = 0;
        }
    }

    if (consecutiveHighConfLosses >= 2) {
        reflexiveCorrectionActive = 5;
        consecutiveHighConfLosses = 0;
        return true;
    }

    return false;
}

// Re-purposed from a skip score to an uncertainty score.
function calculateUncertaintyScore(trendContext, stability, marketEntropyState, signalConsistency, pathConfluence, globalAccuracy, isReflexiveCorrection, driftState) {
    let uncertaintyScore = 0;
    let reasons = [];

    if (isReflexiveCorrection) {
        uncertaintyScore += 80;
        reasons.push("ReflexiveCorrection");
    }
    if(driftState === 'DRIFT') {
        uncertaintyScore += 70;
        reasons.push("ConceptDrift");
    } else if (driftState === 'WARNING') {
        uncertaintyScore += 40;
        reasons.push("DriftWarning");
    }
    if (!stability.isStable) {
        uncertaintyScore += (stability.reason.includes("Dominance") || stability.reason.includes("Choppiness")) ? 50 : 40;
        reasons.push(`Instability:${stability.reason}`);
    }
    if (marketEntropyState.state.includes("CHAOS")) {
        uncertaintyScore += marketEntropyState.state === "RISING_CHAOS" ? 45 : 35;
        reasons.push(marketEntropyState.state);
    }
    if (signalConsistency.score < 0.6) {
        uncertaintyScore += (1 - signalConsistency.score) * 50;
        reasons.push(`LowConsistency:${signalConsistency.score.toFixed(2)}`);
    }
    if (pathConfluence.diversePaths < 3) {
        uncertaintyScore += (3 - pathConfluence.diversePaths) * 15;
        reasons.push(`LowConfluence:${pathConfluence.diversePaths}`);
    }
    if (trendContext.isTransitioning) {
        uncertaintyScore += 25;
        reasons.push("RegimeTransition");
    }
    if (trendContext.volatility === "HIGH") {
        uncertaintyScore += 20;
        reasons.push("HighVolatility");
    }
     if (typeof globalAccuracy === 'number' && globalAccuracy < 0.48) {
        uncertaintyScore += (0.48 - globalAccuracy) * 150;
        reasons.push(`LowGlobalAcc:${globalAccuracy.toFixed(2)}`);
    }

    return { score: uncertaintyScore, reasons: reasons.join(';') };
}

/**
 * **NEW in v42.0.0: Feature Creation for ML Models**
 * Gathers all standard features into a single object for an ML model.
 */
function createFeatureSetForML(history, trendContext, time) {
    const numbers = history.map(e => parseInt(e.actualNumber || e.actual)).filter(n => !isNaN(n));
    if(numbers.length < 52) return null; // Ensure enough data for all features

    return {
        // Time features
        time_sin: time.sin,
        time_cos: time.cos,
        // Price action features
        last_5_mean: calculateSMA(numbers, 5),
        last_20_mean: calculateSMA(numbers, 20),
        // Volatility features
        stddev_10: calculateStdDev(numbers, 10),
        stddev_30: calculateStdDev(numbers, 30),
        // Momentum features
        rsi_14: calculateRSI(numbers, 14),
        stoch_k_14: analyzeStochastic(history, 14, 3, 3, 1.0, trendContext.volatility)?.currentK, // Simplified
        macd_hist: analyzeMACD(history, 12, 26, 9, 1.0)?.macdHistogram, // Simplified
        // Context features
        trend_strength: trendContext.strength === 'STRONG' ? 2 : (trendContext.strength === 'MODERATE' ? 1 : 0),
        volatility_level: trendContext.volatility === 'HIGH' ? 2 : (trendContext.volatility === 'MEDIUM' ? 1 : 0),
    };
}


function ultraAIPredict(currentSharedHistory, currentSharedStats) {
    const currentPeriodFull = currentSharedStats?.periodFull || Date.now();
    const time = getCurrentISTHour();
    const primeTimeSession = getPrimeTimeSession(time.raw);
    const realTimeData = getRealTimeExternalData();

    console.log(`Quantum AI Supercore v42.0.0 Initializing Prediction for period ${currentPeriodFull}`);
    let masterLogic = [`QAScore_v42.0(IST_Hr:${time.raw})`];
    masterLogic.push(realTimeData.reason);

    // --- Prime Time Boost Injection ---
    let primeTimeAggression = 1.0;
    let primeTimeConfidence = 1.0;
    if (primeTimeSession) {
        masterLogic.push(`!!! PRIME TIME ACTIVE: ${primeTimeSession.session} !!!`);
        primeTimeAggression = primeTimeSession.aggression;
        primeTimeConfidence = primeTimeSession.confidence;
    }


    let longTermGlobalAccuracy = currentSharedStats?.longTermGlobalAccuracy || GLOBAL_LONG_TERM_ACCURACY_FOR_LEARNING_RATE;
    if (currentSharedStats && typeof currentSharedStats.longTermGlobalAccuracy === 'number') {
        GLOBAL_LONG_TERM_ACCURACY_FOR_LEARNING_RATE = currentSharedStats.longTermGlobalAccuracy;
        longTermGlobalAccuracy = currentSharedStats.longTermGlobalAccuracy;
    }

    const isReflexiveCorrection = checkForAnomalousPerformance(currentSharedStats);
    if (isReflexiveCorrection) {
        masterLogic.push(`!!! REFLEXIVE CORRECTION ACTIVE !!! (Countdown: ${reflexiveCorrectionActive})`);
    }

    const trendContext = getMarketRegimeAndTrendContext(currentSharedHistory);
    masterLogic.push(`TrendCtx(Dir:${trendContext.direction},Str:${trendContext.strength},Vol:${trendContext.volatility},Regime:${trendContext.macroRegime})`);

    const stability = analyzeTrendStability(currentSharedHistory);
    const marketEntropyAnalysis = analyzeMarketEntropyState(currentSharedHistory, trendContext, stability);
    masterLogic.push(`MarketEntropy:${marketEntropyAnalysis.state}`);

    const advancedRegime = analyzeAdvancedMarketRegime(trendContext, marketEntropyAnalysis);
    masterLogic.push(`AdvRegime:${advancedRegime.details}`);

    let concentrationModeEngaged = !stability.isStable || isReflexiveCorrection || marketEntropyAnalysis.state.includes("CHAOS");

    // --- Concept Drift Detection ---
    let driftState = 'STABLE';
    if (currentSharedStats && typeof currentSharedStats.lastActualOutcome !== 'undefined') {
        const lastPredictionWasCorrect = getBigSmallFromNumber(currentSharedStats.lastActualOutcome) === currentSharedStats.lastPredictedOutcome;
        driftState = detectConceptDrift(lastPredictionWasCorrect);
        if (driftState !== 'STABLE') {
            masterLogic.push(`!!! DRIFT DETECTED: ${driftState} !!!`);
            concentrationModeEngaged = true; // Engage concentration mode on drift
        }
    }


    if (concentrationModeEngaged) masterLogic.push(`ConcentrationModeActive`);

    // --- Performance Update ---
    const currentVolatilityRegimeForPerf = trendContext.volatility;
    const currentMacroRegime = trendContext.macroRegime;
    if (currentSharedStats && currentSharedStats.lastPredictionSignals && currentSharedStats.lastActualOutcome) {
        updateSignalPerformance(
            currentSharedStats.lastPredictionSignals,
            getBigSmallFromNumber(currentSharedStats.lastActualOutcome),
            currentSharedStats.lastPeriodFull,
            currentSharedStats.lastVolatilityRegime || currentVolatilityRegimeForPerf,
            currentSharedStats.lastFinalConfidence,
            currentSharedStats.lastConcentrationModeEngaged || false,
            currentSharedStats.lastMarketEntropyState || "STABLE_MODERATE"
        );

        if (currentSharedStats.lastPredictedOutcome) {
            updateRegimeProfilePerformance(currentSharedStats.lastMacroRegime, getBigSmallFromNumber(currentSharedStats.lastActualOutcome), currentSharedStats.lastPredictedOutcome);
        }
    }

    const confirmedHistory = currentSharedHistory.filter(p => p && p.actual !== null && p.actualNumber !== undefined);
    if (confirmedHistory.length < 52) { // Increased for ML feature generation
        masterLogic.push(`InsufficientHistory_ForceRandom`);
        const finalDecision = Math.random() > 0.5 ? "BIG" : "SMALL";
        return {
            predictions: { BIG: { confidence: 0.5, logic: "ForcedRandom" }, SMALL: { confidence: 0.5, logic: "ForcedRandom" } },
            finalDecision: finalDecision, finalConfidence: 0.5, confidenceLevel: 1, isForcedPrediction: true,
            overallLogic: masterLogic.join(' -> '), source: "InsufficientHistory",
            contributingSignals: [], currentMacroRegime, concentrationModeEngaged, pathConfluenceScore: 0, marketEntropyState: marketEntropyAnalysis.state, predictionQualityScore: 0.01, reflexiveCorrectionActive: isReflexiveCorrection, lastPredictedOutcome: finalDecision, lastFinalConfidence: 0.5, lastMacroRegime: currentMacroRegime, lastPredictionSignals: [], lastConcentrationModeEngaged: concentrationModeEngaged, lastMarketEntropyState: marketEntropyAnalysis.state, lastVolatilityRegime: trendContext.volatility, lastConfidenceLevel: 1
        };
    }

    let signals = [];
    const currentRegimeProfile = REGIME_SIGNAL_PROFILES[currentMacroRegime] || REGIME_SIGNAL_PROFILES["DEFAULT"];
    let regimeContextualAggression = (currentRegimeProfile.contextualAggression || 1.0) * primeTimeAggression;

    if (isReflexiveCorrection || driftState === 'DRIFT') regimeContextualAggression *= 0.25;
    else if (concentrationModeEngaged) regimeContextualAggression *= 0.6;

    const addSignal = (fn, historyArg, signalType, lookbackParams, baseWeight) => {
        if (!(currentRegimeProfile.activeSignalTypes.includes('all') || currentRegimeProfile.activeSignalTypes.includes(signalType))) {
            return;
        }

        const fnArgs = Array.isArray(lookbackParams) ?
            [historyArg, ...lookbackParams, baseWeight] :
            [historyArg, ...Object.values(lookbackParams), baseWeight];

         if (fn === analyzeRSI || fn === analyzeStochastic) {
             fnArgs.push(trendContext.volatility);
        }
        if (fn === analyzeVolatilityTrendFusion) {
            fnArgs.splice(1, 0, marketEntropyAnalysis)
        }
        if (fn === analyzeMLModelSignal) {
            const features = createFeatureSetForML(historyArg, trendContext, time);
            if (!features) return;
            fnArgs.splice(0, 1, features); // Replace history with features object
        }


        const result = fn(...fnArgs);

        if (result && result.weight && result.prediction) {
            result.adjustedWeight = getDynamicWeightAdjustment(result.source, result.weight * regimeContextualAggression, currentPeriodFull, currentVolatilityRegimeForPerf, currentSharedHistory);
            signals.push(result);
        }
    };

    // --- Signal Generation ---
    addSignal(analyzeTransitions, confirmedHistory, 'pattern', {}, 0.05);
    addSignal(analyzeStreaks, confirmedHistory, 'meanRev', {}, 0.045);
    addSignal(analyzeAlternatingPatterns, confirmedHistory, 'pattern', {}, 0.06);
    addSignal(analyzeTwoPlusOnePatterns, confirmedHistory, 'pattern', {}, 0.07);
    addSignal(analyzeDoublePatterns, confirmedHistory, 'pattern', {}, 0.075);
    addSignal(analyzeMirrorPatterns, confirmedHistory, 'pattern', {}, 0.08);
    addSignal(analyzeRSI, confirmedHistory, 'momentum', { rsiPeriod: 14 }, 0.08);
    addSignal(analyzeMACD, confirmedHistory, 'trend', { shortPeriod: 12, longPeriod: 26, signalPeriod: 9 }, 0.09);
    addSignal(analyzeBollingerBands, confirmedHistory, 'meanRev', { period: 20, stdDevMultiplier: 2.1 }, 0.07);
    addSignal(analyzeIchimokuCloud, confirmedHistory, 'trend', { tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52 }, 0.14);
    addSignal(analyzeStochastic, confirmedHistory, 'momentum', { kPeriod: 14, dPeriod: 3, smoothK: 3 }, 0.08);
    addSignal(analyzeZScoreAnomaly, confirmedHistory, 'meanRev', { period: 20, threshold: 2.0 }, 0.12);
    addSignal(analyzeStateSpaceMomentum, confirmedHistory, 'trend', { period: 15 }, 0.11);
    addSignal(analyzeWaveformPatterns, confirmedHistory, 'pattern', {}, 0.035);
    addSignal(analyzeQuantumTunneling, confirmedHistory, 'volatility', {}, 0.055);

    // --- Meta-Signal & ML Signal Generation ---
    addSignal(analyzeVolatilityTrendFusion, trendContext, 'fusion', {}, 0.25);
    addSignal(analyzeMLModelSignal, confirmedHistory, 'ml', {}, 0.40); // High base weight for ML model
    addSignal(analyzeBayesianInference, signals, 'probabilistic', {}, 0.15);

    const consensus = analyzePredictionConsensus(signals, trendContext);
    masterLogic.push(`Consensus:${consensus.details},Factor:${consensus.factor.toFixed(2)}`);
    const superpositionSignal = analyzeQuantumSuperpositionState(signals, consensus, 0.22);
    if (superpositionSignal) {
        superpositionSignal.adjustedWeight = getDynamicWeightAdjustment(superpositionSignal.source, superpositionSignal.weight, currentPeriodFull, currentVolatilityRegimeForPerf, currentSharedHistory);
        signals.push(superpositionSignal);
    }

    const validSignals = signals.filter(s => s?.prediction && s.adjustedWeight > MIN_ABSOLUTE_WEIGHT);
    masterLogic.push(`ValidSignals(${validSignals.length}/${signals.length})`);

    if (validSignals.length === 0) {
        masterLogic.push(`NoValidSignals_ForceRandom`);
        const finalDecision = Math.random() > 0.5 ? "BIG" : "SMALL";
        return {
            predictions: { BIG: { confidence: 0.5, logic: "ForcedRandom" }, SMALL: { confidence: 0.5, logic: "ForcedRandom" } },
            finalDecision: finalDecision, finalConfidence: 0.5, confidenceLevel: 1, isForcedPrediction: true,
            overallLogic: masterLogic.join(' -> '), source: "NoValidSignals",
            contributingSignals: [], currentMacroRegime, concentrationModeEngaged, pathConfluenceScore: 0, marketEntropyState: marketEntropyAnalysis.state, predictionQualityScore: 0.01, reflexiveCorrectionActive: isReflexiveCorrection, lastPredictedOutcome: finalDecision, lastFinalConfidence: 0.5, lastMacroRegime: currentMacroRegime, lastPredictionSignals: [], lastConcentrationModeEngaged: concentrationModeEngaged, lastMarketEntropyState: marketEntropyAnalysis.state, lastVolatilityRegime: trendContext.volatility, lastConfidenceLevel: 1
        };
    }

    let bigScore = 0; let smallScore = 0;
    validSignals.forEach(signal => {
        if (signal.prediction === "BIG") bigScore += signal.adjustedWeight;
        else if (signal.prediction === "SMALL") smallScore += signal.adjustedWeight;
    });

    // Use probabilistic regime to adjust scores
    bigScore *= (1 + advancedRegime.probabilities.bullTrend - advancedRegime.probabilities.bearTrend);
    smallScore *= (1 + advancedRegime.probabilities.bearTrend - advancedRegime.probabilities.bullTrend);

    bigScore *= consensus.factor;
    smallScore *= (2.0 - consensus.factor);

    const totalScore = bigScore + smallScore;
    let finalDecision = totalScore > 0 ? (bigScore >= smallScore ? "BIG" : "SMALL") : (Math.random() > 0.5 ? "BIG" : "SMALL");
    let finalConfidence = totalScore > 0 ? Math.max(bigScore, smallScore) / totalScore : 0.5;

    // Apply Prime Time & Real-Time Data Boosts
    finalConfidence = 0.5 + (finalConfidence - 0.5) * primeTimeConfidence * realTimeData.factor;


    const signalConsistency = analyzeSignalConsistency(validSignals, trendContext);
    const pathConfluence = analyzePathConfluenceStrength(validSignals, finalDecision);
    const uncertainty = calculateUncertaintyScore(trendContext, stability, marketEntropyAnalysis, signalConsistency, pathConfluence, longTermGlobalAccuracy, isReflexiveCorrection, driftState);

    const uncertaintyFactor = 1.0 - Math.min(1.0, uncertainty.score / 120.0);
    finalConfidence = 0.5 + (finalConfidence - 0.5) * uncertaintyFactor;
    masterLogic.push(`Uncertainty(Score:${uncertainty.score.toFixed(0)},Factor:${uncertaintyFactor.toFixed(2)})`);

    let pqs = 0.5;
    pqs += (signalConsistency.score - 0.5) * 0.4;
    pqs += pathConfluence.score * 1.2;
    pqs = Math.max(0.01, Math.min(0.99, pqs - (uncertainty.score / 500)));
    masterLogic.push(`PQS:${pqs.toFixed(3)}`);

    let highConfThreshold = 0.78, medConfThreshold = 0.65;
    let highPqsThreshold = 0.75, medPqsThreshold = 0.60;

    if (primeTimeSession) {
        highConfThreshold = 0.72;
        medConfThreshold = 0.60;
        highPqsThreshold = 0.70;
        medPqsThreshold = 0.55;
    }

    let confidenceLevel = 1;
    if (finalConfidence > medConfThreshold && pqs > medPqsThreshold) {
        confidenceLevel = 2;
    }
    if (finalConfidence > highConfThreshold && pqs > highPqsThreshold) {
        confidenceLevel = 3; // L3 is possible again with ML
    }


    const uncertaintyThreshold = isReflexiveCorrection || driftState === 'DRIFT' ? 65 : 95;
    const isForced = uncertainty.score >= uncertaintyThreshold || pqs < 0.20;
    if(isForced) {
        confidenceLevel = 1;
        finalConfidence = 0.5 + (Math.random() - 0.5) * 0.02;
        masterLogic.push(`FORCED_PREDICTION(Uncertainty:${uncertainty.score}/${uncertaintyThreshold},PQS:${pqs})`);
    }

    const bigDisplayConfidence = finalDecision === "BIG" ? finalConfidence : 1 - finalConfidence;
    const smallDisplayConfidence = finalDecision === "SMALL" ? finalConfidence : 1 - finalConfidence;

    const output = {
        predictions: {
            BIG: { confidence: Math.max(0.001, Math.min(0.999, bigDisplayConfidence)), logic: "EnsembleV42" },
            SMALL: { confidence: Math.max(0.001, Math.min(0.999, smallDisplayConfidence)), logic: "EnsembleV42" }
        },
        finalDecision,
        finalConfidence,
        confidenceLevel,
        isForcedPrediction: isForced,
        overallLogic: masterLogic.join(' -> '),
        source: "RealTimeFusionV42",
        contributingSignals: validSignals.map(s => ({ source: s.source, prediction: s.prediction, weight: s.adjustedWeight.toFixed(5) })).sort((a,b)=>b.weight-a.weight).slice(0, 15),
        currentMacroRegime,
        marketEntropyState: marketEntropyAnalysis.state,
        predictionQualityScore: pqs,
        reflexiveCorrectionActive: isReflexiveCorrection,
        // Pass state for next cycle's learning
        lastPredictedOutcome: finalDecision,
        lastFinalConfidence: finalConfidence,
        lastConfidenceLevel: confidenceLevel,
        lastMacroRegime: currentMacroRegime,
        lastPredictionSignals: validSignals.map(s => ({ source: s.source, prediction: s.prediction, weight: s.adjustedWeight, isOnProbation: s.isOnProbation || false })),
        lastConcentrationModeEngaged: concentrationModeEngaged,
        lastMarketEntropyState: marketEntropyAnalysis.state,
        lastVolatilityRegime: trendContext.volatility,
    };

    console.log(`QAScore v42.0.0 Output: ${output.finalDecision} @ ${(output.finalConfidence * 100).toFixed(1)}% | Lvl: ${output.confidenceLevel} | PQS: ${output.predictionQualityScore.toFixed(2)} | Forced: ${output.isForcedPrediction} | Drift: ${driftState}`);
    return output;
}


// Ensure it's available for Node.js environments if needed
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        ultraAIPredict,
        getBigSmallFromNumber
    };
}
