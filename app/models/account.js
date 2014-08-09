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
  id = makeOid(id);
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
  var id = makeOid(obj.id);
  var query = {_id:id}, fields = {fields:{balance:1, pin:1, numTransacts:1}};
  var deposit = _.cloneDeep(obj);
  deposit.amount *= 1;
  Account.collection.findOne(query, fields, function(err, a){
    //console.log(err, dbObj, deposit);
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
  Account.collection.findOne({_id:obj.fromId}, {fields:{balance:1, pin:1}}, function(err, a){
    console.log(a);
    if(obj.pin === a.pin && a.balance >= total){
      a.balance -= total;
      Transfer.save(obj, function(err, t){
        console.log(t);
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
