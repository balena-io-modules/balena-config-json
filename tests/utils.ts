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

import * as fs from 'fs';
import * as path from 'path';
import type { BalenaSDK } from 'balena-sdk';

export async function exists(filePath: string): Promise<boolean> {
	try {
		await fs.promises.access(filePath);
		return true;
	} catch (e) {
		// image file does not exist
	}
	return false;
}

export async function downloadOS(
	sdk: BalenaSDK,
	deviceType: string,
	imgPath: string,
) {
	console.error(`[info] Downloading balenaOS to "${imgPath}"...`);
	let lastPct = 0;
	let lastPrintedPct = 0;
	const stream: NodeJS.ReadableStream = await sdk.models.os.download({
		deviceType,
	});
	const onProgress = (state) => {
		const pct = Math.round(state.percentage || 0);
		if (pct <= lastPct) {
			return;
		}
		lastPct = pct;
		process.stderr.write(`.`);
		if (pct >= 100) {
			stream.removeListener('progress', onProgress);
			process.stderr.write('100%\n');
		} else if (pct - lastPrintedPct >= 10) {
			process.stderr.write(`${pct}%`);
			lastPrintedPct = pct;
		}
	};
	const partialName = `${imgPath}.partial`;
	await new Promise<void>((resolve, reject) => {
		stream
			.on('error', reject)
			.on('end', resolve)
			.on('progress', onProgress)
			.pipe(fs.createWriteStream(partialName));
	});
	await fs.promises.rename(partialName, imgPath);
}

export async function isZipFile(filePath: string): Promise<boolean> {
	const handle = await fs.promises.open(filePath, 'r');
	try {
		const result = await handle.read(Buffer.alloc(4), 0, 4, 0);
		// zip file magic bytes 50 4B 03 04
		// https://en.wikipedia.org/wiki/List_of_file_signatures
		return Buffer.from([0x50, 0x4b, 0x03, 0x04]).equals(result.buffer);
	} finally {
		await handle.close();
	}
}

export async function extractFromZipArchive(
	zipArchivePath: string,
	extractDir: string,
	entries: string[],
) {
	const yauzl = await import('yauzl');
	// const basename = path.basename(extractToPath);
	let extractCount = 0;
	await new Promise<void>((resolve, reject) => {
		yauzl.open(zipArchivePath, { lazyEntries: true }, (error, zipfile) => {
			if (error || !zipfile) {
				return reject(
					new Error(
						`Unable to open "${zipArchivePath}" as a zip file: ${error}`,
					),
				);
			}
			const $reject = (err: Error) => {
				try {
					zipfile.close();
				} catch (e) {
					// ignore
				}
				reject(err);
			};
			zipfile.readEntry();
			zipfile
				.on('error', $reject)
				.on('entry', (entry: import('yauzl').Entry) => {
					if (entries.includes(entry.fileName)) {
						zipfile.openReadStream(entry, (err, readStream) => {
							if (err || !readStream) {
								return $reject(
									new Error(
										`Unable to extract "${entry.fileName}" from zip archive "${zipArchivePath}": ${err}`,
									),
								);
							}
							readStream.on('end', () => {
								if (++extractCount >= entries.length) {
									zipfile.close();
								} else {
									zipfile.readEntry();
								}
							});
							const extractTo = path.join(extractDir, entry.fileName);
							console.error(`[info] Extracting "${extractTo}"...`);
							readStream
								.pipe(fs.createWriteStream(extractTo))
								.on('error', $reject)
								.on('finish', resolve);
						});
					} else {
						zipfile.readEntry();
					}
				});
		});
	});
}
