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

import * as imagefs from 'balena-image-fs';
import * as utils from './utils';
import { promisify } from 'util';

export interface ConfigJson {
	[key: string]: any;
}

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
export async function read(image: string, type: string): Promise<ConfigJson> {
	const configuration = await utils.getConfigPartitionInformationByType(type);
	const file = await imagefs.interact(
		image,
		configuration.partition,
		async (fs) => {
			return await promisify(fs.readFile)(configuration.path, {
				encoding: 'utf8',
			});
		},
	);
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
export async function write(image: string, type: string, config: ConfigJson) {
	const configStr = JSON.stringify(config);
	const configuration = await utils.getConfigPartitionInformationByType(type);
	await imagefs.interact(image, configuration.partition, async (fs) => {
		return await promisify(fs.writeFile)(configuration.path, configStr);
	});
}
