'use strict';

var Mongo = require('mongodb');

Object.defineProperty(Transfer, 'collection', {
  get: function(){return global.mongodb.collection('transfers');}
});

function Transfer(obj){
  this.id = obj.id * 1;
  this.date = new Date();
  this.from = obj.from;
  this.fromId = (typeof obj.fromId === 'string') ? Mongo.ObjectID(obj.fromId) : obj.fromId;
  this.to = obj.to;
  this.toId = (typeof obj.toId === 'string') ? Mongo.ObjectID(obj.toId) : obj.toId;
  this.amount = obj.amount * 1;
  this.fee = 25;
}

Transfer.save = function(obj, cb){
  var t = new Transfer(obj);
  Transfer.collection.save(t, cb);
};

Transfer.findById = function(id, cb){
  id = (typeof id === 'string') ? Mongo.ObjectID(id) : id;
  Transfer.collection.findOne({_id:id}, cb);
};

module.exports = Transfer;
