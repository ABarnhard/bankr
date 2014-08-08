/* jshint expr:true */
/* global describe, it, before, beforeEach */

'use strict';

var expect = require('chai').expect;
var Transfer = require('../../app/models/transfer');
var Mongo = require('mongodb');
var connect = require('../../app/lib/mongodb');
var cp = require('child_process');
var db = 'bankr-test';

describe('Transfer', function(){
  before(function(done){
    connect(db, function(){
      done();
    });
  });
  beforeEach(function(done){
    cp.execFile(__dirname + '/../scripts/freshdb.sh', [db], {cwd:__dirname + '/../scripts'}, function(){
      done();
    });
  });
  describe('Controller', function(){
    it('Should create a new transfer object with correct properties', function(){
      var t = new Transfer({id:'1', from:'Bob', fromId:'000000000000000000000001', to:'Sally', toId:'000000000000000000000003', amount:'500'});

      expect(t).to.be.instanceof(Transfer);
      expect(t.id).to.equal(1);
      expect(t.date).to.respondTo('getDay');
      expect(t.from).to.equal('Bob');
      expect(t.to).to.equal('Sally');
      expect(t.fromId).to.be.instanceof(Mongo.ObjectID);
      expect(t.toId).to.be.instanceof(Mongo.ObjectID);
      expect(t.amount).to.equal(500);
    });
  });
  describe('.save', function(){
    it('should save a transfer into the database', function(done){
      Transfer.save({id:'10', from:'Bob', fromId:'000000000000000000000001', to:'Sally', toId:'000000000000000000000003', amount:'500'}, function(err, t){
        expect(t._id).to.be.instanceof(Mongo.ObjectID);
        done();
      });
    });
  });
});
