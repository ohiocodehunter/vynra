const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://evercoderbykaran_db_user:Q4l4Ui2PYtr3Punr@vynradb.chcailh.mongodb.net/?appName=vynraDB";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("test"); 
    const result = await database.collection("videos").updateOne(
      { title: "Ramri chori che", status: "processing" },
      { $set: { status: "failed" } }
    );
    console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s)`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
