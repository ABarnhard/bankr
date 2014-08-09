'use strict';

var _ = require('lodash');
var async = require('async');
var Transfer = require('./transfer');

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
  this.transactions = [];
  this.transferIds = [];
}

Account.save = function(obj, cb){
  var a = new Account(obj);
  Account.collection.save(a, cb);
};

Account.findAll = function(cb){
  Account.collection.find().toArray(function(err, objs){
    var accounts = objs.map(function(o){return _.create(Account.prototype, o);});

    async.map(accounts, function(account, done){
      async.map(account.transferIds, function(tId, done1){
        Transfer.findById(tId, function(err, transfer){
          if(transfer.from === account.name){
            transfer.from = '';
          }else{
            transfer.to = '';
            transfer.fee = '';
          }
          done1(null, transfer);
        });
      }, function(err, viewTransfers){
        account.transfers = viewTransfers;
        done(err, account);
      });
    }, function(err, fullAccounts){
      cb(fullAccounts);
    });
  });
};

module.exports = Account;
