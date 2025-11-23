import fs from 'fs/promises';
import { CodepointData } from './CodepointData.js';



async function ProcessIndexTxt( filePath: string, cpMap: {[code: string]: CodepointData} ) : Promise<void> {
	console.log(`INFO: processing ${filePath}`);

	var lineCount = 0;
	const fileHandle = await fs.open(filePath, 'r');
	try {
		for await (const line of fileHandle.readLines()) {
			lineCount++;
			if (line.trim().length === 0 || line.startsWith('#')) {
				continue; // skip empty lines and comments
			}
			const fields = line.split('\t');
			if (fields.length < 2) {
				console.log(`WARN: skipping malformed line ${lineCount}: ${line}`);
				continue;
			}
			const indexEntry = fields[0];
			const code = fields[1];

			if (code === "BOOP" || code === "DOOD" || code === "DEAF") {
				continue; // skip weak attempt at humor
			}

			const cpData = cpMap[code];
			if (!cpData) {
				if (code.endsWith('0')) {
					// console.log(`DEBUG: codepoint ${code} from index.txt not found in cpMap, but ends with 0 so likely a range start)
				} else {
					console.log(`WARN: codepoint ${code} from index.txt not found in cpMap`);
				}
				continue;
			}

			if (!cpData.indexEntries) {
				cpData.indexEntries = [];
			}
			cpData.indexEntries.push(indexEntry);

		}
	} finally {
		await fileHandle.close();
	}
	console.log(`INFO: processed ${lineCount} lines from ${filePath}`);
}

export {
	ProcessIndexTxt
};
