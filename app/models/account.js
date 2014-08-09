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
  this.numTransacts = 0;
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

Account.deposit = function(obj, cb){
  var id = (typeof obj.id === 'string') ? Mongo.ObjectID(obj.id) : obj.id;
  var query = {_id:id};
  var fields = {balance:1, pin:1, numTransacts:1};
  var deposit = _.cloneDeep(obj);
  Account.collection.findOne(query, fields, function(err, dbObj){
    //console.log(err, dbObj, deposit);
    if(obj.pin === dbObj.pin){
      dbObj.balance += (deposit.amount * 1);
      deposit.id = dbObj.numTransacts + 1;
      deposit.fee = '';
      delete deposit.pin;
      deposit.date = new Date();
      Account.collection.update(query, {$set:{balance:dbObj.balance}, $inc:{numTransacts:1}, $push:{transactions:deposit}}, function(){
        if(cb){cb();}
      });
    }else{
      if(cb){cb();}
    }
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
