
/*
The MIT License

Copyright (c) 2015 Resin.io, Inc. https://resin.io.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

/**
 * @module config
 */
var imagefs, rindle, stringToStream, utils;

imagefs = require('resin-image-fs');

rindle = require('rindle');

stringToStream = require('string-to-stream');

utils = require('./utils');


/**
 * @summary Read a config.json from an image
 * @function
 * @public
 *
 * @param {String} image - image or drive path
 * @param {String} type - device type slug
 *
 * @fulfil {Object} - config.json
 * @returns {Promise}
 *
 * @example
 * config.read('/dev/disk2', 'raspberry-pi').then (config) ->
 * 	console.log(config)
 */

exports.read = function(image, type) {
  return utils.getConfigPartitionInformationByType(type).then(function(configuration) {
    return imagefs.read({
      image: image,
      partition: configuration.partition,
      path: configuration.path
    });
  }).then(rindle.extract).then(JSON.parse);
};


/**
 * @summary Write a config.json to an image
 * @function
 * @public
 *
 * @param {String} image - image or drive path
 * @param {String} type - device type slug
 * @param {Object} config - config.json
 *
 * @returns {Promise}
 *
 * @example
 * config.write '/dev/disk2', 'raspberry-pi',
 * 	username: 'foobar'
 * .then ->
 * 	console.log('Done!')
 */

exports.write = function(image, type, config) {
  config = JSON.stringify(config);
  return utils.getConfigPartitionInformationByType(type).then(function(configuration) {
    return imagefs.write({
      image: image,
      partition: configuration.partition,
      path: configuration.path
    }, stringToStream(config));
  }).then(rindle.wait);
};
