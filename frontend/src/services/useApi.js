import { useCallback, useEffect, useMemo, useState } from "react";

import api, { getApiError } from "./api";

// Loads a GET endpoint. A newer request always wins over an older, slower one.
export function useApi(path, params) {
  const paramsKey = JSON.stringify(params ?? {});
  const [version, setVersion] = useState(0);
  const requestKey = `${path}|${paramsKey}|${version}`;

  const [result, setResult] = useState({ key: null, data: null, error: "" });

  useEffect(() => {
    let active = true;

    api
      .get(path, { params: JSON.parse(paramsKey) })
      .then((response) => {
        if (active) setResult({ key: requestKey, data: response.data, error: "" });
      })
      .catch((err) => {
        if (active) {
          setResult((previous) => ({
            key: requestKey,
            data: previous.data,
            error: getApiError(err),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [path, paramsKey, requestKey]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return {
    data: result.data,
    error: result.error,
    loading: result.key !== requestKey,
    reload,
  };
}

// State for a server-paginated, sorted and searched DataGrid
export function useServerTable(path) {
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });
  const [sortModel, setSortModel] = useState([{ field: "id", sort: "asc" }]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      page: paginationModel.page + 1,
      page_size: paginationModel.pageSize,
      sort_by: sortModel[0]?.field || "id",
      order: sortModel[0]?.sort || "asc",
    }),
    [search, paginationModel, sortModel]
  );

  const { data, error, loading, reload } = useApi(path, params);

  const changeSearch = (value) => {
    setSearch(value);
    setPaginationModel((previous) => ({ ...previous, page: 0 }));
  };

  return {
    rows: data?.data ?? [],
    total: data?.total ?? 0,
    error,
    loading,
    reload,
    search,
    changeSearch,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
  };
}
