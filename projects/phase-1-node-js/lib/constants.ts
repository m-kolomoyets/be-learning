export const DEFAULT_PORT = 3000;
export const DEFAULT_DB_PORT = 5432;

export const CONTENT_TYPE_JSON = "application/json";
export const DEFAULT_JSON_HEADERS = { "Content-Type": CONTENT_TYPE_JSON };

export const PATH_PARAM_PATTERN = /:([a-zA-Z0-9\_]+)/g;
export const CAPTURE_GROUP_REGEX = "([^/]+)";

export const PROTECTED_ROUTES = ["/protected"];

export const KILOBYTE = 1024;
export const MEGABYTE = KILOBYTE * KILOBYTE;
