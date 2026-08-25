import { queryKeys } from "../keys";
import { readingsApi, type Reading} from "../readings";
import { createCrudQueries } from "./createCrudQueries";

const readingsQueries = createCrudQueries<Reading, {}>({
  api: readingsApi,
  keys: queryKeys.readings,
});

export const {
  useList: useReadings,
} = readingsQueries;