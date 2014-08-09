'use strict';

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
  this.transfers = [];
}

Account.save = function(obj, cb){
  var a = new Account(obj);
  Account.collection.save(a, cb);
};

module.exports = Account;
