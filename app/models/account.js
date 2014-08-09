'use strict';

var _ = require('lodash');
var async = require('async');
var Transfer = require('./transfer');
var Mongo = require('mongodb');

// create getter for db collection
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
  Account.collection.find({}, {sort:{name:1}, fields:{name:1, color:1, balance:1, type:1, opened:1}}).toArray(function(err, accounts){
    cb(err, accounts);
  });
};

Account.findById = function(id, cb){
  id = makeOid(id);
  Account.collection.findOne({_id:id}, function(err, account){
    // attach associated transfer objects for display
    async.map(account.transferIds, function(tId, done){
      makeTransfer(tId, done, account.name);
    }, function(err, transfers){
      account.transfers = transfers;
      cb(account);
    });
  });
};

Account.deposit = function(obj, cb){
  var id = makeOid(obj.id);
  var query = {_id:id};
  // only return the listed fields from database
  var fields = {fields:{balance:1, pin:1, numTransacts:1}};
  // make copy of object since will be altering properties
  var deposit = _.cloneDeep(obj);
  deposit.amount *= 1;
  Account.collection.findOne(query, fields, function(err, a){
    //console.log(err, dbObj, deposit);
    // if the pin matches, perform deposit and update record in dbase
    if(obj.pin === a.pin){
      a.balance += deposit.amount;
      deposit.id = a.numTransacts + 1;
      deposit.fee = '';
      deposit.date = new Date();
      delete deposit.pin;
      Account.collection.update(query, {$set:{balance:a.balance}, $inc:{numTransacts:1}, $push:{transactions:deposit}}, function(){
        if(cb){cb();}
      });
    }else{
      if(cb){cb();}
    }
  });
};

Account.withdraw = function(obj, cb){
  var id = makeOid(obj.id);
  var query = {_id:id}, fields = {fields:{balance:1, pin:1, numTransacts:1}};
  var withdraw = _.cloneDeep(obj);
  withdraw.amount *= 1;
  Account.collection.findOne(query, fields, function(err, a){
    //console.log(err, a, withdraw);
    if(obj.pin === a.pin){
      a.balance -= withdraw.amount;
      a.balance -= (a.balance < 0) ? 50 : 0;
      withdraw.id = a.numTransacts + 1;
      withdraw.fee = (a.balance < 0) ? 50 : '';
      withdraw.date = new Date();
      delete withdraw.pin;
      Account.collection.update(query, {$set:{balance:a.balance}, $inc:{numTransacts:1}, $push:{transactions:withdraw}}, function(){
        if(cb){cb();}
      });
    }else{
      if(cb){cb();}
    }
  });
};

Account.transaction = function(obj, cb){
  // type of transaction switch to move logic from controller into model
  if(obj.type === 'deposit'){
    Account.deposit(obj, cb);
  }else{
    Account.withdraw(obj, cb);
  }
};

Account.transfer = function(obj, cb){
  obj.fromId = makeOid(obj.fromId);
  obj.toId = makeOid(obj.toId);
  obj.amount *= 1;
  var total = obj.amount + 25;
  // return the balance & pin of the transferor from dbase
  Account.collection.findOne({_id:obj.fromId}, {fields:{balance:1, pin:1}}, function(err, a){
    //console.log(a);
    // if pin matches and sufficient funds, perform transfer
    if(obj.pin === a.pin && a.balance >= total){
      a.balance -= total;
      // create new transfer object
      Transfer.save(obj, function(err, t){
        //console.log(t);
        // update both the transferor & transferee in dbase with adjusted balance and new transferId
        Account.collection.update({_id:a._id}, {$set:{balance:a.balance}, $push:{transferIds:t._id}}, function(){
          Account.collection.update({_id:obj.toId}, {$inc:{balance:obj.amount}, $push:{transferIds:t._id}}, function(){
            if(cb){cb();}
          });
        });
      });
    }else{
      if(cb){cb();}
    }
  });
};

module.exports = Account;

// Helper Functions

function makeOid(id){
  return (typeof id === 'string') ? Mongo.ObjectID(id) : id;
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
