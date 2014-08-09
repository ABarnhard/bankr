/* jshint expr:true */
/* global describe, it, before, beforeEach */

'use strict';

var expect = require('chai').expect;
var Account = require('../../app/models/account');
var connect = require('../../app/lib/mongodb');
var Mongo = require('mongodb');
var cp = require('child_process');
var db = 'bankr-test';

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
        expect(accounts[0].transfers[0].id).to.equal(1);
        done();
      });
    });
  });
  describe('.findById', function(){
    it('should return one account from database', function(done){
      Account.findById('100000000000000000000001', function(a){
        expect(a.name).to.equal('Bob');
        expect(a.transfers).to.have.length(4);
        done();
      });
    });
  });
  describe('.deposit', function(){
    it('should increase account balance', function(done){
      Account.deposit({id:'100000000000000000000001', type:'deposit', pin:'1234', amount:'500'}, function(){
        Account.findById('100000000000000000000001', function(a){
          expect(a.balance).to.be.closeTo(1000, 0.1);
          expect(a.numTransacts).to.equal(3);
          expect(a.transactions).to.have.length(3);
          expect(a.transactions[2].id).to.equal(3);
          done();
        });
      });
    });
  });
});
