const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://evercoderbykaran_db_user:Q4l4Ui2PYtr3Punr@vynradb.chcailh.mongodb.net/?appName=vynraDB";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();
    const db = client.db("test"); 
    const videos = db.collection("videos");
    const processingVideos = await videos.find({ status: "processing" }).toArray();
    console.log("Processing videos count:", processingVideos.length);
    if(processingVideos.length > 0) {
      console.log(processingVideos[0]);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
