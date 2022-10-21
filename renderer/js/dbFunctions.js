import { ipcRenderer } from "electron";
import Surreal from "surrealdb.js";

var db = false;

async function connectToDB() {
  var sdb = new Surreal(process.env.DB_URL);

  await sdb.wait();

  await sdb.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  });

  await sdb.use('app', 'main');
  
  db = sdb;
  return;
};

export async function executeQuery(queryStr) {
  if(db === false) await connectToDB();

  var result = await db.query(queryStr);
  return result[0].result;
}

export async function createThing(thing, obj) {
  if(db === false) await connectToDB();

  var result = await db.query(`SELECT 1 FROM ${thing}`);
  if(!result[0].result[0]) {
    var result = await db.create(thing, obj);
  } else {
    var result = await db.update(thing, obj);
  }

  return result;
}

export async function updateThing(thing, obj) {
  if(db === false) await connectToDB();

  var result = await db.update(thing, obj);
  return result;
}

export async function switchPlayer(uuid) {
  if(db === false) await connectToDB();
  
  var Q = `SELECT * FROM currentPlayer`;
  var result = await db.query(Q);

  var Q = `UPDATE ${result[0].result[0].id} SET in = "playerCollection:⟨app⟩", out = player:⟨${uuid}⟩`;
  var result = await db.query(Q);
  return result;
}

export async function getUserEntitlement(uuid) {
  if(db === false) await connectToDB();
  
  if(!uuid) {
    var Q = "SELECT out.uuid AS uuid FROM playerCollection:⟨app⟩->currentPlayer FETCH out";
    var result = await db.query(Q);
    uuid = result[0].result[0].uuid;
  }
  var Q = `SELECT entitlement FROM rgConfig:⟨${uuid}⟩`;
  var result = await db.query(Q);
  return result[0].result[0].entitlement;
}

export async function getUserAccessToken(uuid) {
  if(db === false) await connectToDB();
  
  if(!uuid) {
    var Q = "SELECT out.uuid AS uuid FROM playerCollection:⟨app⟩->currentPlayer FETCH out";
    var result = await db.query(Q);
    uuid = result[0].result[0].uuid;
  }
  var Q = `SELECT accesstoken FROM rgConfig:⟨${uuid}⟩`
  var result = await db.query(Q);
  return result[0].result[0].accesstoken;
}

export async function getCurrentUserData() {
  if(db === false) await connectToDB();
  try {
    var Q = "SELECT out.name AS name, out.rank AS rank, out.region AS region, out.tag AS tag, out.uuid AS uuid FROM playerCollection:⟨app⟩->currentPlayer FETCH out";
    var result = await db.query(Q);
    return result[0].result[0];
  } catch(e) {
    console.log(e);
  }
}

export async function getCurrentPUUID() {
  if(db === false) await connectToDB();
  
  try {
    var Q = "SELECT out.uuid AS uuid FROM playerCollection:⟨app⟩->currentPlayer FETCH out";
    var result = await db.query(Q);
    return result[0].result[0].uuid;
  } catch(e) {
    console.log(e);
  }
}

export async function getInstanceToken() {
  if(db === false) await connectToDB();
}

export async function getServiceData() {
  if(db === false) await connectToDB();
  
  var Q = `SELECT * FROM services:⟨${process.env.SERVICE_UUID}⟩`;
  var result = await db.query(Q);
  return result[0].result[0];
}

export async function updateMessageDate(unix) {
  if(db === false) await connectToDB();
  
  var Q = `SELECT * FROM services:⟨${process.env.SERVICE_UUID}⟩`;
  var result = await db.query(Q);

  await db.update(`services:⟨${process.env.SERVICE_UUID}⟩`, {
    ...result[0].result[0],
    "lastMessageUnix": unix
  })
  return result[0].result[0];
}

export async function fetchMatch(uuid) {
  if(db === false) await connectToDB();
  
  var Q = `SELECT matchInfo, players, roundResults, stats_data, teams FROM match:⟨${uuid}⟩`;
  var result = await db.query(Q);
  return result[0].result[0];
}

export async function createMatch(data) {
  ipcRenderer.send("createMatch", data);
}

export async function removeMatch(collection, uuid) {
  var puuid = await getCurrentPUUID();
  var data = await db.query(`SELECT * FROM matchIDCollection:⟨${collection}::${puuid}⟩`);

  var collections = [];

  for(var i = 0; i < data[0].result.length; i++) {
    if(data[0].result[i].matchIDs.find(str => str === uuid)) {
      collections.push(data[0].result[i].id);
    }
  }

  if(collections.length <= 1) {
    await db.query(`DELETE match:⟨${uuid}⟩`);
  }

  for(var i = 0; i < collections.length; i++) {
    var matchIDCollection = await db.query(`SELECT * FROM ${collections[i]}`);
    var newCollection = matchIDCollection[0].result[0].matchIDs;

    const index = array.indexOf(uuid);
    if (index > -1) {
      newCollection.splice(index, 1);
    }

    await db.update(`${collections[i]}`, {
      "matchIDs": newCollection
    });
  }
}