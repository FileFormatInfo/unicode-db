import fs from "fs/promises";
import { CodepointData } from "./CodepointData.js";

async function ProcessNamesListTxt(
	filePath: string,
	cpMap: { [code: string]: CodepointData }
): Promise<void> {

	console.log(`INFO: processing ${filePath}`);

	var lineCount = 0;
	const fileHandle = await fs.open(filePath, "r");
	try {
		let currentCp: CodepointData | null = null;

		for await (const line of fileHandle.readLines()) {
			lineCount++;
			if (line.trim().length === 0 
				|| line.startsWith(";")
				|| line.startsWith("@")
				) {
				currentCp = null;
				continue; // skip empty lines and comments
			}
			if (!line.startsWith('\t')) {
				const fields = line.split("\t");
				currentCp = cpMap[fields[0]];
				if (!currentCp) {
					if (fields[1] == "<not a character>" || fields[1] == "<reserved>") {
						// console.log(`DEBUG: skipping non-characters for codepoint ${fields[0]}`);
						continue;
					}
					console.log(
						`WARN: codepoint ${fields[0]} (${fields[1]}) from NamesList.txt not found in cpMap`
					);
				}
				continue;
			}
			if (!currentCp) {
				continue;
			}
			const lineType = line.slice(1, 2);
			const lineData = line.slice(3).trim();
			switch(lineType) {
				case "*": 
					if (!currentCp.comments) {
						currentCp.comments = [];
					}
					currentCp.comments.push(lineData);
					break;
				case "=":
					if (!currentCp.comments) {
						currentCp.comments = [];
					}
					currentCp.comments.push(`Formal Alias: ${lineData}`);
					break;
				case 'x':
					if (!currentCp.related) {
						currentCp.related = [];
					}
					currentCp.related.push(lineData);
					break;
				case '~':
					if (!currentCp.variants) {
						currentCp.variants = [];
					}
					currentCp.variants.push(lineData);
					break;
				case '#':
					if (!currentCp.approximations) {
						currentCp.approximations = [];
					}
					currentCp.approximations.push(lineData);
					break;
				case '%':
					if (!currentCp.comments) {
						currentCp.comments = [];
					}
					currentCp.comments.push(`Corrected name: ${lineData}`);
				case ':':
					// LATER: process decompositions
					break;
				default:
					console.log(
						`WARN: unknown names-list line type '${lineType}' for codepoint ${currentCp.code}`
					);
			}

		}
	} finally {
		await fileHandle.close();
	}
	console.log(`INFO: processed ${lineCount} lines from ${filePath}`);
}

export { ProcessNamesListTxt };
