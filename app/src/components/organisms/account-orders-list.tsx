import type {
  GridColDef,
  GridRowParams,
  GridSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid-pro";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Maybe from "easy-maybe/lib";
import Stack from "@mui/material/Stack";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useMemo, useRef, useState } from "react";

import CancelOrder from "../molecules/cancel-order-modal";
import OrderDetailsModal from "./account-order-details-modal";
import Table from "../atoms/table";
import UniversalPopover from "../molecules/universal-popover";
import useCancelOrder from "../../hooks/use-cancel-order";
import {
  columns,
  populateDetails,
  populateRow,
} from "./account-orders-list.helpers";

export interface Props {
  data: Voidable<OrderPoolRecord[]>;
  error: Voidable<Error>;
  loading: boolean;
  updating: boolean;
}

type RowData = ReturnType<typeof populateRow>;

type DetailsData = ReturnType<typeof populateDetails>;

export default (props: Props) => {
  const d = useMemo(() => Maybe.of(props.data), [props.data]);
  const err = useMemo(() => Maybe.of(props.error), [props.error]);

  const data = Maybe.withDefault([], d);
  const error = Maybe.withDefault(undefined, err);

  const cancelRef = useRef<{ close: () => void; open: () => void }>();
  const detailsRef = useRef<{ open: () => void }>();
  const [accounts, setAccounts] = useState<CancelOrderData | undefined>();
  const [details, setDetails] = useState<DetailsData>();
  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);

  const { execute, executeMany } = useCancelOrder();

  const cols = useMemo<GridColDef[]>(columns, []);

  const rows: RowData[] = useMemo(() => data.map(populateRow), [data]);

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "tokenPair", sort: "asc" },
    { field: "tif", sort: "asc" },
    { field: "orderTime", sort: "asc" },
  ]);

  const onCancelOrder = useCallback(
    async (cd: CancelOrderData) => {
      const { a, b, inactive, expired, poolAddress, supply } = cd;

      if (inactive || expired) {
        const amount = supply.toNumber();

        await execute({ a, b, poolAddress, amount });
      } else {
        setAccounts(cd);
        cancelRef.current?.open();
      }
    },
    [execute, setAccounts]
  );

  const onRowClick = useCallback(
    (params: GridRowParams<RowData>) => {
      setDetails(populateDetails(params));
      detailsRef.current?.open();
    },
    [setDetails]
  );

  const onDetailsClose = useCallback(() => {
    setDetails(undefined);
  }, []);

  const onApproveCancel = useCallback(
    async (cd: CancelOrderData) => {
      const { a, b, poolAddress, supply } = cd;
      const amount = supply.toNumber();
      await execute({ a, b, poolAddress, amount });

      cancelRef.current?.close();
    },
    [execute]
  );

  const onSelectionModelChange = useCallback(
    (nextSelectionModel: GridSelectionModel) => {
      setSelectionModel(nextSelectionModel);
    },
    [setSelectionModel]
  );

  const onCancelSelectedOrders = useCallback(async () => {
    if (!selectionModel.length) return;

    const selectedRows = rows.filter((row) => selectionModel.includes(row.id));

    const deletionRows = selectedRows.map((row) => ({
      amount: Number.MAX_SAFE_INTEGER,
      poolAddress: new PublicKey(row.id),
    }));

    await executeMany(deletionRows);

    setSelectionModel([]);
  }, [executeMany, rows, selectionModel, setSelectionModel]);

  return (
    <>
      <UniversalPopover ref={cancelRef}>
        {details && (
          <CancelOrder
            data={accounts}
            detailsData={details}
            onApprove={onApproveCancel}
          />
        )}
      </UniversalPopover>

      <UniversalPopover onClose={onDetailsClose} ref={detailsRef}>
        {details && (
          <OrderDetailsModal
            onCancel={onCancelOrder}
            order={details.order}
            poolAddress={details.poolAddress}
            side={details.side}
            supply={details.supply}
          />
        )}
      </UniversalPopover>

      <Box py={2}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={onCancelSelectedOrders}
            disabled={!selectionModel?.length}
          >
            Cancel/Withdraw Selected
          </Button>
        </Stack>
      </Box>
      <Box minWidth="680px">
        <Table
          gridProps={{
            autoHeight: true,
            checkboxSelection: true,
            columns: cols,
            error,
            loading: props.loading,
            onSelectionModelChange,
            rows,
            selectionModel,
          }}
          filterColumnField="pool"
          isUpdating={props.updating}
          onRowClick={onRowClick}
          searchBoxPlaceholderText="Search orders"
          sortModel={sortModel}
          onSortModelChange={(newSortModel: GridSortModel) =>
            setSortModel(newSortModel)
          }
        />
      </Box>
    </>
  );
};
