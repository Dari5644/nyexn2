import { HttpError } from '../utils/httpError.js';
export const validate = check => (req, _res, next) => {
  const problem = check(req);
  next(problem ? new HttpError(400, problem) : undefined);
};
