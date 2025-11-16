
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from "url";

import { XmlToMap } from "./XmlToMap.js";
import { CodepointData } from "./CodepointData.js";
import { ProcessIndexTxt } from './ProcessIndexTxt.js';
import { SaveJsonLines } from './SaveJsonLines.js';
import { ProcessNamesListTxt } from './ProcessNamesListTxt.js';
import { ProcessScriptExtensionsTxt } from './ProcessScriptExtensionsTxt.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function saveMap(cpMap: {[code: string]: CodepointData}, mapPath: string) : Promise<void> {
	console.log(`INFO: writing JSON data to ${mapPath}`);
	await fs.writeFile(mapPath, JSON.stringify(cpMap, null, 2), "utf-8");
	console.log(`INFO: wrote JSON data to ${mapPath}`);
}

async function removeEmpty(cp: CodepointData) {
	if (cp.comments && cp.comments.length == 0) {
		delete cp.comments;
	}
	if (cp.indexEntries && cp.indexEntries.length == 0) {
		delete cp.indexEntries;
	}
	if (cp.notes && cp.notes.length == 0) {
		delete cp.notes;
	}
	if (cp.related && cp.related.length == 0) {
		delete cp.related;
	}
	if (cp.tags && cp.tags.length == 0) {
		delete cp.tags;
	}
	if (cp.variants && cp.variants.length == 0) {
		delete cp.variants;
	}
}

async function main() {
	const xmlPath = path.join(__dirname, "..", "tmp", "ucd.all.flat.xml");
	const mapPath = path.join(__dirname, "..", "output", "ucd-map.json");
	const jsonLinesPath = path.join(__dirname, "..", "output", "ucd-lines.json");

	var cpMap: {[code: string]: CodepointData} = {};
	try {
		await fs.access(mapPath);
		console.log(`INFO: map file exists in ${mapPath}, loading existing map`);
		cpMap = JSON.parse( await fs.readFile( mapPath, "utf-8" ) );
		console.log(`INFO: loaded existing map from ${mapPath} with ${Object.keys(cpMap).length} codepoints`);
	} catch (err) {
		console.log(`INFO: map file does not exist in ${mapPath}, regenerating from XML`);
		cpMap = await XmlToMap(xmlPath);
	}
	await saveMap( cpMap, mapPath );

	await ProcessIndexTxt( path.join(__dirname, "..", "tmp", "Index.txt"), cpMap );

	await ProcessNamesListTxt( path.join(__dirname, "..", "tmp", "NamesList.txt"), cpMap );

	await ProcessScriptExtensionsTxt( path.join(__dirname, "..", "tmp", "ScriptExtensions.txt"), cpMap );

	const cpArray = Object.values(cpMap);
	cpArray.sort( (a, b) => {
		const aCode = parseInt( a.code, 16 );
		const bCode = parseInt( b.code, 16 );
		return aCode - bCode;
	} );
	for (const cpData of cpArray) {
		await removeEmpty(cpData);
	}
	await SaveJsonLines(jsonLinesPath, cpArray);
}

main().then(() => {
	console.log(`INFO: complete at ${new Date().toISOString()}`);
});