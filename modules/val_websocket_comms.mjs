import fs from 'fs';
import fetch from 'node-fetch';
import https from 'https';
import WebSocket from 'ws';
import { parentPort } from "worker_threads";
import * as path from 'path';

// -------------- PRESENCE FUNCTIONS --------------

const localAgent = new https.Agent({
  rejectUnauthorized: false
});

async function asyncTimeout(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}

async function getSession(port, password) {
  return (await fetch(`https://127.0.0.1:${port}/chat/v1/session`, {
    headers: {
      'authorization': 'Basic ' + Buffer.from(`riot:${password}`).toString('base64')
    },
    agent: localAgent
  })).json();
}

async function getHelp(port, password) {
  return (await fetch(`https://127.0.0.1:${port}/help`, {
    headers: {
      'authorization': 'Basic ' + Buffer.from(`riot:${password}`).toString('base64')
    },
    agent: localAgent
  })).json();
}

async function waitForLockfile() {
  return new Promise(async (resolve, reject) => {
    const watcher = fs.watch(
      path.join(process.env["LOCALAPPDATA"], "Riot Games\\Riot Client\\Config\\"),
      (eventType, fileName) => {
        if(eventType === "rename" && fileName === "lockfile") {
          watcher.close();
          resolve();
        }
      }
    );
  });
}

async function getLockfileData() {
  const lockfilePath = path.join(process.env["LOCALAPPDATA"], "Riot Games\\Riot Client\\Config\\lockfile");
  const contents = await fs.promises.readFile(lockfilePath, "utf8");

  let d = {};

  [d.name, d.pid, d.port, d.password, d.protocol] = contents.split(":");
  return d;
}

async function runValorantPresence() {
  var load_data_raw = fs.readFileSync(process.env.APPDATA + "/VALTracker/user_data/load_files/on_load.json");
  var load_data = JSON.parse(load_data_raw);

  if((load_data.hasValorantRPenabled === undefined || load_data.hasValorantRPenabled === true) && load_data.hasFinishedSetupSequence === true) {
    parentPort.postMessage({"channel": "message", "data": "VALORANT RICH PRESENCE ACTIVATED."});

    let sessionData = null;
    let lastRetryMessage = 0;
  
    let lockData = null;
    do {
      try {
        lockData = await getLockfileData();
        parentPort.postMessage({"channel": "message", "data": "Waiting for game to be opened..."});
      } catch (e) {
        await waitForLockfile();
      }
    } while (lockData === null);
  
    do {
      try {
        sessionData = await getSession(lockData.port, lockData.password);
        if(sessionData.loaded === false)
        {
          await asyncTimeout(1500);
          sessionData = null;
        }
      } catch(e) {
        const currentTime = (new Date()).getTime();
        if(currentTime - lastRetryMessage > 1000) {
          parentPort.postMessage({"channel": "message", "data": "Trying to get session data..."});
          lastRetryMessage = currentTime;
        }
      }
    } while(sessionData === null);
    
    let helpData = null;
    do {
      helpData = await getHelp(lockData.port, lockData.password);
      if(!helpData.events.hasOwnProperty('OnJsonApiEvent_chat_v4_presences')) {
        helpData = null;
        await asyncTimeout(1500);
      }
    } while(helpData === null);
    
    const ws = new WebSocket(`wss://riot:${lockData.password}@localhost:${lockData.port}`, {
      rejectUnauthorized: false
    });
    
    ws.on('open', () => {
      Object.entries(helpData.events).forEach(([name, desc]) => {
        if(name === 'OnJsonApiEvent') return;
        ws.send(JSON.stringify([5, name]));
      });

      parentPort.postMessage({"channel": "message", "data": "fetchPlayerData"});
      parentPort.postMessage({"channel": "message", "data": "Connected to WebSocket!"});
      parentPort.postMessage({"channel": "toggleDRP", "data": true});
    });
    
    ws.on('message', data => {
      parentPort.postMessage({"channel": "WS_Event", "data": data});
    });
    
    ws.on('close', () => {
      parentPort.postMessage({"channel": "message", "data": "The game has been closed."});
      parentPort.postMessage({"channel": "toggleDRP", "data": false});

      runValorantPresence();
    });
  } else {
    parentPort.postMessage({"channel": "message", "data": "VALORANT RICH PRESENCE IS NOT ACTIVATED."});
  }
}

runValorantPresence();

parentPort.on("startValorantPresence", () => {
  runValorantPresence();
});