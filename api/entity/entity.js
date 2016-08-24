var seneca = require('seneca')({tag: 'mongo-test'});
var entity = require('seneca-entity');
var util = require('util');
seneca.use(entity);
seneca.use('./mongo-store', {
  uri: 'mongodb://127.0.0.1:27017/test'
});

seneca.ready(function () {
  var apple = seneca.make$('fruit');
  apple.name  = 'Pink Lady';
  apple.price = 0.99;
  apple.save$(function (err, apple) {
    if(err) return console.log(err);
    console.log("apple.id = " + apple.id);
    console.log("apple.name = " + apple.name);
    console.log("apple.price = " + apple.price);
  });
  var apple = seneca.make$('fruit');
  apple.name  = 'Cox';
  apple.price = 0.50;
  apple.save$(function (err, apple) {
    if(err) return console.log(err);
    if( ! apple.is$('fruit'))
      return console.log("Error: apple should be a fruit!");
  });
  apple.load$({id: '57bad0d3d5f51915a20575d4'}, function (err, entity) {
    console.log('here', entity)
  });
  apple.list$({name:'Pink Lad\.', limit$: 0, fields$: ['id','name','price']}, function (err, entity) {
    //    for (var i = 0, len = entity.length; i < len; i++) {
    //      apple.remove$({id: entity[i].id}, null);
    //    }


    for (var i = 0, len = entity.length; i < len; i++) {
      console.log('id:', util.inspect(entity[i].id));
      console.log('name:', util.inspect(entity[i].name));
      console.log('price:', util.inspect(entity[i].price));
      console.log();
    }


    //    console.log('id:', util.inspect(entity));
    //    console.log();
    //      console.log('id:', util.inspect(entity[0].id));
    //      console.log('name:', util.inspect(entity[0].name));
    //      console.log('length of list:', entity.length);
    //    console.log(entity[entity.length - 1].id);
    seneca.close();
  });
});
