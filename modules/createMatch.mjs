import { workerData, parentPort } from "worker_threads";

async function createMatch() {
  const { data, db } = workerData;
  console.log(db);

  await db.wait();

  await db.signin({
    user: process.env.DB_USER,
    pass: process.env.DB_PASS
  });

  await db.use('app', 'main');

  var result = await db.query(`SELECT 1 FROM match:⟨${data.matchInfo.matchId}⟩`);
  if(result[0].result[0]) {
    parentPort.postMessage({ exit: true });
    return;
  }

  var allRoundResults = [];
  for(var k = 0; k < data.roundResults.length; k++) {
    var round = {
      "bombPlanter": data.roundResults[k].bombPlanter,
      "playerStats": data.roundResults[k].playerStats,
      "roundResult": data.roundResults[k].roundResult,
      "winningTeam": data.roundResults[k].winningTeam
    }
    allRoundResults.push(round);
  }

  var match = {
    matchInfo: data.matchInfo,
    players: data.players,
    roundResults: allRoundResults,
    stats_data: data.stats_data,
    teams: data.teams
  }

  var result = await db.create(`match:⟨${data.matchInfo.matchId}⟩`, match);

  parentPort.postMessage({ exit: true });
  return;
}

createMatch();