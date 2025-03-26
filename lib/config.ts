/*
Copyright 2016-2021 Balena Ltd.

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
import { getBootPartition, configJsonPath } from './utils';
import { promisify } from 'util';

export { getBootPartition };

export interface ConfigJson {
	[key: string]: any;
}

/**
 * @summary Read a config.json from an image
 * @function
 * @public
 *
 * @param {String} image - image or drive path
 * @param {String} _type - ignored (device type, no longer required)
 *
 * @fulfil {Object} - config.json
 * @returns {Promise}
 *
 * @example
 * config.read('/dev/disk2', 'raspberry-pi').then (config) ->
 * 	console.log(config)
 */
export async function read(
	image: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Drop in the next major
	_type?: string,
): Promise<ConfigJson> {
	const bootPartNumber = await getBootPartition(image);
	const file = await imagefs.interact(image, bootPartNumber, async (fs) => {
		return await promisify(fs.readFile)(configJsonPath, {
			encoding: 'utf8',
		});
	});
	return JSON.parse(file);
}

/**
 * @summary Write a config.json to an image
 * @function
 * @public
 *
 * @param {String} image - image or drive path
 * @param {String} _type - ignored (device type, no longer required)
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
export async function write(
	image: string,
	// TODO: Drop in the next major
	_type: string | undefined,
	config: ConfigJson,
) {
	const configStr = JSON.stringify(config);
	const bootPartNumber = await getBootPartition(image);
	await imagefs.interact(image, bootPartNumber, async (fs) => {
		await promisify(fs.writeFile)(configJsonPath, configStr);
	});
}
