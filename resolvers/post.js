const { gql } = require("apollo-server-express");
// const { posts } = require("../template");
const { authCheck } = require("../helpers/auth.js");

const Post = require("../models/post");
const User = require("../models/user");



// subscriptions
const POST_ADDED = 'POST_ADDED';
const POST_UPDATED = 'POST_UPDATED';
const POST_DELETED = 'POST_DELETED';


// queries

// mutation
const postCreate = async (parent, args, { req,pubsub }) => {
  //✅ first check if user is login or register and have token
  const currentUser = await authCheck(req);
  // validation

  if (args.input.content.trim() === "") throw new Error("Content is required");

  //✅ find this currendt user from database with his email
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  });

  // ✅ create new post with inputs fields and posted by the currentuser._id

  let newPost = await new Post({
    ...args.input,
    postedBy: currentUserFromDb._id,
  })
    .save()
    // {execPopulate} populate current user data from User database aftttter saved his post in database
    .then((post) => post.populate("postedBy", "_id username"));

//pubsub
pubsub.publish(POST_ADDED, { postAdded: newPost });



  //✅✅ return newPost
  return newPost;
};

// all posts

// const allPosts = async (parent, args) => {
//   return await Post.find({}).exec();
// };

// ✅✅ all posts with pagination
const allPosts = async (parent, args) => {
  const currentPage = args.page || 1;
  console.log(args);
  const perPage = 3;

  return await Post.find({})
    .skip((currentPage - 1) * perPage)
    .populate("postedBy", "username _id")
    .limit(perPage)
    .sort({ createdAt: -1 })
    .exec();
};

const postsByUser = async (parent, args, { req }) => {
  const currentUser = await authCheck(req);
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();

  return await Post.find({ postedBy: currentUserFromDb })
    .populate("postedBy", "_id username")
    .sort({ createdAt: -1 });
};

const postUpdate = async (parent, args, { req,pubsub }) => {
  const currentUser = await authCheck(req);
  //🔥 validation
  if (args.input.content.trim() === "") throw new Error("Content is requried");
  //🔥  get current user mongodb _id based in email
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();
  //🔥 _id of post to update
  const postToUpdate = await Post.findOne({ _id: args.input._id }).exec();
  //🔥🔥 if currentuser id and id of the post's postedBy user id is same, allow update
  if (currentUserFromDb._id.toString() !== postToUpdate.postedBy._id.toString())
    throw new Error("Unauthorized action");
  let updatedPost = await Post.findByIdAndUpdate(
    args.input._id,
    { ...args.input },
    { new: true }
  ).exec();

//pubsub
pubsub.publish(POST_UPDATED, {
  postUpdated: updatedPost
});

  return updatedPost;
};

const postDelete = async (parent, args, { req,pubsub }) => {
  const currentUser = await authCheck(req);
  const currentUserFromDb = await User.findOne({
    email: currentUser.email,
  }).exec();
  const postToDelete = await Post.findById({ _id: args.postId }).exec();
  if (currentUserFromDb._id.toString() !== postToDelete.postedBy._id.toString())
    throw new Error("Unauthorized action");
  let deletedPost = await Post.findByIdAndDelete({ _id: args.postId }).exec();


// pubsub
pubsub.publish(POST_DELETED, {
  postDeleted: deletedPost
})

  return deletedPost;
};

// in frontend send postId
// getSinglePost({ variables: { postId: postid } });
const singlePost = async (parent, args) => {
  return await Post.findById({ _id: args.postId })
    .populate("postedBy", "_id username")
    .exec();
};

const totalPosts = async (parent, args) =>
  await Post.find({}).estimatedDocumentCount().exec();



// or can write args.query insted query
const search = async (parent, { query }) => {
  return await Post.find({ $text: { $search: query } })
    .populate("postedBy", "username")
    .exec();
};

module.exports = {
  Query: {
    allPosts,
    postsByUser,
    singlePost,
    totalPosts,
    search,
  },
  Mutation: {
    postCreate,
    postUpdate,
    postDelete,
  },

  Subscription: {
    postAdded: {
        subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator([POST_ADDED])
    },
    postUpdated: {
        subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator([POST_UPDATED])
    },
    postDeleted: {
        subscribe: (parent, args, { pubsub }) => pubsub.asyncIterator([POST_DELETED])
    }
}



};

// const totalPosts = () => posts.length;
// // const allPosts = () => posts;

// const allPosts = async (parent, args, { req }) => {
//   // await authCheck(req);
//   return posts;
// };
