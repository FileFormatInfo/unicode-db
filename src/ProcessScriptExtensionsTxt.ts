import fs from "fs/promises";
import { CodepointData } from "./CodepointData.js";

async function ProcessScriptExtensionsTxt(
	filePath: string,
	cpMap: { [code: string]: CodepointData }
): Promise<void> {
	console.log(`INFO: processing ${filePath}`);

	var lineCount = 0;
	const fileHandle = await fs.open(filePath, "r");
	try {
		for await (const line of fileHandle.readLines()) {
			lineCount++;
			if (line.trim().length === 0 || line.startsWith("#")) {
				continue; // skip empty lines and comments
			}
			const fields = line.split(";");
			if (fields.length < 2) {
				console.log(
					`WARN: skipping malformed line ${lineCount}: ${line}`
				);
				continue;
			}

			const codes = fields[0].trim();
			const scripts = fields[1].split("#")[0].trim().split(" ");

			let startCode: number;
			let endCode: number;

			if (codes.indexOf("..") >= 0) {
				// range of codepoints
				const rangeParts = codes.split("..");
				startCode = parseInt(rangeParts[0], 16);
				endCode = parseInt(rangeParts[1], 16);
			} else {
				// single codepoint
				startCode = parseInt(codes, 16);
				endCode = startCode;
			}

			console.log(`DEBUG: processing codepoints ${codes} (${startCode}-${endCode}) for scripts ${scripts.join(", ")}`);

			for (let cp = startCode; cp <= endCode; cp++) {
				const codeHex = cp.toString(16).toUpperCase().padStart(4, "0");
				const cpData = cpMap[codeHex];
				if (!cpData) {
					console.log(
						`WARN: codepoint ${codeHex} from ScriptExtensions.txt not found in cpMap`
					);
					continue;
				}
				//console.log(`DEBUG: adding ${scripts} to ${codeHex}`);
				if (!cpData.scriptExtensions) {
					cpData.scriptExtensions = [];
				}
				cpData.scriptExtensions.push(...scripts);
			}
		}
	} finally {
		await fileHandle.close();
	}
	console.log(`INFO: processed ${lineCount} lines from ${filePath}`);
}

export { ProcessScriptExtensionsTxt };
