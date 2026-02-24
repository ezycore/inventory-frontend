// convert property type to preferable
const sanitize = <T>(data: T | undefined, type: 'object' | 'array' | 'string' = 'object'): T => {
	switch (type) {
		case 'string':
			return typeof data === 'string' ? data : '' as T;
		case 'array':
			return Array.isArray(data) ? data : ([] as T);
		case 'object':
			return typeof data === 'object' && !Array.isArray(data) && data !== null ? data : ({} as T);
		default:
			return data as T;
	}
};

const breakdrownData = (items: {	status: string }[], key: string = "status") => {
	const breakdown: Record<string, number> = {};
	items.forEach((item) => {
		const status = item[key] || 'unknown';
		breakdown[status] = (breakdown[status] || 0) + 1;
	});
	return breakdown;
}

export { sanitize, breakdrownData };
export * from './discount';