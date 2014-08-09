'use strict';

var _ = require('lodash');
var async = require('async');
var Transfer = require('./transfer');
var Mongo = require('mongodb');

Object.defineProperty(Account, 'collection', {
  get: function(){return global.mongodb.collection('accounts');}
});

function Account(obj){
  this.name = obj.name;
  this.opened = new Date();
  this.color = obj.color;
  this.photo = obj.photo;
  this.type = obj.type;
  this.pin = obj.pin;
  this.balance = obj.deposit * 1;
  this.numTrans = 0;
  this.transactions = [];
  this.transferIds = [];
}

Account.create = function(obj, cb){
  var a = new Account(obj);
  Account.collection.save(a, cb);
};

Account.findAll = function(cb){
  Account.collection.find().toArray(function(err, objs){
    var accounts = objs.map(function(o){return _.create(Account.prototype, o);});
    async.map(accounts, makeAccount, cb);
  });
};

Account.findById = function(id, cb){
  id = (typeof id === 'string') ? Mongo.ObjectID(id) : id;
  Account.collection.findOne({_id:id}, function(err, obj){
    var account = _.create(Account.prototype, obj);
    async.map(account.transferIds, function(tId, done){
      makeTransfer(tId, done, account.name);
    }, function(err, transfers){
      account.transfers = transfers;
      cb(account);
    });
  });
};

module.exports = Account;

// Helper Functions

function makeAccount(account, cb){
  async.map(account.transferIds, function(tId, done){
    makeTransfer(tId, done, account.name);
  }, function(err, transfers){
    //console.log(transfers);
    account.transfers = transfers;
    cb(err, account);
  });
}

function makeTransfer(tId, cb, name){
  Transfer.findById(tId, function(err, transfer){
    if(transfer.from === name){
      transfer.from = '';
    }else{
      transfer.to = '';
      transfer.fee = '';
    }
    //console.log(name, transfer);
    cb(null, transfer);
  });
}
