const { gql } = require('apollo-server-express');
const { authCheck } = require('../helpers/auth');
const User = require('../models/user')
const shortid =require('shortid')


const allUsers = async (parent, args) => await User.find({}).exec();


const profile = async (parent, args, { req }) => {
    const currentUser = await authCheck(req);
    return await User.findOne({ email: currentUser.email }).exec();
};

// -------> argus.username is  username input from client to show his data
const publicProfile = async (parent, args, { req }) => {
    return await User.findOne({ username: args.username }).exec();
};


const userCreate = async (parent, args, { req }) => {
    const currentUser = await authCheck(req);
    const user = await User.findOne({ email: currentUser.email });

    // result is **********
    return user
        ? user
        : new User({
              email: currentUser.email,
              username: shortid.generate(),
              
          }).save();
};


//update user
// parent name of mutation come from typeDfs
const userUpdate = async (parent, args, { req }) => {
    const currentUser = await authCheck(req);
    console.log(args); // -------> date sended from client form
    const updatedUser = await User.findOneAndUpdate(
        { email: currentUser.email },
        { ...args.input }, //  all fields from inputs well added to user data
        { new: true }
    ).exec();
    return updatedUser;
};




module.exports = {
    Query: {
        profile
        ,publicProfile,
         allUsers 
    },
    Mutation: {
        userCreate,
      userUpdate
    }
};


