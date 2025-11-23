#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { fileURLToPath } from "url";
import { CodepointData } from './CodepointData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function XmlToMap(xmlPath: string) {
	console.log(`INFO: starting at ${new Date().toISOString()}`);

	try {
		await fs.access(xmlPath);
	} catch (err) {
		console.log(`ERROR: XML file does not exist in ${xmlPath}`);
		process.exit(1);
	}

	// Read and parse the XML file
	console.log(`INFO: reading XML file from ${xmlPath}`);
	const xmlData = await fs.readFile(xmlPath, 'utf-8');
	console.log(`INFO: parsing XML data`);
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '',
	});
	const jsonObj = parser.parse(xmlData);

	console.log(`INFO: parsed ${jsonObj.ucd.repertoire.char.length} characters`);

	if (true) {
		const allJsonPath = path.join(__dirname, "..", "tmp", "ucd.all.flat.json");
		console.log(`INFO: writing full JSON data to ${allJsonPath}`);
		await fs.writeFile(
			allJsonPath,
			JSON.stringify(jsonObj, null, 2),
			"utf-8"
		);
	}

	console.log(`INFO: generating JSON data`);
	const cpMap: { [code: string]: CodepointData } = {};

	for (const charData of jsonObj.ucd.repertoire.char) {

		if (!charData.cp || charData.cp.length === 0) {
			if (!charData['first-cp']) {	// some private use area ranges mixed in
				console.log(`WARN: skipping entry with no code point (${JSON.stringify(charData)})`);
			}
			continue;
		}

		const tags: string[] = [];
		if (charData.WSpace === 'Y') {
			tags.push('Whitespace');
		}
		if (charData.Emoji === 'Y') {
			tags.push('Emoji');
		}
		if (charData.Dep === 'Y') {
			tags.push('Deprecated');
		}
		if (charData.QMark === 'Y') {
			tags.push('Quote');
		}
		if (charData.Dash === 'Y') {
			tags.push('Dash');
		}

		switch (charData.nt) {
			case 'De':
				tags.push('Decimal');
				break;
			case 'Di':
				tags.push('Digit');
				break;
			case 'Nu':
				tags.push('Numeric');
				break;
		}

		if (charData.Upper === 'Y') {
			tags.push('Uppercase');
		}
		if (charData.Lower === 'Y') {
			tags.push('Lowercase');
		}
		if (charData.OUpper === "Y") {
			tags.push("Other_Uppercase");
		}
		if (charData.Lower === "Y") {
			tags.push("Other_Lowercase");
		}

		if (charData.Term === 'Y') {
			tags.push('Terminal_Punctuation');
		}
		if (charData.STerm === 'Y') {
			tags.push('Sentence_Terminal');
		}
		if (charData.Dia === 'Y') {
			tags.push('Diacritic');
		}
		if (charData.Ext === 'Y') {
			tags.push('Extender');
		}
		if (charData.SD === 'Y') {
			tags.push('Soft_Dotted');
		}
		if (charData.Alpha === 'Y') {
			tags.push('Alphabetic');
		}
		if (charData.OAlpha === 'Y') {
			tags.push('Other_Alphabetic');
		}
		if (charData.Math === 'Y') {
			tags.push('Math');
		}
		if (charData.OMath === 'Y') {
			tags.push('Other_Math');
		}
		if (charData.Hex === 'Y') {
			tags.push('Hexadecimal');
		}
		if (charData.AHex === 'Y') {
			tags.push('ASCII_Hexadecimal');
		}
		if (charData.RI === 'Y') {
			tags.push('Regional_Indicator');
		}
		if (charData.NChar === 'Y') {
			tags.push('Noncharacter_Code_Point');
		}
		if (charData.VS === 'Y') {
			tags.push('Variation_Selector');
		}

		var name = charData.na || charData.na1;
		if (!name && charData['name-alias']) {
			name = charData['name-alias'][0].alias;
			console.log(
				`WARN: codepoint ${charData.cp} missing name, using name-alias '${name}'`
			);
		}

		if (name.endsWith('#')) {
			name = name.slice(0, -1);
			name = name + charData.cp;
		}

		var notes: string[] = [];

		try {
			if (charData['name-alias']) {
				const nameAliasArray = Array.isArray(charData['name-alias']) ? charData['name-alias'] : [charData['name-alias']];
				for (const aliasEntry of nameAliasArray) {
					if (aliasEntry.type === "correction") {
						notes.push(`Corrected from: ${aliasEntry.alias}`);
						tags.push("Corrected");
					} else if (aliasEntry.type === "abbreviation") {
						if (name.indexOf('(') === -1) {
							name = `${name} (${aliasEntry.alias})`;
						} else if (name.indexOf(`(${aliasEntry.alias})`) === -1) {
							notes.push(`Abbreviation: ${aliasEntry.alias}`);
						}
					} else if (aliasEntry.type === "control") {
						if (aliasEntry.alias != name && name.indexOf(`${aliasEntry.alias} (`) === -1) {
							notes.push(`Control Name: ${aliasEntry.alias}`);
						}
					} else if (aliasEntry.type === "alternate") {
						notes.push(`Also known as: ${aliasEntry.alias}`);
					} else if (aliasEntry.type === "figment") {
						notes.push(`Figment Name: ${aliasEntry.alias}`);
						tags.push("Figment");
					} else {
						console.log(
							`WARN: unknown name-alias type '${aliasEntry.type}' for codepoint ${charData.cp} `
						);
					}
				}
			}
		} catch (err) {
			console.log(`ERROR: processing name-alias for codepoint ${charData.cp}: ${err}`);
			console.log(`INFO: name-alias data: ${JSON.stringify(charData['name-alias'])}`);
		}

		if (charData.JSN && charData.JSN.length > 0) {
			notes.push(`Hangul Syllable Type: ${charData.JSN}`);
		}

		const caseVariants: { [key: string]: string[] } = {};
		if (charData.suc && charData.suc.length > 0 && charData.suc !== "#") {
			caseVariants["uppercase"] = [ charData.ucp ];
		}
		if (charData.slc && charData.slc.length > 0 && charData.slc !== "#") {
			caseVariants["lowercase"] = [ charData.lcp ];
		}
		if (charData.stc && charData.stc.length > 0 && charData.stc !== "#") {
			caseVariants["titlecase"] = [ charData.tcp ];
		}
		if (charData.uc && charData.uc.length > 0 && charData.uc !== "#") {
			caseVariants["uppercase"] = charData.uc.split(" ");
		}
		if (charData.lc && charData.lc.length > 0 && charData.lc !== "#") {
			caseVariants["lowercase"] = charData.lc.split(" ");
		}
		if (charData.tc && charData.tc.length > 0 && charData.tc !== "#") {
			caseVariants["titlecase"] = charData.tc.split(" ");
		}
		var decomposition: string[] | undefined = undefined;
		if (charData.dm && charData.dm.length > 0 && charData.dm !== "#") {
			decomposition = charData.dm.split(" ");
		}

		if (charData.bpt && charData.bpt.length > 0 && charData.bpt !== 'n') {
			notes.push(`Bidi Paired Bracket Type: ${charData.bpt == 'o' ? 'Open' : 'Closed'}`);
			notes.push(`Bidi Paired Bracket: U+${charData.bpb}`);
		}

		var cpData: CodepointData = {
			name,
			title: charData.na1 || name,
			age: charData.age,
			bidi: charData.bc,
			block: charData.blk,
			caseVariants: Object.keys(caseVariants).length > 0 ? caseVariants : undefined,
			category: charData.gc,
			code: charData.cp,
			combine: charData.ccc, 
			decomposition,
			mirror: charData.bmg === '' ? undefined : charData.bmg,
			oldname: charData.na1 === '' ? undefined : charData.na1,
			script: charData.sc,
			tags,
			notes,
			comments: [],
			indexEntries: [],
			related: [],
			variants: [],
		};

		cpMap[charData.cp] = cpData;
	}

	console.log(`INFO: generated JSON map for ${Object.keys(cpMap).length} codepoints`);

	return cpMap;
}

export {
	XmlToMap
}



