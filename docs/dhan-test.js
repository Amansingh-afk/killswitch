const DHAN_ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzY2MDM0MzYwLCJpYXQiOjE3NjU5NDc5NjAsInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTA3NDYwODIxIn0.VvAY18WO-Ok8h5_giCZXrF4L6FgCv841d3gJHjkVhWcZmkAu0dQQ6xjkH_7ZV40Q5r_SRJZj7mNM46xCmNbHqg"
const DHAN_CLIENT_ID = "1107460821";
const LOSS_THRESHOLD = 2;

const BASE = "https://api.dhan.co";
const API_VERSION = "/v2";
let killswitchTriggered = false;

async function dhanGet(path) {
  try {
    const res = await fetch(BASE + path, {
      method: "GET",
      headers: {
        "access-token": DHAN_ACCESS_TOKEN
      }
    });

    return await res.json();
  } catch (e) {
    return null;
  }
}

async function dhanPost(path, body = null) {
  try {
    const options = {
      method: "POST",
      headers: {
        "access-token": DHAN_ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const res = await fetch(BASE + path, options);
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function getBalanceData() {
  const data = await dhanGet(API_VERSION + "/fundlimit");
  if (!data) return null;
  
  return {
    availableBalance: data.availabelBalance || 0,
    sodLimit: data.sodLimit || 0,
    utilizedAmount: data.utilizedAmount || 0,
    withdrawableBalance: data.withdrawableBalance || 0,
    collateralAmount: data.collateralAmount || 0,
    receiveableAmount: data.receiveableAmount || 0,
    blockedPayoutAmount: data.blockedPayoutAmount || 0
  };
}

async function getPositionsData() {
  const data = await dhanGet(API_VERSION + "/positions");
  if (!data || !Array.isArray(data)) {
    return null;
  }

  const tradingPositions = data.filter(p => {
    const productType = (p.productType || "").toUpperCase();
    return productType !== "CNC" && productType !== "";
  });

  let totalMTM = 0;
  let totalInvested = 0;
  
  tradingPositions.forEach(p => {
    totalMTM += Number(p.unrealizedProfit || 0);
    
    const netQty = Math.abs(Number(p.netQty || 0));
    const costPrice = Number(p.costPrice || p.buyAvg || 0);
    totalInvested += costPrice * netQty;
  });

  return { mtm: totalMTM, invested: totalInvested, positionCount: tradingPositions.length };
}

async function closeAllPositions() {
  const data = await dhanGet(API_VERSION + "/positions");
  if (!data || !Array.isArray(data)) {
    return;
  }

  const tradingPositions = data.filter(p => {
    const productType = (p.productType || "").toUpperCase();
    return productType !== "CNC" && productType !== "" && Math.abs(Number(p.netQty || 0)) > 0;
  });

  if (tradingPositions.length === 0) {
    return;
  }

  for (const position of tradingPositions) {
    const netQty = Number(position.netQty || 0);
    if (netQty === 0) continue;

    const transactionType = netQty > 0 ? "SELL" : "BUY";
    const quantity = Math.abs(netQty);

    const orderData = {
      dhanClientId: position.dhanClientId || DHAN_CLIENT_ID,
      transactionType: transactionType,
      exchangeSegment: position.exchangeSegment,
      productType: position.productType,
      orderType: "MARKET",
      validity: "DAY",
      tradingSymbol: position.tradingSymbol,
      securityId: position.securityId,
      quantity: quantity
    };

    if (position.drvExpiryDate && position.drvExpiryDate !== "0001-01-01") {
      orderData.drvExpiryDate = position.drvExpiryDate;
    }
    if (position.drvOptionType && position.drvOptionType !== "NA") {
      orderData.drvOptionType = position.drvOptionType;
      orderData.drvStrikePrice = position.drvStrikePrice || 0;
    }

    await dhanPost(API_VERSION + "/orders", orderData);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function triggerKillSwitch() {
  await closeAllPositions();
  await new Promise(resolve => setTimeout(resolve, 2000));
  await dhanPost("/killSwitch?killSwitchStatus=ACTIVATE");
  killswitchTriggered = true;
}

async function monitor() {
  const balanceData = await getBalanceData();
  if (!balanceData) {
    return;
  }
  
  const positionsData = await getPositionsData();
  if (positionsData === null) {
    return;
  }

  const { mtm, invested } = positionsData;

  if (invested === 0) {
    return;
  }

  const lossPercent = mtm < 0 ? (Math.abs(mtm) / invested) * 100 : 0;

  if (mtm < 0 && lossPercent >= LOSS_THRESHOLD) {
    if (!killswitchTriggered) {
      await triggerKillSwitch();
    }
  }
}

setInterval(monitor, 2000);

