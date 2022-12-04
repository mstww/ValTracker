import WebSocket from 'ws';
import fetch from 'node-fetch';
import { parentPort, workerData } from "worker_threads";

(async () => {
  var instanceToken = workerData;
  var data = await(await fetch("https://beta-api.valtracker.gg/v1/instancesocket", {
    method: "POST",
    headers: {
      "authentication": instanceToken
    }
  })).json();
  
  var poolID = data.data;
  
  const ws = new WebSocket(`wss://beta-api.valtracker.gg/v1/instancepool`, {
    rejectUnauthorized: false,
    followRedirects: true,
    headers: {
      "authentication": instanceToken,
      "x-pool-id": poolID
    }
  });
  
  ws.on('open', () => {
    console.log("Connected to WebSocket!");
    parentPort.on("message", () => {
      ws.send(JSON.stringify({ "type": "updating" }));
    });
  });
  
  ws.on('message', data => {
    parentPort.postMessage(JSON.parse(data));
  });
  
  ws.on('close', () => {
    console.log("Connection to WebSocket closed.");
  });

  ws.on("error", (err) => {
    console.log(err);
  });
})();