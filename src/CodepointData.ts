type CodepointData = {
	age: string;
	approximations?: string[];
	bidi: string;
	block: string;
	caseVariants?: { [key: string]: string[] };
	category: string;
	code: string;
	combine: string;
	comments?: string[];
	decomposition?: string[];
	indexEntries?: string[];
	mirror?: string;
	name: string;
	notes?: string[];
	oldname?: string;
	related?: string[];
	script: string;
	scriptExtensions?: string[];
	tags?: string[];
	title: string;
	variants?: string[];
};

export {
	CodepointData
};
