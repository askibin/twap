import { TextField, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import type {
  DataGridProProps,
  GridRowIdGetter,
  GridRowParams,
  GridSortModel,
} from "@mui/x-data-grid-pro";
import { DataGridPro } from "@mui/x-data-grid-pro";
import type { ChangeEvent, MouseEvent } from "react";

import * as Styled from "./table.styled";

interface Props {
  filterColumnField: string;
  getRowId?: GridRowIdGetter;
  gridProps: DataGridProProps;
  isUpdating?: boolean;
  onRowClick?: (arg0: GridRowParams, arg1: MouseEvent<HTMLElement>) => void;
  pagination?: boolean;
  search?: boolean;
  searchBoxPlaceholderText?: string;
  sortModel: { field: string; sort: "asc" | "desc" }[];
}

export default ({
  filterColumnField,
  getRowId,
  gridProps,
  isUpdating = false,
  onRowClick,
  pagination = false,
  search = false,
  searchBoxPlaceholderText,
  sortModel,
}: Props) => {
  const [filterText, setFilterText] = useState("");

  const options = useMemo(() => ({ pagination: { pageSize: 10 } }), []);
  const pages = useMemo(() => [10, 25, 50, 100], []);

  const onFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterText(event.target.value);
    },
    [setFilterText]
  );

  const filterModel = useMemo(
    () => ({
      items: [
        {
          columnField: filterColumnField,
          operatorValue: "contains",
          value: filterText,
        },
      ],
    }),
    [filterColumnField, filterText]
  );

  const sorting: Voidable<GridSortModel> = sortModel;

  return (
    <>
      {search && (
        <Styled.Search>
          <TextField
            size="small"
            placeholder={searchBoxPlaceholderText ?? "Search"}
            onChange={onFilterChange}
            disabled
          />
        </Styled.Search>
      )}
      <Styled.Grid>
        <DataGridPro
          density="compact"
          disableColumnFilter
          disableColumnMenu
          disableColumnSelector
          disableDensitySelector
          disableSelectionOnClick
          filterModel={filterModel}
          getRowId={getRowId}
          initialState={options}
          onRowClick={onRowClick}
          pagination={pagination}
          rowsPerPageOptions={pages}
          sortModel={sorting}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...gridProps}
        />
        {isUpdating && <Typography variant="body1">Updating...</Typography>}
      </Styled.Grid>
    </>
  );
};
