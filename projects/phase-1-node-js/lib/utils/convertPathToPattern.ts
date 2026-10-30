import { CAPTURE_GROUP_REGEX, PATH_PARAM_PATTERN } from "../constants.ts";

export const convertPathToPattern = (path: string) => {
  const pathParams: string[] = [];
  const regexPattern = path.replace(PATH_PARAM_PATTERN, (_, paramName) => {
    pathParams.push(paramName);
    return CAPTURE_GROUP_REGEX;
  });

  return {
    pathParams,
    regexPattern,
  };
};
