import SurrealDB from "surrealdb.js";

var db = false;

async function connectToDB() {
  db = new SurrealDB(process.env.DB_URL);
  await db.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  });

  await db.use('app', 'main');
};

export async function executeQuery(queryStr) {
  if(db === false) await connectToDB();

  var result = await db.query(queryStr);
  return result[0].result;
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
  
  var Q = "SELECT out.name AS name, out.rank AS rank, out.region AS region, out.tag AS tag, out.uuid AS uuid FROM playerCollection:⟨app⟩->currentPlayer FETCH out";
  var result = await db.query(Q);
  return result[0].result[0];
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