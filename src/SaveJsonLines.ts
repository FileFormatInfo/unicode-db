import fs from 'fs/promises';



async function SaveJsonLines(outputPath: string, dataLines: any[]) {
	console.log(`INFO: writing JSON Lines data to ${outputPath}`);
	const fileHandle = await fs.open(outputPath, 'w');

	for (const lineData of dataLines) {
		const jsonLine = JSON.stringify(lineData);
		await fileHandle.write(`${jsonLine}\n`);
	}

	await fileHandle.close();
	console.log(`INFO: wrote JSON Lines data ${dataLines.length} to ${outputPath}`);
}

export {
	SaveJsonLines
};