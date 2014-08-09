'use strict';

var Account = require('../models/account');
var moment = require('moment');

exports.init = function(req, res){
  res.render('accounts/init');
};

exports.create = function(req, res){
  Account.create(req.body, function(){
    res.redirect('/accounts');
  });
};

exports.index = function(req, res){
  Account.findAll(function(err, accounts){
    res.render('accounts/index', {accounts:accounts, moment:moment});
  });
};

exports.show = function(req, res){
  Account.findById(req.params.id, function(account){
    res.render('accounts/show', {account:account, moment:moment});
  });
};
