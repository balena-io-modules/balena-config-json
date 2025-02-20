/**
 * @license
 * Copyright 2021 Balena Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { expect } from 'chai';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

import { read, write } from '../build/config';
import { getBootPartition } from '../build/utils';
import { downloadOS, extractFromZipArchive, isZipFile } from './utils';

import type { BalenaSDK, DeviceType } from 'balena-sdk';

const fullTest = false;
const quickTestDeviceTypes = [
	'raspberrypi3', // very popular with partition number 1, non-flasher image
	'intel-nuc', // very popular with partition number 1, flasher image
	// Intel-Edison is an odd one, needs unzipping the downloaded image to extract
	// 'resin-image-edison.hddimg', and that image contains an empty partition table!
	'jetson-xavier', // largest partition number, 37
	'surface-go', // old image with .prod filename format
];

describe('balena-config-json', function () {
	let sdk: BalenaSDK;
	let deviceTypes: DeviceType[];

	this.beforeAll(async () => {
		const { fromSharedOptions } = await import('balena-sdk');
		sdk = fromSharedOptions();
		deviceTypes = (
			await sdk.models.deviceType.getAllSupported({
				$select: ['slug', 'name'],
			})
		).sort((d1, d2) => d1.slug.localeCompare(d2.slug));
	});

	it('should report the expected partition number for selected device types', async () => {
		const testedDevices: string[] = [];
		for (const deviceType of deviceTypes) {
			const slug = deviceType.slug;
			if (!fullTest && !quickTestDeviceTypes.includes(slug)) {
				continue;
			}
			const expectedConfig = expectedConfigBySlug[slug];
			if (!expectedConfig) {
				console.error(
					`[warn] Expected partition number not available for device type "${slug}" - skipping`,
				);
				continue;
			}
			// expectedPartNumber may be undefined, e.g. for the Intel Edison
			// that has an empty partition table
			const part = expectedConfig.config.partition;
			const expectedPartNumber: number | undefined =
				typeof part === 'number'
					? part
					: typeof part === 'object'
					? part.primary
					: part;
			console.error(
				`[info] Testing "${slug}" (expected partition number: ${expectedPartNumber})`,
			);
			const imgPath = await getImageForDeviceType(sdk, slug);
			const partNumber: number | undefined = await getBootPartition(imgPath);
			expect(partNumber).to.equal(expectedPartNumber);

			testedDevices.push(slug);
		}
		expect(testedDevices).to.include.members(quickTestDeviceTypes);
	}).timeout(0);

	it('should read and write config.json for selected device types', async () => {
		// these device type slugs don't have OS images for download
		const exclude = ['generic', 'generic-aarch64'];
		const testedDevices: string[] = [];
		for (const deviceType of deviceTypes) {
			const slug = deviceType.slug;
			if (
				exclude.includes(slug) ||
				(!fullTest && !quickTestDeviceTypes.includes(slug))
			) {
				continue;
			}
			console.error(`[info] Testing "${slug}" (read/write/read 'config.json')`);
			const imgPath = await getImageForDeviceType(sdk, slug);

			let config = await read(imgPath, slug);
			expect(config.deviceType).to.equal(slug);

			const randomStr = randomBytes(16).toString('hex');
			config['test-random-bytes'] = randomStr;
			await write(imgPath, slug, config);

			config = await read(imgPath, slug);
			expect(config['test-random-bytes']).to.equal(randomStr);
			expect(config.deviceType).to.equal(slug);

			testedDevices.push(slug);
		}
		expect(testedDevices).to.include.members(quickTestDeviceTypes);
	}).timeout(30300);
});

/**
 * Create a cache folder for storing balenaOS downloads. If the relevant
 * balenaOS image file does not exist in the cache folder, download it.
 * For device types that specify an image file to be extracted from a zip
 * archive, do the extraction as well.
 *
 * @returns Path to the downloaded (and possibly extracted) image file.
 */
async function getImageForDeviceType(sdk: BalenaSDK, deviceType: string) {
	const cacheDir = path.join(
		await sdk.settings.get('dataDirectory'),
		'cache',
		'balena-config-json-e2e',
	);
	await fs.mkdir(cacheDir, { recursive: true });
	const imageFiles = await fs.readdir(cacheDir);
	const prefix = `balenaOS-${deviceType}-`;
	// image file format: balenaOS-jetson-xavier-6.0.13.img
	// some older images still include '.prod', like balenaOS-surface-go-2.83.18+rev1.prod.img
	const imgFile = imageFiles.find(
		(name) =>
			name.startsWith(prefix) &&
			name
				.substring(prefix.length)
				.match(/\d+\.\d+\.\d+(\+rev\d+)?(\.prod)?\.img/),
	);
	let imgPath: string;
	if (imgFile) {
		imgPath = path.join(cacheDir, imgFile);
		if (process.env.DEBUG) {
			console.error(`[debug] Found "${imgPath}", skipping download.`);
		}
	} else {
		const version = await sdk.models.os.getMaxSatisfyingVersion(
			deviceType,
			'latest',
		);
		imgPath = path.join(cacheDir, `balenaOS-${deviceType}-${version}.img`);
		await downloadOS(sdk, deviceType, imgPath);
	}
	const innerImgPath = expectedConfigBySlug[deviceType]?.config.image;
	if (typeof innerImgPath === 'string' && (await isZipFile(imgPath))) {
		const extractDir = path.dirname(imgPath);
		await extractFromZipArchive(imgPath, extractDir, [innerImgPath]);
		imgPath = path.join(extractDir, innerImgPath);
	}
	return imgPath;
}

/**
 * This list was generated with the deprecated `getManifestBySlug` method:
 *   for (const dt of deviceTypes) {
 *     const manifest = await getBalenaSdk().models.device.getManifestBySlug(dt.slug);
 *     console.error(`${dt.slug}: ${JSON.stringify((manifest as any).configuration)}`);
 *   }
 */
const expectedConfigBySlug: {
	[slug: string]:
		| undefined
		| {
				config: {
					partition?: number | { primary: number; logical?: number };
					image?: string;
				};
		  };
} = {
	'advantech-ecu1370': { config: { partition: { primary: 1 } } },
	'astro-tx2': { config: { partition: { primary: 1 } } },
	'asus-tinker-board': { config: { partition: { primary: 1 } } },
	'asus-tinker-board-s': { config: { partition: { primary: 1 } } },
	'asus-tinker-edge-t': { config: { partition: { primary: 1 } } },
	'bananapi-m1-plus': { config: { partition: { primary: 1 } } },
	'beaglebone-black': { config: { partition: { primary: 1 } } },
	'beaglebone-green': { config: { partition: { primary: 1 } } },
	'beaglebone-green-gateway': { config: { partition: { primary: 1 } } },
	'beaglebone-green-wifi': { config: { partition: { primary: 1 } } },
	'beaglebone-pocket': { config: { partition: { primary: 1 } } },
	beagleplay: { config: { partition: { primary: 1 } } },
	'bluechiptechnology-db1': { config: { partition: { primary: 7 } } },
	'bluechiptechnology-tm3': { config: { partition: { primary: 1 } } },
	'ccimx8x-sbc-pro': { config: { partition: { primary: 1 } } },
	'cl-som-imx8': { config: { partition: { primary: 1 } } },
	'coral-dev': { config: { partition: { primary: 1 } } },
	'etcher-pro': { config: { partition: { primary: 1 } } },
	'generic-aarch64': undefined,
	'generic-amd64': { config: { partition: { primary: 1 } } },
	'genericx86-64-ext': { config: { partition: { primary: 1 } } },
	'imx6ul-var-dart': { config: { partition: { primary: 1 } } },
	'imx7-var-som': { config: { partition: { primary: 1 } } },
	'imx8m-var-dart': { config: { partition: { primary: 1 } } },
	'imx8mm-var-dart': { config: { partition: { primary: 1 } } },
	'intel-nuc': { config: { partition: { primary: 1 } } },
	'iot-gate-imx8': { config: { partition: { primary: 1 } } },
	'jetson-agx-orin-devkit': { config: { partition: { primary: 6 } } },
	'jetson-agx-orin-devkit-64gb': { config: { partition: { primary: 1 } } },
	'jetson-nano': { config: { partition: 12 } },
	'jetson-nano-2gb-devkit': { config: { partition: 14 } },
	'jetson-nano-emmc': { config: { partition: 12 } },
	'jetson-orin-nano-devkit-nvme': { config: { partition: { primary: 1 } } },
	'jetson-orin-nano-seeed-j3010': { config: { partition: { primary: 1 } } },
	'jetson-orin-nx-seeed-j4012': { config: { partition: { primary: 1 } } },
	'jetson-orin-nx-xavier-nx-devkit': { config: { partition: { primary: 1 } } },
	'jetson-tx2': { config: { partition: { primary: 1 } } },
	'jetson-tx2-nx-devkit': { config: { partition: { primary: 24 } } },
	'jetson-xavier': { config: { partition: { primary: 37 } } },
	'jetson-xavier-nx-devkit': { config: { partition: { primary: 9 } } },
	'jetson-xavier-nx-devkit-emmc': { config: { partition: { primary: 9 } } },
	'jetson-xavier-nx-devkit-seeed-2mic-hat': {
		config: { partition: { primary: 9 } },
	},
	'jn30b-nano': { config: { partition: 12 } },
	'kontron-mx8mm': { config: { partition: { primary: 1 } } },
	'n510-tx2': { config: { partition: { primary: 1 } } },
	'nanopc-t4': { config: { partition: { primary: 1 } } },
	'nanopi-neo-air': { config: { partition: { primary: 1 } } },
	'nanopi-r2c': { config: { partition: 4 } },
	'nanopi-r2s': { config: { partition: 4 } },
	nitrogen8mm: { config: { partition: { primary: 1 } } },
	'npe-x500-m3': { config: { partition: { primary: 1 } } },
	'odroid-xu4': { config: { partition: { primary: 1 } } },
	'orange-pi-one': { config: { partition: { primary: 1 } } },
	'orange-pi-zero': { config: { partition: { primary: 1 } } },
	'orangepi-plus2': { config: { partition: { primary: 1 } } },
	owa5x: { config: { partition: { primary: 1 } } },
	'photon-nano': { config: { partition: 12 } },
	'photon-tx2-nx': { config: { partition: { primary: 24 } } },
	'photon-xavier-nx': { config: { partition: { primary: 9 } } },
	'phyboard-lyra-am62xx-2': { config: { partition: { primary: 1 } } },
	qemux86: { config: { partition: { primary: 1 } } },
	'qemux86-64': { config: { partition: { primary: 1 } } },
	'raspberry-pi': { config: { partition: { primary: 1 } } },
	'raspberry-pi2': { config: { partition: { primary: 1 } } },
	raspberrypi3: { config: { partition: { primary: 1 } } },
	'raspberrypi3-64': { config: { partition: { primary: 1 } } },
	'raspberrypi4-64': { config: { partition: { primary: 1 } } },
	'raspberrypi400-64': { config: { partition: { primary: 1 } } },
	raspberrypi5: { config: { partition: { primary: 1 } } },
	'raspberrypicm4-ioboard': { config: { partition: { primary: 1 } } },
	'revpi-connect': { config: { partition: { primary: 1 } } },
	'revpi-connect-4': { config: { partition: { primary: 1 } } },
	'revpi-connect-s': { config: { partition: { primary: 1 } } },
	'revpi-core-3': { config: { partition: { primary: 1 } } },
	'rockpi-4b-rk3399': { config: { partition: 4 } },
	rockpro64: { config: { partition: 1 } },
	skx2: { config: { partition: { primary: 1 } } },
	'smarc-px30': { config: { partition: { primary: 1 } } },
	'spacely-tx2': { config: { partition: { primary: 1 } } },
	'surface-go': { config: { partition: { primary: 1 } } },
	'surface-pro-6': { config: { partition: { primary: 1 } } },
	'up-board': { config: { partition: { primary: 1 } } },
	'var-som-mx6': { config: { partition: { primary: 1 } } },
};
