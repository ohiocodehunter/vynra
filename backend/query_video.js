const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://evercoderbykaran_db_user:Q4l4Ui2PYtr3Punr@vynradb.chcailh.mongodb.net/?appName=vynraDB";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const database = client.db("test"); // Mongoose uses 'test' by default if no db name is specified, wait let's check
    const collections = await database.listCollections().toArray();
    console.log(collections.map(c => c.name));
    
    const videos = await database.collection("videos").find({}).toArray();
    console.log(videos);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
