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

import * as imagefs from 'balena-image-fs';
import * as filedisk from 'file-disk';
import type { GetPartitionsResult } from 'partitioninfo';
import { getPartitions } from 'partitioninfo';
import { promisify } from 'util';

export const configJsonPath = '/config.json';
const bootMarker = '/device-type.json';

/**
 * Returns the boot partition number of the given image, or 'undefined'
 * if the partition table is empty or missing.
 * @param imagePath Local filesystem path to a balenaOS image file
 */
export async function getBootPartition(
	imagePath: string,
): Promise<number | undefined> {
	return await filedisk.withOpenFile<number | undefined>(
		imagePath,
		'r',
		async (handle) => {
			const disk = new filedisk.FileDisk(handle, true, false, false);
			const partitionInfo = await getPartitions(disk, {
				includeExtended: false,
				getLogical: true,
			});
			const { partitions } = partitionInfo;

			// Some devices (or only the Intel Edison's `resin-image-edison.hddimg`
			// image file?) have an empty partition table. In this case, return
			// `undefined` which is then treated specially by `balena-image-fs`.
			if (!partitions?.length) {
				return;
			}
			let bootPart = await findBootPartitionByName(
				partitionInfo,
				disk,
				imagePath,
			);
			if (bootPart == null) {
				const partNumber = await findBootPartitionByContents(
					disk,
					partitionInfo,
					imagePath,
				);
				bootPart = {
					index: partNumber,
					name: '',
				};
			}

			// Warn if the partition found does not have a 'config.json' file
			if (!(await hasFile(disk, bootPart.index, configJsonPath))) {
				const details = bootPart.name
					? `"${bootPart.name}" (${bootPart.index})`
					: `'${bootPart.index}'`;
				console.error(`\
[warn] "${imagePath}":
[warn]   Could not find a previous "${configJsonPath}" file in partition ${details}.
[warn]   Proceeding anyway, but this is unexpected.`);
			}

			return bootPart.index;
		},
	);
}

// Find partition by name on GPT or by label on MBR.
async function findBootPartitionByName(
	partitionInfo: GetPartitionsResult,
	fileDisk: filedisk.FileDisk,
	imagePath: string,
) {
	const bootNames = ['resin-boot', 'flash-boot', 'balena-boot'];
	const result = imagefs.findPartition(fileDisk, partitionInfo, bootNames);
	if (result == null) {
		console.error(`\
[warn] "${imagePath}":
[warn]   Found partition table with ${partitionInfo.partitions.length} partitions,
[warn]   but none with a name/label in ['${bootNames.join("', '")}'].
[warn]   Will scan all partitions for contents.`);
	}
	return result;
}

async function findBootPartitionByContents(
	disk: filedisk.FileDisk,
	partitionInfo: GetPartitionsResult,
	imagePath: string,
): Promise<number> {
	const { partitions } = partitionInfo;
	for (const { index } of partitions) {
		if (await hasFile(disk, index, bootMarker)) {
			return index;
		}
	}
	console.error(`\
[warn] "${imagePath}":
[warn]   ${partitions.length} partition(s) found, but none containing file "${bootMarker}".
[warn]   Assuming default boot partition number '1'.`);
	return 1;
}

async function hasFile(
	disk: filedisk.FileDisk,
	partitionNumber: number,
	filePath: string,
): Promise<boolean> {
	let result: boolean;
	try {
		result = await imagefs.interact<boolean>(
			disk,
			partitionNumber,
			async (fs) => {
				const statAsync = promisify(fs.stat);
				const stats = await statAsync(filePath);
				return stats.isFile();
			},
		);
	} catch {
		// Typically one of:
		// - Error: No such file or directory
		// - Error: Unsupported filesystem.
		// - ErrnoException: node_ext2fs_open ENOENT (44) args: [5261576,5268064,"r",0]
		result = false;
	}
	return result;
}
