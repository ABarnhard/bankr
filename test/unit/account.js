/* jshint expr:true */
/* global describe, it, before, beforeEach */

'use strict';

var expect = require('chai').expect;
var Account = require('../../app/models/account');
var connect = require('../../app/lib/mongodb');
var Mongo = require('mongodb');
var cp = require('child_process');
var db = 'bankr-test';

var bobId   = '100000000000000000000001';
var jimId   = '100000000000000000000002';
//var sallyId = '100000000000000000000003';

describe('Account', function(){
  before(function(done){
    connect(db, function(){
      done();
    });
  });
  beforeEach(function(done){
    cp.execFile(__dirname + '/../scripts/freshdb.sh', [db], {cwd:__dirname + '/../scripts'}, function(err, stdout, stderr){
      //console.log(err, stdout, stderr);
      done();
    });
  });
  describe('Constructor', function(){
    it('Should create a new account with correct properties', function(){
      var a = new Account({name:'Bob', color:'#FF851B', photo:'url', pin:'1234', type:'checking', deposit:'950'});

      expect(a).to.be.instanceof(Account);
      expect(a.name).to.equal('Bob');
      expect(a.opened).to.respondTo('getDay');
      expect(a.color).to.equal('#FF851B');
      expect(a.photo).to.equal('url');
      expect(a.pin).to.equal('1234');
      expect(a.type).to.equal('checking');
      expect(a.balance).to.be.closeTo(950, 0.1);
      expect(a.numTransacts).to.equal(0);
      expect(a.transactions).to.have.length(0);
      expect(a.transferIds).to.have.length(0);
    });
  });
  describe('.create', function(){
    it('should create a new account in database', function(done){
      Account.create({name:'Bob', color:'#FF851B', photo:'url', pin:'1234', type:'checking', deposit:'950'}, function(err, a){
        expect(a._id).to.be.instanceof(Mongo.ObjectID);
        done();
      });
    });
  });
  describe('.findAll', function(){
    it('should return all accounts in database', function(done){
      Account.findAll(function(err, accounts){
        expect(accounts).to.have.length(3);
        done();
      });
    });
  });
  describe('.findById', function(){
    it('should return one account from database', function(done){
      Account.findById(bobId, function(a){
        expect(a.name).to.equal('Bob');
        expect(a.transfers).to.have.length(4);
        done();
      });
    });
  });
  describe('.findByIdLite', function(){
    it('should return name, type, & _id for one account from database', function(done){
      Account.findByIdLite(bobId, function(a){
        expect(a.name).to.equal('Bob');
        expect(a.type).to.equal('checking');
        expect(Object.keys(a)).to.have.length(3);
        done();
      });
    });
  });
  describe('.deposit', function(){
  });
  describe('.withdraw', function(){
  });
  describe('.transaction', function(){
    it('should deposit funds & increase account balance', function(done){
      Account.transaction({id:bobId, type:'deposit', pin:'1234', amount:'500'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(1000, 0.1);
          expect(a.numTransacts).to.equal(3);
          expect(a.transactions).to.have.length(3);
          expect(a.transactions[2].id).to.equal(3);
          expect(a.transactions[2].date).to.respondTo('getDay');
          done();
        });
      });
    });
    it('should not deposit or increase account balance (incorrect PIN)', function(done){
      Account.transaction({id:bobId, type:'deposit', pin:'1236', amount:'500'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(500, 0.1);
          expect(a.numTransacts).to.equal(2);
          expect(a.transactions).to.have.length(2);
          done();
        });
      });
    });
    it('should perform a withdrawal', function(done){
      Account.transaction({id:bobId, type:'withdraw', pin:'1234', amount:'250'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(250, 0.1);
          expect(a.numTransacts).to.equal(3);
          expect(a.transactions).to.have.length(3);
          expect(a.transactions[2].id).to.equal(3);
          expect(a.transactions[2].date).to.respondTo('getDay');
          expect(a.transactions[2].fee).to.equal('');
          done();
        });
      });
    });
    it('should withdraw & reduce balance by amount', function(done){
      Account.transaction({id:bobId, type:'withdraw', pin:'1234', amount:'250'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(250, 0.1);
          expect(a.numTransacts).to.equal(3);
          expect(a.transactions).to.have.length(3);
          expect(a.transactions[2].id).to.equal(3);
          expect(a.transactions[2].date).to.respondTo('getDay');
          expect(a.transactions[2].fee).to.equal('');
          done();
        });
      });
    });
    it('should not reduce balance by amount (incorrect PIN)', function(done){
      Account.transaction({id:bobId, type:'withdraw', pin:'1235', amount:'250'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(500, 0.1);
          expect(a.numTransacts).to.equal(2);
          expect(a.transactions).to.have.length(2);
          done();
        });
      });
    });
    it('should reduce balance by amount & charge 50 overdraft', function(done){
      Account.transaction({id:bobId, type:'withdraw', pin:'1234', amount:'550'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(-100, 0.1);
          expect(a.numTransacts).to.equal(3);
          expect(a.transactions).to.have.length(3);
          expect(a.transactions[2].id).to.equal(3);
          expect(a.transactions[2].date).to.respondTo('getDay');
          expect(a.transactions[2].fee).to.equal(50);
          done();
        });
      });
    });
  });
  describe('.transfer', function(){
    it('should transfer funds from one account to another', function(done){
      Account.transfer({from:'Bob', to:'Jim', pin:'1234', fromId:bobId, toId:jimId, amount:'250'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(225, 0.1);
          expect(a.transferIds).to.have.length(5);
          Account.findById(jimId, function(a2){
            expect(a2.balance).to.be.closeTo(350, 0.1);
            expect(a2.transferIds).to.have.length(5);
            done();
          });
        });
      });
    });
    it('should not transfer funds from one account to another (wrong PIN)', function(done){
      Account.transfer({from:'Bob', to:'Jim', pin:'1264', fromId:bobId, toId:jimId, amount:'250'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(500, 0.1);
          expect(a.transferIds).to.have.length(4);
          Account.findById(jimId, function(a2){
            expect(a2.balance).to.be.closeTo(100, 0.1);
            expect(a2.transferIds).to.have.length(4);
            done();
          });
        });
      });
    });
    it('should not transfer funds from one account to another (Not enough money)', function(done){
      Account.transfer({from:'Bob', to:'Jim', pin:'1234', fromId:bobId, toId:jimId, amount:'1000'}, function(){
        Account.findById(bobId, function(a){
          expect(a.balance).to.be.closeTo(500, 0.1);
          expect(a.transferIds).to.have.length(4);
          Account.findById(jimId, function(a2){
            expect(a2.balance).to.be.closeTo(100, 0.1);
            expect(a2.transferIds).to.have.length(4);
            done();
          });
        });
      });
    });
  });
});
