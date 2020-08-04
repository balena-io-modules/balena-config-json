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

import { cloneDeep } from 'lodash';
import { fromSharedOptions } from 'balena-sdk';

const balena = fromSharedOptions();

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
export async function getConfigPartitionInformationByType(type) {
	const manifest = await balena.models.device.getManifestBySlug(type);
	// @ts-ignore unrecognized prop
	const config = manifest.configuration?.config;

	if (config == null) {
		throw new balena.errors.BalenaInvalidDeviceType(type);
	}

	return convertFilePathDefinition(config);
}

// Transform old config format ({ logical/primary: N }) into new single-number format
var convertFilePathDefinition = function (config) {
	config = cloneDeep(config);

	if (config.partition != null && typeof config.partition === 'object') {
		// Partition numbering is now numerical, following the linux
		// conventions in 5.95 of the TLDP's system admin guide:
		// http://www.tldp.org/LDP/sag/html/partitions.html#DEV-FILES-PARTS
		if (config.partition.logical != null) {
			config.partition = config.partition.logical + 4;
		} else if (config.partition.primary != null) {
			config.partition = config.partition.primary;
		}
	}

	return config;
};
