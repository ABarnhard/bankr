'use strict';

exports.wd = function(type){
  if(type === 'withdraw'){
    return '#ff4136';
  }else{
    return '#2ecc40';
  }
};

exports.tf = function(from){
  if(from !== ''){
    return '#7fdbff';
  }else{
    return '#ff851b';
  }
};

exports.tFrom = function(accounts, id){
  var index = accounts.map(function(o){return o._id.toString();}).indexOf(id);
  return accounts[index].name;
};

exports.tOptions = function(accounts, id){
  var index = accounts.map(function(o){return o._id.toString();}).indexOf(id);
  accounts.splice(index, 1);
  var options = accounts.map(function(a){return '<option value="' + a._id.toString() + '">' + a.name + '</option>';});
  //console.log(options.join(''));
  return options.join('');
};

