/* jshint expr:true */
/* global describe, it, before, beforeEach */

'use strict';

var expect = require('chai').expect;
var Account = require('../../app/models/account');
var connect = require('../../app/lib/mongodb');
var cp = require('child_process');
var db = 'bankr-test';

describe('Account', function(){
  before(function(done){
    connect(db, function(){
      done();
    });
  });
  beforeEach(function(done){
    cp.execFile(__dirname + '/../scripts/freshdb.sh', [db], {cwd: __dirname + '/../scripts'}, function(){
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
      expect(a.transactions).to.have.length(0);
      expect(a.transfers).to.have.length(0);
    });
  });
});
