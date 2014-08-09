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

