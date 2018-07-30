
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var convertFilePathDefinition, resin, _;

_ = require('lodash');

resin = require('resin-sdk-preconfigured');


/**
 * @summary Get config partition information
 * @function
 * @protected
 *
 * @param {String} type - device type slug
 * @fulfil {Object} - config partition information
 * @returns {Promise}
 *
 * @example
 * utils.getConfigPartitionInformationByType('raspberry-pi').then (configuration) ->
 * 	console.log(configuration.partition)
 * 	console.log(configuration.path)
 */

exports.getConfigPartitionInformationByType = function(type) {
  return resin.models.device.getManifestBySlug(type).then(function(manifest) {
    var config, _ref;
    config = (_ref = manifest.configuration) != null ? _ref.config : void 0;
    if (config == null) {
      throw new Error("Unsupported device type: " + type);
    }
    return convertFilePathDefinition(config);
  });
};

convertFilePathDefinition = function(config) {
  config = _.cloneDeep(config);
  if (_.isObject(config.partition)) {
    if (config.partition.logical != null) {
      config.partition = config.partition.logical + 4;
    } else if (config.partition.primary != null) {
      config.partition = config.partition.primary;
    }
  }
  return config;
};
