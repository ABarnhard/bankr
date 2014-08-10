/* jshint expr:true */
/* global describe, it */

'use strict';

var expect = require('chai').expect;
var helper = require('../../app/helpers/accounts_helper');

describe('Accounts_Helper', function(){
  describe('.wd', function(){
    it('should return #ff4136', function(){
      var test = helper.wd('withdraw');
      expect(test).to.equal('#ff4136');
    });
    it('should return #2ecc40', function(){
      var test = helper.wd('deposit');
      expect(test).to.equal('#2ecc40');
    });
  });
  describe('.tf', function(){
    it('should return #7fdbff', function(){
      var test = helper.tf('Jeff');
      expect(test).to.equal('#7fdbff');
    });
    it('should return #ff851b', function(){
      var test = helper.tf('');
      expect(test).to.equal('#ff851b');
    });
  });
  describe('.tFrom', function(){
    it('should return Bob', function(){
      var objs = [{_id:'555', name:'Bob'}];
      var id = '555';
      var test = helper.tFrom(objs, id);
      expect(test).to.equal('Bob');
    });
  });
  describe('.tOptions', function(){
    it('should return HTML option tag with correct attributes', function(){
      var objs = [{_id:'555', name:'Bob'}, {_id:'888', name:'Sally'}];
      var id = '555';
      var test = helper.tOptions(objs, id);
      expect(test).to.equal('<option value="888">Sally</option>');
    });
  });
  describe('.currencyFormat', function(){
    it('should format a number into currency', function(){
      var num = 1000;
      var test = helper.currencyFormat(num);
      expect(test).to.equal('$1,000.00');
    });
  });
});
