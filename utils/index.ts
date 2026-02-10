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

export { sanitize };
export * from './discount';