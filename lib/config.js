/*
Copyright 2016-2020 Balena Ltd.

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

/**
 * @module config
 */

import * as imagefs from 'resin-image-fs';
import * as utils from './utils';

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
export async function read(image, type) {
	const configuration = await utils.getConfigPartitionInformationByType(type);
	const file = await imagefs.readFile({
		image,
		partition: configuration.partition,
		path: configuration.path,
	});
	return JSON.parse(file);
}

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
export async function write(image, type, config) {
	config = JSON.stringify(config);
	const configuration = await utils.getConfigPartitionInformationByType(type);
	return imagefs.writeFile(
		{
			image,
			partition: configuration.partition,
			path: configuration.path,
		},
		config,
	);
}
