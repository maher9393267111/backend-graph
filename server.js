const express = require("express");
const { ApolloServer,PubSub } = require("apollo-server-express");


const http = require("http");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary");
const { authCheckMiddleware } = require("./helpers/auth");
// old>>>>>>> const { fileLoader, mergeTypes, mergeResolvers } = require('merge-graphql-schemas');
const { mergeTypeDefs, mergeResolvers } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");

const { authCheck } = require("./helpers/auth");
const app = express();
require("dotenv").config();

// middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// typeDefs

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "./typeDefs"))
);
// resolvers
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "./resolvers"))
);


const pubsub = new PubSub();

// graphql server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req, pubsub })
});

// applyMiddleware method connects ApolloServer to a specific HTTP framework ie: express
apolloServer.applyMiddleware({ app });

// server
const httpserver = http.createServer(app);
apolloServer.installSubscriptionHandlers(httpserver);











//  afteeeeer Update 🔥🔥🔥🔥🔥🔥🔥🔥  graphql server
// let apolloServer = null;
// async function startServer() {
//   apolloServer = new ApolloServer({
//     typeDefs,
//     resolvers,
//     context: ({ req }) => ({ req, pubsub }),
//     // context: ({ req, res }) => ({ req, res }),
//   });

//   //   🔥🔥🔥🔥🔥🔥🔥🔥

//   await apolloServer.start();
//   apolloServer.applyMiddleware({ app });
//   const httpServer = http.createServer(app);
// apolloServer.installSubscriptionHandlers(httpServer);

 
// }

// startServer();


const server = new ApolloServer({
  typeDefs,
  resolvers ,
  context: ({ req }) => ({ req, pubsub }),

})


 server.start();
server.applyMiddleware({ app });


// rest endpoint
app.get("/rest", function (req, res) {
  res.json({
    data: "you hit rest endpoint great!",
  });
});

//cloudinary upload images

// upload
app.post("/uploadimages", authCheckMiddleware, (req, res) => {
  cloudinary.uploader.upload(
    req.body.image,
    (result) => {
      res.send({
        url: result.secure_url,
        public_id: result.public_id,
      });
    },
    {
      public_id: `${Date.now()}`, // public name
      resource_type: "auto", // JPEG, PNG
    }
  );
});

// remove image
app.post("/removeimage", authCheckMiddleware, (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error });
    res.send("ok");
  });
});

// mongDb connection

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB Connected 🚀"));

// listen on port
httpserver.listen(process.env.PORT, function () {
  console.log(`server is ready at http://localhost:${process.env.PORT} ✅`);
  console.log(
    `graphql server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}✅`  );
    console.log(`subscription is ready at http://localhost:${process.env.PORT}${apolloServer.subscriptionsPath}🚀`);
});

// // graphql server
// const apolloServer = new ApolloServer({
//     typeDefs,
//     resolvers
// });

// // applyMiddleware method connects ApolloServer to a specific HTTP framework ie: express
// apolloServer.applyMiddleware({ app });

// // server
// const httpserver = http.createServer(app);

// // rest endpoint
// app.get('/rest', function(req, res) {
//     res.json({
//         data: 'you hit rest endpoint great!'
//     });
// });

// // port
// app.listen(process.env.PORT, function() {
//     console.log(`server is ready at http://localhost:${process.env.PORT}`);
//     console.log(`graphql server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`);
// });
