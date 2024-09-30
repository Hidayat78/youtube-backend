import dotenv from "dotenv";

import connectDB from "./src/db/indexDB.js";

dotenv.config({
  path: "./.env",
});
connectDB();

/*
 const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`our port is running at ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error aagya", error);
  }
})();

*/
