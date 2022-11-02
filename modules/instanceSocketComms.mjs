import WebSocket from 'ws';
import fetch from 'node-fetch';
import { workerData } from "worker_threads";

(async () => {
  var instanceToken = workerData;
  console.log(instanceToken);
  var data = await(await fetch("http://localhost:4000/v1/instancesocket", {
    method: "POST",
    headers: {
      "authentication": instanceToken
    }
  })).json();
  
  var poolID = data.data;
  
  const ws = new WebSocket(`ws://localhost:4000/v1/instancepool`, {
    rejectUnauthorized: false,
    followRedirects: true,
    headers: {
      "authentication": instanceToken,
      "x-pool-id": poolID
    }
  });
  
  ws.on('open', () => {
    console.log("Connected to WebSocket!");
  });
  
  ws.on('message', data => {
    console.log(data);
  });
  
  ws.on('close', () => {
    console.log("Connection closed.");
  });
})();